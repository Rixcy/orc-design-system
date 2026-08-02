// @vitest-environment happy-dom

import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import {
  OrcCombobox,
  type OrcComboboxGroup,
  type OrcComboboxOption,
} from "../src/components/orc-combobox";

beforeAll(() => {
  if (!customElements.get("orc-combobox")) {
    customElements.define("orc-combobox", OrcCombobox);
  }
});

afterEach(() => {
  document.body.replaceChildren();
});

const openRun: OrcComboboxOption = {
  id: "open-run",
  label: "Open run",
  description: "Open the selected run in Orc",
  keywords: ["view", "inspect"],
};

const archivedRun: OrcComboboxOption = {
  id: "archived-run",
  label: "Open archived run",
  disabled: true,
};

const newRun: OrcComboboxOption = {
  id: "new-run",
  label: "Start a new run",
  description: "Create a run from a prompt",
};

const groups: readonly OrcComboboxGroup[] = [
  {
    id: "recent",
    label: "Recent runs",
    options: [openRun, archivedRun],
  },
  {
    id: "actions",
    label: "Actions",
    options: [newRun],
  },
];

function createCombobox(options = groups): OrcCombobox {
  const host = document.createElement("orc-combobox") as OrcCombobox;
  host.setAttribute("label", "Run actions");
  host.options = options;
  document.body.append(host);
  return host;
}

function input(host: OrcCombobox): HTMLInputElement {
  const element = host.input;
  if (!element) throw new Error("Expected orc-combobox to expose its input.");
  return element;
}

function rows(host: OrcCombobox): HTMLElement[] {
  return [...(host.shadowRoot?.querySelectorAll<HTMLElement>(".option") ?? [])];
}

function row(host: OrcCombobox, id: string): HTMLElement {
  const element = rows(host).find((candidate) => candidate.dataset.optionId === id);
  if (!element) throw new Error(`Expected option row ${id}.`);
  return element;
}

