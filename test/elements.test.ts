// @vitest-environment happy-dom

import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createThemeController } from "../src/theme/controller";
import { defineOrcElements } from "../src/define";

let storage: Storage;

beforeEach(() => {
  storage = createMemoryStorage();
  Object.defineProperty(document.defaultView!, "localStorage", {
    configurable: true,
    value: storage,
  });
});

beforeAll(() => defineOrcElements());

afterEach(() => {
  document.body.replaceChildren();
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.style.removeProperty("color-scheme");
  storage.clear();
});

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => void values.delete(key),
    setItem: (key, value) => void values.set(key, String(value)),
  };
}

describe("defineOrcElements", () => {
  it("is idempotent", () => {
    expect(() => defineOrcElements()).not.toThrow();
    expect(() => defineOrcElements()).not.toThrow();
    expect(customElements.get("orc-input")).toBeDefined();
    expect(customElements.get("orc-navbar")).toBeDefined();
    expect(customElements.get("orc-theme-toggle")).toBeDefined();
  });
});

describe("orc-navbar", () => {
  it("uses a native navigation landmark and configurable fallback home link", () => {
    const navbar = document.createElement("orc-navbar");
    navbar.setAttribute("brand-label", "A very long Orc workspace name that can wrap safely");
    navbar.setAttribute("home-label", "Return to workspace home");
    navbar.setAttribute("home-href", "/workspace");
    document.body.append(navbar);

    const root = navbar.shadowRoot!;
    expect(root.querySelector("nav")?.getAttribute("aria-label")).toBe("Primary");
    expect(root.querySelector("a")?.getAttribute("href")).toBe("/workspace");
    expect(root.querySelector("a")?.getAttribute("aria-label")).toBe(
      "Return to workspace home",
    );
    expect(root.querySelector("#brand-text")?.textContent).toContain("A very long Orc workspace");
  });

  it("exposes brand, nav, and actions slots", () => {
    const navbar = document.createElement("orc-navbar");
    document.body.append(navbar);

    expect(
      [...navbar.shadowRoot!.querySelectorAll("slot")].map((slot) => slot.name),
    ).toEqual(["brand", "nav", "actions"]);
  });
});

describe("orc-theme-toggle", () => {
  it("is disabled without a controller, synchronizes instances, and disables after disposal", () => {
    const first = document.createElement("orc-theme-toggle");
    const second = document.createElement("orc-theme-toggle");
    document.body.append(first, second);

    const firstButton = first.shadowRoot!.querySelector("button")!;
    const secondButton = second.shadowRoot!.querySelector("button")!;
    expect(firstButton.disabled).toBe(true);
    expect(secondButton.disabled).toBe(true);

    // Rendered, not merely unmarked: `hidden` alone does not hide an SVG.
    const visibleIcon = (button: HTMLButtonElement): string | undefined => {
      const rendered = [...button.querySelectorAll<SVGElement>("svg[data-mode]")].filter(
        (icon) => window.getComputedStyle(icon).display !== "none",
      );
      expect(rendered).toHaveLength(1);
      return rendered[0]?.dataset.mode;
    };

    const controller = createThemeController({ document, announce: false });
    expect(firstButton.disabled).toBe(false);
    expect(visibleIcon(secondButton)).toBe("system");
    expect(secondButton.getAttribute("aria-label")).toContain("Theme: system");

    firstButton.click();
    expect(controller.mode).toBe("light");
    expect(visibleIcon(firstButton)).toBe("light");
    expect(visibleIcon(secondButton)).toBe("light");
    expect(secondButton.getAttribute("aria-label")).toContain("Theme: light");

    controller.dispose();
    expect(firstButton.disabled).toBe(true);
    expect(secondButton.disabled).toBe(true);
  });

  it("uses a named native button and respects its disabled attribute", () => {
    const controller = createThemeController({ document, announce: false });
    const toggle = document.createElement("orc-theme-toggle");
    toggle.setAttribute("label", "Color theme");
    toggle.setAttribute("disabled", "");
    document.body.append(toggle);

    const button = toggle.shadowRoot!.querySelector("button")!;
    expect(button.type).toBe("button");
    expect(button.disabled).toBe(true);
    expect(button.getAttribute("aria-label")).toMatch(/^Color theme:/);

    controller.dispose();
  });
});

