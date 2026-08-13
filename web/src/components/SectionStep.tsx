import type { ChecklistSection } from "@shared/checklist";
import { ChevronLeft, ChevronRight } from "lucide-react";

type SectionStepProps = {
  section: ChecklistSection;
  sectionIndex: number;
  sectionCount: number;
  answers: Record<string, string>;
  onSelectOption: (code: string, optionId: string) => void;
  onPrevious: () => void;
  onNext: () => void;
  onGoToEmail: () => void;
};

export default function SectionStep({
  section,
  sectionIndex,
  sectionCount,
  answers,
  onSelectOption,
  onPrevious,
  onNext,
  onGoToEmail,
}: SectionStepProps) {
  const isLastSection = sectionIndex === sectionCount - 1;

  return (
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
            Sectie {sectionIndex + 1} van {sectionCount}
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
                        ? "border-select bg-select-soft"
                        : "border-transparent bg-white/70 hover:border-pine/20"
                    }`}
                  >
                    <input
                      type="radio"
                      className="mt-1 accent-select"
                      name={cp.code}
                      checked={selected}
                      onChange={() => onSelectOption(cp.code, opt.id)}
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
          onClick={onPrevious}
          className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-pine disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" /> Vorige
        </button>
        {!isLastSection ? (
          <button
            type="button"
            onClick={onNext}
            className="inline-flex items-center gap-2 rounded-md bg-select px-5 py-2.5 text-sm font-semibold text-white"
          >
            Volgende <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onGoToEmail}
            className="inline-flex items-center gap-2 rounded-md bg-select px-5 py-2.5 text-sm font-semibold text-white"
          >
            Afronden
          </button>
        )}
      </div>
    </section>
  );
}
