const HTMLElementBase = (
  typeof HTMLElement === "undefined" ? class {} : HTMLElement
) as typeof HTMLElement;

let instanceCount = 0;

// A native-first modal dialog: the native <dialog> element gives us Esc-to-close, a focus trap, an inert background, and a
// top-layer stacking context for free via showModal(). We only add the
// chrome (header, close button, light-dismiss) on top.
// Hoisted so syncCloseButton() can put it back after a no-close removal.
const CLOSE_BUTTON = `
  <button type="button" class="close" aria-label="Close">
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 3 L13 13 M13 3 L3 13" />
    </svg>
  </button>
`;

const template = `
  <style>
    :host {
      display: contents;
      font-family: var(--orc-font-sans, Inter, ui-sans-serif, system-ui, sans-serif);
    }

    dialog {
      box-sizing: border-box;
      width: min(var(--orc-dialog-max-width, 680px), calc(100vw - 32px));
      max-width: var(--orc-dialog-max-width, 680px);
      min-height: var(--orc-dialog-min-height, auto);
      max-height: var(--orc-dialog-max-height, min(76vh, 720px));
      /* Positioning goes through margin rather than position/inset so a
         top-anchored surface (a command palette, say) needs no escape hatch
         into the shadow root: "12vh auto auto" sits it below the top edge and
         keeps it horizontally centred, inside the top layer. */
      margin: var(--orc-dialog-margin, auto);
      padding: 0;
      border: 1px solid var(--orc-border, #3b4540);
      border-radius: var(--orc-radius-md, 10px);
      background: var(--orc-panel, #16181b);
      color: var(--orc-text, #c7cfca);
      overflow: hidden;
    }

    dialog[open] {
      display: flex;
      flex-direction: column;
    }

    /* CSS custom properties don't reliably inherit into ::backdrop in older
       engines, so a literal rgba fallback comes first. */
    dialog::backdrop {
      background: rgba(10, 11, 12, 0.6);
      background: color-mix(in srgb, var(--orc-bg, #0a0b0c) 60%, transparent);
    }

    header {
      display: flex;
      align-items: center;
      gap: var(--orc-space-3, 0.75rem);
      padding: var(--orc-space-4, 1rem) var(--orc-space-4, 1rem);
      border-bottom: 1px solid var(--orc-border, #3b4540);
    }

    header:empty {
      display: none;
    }

    h2 {
      flex: 1;
      margin: 0;
      color: var(--orc-heading, #eef1ee);
      font-size: 15px;
      font-weight: 600;
      text-wrap: balance;
    }

    h2:empty {
      display: none;
    }

    button.close {
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2rem;
      height: 2rem;
      padding: 0;
      border: 0;
      border-radius: var(--orc-radius-sm, 8px);
      background: transparent;
      color: var(--orc-muted-strong, #565f89);
      font: inherit;
      cursor: pointer;
      transition: background-color 0.12s ease-out, color 0.12s ease-out;
    }

    button.close:hover {
      background: var(--orc-button-hover, #292e42);
      color: var(--orc-heading, #eef1ee);
    }

    button.close:focus-visible {
      outline: var(--orc-focus-ring, 2px solid #7aa2f7);
      outline-offset: var(--orc-focus-offset, 2px);
    }

    button.close svg {
      width: 16px;
      height: 16px;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.75;
      stroke-linecap: round;
    }

    .body {
      flex: 1 1 auto;
      overflow-y: auto;
      /* Zero this for a full-bleed body — a search field that should meet the
         dialog's edges, for instance. */
      padding: var(--orc-dialog-body-padding, var(--orc-space-4, 1rem));
    }

    footer {
      flex-shrink: 0;
      display: flex;
      justify-content: flex-end;
      gap: var(--orc-space-2, 0.5rem);
      padding: var(--orc-space-3, 0.75rem) var(--orc-space-4, 1rem);
      border-top: 1px solid var(--orc-border, #3b4540);
    }

    footer[hidden] {
      display: none;
    }

    /* The description sits at the top of the body and reads as supporting copy
       under the heading. It lives in its own wrapper because the inner
       <dialog> points aria-describedby at that wrapper's id: an IDREF only
       resolves within one tree, so a consumer cannot describe the dialog from
       light DOM by id. Slotting into a shadow-owned wrapper is what keeps the
       association intact. */
    .description {
      color: var(--orc-muted-strong, #565f89);
      font-size: 13px;
      line-height: 1.55;
    }

    .description[hidden] {
      display: none;
    }

    .description + .body {
      padding-top: var(--orc-space-2, 0.5rem);
    }

    @media (prefers-reduced-motion: reduce) {
      button.close {
        transition: none;
      }
    }
  </style>
  <dialog>
    <header>
      <h2></h2>
      ${CLOSE_BUTTON}
    </header>
    <div class="description" hidden><slot name="description"></slot></div>
    <div class="body"><slot></slot></div>
    <footer hidden><slot name="footer"></slot></footer>
  </dialog>
`;

