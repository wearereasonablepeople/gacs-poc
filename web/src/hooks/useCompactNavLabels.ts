import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";

const EXPAND_HYSTERESIS_PX = 48;

/**
 * Detects when a nowrap flex nav row overflows, and prefers compact
 * (stacked) multi-word labels until the row is clearly wide enough again.
 */
export function useCompactNavLabels(
  rowRef: RefObject<HTMLElement | null>,
): boolean {
  const [compact, setCompact] = useState(false);
  const compactRef = useRef(false);
  const wrapWidthRef = useRef<number | null>(null);

  const measure = useCallback(() => {
    const row = rowRef.current;
    if (!row) return;

    const width = row.clientWidth;
    const needsCompact = row.scrollWidth > row.clientWidth + 1;

    if (needsCompact) {
      wrapWidthRef.current = width;
      if (!compactRef.current) {
        compactRef.current = true;
        setCompact(true);
      }
      return;
    }

    const wrapWidth = wrapWidthRef.current;
    if (
      compactRef.current &&
      wrapWidth !== null &&
      width < wrapWidth + EXPAND_HYSTERESIS_PX
    ) {
      return;
    }

    wrapWidthRef.current = null;
    if (compactRef.current) {
      compactRef.current = false;
      setCompact(false);
    }
  }, [rowRef]);

  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row) return;

    measure();
    const observer = new ResizeObserver(() => measure());
    observer.observe(row);
    return () => observer.disconnect();
  }, [rowRef, measure, compact]);

  return compact;
}
