// @vitest-environment happy-dom

import { afterEach, beforeAll, describe, expect, it } from "vitest";

import { OrcCheckbox } from "../src/components/orc-checkbox";

beforeAll(() => {
  if (!customElements.get("orc-checkbox")) {
    customElements.define("orc-checkbox", OrcCheckbox);
  }
});

afterEach(() => {
  document.body.replaceChildren();
});

describe("orc-checkbox", () => {
  it("wires the label to the input's accessible name via for/id", () => {
    const field = document.createElement("orc-checkbox");
    field.setAttribute("label", "Notify me");
    document.body.append(field);

    const label = field.shadowRoot!.querySelector("label")!;
    const input = field.shadowRoot!.querySelector("input")!;
    expect(label.textContent).toBe("Notify me");
    expect(label.getAttribute("for")).toBe(input.id);
    expect(input.id).toBeTruthy();
  });

  it("falls back to aria-label when no visible label is set", () => {
    const field = document.createElement("orc-checkbox");
    field.setAttribute("aria-label", "Accept terms");
    document.body.append(field);

    const label = field.shadowRoot!.querySelector("label")!;
    const input = field.shadowRoot!.querySelector("input")!;
    expect(label.hidden).toBe(true);
    expect(input.getAttribute("aria-label")).toBe("Accept terms");
  });

  it("reflects disabled, required and indeterminate onto the native input", () => {
    const field = document.createElement("orc-checkbox");
    document.body.append(field);
    const input = field.shadowRoot!.querySelector("input")!;

    expect(input.disabled).toBe(false);
    expect(input.required).toBe(false);
    expect(input.indeterminate).toBe(false);

    field.setAttribute("disabled", "");
    field.setAttribute("required", "");
    field.setAttribute("indeterminate", "");
    expect(input.disabled).toBe(true);
    expect(input.required).toBe(true);
    expect(input.indeterminate).toBe(true);

    field.removeAttribute("disabled");
    field.removeAttribute("required");
    field.removeAttribute("indeterminate");
    expect(input.disabled).toBe(false);
    expect(input.required).toBe(false);
    expect(input.indeterminate).toBe(false);
  });

  it("seeds initial checked state from the checked attribute", () => {
    const field = document.createElement("orc-checkbox");
    field.setAttribute("checked", "");
    document.body.append(field);

    const input = field.shadowRoot!.querySelector("input")!;
    expect(input.checked).toBe(true);
    expect((field as unknown as { checked: boolean }).checked).toBe(true);
  });

  it("fires one composed, bubbling change event with detail.checked on toggle", () => {
    const field = document.createElement("orc-checkbox") as OrcCheckbox;
    document.body.append(field);
    const input = field.shadowRoot!.querySelector("input")!;

    const events: boolean[] = [];
    field.addEventListener("change", (event) => {
      events.push((event as CustomEvent<{ checked: boolean }>).detail.checked);
    });

    input.click();

    expect(events).toEqual([true]);
    expect(field.checked).toBe(true);
  });

  it("exposes checked/indeterminate as live properties on the native input", () => {
    const field = document.createElement("orc-checkbox") as OrcCheckbox;
    document.body.append(field);

    field.checked = true;
    expect(field.shadowRoot!.querySelector("input")!.checked).toBe(true);

    field.indeterminate = true;
    expect(field.shadowRoot!.querySelector("input")!.indeterminate).toBe(true);
  });

  it("keeps a property-set checked/indeterminate through an unrelated attribute change", () => {
    const field = document.createElement("orc-checkbox") as OrcCheckbox;
    document.body.append(field);
    const input = field.shadowRoot!.querySelector("input")!;

    field.checked = true;
    field.indeterminate = true;
    field.setAttribute("disabled", "");

    expect(input.disabled).toBe(true);
    expect(input.checked).toBe(true);
    expect(input.indeterminate).toBe(true);
  });

  // Repeated toggling is a double-click, which would otherwise leave the label
  // text highlighted. The description stays selectable — it is prose, not a
  // click target.
  it("makes the label unselectable without touching the description", () => {
    const field = document.createElement("orc-checkbox");
    document.body.append(field);

    const css = field.shadowRoot!.querySelector("style")!.textContent!;
    const labelRule = css.match(/\blabel\s*\{[^}]*\}/)![0];
    expect(labelRule).toMatch(/(?<!-webkit-)user-select:\s*none/);
    expect(labelRule).toMatch(/-webkit-user-select:\s*none/);
    expect(css.match(/\.sr-only\s*\{[^}]*\}/)![0]).not.toMatch(/user-select/);
  });

  // React 19 assigns to a matching property instead of setting the attribute,
  // and a getter-only accessor named after a public attribute makes that a
  // strict-mode TypeError. Any internal element accessor must not shadow one.
  it("leaves the label attribute free for property assignment", () => {
    const field = document.createElement("orc-checkbox");
    document.body.append(field);

    expect(() => {
      "use strict";
      (field as unknown as { label: string }).label = "Notify me";
    }).not.toThrow();
  });
});
