import confetti from "canvas-confetti";

const CONFETTI_COLORS = ["#0f3d3e", "#2563eb", "#c45c26", "#7a9e9f"];
const BURST_MS = 900;

/** Subtle one-shot confetti (~900ms). Returns a cleanup that stops further bursts. */
export function celebrate(): () => void {
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  if (reducedMotion) return () => {};

  let cancelled = false;
  const end = Date.now() + BURST_MS;

  const frame = () => {
    if (cancelled) return;
    confetti({
      particleCount: 2,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.65 },
      colors: CONFETTI_COLORS,
      disableForReducedMotion: true,
      scalar: 0.85,
      ticks: 120,
      gravity: 0.9,
    });
    confetti({
      particleCount: 2,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.65 },
      colors: CONFETTI_COLORS,
      disableForReducedMotion: true,
      scalar: 0.85,
      ticks: 120,
      gravity: 0.9,
    });
    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  requestAnimationFrame(frame);
  return () => {
    cancelled = true;
  };
}
