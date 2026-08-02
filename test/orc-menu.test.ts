// @vitest-environment happy-dom

import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { OrcMenu, type OrcMenuCloseDetail } from "../src/components/orc-menu";

beforeAll(() => {
  if (!customElements.get("orc-menu")) customElements.define("orc-menu", OrcMenu);
});

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

function createItem(
  label: string,
  role: "menuitem" | "menuitemradio" = "menuitem",
): HTMLButtonElement {
  const item = document.createElement("button");
  item.type = "button";
  item.setAttribute("role", role);
  item.textContent = label;
  return item;
}

function createMenu(items: HTMLElement[] = [createItem("Open run"), createItem("Archive")]): OrcMenu {
  const host = document.createElement("orc-menu") as OrcMenu;
  host.setAttribute("label", "Run actions");
  const triggerLabel = document.createElement("span");
  triggerLabel.slot = "trigger";
  triggerLabel.textContent = "Actions";
  host.append(triggerLabel, ...items);
  document.body.append(host);
  return host;
}

function activeItem(host: OrcMenu): HTMLElement | null {
  return host.contains(document.activeElement)
    ? (document.activeElement as HTMLElement)
    : null;
}

describe("orc-menu", () => {
  it("owns a named native trigger and menu relationship", () => {
    const host = createMenu();
    const semanticMenu = host.shadowRoot?.querySelector<HTMLElement>(".menu-surface");
    expect(host.trigger?.tagName).toBe("BUTTON");
    expect(host.trigger?.getAttribute("aria-haspopup")).toBe("menu");
    expect(host.trigger?.getAttribute("aria-expanded")).toBe("false");
    expect(host.trigger?.getAttribute("aria-controls")).toBe(semanticMenu?.id);
    expect(semanticMenu?.getAttribute("role")).toBe("menu");
    expect(semanticMenu?.getAttribute("aria-label")).toBe("Run actions");
  });

  it("supports an explicit accessible name for an icon-only trigger", () => {
    const host = createMenu();
    host.setAttribute("trigger-label", "Open run actions");
    expect(host.trigger?.getAttribute("aria-label")).toBe("Open run actions");

    host.removeAttribute("trigger-label");
    expect(host.trigger?.hasAttribute("aria-label")).toBe(false);
  });

  it("reflects open state through property, methods, ARIA, and events", () => {
    const host = createMenu();
    const opened = vi.fn();
    const closed = vi.fn<EventListener>();
    host.addEventListener("open", opened);
    host.addEventListener("close", closed);

    host.show();
    expect(host.open).toBe(true);
    expect(host.hasAttribute("open")).toBe(true);
    expect(host.trigger?.getAttribute("aria-expanded")).toBe("true");
    expect(host.menu?.classList.contains("open")).toBe(true);
    expect(opened).toHaveBeenCalledOnce();

    host.close();
    expect(host.open).toBe(false);
    expect(host.trigger?.getAttribute("aria-expanded")).toBe("false");
    expect((closed.mock.calls[0]?.[0] as CustomEvent<OrcMenuCloseDetail>).detail).toEqual({
      reason: "programmatic",
    });

    host.open = true;
    expect(host.hasAttribute("open")).toBe(true);
    host.open = false;
    expect((closed.mock.calls[1]?.[0] as CustomEvent<OrcMenuCloseDetail>).detail).toEqual({
      reason: "attribute",
    });
  });

  it("opens from the trigger and focuses the first enabled item", () => {
    const disabled = createItem("Unavailable");
    disabled.disabled = true;
    const available = createItem("Available");
    const host = createMenu([disabled, available]);

    host.trigger?.click();
    expect(host.open).toBe(true);
    expect(activeItem(host)).toBe(available);
    expect(disabled.tabIndex).toBe(-1);
    expect(available.tabIndex).toBe(0);
  });

  it("opens to the last enabled item from ArrowUp", () => {
    const first = createItem("First");
    const disabled = createItem("Disabled");
    disabled.setAttribute("aria-disabled", "true");
    const last = createItem("Last");
    const host = createMenu([first, disabled, last]);

    host.trigger?.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, key: "ArrowUp" }),
    );
    expect(activeItem(host)).toBe(last);
  });

  it("does not activate or close for an aria-disabled item", () => {
    const disabled = createItem("Disabled");
    disabled.setAttribute("aria-disabled", "true");
    const clicked = vi.fn();
    disabled.addEventListener("click", clicked);
    const host = createMenu([disabled, createItem("Available")]);
    host.show();

    disabled.click();
    expect(clicked).not.toHaveBeenCalled();
    expect(host.open).toBe(true);
  });

  it("moves through enabled items with arrows and Home/End", () => {
    const first = createItem("First");
    const disabled = createItem("Disabled");
    disabled.disabled = true;
    const last = createItem("Last");
    const host = createMenu([first, disabled, last]);
    host.show();

    first.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, composed: true, key: "ArrowDown" }));
    expect(activeItem(host)).toBe(last);
    last.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, composed: true, key: "ArrowDown" }));
    expect(activeItem(host)).toBe(first);
    first.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, composed: true, key: "End" }));
    expect(activeItem(host)).toBe(last);
    last.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, composed: true, key: "Home" }));
    expect(activeItem(host)).toBe(first);
  });

  it("dismisses on Escape, emits a reason, and returns trigger focus", () => {
    const host = createMenu();
    const closed = vi.fn<EventListener>();
    host.addEventListener("close", closed);
    host.show();

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(host.open).toBe(false);
    expect((closed.mock.calls[0]?.[0] as CustomEvent<OrcMenuCloseDetail>).detail).toEqual({
      reason: "escape",
    });
    expect(host.shadowRoot?.activeElement).toBe(host.trigger);
  });

  it("allows a consumer to cancel light dismissal", () => {
    const host = createMenu();
    host.addEventListener("cancel", (event) => event.preventDefault());
    host.show();
    window.dispatchEvent(new PointerEvent("pointerdown"));
    expect(host.open).toBe(true);
  });

  it("keeps inside interactions open and closes for outside pointer or scroll", () => {
    const host = createMenu();
    host.show();

    host.menu?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true }));
    host.menu?.dispatchEvent(new Event("scroll", { composed: true }));
    expect(host.open).toBe(true);

    window.dispatchEvent(new PointerEvent("pointerdown"));
    expect(host.open).toBe(false);

    host.show();
    window.dispatchEvent(new Event("scroll"));
    expect(host.open).toBe(false);
  });

  it("closes on Tab without trapping or returning focus", () => {
    const first = createItem("First");
    const host = createMenu([first]);
    host.show();
    first.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, composed: true, key: "Tab" }));

    expect(host.open).toBe(false);
    expect(host.shadowRoot?.activeElement).not.toBe(host.trigger);
  });

  it("activates keyboard items and returns focus after a selection", () => {
    const item = createItem("Choose");
    const clicked = vi.fn();
    item.addEventListener("click", clicked);
    const host = createMenu([item]);
    host.show();

    item.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, composed: true, key: "Enter" }));
    expect(clicked).toHaveBeenCalledOnce();
    expect(host.open).toBe(false);
    expect(host.shadowRoot?.activeElement).toBe(host.trigger);
  });

  it("preserves grouped radio semantics and skips disabled radios", () => {
    const group = document.createElement("div");
    group.setAttribute("role", "group");
    group.setAttribute("aria-label", "Status");
    const selected = createItem("All", "menuitemradio");
    selected.setAttribute("aria-checked", "true");
    const disabled = createItem("Archived", "menuitemradio");
    disabled.setAttribute("aria-checked", "false");
    disabled.setAttribute("aria-disabled", "true");
    group.append(selected, disabled);
    const host = createMenu([group]);
    host.show();

    expect(group.getAttribute("role")).toBe("group");
    expect(selected.getAttribute("role")).toBe("menuitemradio");
    expect(selected.getAttribute("aria-checked")).toBe("true");
    expect(activeItem(host)).toBe(selected);
  });

  it("renders a stable empty state and bounds long content without shadows", () => {
    const host = createMenu([]);
    host.show();
    const empty = host.shadowRoot?.querySelector<HTMLElement>(".empty");
    const css = host.shadowRoot?.querySelector("style")?.textContent ?? "";

    expect(empty?.hidden).toBe(false);
    expect(empty?.textContent).toContain("No actions available");
    expect(empty?.getAttribute("role")).toBe("status");
    expect(empty?.getAttribute("aria-live")).toBe("polite");
    expect(empty?.getAttribute("aria-atomic")).toBe("true");
    expect(empty?.hasAttribute("aria-disabled")).toBe(false);
    expect(empty?.hasAttribute("tabindex")).toBe(false);
    expect(css).toContain("calc(100vw - 16px)");
    expect(css).toContain("max-block-size");
    expect(css).toContain("prefers-reduced-motion: no-preference");
    expect(css).not.toContain("box-shadow");
  });

  it("removes global listeners when disconnected", () => {
    const host = createMenu();
    const closed = vi.fn();
    host.addEventListener("close", closed);
    host.show();
    host.remove();

    window.dispatchEvent(new PointerEvent("pointerdown"));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(closed).not.toHaveBeenCalled();
  });
});
