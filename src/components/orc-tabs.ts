const HTMLElementBase = (
  typeof HTMLElement === "undefined" ? class {} : HTMLElement
) as typeof HTMLElement;

const template = `
  <style>
    :host {
      display: block;
      max-inline-size: 100%;
      font-family: var(--orc-font-sans, Inter, ui-sans-serif, system-ui, sans-serif);
    }

    [role="tablist"] {
      position: relative;
      display: flex;
      align-items: center;
      gap: var(--orc-space-2, 0.5rem);
      border-block-end: 1px solid var(--orc-border, #3b4540);
      overflow-x: auto;
    }

    [role="tab"] {
      border: none;
      background: none;
      color: var(--orc-muted-strong, #aeb5b0);
      cursor: pointer;
      padding: var(--orc-space-2, 0.5rem) var(--orc-space-3, 0.75rem);
      font: inherit;
      font-size: 0.875rem;
      white-space: nowrap;
      border-bottom: 2px solid transparent;
      margin-block-end: -1px;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
    }

    [role="tab"]:hover {
      color: var(--orc-text, #c7cfca);
    }

    [role="tab"]:focus-visible {
      outline: none;
      box-shadow: inset 0 -1px 0 var(--orc-green, #9dc76b);
    }

    [role="tab"][aria-selected="true"] {
      color: var(--orc-green-text, var(--orc-green, #9dc76b));
      font-weight: 600;
      border-bottom-color: var(--orc-green, #9dc76b);
    }

    @media (prefers-reduced-motion: no-preference) {
      [role="tab"] {
        transition: color 120ms ease, border-color 120ms ease;
      }
    }

    [role="tabpanel"] {
      padding-block-start: var(--orc-space-3, 0.75rem);
    }

    [role="tabpanel"][hidden] {
      display: none;
    }
  </style>
  <div role="tablist"></div>
  <div class="panels"></div>
`;

interface TabEntry {
  label: string;
  panel: HTMLElement;
}

/**
 * `<orc-tabs>` implements the WAI-ARIA APG Tabs pattern.
 *
 * Content API: provide direct child elements marked with `data-tab="Label"`.
 * Each marked child becomes a tab panel; its `data-tab` value becomes the
 * tab's accessible label. Children are read from light DOM and re-slotted
 * into shadow-rendered tabpanel wrappers so the tab/tabpanel ARIA
 * relationship (aria-controls/aria-labelledby) stays within a single root.
 *
 * ```html
 * <orc-tabs selected="0">
 *   <div data-tab="Overview">Overview content</div>
 *   <div data-tab="Details">Details content</div>
 *   <div data-tab="Settings">Settings content</div>
 * </orc-tabs>
 * ```
 *
 * `selected` accepts either a zero-based index or the tab's label text, and
 * is kept in sync with the current selection. A `change` CustomEvent
 * (composed, bubbles) fires on selection with `detail: { index, label }`.
 *
 * @customElement orc-tabs
 * @attr {string} selected - Selected tab, as a zero-based index or the tab label.
 * @slot - Elements marked with `data-tab="Label"`, each becoming a tab panel.
 * @fires change - `CustomEvent<{ index: number; label: string }>` on selection.
 */
export class OrcTabs extends HTMLElementBase {
  static get observedAttributes(): string[] {
    return ["selected"];
  }

  private tabs: TabEntry[] = [];
  private activeIndex = 0;
  private mutationObserver: MutationObserver | undefined;
  private reflecting = false;

