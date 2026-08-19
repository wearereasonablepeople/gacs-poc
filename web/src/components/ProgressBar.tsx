type ProgressBarProps = {
  labelCurrent: number;
  filled: number;
  total: number;
};

export default function ProgressBar({
  labelCurrent,
  filled,
  total,
}: ProgressBarProps) {
  const progress = total > 0 ? Math.round((filled / total) * 100) : 0;

  return (
    <div>
      <div className="mb-2 flex justify-between text-base text-ink/60">
        <span>
          Vraag {labelCurrent} van {total}
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
