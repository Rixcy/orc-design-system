// @vitest-environment happy-dom

import { afterEach, beforeAll, describe, expect, it } from "vitest";

import { OrcIconButton } from "../src/components/orc-icon-button";
import { defineOrcElements } from "../src/define";

beforeAll(() => {
  if (!customElements.get("orc-icon-button")) {
    customElements.define("orc-icon-button", OrcIconButton);
  }
});

afterEach(() => {
  document.body.replaceChildren();
});

function createIconButton(label = "Settings"): OrcIconButton {
  const host = document.createElement("orc-icon-button") as OrcIconButton;
  host.setAttribute("label", label);
  document.body.append(host);
  return host;
}

function getControl(host: Element): HTMLButtonElement | HTMLAnchorElement {
  const control = host.shadowRoot?.querySelector<
    HTMLButtonElement | HTMLAnchorElement
  >("button, a");
  if (!control) throw new Error("Expected orc-icon-button to expose a control.");
  return control;
}

describe("orc-icon-button", () => {
  it("defines orc-icon-button through defineOrcElements", () => {
    defineOrcElements();
    expect(customElements.get("orc-icon-button")).toBeDefined();
  });

  it("reflects variant and size on the host", () => {
    const host = createIconButton();
    expect(host.getAttribute("variant")).toBeNull();
    expect(host.getAttribute("size")).toBeNull();

    host.setAttribute("variant", "ghost");
    host.setAttribute("size", "compact");
    expect(host.getAttribute("variant")).toBe("ghost");
    expect(host.getAttribute("size")).toBe("compact");
  });

  it("exposes the slotted icon through a <slot>", () => {
    const host = createIconButton();
    host.innerHTML = '<svg aria-hidden="true"></svg>';
    const control = getControl(host);
    const slot = control.querySelector("slot");
    expect(slot).not.toBeNull();
    expect((slot as HTMLSlotElement).assignedNodes()[0]?.nodeName).toBe("svg");
  });

  it("renders a native button with type=button when href is absent", () => {
    const host = createIconButton();
    const control = getControl(host);
    expect(control.tagName).toBe("BUTTON");
    expect((control as HTMLButtonElement).type).toBe("button");
  });

  it("renders an anchor with href and passes target/rel through when href is set", () => {
    const host = createIconButton();
    host.setAttribute("href", "#tickets");
    host.setAttribute("target", "_blank");
    host.setAttribute("rel", "noopener");

    const control = getControl(host);
    expect(control.tagName).toBe("A");
    expect((control as HTMLAnchorElement).getAttribute("href")).toBe("#tickets");
    expect(control.getAttribute("target")).toBe("_blank");
    expect(control.getAttribute("rel")).toBe("noopener");
  });

  it("renders a disabled button with no href when href and disabled are both set", () => {
    const host = createIconButton();
    host.setAttribute("href", "#tickets");
    host.setAttribute("disabled", "");

    const control = getControl(host);
    expect(control.tagName).toBe("BUTTON");
    expect((control as HTMLButtonElement).disabled).toBe(true);
    expect(control.hasAttribute("href")).toBe(false);
  });

  it("switches back to a link when disabled is removed", () => {
    const host = createIconButton();
    host.setAttribute("href", "#tickets");
    host.setAttribute("disabled", "");
    expect(getControl(host).tagName).toBe("BUTTON");

    host.removeAttribute("disabled");
    const control = getControl(host);
    expect(control.tagName).toBe("A");
    expect(control.getAttribute("href")).toBe("#tickets");
  });

  it("mirrors label onto aria-label and title, updating when the attribute changes", () => {
    const host = createIconButton("Settings");
    const control = getControl(host);
    expect(control.getAttribute("aria-label")).toBe("Settings");
    expect(control.title).toBe("Settings");

    host.setAttribute("label", "Preferences");
    expect(control.getAttribute("aria-label")).toBe("Preferences");
    expect(control.title).toBe("Preferences");
  });

  it("reflects the disabled property onto the attribute and the inner button", () => {
    const host = createIconButton();
    const button = getControl(host) as HTMLButtonElement;
    expect(host.disabled).toBe(false);

    host.disabled = true;
    expect(host.hasAttribute("disabled")).toBe(true);
    expect(button.disabled).toBe(true);

    host.disabled = false;
    expect(host.hasAttribute("disabled")).toBe(false);
    expect(button.disabled).toBe(false);
  });

  it("bubbles native click events from the inner button through the host", () => {
    const host = createIconButton();
    const control = getControl(host);
    let clicks = 0;
    host.addEventListener("click", () => clicks++);

    control.click();
    expect(clicks).toBe(1);
  });

  it("does not fire click when disabled", () => {
    const host = createIconButton();
    host.setAttribute("disabled", "");
    const control = getControl(host);
    let clicks = 0;
    host.addEventListener("click", () => clicks++);

    (control as HTMLButtonElement).click();
    expect(clicks).toBe(0);
  });

  it("defines a focus-visible rule (not a plain :focus rule) for the focus ring", () => {
    const host = createIconButton();
    const css = host.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(css).toMatch(/:focus-visible\s*\{/);
    expect(css).not.toMatch(/[^-]:focus\s*\{/);
    expect(css).toContain("var(--orc-focus-ring");
    expect(css).toContain("var(--orc-focus-offset");
  });

  it("gives the control a 44px minimum target on a coarse pointer", () => {
    const host = createIconButton();
    const css = host.shadowRoot?.querySelector("style")?.textContent ?? "";
    const coarse = css.slice(css.indexOf("@media (pointer: coarse)"));
    expect(css).toContain("@media (pointer: coarse)");
    expect(coarse).toContain("44px");
  });

  it("removes transitions under prefers-reduced-motion", () => {
    const host = createIconButton();
    const css = host.shadowRoot?.querySelector("style")?.textContent ?? "";
    const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(reduced).toContain("transition: none");
  });
});
