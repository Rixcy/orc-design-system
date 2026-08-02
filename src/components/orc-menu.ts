import {
  FloatingLayerController,
  type FloatingLayerDismissReason,
} from "./floating-layer";

const HTMLElementBase = (
  typeof HTMLElement === "undefined" ? class {} : HTMLElement
) as typeof HTMLElement;

let instanceCount = 0;

export type OrcMenuCloseReason =
  | FloatingLayerDismissReason
  | "attribute"
  | "item"
  | "programmatic"
  | "trigger";

export interface OrcMenuCloseDetail {
  reason: OrcMenuCloseReason;
}

const CHEVRON = `
  <svg class="chevron" width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
    <path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
`;

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

    .trigger {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--orc-space-2, 8px);
      min-block-size: 32px;
      max-inline-size: 100%;
      padding: 6px 10px;
      border: 1px solid var(--orc-control-border, #757d79);
      border-radius: var(--orc-radius-md, 8px);
      background: var(--orc-panel, #16181b);
      color: var(--orc-text, #c7cfca);
      font: inherit;
      font-size: 13px;
      line-height: 1.35;
      text-align: start;
      cursor: pointer;
    }

    .trigger:hover:not(:disabled),
    .trigger[aria-expanded="true"] {
      border-color: var(--orc-green, #9dc76b);
      color: var(--orc-heading, #eef1ee);
    }

    .trigger:focus-visible {
      outline: var(--orc-focus-ring, 1px solid #9dc76b);
      outline-offset: var(--orc-focus-offset, 3px);
    }

    .trigger:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .chevron {
      flex: none;
      color: var(--orc-muted-strong, #aeb5b0);
    }

    .trigger[aria-expanded="true"] .chevron {
      transform: rotate(180deg);
    }

    /* Fixed positioning keeps the layer compatible with Safari 16.5. */
    .menu {
      display: none;
      position: fixed;
      z-index: 30;
      box-sizing: border-box;
      inline-size: max-content;
      min-inline-size: var(--orc-menu-min-width, 10rem);
      max-inline-size: min(var(--orc-menu-max-width, 22rem), calc(100vw - 16px));
      max-block-size: min(var(--orc-menu-max-height, 22rem), calc(100vh - 16px));
      margin: 0;
      padding: var(--orc-space-1, 4px);
      overflow: auto;
      overscroll-behavior: contain;
      border: 1px solid var(--orc-border, #3b4540);
      border-radius: var(--orc-radius-md, 8px);
      background: var(--orc-panel, #16181b);
      color: var(--orc-text, #c7cfca);
    }

    .menu.open {
      display: grid;
      gap: 2px;
    }

    @media (prefers-reduced-motion: no-preference) {
      .chevron {
        transition: transform 0.15s ease-out;
      }

      .menu.open {
        animation: orc-menu-in 0.12s cubic-bezier(0.22, 1, 0.36, 1);
      }
    }

    @keyframes orc-menu-in {
      from {
        opacity: 0;
        transform: translateY(-4px);
      }
    }

    ::slotted([role="menuitem"]),
    ::slotted([role="menuitemradio"]) {
      box-sizing: border-box;
      display: flex;
      align-items: center;
      gap: var(--orc-space-2, 8px);
      inline-size: 100%;
      min-block-size: 30px;
      padding: 5px 9px;
      border: 0;
      border-inline-start: 2px solid transparent;
      border-radius: var(--orc-radius-sm, 4px);
      background: transparent;
      color: var(--orc-text, #c7cfca);
      font: inherit;
      font-size: 13px;
      line-height: 1.4;
      text-align: start;
      white-space: normal;
      overflow-wrap: anywhere;
      cursor: pointer;
    }

    ::slotted([role="menuitem"]:hover),
    ::slotted([role="menuitemradio"]:hover),
    ::slotted([role="menuitem"]:focus-visible),
    ::slotted([role="menuitemradio"]:focus-visible) {
      background: var(--orc-button-hover, #272d28);
      color: var(--orc-heading, #eef1ee);
    }

    ::slotted([role="menuitem"]:focus-visible),
    ::slotted([role="menuitemradio"]:focus-visible) {
      outline: var(--orc-focus-ring, 1px solid #9dc76b);
      outline-offset: -2px;
    }

    ::slotted([role="menuitemradio"][aria-checked="true"]) {
      border-inline-start-color: var(--orc-green, #9dc76b);
      color: var(--orc-green-text, var(--orc-green, #9dc76b));
      font-weight: 600;
    }

    ::slotted([role="menuitem"][aria-disabled="true"]),
    ::slotted([role="menuitemradio"][aria-disabled="true"]),
    ::slotted([role="menuitem"]:disabled),
    ::slotted([role="menuitemradio"]:disabled) {
      opacity: 0.55;
      cursor: not-allowed;
    }

    ::slotted([role="group"]) {
      display: grid;
      gap: 2px;
      min-inline-size: 0;
    }

    .empty {
      min-inline-size: 10rem;
      padding: 7px 9px;
      color: var(--orc-muted-strong, #aeb5b0);
      font-size: 12px;
      line-height: 1.45;
    }

    .empty[hidden] {
      display: none;
    }

    @media (forced-colors: active) {
      .trigger:focus-visible,
      ::slotted([role="menuitem"]:focus-visible),
      ::slotted([role="menuitemradio"]:focus-visible) {
        outline-color: Highlight;
      }

      ::slotted([role="menuitemradio"][aria-checked="true"]) {
        border-inline-start-color: Highlight;
      }
    }
  </style>
  <button type="button" class="trigger" aria-haspopup="menu" aria-expanded="false">
    <slot name="trigger">Menu</slot>
    ${CHEVRON}
  </button>
  <div class="menu" role="menu">
    <slot></slot>
    <div class="empty" role="menuitem" aria-disabled="true" hidden>No actions available</div>
  </div>
`;

/**
 * `<orc-menu>` renders a named trigger and a fixed, viewport-bound menu for
 * slotted `menuitem` and `menuitemradio` content.
 *
 * @customElement orc-menu
 * @attr {boolean} open - Reflects and controls menu visibility.
 * @attr {string} label - Accessible name for the menu surface. Falls back to the trigger text.
 * @attr {string} trigger-label - Accessible name for an icon-only trigger.
 * @attr {boolean} disabled - Disables the trigger and closes the menu.
 * @slot trigger - Trigger label or icon content. The component owns the native button.
 * @slot - Menu items. Use native buttons or links with `menuitem` or `menuitemradio` roles.
 * @fires open - Fired after the menu opens.
 * @fires close - Fired after close with an `OrcMenuCloseDetail` reason.
 * @fires cancel - Cancelable; fired before Escape, outside-pointer, or scroll dismissal.
 * @cssprop [--orc-menu-min-width=10rem] - Minimum panel width.
 * @cssprop [--orc-menu-max-width=22rem] - Maximum panel width.
 * @cssprop [--orc-menu-max-height=22rem] - Maximum panel height before scrolling.
 */
export class OrcMenu extends HTMLElementBase {
  static get observedAttributes(): string[] {
    return ["disabled", "label", "open", "trigger-label"];
  }

  private readonly elementId = `orc-menu-${++instanceCount}`;
  private floatingLayer: FloatingLayerController | undefined;
  private pendingCloseReason: OrcMenuCloseReason = "attribute";
  private restoreFocusAfterClose = false;

  private readonly onTriggerClick = (): void => {
    if (this.open) this.close("trigger");
    else this.show();
  };

  private readonly onTriggerKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    this.show(event.key === "ArrowUp" ? "last" : "first");
  };

  private readonly onMenuKeyDown = (event: KeyboardEvent): void => {
    const items = this.enabledItems();
    const current = event.composedPath().find(
      (node): node is HTMLElement => node instanceof HTMLElement && items.includes(node),
    );
    if (!current) return;
    const index = items.indexOf(current);
    let next: HTMLElement | undefined;

    if (event.key === "ArrowDown") next = items[(index + 1) % items.length];
    else if (event.key === "ArrowUp") next = items[(index - 1 + items.length) % items.length];
    else if (event.key === "Home") next = items[0];
    else if (event.key === "End") next = items[items.length - 1];
    else if ((event.key === "Enter" || event.key === " ") && current) {
      event.preventDefault();
      current.click();
      return;
    } else if (event.key === "Tab") {
      this.close("programmatic");
      return;
    } else {
      return;
    }

    if (next) {
      event.preventDefault();
      this.focusItem(next);
    }
  };

  private readonly onMenuClick = (event: Event): void => {
    const item = this.itemFromEvent(event);
    if (!item || this.itemIsDisabled(item)) return;
    this.close("item", true);
  };

  private readonly onMenuClickCapture = (event: Event): void => {
    const item = this.itemFromEvent(event);
    if (!item || !this.itemIsDisabled(item)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  };

  private readonly onSlotChange = (): void => {
    this.syncLabelling();
    this.syncItems();
    if (this.open) this.floatingLayer?.update();
  };

  constructor() {
    super();
    this.attachShadow({ mode: "open" }).innerHTML = template;
    if (this.trigger) {
      this.trigger.id = `${this.elementId}-trigger`;
      this.trigger.setAttribute("aria-controls", `${this.elementId}-menu`);
    }
    if (this.menu) this.menu.id = `${this.elementId}-menu`;

    this.trigger?.addEventListener("click", this.onTriggerClick);
    this.trigger?.addEventListener("keydown", this.onTriggerKeyDown);
    this.addEventListener("keydown", this.onMenuKeyDown);
    this.addEventListener("click", this.onMenuClickCapture, true);
    this.addEventListener("click", this.onMenuClick);
    this.shadowRoot
      ?.querySelectorAll("slot")
      .forEach((slot) => slot.addEventListener("slotchange", this.onSlotChange));
  }

  connectedCallback(): void {
    const trigger = this.trigger;
    const menu = this.menu;
    if (trigger && menu) {
      this.floatingLayer = new FloatingLayerController({
        anchor: trigger,
        layer: menu,
        onDismiss: (reason) => this.requestDismiss(reason),
        returnFocus: (reason) => {
          if (reason === "escape") trigger.focus();
        },
      });
    }
    this.syncLabelling();
    this.syncDisabledState();
    this.syncItems();
    this.syncOpenState();
  }

  disconnectedCallback(): void {
    this.floatingLayer?.destroy();
    this.floatingLayer = undefined;
  }

  attributeChangedCallback(name: string): void {
    if (name === "open") this.syncOpenState();
    else if (name === "disabled") this.syncDisabledState();
    else this.syncLabelling();
  }

  get open(): boolean {
    return this.hasAttribute("open");
  }

  set open(next: boolean) {
    this.pendingCloseReason = "attribute";
    this.toggleAttribute("open", Boolean(next));
  }

  get disabled(): boolean {
    return this.hasAttribute("disabled");
  }

  set disabled(next: boolean) {
    this.toggleAttribute("disabled", Boolean(next));
  }

  get trigger(): HTMLButtonElement | null {
    return this.shadowRoot?.querySelector(".trigger") ?? null;
  }

  get menu(): HTMLElement | null {
    return this.shadowRoot?.querySelector(".menu") ?? null;
  }

  focus(options?: FocusOptions): void {
    this.trigger?.focus(options);
  }

  show(focus: "first" | "last" = "first"): void {
    if (this.disabled || !this.isConnected) return;
    if (!this.open) {
      this.setAttribute("open", "");
    } else {
      this.floatingLayer?.update();
    }
    this.focusBoundaryItem(focus);
  }

  close(
    reason: OrcMenuCloseReason = "programmatic",
    restoreFocus = false,
  ): void {
    if (!this.open) return;
    this.pendingCloseReason = reason;
    this.restoreFocusAfterClose = restoreFocus;
    this.removeAttribute("open");
  }

  private syncOpenState(): void {
    const trigger = this.trigger;
    const menu = this.menu;
    if (!trigger || !menu) return;

    if (this.open && this.disabled) {
      this.pendingCloseReason = "programmatic";
      this.removeAttribute("open");
      return;
    }

    if (this.open && !this.disabled && this.isConnected) {
      if (menu.classList.contains("open")) {
        this.floatingLayer?.update();
        return;
      }
      menu.classList.add("open");
      trigger.setAttribute("aria-expanded", "true");
      menu.setAttribute("aria-hidden", "false");
      this.floatingLayer?.open();
      this.dispatchEvent(new Event("open", { composed: true }));
      return;
    }

    const wasOpen = menu.classList.contains("open");
    menu.classList.remove("open");
    trigger.setAttribute("aria-expanded", "false");
    menu.setAttribute("aria-hidden", "true");
    this.floatingLayer?.close();
    if (!wasOpen) return;

    const reason = this.pendingCloseReason;
    this.pendingCloseReason = "attribute";
    this.dispatchEvent(
      new CustomEvent<OrcMenuCloseDetail>("close", {
        composed: true,
        detail: { reason },
      }),
    );
    if (this.restoreFocusAfterClose) trigger.focus();
    this.restoreFocusAfterClose = false;
  }

  private syncDisabledState(): void {
    const disabled = this.disabled;
    if (this.trigger) this.trigger.disabled = disabled;
    if (disabled) this.close("programmatic");
  }

  private syncLabelling(): void {
    const trigger = this.trigger;
    const menu = this.menu;
    if (!trigger || !menu) return;
    const triggerLabel = this.getAttribute("trigger-label")?.trim() ?? "";
    if (triggerLabel) trigger.setAttribute("aria-label", triggerLabel);
    else trigger.removeAttribute("aria-label");

    const slottedText = this.querySelector('[slot="trigger"]')?.textContent?.trim() ?? "";
    menu.setAttribute("aria-label", this.getAttribute("label")?.trim() || slottedText || "Menu");
  }

  private syncItems(): void {
    const items = this.items();
    const empty = this.shadowRoot?.querySelector<HTMLElement>(".empty");
    if (empty) empty.hidden = items.length > 0;
    const firstEnabled = items.find((item) => !this.itemIsDisabled(item));
    items.forEach((item) => {
      item.tabIndex = item === firstEnabled ? 0 : -1;
    });
  }

  private items(): HTMLElement[] {
    return [
      ...this.querySelectorAll<HTMLElement>(
        '[role="menuitem"], [role="menuitemradio"]',
      ),
    ].filter((item) => !item.hidden);
  }

  private enabledItems(): HTMLElement[] {
    return this.items().filter((item) => !this.itemIsDisabled(item));
  }

  private itemIsDisabled(item: HTMLElement): boolean {
    return (
      item.getAttribute("aria-disabled") === "true" ||
      (item instanceof HTMLButtonElement && item.disabled)
    );
  }

  private itemFromEvent(event: Event): HTMLElement | undefined {
    return event
      .composedPath()
      .find(
        (node): node is HTMLElement =>
          node instanceof HTMLElement &&
          (node.getAttribute("role") === "menuitem" ||
            node.getAttribute("role") === "menuitemradio"),
      );
  }

  private focusBoundaryItem(boundary: "first" | "last"): void {
    const items = this.enabledItems();
    const item = boundary === "last" ? items[items.length - 1] : items[0];
    if (item) this.focusItem(item);
  }

  private focusItem(item: HTMLElement): void {
    this.items().forEach((candidate) => {
      candidate.tabIndex = candidate === item ? 0 : -1;
    });
    item.focus();
  }

  private requestDismiss(reason: FloatingLayerDismissReason): boolean {
    const accepted = this.dispatchEvent(
      new CustomEvent<OrcMenuCloseDetail>("cancel", {
        cancelable: true,
        composed: true,
        detail: { reason },
      }),
    );
    if (!accepted) return false;
    this.close(reason);
    return true;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "orc-menu": OrcMenu;
  }
}
