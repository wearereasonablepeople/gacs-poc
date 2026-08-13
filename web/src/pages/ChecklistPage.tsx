import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CHECKLIST_CONTROL_POINT_COUNT,
  CHECKLIST_HERO_ILLUSTRATION,
  checklistSections,
} from "@shared/checklist";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { fetchChecklist, submitChecklist } from "../api";
import type { ProviderInfo } from "../api";

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
  const progress = Math.round(
    (answeredCount / CHECKLIST_CONTROL_POINT_COUNT) * 100,
  );
  const section = sections[sectionIndex];
  const isLastSection = sectionIndex === sections.length - 1;

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
        <div className="mt-6">
          <div className="mb-2 flex justify-between text-sm text-ink/60">
            <span>
              {answeredCount} van {CHECKLIST_CONTROL_POINT_COUNT} beantwoord
            </span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-pine/10">
            <div
              className="h-full rounded-full bg-pine transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      {step === "checklist" && section && (
        <section className="flex-1">
          {section.illustration && (
            <img
              src={section.illustration}
              alt=""
              width={1000}
              height={667}
              className="mx-auto mb-2 h-auto w-full max-w-lg"
            />
          )}
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm text-ink/50">
                Sectie {sectionIndex + 1} van {sections.length}
              </p>
              <h2 className="font-display text-2xl text-ink">{section.title}</h2>
              {section.description && (
                <p className="mt-1 text-sm text-ink/65">{section.description}</p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {section.controlPoints.map((cp) => (
              <article
                key={cp.code}
                className="border-b border-pine/10 pb-6 last:border-none"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-pine/70">
                  {cp.code} · {cp.title}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-ink">{cp.prompt}</h3>
                {cp.helpText && (
                  <p className="mt-1 text-sm text-ink/55">{cp.helpText}</p>
                )}
                <div className="mt-3 space-y-2">
                  {cp.options.map((opt) => {
                    const selected = answers[cp.code] === opt.id;
                    return (
                      <label
                        key={opt.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-md border px-3 py-3 transition ${
                          selected
                            ? "border-pine bg-pine/5"
                            : "border-transparent bg-white/70 hover:border-pine/20"
                        }`}
                      >
                        <input
                          type="radio"
                          className="mt-1"
                          name={cp.code}
                          checked={selected}
                          onChange={() => selectOption(cp.code, opt.id)}
                        />
                        <span className="text-sm leading-snug text-ink">
                          {opt.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={sectionIndex === 0}
              onClick={() => setSectionIndex((i) => Math.max(0, i - 1))}
              className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-pine disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" /> Vorige
            </button>
            {!isLastSection ? (
              <button
                type="button"
                onClick={() => setSectionIndex((i) => i + 1)}
                className="inline-flex items-center gap-2 rounded-md bg-pine px-5 py-2.5 text-sm font-semibold text-sand"
              >
                Volgende <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStep("email")}
                className="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-white"
              >
                Naar verzenden
              </button>
            )}
          </div>
        </section>
      )}

      {step === "email" && (
        <section className="mx-auto w-full max-w-md flex-1">
          <img
            src={CHECKLIST_HERO_ILLUSTRATION}
            alt=""
            width={1000}
            height={667}
            className="mx-auto mb-2 h-auto w-full"
          />
          <h2 className="font-display text-3xl text-ink">Ontvang uw resultaten</h2>
          <p className="mt-2 text-ink/65">
            Vul uw e-mailadres in. We tonen de score niet op het scherm — u
            ontvangt alles per mail ({answeredCount} van{" "}
            {CHECKLIST_CONTROL_POINT_COUNT} beantwoord).
          </p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <label className="block text-sm font-semibold text-ink">
              E-mailadres
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-md border border-pine/20 bg-white px-3 py-2.5 text-base outline-none ring-pine focus:ring-2"
                placeholder="naam@bedrijf.nl"
              />
            </label>
            {error && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep("checklist")}
                className="rounded-md px-4 py-2.5 text-sm font-semibold text-pine"
              >
                Terug
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Verstuur resultaten
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