describe("orc-textarea as composer", () => {
  it("names the textarea from aria-label and hides the empty visible label", () => {
    const field = document.createElement("orc-textarea");
    field.setAttribute("placeholder", "Describe the task");
    field.setAttribute("aria-label", "Task prompt");
    document.body.append(field);

    const textarea = field.shadowRoot!.querySelector("textarea")!;
    expect(textarea.placeholder).toBe("Describe the task");
    expect(textarea.getAttribute("aria-label")).toBe("Task prompt");
    expect(field.shadowRoot!.querySelector("label")!.hidden).toBe(true);

    field.value = "hello";
    expect(textarea.value).toBe("hello");
    textarea.value = "edited";
    expect(field.value).toBe("edited");
  });

  it("prefers the visible label over aria-label so there is one accessible name", () => {
    const field = document.createElement("orc-textarea");
    field.setAttribute("label", "Feedback");
    field.setAttribute("aria-label", "Task prompt");
    document.body.append(field);

    const textarea = field.shadowRoot!.querySelector("textarea")!;
    expect(field.shadowRoot!.querySelector("label")!.hidden).toBe(false);
    expect(textarea.hasAttribute("aria-label")).toBe(false);
  });

  it("reflects disabled and reveals the footer only when slotted", async () => {
    const field = document.createElement("orc-textarea");
    field.setAttribute("disabled", "");
    document.body.append(field);

    const textarea = field.shadowRoot!.querySelector("textarea")!;
    expect(textarea.disabled).toBe(true);
    field.removeAttribute("disabled");
    expect(textarea.disabled).toBe(false);

    const footer = field.shadowRoot!.querySelector("footer")!;
    expect(footer.hidden).toBe(true);
    const hint = document.createElement("span");
    hint.slot = "footer";
    hint.textContent = "Shift+Enter for a new line";
    field.append(hint);
    await Promise.resolve();
    expect(footer.hidden).toBe(false);
  });
});

describe("field focus contract", () => {
  // Focus is border-only: the border greens and the beam underlay lights, with
  // no outline in any path — the resting look of orc's composer.
  for (const [tag, control] of [
    ["orc-textarea", "textarea"],
    ["orc-input", "input"],
  ] as const) {
    it(`${tag} greens the border on focus with no outline anywhere`, () => {
      const field = document.createElement(tag);
      document.body.append(field);
      const css = field.shadowRoot!.querySelector("style")!.textContent ?? "";

      const start = css.indexOf(`.field:has(${control}:focus)`);
      expect(start).toBeGreaterThan(-1);
      const focusRule = css.slice(start, css.indexOf("}", start) + 1);
      expect(focusRule).toContain("--orc-green");
      expect(focusRule).toContain("--orc-beam-underlay");
      expect(focusRule).not.toContain("outline");

      // Regression guard for the whole point of this change: no rule anywhere
      // in the field's chrome may draw a focus ring.
      expect(css).not.toContain("--orc-focus-ring");
      expect(css).not.toContain("focus-visible {\n      outline: var");
      expect(css).not.toContain("suppress-focus-ring");
    });

    it(`${tag} keeps a forced-colors focus cue`, () => {
      // --orc-green is a custom token forced-colors discards, so the system
      // Highlight has to carry the cue there.
      const field = document.createElement(tag);
      document.body.append(field);
      const css = field.shadowRoot!.querySelector("style")!.textContent ?? "";

      const forced = css.slice(css.indexOf("@media (forced-colors: active)"));
      const start = forced.indexOf(`.field:has(${control}:focus)`);
      expect(start).toBeGreaterThan(-1);
      expect(forced.slice(start, forced.indexOf("}", start) + 1)).toContain(
        "Highlight",
      );
    });
  }
});

describe("orc-input", () => {
  it("wires the visible label to the input and round-trips the value", () => {
    const field = document.createElement("orc-input");
    field.setAttribute("label", "Run name");
    field.setAttribute("placeholder", "add-token-export");
    document.body.append(field);

    const input = field.shadowRoot!.querySelector("input")!;
    const label = field.shadowRoot!.querySelector("label")!;
    expect(label.textContent).toBe("Run name");
    expect(label.getAttribute("for")).toBe(input.id);
    expect(input.placeholder).toBe("add-token-export");

    field.value = "hello";
    expect(input.value).toBe("hello");
    input.value = "edited";
    expect(field.value).toBe("edited");
  });

  it("falls back to text for types this field does not style", () => {
    const field = document.createElement("orc-input");
    document.body.append(field);
    const input = field.shadowRoot!.querySelector("input")!;

    expect(input.type).toBe("text");
    field.setAttribute("type", "email");
    expect(input.type).toBe("email");
    field.setAttribute("type", "checkbox");
    expect(input.type).toBe("text");
  });
});
