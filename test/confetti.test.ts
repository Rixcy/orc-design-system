// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { burstConfetti } from "../site/confetti";

// happy-dom ships no Web Animations API, so the burst is exercised against a
// stub that records each call.
let animate: ReturnType<typeof vi.fn>;
let button: HTMLElement;

function stubReducedMotion(reduce: boolean): void {
  vi.spyOn(window, "matchMedia").mockReturnValue({
    matches: reduce,
  } as MediaQueryList);
}

beforeEach(() => {
  vi.useFakeTimers();
  animate = vi.fn();
  Object.defineProperty(Element.prototype, "animate", {
    configurable: true,
    writable: true,
    value: animate,
  });
  button = document.createElement("button");
  document.body.append(button);
});

afterEach(() => {
  document.body.replaceChildren();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("burstConfetti", () => {
  it("adds an inert layer of emblems and removes it once they land", () => {
    stubReducedMotion(false);

    burstConfetti(button);

    const layer = document.querySelector<HTMLElement>(".confetti-layer");
    expect(layer).not.toBeNull();
    expect(layer!.getAttribute("aria-hidden")).toBe("true");
    expect(layer!.style.pointerEvents).toBe("none");
    const pieces = layer!.querySelectorAll("img");
    expect(pieces.length).toBeGreaterThan(0);
    // Decorative: every piece must stay out of the accessibility tree.
    for (const piece of pieces) expect(piece.alt).toBe("");
    expect(animate).toHaveBeenCalledTimes(pieces.length);

    vi.advanceTimersByTime(5000);
    expect(document.querySelector(".confetti-layer")).toBeNull();
  });

  it("does nothing under prefers-reduced-motion", () => {
    stubReducedMotion(true);

    burstConfetti(button);

    expect(document.querySelector(".confetti-layer")).toBeNull();
    expect(animate).not.toHaveBeenCalled();
  });
});
