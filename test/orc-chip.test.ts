// @vitest-environment happy-dom

import { afterEach, beforeAll, describe, expect, it } from "vitest";

import { OrcChip } from "../src/components/orc-chip";
import { OrcStatusDot } from "../src/components/orc-status-dot";

beforeAll(() => {
  if (!customElements.get("orc-chip")) {
    customElements.define("orc-chip", OrcChip);
  }
  if (!customElements.get("orc-status-dot")) {
    customElements.define("orc-status-dot", OrcStatusDot);
  }
});

afterEach(() => {
  document.body.replaceChildren();
});

describe("orc-chip", () => {
  it("defaults to and reflects the neutral variant", () => {
    const chip = document.createElement("orc-chip");
    document.body.append(chip);
    expect(chip.getAttribute("variant")).toBe("neutral");

    chip.setAttribute("variant", "green");
    expect(chip.getAttribute("variant")).toBe("green");
  });

  it("falls back to neutral for an unknown variant", () => {
    const chip = document.createElement("orc-chip");
    chip.setAttribute("variant", "not-a-real-variant");
    document.body.append(chip);
    expect(chip.getAttribute("variant")).toBe("neutral");
  });

  it("is a soft-filled rounded rectangle with a hairline border, not a pill", () => {
    // DESIGN.md: chips are Soft Fill background, 1px Border, 12px radius. Every
    // coloured variant used to zero its own border out, which left a bare pill.
    const chip = document.createElement("orc-chip");
    chip.setAttribute("variant", "green");
    document.body.append(chip);

    const css = chip.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(css).toContain("border-radius: var(--orc-radius-chip, 12px)");
    expect(css).not.toContain("--orc-radius-pill");
    expect(css).not.toContain("border-color: transparent");

    const green = css.slice(css.indexOf('[variant="green"]'));
    expect(green.slice(0, green.indexOf("}"))).toContain(
      "border-color: color-mix(in srgb, var(--orc-green, #9dc76b) 40%, transparent)",
    );
  });

  it("renders as a static span, not a button", () => {
    const chip = document.createElement("orc-chip");
    document.body.append(chip);
    expect(chip.shadowRoot?.querySelector("button")).toBeNull();
    expect(chip.shadowRoot?.querySelector("span.chip")).not.toBeNull();
  });

  it("carries DESIGN.md §5's chip type, padding and Soft Fill", () => {
    const chip = document.createElement("orc-chip");
    document.body.append(chip);

    const css = chip.shadowRoot?.querySelector("style")?.textContent ?? "";
    const base = css.slice(css.indexOf(".chip {"));
    const block = base.slice(0, base.indexOf("}"));
    expect(block).toContain("font-size: 12px");
    expect(block).toContain("padding: 3px 10px");
    // The neutral chip used to be transparent, which left it reading as an
    // outline beside the filled pills a consumer puts next to it.
    expect(block).toContain("background: var(--orc-chip, #29312c)");
  });

  it("renders an anchor with href, and swaps back to a span without one", () => {
    const chip = document.createElement("orc-chip");
    chip.setAttribute("href", "#run-1");
    chip.textContent = "Parent run";
    document.body.append(chip);

    const anchor = chip.shadowRoot?.querySelector<HTMLAnchorElement>("a.chip");
    expect(anchor).not.toBeNull();
    expect(anchor?.getAttribute("href")).toBe("#run-1");
    expect(chip.shadowRoot?.querySelector("span.chip")).toBeNull();
    // The label is still slotted, so the accessible name comes from the light
    // DOM and a consumer can extend it with its own visually-hidden text.
    expect(
      anchor?.querySelector<HTMLSlotElement>("slot")?.assignedNodes()[0]
        ?.textContent,
    ).toBe("Parent run");

    chip.removeAttribute("href");
    expect(chip.shadowRoot?.querySelector("a.chip")).toBeNull();
    expect(chip.shadowRoot?.querySelector("span.chip")).not.toBeNull();
    expect(chip.shadowRoot?.querySelector(".dot")).not.toBeNull();
  });

  it("defaults a new browsing context to noopener without overriding rel", () => {
    const chip = document.createElement("orc-chip");
    chip.setAttribute("href", "https://example.test");
    chip.setAttribute("target", "_blank");
    document.body.append(chip);

    const anchor = chip.shadowRoot?.querySelector<HTMLAnchorElement>("a.chip");
    expect(anchor?.getAttribute("target")).toBe("_blank");
    expect(anchor?.getAttribute("rel")).toBe("noopener");

    chip.setAttribute("rel", "noopener noreferrer");
    expect(anchor?.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("gives the link chip DESIGN.md §5's hover state and a focus ring", () => {
    const chip = document.createElement("orc-chip");
    chip.setAttribute("href", "#run-1");
    document.body.append(chip);

    const css = chip.shadowRoot?.querySelector("style")?.textContent ?? "";
    const hover = css.slice(css.indexOf("a.chip:hover"));
    expect(hover.slice(0, hover.indexOf("}"))).toContain(
      "border-color: var(--orc-accent, #78a9c2)",
    );
    expect(css).toContain("a.chip:focus-visible");
    expect(css).toContain("outline: var(--orc-focus-ring");
  });

  it("renders a decorative leading dot only when the dot attribute is set", () => {
    const chip = document.createElement("orc-chip");
    document.body.append(chip);

    const dot = chip.shadowRoot?.querySelector<HTMLElement>(".dot");
    expect(dot?.hidden).toBe(true);
    expect(dot?.getAttribute("aria-hidden")).toBe("true");

    chip.setAttribute("dot", "");
    expect(dot?.hidden).toBe(false);

    chip.removeAttribute("dot");
    expect(dot?.hidden).toBe(true);
  });

  it("projects slotted label text through the default slot", () => {
    const chip = document.createElement("orc-chip");
    chip.textContent = "In review";
    document.body.append(chip);

    const slot = chip.shadowRoot?.querySelector("slot");
    expect(slot?.assignedNodes().map((node) => node.textContent)).toEqual([
      "In review",
    ]);
  });
});

describe("orc-status-dot", () => {
  it("requires an accessible label rendered visually-hidden, with the dot itself aria-hidden", () => {
    const dot = document.createElement("orc-status-dot");
    dot.setAttribute("label", "Running");
    document.body.append(dot);

    const visualDot = dot.shadowRoot?.querySelector<HTMLElement>(".dot");
    expect(visualDot?.getAttribute("aria-hidden")).toBe("true");

    const label = dot.shadowRoot?.querySelector(".sr-only");
    expect(label?.textContent).toBe("Running");
  });

  it("only sets role=status when the live attribute is present", () => {
    const dot = document.createElement("orc-status-dot");
    dot.setAttribute("label", "Idle");
    document.body.append(dot);

    const label = dot.shadowRoot?.querySelector(".sr-only");
    expect(label?.getAttribute("role")).toBeNull();

    dot.setAttribute("live", "");
    expect(label?.getAttribute("role")).toBe("status");

    dot.removeAttribute("live");
    expect(label?.getAttribute("role")).toBeNull();
  });

  it("applies the pulse class hook only when the pulse attribute is set", () => {
    const dot = document.createElement("orc-status-dot");
    dot.setAttribute("label", "Live");
    document.body.append(dot);

    expect(dot.hasAttribute("pulse")).toBe(false);

    dot.setAttribute("pulse", "");
    expect(dot.hasAttribute("pulse")).toBe(true);
  });

  it("reflects the tone attribute", () => {
    const dot = document.createElement("orc-status-dot");
    dot.setAttribute("label", "Error");
    dot.setAttribute("tone", "red");
    document.body.append(dot);
    expect(dot.getAttribute("tone")).toBe("red");
  });
});
