// @vitest-environment happy-dom

import { afterEach, beforeAll, describe, expect, it } from "vitest";

import { OrcSegmented } from "../src/components/orc-segmented";

beforeAll(() => {
  if (!customElements.get("orc-segmented")) {
    customElements.define("orc-segmented", OrcSegmented);
  }
});

afterEach(() => {
  document.body.replaceChildren();
});

function createSegmented(
  values: string[] = ["orc", "orc-quick"],
  attrs: Record<string, string> = {},
): HTMLElement {
  const host = document.createElement("orc-segmented");
  for (const [name, value] of Object.entries(attrs)) {
    host.setAttribute(name, value);
  }
  for (const value of values) {
    const option = document.createElement("button");
    option.setAttribute("value", value);
    option.textContent = `/${value}`;
    host.append(option);
  }
  document.body.append(host);
  return host;
}

function getRadios(host: Element): HTMLButtonElement[] {
  return [
    ...(host.shadowRoot?.querySelectorAll<HTMLButtonElement>('[role="radio"]') ?? []),
  ];
}

describe("orc-segmented", () => {
  it("renders a radiogroup with one radio per value child", () => {
    const host = createSegmented();
    const group = host.shadowRoot?.querySelector('[role="radiogroup"]');
    expect(group).not.toBeNull();

    const radios = getRadios(host);
    expect(radios).toHaveLength(2);
    expect(radios.map((r) => r.textContent)).toEqual(["/orc", "/orc-quick"]);
    expect(radios.map((r) => r.getAttribute("value"))).toEqual([
      "orc",
      "orc-quick",
    ]);
  });

  it("hides the light-DOM source children from the a11y tree", () => {
    const host = createSegmented();
    for (const child of [...host.children]) {
      expect((child as HTMLElement).hidden).toBe(true);
    }
  });

  it("selects the first segment by default", () => {
    const host = createSegmented();
    const radios = getRadios(host);
    expect(radios[0].getAttribute("aria-checked")).toBe("true");
    expect(radios[1].getAttribute("aria-checked")).toBe("false");
    expect((host as OrcSegmented).value).toBe("orc");
  });

  it("moves selection on click and reflects the value attribute", () => {
    const host = createSegmented();
    const radios = getRadios(host);

    radios[1].click();

    expect(radios[0].getAttribute("aria-checked")).toBe("false");
    expect(radios[1].getAttribute("aria-checked")).toBe("true");
    expect(host.getAttribute("value")).toBe("orc-quick");
    expect((host as OrcSegmented).value).toBe("orc-quick");
  });

  it("fires a composed change CustomEvent with value and label", () => {
    const host = createSegmented();
    const radios = getRadios(host);
    let detail: { value: string; label: string } | undefined;
    host.addEventListener("change", (event) => {
      detail = (event as CustomEvent).detail;
    });

    radios[1].click();

    expect(detail).toEqual({ value: "orc-quick", label: "/orc-quick" });
  });

  it("moves selection and focus with ArrowRight, wrapping at the end", () => {
    const host = createSegmented();
    const group = host.shadowRoot?.querySelector('[role="radiogroup"]') as HTMLElement;
    const radios = getRadios(host);

    group.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    expect(radios[1].getAttribute("aria-checked")).toBe("true");
    expect(host.shadowRoot?.activeElement).toBe(radios[1]);

    group.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    expect(radios[0].getAttribute("aria-checked")).toBe("true");
  });

  it("keeps a roving tabindex: only the selected radio is tabbable", () => {
    const host = createSegmented();
    const group = host.shadowRoot?.querySelector('[role="radiogroup"]') as HTMLElement;
    const radios = getRadios(host);

    expect(radios.filter((r) => r.tabIndex === 0)).toHaveLength(1);
    expect(radios[0].tabIndex).toBe(0);

    group.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));

    expect(radios.filter((r) => r.tabIndex === 0)).toHaveLength(1);
    expect(radios[1].tabIndex).toBe(0);
    expect(radios[0].tabIndex).toBe(-1);
  });

  it("honors an initial value attribute matching a segment", () => {
    const host = createSegmented(["orc", "orc-quick"], { value: "orc-quick" });
    const radios = getRadios(host);
    expect(radios[1].getAttribute("aria-checked")).toBe("true");
  });

  it("applies the label attribute as the group's accessible name", () => {
    const host = createSegmented(["orc", "orc-quick"], { label: "Orc mode" });
    const group = host.shadowRoot?.querySelector('[role="radiogroup"]');
    expect(group?.getAttribute("aria-label")).toBe("Orc mode");
  });
});
