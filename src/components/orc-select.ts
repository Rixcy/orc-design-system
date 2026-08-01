import { syncDescription } from "./field-chrome";

const HTMLElementBase = (
  typeof HTMLElement === "undefined" ? class {} : HTMLElement
) as typeof HTMLElement;

let instanceCount = 0;

const CHEVRON = `
  <svg class="chevron" width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
    <path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
`;

// A themed trigger + manually-positioned listbox in front of a real <select>,
// mirrored from light-DOM <option> data into the shadow root. Ported from
// orc-ui's enhanceSelect(); manual positioning (no Popover API) because
// Orc.app's WKWebView is Safari 16.5.
const template = `
  <style>
    :host {
      display: inline-block;
      max-inline-size: 100%;
      font-family: var(--orc-font-sans, Inter, ui-sans-serif, system-ui, sans-serif);
    }

    :host([disabled]) {
      cursor: not-allowed;
    }

    .wrap {
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 0;
    }

    .label {
      color: var(--orc-text, #c7cfca);
      font-size: 13px;
      font-weight: 600;
    }

    /* Same screen-reader-only treatment as the other Orc fields' .sr-only. */
    .label.sr-only,
    .description {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    .control {
      position: relative;
      display: flex;
      min-width: 0;
    }

    .trigger {
      font: inherit;
      font-size: 13px;
      padding: 6px 10px;
      width: 100%;
      min-width: 0;
      min-height: 30px;
      background: var(--orc-panel, #16181b);
      color: var(--orc-text, #c7cfca);
      border: 1px solid var(--orc-control-border, #757d79);
      border-radius: var(--orc-radius-md, 8px);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      text-align: left;
    }

    .trigger:hover:not(:disabled) {
      border-color: var(--orc-green, #9dc76b);
    }

    .trigger:focus-visible {
      outline: var(--orc-focus-ring, 1px solid #9dc76b);
      outline-offset: 1px;
    }

    .trigger[aria-expanded="true"] {
      border-color: var(--orc-green, #9dc76b);
    }

    .trigger[aria-expanded="true"] .chevron {
      transform: rotate(180deg);
    }

    .trigger:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .value {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .chevron {
      flex-shrink: 0;
      color: var(--orc-muted-strong, #aeb5b0);
    }

    @media (prefers-reduced-motion: no-preference) {
      .chevron {
        transition: transform 0.15s ease-out;
      }
    }

    /* position:fixed escapes any ancestor's scroll clip and needs no
       top-layer support — no Popover API in Orc.app's WKWebView. */
    .menu {
      display: none;
      position: fixed;
      z-index: 30;
      margin: 0;
      padding: 4px;
      box-sizing: border-box;
      max-width: calc(100vw - 16px);
      background: var(--orc-panel, #16181b);
      color: var(--orc-text, #c7cfca);
      border: 1px solid var(--orc-border, #3b4540);
      border-radius: var(--orc-radius-md, 8px);
    }

    .menu.open {
      display: block;
      animation: orc-select-in 0.12s cubic-bezier(0.22, 1, 0.36, 1);
    }

    @keyframes orc-select-in {
      from {
        opacity: 0;
        transform: translateY(-4px);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .menu.open {
        animation: none;
      }
    }

    .search {
      display: block;
      width: 100%;
      box-sizing: border-box;
      margin: 0 0 4px;
      padding: 6px 9px;
      border: 1px solid var(--orc-control-border, #757d79);
      border-radius: var(--orc-radius-sm, 6px);
      background: var(--orc-bg, #0a0b0c);
      color: var(--orc-text, #c7cfca);
      font: inherit;
      font-size: 13px;
    }

    .search[hidden] {
      display: none;
    }

    .search:focus-visible {
      outline: var(--orc-focus-ring, 1px solid #9dc76b);
      outline-offset: -1px;
    }

    .listbox {
      max-height: min(280px, 50vh);
      overflow-y: auto;
      overscroll-behavior: contain;
    }

    .empty {
      padding: 8px 9px;
      color: var(--orc-muted-strong, #aeb5b0);
      font-size: 12px;
    }

    .empty[hidden] {
      display: none;
    }

    .option {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 5px 9px;
      border-radius: var(--orc-radius-sm, 5px);
      cursor: pointer;
      font-size: 13px;
      color: var(--orc-text, #c7cfca);
      white-space: nowrap;
    }

    .option[hidden] {
      display: none;
    }

    .option-label {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .option:hover {
      background: var(--orc-chip, #29312c);
      color: var(--orc-heading, #eef1ee);
    }

    /* Roving-tabindex listbox: focus itself is the "currently highlighted
       option" cue, so this fires on any focus, not just :focus-visible. */
    .option:focus {
      background: var(--orc-chip, #29312c);
      color: var(--orc-heading, #eef1ee);
      outline: var(--orc-focus-ring, 1px solid #9dc76b);
      outline-offset: -2px;
    }

    /* Selection is never colour-only: a checkmark (single) or a filled
       checkbox glyph (multi) carries the state too. */
    .option[aria-selected="true"] {
      color: var(--orc-green-text, var(--orc-green, #9dc76b));
      font-weight: 600;
    }

    .option[aria-selected="true"]::after {
      content: "\\2713";
      font-size: 11px;
    }

    .listbox[aria-multiselectable="true"] .option {
      justify-content: flex-start;
    }

    .listbox[aria-multiselectable="true"] .option::before {
      content: "";
      width: 13px;
      height: 13px;
      flex-shrink: 0;
      border: 1px solid var(--orc-muted-strong, #aeb5b0);
      border-radius: 4px;
      background: var(--orc-bg, #0a0b0c);
    }

    .listbox[aria-multiselectable="true"] .option[aria-selected="true"]::before {
      content: "\\2713";
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--orc-accent-strong, #9dc76b);
      border-color: var(--orc-accent-strong, #9dc76b);
      color: var(--orc-bg, #0a0b0c);
      font-size: 11px;
      line-height: 1;
    }

    .listbox[aria-multiselectable="true"] .option[aria-selected="true"]::after {
      content: none;
    }

    @media (forced-colors: active) {
      .trigger:focus-visible,
      .search:focus-visible,
      .option:focus {
        outline-color: Highlight;
      }
    }

    /* The mirrored value holder — never shown, never focusable. */
    .native-select {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      border: 0;
    }
  </style>
  <div class="wrap">
    <span class="label"></span>
    <div class="control">
      <button type="button" class="trigger" aria-haspopup="listbox" aria-expanded="false">
        <span class="value"></span>
        ${CHEVRON}
      </button>
      <div class="menu">
        <input class="search" type="search" autocomplete="off" spellcheck="false" placeholder="Search…" hidden />
        <div class="listbox" role="listbox"></div>
        <div class="empty" role="status" aria-live="polite" hidden></div>
      </div>
    </div>
    <select class="native-select" tabindex="-1" aria-hidden="true"></select>
    <p class="description" hidden></p>
  </div>
`;

