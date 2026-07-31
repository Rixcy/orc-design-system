// @vitest-environment happy-dom

import { afterEach, beforeAll, describe, expect, it } from "vitest";

import { OrcInput } from "../src/components/orc-input";

beforeAll(() => {
  if (!customElements.get("orc-input")) {
    customElements.define("orc-input", OrcInput);
  }
});

afterEach(() => {
  document.body.replaceChildren();
});

describe("orc-input", () => {
  it("wires the label to the input's accessible name via for/id", () => {
    const field = document.createElement("orc-input");
    field.setAttribute("label", "Nickname");
    document.body.append(field);

    const label = field.shadowRoot!.querySelector("label")!;
    const input = field.shadowRoot!.querySelector("input")!;
    expect(label.textContent).toBe("Nickname");
    expect(label.getAttribute("for")).toBe(input.id);
    expect(input.id).toBeTruthy();
  });

  // React 19 assigns to a matching property instead of setting the attribute,
  // and a getter-only accessor named after a public attribute makes that a
  // strict-mode TypeError. Any internal element accessor must not shadow one.
  it("leaves the label attribute free for property assignment", () => {
    const field = document.createElement("orc-input");
    document.body.append(field);

    expect(() => {
      "use strict";
      (field as unknown as { label: string }).label = "Nickname";
    }).not.toThrow();
  });
});
