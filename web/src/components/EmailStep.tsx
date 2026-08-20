import { useEffect, useRef } from "react";
import {
  CHECKLIST_CONTROL_POINT_COUNT,
  CHECKLIST_HERO_ILLUSTRATION,
} from "@shared/checklist";
import type { UnansweredSection } from "@shared/scoring";
import { Loader2, ChevronLeft } from "lucide-react";
import { celebrate } from "../lib/celebrate";
import { useCompactNavLabels } from "../hooks/useCompactNavLabels";
import NavLabel from "./NavLabel";

type EmailStepProps = {
  unansweredSections: UnansweredSection[];
  email: string;
  error: string | null;
  submitting: boolean;
  onEmailChange: (email: string) => void;
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => void;
};

export default function EmailStep({
  unansweredSections,
  email,
  error,
  submitting,
  onEmailChange,
  onBack,
  onSubmit,
}: EmailStepProps) {
  useEffect(() => celebrate(), []);

  const navRef = useRef<HTMLDivElement>(null);
  const compact = useCompactNavLabels(navRef);

  const unansweredCount = unansweredSections.reduce(
    (n, section) => n + section.controlPoints.length,
    0,
  );

  return (
    <section className="flex-1">
      <h2 className="font-display text-3xl text-ink">Klaar!</h2>
      <p className="font-display text-3xl text-ink">Ontvang uw resultaten</p>
      <p className="mt-2 text-lg text-ink/65">
        Vul uw e-mailadres in. We tonen de score niet op het scherm — u ontvangt
        alles per mail.
      </p>

      <div className="mt-6 bg-white px-6">
        <img
          src={CHECKLIST_HERO_ILLUSTRATION}
          alt=""
          width={1000}
          height={667}
          className="mx-auto h-auto w-full max-w-lg"
        />
      </div>

      {unansweredCount > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer border-b border-pine/15 py-3 text-base text-ink">
            U heeft {unansweredCount} van {CHECKLIST_CONTROL_POINT_COUNT}{" "}
            vragen niet beantwoord
          </summary>
          <div className="space-y-4 py-3">
            {unansweredSections.map((section) => (
              <div key={section.sectionId}>
                <p className="text-sm font-semibold uppercase tracking-wider text-pine/70">
                  Sectie {section.sectionIndex + 1}
                </p>
                <p className="text-sm font-semibold uppercase tracking-wider text-pine/70">
                  {section.sectionTitle}
                </p>
                <ul className="mt-1 space-y-1">
                  {section.controlPoints.map((cp) => (
                    <li key={cp.code} className="text-base text-ink/80">
                      {cp.code} · {cp.title}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </details>
      )}

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="block text-base text-ink">
          <span className="font-semibold">E-mailadres</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            className="mt-1 w-full rounded-md border border-pine/20 bg-white px-3 py-2.5 text-base font-normal outline-none ring-pine focus:ring-2"
            placeholder="naam@bedrijf.nl"
          />
        </label>
        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-base text-red-700">
            {error}
          </p>
        )}
        <div
          ref={navRef}
          className="flex flex-nowrap items-center justify-between gap-3"
        >
          <button
            type="button"
            onClick={onBack}
            className="inline-flex shrink-0 items-center gap-2 rounded-md pl-0 pr-4 py-2.5 text-base font-semibold text-pine"
          >
            <ChevronLeft className="h-4 w-4 shrink-0" /> Terug
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-select px-5 py-2.5 text-base font-semibold text-white disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 shrink-0 animate-spin" />}
            <NavLabel parts={["Verstuur", "resultaten"]} compact={compact} />
          </button>
        </div>
      </form>
    </section>
  );
}
