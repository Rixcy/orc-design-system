const HTMLElementBase = (
  typeof HTMLElement === "undefined" ? class {} : HTMLElement
) as typeof HTMLElement;

let instanceCount = 0;

export interface OrcComboboxOption {
  id: string;
  label: string;
  description?: string;
  keywords?: readonly string[];
  disabled?: boolean;
}

export interface OrcComboboxGroup {
  id: string;
  label: string;
  options: readonly OrcComboboxOption[];
}

const template = `
  <style>
    :host {
      display: block;
      min-inline-size: 0;
      color: var(--orc-text, #c7cfca);
      font-family: var(--orc-font-sans, Inter, ui-sans-serif, system-ui, sans-serif);
    }

    .combobox {
      display: grid;
      gap: var(--orc-space-2, 0.5rem);
      min-inline-size: 0;
    }

    label {
      color: var(--orc-heading, #eef1ee);
      font-size: 13px;
      font-weight: 600;
    }

    label[hidden] {
      display: none;
    }

    input {
      box-sizing: border-box;
      inline-size: 100%;
      min-inline-size: 0;
      min-block-size: 38px;
      padding: 8px 10px;
      border: 1px solid var(--orc-control-border, #757d79);
      border-radius: var(--orc-radius-md, 8px);
      background: var(--orc-bg, #0a0b0c);
      color: var(--orc-text, #c7cfca);
      font: inherit;
      font-size: 14px;
    }

    input::placeholder {
      color: var(--orc-muted-strong, #aeb5b0);
    }

    input:focus-visible {
      border-color: var(--orc-green, #9dc76b);
      outline: var(--orc-focus-ring, 1px solid #9dc76b);
      outline-offset: var(--orc-focus-offset, 3px);
    }

    .results {
      min-inline-size: 0;
      max-block-size: min(320px, 50vh);
      overflow-x: hidden;
      overflow-y: auto;
      overscroll-behavior: contain;
      border: 1px solid var(--orc-border, #3b4540);
      border-radius: var(--orc-radius-md, 8px);
      background: var(--orc-panel, #16181b);
    }

    .results[hidden] {
      display: none;
    }

    .group + .group {
      border-block-start: 1px solid var(--orc-border, #3b4540);
    }

    .group-label {
      margin: 0;
      padding: 8px 10px 4px;
      color: var(--orc-muted-strong, #aeb5b0);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.04em;
      line-height: 1.4;
      text-transform: uppercase;
      overflow-wrap: anywhere;
    }

    .option {
      display: grid;
      gap: 2px;
      min-inline-size: 0;
      padding: 8px 10px;
      color: var(--orc-text, #c7cfca);
      cursor: pointer;
      overflow-wrap: anywhere;
    }

    .option[aria-selected="true"] {
      background: var(--orc-chip, #29312c);
      color: var(--orc-heading, #eef1ee);
      box-shadow: inset 2px 0 0 var(--orc-green, #9dc76b);
    }

    .option[aria-disabled="true"] {
      color: var(--orc-muted-strong, #aeb5b0);
      cursor: not-allowed;
      opacity: 0.65;
    }

    .option-label {
      min-inline-size: 0;
      font-size: 13px;
      font-weight: 600;
      line-height: 1.4;
    }

    .option-description {
      min-inline-size: 0;
      color: var(--orc-muted-strong, #aeb5b0);
      font-size: 12px;
      line-height: 1.4;
    }

    .status {
      min-block-size: 1.4em;
      margin: 0;
      color: var(--orc-muted-strong, #aeb5b0);
      font-size: 12px;
      line-height: 1.4;
      overflow-wrap: anywhere;
    }

    @media (forced-colors: active) {
      input:focus-visible {
        border-color: Highlight;
        outline-color: Highlight;
      }

      .option[aria-selected="true"] {
        outline: 1px solid Highlight;
        outline-offset: -2px;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .results {
        scroll-behavior: auto;
      }
    }
  </style>
  <div class="combobox">
    <label></label>
    <input
      type="text"
      role="combobox"
      aria-autocomplete="list"
      aria-haspopup="listbox"
      autocomplete="off"
      spellcheck="false"
    />
    <div class="results" role="listbox"></div>
    <p class="status" role="status" aria-live="polite" aria-atomic="true"></p>
  </div>
`;

