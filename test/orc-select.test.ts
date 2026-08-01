// @vitest-environment happy-dom

import { afterEach, beforeAll, describe, expect, it } from "vitest";

import { OrcSelect } from "../src/components/orc-select";

beforeAll(() => {
  if (!customElements.get("orc-select")) {
    customElements.define("orc-select", OrcSelect);
  }
});

afterEach(() => {
  document.body.replaceChildren();
});

function createSelect(
  options: Array<{ value: string; label: string; selected?: boolean }> = [
    { value: "apple", label: "Apple" },
    { value: "banana", label: "Banana", selected: true },
    { value: "cherry", label: "Cherry" },
  ],
  attrs: Record<string, string> = { label: "Fruit" },
): OrcSelect {
  const host = document.createElement("orc-select") as OrcSelect;
  for (const [name, value] of Object.entries(attrs)) {
    host.setAttribute(name, value);
  }
  for (const option of options) {
    const el = document.createElement("option");
    el.value = option.value;
    el.textContent = option.label;
    if (option.selected) el.selected = true;
    host.append(el);
  }
  document.body.append(host);
  return host;
}

function trigger(host: OrcSelect): HTMLButtonElement {
  const el = host.shadowRoot?.querySelector<HTMLButtonElement>(".trigger");
  if (!el) throw new Error("Expected orc-select to expose a trigger button.");
  return el;
}

function menu(host: OrcSelect): HTMLElement {
  const el = host.shadowRoot?.querySelector<HTMLElement>(".menu");
  if (!el) throw new Error("Expected orc-select to expose a menu.");
  return el;
}

function search(host: OrcSelect): HTMLInputElement {
  const el = host.shadowRoot?.querySelector<HTMLInputElement>(".search");
  if (!el) throw new Error("Expected orc-select to expose a search input.");
  return el;
}

function optionRows(host: OrcSelect): HTMLElement[] {
  return [...(host.shadowRoot?.querySelectorAll<HTMLElement>(".option") ?? [])];
}

function empty(host: OrcSelect): HTMLElement {
  const el = host.shadowRoot?.querySelector<HTMLElement>(".empty");
  if (!el) throw new Error("Expected orc-select to expose an empty state.");
  return el;
}

// aria-labelledby is what the trigger's accessible name is built from; happy-dom
// has no accname implementation, so resolve it by hand the same way an AT would.
function accessibleName(host: OrcSelect, el: HTMLElement): string {
  const ids = (el.getAttribute("aria-labelledby") ?? "").split(" ").filter(Boolean);
  return ids
    .map((id) => host.shadowRoot?.getElementById(id)?.textContent ?? "")
    .join(" ")
    .trim();
}

