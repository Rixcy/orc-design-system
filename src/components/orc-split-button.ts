import type { OrcMenu, OrcMenuCloseDetail } from "./orc-menu";

const HTMLElementBase = (
  typeof HTMLElement === "undefined" ? class {} : HTMLElement
) as typeof HTMLElement;

// The consumer keeps its own primary button: label, colour, click handling
// and any page styling stay in the light DOM. This wrapper only squares the
// edge that meets the chevron and owns the chevron trigger plus its menu,
// which it delegates to an <orc-menu> composed in the shadow root.
const template = `
  <style>
    :host {
      --orc-split-button-radius: var(--orc-radius-md, 8px);
      --orc-split-button-fill: var(--orc-green, #9dc76b);
      --orc-split-button-fill-hover: color-mix(in srgb, var(--orc-green, #9dc76b) 86%, var(--orc-heading, #e0e5e2));
      --orc-split-button-ink: var(--orc-button-text, var(--orc-panel, #16181b));
      display: inline-flex;
      align-items: stretch;
      max-inline-size: 100%;
      font-family: var(--orc-font-sans, Inter, ui-sans-serif, system-ui, sans-serif);
    }

    :host([hidden]) {
      display: none;
    }

    /* The joined edge. Page rules on a slotted native button outrank a
       shadow ::slotted() rule, so the squared corners are the one style this
       wrapper insists on; <orc-button> reads the same intent from its radius
       token. */
    ::slotted(:not([slot])) {
      --orc-button-radius: var(--orc-split-button-radius) 0 0 var(--orc-split-button-radius);
      border-start-end-radius: 0 !important;
      border-end-end-radius: 0 !important;
      min-inline-size: 0;
    }

    orc-menu {
      display: flex;
      flex: none;
    }

    orc-menu::part(trigger) {
      position: relative;
      box-sizing: border-box;
      block-size: 100%;
      min-block-size: 0;
      min-inline-size: 30px;
      padding: 0 7px;
      border: 1px solid transparent;
      border-start-start-radius: 0;
      border-end-start-radius: 0;
      border-start-end-radius: var(--orc-split-button-radius);
      border-end-end-radius: var(--orc-split-button-radius);
      background: var(--orc-split-button-fill);
      color: var(--orc-split-button-ink);
    }

    /* The divider is a tinted line inside the fill rather than a border
       colour change, so the two halves read as one control with a seam. */
    orc-menu::part(trigger)::before {
      content: "";
      position: absolute;
      inset-block: 5px;
      inset-inline-start: 0;
      inline-size: 1px;
      background: color-mix(in srgb, currentColor 28%, transparent);
    }

    /* Hovering either half lights both: the primary is the consumer's, so it
       reads the same hover fill through the token the host flips here. */
    :host(:hover) orc-menu::part(trigger):not(:disabled),
    :host([open]) orc-menu::part(trigger) {
      background: var(--orc-split-button-fill-hover);
      border-color: transparent;
      color: var(--orc-split-button-ink);
    }

    :host(:hover) {
      --orc-split-button-fill: var(--orc-split-button-fill-hover);
    }

    :host([variant="ghost"]) orc-menu::part(trigger) {
      background: color-mix(in srgb, var(--orc-text, #c7cfca) 6%, transparent);
      border-color: var(--orc-control-border, var(--orc-border, #3b4540));
      border-inline-start-color: transparent;
      color: var(--orc-button-text, var(--orc-heading, #e0e5e2));
    }

    :host([variant="ghost"]:hover) orc-menu::part(trigger):not(:disabled),
    :host([variant="ghost"][open]) orc-menu::part(trigger) {
      background: color-mix(in srgb, var(--orc-green, #9dc76b) 12%, transparent);
      border-color: var(--orc-green, #9dc76b);
      color: var(--orc-green-text, var(--orc-green, #9dc76b));
    }

    orc-menu::part(chevron) {
      color: inherit;
    }

    orc-menu::part(trigger):disabled {
      opacity: 0.5;
    }

    :host([size="compact"]) orc-menu::part(trigger) {
      min-inline-size: 26px;
      padding: 0 5px;
    }

    @media (forced-colors: active) {
      orc-menu::part(trigger) {
        border-color: ButtonText;
      }
    }
  </style>
  <slot></slot>
  <orc-menu label="More actions" trigger-label="More actions" exportparts="trigger, chevron, menu">
    <span slot="trigger" hidden></span>
    <slot name="menu"></slot>
  </orc-menu>
`;