function matchesQuery(text: string, query: string): boolean {
  return text.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
}

/**
 * `<orc-select>` is Orc's custom select: a themed trigger button and a
 * manually-positioned listbox in front of a real `<select>` mirrored into the
 * shadow root, so every ARIA IDREF stays inside one shadow tree. Ported from
 * orc-ui's `enhanceSelect`.
 *
 * Content API: provide light-DOM `<option>` children, exactly as with a
 * native `<select>`. They are read as data — hidden from the a11y tree and
 * mirrored into the shadow-root `<select>`, which is the real value holder.
 * Read/write selection through this element's `value`/`selectedOptions`
 * properties or its mirrored `select`, not the light-DOM options directly.
 * After mutating the light-DOM options from JS (e.g. an async fetch), call
 * `syncCustomSelect()` to refresh the mirror; a `MutationObserver` also does
 * this automatically for simple childList changes.
 *
 * @customElement orc-select
 * @attr {string} label - Visible label text.
 * @attr {string} aria-label - Accessible name used when no visible label is set.
 * @attr {boolean} searchable - Shows a search box that filters options case-insensitively.
 * @attr {boolean} disabled - Reflected. Disables the trigger and the mirrored select.
 * @attr {boolean} multiple - Reflected. Enables multi-select with checkbox-style options.
 * @attr {string} description - Extra hint announced with the trigger (rendered visually hidden).
 * @fires change - Fired when the selection changes, mirroring the native `<select>` `change` event.
 */