describe("orc-combobox", () => {
  it("renders named groups and keeps every ARIA target in its shadow root", () => {
    const host = createCombobox();
    const control = input(host);
    const listbox = host.shadowRoot!.querySelector<HTMLElement>('[role="listbox"]')!;

    expect(control.getAttribute("role")).toBe("combobox");
    expect(control.getAttribute("aria-autocomplete")).toBe("list");
    expect(control.getAttribute("aria-controls")).toBe(listbox.id);
    expect(control.getAttribute("aria-labelledby")).toBe(
      host.shadowRoot!.querySelector("label")!.id,
    );
    expect(control.getAttribute("aria-expanded")).toBe("true");
    const renderedGroups = [
      ...host.shadowRoot!.querySelectorAll<HTMLElement>('[role="group"]'),
    ];
    expect(renderedGroups).toHaveLength(2);
    expect(renderedGroups.map((group) => group.getAttribute("aria-label"))).toEqual([
      "Recent runs",
      "Actions",
    ]);
    expect(host.shadowRoot!.querySelectorAll('[role="option"]')).toHaveLength(3);
    expect(host.shadowRoot!.getElementById(control.getAttribute("aria-activedescendant")!)).toBe(
      row(host, "open-run"),
    );
  });

  it("uses aria-label without an empty visible label", () => {
    const host = createCombobox();
    host.removeAttribute("label");
    host.setAttribute("aria-label", "Available commands");

    expect(host.shadowRoot!.querySelector("label")?.hidden).toBe(true);
    expect(input(host).getAttribute("aria-label")).toBe("Available commands");
    expect(input(host).hasAttribute("aria-labelledby")).toBe(false);
  });

  it("filters labels, descriptions, and keywords while announcing result states", () => {
    const host = createCombobox();
    const control = input(host);
    const status = host.shadowRoot!.querySelector<HTMLElement>(".status")!;

    expect(status.textContent).toBe("3 actions available");

    control.value = "inspect";
    control.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    expect(host.value).toBe("inspect");
    expect(host.getAttribute("value")).toBe("inspect");
    expect(rows(host).map((option) => option.dataset.optionId)).toEqual(["open-run"]);
    expect(status.textContent).toBe("1 action available");

    host.value = "missing";
    expect(rows(host)).toHaveLength(0);
    expect(control.hasAttribute("aria-activedescendant")).toBe(false);
    expect(control.getAttribute("aria-expanded")).toBe("false");
    expect(status.textContent).toBe("No matching actions");

    host.value = "";
    host.options = [];
    expect(status.textContent).toBe("No actions available");
  });

  it("publishes one native input event after synchronizing its value", () => {
    const host = createCombobox();
    const observedValues: string[] = [];
    host.addEventListener("input", () => observedValues.push(host.value));

    const control = input(host);
    control.value = "new";
    control.dispatchEvent(new Event("input", { bubbles: true, composed: true }));

    expect(observedValues).toEqual(["new"]);
  });

  it("keeps focus on the input while keyboard navigation skips disabled rows", () => {
    const host = createCombobox();
    const control = input(host);
    control.focus();

    control.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    expect(host.shadowRoot?.activeElement).toBe(control);
    expect(document.activeElement).toBe(host);
    expect(control.getAttribute("aria-activedescendant")).toBe(row(host, "new-run").id);
    expect(row(host, "archived-run").getAttribute("aria-disabled")).toBe("true");

    control.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    expect(control.getAttribute("aria-activedescendant")).toBe(row(host, "open-run").id);
    control.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    expect(control.getAttribute("aria-activedescendant")).toBe(row(host, "new-run").id);
  });

  it("activates the exact option once from Enter or pointer input outside IME composition", () => {
    const host = createCombobox();
    const activated: OrcComboboxOption[] = [];
    host.addEventListener("activate", (event) => {
      activated.push((event as CustomEvent<OrcComboboxOption>).detail);
    });

    const composingEnter = new KeyboardEvent("keydown", {
      key: "Enter",
      bubbles: true,
      cancelable: true,
      isComposing: true,
    });
    input(host).dispatchEvent(composingEnter);
    expect(activated).toHaveLength(0);
    expect(composingEnter.defaultPrevented).toBe(false);

    input(host).dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
    );
    expect(activated).toEqual([openRun]);
    expect(activated[0]).toBe(openRun);

    row(host, "new-run").dispatchEvent(new Event("pointermove", { bubbles: true }));
    row(host, "new-run").click();
    expect(activated).toEqual([openRun, newRun]);
    expect(host.shadowRoot?.activeElement).toBe(input(host));

    const disabled = row(host, "archived-run");
    const pointerdown = new Event("pointerdown", { bubbles: true, cancelable: true });
    disabled.dispatchEvent(pointerdown);
    expect(pointerdown.defaultPrevented).toBe(true);

    const outside = document.createElement("button");
    document.body.append(outside);
    outside.focus();
    disabled.click();
    expect(activated).toHaveLength(2);
    expect(host.shadowRoot?.activeElement).toBe(input(host));
  });

  it("emits one non-bubbling cancelable Escape intent and prevents key default", () => {
    const host = createCombobox();
    host.value = "open";
    const ancestorCancel = vi.fn();
    const cancelEvents: Event[] = [];
    document.body.addEventListener("cancel", ancestorCancel);
    host.addEventListener("cancel", (event) => cancelEvents.push(event));

    const escape = new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
      cancelable: true,
    });
    input(host).dispatchEvent(escape);
    document.body.removeEventListener("cancel", ancestorCancel);

    expect(escape.defaultPrevented).toBe(true);
    expect(cancelEvents).toHaveLength(1);
    expect(cancelEvents[0]?.bubbles).toBe(false);
    expect(cancelEvents[0]?.cancelable).toBe(true);
    expect(cancelEvents[0]?.composed).toBe(true);
    expect(ancestorCancel).not.toHaveBeenCalled();
    expect(host.value).toBe("open");
  });

  it("scrolls a valid active option into view after filter and option rerenders", () => {
    const host = createCombobox();
    const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;
    const scrollIntoView = vi.fn();
    HTMLElement.prototype.scrollIntoView = scrollIntoView;

    try {
      host.value = "new";
      expect(scrollIntoView).toHaveBeenLastCalledWith({
        block: "nearest",
        behavior: "auto",
      });

      scrollIntoView.mockClear();
      host.options = [
        { id: "updated", label: "Updated actions", options: [newRun] },
      ];
      expect(scrollIntoView).toHaveBeenCalledOnce();
      expect(scrollIntoView).toHaveBeenCalledWith({
        block: "nearest",
        behavior: "auto",
      });
    } finally {
      HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
    }
  });

  it("updates loading and option data at runtime without stale active IDs", () => {
    const host = createCombobox();
    const control = input(host);
    const listbox = host.shadowRoot!.querySelector<HTMLElement>('[role="listbox"]')!;
    const status = host.shadowRoot!.querySelector<HTMLElement>(".status")!;

    host.loading = true;
    expect(listbox.getAttribute("aria-busy")).toBe("true");
    expect(listbox.hidden).toBe(true);
    expect(control.hasAttribute("aria-activedescendant")).toBe(false);
    expect(status.textContent).toBe("Loading actions");

    host.options = [
      { id: "updated", label: "Updated actions", options: [newRun] },
    ];
    host.loading = false;
    expect(listbox.getAttribute("aria-busy")).toBe("false");
    expect(control.getAttribute("aria-activedescendant")).toBe(row(host, "new-run").id);

    host.options = [];
    expect(control.hasAttribute("aria-activedescendant")).toBe(false);
  });
});
