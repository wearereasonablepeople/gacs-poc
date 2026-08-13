import {
  CHECKLIST_CONTROL_POINT_COUNT,
  CHECKLIST_HERO_ILLUSTRATION,
} from "@shared/checklist";
import { Loader2 } from "lucide-react";

type EmailStepProps = {
  answeredCount: number;
  email: string;
  error: string | null;
  submitting: boolean;
  onEmailChange: (email: string) => void;
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => void;
};

export default function EmailStep({
  answeredCount,
  email,
  error,
  submitting,
  onEmailChange,
  onBack,
  onSubmit,
}: EmailStepProps) {
  return (
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
            onChange={(e) => onEmailChange(e.target.value)}
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
            onClick={onBack}
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
  );
}