/**
 * `<orc-dialog>` wraps the native `<dialog>` element: modal by default, with a
 * heading row, a close button, light-dismiss, and focus handling.
 *
 * @customElement orc-dialog
 * @attr {boolean} open - Reflects and controls visibility; setting it shows the modal.
 * @attr {string} heading - Heading text, also used as the dialog's accessible name.
 * @attr {string} label - Accessible name for a dialog with no visible heading.
 *   Ignored when `heading` is set. Use this instead of `aria-label` on the host,
 *   which cannot reach the `<dialog>` inside the shadow root.
 * @attr {boolean} no-light-dismiss - Keeps the dialog open on backdrop click.
 * @attr {boolean} no-close - Drops the close button. With no heading the whole
 *   chrome row collapses, giving a bare surface.
 * @cssprop [--orc-dialog-min-height=auto] - Minimum dialog height.
 * @cssprop [--orc-dialog-max-height=min(76vh, 720px)] - Maximum dialog height.
 * @cssprop [--orc-dialog-margin=auto] - Placement inside the top layer; e.g.
 *   `12vh auto auto` anchors it below the top edge, centred.
 * @cssprop [--orc-dialog-body-padding] - Body padding; zero it for full-bleed.
 * @slot - Dialog body content.
 * @slot description - Supporting copy under the heading, wired to the dialog's
 *   accessible description. Use this instead of `aria-describedby` on the host:
 *   the real `<dialog>` lives in the shadow root and an IDREF cannot cross that
 *   boundary. Stays hidden, and unwired, while empty.
 * @slot footer - Footer actions; the footer row stays hidden while empty.
 * @fires close - Fired after the dialog closes.
 * @fires cancel - Cancelable; fired on Escape or light dismiss, before closing.
 * @cssprop [--orc-dialog-max-width=32rem] - Maximum dialog width.
 */
export class OrcDialog extends HTMLElementBase {
  static get observedAttributes(): string[] {
    return ["open", "heading", "label", "no-light-dismiss", "no-close"];
  }

  private readonly elementId = `orc-dialog-${++instanceCount}`;

  private readonly onCloseButtonClick = (): void => this.close();

  private readonly onDialogClose = (): void => {
    if (this.hasAttribute("open")) this.removeAttribute("open");
    this.dispatchEvent(new Event("close", { composed: true }));
  };

  private readonly onDialogCancel = (event: Event): void => {
    const cancelEvent = new Event("cancel", { cancelable: true, composed: true });
    const notCancelled = this.dispatchEvent(cancelEvent);
    if (!notCancelled) event.preventDefault();
  };

  private readonly onDialogClick = (event: MouseEvent): void => {
    if (this.hasAttribute("no-light-dismiss")) return;
    if (event.target === this.dialogEl) this.close();
  };

  constructor() {
    super();
    this.attachShadow({ mode: "open" }).innerHTML = template;

    const dialog = this.dialogEl;
    const heading = this.headingEl;
    if (dialog) heading?.setAttribute("id", `${this.elementId}-heading`);

    this.closeButton?.addEventListener("click", this.onCloseButtonClick);
    dialog?.addEventListener("close", this.onDialogClose);
    dialog?.addEventListener("cancel", this.onDialogCancel);
    dialog?.addEventListener("click", this.onDialogClick);

    this.shadowRoot
      ?.querySelector('slot[name="footer"]')
      ?.addEventListener("slotchange", () => this.syncFooter());

    this.shadowRoot
      ?.querySelector('slot[name="description"]')
      ?.addEventListener("slotchange", () => this.syncDescription());
  }

  connectedCallback(): void {
    this.syncCloseButton();
    this.renderHeading();
    this.syncFooter();
    this.syncDescription();
    this.syncOpenState();
  }

  attributeChangedCallback(name: string): void {
    if (name === "open") {
      this.syncOpenState();
    } else if (name === "heading" || name === "label") {
      this.renderHeading();
    } else if (name === "no-close") {
      this.syncCloseButton();
    }
  }

