import emblemUrl from "../src/assets/orc-emblem.svg?url";

// A click's worth of celebration: orc emblems thrown out of a button, arced
// down, then dropped on the floor. ponytail: Web Animations API and a
// throwaway layer per burst — no library, no canvas, no state to reconcile.
const PIECES = 24;
const DURATION = 1100;
// Big enough that the mark still reads as an orc head in flight.
const SIZE = 28;
// Longest possible piece (DURATION × 1.25) plus a beat.
const LIFETIME = DURATION * 1.25 + 100;

/**
 * Spray orc emblems out of `origin`. Silent under `prefers-reduced-motion`
 * and wherever the Web Animations API is unavailable.
 */
export function burstConfetti(origin: Element): void {
  const doc = origin.ownerDocument;
  const view = doc.defaultView;
  if (!view) return;
  if (view.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  if (typeof origin.animate !== "function") return;

  const box = origin.getBoundingClientRect();
  const originX = box.left + box.width / 2;
  const originY = box.top + box.height / 2;

  const layer = doc.createElement("div");
  layer.className = "confetti-layer";
  layer.setAttribute("aria-hidden", "true");
  layer.style.cssText =
    "position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:9999";

  for (let index = 0; index < PIECES; index += 1) {
    const piece = doc.createElement("img");
    piece.src = emblemUrl;
    piece.alt = "";
    piece.style.cssText = `position:absolute;left:${originX}px;top:${originY}px;width:${SIZE}px;height:${SIZE}px;will-change:transform,opacity`;
    layer.append(piece);

    // Fan out sideways, pop upward, then fall past the button under a rough
    // gravity — three keyframes read as an arc without any physics.
    const drift = (Math.random() - 0.5) * 420;
    const rise = -(90 + Math.random() * 170);
    const fall = 260 + Math.random() * 220;
    const spin = (Math.random() - 0.5) * 1080;
    piece.animate(
      [
        {
          transform: "translate(-50%, -50%) rotate(0deg)",
          opacity: 1,
          // Fast out of the button, then gravity takes the second half.
          easing: "cubic-bezier(0.05, 0.7, 0.3, 1)",
        },
        {
          transform: `translate(calc(-50% + ${drift * 0.55}px), calc(-50% + ${rise}px)) rotate(${spin * 0.4}deg)`,
          opacity: 1,
          offset: 0.35,
          easing: "cubic-bezier(0.5, 0, 0.75, 1)",
        },
        {
          transform: `translate(calc(-50% + ${drift}px), calc(-50% + ${fall}px)) rotate(${spin}deg)`,
          opacity: 0,
        },
      ],
      {
        duration: DURATION * (0.75 + Math.random() * 0.5),
        easing: "linear",
        fill: "forwards",
      },
    );
  }

  doc.body.append(layer);
  // Each burst owns its own layer and sweeps itself up on a timer: a hidden
  // tab never paints the last frame, so animation.finished can hang forever.
  view.setTimeout(() => layer.remove(), LIFETIME);
}
