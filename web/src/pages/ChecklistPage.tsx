import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { checklistSections } from "@shared/checklist";
import { getUnansweredSections } from "@shared/scoring";
import { fetchChecklist, submitChecklist } from "../api";
import type { ProviderInfo } from "../api";
import ChecklistIntro from "../components/ChecklistIntro";
import ControlPointStep from "../components/ControlPointStep";
import EmailStep from "../components/EmailStep";
import SectionIntroStep from "../components/SectionIntroStep";
import WelcomeStep from "../components/WelcomeStep";

const defaultProvider: ProviderInfo = {
  name: "onze specialisten",
  url: null,
  email: null,
  phone: null,
};

const ADVANCE_DELAY_MS = 350;

type Step =
  | { type: "welcome" }
  | { type: "section-intro"; sectionIndex: number }
  | { type: "control-point"; sectionIndex: number; controlPointIndex: number }
  | { type: "email" };

export default function ChecklistPage() {
  const navigate = useNavigate();
  const sections = checklistSections;
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<Step>({ type: "welcome" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<ProviderInfo>(defaultProvider);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchChecklist()
      .then((data) => setProvider(data.provider))
      .catch(() => {
        /* offline/dev without API: keep defaults */
      });
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step]);

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    };
  }, []);

  const unansweredSections = useMemo(
    () => getUnansweredSections(answers, sections),
    [answers, sections],
  );

  function clearAdvanceTimer() {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
  }

  function advanceFromControlPoint(
    sectionIndex: number,
    controlPointIndex: number,
  ) {
    const section = sections[sectionIndex];
    if (!section) return;

    if (controlPointIndex < section.controlPoints.length - 1) {
      setStep({
        type: "control-point",
        sectionIndex,
        controlPointIndex: controlPointIndex + 1,
      });
      return;
    }

    if (sectionIndex < sections.length - 1) {
      setStep({ type: "section-intro", sectionIndex: sectionIndex + 1 });
      return;
    }

    setStep({ type: "email" });
  }

  function skipSection(sectionIndex: number) {
    clearAdvanceTimer();
    if (sectionIndex < sections.length - 1) {
      setStep({ type: "section-intro", sectionIndex: sectionIndex + 1 });
      return;
    }
    setStep({ type: "email" });
  }

  function goToPreviousControlPoint(
    sectionIndex: number,
    controlPointIndex: number,
  ) {
    clearAdvanceTimer();
    if (controlPointIndex > 0) {
      setStep({
        type: "control-point",
        sectionIndex,
        controlPointIndex: controlPointIndex - 1,
      });
      return;
    }
    setStep({ type: "section-intro", sectionIndex });
  }

  function selectOption(
    code: string,
    optionId: string,
    sectionIndex: number,
    controlPointIndex: number,
  ) {
    setAnswers((prev) => ({ ...prev, [code]: optionId }));
    clearAdvanceTimer();
    advanceTimerRef.current = setTimeout(() => {
      advanceTimerRef.current = null;
      advanceFromControlPoint(sectionIndex, controlPointIndex);
    }, ADVANCE_DELAY_MS);
  }

  function goBackFromEmail() {
    const lastSectionIndex = sections.length - 1;
    const lastSection = sections[lastSectionIndex];
    if (!lastSection || lastSection.controlPoints.length === 0) {
      setStep({ type: "section-intro", sectionIndex: lastSectionIndex });
      return;
    }
    setStep({
      type: "control-point",
      sectionIndex: lastSectionIndex,
      controlPointIndex: lastSection.controlPoints.length - 1,
    });
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

  const showChrome = step.type !== "welcome";
  const activeSection =
    step.type === "section-intro" || step.type === "control-point"
      ? sections[step.sectionIndex]
      : undefined;
  const activeControlPoint =
    step.type === "control-point"
      ? activeSection?.controlPoints[step.controlPointIndex]
      : undefined;

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-8 sm:px-6">
      {step.type === "welcome" && (
        <WelcomeStep
          onStart={() => setStep({ type: "section-intro", sectionIndex: 0 })}
        />
      )}

      {showChrome && <ChecklistIntro />}

      {step.type === "section-intro" && activeSection && (
        <SectionIntroStep
          section={activeSection}
          sectionIndex={step.sectionIndex}
          sectionCount={sections.length}
          onPreviousSection={() =>
            setStep({
              type: "section-intro",
              sectionIndex: Math.max(0, step.sectionIndex - 1),
            })
          }
          onSkipSection={() => skipSection(step.sectionIndex)}
          onStart={() =>
            setStep({
              type: "control-point",
              sectionIndex: step.sectionIndex,
              controlPointIndex: 0,
            })
          }
        />
      )}

      {step.type === "control-point" &&
        activeSection &&
        activeControlPoint && (
          <ControlPointStep
            controlPoint={activeControlPoint}
            sectionIndex={step.sectionIndex}
            sectionCount={sections.length}
            sectionTitle={activeSection.title}
            controlPointIndex={step.controlPointIndex}
            sectionControlPointCount={activeSection.controlPoints.length}
            selectedOptionId={answers[activeControlPoint.code]}
            onSelectOption={(optionId) =>
              selectOption(
                activeControlPoint.code,
                optionId,
                step.sectionIndex,
                step.controlPointIndex,
              )
            }
            onPrevious={() =>
              goToPreviousControlPoint(
                step.sectionIndex,
                step.controlPointIndex,
              )
            }
            onSkip={() => {
              clearAdvanceTimer();
              advanceFromControlPoint(
                step.sectionIndex,
                step.controlPointIndex,
              );
            }}
          />
        )}

      {step.type === "email" && (
        <EmailStep
          unansweredSections={unansweredSections}
          email={email}
          error={error}
          submitting={submitting}
          onEmailChange={setEmail}
          onBack={goBackFromEmail}
          onSubmit={onSubmit}
        />
      )}
    </div>
  );
}