export class OrcSelect extends HTMLElementBase {
  static get observedAttributes(): string[] {
    return ["label", "aria-label", "description", "disabled", "multiple", "searchable"];
  }

  private readonly elementId = `orc-select-${++instanceCount}`;
  private mutationObserver: MutationObserver | undefined;
  private statusMessage = "";

  private readonly onTriggerClick = (): void => {
    if (this.menuEl?.classList.contains("open")) this.close();
    else this.open();
  };

  private readonly onTriggerKeydown = (event: KeyboardEvent): void => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      this.open();
    }
  };

  private readonly onSearchInput = (): void => {
    this.updateVisibility();
  };

  private readonly onMenuKeydown = (event: KeyboardEvent): void => {
    const search = this.searchEl;
    const active = this.shadowRoot?.activeElement ?? null;
    const opts = this.visibleOptions();

    if (search && active === search) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        opts[0]?.focus();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        opts[opts.length - 1]?.focus();
      } else if (event.key === "Enter" && !event.isComposing) {
        if (opts.length) {
          event.preventDefault();
          this.pick(opts[0].dataset.value ?? "");
        }
      } else if (event.key === "Escape") {
        event.preventDefault();
        this.close();
        this.triggerEl?.focus();
      } else if (event.key === "Tab") {
        this.close();
      }
      return;
    }

    const index = opts.indexOf(active as HTMLElement);
    if (event.key === "ArrowDown") {
      opts[Math.min(index + 1, opts.length - 1)]?.focus();
    } else if (event.key === "ArrowUp") {
      opts[Math.max(index - 1, 0)]?.focus();
    } else if (event.key === "Home") {
      opts[0]?.focus();
    } else if (event.key === "End") {
      opts[opts.length - 1]?.focus();
    } else if (event.key === "Enter" || event.key === " ") {
      const value = (active as HTMLElement | null)?.dataset.value;
      if (value !== undefined) this.pick(value);
    } else if (event.key === "Escape") {
      this.close();
      this.triggerEl?.focus();
      return;
    } else if (event.key === "Tab") {
      // single-select Tab commits; multi-select Tab keeps the checked set
      if (this.multiple) {
        this.close();
      } else {
        const value = (active as HTMLElement | null)?.dataset.value;
        if (value !== undefined) this.pick(value);
      }
      return;
    } else if (
      this.searchable &&
      search &&
      event.key.length === 1 &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey
    ) {
      search.focus();
      search.value += event.key;
      this.updateVisibility();
      return;
    } else if (/^[a-z0-9]$/i.test(event.key)) {
      // typeahead: jump to the first match
      opts
        .find((option) =>
          (option.querySelector(".option-label")?.textContent ?? "")
            .toLowerCase()
            .startsWith(event.key.toLowerCase()),
        )
        ?.focus();
      return;
    } else {
      return;
    }
    event.preventDefault();
  };

  // Manual open/close — no Popover API in Orc.app's WKWebView (Safari 16.5).
  // `composedPath()[0]` is used instead of `event.target`: a window-level
  // listener sees composed events retargeted to this host element, not the
  // shadow-root descendant that was actually clicked.
  private readonly onDocumentDismiss = (event: Event): void => {
    const menu = this.menuEl;
    const trigger = this.triggerEl;
    if (!menu || !this.isConnected) {
      this.close();
      return;
    }
    const origin = event.composedPath()[0] as Node | undefined;
    const insideMenu = origin ? menu.contains(origin) : false;
    const insideTrigger = origin && trigger ? trigger.contains(origin) : false;
    if (!insideMenu && (event.type === "scroll" || !insideTrigger)) this.close();
  };

  constructor() {
    super();
    this.attachShadow({ mode: "open" }).innerHTML = template;

    const trigger = this.triggerEl;
    const listbox = this.listboxEl;
    const label = this.labelEl;
    const value = this.valueEl;
    const search = this.searchEl;

    if (trigger) trigger.id = this.elementId;
    if (listbox) listbox.id = `${this.elementId}-listbox`;
    if (label) label.id = `${this.elementId}-label`;
    if (value) value.id = `${this.elementId}-value`;
    if (trigger && listbox) trigger.setAttribute("aria-controls", listbox.id);
    if (search && listbox) search.setAttribute("aria-controls", listbox.id);

    trigger?.addEventListener("click", this.onTriggerClick);
    trigger?.addEventListener("keydown", this.onTriggerKeydown);
    this.menuEl?.addEventListener("keydown", this.onMenuKeydown);
    search?.addEventListener("input", this.onSearchInput);
  }

  connectedCallback(): void {
    this.syncLabelling();
    this.syncDescriptionState();
    this.syncSearchableState();
    this.syncCustomSelect();

    this.mutationObserver = new MutationObserver(() => this.syncCustomSelect());
    this.mutationObserver.observe(this, { childList: true });
  }

  disconnectedCallback(): void {
    this.mutationObserver?.disconnect();
    this.mutationObserver = undefined;
    this.close();
  }

  attributeChangedCallback(name: string): void {
    switch (name) {
      case "label":
      case "aria-label":
        this.syncLabelling();
        break;
      case "description":
        this.syncDescriptionState();
        break;
      case "disabled":
        this.syncDisabledState();
        break;
      case "multiple":
        this.syncCustomSelect();
        break;
      case "searchable":
        this.syncSearchableState();
        break;
      default:
        break;
    }
  }

  /** The mirrored native `<select>` in the shadow root — the real value holder. */
  get select(): HTMLSelectElement | null {
    return this.shadowRoot?.querySelector(".native-select") ?? null;
  }

  get value(): string {
    return this.select?.value ?? "";
  }

  set value(next: string) {
    const select = this.select;
    if (select) select.value = next;
    this.updateTriggerValue();
    this.refreshOptionSelectedStates();
  }

  get selectedOptions(): HTMLOptionElement[] {
    return this.selectedNativeOptions();
  }

  get options(): HTMLOptionElement[] {
    return [...(this.select?.options ?? [])];
  }

  get disabled(): boolean {
    return this.hasAttribute("disabled");
  }

  set disabled(next: boolean) {
    this.toggleAttribute("disabled", Boolean(next));
  }

  get multiple(): boolean {
    return this.hasAttribute("multiple");
  }

  set multiple(next: boolean) {
    this.toggleAttribute("multiple", Boolean(next));
  }

  get searchable(): boolean {
    return this.hasAttribute("searchable");
  }

  set searchable(next: boolean) {
    this.toggleAttribute("searchable", Boolean(next));
  }

  focus(options?: FocusOptions): void {
    this.triggerEl?.focus(options);
  }

  /**
   * Rebuilds the mirrored `<select>` and the visible listbox from the
   * current light-DOM `<option>` children. Call this after adding, removing
   * or mutating (e.g. `selected`) light-DOM options from JS — an async
   * fetch that populates the list, for instance. A `MutationObserver` calls
   * this automatically for plain childList changes, so this is mainly for
   * cases that also need `setCustomSelectStatus()` in the same tick.
   */
  syncCustomSelect(): void {
    this.mirrorLightOptions();
    this.renderListboxOptions();
    this.syncMultiselectState();
    this.syncDisabledState();
    this.updateVisibility();
    this.updateTriggerValue();
  }

  /**
   * Sets the empty-state message shown in the listbox (e.g. while options
   * load asynchronously) and its `aria-busy` state. Call with no arguments
   * to clear back to the default "No matches" / "No options available" text.
   */
  setCustomSelectStatus(message = "", busy = false): void {
    this.statusMessage = message;
    const listbox = this.listboxEl;
    if (listbox) {
      if (busy) listbox.setAttribute("aria-busy", "true");
      else listbox.removeAttribute("aria-busy");
    }
    this.updateVisibility();
  }

  private get labelEl(): HTMLElement | null {
    return this.shadowRoot?.querySelector(".label") ?? null;
  }

  private get triggerEl(): HTMLButtonElement | null {
    return this.shadowRoot?.querySelector(".trigger") ?? null;
  }

  private get valueEl(): HTMLElement | null {
    return this.shadowRoot?.querySelector(".value") ?? null;
  }

  private get menuEl(): HTMLElement | null {
    return this.shadowRoot?.querySelector(".menu") ?? null;
  }

  private get searchEl(): HTMLInputElement | null {
    return this.shadowRoot?.querySelector(".search") ?? null;
  }

  private get listboxEl(): HTMLElement | null {
    return this.shadowRoot?.querySelector(".listbox") ?? null;
  }

  private get emptyEl(): HTMLElement | null {
    return this.shadowRoot?.querySelector(".empty") ?? null;
  }

  private syncLabelling(): void {
    const label = this.labelEl;
    const value = this.valueEl;
    const trigger = this.triggerEl;
    if (!label || !trigger) return;

    const labelText = this.getAttribute("label")?.trim() ?? "";
    const ariaLabel = this.getAttribute("aria-label")?.trim() ?? "";
    const text = labelText || ariaLabel;

    label.textContent = text;
    // Visible label wins; an aria-label-only host still needs a name, kept
    // in the accessible-name computation via aria-labelledby but rendered
    // visually hidden — same sr-only technique the text fields use.
    label.classList.toggle("sr-only", labelText === "");

    // name = "<label> <current value>", the same "Label, currently: value"
    // shape a native select announces — a plain <button> has no accessible
    // value of its own, so the current selection is folded into the name.
    const ids = [label.id, value?.id].filter(Boolean).join(" ");
    if (ids) trigger.setAttribute("aria-labelledby", ids);
    if (this.searchEl) {
      this.searchEl.setAttribute("aria-label", `Search ${text || "options"}`);
    }
  }

  private syncDescriptionState(): void {
    const trigger = this.triggerEl;
    if (!trigger) return;
    syncDescription(
      this.shadowRoot,
      trigger,
      this.getAttribute("description")?.trim() ?? "",
      this.elementId,
    );
  }

  private syncDisabledState(): void {
    const trigger = this.triggerEl;
    const select = this.select;
    const disabled = this.disabled;
    if (trigger) trigger.disabled = disabled;
    if (select) select.disabled = disabled;
    if (disabled) this.close();
  }

  private syncSearchableState(): void {
    const search = this.searchEl;
    if (search) search.hidden = !this.searchable;
    this.updateVisibility();
  }

  private syncMultiselectState(): void {
    const select = this.select;
    const listbox = this.listboxEl;
    if (select) select.multiple = this.multiple;
    // Written as an explicit "true"/"false" token, per the ARIA spec's
    // enumerated value for aria-multiselectable — not a bare boolean
    // attribute, which would leave a meaningless empty-string value.
    if (listbox) listbox.setAttribute("aria-multiselectable", String(this.multiple));
  }

  // Light-DOM <option> children are the content API and stay in the DOM as
  // pure data: hidden from the a11y tree and copied into the shadow-root
  // <select>, which is the interactive value holder. Copies, not references,
  // so every ARIA IDREF the widget needs stays inside this one shadow tree.
  private mirrorLightOptions(): void {
    const select = this.select;
    if (!select) return;
    const sourceOptions = [...this.children].filter(
      (child): child is HTMLOptionElement => child instanceof HTMLOptionElement,
    );
    sourceOptions.forEach((option) => {
      option.hidden = true;
    });
    select.replaceChildren(
      ...sourceOptions.map((option) => {
        const mirrored = document.createElement("option");
        mirrored.value = option.value;
        mirrored.textContent = option.textContent ?? "";
        mirrored.selected = option.selected;
        mirrored.disabled = option.disabled;
        return mirrored;
      }),
    );
  }

  private renderListboxOptions(): void {
    const listbox = this.listboxEl;
    const select = this.select;
    if (!listbox || !select) return;
    listbox.replaceChildren(
      ...[...select.options].map((option) => {
        const row = document.createElement("div");
        row.className = "option";
        row.setAttribute("role", "option");
        row.setAttribute("aria-selected", String(option.selected));
        row.tabIndex = -1;
        row.dataset.value = option.value;
        const label = document.createElement("span");
        label.className = "option-label";
        label.textContent = option.textContent ?? "";
        label.title = option.textContent ?? "";
        row.append(label);
        row.addEventListener("click", () => this.pick(option.value));
        return row;
      }),
    );
    this.updateVisibility();
  }

  private visibleOptions(): HTMLElement[] {
    return [...(this.listboxEl?.querySelectorAll<HTMLElement>(".option") ?? [])].filter(
      (option) => !option.hidden,
    );
  }

  private updateVisibility(): void {
    const listbox = this.listboxEl;
    const empty = this.emptyEl;
    if (!listbox || !empty) return;

    const options = [...listbox.querySelectorAll<HTMLElement>(".option")];
    const query = this.searchable ? (this.searchEl?.value ?? "") : "";
    let visible = 0;
    options.forEach((option) => {
      const label = option.querySelector(".option-label")?.textContent ?? "";
      const matches = !this.searchable || matchesQuery(label, query);
      option.hidden = !matches;
      if (matches) visible += 1;
    });

    const message =
      this.statusMessage ||
      (options.length === 0 ? "No options available" : query.trim() && visible === 0 ? "No matches" : "");
    empty.textContent = message;
    empty.hidden = message === "";
  }

  private updateTriggerValue(): void {
    const value = this.valueEl;
    if (value) value.textContent = this.selectedLabel();
  }

  // select.selectedOptions is a live collection some engines (happy-dom,
  // notably, in this project's own test environment) don't reliably keep in
  // sync with direct option.selected mutation; filtering options by their own
  // .selected getter is the same result and doesn't depend on that collection.
  private selectedNativeOptions(): HTMLOptionElement[] {
    return [...(this.select?.options ?? [])].filter((option) => option.selected);
  }

  private selectedLabel(): string {
    if (!this.select) return "";
    const labels = this.selectedNativeOptions().map((option) => option.textContent ?? "");
    if (this.multiple) return labels.length ? labels.join(", ") : "Select values";
    return labels[0] ?? "";
  }

  private refreshOptionSelectedStates(): void {
    const listbox = this.listboxEl;
    if (!this.select || !listbox) return;
    const selectedValues = new Set(this.selectedNativeOptions().map((option) => option.value));
    listbox.querySelectorAll<HTMLElement>(".option").forEach((row) => {
      row.setAttribute("aria-selected", String(selectedValues.has(row.dataset.value ?? "")));
    });
  }

  private pick(value: string): void {
    const select = this.select;
    if (!select) return;
    if (this.multiple) {
      const option = [...select.options].find((candidate) => candidate.value === value);
      if (!option || (option.selected && this.selectedNativeOptions().length === 1)) return;
      option.selected = !option.selected;
    } else {
      select.value = value;
    }
    this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
    this.updateTriggerValue();
    this.refreshOptionSelectedStates();
    if (!this.multiple) {
      this.close();
      this.triggerEl?.focus();
    }
  }

  private open(): void {
    const trigger = this.triggerEl;
    const menu = this.menuEl;
    if (!trigger || !menu || trigger.disabled) return;
    if (menu.classList.contains("open")) return;

    menu.classList.add("open");
    trigger.setAttribute("aria-expanded", "true");

    const rect = trigger.getBoundingClientRect();
    menu.style.minWidth = `${rect.width}px`;
    const menuWidth = menu.offsetWidth;
    const menuHeight = menu.offsetHeight;
    const below = rect.bottom + 4 + menuHeight <= window.innerHeight - 8;
    menu.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - menuWidth - 8))}px`;
    menu.style.top = below ? `${rect.bottom + 4}px` : `${Math.max(8, rect.top - 4 - menuHeight)}px`;

    const search = this.searchEl;
    if (this.searchable && search) {
      search.focus();
    } else {
      const selected = this.listboxEl?.querySelector<HTMLElement>('[aria-selected="true"]');
      (selected ?? (this.listboxEl?.firstElementChild as HTMLElement | null))?.focus();
    }

    window.addEventListener("pointerdown", this.onDocumentDismiss, true);
    window.addEventListener("scroll", this.onDocumentDismiss, true);
  }

  private close(): void {
    const menu = this.menuEl;
    const trigger = this.triggerEl;
    if (!menu || !menu.classList.contains("open")) return;

    menu.classList.remove("open");
    trigger?.setAttribute("aria-expanded", "false");

    const search = this.searchEl;
    if (search && search.value) {
      search.value = "";
      this.updateVisibility();
    }

    window.removeEventListener("pointerdown", this.onDocumentDismiss, true);
    window.removeEventListener("scroll", this.onDocumentDismiss, true);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "orc-select": OrcSelect;
  }
}