  // Mirrors HTMLDialogElement.open. Code migrating off a native <dialog>
  // reads `dialog.open` as a matter of course; without this it silently
  // returns undefined, so an `if (dialog.open)` guard quietly inverts.
  get open(): boolean {
    return this.hasAttribute("open");
  }

  set open(next: boolean) {
    this.toggleAttribute("open", Boolean(next));
  }

  show(): void {
    if (!this.hasAttribute("open")) {
      this.setAttribute("open", "");
    } else {
      this.syncOpenState();
    }
  }

  close(returnValue?: string): void {
    const dialog = this.dialogEl;
    if (!dialog) return;

    if (typeof dialog.close === "function") {
      if (dialog.open) {
        dialog.close(returnValue);
        return;
      }
    }

    if (this.hasAttribute("open")) this.removeAttribute("open");
  }

  private get dialogEl(): HTMLDialogElement | null {
    return this.shadowRoot?.querySelector("dialog") ?? null;
  }

  private get headingEl(): HTMLHeadingElement | null {
    return this.shadowRoot?.querySelector("h2") ?? null;
  }

  private get closeButton(): HTMLButtonElement | null {
    return this.shadowRoot?.querySelector("button.close") ?? null;
  }

  private syncOpenState(): void {
    const dialog = this.dialogEl;
    if (!dialog) return;
    const shouldBeOpen = this.hasAttribute("open");

    if (shouldBeOpen) {
      if (typeof dialog.showModal === "function") {
        if (!dialog.open) dialog.showModal();
      } else {
        dialog.setAttribute("open", "");
      }
    } else if (typeof dialog.close === "function") {
      if (dialog.open) dialog.close();
    } else {
      dialog.removeAttribute("open");
    }
  }

  private renderHeading(): void {
    const dialog = this.dialogEl;
    const heading = this.headingEl;
    if (!dialog || !heading) return;

    const text = this.getAttribute("heading")?.trim() ?? "";
    heading.textContent = text;

    if (text) {
      dialog.setAttribute("aria-labelledby", heading.id);
    } else {
      dialog.removeAttribute("aria-labelledby");
    }

    // A dialog with no visible heading still needs a name. `label` puts one on
    // the inner <dialog> directly — aria-label on the host would never reach
    // it across the shadow boundary. A visible heading always wins, so the two
    // can never disagree.
    const label = this.getAttribute("label")?.trim() ?? "";
    if (label && !text) {
      dialog.setAttribute("aria-label", label);
    } else {
      dialog.removeAttribute("aria-label");
    }
  }

  // The close button is the only always-present child of <header>, so removing
  // it lets the existing `header:empty` rule collapse the whole chrome row for
  // a heading-less dialog — no separate "bare" mode to maintain.
  private syncCloseButton(): void {
    const existing = this.closeButton;
    const wanted = !this.hasAttribute("no-close");
    if (wanted === Boolean(existing)) return;

    if (!wanted) {
      existing?.removeEventListener("click", this.onCloseButtonClick);
      existing?.remove();
      return;
    }

    const header = this.shadowRoot?.querySelector("header");
    if (!header) return;
    header.insertAdjacentHTML("beforeend", CLOSE_BUTTON);
    this.closeButton?.addEventListener("click", this.onCloseButtonClick);
  }

  private syncFooter(): void {
    const footer = this.shadowRoot?.querySelector("footer");
    const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="footer"]');
    if (!footer || !slot) return;
    footer.hidden = slot.assignedNodes().length === 0;
  }

  // aria-describedby is only set while the slot actually has content: an IDREF
  // pointing at an empty wrapper yields an empty description, which is worse
  // than none because AT announces the dialog as described-by-nothing.
  private syncDescription(): void {
    const dialog = this.dialogEl;
    const description = this.descriptionEl;
    const slot = this.shadowRoot?.querySelector<HTMLSlotElement>(
      'slot[name="description"]',
    );
    if (!dialog || !description || !slot) return;

    const isEmpty = slot.assignedNodes().length === 0;
    description.hidden = isEmpty;

    if (isEmpty) {
      dialog.removeAttribute("aria-describedby");
      return;
    }

    description.id ||= `${this.elementId}-description`;
    dialog.setAttribute("aria-describedby", description.id);
  }

  private get descriptionEl(): HTMLElement | null {
    return this.shadowRoot?.querySelector(".description") ?? null;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "orc-dialog": OrcDialog;
  }
}
