const HTMLElementBase = (
  typeof HTMLElement === "undefined" ? class {} : HTMLElement
) as typeof HTMLElement;

let instanceCount = 0;

// A native-first port of the reference app's modal dialog: the native <dialog>
// element gives us Esc-to-close, a focus trap, an inert background, and a
// top-layer stacking context for free via showModal(). We only add the
// chrome (header, close button, light-dismiss) on top.
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
      max-height: min(76vh, 720px);
      margin: auto;
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
      padding: var(--orc-space-4, 1rem);
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

    @media (prefers-reduced-motion: reduce) {
      button.close {
        transition: none;
      }
    }
  </style>
  <dialog>
    <header>
      <h2></h2>
      <button type="button" class="close" aria-label="Close">
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M3 3 L13 13 M13 3 L3 13" />
        </svg>
      </button>
    </header>
    <div class="body"><slot></slot></div>
    <footer hidden><slot name="footer"></slot></footer>
  </dialog>
`;

export class OrcDialog extends HTMLElementBase {
  static get observedAttributes(): string[] {
    return ["open", "heading", "no-light-dismiss"];
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
  }

  connectedCallback(): void {
    this.renderHeading();
    this.syncFooter();
    this.syncOpenState();
  }

  attributeChangedCallback(name: string): void {
    if (name === "open") {
      this.syncOpenState();
    } else if (name === "heading") {
      this.renderHeading();
    }
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
  }

  private syncFooter(): void {
    const footer = this.shadowRoot?.querySelector("footer");
    const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="footer"]');
    if (!footer || !slot) return;
    footer.hidden = slot.assignedNodes().length === 0;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "orc-dialog": OrcDialog;
  }
}
