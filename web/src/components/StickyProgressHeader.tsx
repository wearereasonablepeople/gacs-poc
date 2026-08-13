import { useEffect, useRef, useState } from "react";
import ProgressBar from "./ProgressBar";

type StickyProgressHeaderProps = {
  answeredCount: number;
};

export default function StickyProgressHeader({
  answeredCount,
}: StickyProgressHeaderProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(([entry]) =>
      setStuck(!entry.isIntersecting),
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinelRef} aria-hidden="true" className="h-px" />
      <header
        className={`sticky top-0 z-10 mb-8 border-b py-4 transition-colors ${
          stuck
            ? "left-1/2 w-screen -translate-x-1/2 border-pine/10 bg-mist px-4 sm:px-6"
            : "border-transparent bg-transparent -mx-4 px-4 sm:-mx-6 sm:px-6"
        }`}
      >
        <div className={stuck ? "mx-auto max-w-3xl" : undefined}>
          <ProgressBar answeredCount={answeredCount} />
        </div>
      </header>
    </>
  );
}
