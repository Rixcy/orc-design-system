// @vitest-environment happy-dom

import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { OrcMenu } from "../src/components/orc-menu";
import { OrcSplitButton } from "../src/components/orc-split-button";

beforeAll(() => {
  if (!customElements.get("orc-menu")) customElements.define("orc-menu", OrcMenu);
  if (!customElements.get("orc-split-button")) {
    customElements.define("orc-split-button", OrcSplitButton);
  }
});

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

function createItem(label: string): HTMLButtonElement {
  const item = document.createElement("button");
  item.type = "button";
  item.slot = "menu";
  item.setAttribute("role", "menuitem");
  item.textContent = label;
  return item;
}

function createSplitButton(
  items: HTMLElement[] = [createItem("Remove worktree"), createItem("Stop worktree app")],
): { host: OrcSplitButton; primary: HTMLButtonElement } {
  const host = document.createElement("orc-split-button") as OrcSplitButton;
  const primary = document.createElement("button");
  primary.type = "button";
  primary.textContent = "Merge to main";
  host.append(primary, ...items);
  document.body.append(host);
  return { host, primary };
}

function menuItems(host: OrcSplitButton): HTMLElement[] {
  return [...host.querySelectorAll<HTMLElement>('[role="menuitem"]')];
}

describe("orc-split-button", () => {
  it("leaves the primary button in the light DOM and owns a named chevron trigger", () => {
    const { host, primary } = createSplitButton();
    expect(primary.parentElement).toBe(host);
    expect(host.trigger?.tagName).toBe("BUTTON");
    expect(host.trigger?.getAttribute("aria-haspopup")).toBe("menu");
    expect(host.trigger?.getAttribute("aria-label")).toBe("More actions");
    expect(host.menu?.getAttribute("label")).toBe("More actions");
  });

  it("forwards its accessible names and density to the composed menu", () => {
    const { host } = createSplitButton();
    host.setAttribute("label", "Delivery actions");
    host.setAttribute("menu-label", "More delivery actions");
    host.setAttribute("size", "compact");
    expect(host.trigger?.getAttribute("aria-label")).toBe("More delivery actions");
    expect(host.menu?.getAttribute("label")).toBe("Delivery actions");
    expect(host.menu?.getAttribute("size")).toBe("compact");
    host.removeAttribute("size");
    expect(host.menu?.hasAttribute("size")).toBe(false);
  });

  it("opens the slotted items from the chevron and mirrors open onto the host", () => {
    const { host } = createSplitButton();
    const opened = vi.fn();
    host.addEventListener("open", opened);
    host.trigger?.click();
    expect(host.open).toBe(true);
    expect(host.menu?.open).toBe(true);
    expect(opened).toHaveBeenCalledTimes(1);
    expect(menuItems(host).map((item) => item.tabIndex)).toEqual([0, -1]);
    expect(document.activeElement).toBe(menuItems(host)[0]);
  });

  // Item clicks travel through two slots to reach the composed menu, a path
  // happy-dom does not model; the story play functions cover them in a browser.
  it("re-issues the menu's close event from the host with its reason", () => {
    const { host } = createSplitButton();
    const closed = vi.fn();
    host.addEventListener("close", closed);
    host.show();
    host.close("trigger");
    expect(host.open).toBe(false);
    expect(closed).toHaveBeenCalledTimes(1);
    expect(closed.mock.calls[0]![0].detail).toEqual({ reason: "trigger" });
  });

  it("lets a consumer veto a dismissal through the host's cancel event", () => {
    const { host } = createSplitButton();
    const veto = (event: Event): void => event.preventDefault();
    host.addEventListener("cancel", veto);
    host.show();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(host.open).toBe(true);
    host.removeEventListener("cancel", veto);
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(host.open).toBe(false);
  });

  it("controls the menu through the open attribute", () => {
    const { host } = createSplitButton();
    host.open = true;
    expect(host.menu?.open).toBe(true);
    expect(host.trigger?.getAttribute("aria-expanded")).toBe("true");
    host.open = false;
    expect(host.menu?.open).toBe(false);
    expect(host.trigger?.getAttribute("aria-expanded")).toBe("false");
  });

  it("disables only the chevron and closes an open menu", () => {
    const { host, primary } = createSplitButton();
    host.show();
    host.disabled = true;
    expect(host.trigger?.disabled).toBe(true);
    expect(host.open).toBe(false);
    expect(primary.disabled).toBe(false);
    host.disabled = false;
    expect(host.trigger?.disabled).toBe(false);
  });

  it("leaves the primary button's click to the consumer", () => {
    const { host, primary } = createSplitButton();
    const clicked = vi.fn();
    primary.addEventListener("click", clicked);
    primary.click();
    expect(clicked).toHaveBeenCalledTimes(1);
    expect(host.open).toBe(false);
  });
});
