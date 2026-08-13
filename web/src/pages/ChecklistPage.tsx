import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { checklistSections } from "@shared/checklist";
import { fetchChecklist, submitChecklist } from "../api";
import type { ProviderInfo } from "../api";
import EmailStep from "../components/EmailStep";
import ProgressBar from "../components/ProgressBar";
import SectionStep from "../components/SectionStep";

const defaultProvider: ProviderInfo = {
  name: "onze specialisten",
  url: null,
  email: null,
  phone: null,
};

export default function ChecklistPage() {
  const navigate = useNavigate();
  const sections = checklistSections;
  const [sectionIndex, setSectionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"checklist" | "email">("checklist");
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
      <header className="mb-8">
        <p className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-pine">
          GACS Checker
        </p>
        <h1 className="mt-2 font-display text-4xl font-medium tracking-tight text-ink sm:text-5xl">
          Checklist technische eisen
        </h1>
        <p className="mt-3 max-w-2xl text-base text-ink/70">
          Beantwoord de control points die van toepassing zijn. U mag punten
          openlaten. Na afloop ontvangt u de resultaten per e-mail.
        </p>
        <ProgressBar answeredCount={answeredCount} />
      </header>

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
          answeredCount={answeredCount}
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
