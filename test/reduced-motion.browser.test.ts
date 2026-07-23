import { afterEach, describe, expect, it } from "vitest";

import "../src/styles/tokens.css";
import { createThemeController } from "../src/theme/controller";
import { defineOrcElements } from "../src/define";

defineOrcElements();

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.replaceChildren();
});

describe("reduced motion", () => {
  it("disables the theme toggle transition in a reduced-motion browser context", () => {
    expect(matchMedia("(prefers-reduced-motion: reduce)").matches).toBe(true);
    const controller = createThemeController({ document, announce: false });
    dispose = () => controller.dispose();
    const toggle = document.createElement("orc-theme-toggle");
    document.body.append(toggle);
    const button = toggle.shadowRoot?.querySelector("button");
    if (!button) throw new Error("Expected theme toggle button.");
    expect(getComputedStyle(button).transitionDuration).toBe("0s");
  });

  it("replaces the glow-field beam animation with a static gradient", () => {
    const field = document.createElement("orc-glow-field");
    document.body.append(field);
    const wrapper = field.shadowRoot?.querySelector(".field");
    if (!wrapper) throw new Error("Expected glow field wrapper.");
    expect(getComputedStyle(wrapper, "::before").animationName).toBe("none");
  });
});