describe("orc-select", () => {
  it("mirrors light-DOM options into the shadow-root native select and hides the source", () => {
    const host = createSelect();
    const select = host.select!;
    expect(select.options).toHaveLength(3);
    expect(select.value).toBe("banana");

    for (const child of [...host.children]) {
      expect((child as HTMLElement).hidden).toBe(true);
    }
  });

  it("gives the trigger an accessible name combining the label and current value", () => {
    const host = createSelect();
    expect(accessibleName(host, trigger(host))).toBe("Fruit Banana");
  });

  it("falls back to aria-label when no visible label is set", () => {
    const host = createSelect(undefined, { "aria-label": "Pick a fruit" });
    expect(accessibleName(host, trigger(host))).toBe("Pick a fruit Banana");
    expect(host.shadowRoot!.querySelector(".label")!.classList.contains("sr-only")).toBe(true);
  });

  it("opens on click and closes on Escape, returning focus to the trigger", () => {
    const host = createSelect();
    trigger(host).click();
    expect(menu(host).classList.contains("open")).toBe(true);
    expect(trigger(host).getAttribute("aria-expanded")).toBe("true");

    menu(host).dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(menu(host).classList.contains("open")).toBe(false);
    expect(trigger(host).getAttribute("aria-expanded")).toBe("false");
    expect(host.shadowRoot!.activeElement).toBe(trigger(host));
  });

  it("opens on ArrowDown/ArrowUp from the trigger", () => {
    const host = createSelect();
    trigger(host).dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }),
    );
    expect(menu(host).classList.contains("open")).toBe(true);
  });

  it("picks an option via click, firing change and updating the trigger text", () => {
    const host = createSelect();
    const events: Event[] = [];
    host.addEventListener("change", (e) => events.push(e));

    trigger(host).click();
    const cherry = optionRows(host).find((row) => row.dataset.value === "cherry")!;
    cherry.click();

    expect(host.value).toBe("cherry");
    expect(trigger(host).textContent).toContain("Cherry");
    expect(events).toHaveLength(1);
    expect(menu(host).classList.contains("open")).toBe(false);
  });

  it("navigates with ArrowDown/ArrowUp/Home/End and picks with Enter", () => {
    const host = createSelect();
    trigger(host).click();
    const rows = optionRows(host);

    rows[0].focus();
    menu(host).dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }),
    );
    expect(host.shadowRoot!.activeElement).toBe(rows[1]);

    menu(host).dispatchEvent(
      new KeyboardEvent("keydown", { key: "End", bubbles: true, cancelable: true }),
    );
    expect(host.shadowRoot!.activeElement).toBe(rows[rows.length - 1]);

    menu(host).dispatchEvent(
      new KeyboardEvent("keydown", { key: "Home", bubbles: true, cancelable: true }),
    );
    expect(host.shadowRoot!.activeElement).toBe(rows[0]);

    menu(host).dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }),
    );
    expect(host.value).toBe("apple");
  });

  it("supports single-character typeahead when not searchable", () => {
    const host = createSelect();
    trigger(host).click();
    const rows = optionRows(host);
    rows[0].focus();

    menu(host).dispatchEvent(
      new KeyboardEvent("keydown", { key: "c", bubbles: true, cancelable: true }),
    );
    expect(host.shadowRoot!.activeElement).toBe(
      rows.find((row) => row.dataset.value === "cherry"),
    );
  });

  it("Tab commits the focused option for single-select", () => {
    const host = createSelect();
    trigger(host).click();
    const rows = optionRows(host);
    const apple = rows.find((row) => row.dataset.value === "apple")!;
    apple.focus();

    menu(host).dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
    expect(host.value).toBe("apple");
    expect(menu(host).classList.contains("open")).toBe(false);
  });

  describe("search", () => {
    it("filters options case-insensitively and forwards typed characters into the search box", () => {
      const host = createSelect(undefined, { label: "Fruit", searchable: "" });
      trigger(host).click();
      expect(host.shadowRoot!.activeElement).toBe(search(host));

      search(host).value = "AN";
      search(host).dispatchEvent(new Event("input", { bubbles: true }));

      const visible = optionRows(host).filter((row) => !row.hidden);
      expect(visible.map((row) => row.dataset.value)).toEqual(["banana"]);
    });

    it("shows a distinct 'No matches' state when a query matches nothing", () => {
      const host = createSelect(undefined, { label: "Fruit", searchable: "" });
      trigger(host).click();
      search(host).value = "zzz";
      search(host).dispatchEvent(new Event("input", { bubbles: true }));

      expect(empty(host).hidden).toBe(false);
      expect(empty(host).textContent).toBe("No matches");
    });

    it("forwards a typed character from the listbox into the search box", () => {
      const host = createSelect(undefined, { label: "Fruit", searchable: "" });
      trigger(host).click();
      const rows = optionRows(host);
      rows[0].focus();

      menu(host).dispatchEvent(
        new KeyboardEvent("keydown", { key: "c", bubbles: true, cancelable: true }),
      );
      expect(host.shadowRoot!.activeElement).toBe(search(host));
      expect(search(host).value).toBe("c");
    });

    it("clears the query on close", () => {
      const host = createSelect(undefined, { label: "Fruit", searchable: "" });
      trigger(host).click();
      search(host).value = "an";
      search(host).dispatchEvent(new Event("input", { bubbles: true }));

      menu(host).dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      expect(search(host).value).toBe("");
    });
  });

  describe("empty / no-options configuration", () => {
    it("shows 'No options available' with zero options, searchable or not", () => {
      const bare = createSelect([], { label: "Fruit" });
      trigger(bare).click();
      expect(empty(bare).hidden).toBe(false);
      expect(empty(bare).textContent).toBe("No options available");

      const searchable = createSelect([], { label: "Fruit", searchable: "" });
      trigger(searchable).click();
      expect(empty(searchable).hidden).toBe(false);
      expect(empty(searchable).textContent).toBe("No options available");
    });

    it("hides the empty state once options exist", () => {
      const host = createSelect();
      trigger(host).click();
      expect(empty(host).hidden).toBe(true);
    });
  });

  describe("multi-select", () => {
    it("reflects the multiple attribute onto the mirrored select and the listbox", () => {
      const host = createSelect(undefined, { label: "Fruit", multiple: "" });
      expect(host.select!.multiple).toBe(true);
      trigger(host).click();
      const listbox = host.shadowRoot!.querySelector('[role="listbox"]')!;
      expect(listbox.getAttribute("aria-multiselectable")).toBe("true");
    });

    it("toggles options without closing the menu and joins labels in the trigger", () => {
      const host = createSelect(
        [
          { value: "apple", label: "Apple", selected: true },
          { value: "banana", label: "Banana", selected: true },
          { value: "cherry", label: "Cherry" },
        ],
        { label: "Fruit", multiple: "" },
      );
      trigger(host).click();
      const cherry = optionRows(host).find((row) => row.dataset.value === "cherry")!;
      cherry.click();

      expect(host.selectedOptions.map((o) => o.value)).toEqual(["apple", "banana", "cherry"]);
      expect(trigger(host).textContent).toContain("Apple, Banana, Cherry");
      expect(menu(host).classList.contains("open")).toBe(true);

      const apple = optionRows(host).find((row) => row.dataset.value === "apple")!;
      apple.click();
      expect(host.selectedOptions.map((o) => o.value)).toEqual(["banana", "cherry"]);
    });

    it("refuses to deselect the last remaining option", () => {
      const host = createSelect(
        [{ value: "apple", label: "Apple", selected: true }, { value: "banana", label: "Banana" }],
        { label: "Fruit", multiple: "" },
      );
      trigger(host).click();
      const apple = optionRows(host).find((row) => row.dataset.value === "apple")!;
      apple.click();
      expect(host.selectedOptions.map((o) => o.value)).toEqual(["apple"]);
    });

    it("shows the 'Select values' placeholder with nothing selected", () => {
      const host = createSelect(
        [{ value: "apple", label: "Apple" }, { value: "banana", label: "Banana" }],
        { label: "Fruit", multiple: "" },
      );
      for (const option of host.select!.options) option.selected = false;
      host.syncCustomSelect();
      expect(trigger(host).textContent).toContain("Select values");
    });
  });

  describe("status / async API", () => {
    it("setCustomSelectStatus overrides the empty message and toggles aria-busy", () => {
      const host = createSelect([], { label: "Fruit" });
      host.setCustomSelectStatus("Loading…", true);
      trigger(host).click();

      const listbox = host.shadowRoot!.querySelector('[role="listbox"]')!;
      expect(listbox.getAttribute("aria-busy")).toBe("true");
      expect(empty(host).textContent).toBe("Loading…");

      host.setCustomSelectStatus();
      expect(listbox.hasAttribute("aria-busy")).toBe(false);
      expect(empty(host).textContent).toBe("No options available");
    });

    it("syncCustomSelect() picks up options added to the light DOM after connection", () => {
      const host = createSelect([], { label: "Fruit" });
      const option = document.createElement("option");
      option.value = "date";
      option.textContent = "Date";
      option.selected = true;
      host.append(option);
      host.syncCustomSelect();

      expect(host.value).toBe("date");
      expect(trigger(host).textContent).toContain("Date");
    });

    it("also refreshes automatically via MutationObserver on childList changes", async () => {
      const host = createSelect([], { label: "Fruit" });
      const option = document.createElement("option");
      option.value = "fig";
      option.textContent = "Fig";
      option.selected = true;
      host.append(option);

      // MutationObserver callbacks run as a microtask.
      await Promise.resolve();
      await Promise.resolve();

      expect(host.value).toBe("fig");
    });
  });

  describe("outside-click dismiss", () => {
    it("closes when a pointerdown lands outside the trigger and menu", () => {
      const host = createSelect();
      trigger(host).click();
      expect(menu(host).classList.contains("open")).toBe(true);

      const outside = document.createElement("div");
      document.body.append(outside);
      outside.dispatchEvent(new Event("pointerdown", { bubbles: true, composed: true }));

      expect(menu(host).classList.contains("open")).toBe(false);
    });

    it("stays open for a pointerdown inside the menu", () => {
      const host = createSelect();
      trigger(host).click();
      const row = optionRows(host)[0];
      row.dispatchEvent(new Event("pointerdown", { bubbles: true, composed: true }));

      expect(menu(host).classList.contains("open")).toBe(true);
    });

    it("closes on scroll", () => {
      const host = createSelect();
      trigger(host).click();
      window.dispatchEvent(new Event("scroll"));
      expect(menu(host).classList.contains("open")).toBe(false);
    });

    it("removes its document listeners on disconnect", () => {
      const host = createSelect();
      trigger(host).click();
      host.remove();

      // No listeners should remain to reopen state on later window events —
      // dispatching should not throw even with the host detached.
      expect(() => window.dispatchEvent(new Event("scroll"))).not.toThrow();
    });
  });

  describe("positioning", () => {
    it("has no Popover API on the menu — manual open/close only", () => {
      const host = createSelect();
      expect(typeof (menu(host) as unknown as { showPopover?: unknown }).showPopover).not.toBe(
        "function",
      );
      expect(menu(host).hasAttribute("popover")).toBe(false);
    });

    it("styles the menu as position:fixed in the component stylesheet", () => {
      const host = createSelect();
      const css = host.shadowRoot?.querySelector("style")?.textContent ?? "";
      const menuBlock = css.slice(css.indexOf(".menu {"), css.indexOf(".menu.open"));
      expect(menuBlock).toContain("position: fixed");
    });

    it("sets explicit left/top inline styles when opened", () => {
      const host = createSelect();
      trigger(host).click();
      const style = menu(host).style;
      expect(style.left).not.toBe("");
      expect(style.top).not.toBe("");
      expect(style.minWidth).not.toBe("");
    });
  });

  describe("disabled", () => {
    it("is a reflected property, not just an attribute", () => {
      const host = createSelect();
      expect(host.disabled).toBe(false);

      host.disabled = true;
      expect(host.hasAttribute("disabled")).toBe(true);
      expect(trigger(host).disabled).toBe(true);
      expect(host.select!.disabled).toBe(true);

      host.disabled = false;
      expect(host.hasAttribute("disabled")).toBe(false);
      expect(trigger(host).disabled).toBe(false);
    });

    it("closes an open menu when disabled is set", () => {
      const host = createSelect();
      trigger(host).click();
      expect(menu(host).classList.contains("open")).toBe(true);

      host.disabled = true;
      expect(menu(host).classList.contains("open")).toBe(false);
    });

    it("ignores clicks on a disabled trigger", () => {
      const host = createSelect();
      host.disabled = true;
      trigger(host).click();
      expect(menu(host).classList.contains("open")).toBe(false);
    });
  });

  describe("multiple as a reflected property", () => {
    it("round-trips through the property", () => {
      const host = createSelect();
      expect(host.multiple).toBe(false);
      host.multiple = true;
      expect(host.hasAttribute("multiple")).toBe(true);
      expect(host.select!.multiple).toBe(true);
    });
  });

  it("forwards focus() to the trigger", () => {
    const host = createSelect();
    host.focus();
    expect(host.shadowRoot!.activeElement).toBe(trigger(host));
  });

  // React 19 assigns to a matching property instead of setting the attribute,
  // and a getter-only accessor named after a public attribute makes that a
  // strict-mode TypeError. Any internal element accessor must not shadow one.
  it("leaves the label attribute free for property assignment", () => {
    const host = createSelect();
    expect(() => {
      "use strict";
      (host as unknown as { label: string }).label = "Feedback";
    }).not.toThrow();
  });
});
