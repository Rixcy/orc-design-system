// @vitest-environment happy-dom

import { afterEach, beforeAll, describe, expect, it } from "vitest";

import { OrcLogomark } from "../src/components/orc-logomark";

beforeAll(() => {
  if (!customElements.get("orc-logomark")) {
    customElements.define("orc-logomark", OrcLogomark);
  }
});

afterEach(() => {
  document.body.replaceChildren();
});

function mount(attrs: Record<string, string> = {}): HTMLElement {
  const mark = document.createElement("orc-logomark");
  for (const [name, value] of Object.entries(attrs)) {
    mark.setAttribute(name, value);
  }
  document.body.append(mark);
  return mark;
}

describe("orc-logomark", () => {
  it("renders the /orc wordmark with no product by default", () => {
    const mark = mount();
    const word = mark.shadowRoot?.querySelector(".word");
    expect(word?.textContent?.trim()).toBe("/orc");
    expect(mark.shadowRoot?.querySelector(".slash")?.textContent).toBe("/");
    expect(mark.shadowRoot?.querySelector(".product")?.textContent).toBe("");
  });

  it("renders the product word beside the wordmark", () => {
    const mark = mount({ product: "design-system" });
    const word = mark.shadowRoot?.querySelector(".word");
    expect(word?.textContent?.trim()).toBe("/orc design-system");
  });

  it("updates when the product attribute changes", () => {
    const mark = mount({ product: "design-system" });
    mark.setAttribute("product", "ui");
    expect(mark.shadowRoot?.querySelector(".product")?.textContent).toBe("ui");
    mark.removeAttribute("product");
    expect(mark.shadowRoot?.querySelector(".product")?.textContent).toBe("");
  });

  it("keeps a valid size and falls back to md for an unknown one", () => {
    expect(mount({ size: "lg" }).getAttribute("size")).toBe("lg");
    expect(mount({ size: "xl" }).getAttribute("size")).toBe("md");
  });

  it("hides the emblem from assistive technology", () => {
    const svg = mount().shadowRoot?.querySelector("svg");
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
    expect(svg?.getAttribute("focusable")).toBe("false");
  });
});
