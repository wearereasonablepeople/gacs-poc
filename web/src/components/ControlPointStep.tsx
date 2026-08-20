import type { ControlPoint } from "@shared/checklist";
import { ChevronLeft } from "lucide-react";
import ProgressBar from "./ProgressBar";

type ControlPointStepProps = {
  controlPoint: ControlPoint;
  sectionIndex: number;
  sectionCount: number;
  sectionTitle: string;
  controlPointIndex: number;
  sectionControlPointCount: number;
  selectedOptionId: string | undefined;
  onSelectOption: (optionId: string) => void;
  onPrevious: () => void;
  onSkip: () => void;
};

export default function ControlPointStep({
  controlPoint,
  sectionIndex,
  sectionCount,
  sectionTitle,
  controlPointIndex,
  sectionControlPointCount,
  selectedOptionId,
  onSelectOption,
  onPrevious,
  onSkip,
}: ControlPointStepProps) {
  const filled = selectedOptionId
    ? controlPointIndex + 1
    : controlPointIndex;

  return (
    <section className="flex-1">
      <div className="mb-6">
        <p className="text-base text-ink/50">
          Sectie {sectionIndex + 1} van {sectionCount}
        </p>
        <h2 className="font-display text-3xl text-ink">{sectionTitle}</h2>
        <div className="mt-4">
          <ProgressBar
            labelCurrent={controlPointIndex + 1}
            filled={filled}
            total={sectionControlPointCount}
          />
        </div>
      </div>

      <article>
        <h3 className="text-xl font-semibold text-ink">
          {controlPoint.prompt}
        </h3>
        {controlPoint.helpText && (
          <p className="mt-1 text-base text-ink/55">{controlPoint.helpText}</p>
        )}
        <div className="mt-3 space-y-2">
          {controlPoint.options.map((opt) => {
            const selected = selectedOptionId === opt.id;
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
                  name={controlPoint.code}
                  checked={selected}
                  onClick={() => onSelectOption(opt.id)}
                  onChange={() => {}}
                />
                <span className="text-base leading-snug text-ink">
                  {opt.label}
                </span>
              </label>
            );
          })}
        </div>
      </article>

      <div className="mt-8 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onPrevious}
          className="inline-flex items-center gap-2 rounded-md pl-0 pr-4 py-2 text-base font-semibold text-pine"
        >
          <ChevronLeft className="h-4 w-4" /> Vorige
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-base font-semibold text-pine"
        >
          Overslaan
        </button>
      </div>
    </section>
  );
}