  private readonly onTablistKeydown = (event: KeyboardEvent): void => {
    if (this.tabs.length === 0) return;
    const count = this.tabs.length;
    let nextIndex: number | undefined;

    switch (event.key) {
      case "ArrowRight":
        nextIndex = (this.activeIndex + 1) % count;
        break;
      case "ArrowLeft":
        nextIndex = (this.activeIndex - 1 + count) % count;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = count - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    this.select(nextIndex, { focus: true, emit: true });
  };

  constructor() {
    super();
    this.attachShadow({ mode: "open" }).innerHTML = template;
    this.tablist?.addEventListener("keydown", this.onTablistKeydown);
  }

  connectedCallback(): void {
    this.collectTabs();
    this.render();
    this.applySelectedAttribute();

    this.mutationObserver = new MutationObserver(() => {
      this.collectTabs();
      this.render();
      this.applySelectedAttribute();
    });
    this.mutationObserver.observe(this, { childList: true });
  }

  disconnectedCallback(): void {
    this.mutationObserver?.disconnect();
    this.mutationObserver = undefined;
  }

  attributeChangedCallback(name: string): void {
    if (name === "selected" && !this.reflecting) {
      this.applySelectedAttribute();
    }
  }

  private get tablist(): HTMLElement | null {
    return this.shadowRoot?.querySelector('[role="tablist"]') ?? null;
  }

  private get panelsContainer(): HTMLElement | null {
    return this.shadowRoot?.querySelector(".panels") ?? null;
  }

  private collectTabs(): void {
    const children = [...this.children].filter(
      (child): child is HTMLElement =>
        child instanceof HTMLElement && child.hasAttribute("data-tab"),
    );
    this.tabs = children.map((panel, index) => {
      panel.setAttribute("slot", `orc-tab-panel-${index}`);
      return { label: panel.getAttribute("data-tab") ?? "", panel };
    });
    if (this.activeIndex > this.tabs.length - 1) {
      this.activeIndex = Math.max(0, this.tabs.length - 1);
    }
  }

  private render(): void {
    const tablist = this.tablist;
    const panelsContainer = this.panelsContainer;
    if (!tablist || !panelsContainer) return;

    tablist.replaceChildren(
      ...this.tabs.map((tab, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.role = "tab";
        button.id = `orc-tab-${index}`;
        button.setAttribute("aria-controls", `orc-tab-panel-${index}`);
        button.setAttribute(
          "aria-selected",
          String(index === this.activeIndex),
        );
        button.tabIndex = index === this.activeIndex ? 0 : -1;
        button.textContent = tab.label;
        button.addEventListener("click", () => {
          this.select(index, { focus: true, emit: true });
        });
        return button;
      }),
    );

    panelsContainer.replaceChildren(
      ...this.tabs.map((_tab, index) => {
        const panel = document.createElement("div");
        panel.role = "tabpanel";
        panel.id = `orc-tab-panel-${index}`;
        panel.setAttribute("aria-labelledby", `orc-tab-${index}`);
        panel.tabIndex = 0;
        if (index !== this.activeIndex) panel.hidden = true;
        const slot = document.createElement("slot");
        slot.name = `orc-tab-panel-${index}`;
        panel.append(slot);
        return panel;
      }),
    );
  }

  private applySelectedAttribute(): void {
    const raw = this.getAttribute("selected");
    if (raw === null || this.tabs.length === 0) return;
    const numeric = Number(raw);
    const index = Number.isInteger(numeric)
      ? numeric
      : this.tabs.findIndex((tab) => tab.label === raw);
    if (index >= 0 && index < this.tabs.length && index !== this.activeIndex) {
      this.select(index, { focus: false, emit: false });
    }
  }

  private select(
    index: number,
    { focus, emit }: { focus: boolean; emit: boolean },
  ): void {
    if (index < 0 || index >= this.tabs.length) return;
    this.activeIndex = index;

    const buttons = [
      ...(this.tablist?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ??
        []),
    ];
    const panels = [
      ...(this.panelsContainer?.querySelectorAll<HTMLElement>(
        '[role="tabpanel"]',
      ) ?? []),
    ];

    buttons.forEach((button, i) => {
      button.setAttribute("aria-selected", String(i === index));
      button.tabIndex = i === index ? 0 : -1;
    });
    panels.forEach((panel, i) => {
      panel.hidden = i !== index;
    });

    if (focus) buttons[index]?.focus();

    this.reflecting = true;
    this.setAttribute("selected", String(index));
    this.reflecting = false;

    if (emit) {
      const tab = this.tabs[index];
      this.dispatchEvent(
        new CustomEvent("change", {
          detail: { index, label: tab?.label ?? "" },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "orc-tabs": OrcTabs;
  }
}
