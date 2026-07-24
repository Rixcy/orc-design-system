// @vitest-environment happy-dom

import { afterEach, beforeAll, describe, expect, it } from "vitest";

import { OrcStepper } from "../src/components/orc-stepper";

beforeAll(() => {
  if (!customElements.get("orc-stepper")) {
    customElements.define("orc-stepper", OrcStepper);
  }
});

afterEach(() => {
  document.body.replaceChildren();
});

function createStepper(steps: string, current: string): HTMLElement {
  const stepper = document.createElement("orc-stepper");
  stepper.setAttribute("steps", steps);
  stepper.setAttribute("current", current);
  document.body.append(stepper);
  return stepper;
}

function getItems(host: Element): HTMLLIElement[] {
  return [
    ...(host.shadowRoot?.querySelectorAll<HTMLLIElement>("li") ?? []),
  ];
}

describe("orc-stepper", () => {
  it("renders an ordered list with one item per comma-separated step", () => {
    const host = createStepper("plan,build,review,qa", "1");
    const list = host.shadowRoot?.querySelector("ol");
    expect(list).not.toBeNull();

    const items = getItems(host);
    expect(items).toHaveLength(4);
    expect(items.map((item) => item.textContent?.trim())).toEqual([
      "plan (done)",
      "build",
      "review",
      "qa",
    ]);
  });

  it("marks the current step with aria-current=step and no others", () => {
    const host = createStepper("plan,build,review,qa", "1");
    const items = getItems(host);

    expect(items[1]?.getAttribute("aria-current")).toBe("step");
    expect(items[0]?.hasAttribute("aria-current")).toBe(false);
    expect(items[2]?.hasAttribute("aria-current")).toBe(false);
    expect(items[3]?.hasAttribute("aria-current")).toBe(false);
  });

  it("splits done/current/pending classes around the current index", () => {
    const host = createStepper("plan,build,review,qa", "1");
    const items = getItems(host);

    expect(items[0]?.querySelector(".step")?.classList.contains("done")).toBe(
      true,
    );
    expect(
      items[1]?.querySelector(".step")?.classList.contains("current"),
    ).toBe(true);
    expect(
      items[2]?.querySelector(".step")?.classList.contains("pending"),
    ).toBe(true);
    expect(
      items[3]?.querySelector(".step")?.classList.contains("pending"),
    ).toBe(true);
  });

  it("supports a label-based current attribute", () => {
    const host = createStepper("plan,build,review,qa", "review");
    const items = getItems(host);

    expect(items[2]?.getAttribute("aria-current")).toBe("step");
    expect(
      items[0]?.querySelector(".step")?.classList.contains("done"),
    ).toBe(true);
    expect(
      items[1]?.querySelector(".step")?.classList.contains("done"),
    ).toBe(true);
    expect(
      items[3]?.querySelector(".step")?.classList.contains("pending"),
    ).toBe(true);
  });

  it("marks done steps with a visually-hidden text affix, not color alone", () => {
    const host = createStepper("plan,build,review,qa", "2");
    const items = getItems(host);
    const doneAffix = items[0]?.querySelector(".visually-hidden");
    expect(doneAffix?.textContent?.trim()).toBe("(done)");
  });

  it("falls back to a single pending step when steps is empty", () => {
    const host = document.createElement("orc-stepper");
    document.body.append(host);
    const items = getItems(host);
    expect(items).toHaveLength(0);
  });

  it("treats an out-of-range or unmatched current as no active step", () => {
    const host = createStepper("plan,build", "nope");
    const items = getItems(host);
    expect(items.every((item) => !item.hasAttribute("aria-current"))).toBe(
      true,
    );
    expect(
      items.every((item) =>
        item.querySelector(".step")?.classList.contains("pending"),
      ),
    ).toBe(true);
  });
});