function matchesOption(option: OrcComboboxOption, query: string): boolean {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return true;
  return [option.label, option.description ?? "", ...(option.keywords ?? [])]
    .join(" ")
    .toLocaleLowerCase()
    .includes(normalized);
}

/**
 * `<orc-combobox>` is an inline action picker that keeps DOM focus on its text
 * input while `aria-activedescendant` identifies the active listbox option.
 * Consumers provide grouped action data and retain ownership of execution,
 * routing, dialog state, and destructive confirmation.
 *
 * Option IDs are consumer-owned identity and should be unique within the
 * current option set. Setting `options`, `value`, or `loading` rerenders the
 * current results without emitting user-intent events.
 *
 * @customElement orc-combobox
 * @attr {string} label - Visible label text.
 * @attr {string} aria-label - Accessible input name used when no visible label is set.
 * @attr {string} placeholder - Input placeholder text.
 * @attr {string} value - Current filter query; reflected by the `value` property.
 * @attr {boolean} loading - Shows the loading state and marks the listbox busy.
 * @fires input - Native composed input event after a user changes the query.
 * @fires activate - `CustomEvent<OrcComboboxOption>` carrying the exact activated option.
 * @fires cancel - Composed event expressing the consumer-owned Escape intent.
 */
export class OrcCombobox extends HTMLElementBase {
  static get observedAttributes(): string[] {
    return ["label", "aria-label", "placeholder", "value", "loading"];
  }

  private readonly elementId = `orc-combobox-${++instanceCount}`;
  private groups: readonly OrcComboboxGroup[] = [];
  private visibleOptions: OrcComboboxOption[] = [];
  private activeIndex = -1;
  private reflectingValue = false;

  private readonly onInput = (): void => {
    const input = this.input;
    if (!input) return;
    this.reflectingValue = true;
    if (input.value) this.setAttribute("value", input.value);
    else this.removeAttribute("value");
    this.reflectingValue = false;
    this.renderResults();
  };

