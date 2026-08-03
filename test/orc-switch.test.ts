// @vitest-environment happy-dom

import { afterEach, beforeAll, describe, expect, it } from "vitest";

import { OrcSwitch } from "../src/components/orc-switch";

beforeAll(() => {
  if (!customElements.get("orc-switch")) {
    customElements.define("orc-switch", OrcSwitch);
  }
});

afterEach(() => {
  document.body.replaceChildren();
});

function createSwitch(attrs: Record<string, string> = {}): OrcSwitch {
  const host = document.createElement("orc-switch") as OrcSwitch;
  for (const [name, value] of Object.entries(attrs)) {
    host.setAttribute(name, value);
  }
  document.body.append(host);
  return host;
}

function getInput(host: Element): HTMLInputElement {
  const input = host.shadowRoot?.querySelector("input");
  if (!input) throw new Error("input not found");
  return input;
}

describe("orc-switch", () => {
  it("renders a label wrapping a checkbox with role switch, plus track/thumb", () => {
    const host = createSwitch({ label: "Auto-merge" });
    const label = host.shadowRoot?.querySelector("label");
    expect(label).not.toBeNull();

    const input = getInput(host);
    expect(input.tagName).toBe("INPUT");
    expect(input.type).toBe("checkbox");
    expect(input.getAttribute("role")).toBe("switch");
    expect(label?.contains(input)).toBe(true);

    expect(host.shadowRoot?.querySelector(".track")).not.toBeNull();
    expect(host.shadowRoot?.querySelector(".thumb")).not.toBeNull();
  });

  it("toggles on click and reflects the checked attribute", () => {
    const host = createSwitch();
    const input = getInput(host);

    expect(host.hasAttribute("checked")).toBe(false);
    input.click();

    expect(input.checked).toBe(true);
    expect(host.getAttribute("checked")).toBe("");
    expect(host.checked).toBe(true);

    input.click();
    expect(input.checked).toBe(false);
    expect(host.hasAttribute("checked")).toBe(false);
    expect(host.checked).toBe(false);
  });

  it("checks the input when the checked property is set", () => {
    const host = createSwitch();
    const input = getInput(host);

    host.checked = true;
    expect(input.checked).toBe(true);
    expect(host.hasAttribute("checked")).toBe(true);

    host.checked = false;
    expect(input.checked).toBe(false);
    expect(host.hasAttribute("checked")).toBe(false);
  });

  it("reflects an initial checked attribute onto the input", () => {
    const host = createSwitch({ checked: "" });
    const input = getInput(host);
    expect(input.checked).toBe(true);
    expect(host.checked).toBe(true);
  });

  it("fires exactly one composed change CustomEvent with detail.checked", () => {
    const host = createSwitch();
    const input = getInput(host);
    const seen: boolean[] = [];
    host.addEventListener("change", (event) => {
      seen.push((event as CustomEvent<{ checked: boolean }>).detail.checked);
    });

    input.click();

    expect(seen).toEqual([true]);
  });

  it("does not fire change when toggled via the checked property", () => {
    const host = createSwitch();
    let count = 0;
    host.addEventListener("change", () => {
      count += 1;
    });

    host.checked = true;

    expect(count).toBe(0);
  });

  it("disables the input and blocks toggling when disabled is set", () => {
    const host = createSwitch({ disabled: "" });
    const input = getInput(host);
    expect(input.disabled).toBe(true);

    let firedChange = false;
    host.addEventListener("change", () => {
      firedChange = true;
    });

    input.click();

    expect(input.checked).toBe(false);
    expect(host.hasAttribute("checked")).toBe(false);
    expect(firedChange).toBe(false);
  });

  it("wires a visible label via for/id and uses it as the accessible name", () => {
    const host = createSwitch({ label: "Auto-merge" });
    const label = host.shadowRoot?.querySelector("label");
    const input = getInput(host);

    expect(label?.getAttribute("for")).toBe(input.id);
    expect(input.id).not.toBe("");
    expect(label?.textContent?.trim()).toBe("Auto-merge");
    expect(input.hasAttribute("aria-label")).toBe(false);
  });

  it("uses aria-label only when there is no visible label", () => {
    const host = createSwitch({ "aria-label": "Auto-merge" });
    const input = getInput(host);
    expect(input.getAttribute("aria-label")).toBe("Auto-merge");

    host.setAttribute("label", "Auto-merge");
    expect(input.hasAttribute("aria-label")).toBe(false);
  });

  it("wires and unwires the description", () => {
    const host = createSwitch({ description: "Merges without review" });
    const input = getInput(host);
    const description = host.shadowRoot?.querySelector<HTMLElement>(".description");

    expect(description?.hidden).toBe(false);
    expect(description?.textContent).toBe("Merges without review");
    expect(input.getAttribute("aria-describedby")).toBe(description?.id);

    host.removeAttribute("description");
    expect(description?.hidden).toBe(true);
    expect(input.hasAttribute("aria-describedby")).toBe(false);
  });

  // Repeated toggling is a double-click, which would otherwise leave the label
  // text highlighted. The description stays selectable — it is prose, not a
  // click target.
  it("makes the label unselectable without touching the description", () => {
    const host = createSwitch({ label: "Auto-merge" });

    const css = host.shadowRoot!.querySelector("style")!.textContent!;
    const labelRule = css.match(/\blabel\s*\{[^}]*\}/)![0];
    expect(labelRule).toMatch(/(?<!-webkit-)user-select:\s*none/);
    expect(labelRule).toMatch(/-webkit-user-select:\s*none/);
    expect(css.match(/\.sr-only\s*\{[^}]*\}/)![0]).not.toMatch(/user-select/);
  });
});
