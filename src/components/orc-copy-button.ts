import { OrcButton } from "./orc-button";

/** Detail carried by the `orc-copy` event. */
export interface OrcCopyDetail {
  /** Whether the clipboard write succeeded. */
  ok: boolean;
  /** The text the button attempted to copy. */
  value: string;
}

// Matches ui/js/artifact.js, the closest existing precedent for this control.
const REVERT_MS = 1200;

// Appended after the inherited button stylesheet, so these rules win the
// specificity ties with the variant and hover rules they override. The
// transient state deliberately renders as a tinted outline on every variant
// rather than recolouring each one: "Copied" written in green on the green
// primary fill is not a state anyone can read.
const stateStyles = `
  :host([state]) slot {
    display: none;
  }

  .state-label {
    display: none;
  }

  :host([state]) .state-label {
    display: inline;
  }

  :host([state]) button,
  :host([state]) button:hover:not(:disabled) {
    background: color-mix(in srgb, var(--orc-text, #c7cfca) 6%, transparent);
  }

  :host([state="copied"]) button,
  :host([state="copied"]) button:hover:not(:disabled) {
    border-color: var(--orc-green, #9dc76b);
    color: var(--orc-green-text, var(--orc-green, #9dc76b));
  }

  :host([state="failed"]) button,
  :host([state="failed"]) button:hover:not(:disabled) {
    border-color: var(--orc-red, #e87878);
    color: var(--orc-red-text, var(--orc-red, #e87878));
  }

  .live {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    border: 0;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
`;

/**
 * `<orc-copy-button>` writes its `value` to the clipboard and reports the
 * result in place: the slotted label is replaced by "Copied" or "Copy failed"
 * for 1.2s, and the same text is announced through a live region. Every other
 * behaviour — variants, sizes, `disabled`, focus ring — comes from
 * `<orc-button>`, which it extends.
 *
 * @customElement orc-copy-button
 * @attr {string} value - The text written to the clipboard.
 * @attr {"primary"|"ghost"} variant - Visual weight. Defaults to `primary`.
 * @attr {"default"|"compact"} size - Control density. Defaults to `default`.
 * @attr {boolean} disabled - Disables the button; a disabled button never copies.
 * @attr {"copied"|"failed"} state - Set by the component while the outcome
 *   shows. Read-only to consumers.
 * @fires orc-copy - `CustomEvent<OrcCopyDetail>` after every copy attempt.
 * @slot - Button label content, hidden while the outcome shows.
 */
export class OrcCopyButton extends OrcButton {
  private revertTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    super();
    const root = this.shadowRoot as ShadowRoot;
    const doc = root.ownerDocument;

    const style = doc.createElement("style");
    style.textContent = stateStyles;
    root.append(style);

    const label = doc.createElement("span");
    label.className = "state-label";
    root.querySelector("button")?.append(label);

    const live = doc.createElement("span");
    live.className = "live";
    live.setAttribute("role", "status");
    live.setAttribute("aria-live", "polite");
    root.append(live);

    root
      .querySelector("button")
      ?.addEventListener("click", () => void this.copy());
  }

  disconnectedCallback(): void {
    clearTimeout(this.revertTimer);
  }

  private get labelEl(): HTMLElement | null {
    return this.shadowRoot?.querySelector(".state-label") ?? null;
  }

  private get liveEl(): HTMLElement | null {
    return this.shadowRoot?.querySelector(".live") ?? null;
  }

  // A native disabled button cannot be clicked, so this guard only matters for
  // a control disabled between the click and the clipboard settling.
  private async copy(): Promise<void> {
    if (this.disabled) return;
    const value = this.getAttribute("value") ?? "";

    let ok = true;
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      ok = false;
    }

    this.showState(ok);
    this.dispatchEvent(
      new CustomEvent<OrcCopyDetail>("orc-copy", {
        bubbles: true,
        composed: true,
        detail: { ok, value },
      }),
    );
  }

  private showState(ok: boolean): void {
    const text = ok ? "Copied" : "Copy failed";

    // Pinned before the label swaps, and only from the resting label: a second
    // click while the outcome shows would otherwise pin the outcome's width.
    if (!this.hasAttribute("state")) {
      this.style.minWidth = `${this.offsetWidth}px`;
    }

    const label = this.labelEl;
    if (label) label.textContent = text;
    this.setAttribute("state", ok ? "copied" : "failed");

    const live = this.liveEl;
    if (live) live.textContent = text;

    clearTimeout(this.revertTimer);
    this.revertTimer = setTimeout(() => this.revert(), REVERT_MS);
  }

  private revert(): void {
    this.removeAttribute("state");
    this.style.minWidth = "";
    const label = this.labelEl;
    if (label) label.textContent = "";
    const live = this.liveEl;
    if (live) live.textContent = "";
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "orc-copy-button": OrcCopyButton;
  }
}
