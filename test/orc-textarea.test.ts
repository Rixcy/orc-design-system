// @vitest-environment happy-dom

import { afterEach, beforeAll, describe, expect, it } from "vitest";

import { OrcTextarea } from "../src/components/orc-textarea";

beforeAll(() => {
  if (!customElements.get("orc-textarea")) {
    customElements.define("orc-textarea", OrcTextarea);
  }
});

afterEach(() => {
  document.body.replaceChildren();
});

describe("orc-textarea", () => {
  it("wires the label to the textarea's accessible name via for/id", () => {
    const field = document.createElement("orc-textarea");
    field.setAttribute("label", "Feedback");
    document.body.append(field);

    const label = field.shadowRoot!.querySelector("label")!;
    const textarea = field.shadowRoot!.querySelector("textarea")!;
    expect(label.textContent).toBe("Feedback");
    expect(label.getAttribute("for")).toBe(textarea.id);
    expect(textarea.id).toBeTruthy();
  });

  it("round-trips the value property through the inner textarea", () => {
    const field = document.createElement("orc-textarea") as OrcTextarea;
    field.setAttribute("label", "Notes");
    document.body.append(field);

    const textarea = field.shadowRoot!.querySelector("textarea")!;
    expect(field.value).toBe("");

    field.value = "hello";
    expect(textarea.value).toBe("hello");

    textarea.value = "edited";
    expect(field.value).toBe("edited");
  });

  it("reflects placeholder and disabled attributes onto the inner textarea", () => {
    const field = document.createElement("orc-textarea");
    field.setAttribute("label", "Notes");
    field.setAttribute("placeholder", "Type here…");
    document.body.append(field);

    const textarea = field.shadowRoot!.querySelector("textarea")!;
    expect(textarea.placeholder).toBe("Type here…");
    expect(textarea.disabled).toBe(false);

    field.setAttribute("disabled", "");
    expect(textarea.disabled).toBe(true);

    field.removeAttribute("disabled");
    expect(textarea.disabled).toBe(false);
  });

  it("reflects the rows attribute, ignoring non-numeric values", () => {
    const field = document.createElement("orc-textarea");
    field.setAttribute("label", "Notes");
    document.body.append(field);

    const textarea = field.shadowRoot!.querySelector("textarea")!;

    field.setAttribute("rows", "6");
    expect(Number(textarea.rows)).toBe(6);

    field.setAttribute("rows", "not-a-number");
    expect(textarea.hasAttribute("rows")).toBe(false);
  });

  it("forwards focus() to the inner textarea", () => {
    const field = document.createElement("orc-textarea") as OrcTextarea;
    field.setAttribute("label", "Notes");
    document.body.append(field);

    const textarea = field.shadowRoot!.querySelector("textarea")!;
    field.focus();
    expect(field.shadowRoot!.activeElement).toBe(textarea);
  });
});
