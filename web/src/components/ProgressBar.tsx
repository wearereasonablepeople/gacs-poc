import { CHECKLIST_CONTROL_POINT_COUNT } from "@shared/checklist";

type ProgressBarProps = {
  answeredCount: number;
};

export default function ProgressBar({ answeredCount }: ProgressBarProps) {
  const progress = Math.round(
    (answeredCount / CHECKLIST_CONTROL_POINT_COUNT) * 100,
  );

  return (
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
  );
}
