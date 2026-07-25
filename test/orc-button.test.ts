// @vitest-environment happy-dom

import { afterEach, beforeAll, describe, expect, it } from "vitest";

import { OrcButton } from "../src/components/orc-button";

beforeAll(() => {
  if (!customElements.get("orc-button")) {
    customElements.define("orc-button", OrcButton);
  }
});

afterEach(() => {
  document.body.replaceChildren();
});

function createButton(): OrcButton {
  const button = document.createElement("orc-button") as OrcButton;
  document.body.append(button);
  return button;
}

function getButton(host: Element): HTMLButtonElement {
  const button = host.shadowRoot?.querySelector<HTMLButtonElement>("button");
  if (!button) throw new Error("Expected orc-button to expose a native button.");
  return button;
}

describe("orc-button", () => {
  it("renders a native button with default type and no attribute reflected", () => {
    const host = createButton();
    const button = getButton(host);
    expect(button.tagName).toBe("BUTTON");
    expect(button.type).toBe("button");
    expect(host.getAttribute("variant")).toBeNull();
  });

  it("renders slotted content as the accessible label", () => {
    const host = createButton();
    host.textContent = "Send";
    document.body.append(host);

    const button = getButton(host);
    const slot = button.querySelector("slot");
    expect(slot).not.toBeNull();
    expect(host.textContent).toBe("Send");
    // The slotted text node is what supplies the accessible name natively.
    expect((slot as HTMLSlotElement).assignedNodes()[0]?.textContent).toBe(
      "Send",
    );
  });

  it("reflects the disabled attribute onto the inner button", () => {
    const host = createButton();
    const button = getButton(host);
    expect(button.disabled).toBe(false);

    host.setAttribute("disabled", "");
    expect(button.disabled).toBe(true);

    host.removeAttribute("disabled");
    expect(button.disabled).toBe(false);
  });

  it("forwards the type attribute, defaulting to button", () => {
    const host = createButton();
    const button = getButton(host);
    expect(button.type).toBe("button");

    host.setAttribute("type", "submit");
    expect(button.type).toBe("submit");

    host.setAttribute("type", "reset");
    expect(button.type).toBe("button");
  });

  it("supports variant and size attributes without altering inner button semantics", () => {
    const host = createButton();
    host.setAttribute("variant", "ghost");
    host.setAttribute("size", "compact");
    const button = getButton(host);

    expect(host.getAttribute("variant")).toBe("ghost");
    expect(host.getAttribute("size")).toBe("compact");
    expect(button.tagName).toBe("BUTTON");
  });

  it("bubbles native click events from the inner button through the host", () => {
    const host = createButton();
    const button = getButton(host);
    let clicks = 0;
    host.addEventListener("click", () => clicks++);

    button.click();
    expect(clicks).toBe(1);
  });

  it("does not fire click when disabled", () => {
    const host = createButton();
    host.setAttribute("disabled", "");
    const button = getButton(host);
    let clicks = 0;
    host.addEventListener("click", () => clicks++);

    button.click();
    expect(clicks).toBe(0);
  });

  it("defines a focus-visible rule (not a plain :focus rule) for the focus ring", () => {
    const host = createButton();
    const styleText = host.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styleText).toMatch(/button:focus-visible\s*\{/);
    expect(styleText).not.toMatch(/button:focus\s*\{/);
  });
  // Regression: orc-ui assigns `.disabled = ...` in ~70 places. Before this
  // property existed the assignment defined an expando, the attribute never
  // landed, and the inner button stayed clickable.
  it("reflects the disabled property onto the attribute and the inner button", () => {
    const host = createButton();
    const button = host.shadowRoot?.querySelector("button");

    expect(host.disabled).toBe(false);

    host.disabled = true;
    expect(host.hasAttribute("disabled")).toBe(true);
    expect(button?.disabled).toBe(true);

    host.disabled = false;
    expect(host.hasAttribute("disabled")).toBe(false);
    expect(button?.disabled).toBe(false);
  });

  it("reads the disabled property back from the attribute", () => {
    const host = createButton();
    host.setAttribute("disabled", "");
    expect(host.disabled).toBe(true);
    host.removeAttribute("disabled");
    expect(host.disabled).toBe(false);
  });

  it("does not fire click while disabled via the property", () => {
    const host = createButton();
    let clicks = 0;
    host.addEventListener("click", () => { clicks += 1; });
    host.disabled = true;
    host.shadowRoot?.querySelector("button")?.click();
    expect(clicks).toBe(0);
  });
});
