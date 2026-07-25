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

  it("suppresses the status-dot pulse animation", () => {
    const dot = document.createElement("orc-status-dot");
    dot.setAttribute("pulse", "");
    dot.setAttribute("label", "Build passing");
    document.body.append(dot);
    const el = dot.shadowRoot?.querySelector(".dot");
    if (!el) throw new Error("Expected status dot element.");
    expect(getComputedStyle(el).animationName).toBe("none");
  });

  it.each(["orc-textarea", "orc-input"])(
    "replaces the %s beam animation with a static gradient",
    (tag) => {
      const field = document.createElement(tag);
      document.body.append(field);
      const wrapper = field.shadowRoot?.querySelector(".field");
      if (!wrapper) throw new Error(`Expected ${tag} field wrapper.`);
      expect(getComputedStyle(wrapper, "::before").animationName).toBe("none");
    },
  );
});