  private readonly onKeydown = (event: KeyboardEvent): void => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        this.moveActive(1);
        break;
      case "ArrowUp":
        event.preventDefault();
        this.moveActive(-1);
        break;
      case "Home":
        event.preventDefault();
        this.moveToBoundary("start");
        break;
      case "End":
        event.preventDefault();
        this.moveToBoundary("end");
        break;
      case "Enter":
        if (this.activeIndex >= 0) {
          event.preventDefault();
          this.activate(this.activeIndex);
        }
        break;
      case "Escape":
        this.dispatchEvent(new Event("cancel", { bubbles: true, composed: true }));
        break;
      default:
        break;
    }
  };

  private readonly onPointerMove = (event: Event): void => {
    const row = (event.target as Element | null)?.closest<HTMLElement>(".option");
    const index = Number(row?.dataset.index);
    if (!row || row.getAttribute("aria-disabled") === "true" || !Number.isInteger(index)) {
      return;
    }
    this.setActive(index, false);
  };

  private readonly onPointerDown = (event: Event): void => {
    const row = (event.target as Element | null)?.closest<HTMLElement>(".option");
    if (row?.getAttribute("aria-disabled") !== "true") event.preventDefault();
  };

  private readonly onClick = (event: Event): void => {
    const row = (event.target as Element | null)?.closest<HTMLElement>(".option");
    const index = Number(row?.dataset.index);
    if (!row || row.getAttribute("aria-disabled") === "true" || !Number.isInteger(index)) {
      return;
    }
    this.activate(index);
    this.input?.focus();
  };

  constructor() {
    super();
    this.attachShadow({ mode: "open" }).innerHTML = template;

    const input = this.input;
    const results = this.results;
    input?.addEventListener("input", this.onInput);
    input?.addEventListener("keydown", this.onKeydown);
    results?.addEventListener("pointermove", this.onPointerMove);
    results?.addEventListener("pointerdown", this.onPointerDown);
    results?.addEventListener("click", this.onClick);
  }

  connectedCallback(): void {
    const input = this.input;
    const results = this.results;
    const label = this.labelElement;
    if (input) {
      input.id = `${this.elementId}-input`;
      input.setAttribute("aria-controls", `${this.elementId}-listbox`);
      input.value = this.getAttribute("value") ?? "";
    }
    if (results) results.id = `${this.elementId}-listbox`;
    if (label) {
      label.id = `${this.elementId}-label`;
      label.htmlFor = `${this.elementId}-input`;
    }
    this.syncAttributes();
    this.renderResults();
  }

  attributeChangedCallback(name: string): void {
    if (name === "value" && !this.reflectingValue) {
      const input = this.input;
      if (input) input.value = this.getAttribute("value") ?? "";
      this.renderResults();
      return;
    }
    if (name === "loading") {
      this.renderResults();
      return;
    }
    this.syncAttributes();
  }

  /** The native text input that retains DOM focus during navigation. */
  get input(): HTMLInputElement | null {
    return this.shadowRoot?.querySelector("input") ?? null;
  }

  /** Grouped action options. Replacing the array updates results immediately. */
  get options(): readonly OrcComboboxGroup[] {
    return this.groups;
  }

  set options(next: readonly OrcComboboxGroup[]) {
    this.groups = next.map((group) => ({ ...group, options: [...group.options] }));
    this.renderResults();
  }

  /** The current filter query. Programmatic updates do not emit `input`. */
  get value(): string {
    return this.input?.value ?? this.getAttribute("value") ?? "";
  }

  set value(next: string) {
    if (next) this.setAttribute("value", next);
    else this.removeAttribute("value");
  }

  /** Whether the consumer is loading action options. */
  get loading(): boolean {
    return this.hasAttribute("loading");
  }

  set loading(next: boolean) {
    this.toggleAttribute("loading", next);
  }

  override focus(options?: FocusOptions): void {
    this.input?.focus(options);
  }

  private get results(): HTMLElement | null {
    return this.shadowRoot?.querySelector(".results") ?? null;
  }

  private get status(): HTMLElement | null {
    return this.shadowRoot?.querySelector(".status") ?? null;
  }

  private get labelElement(): HTMLLabelElement | null {
    return this.shadowRoot?.querySelector("label") ?? null;
  }

  private syncAttributes(): void {
    const input = this.input;
    const labelElement = this.labelElement;
    if (!input || !labelElement) return;

    const label = this.getAttribute("label")?.trim() ?? "";
    const ariaLabel = this.getAttribute("aria-label")?.trim() ?? "";
    labelElement.textContent = label;
    labelElement.hidden = !label;
    input.placeholder = this.getAttribute("placeholder") ?? "Search actions";

    if (label) {
      input.setAttribute("aria-labelledby", labelElement.id);
      input.removeAttribute("aria-label");
    } else {
      input.removeAttribute("aria-labelledby");
      if (ariaLabel) input.setAttribute("aria-label", ariaLabel);
      else input.removeAttribute("aria-label");
    }
  }

  private renderResults(): void {
    const input = this.input;
    const results = this.results;
    const status = this.status;
    if (!input || !results || !status) return;

    const previousId = this.visibleOptions[this.activeIndex]?.id;
    const matchingGroups = this.loading
      ? []
      : this.groups
          .map((group) => ({
            group,
            options: group.options.filter((option) => matchesOption(option, input.value)),
          }))
          .filter(({ options }) => options.length > 0);

    this.visibleOptions = matchingGroups.flatMap(({ options }) => options);
    const preserved = previousId
      ? this.visibleOptions.findIndex(
          (option) => option.id === previousId && !option.disabled,
        )
      : -1;
    this.activeIndex = preserved >= 0 ? preserved : this.firstEnabledIndex();

    let visibleIndex = 0;
    results.replaceChildren(
      ...matchingGroups.map(({ group, options }, groupIndex) => {
        const groupElement = document.createElement("div");
        const heading = document.createElement("h3");
        const headingId = `${this.elementId}-group-${groupIndex}`;
        groupElement.className = "group";
        groupElement.role = "group";
        groupElement.setAttribute("aria-labelledby", headingId);
        groupElement.dataset.groupId = group.id;
        heading.className = "group-label";
        heading.id = headingId;
        heading.textContent = group.label;
        groupElement.append(heading);

        for (const option of options) {
          const index = visibleIndex++;
          const row = document.createElement("div");
          const label = document.createElement("span");
          row.className = "option";
          row.id = `${this.elementId}-option-${index}`;
          row.role = "option";
          row.dataset.index = String(index);
          row.dataset.optionId = option.id;
          row.setAttribute("aria-disabled", String(Boolean(option.disabled)));
          row.setAttribute("aria-selected", String(index === this.activeIndex));
          label.className = "option-label";
          label.textContent = option.label;
          row.append(label);

          if (option.description) {
            const description = document.createElement("span");
            description.className = "option-description";
            description.textContent = option.description;
            row.append(description);
          }
          groupElement.append(row);
        }
        return groupElement;
      }),
    );

    results.hidden = this.visibleOptions.length === 0;
    results.setAttribute("aria-busy", String(this.loading));
    input.setAttribute("aria-expanded", String(!results.hidden));
    this.syncActiveDescendant();

    if (this.loading) status.textContent = "Loading actions";
    else if (this.visibleOptions.length === 0) {
      status.textContent = input.value ? "No matching actions" : "No actions available";
    } else {
      const count = this.visibleOptions.length;
      status.textContent = `${count} ${count === 1 ? "action" : "actions"} available`;
    }
  }

  private firstEnabledIndex(): number {
    return this.visibleOptions.findIndex((option) => !option.disabled);
  }

  private lastEnabledIndex(): number {
    for (let index = this.visibleOptions.length - 1; index >= 0; index -= 1) {
      if (!this.visibleOptions[index]?.disabled) return index;
    }
    return -1;
  }

  private moveActive(direction: 1 | -1): void {
    if (this.loading || this.visibleOptions.length === 0) return;
    const enabledCount = this.visibleOptions.filter((option) => !option.disabled).length;
    if (enabledCount === 0) return;

    let next = this.activeIndex;
    for (let checked = 0; checked < this.visibleOptions.length; checked += 1) {
      next = (next + direction + this.visibleOptions.length) % this.visibleOptions.length;
      if (!this.visibleOptions[next]?.disabled) {
        this.setActive(next, true);
        return;
      }
    }
  }

  private moveToBoundary(boundary: "start" | "end"): void {
    const next =
      boundary === "start"
        ? this.firstEnabledIndex()
        : this.lastEnabledIndex();
    if (next >= 0) this.setActive(next, true);
  }

  private setActive(index: number, scroll: boolean): void {
    if (index < 0 || this.visibleOptions[index]?.disabled) return;
    this.activeIndex = index;
    this.syncActiveDescendant();
    if (scroll) {
      const row = this.results?.querySelector<HTMLElement>(`[data-index="${index}"]`);
      row?.scrollIntoView?.({ block: "nearest" });
    }
  }

  private syncActiveDescendant(): void {
    const input = this.input;
    const rows = this.results?.querySelectorAll<HTMLElement>(".option") ?? [];
    rows.forEach((row, index) => {
      row.setAttribute("aria-selected", String(index === this.activeIndex));
    });

    const active = this.results?.querySelector<HTMLElement>(
      `[data-index="${this.activeIndex}"]`,
    );
    if (active && active.getAttribute("aria-disabled") !== "true") {
      input?.setAttribute("aria-activedescendant", active.id);
    } else {
      input?.removeAttribute("aria-activedescendant");
    }
  }

  private activate(index: number): void {
    const option = this.visibleOptions[index];
    if (!option || option.disabled || this.loading) return;
    this.dispatchEvent(
      new CustomEvent<OrcComboboxOption>("activate", {
        detail: option,
        bubbles: true,
        composed: true,
      }),
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "orc-combobox": OrcCombobox;
  }
}
