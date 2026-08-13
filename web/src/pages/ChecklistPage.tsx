import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { checklistSections } from "@shared/checklist";
import { getUnansweredSections } from "@shared/scoring";
import { fetchChecklist, submitChecklist } from "../api";
import type { ProviderInfo } from "../api";
import EmailStep from "../components/EmailStep";
import ProgressBar from "../components/ProgressBar";
import SectionStep from "../components/SectionStep";
import WelcomeStep from "../components/WelcomeStep";

const defaultProvider: ProviderInfo = {
  name: "onze specialisten",
  url: null,
  email: null,
  phone: null,
};

type Step = "welcome" | "checklist" | "email";

export default function ChecklistPage() {
  const navigate = useNavigate();
  const sections = checklistSections;
  const [sectionIndex, setSectionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<Step>("welcome");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<ProviderInfo>(defaultProvider);

  useEffect(() => {
    fetchChecklist()
      .then((data) => setProvider(data.provider))
      .catch(() => {
        /* offline/dev without API: keep defaults */
      });
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [sectionIndex, step]);

  const answeredCount = useMemo(
    () => Object.keys(answers).length,
    [answers],
  );
  const unansweredSections = useMemo(
    () => getUnansweredSections(answers, sections),
    [answers, sections],
  );
  const section = sections[sectionIndex];

  function selectOption(code: string, optionId: string) {
    setAnswers((prev) => ({ ...prev, [code]: optionId }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await submitChecklist({ email, answers });
      navigate("/bedankt", { state: { provider } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Versturen mislukt");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-8 sm:px-6">
      {step === "welcome" && (
        <WelcomeStep onStart={() => setStep("checklist")} />
      )}

      {step !== "welcome" && (
        <header className="sticky top-0 z-10 -mx-4 mb-8 border-b border-pine/10 bg-mist px-4 py-4 sm:-mx-6 sm:px-6">
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-pine">
            GACS Checker
          </p>
          <div className="mt-3">
            <ProgressBar answeredCount={answeredCount} />
          </div>
        </header>
      )}

      {step === "checklist" && section && (
        <SectionStep
          section={section}
          sectionIndex={sectionIndex}
          sectionCount={sections.length}
          answers={answers}
          onSelectOption={selectOption}
          onPrevious={() => setSectionIndex((i) => Math.max(0, i - 1))}
          onNext={() => setSectionIndex((i) => i + 1)}
          onGoToEmail={() => setStep("email")}
        />
      )}

      {step === "email" && (
        <EmailStep
          unansweredSections={unansweredSections}
          email={email}
          error={error}
          submitting={submitting}
          onEmailChange={setEmail}
          onBack={() => setStep("checklist")}
          onSubmit={onSubmit}
        />
      )}
    </div>
  );
}
