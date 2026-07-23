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
    expect(customElements.get("orc-glow-field")).toBeDefined();
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

    const controller = createThemeController({ document, announce: false });
    expect(firstButton.disabled).toBe(false);
    expect(secondButton.textContent).toContain("System");

    firstButton.click();
    expect(controller.mode).toBe("light");
    expect(firstButton.textContent).toContain("Light");
    expect(secondButton.textContent).toContain("Light");

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

describe("orc-glow-field", () => {
  it("exposes a labelled native textarea with a value round-trip", () => {
    const field = document.createElement("orc-glow-field");
    field.setAttribute("placeholder", "Describe the task");
    field.setAttribute("label", "Task prompt");
    document.body.append(field);

    const textarea = field.shadowRoot!.querySelector("textarea")!;
    expect(textarea.placeholder).toBe("Describe the task");
    expect(textarea.getAttribute("aria-label")).toBe("Task prompt");

    field.value = "hello";
    expect(textarea.value).toBe("hello");
    textarea.value = "edited";
    expect(field.value).toBe("edited");
  });

  it("reflects disabled and reveals the footer only when slotted", async () => {
    const field = document.createElement("orc-glow-field");
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
