// @vitest-environment happy-dom

import { afterEach, beforeAll, describe, expect, it } from "vitest";

import { OrcTabs } from "../src/components/orc-tabs";

beforeAll(() => {
  if (!customElements.get("orc-tabs")) {
    customElements.define("orc-tabs", OrcTabs);
  }
});

afterEach(() => {
  document.body.replaceChildren();
});

function createTabs(labels: string[] = ["Overview", "Details", "Settings"]): HTMLElement {
  const host = document.createElement("orc-tabs");
  for (const label of labels) {
    const panel = document.createElement("div");
    panel.setAttribute("data-tab", label);
    panel.textContent = `${label} content`;
    host.append(panel);
  }
  document.body.append(host);
  return host;
}

function getTabButtons(host: Element): HTMLButtonElement[] {
  return [
    ...(host.shadowRoot?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? []),
  ];
}

function getTabPanels(host: Element): HTMLElement[] {
  return [
    ...(host.shadowRoot?.querySelectorAll<HTMLElement>('[role="tabpanel"]') ?? []),
  ];
}

describe("orc-tabs", () => {
  it("renders a tablist with a tab per data-tab child and matching tabpanels", () => {
    const host = createTabs();
    const tablist = host.shadowRoot?.querySelector('[role="tablist"]');
    expect(tablist).not.toBeNull();

    const tabs = getTabButtons(host);
    const panels = getTabPanels(host);
    expect(tabs).toHaveLength(3);
    expect(panels).toHaveLength(3);
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      "Overview",
      "Details",
      "Settings",
    ]);
  });

  it("uses a green surface tint for keyboard focus without changing geometry", () => {
    const host = createTabs();
    const css = host.shadowRoot?.querySelector("style")?.textContent ?? "";
    const focused = css.slice(css.indexOf('[role="tab"]:focus-visible'));
    const focusBlock = focused.slice(0, focused.indexOf("}"));
    const selected = css.slice(css.indexOf('[role="tab"][aria-selected="true"]'));
    const selectedBlock = selected.slice(0, selected.indexOf("}"));

    expect(focusBlock).toContain("outline: none");
    expect(focusBlock).toContain(
      "background: color-mix(in srgb, var(--orc-green, #9dc76b) 12%, transparent)",
    );
    expect(focusBlock).not.toContain("box-shadow");
    expect(focusBlock).not.toContain("border");
    expect(focusBlock).not.toContain("padding");
    expect(focusBlock).not.toContain("margin");
    expect(focusBlock).not.toContain("--orc-focus-ring");
    expect(focusBlock).not.toContain("outline-offset");

    expect(selectedBlock).toContain("color: var(--orc-green-text");
    expect(selectedBlock).toContain(
      "border-bottom-color: var(--orc-green, #9dc76b)",
    );
    expect(selectedBlock).not.toContain("--orc-accent");
    expect(css).toContain("border-bottom: 2px solid transparent");
  });

  it("wires aria-controls and aria-labelledby between tabs and panels", () => {
    const host = createTabs();
    const tabs = getTabButtons(host);
    const panels = getTabPanels(host);

    tabs.forEach((tab, index) => {
      const panel = panels[index];
      expect(tab.getAttribute("aria-controls")).toBe(panel.id);
      expect(panel.getAttribute("aria-labelledby")).toBe(tab.id);
    });
  });

  it("selects the first tab by default and hides other panels", () => {
    const host = createTabs();
    const tabs = getTabButtons(host);
    const panels = getTabPanels(host);

    expect(tabs[0].getAttribute("aria-selected")).toBe("true");
    expect(tabs[1].getAttribute("aria-selected")).toBe("false");
    expect(tabs[2].getAttribute("aria-selected")).toBe("false");

    expect(panels[0].hidden).toBe(false);
    expect(panels[1].hidden).toBe(true);
    expect(panels[2].hidden).toBe(true);
  });

  it("moves aria-selected on click and reflects the selected attribute", () => {
    const host = createTabs();
    const tabs = getTabButtons(host);

    tabs[1].click();

    expect(tabs[0].getAttribute("aria-selected")).toBe("false");
    expect(tabs[1].getAttribute("aria-selected")).toBe("true");
    expect(host.getAttribute("selected")).toBe("1");
  });

  it("fires a composed change CustomEvent with index and label on selection", () => {
    const host = createTabs();
    const tabs = getTabButtons(host);
    let detail: { index: number; label: string } | undefined;
    host.addEventListener("change", (event) => {
      detail = (event as CustomEvent).detail;
    });

    tabs[2].click();

    expect(detail).toEqual({ index: 2, label: "Settings" });
  });

  it("moves selection and focus with ArrowRight, wrapping at the end", () => {
    const host = createTabs();
    const tablist = host.shadowRoot?.querySelector('[role="tablist"]') as HTMLElement;
    const tabs = getTabButtons(host);

    tablist.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
    );
    expect(tabs[1].getAttribute("aria-selected")).toBe("true");
    expect(host.shadowRoot?.activeElement).toBe(tabs[1]);

    tablist.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
    );
    expect(tabs[2].getAttribute("aria-selected")).toBe("true");

    tablist.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
    );
    expect(tabs[0].getAttribute("aria-selected")).toBe("true");
  });

  it("moves selection with ArrowLeft, wrapping at the start", () => {
    const host = createTabs();
    const tablist = host.shadowRoot?.querySelector('[role="tablist"]') as HTMLElement;
    const tabs = getTabButtons(host);

    tablist.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }),
    );
    expect(tabs[2].getAttribute("aria-selected")).toBe("true");
  });

  it("moves to the last tab on End and back to the first on Home", () => {
    const host = createTabs();
    const tablist = host.shadowRoot?.querySelector('[role="tablist"]') as HTMLElement;
    const tabs = getTabButtons(host);

    tablist.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    expect(tabs[2].getAttribute("aria-selected")).toBe("true");

    tablist.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    expect(tabs[0].getAttribute("aria-selected")).toBe("true");
  });

  it("keeps a roving tabindex: only the selected tab is tabbable", () => {
    const host = createTabs();
    const tablist = host.shadowRoot?.querySelector('[role="tablist"]') as HTMLElement;
    const tabs = getTabButtons(host);

    expect(tabs.filter((tab) => tab.tabIndex === 0)).toHaveLength(1);
    expect(tabs[0].tabIndex).toBe(0);

    tablist.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
    );

    expect(tabs.filter((tab) => tab.tabIndex === 0)).toHaveLength(1);
    expect(tabs[1].tabIndex).toBe(0);
    expect(tabs[0].tabIndex).toBe(-1);
    expect(tabs[2].tabIndex).toBe(-1);
  });

  it("honors an initial selected attribute set as an index", () => {
    const host = document.createElement("orc-tabs");
    host.setAttribute("selected", "2");
    for (const label of ["Overview", "Details", "Settings"]) {
      const panel = document.createElement("div");
      panel.setAttribute("data-tab", label);
      host.append(panel);
    }
    document.body.append(host);

    const tabs = getTabButtons(host);
    expect(tabs[2].getAttribute("aria-selected")).toBe("true");
  });

  it("honors an initial selected attribute set as a label", () => {
    const host = document.createElement("orc-tabs");
    host.setAttribute("selected", "Details");
    for (const label of ["Overview", "Details", "Settings"]) {
      const panel = document.createElement("div");
      panel.setAttribute("data-tab", label);
      host.append(panel);
    }
    document.body.append(host);

    const tabs = getTabButtons(host);
    expect(tabs[1].getAttribute("aria-selected")).toBe("true");
  });
});
