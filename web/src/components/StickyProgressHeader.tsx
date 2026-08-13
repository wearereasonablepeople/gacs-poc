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
        className={`sticky top-0 z-10 -mx-4 mb-8 border-b px-4 py-4 transition-colors sm:-mx-6 sm:px-6 ${
          stuck ? "border-pine/10 bg-mist" : "border-transparent bg-transparent"
        }`}
      >
        <ProgressBar answeredCount={answeredCount} />
      </header>
    </>
  );
}
