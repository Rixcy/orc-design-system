// @vitest-environment happy-dom

import { afterEach, beforeAll, describe, expect, it } from "vitest";

import { OrcCallout } from "../src/components/orc-callout";
import { OrcChip } from "../src/components/orc-chip";

beforeAll(() => {
  if (!customElements.get("orc-callout")) {
    customElements.define("orc-callout", OrcCallout);
  }
  if (!customElements.get("orc-chip")) {
    customElements.define("orc-chip", OrcChip);
  }
});

afterEach(() => {
  document.body.replaceChildren();
});

describe("orc-callout", () => {
  it("defaults to and reflects the neutral variant", () => {
    const callout = document.createElement("orc-callout");
    document.body.append(callout);
    expect(callout.getAttribute("variant")).toBe("neutral");

    callout.setAttribute("variant", "green");
    expect(callout.getAttribute("variant")).toBe("green");
  });

  it("falls back to neutral for an unknown variant", () => {
    const callout = document.createElement("orc-callout");
    callout.setAttribute("variant", "not-a-real-variant");
    document.body.append(callout);
    expect(callout.getAttribute("variant")).toBe("neutral");
  });

  it("attaches an open shadow root with the callout wrapper", () => {
    const callout = document.createElement("orc-callout");
    document.body.append(callout);
    expect(callout.shadowRoot).not.toBeNull();
    expect(callout.shadowRoot?.querySelector("div.callout")).not.toBeNull();
  });

  it("is a block-level wrapper with padding and radius bigger than the chip's", () => {
    const callout = document.createElement("orc-callout");
    document.body.append(callout);
    const chip = document.createElement("orc-chip");
    document.body.append(chip);

    const calloutCss = callout.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(calloutCss).toContain(":host {\n      display: block;");

    const calloutBlock = calloutCss.slice(
      calloutCss.indexOf(".callout {"),
      calloutCss.indexOf("}", calloutCss.indexOf(".callout {")),
    );
    expect(calloutBlock).toContain(
      "padding: var(--orc-space-4, 16px) var(--orc-space-5, 24px)",
    );
    expect(calloutBlock).toContain("border-radius: var(--orc-radius-md, 16px)");

    const chipCss = chip.shadowRoot?.querySelector("style")?.textContent ?? "";
    const chipBlock = chipCss.slice(
      chipCss.indexOf(".chip {"),
      chipCss.indexOf("}", chipCss.indexOf(".chip {")),
    );
    expect(chipBlock).toContain("padding: 3px 10px");
    expect(chipBlock).toContain("border-radius: var(--orc-radius-chip, 12px)");

    // 16px/24px padding exceeds the chip's 3px/10px, and the 16px fallback
    // radius exceeds the chip's 12px, per DESIGN.md's block-vs-label scale.
    expect(16).toBeGreaterThan(3);
    expect(24).toBeGreaterThan(10);
    expect(16).toBeGreaterThan(12);
  });

  it("reuses the chip's color-mix variant recipe including the cyan/orange text fallback", () => {
    const callout = document.createElement("orc-callout");
    callout.setAttribute("variant", "green");
    document.body.append(callout);

    const css = callout.shadowRoot?.querySelector("style")?.textContent ?? "";
    const green = css.slice(css.indexOf('[variant="green"]'));
    const block = green.slice(0, green.indexOf("}"));
    expect(block).toContain(
      "background: color-mix(in srgb, var(--orc-green, #9dc76b) 15%, transparent)",
    );
    expect(block).toContain(
      "border-color: color-mix(in srgb, var(--orc-green, #9dc76b) 40%, transparent)",
    );

    const cyan = css.slice(css.indexOf('[variant="cyan"]'));
    const cyanBlock = cyan.slice(0, cyan.indexOf("}"));
    expect(cyanBlock).toContain(
      "color-mix(in srgb, var(--orc-cyan, #77b8b1) 55%, var(--orc-heading, #e0e5e2))",
    );

    const orange = css.slice(css.indexOf('[variant="orange"]'));
    const orangeBlock = orange.slice(0, orange.indexOf("}"));
    expect(orangeBlock).toContain(
      "color-mix(in srgb, var(--orc-orange, #e69257) 55%, var(--orc-heading, #e0e5e2))",
    );
  });

  it("uses the neutral chip fill, border and text tokens", () => {
    const callout = document.createElement("orc-callout");
    document.body.append(callout);

    const css = callout.shadowRoot?.querySelector("style")?.textContent ?? "";
    const block = css.slice(css.indexOf(".callout {"), css.indexOf("}", css.indexOf(".callout {")));
    expect(block).toContain("background: var(--orc-chip, #29312c)");
    expect(block).toContain("border-color: var(--orc-border, #3b4540)");
    expect(block).toContain("color: var(--orc-text, #c7cfca)");

    const headingBlock = css.slice(css.indexOf(".heading {"), css.indexOf("}", css.indexOf(".heading {")));
    expect(headingBlock).toContain("color: var(--orc-heading, #e0e5e2)");
  });

  it("shows a bold heading only when the heading attribute is non-empty", () => {
    const callout = document.createElement("orc-callout");
    document.body.append(callout);

    const heading = callout.shadowRoot?.querySelector<HTMLElement>(".heading");
    expect(heading?.hidden).toBe(true);
    expect(heading?.tagName).toBe("P");

    callout.setAttribute("heading", "Heads up");
    expect(heading?.hidden).toBe(false);
    expect(heading?.textContent).toBe("Heads up");

    callout.setAttribute("heading", "");
    expect(heading?.hidden).toBe(true);

    callout.removeAttribute("heading");
    expect(heading?.hidden).toBe(true);
  });

  it("never renders a heading element other than a <p>", () => {
    const callout = document.createElement("orc-callout");
    callout.setAttribute("heading", "Notice");
    document.body.append(callout);

    expect(callout.shadowRoot?.querySelector("h1,h2,h3,h4,h5,h6")).toBeNull();
    expect(callout.shadowRoot?.querySelector("p.heading")).not.toBeNull();
  });

  it("projects slotted body content through the default slot, untouched", () => {
    const callout = document.createElement("orc-callout");
    const body = document.createElement("span");
    body.textContent = "This run needs review before it ships.";
    callout.append(body);
    document.body.append(callout);

    const slot = callout.shadowRoot?.querySelector("slot");
    expect(slot?.assignedNodes()).toEqual([body]);
    expect(callout.contains(body)).toBe(true);
  });

  it("carries no role by default and opts into role=status/aria-live=polite with live", () => {
    const callout = document.createElement("orc-callout");
    document.body.append(callout);

    const wrapper = callout.shadowRoot?.querySelector<HTMLElement>(".callout");
    expect(wrapper?.getAttribute("role")).toBeNull();
    expect(wrapper?.getAttribute("aria-live")).toBeNull();

    callout.setAttribute("live", "");
    expect(wrapper?.getAttribute("role")).toBe("status");
    expect(wrapper?.getAttribute("aria-live")).toBe("polite");

    callout.removeAttribute("live");
    expect(wrapper?.getAttribute("role")).toBeNull();
    expect(wrapper?.getAttribute("aria-live")).toBeNull();
  });
});