/**
 * `<orc-split-button>` joins a chevron side trigger to the consumer's own
 * primary button and opens a menu of further actions from it. The primary
 * button keeps its own semantics and styling; the wrapper owns only the
 * chevron and the menu, which is an `<orc-menu>` composed in the shadow root.
 *
 * @customElement orc-split-button
 * @attr {"primary"|"ghost"} variant - Chevron fill, matching the `<orc-button>`
 *   variant of the primary. Defaults to `primary`.
 * @attr {"default"|"compact"} size - Chevron density. Defaults to `default`.
 * @attr {boolean} open - Reflects and controls menu visibility.
 * @attr {boolean} disabled - Disables the chevron trigger and closes the menu.
 *   The primary button is the consumer's to disable.
 * @attr {string} label - Accessible name for the menu surface. Defaults to `More actions`.
 * @attr {string} menu-label - Accessible name for the icon-only chevron trigger.
 *   Defaults to `More actions`.
 * @slot - The primary action: a native button or an `<orc-button>`.
 * @slot menu - Menu items. Use native buttons or links with `menuitem` or
 *   `menuitemradio` roles; an item that calls `preventDefault()` on its click
 *   keeps the menu open.
 * @fires open - Fired after the menu opens.
 * @fires close - Fired after close with an `OrcMenuCloseDetail` reason.
 * @fires cancel - Cancelable; fired before Escape, outside-pointer, or scroll dismissal.
 * @cssprop [--orc-split-button-radius] - Outer corner radius shared by both halves.
 *   Defaults to `--orc-radius-md`.
 * @cssprop [--orc-split-button-fill] - Chevron fill for the `primary` variant.
 *   Set it to whatever paints the primary button so the two halves never
 *   drift; the host swaps it for the hover fill while either half is hovered.
 * @cssprop [--orc-split-button-fill-hover] - Chevron fill while hovered or open.
 * @cssprop [--orc-split-button-ink] - Chevron colour for the `primary` variant.
 * @csspart trigger - The chevron button, re-exported from the composed menu.
 * @csspart chevron - The chevron icon.
 * @csspart menu - The floating menu layer.
 */
export class OrcSplitButton extends HTMLElementBase {
  static get observedAttributes(): string[] {
    return ["disabled", "label", "menu-label", "open", "size"];
  }

  // The composed menu's events stop at the shadow boundary and are re-issued
  // from this host, so a consumer sees exactly one event per change whether or
  // not the environment retargets composed events onto shadow hosts.
  private readonly onMenuOpen = (event: Event): void => {
    event.stopPropagation();
    if (!this.hasAttribute("open")) this.setAttribute("open", "");
    this.dispatchEvent(new Event("open"));
  };

  private readonly onMenuClose = (event: Event): void => {
    event.stopPropagation();
    if (this.hasAttribute("open")) this.removeAttribute("open");
    this.dispatchEvent(
      new CustomEvent<OrcMenuCloseDetail>("close", {
        detail: (event as CustomEvent<OrcMenuCloseDetail>).detail,
      }),
    );
  };

  private readonly onMenuCancel = (event: Event): void => {
    event.stopPropagation();
    const accepted = this.dispatchEvent(
      new CustomEvent<OrcMenuCloseDetail>("cancel", {
        cancelable: true,
        detail: (event as CustomEvent<OrcMenuCloseDetail>).detail,
      }),
    );
    if (!accepted) event.preventDefault();
  };

  constructor() {
    super();
    this.attachShadow({ mode: "open" }).innerHTML = template;
    const menu = this.menu;
    menu?.addEventListener("open", this.onMenuOpen);
    menu?.addEventListener("close", this.onMenuClose);
    menu?.addEventListener("cancel", this.onMenuCancel);
  }

  connectedCallback(): void {
    this.syncAttributes();
  }

  attributeChangedCallback(): void {
    this.syncAttributes();
  }

  get open(): boolean {
    return this.hasAttribute("open");
  }

  set open(next: boolean) {
    this.toggleAttribute("open", Boolean(next));
  }

  get disabled(): boolean {
    return this.hasAttribute("disabled");
  }

  set disabled(next: boolean) {
    this.toggleAttribute("disabled", Boolean(next));
  }

  /** The composed `<orc-menu>` that owns the chevron and the floating layer. */
  get menu(): OrcMenu | null {
    return this.shadowRoot?.querySelector<OrcMenu>("orc-menu") ?? null;
  }

  /** The native chevron button. */
  get trigger(): HTMLButtonElement | null {
    return this.menu?.trigger ?? null;
  }

  show(focus: "first" | "last" = "first"): void {
    this.menu?.show(focus);
  }

  close(reason: OrcMenuCloseDetail["reason"] = "programmatic", restoreFocus = false): void {
    this.menu?.close(reason, restoreFocus);
  }

  private syncAttributes(): void {
    const menu = this.menu;
    if (!menu) return;
    menu.setAttribute("label", this.getAttribute("label")?.trim() || "More actions");
    menu.setAttribute("trigger-label", this.getAttribute("menu-label")?.trim() || "More actions");
    if (this.getAttribute("size") === "compact") menu.setAttribute("size", "compact");
    else menu.removeAttribute("size");
    menu.toggleAttribute("disabled", this.hasAttribute("disabled"));
    if (this.hasAttribute("open") !== menu.hasAttribute("open")) {
      menu.toggleAttribute("open", this.hasAttribute("open"));
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "orc-split-button": OrcSplitButton;
  }
}
