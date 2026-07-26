let instanceCount = 0;

const HTMLElementBase = (
  typeof HTMLElement === "undefined" ? class {} : HTMLElement
) as typeof HTMLElement;

// A native-CSS glowing input surround: the conic gradient is masked down to a 1px edge and never sits over field content.
const template = `
  <style>
    :host {
      display: block;
      font-family: var(--orc-font-sans, Inter, ui-sans-serif, system-ui, sans-serif);
    }

    @property --orc-beam-angle {
      syntax: "<angle>";
      inherits: false;
      initial-value: 24deg;
    }

    @keyframes orc-beam {
      to { --orc-beam-angle: 384deg; }
    }

    .field {
      --orc-beam-angle: 24deg;
      position: relative;
      isolation: isolate;
      border: 1px solid var(--orc-control-border, #565f89);
      border-radius: var(--orc-radius-md, 0.5rem);
      background: var(--orc-panel, #16181b);
      transition: border-color 0.16s ease-out, outline-color 0.16s ease-out;
    }

    .field::before {
      content: "";
      position: absolute;
      inset: -1px;
      z-index: 1;
      padding: 1px;
      border-radius: inherit;
      pointer-events: none;
      background: conic-gradient(from var(--orc-beam-angle),
        transparent 0 58%,
        color-mix(in srgb, var(--orc-green, #9dc76b) 32%, transparent) 66%,
        var(--orc-green, #9dc76b) 73%,
        color-mix(in srgb, var(--orc-yellow, #d5b05c) 76%, var(--orc-green, #9dc76b)) 78%,
        color-mix(in srgb, var(--orc-green, #9dc76b) 34%, transparent) 85%,
        transparent 92% 100%),
        linear-gradient(var(--orc-beam-underlay, transparent) 0 0);
      -webkit-mask: linear-gradient(currentColor 0 0) content-box, linear-gradient(currentColor 0 0);
      -webkit-mask-composite: xor;
      mask: linear-gradient(currentColor 0 0) content-box, linear-gradient(currentColor 0 0);
      mask-composite: exclude;
    }

    @media (prefers-reduced-motion: no-preference) {
      .field::before { animation: orc-beam 7s linear infinite; }
      /* Focus quickens the beam — the always-on cue that survives ring suppression. */
      .field:has(textarea:focus)::before { animation-duration: 3s; }
    }

    :host(:not([suppress-focus-ring])) .field:has(textarea:focus-visible) {
      border-color: var(--orc-accent, #78a9c2);
      outline: var(--orc-focus-ring, 2px solid #78a9c2);
      outline-offset: var(--orc-focus-offset, 2px);
    }

    /* Soft always-on focus cue that lives in the beam itself: focus lights a
       faint green rim under the sweeping gradient (plus the speed-up in the
       reduced-motion block below). Keyboard focus still gets the full ring
       above. */
    .field:has(textarea:focus) {
      --orc-beam-underlay: color-mix(in srgb, var(--orc-green, #9dc76b) 45%, transparent);
    }

    textarea {
      display: block;
      width: 100%;
      min-height: var(--orc-glow-field-min-height, 82px);
      resize: vertical;
      box-sizing: border-box;
      padding: 13px 14px 8px;
      border: 0;
      outline: 0;
      background: transparent;
      color: var(--orc-text, #c7cfca);
      font: inherit;
      font-size: var(--orc-glow-field-font-size, 13px);
      line-height: 1.5;
    }

    /* Same screen-reader-only treatment as <orc-status-dot>'s .sr-only. */
    .sr-only {
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

    textarea:disabled {
      color: var(--orc-muted-strong, #565f89);
      cursor: not-allowed;
    }

    footer {
      min-height: 45px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 5px 8px 6px 13px;
      border-top: 1px solid var(--orc-border, #3b4540);
      color: var(--orc-muted-strong, #565f89);
      font-size: 11px;
    }

    footer[hidden] { display: none; }

    @media (prefers-reduced-motion: reduce) {
      .field::before {
        animation: none;
        background: linear-gradient(112deg, transparent 12%, var(--orc-green, #9dc76b) 48%,
          color-mix(in srgb, var(--orc-yellow, #d5b05c) 70%, var(--orc-green, #9dc76b)) 58%, transparent 88%),
          linear-gradient(var(--orc-beam-underlay, transparent) 0 0);
      }
    }

    @media (forced-colors: active) {
      .field { border-color: CanvasText; }
      .field::before {
        animation: none;
        background: none;
        -webkit-mask: none;
        mask: none;
        border: 1px solid CanvasText;
      }
      :host(:not([suppress-focus-ring])) .field:has(textarea:focus-visible) {
        border-color: Highlight;
        outline-color: Highlight;
      }
    }
  </style>
  <div class="field">
    <textarea></textarea>
    <p class="sr-only description" hidden></p>
    <footer hidden><slot name="footer"></slot></footer>
  </div>
`;

/**
 * `<orc-glow-field>` is the composer textarea with an animated beam border —
 * `<orc-textarea>`'s expressive sibling for primary input surfaces.
 *
 * @customElement orc-glow-field
 * @attr {string} label - Accessible name for the textarea.
 * @attr {string} placeholder - Native placeholder text.
 * @attr {boolean} disabled - Disables the inner textarea and stops the beam.
 * @attr {number} rows - Native textarea `rows`, for app composers that size by line count.
 * @attr {string} description - Extra hint announced with the textarea (rendered visually hidden; the visible copy belongs in the footer).
 * @attr {boolean} suppress-focus-ring - Drops the keyboard focus ring; the beam still lights and quickens on focus.
 * @slot footer - Actions below the input; the footer row stays hidden while empty.
 * @cssprop [--orc-beam-angle] - Current beam rotation angle (animated).
 * @cssprop [--orc-beam-underlay] - Beam underlay colour behind the field.
 * @cssprop [--orc-control-border] - Border colour of the resting field.
 * @cssprop [--orc-glow-field-min-height=82px] - Minimum height of the textarea.
 * @cssprop [--orc-glow-field-font-size=13px] - Font size of the textarea.
 */
export class OrcGlowField extends HTMLElementBase {
  static get observedAttributes(): string[] {
    return ["placeholder", "label", "disabled", "rows", "description"];
  }

  private readonly elementId = `orc-glow-field-${++instanceCount}`;

  constructor() {
    super();
    this.attachShadow({ mode: "open" }).innerHTML = template;
    const slot = this.shadowRoot?.querySelector("slot");
    slot?.addEventListener("slotchange", () => {
      const footer = this.shadowRoot?.querySelector("footer");
      if (footer) footer.hidden = slot.assignedNodes().length === 0;
    });
  }

  connectedCallback(): void {
    this.render();
  }

  attributeChangedCallback(): void {
    this.render();
  }

  get value(): string {
    return this.textarea?.value ?? "";
  }

  set value(next: string) {
    const textarea = this.textarea;
    if (textarea) textarea.value = next;
  }

  focus(options?: FocusOptions): void {
    this.textarea?.focus(options);
  }

  /** The native textarea, so an app can wire its own listeners and attachment plumbing to it. */
  get textarea(): HTMLTextAreaElement | null {
    return this.shadowRoot?.querySelector("textarea") ?? null;
  }

  private render(): void {
    const textarea = this.textarea;
    if (!textarea) return;
    textarea.placeholder = this.getAttribute("placeholder") ?? "";
    textarea.setAttribute(
      "aria-label",
      this.getAttribute("label")?.trim() || "Message",
    );
    textarea.disabled = this.hasAttribute("disabled");

    const rows = this.getAttribute("rows");
    if (rows) textarea.setAttribute("rows", rows);
    else textarea.removeAttribute("rows");

    // Mirrors <orc-dialog>'s syncDescription: an IDREF pointing at an empty
    // node yields an empty description, which is worse than none.
    const description = this.shadowRoot?.querySelector<HTMLElement>(
      ".description",
    );
    const hint = this.getAttribute("description")?.trim() ?? "";
    if (!description) return;
    description.textContent = hint;
    description.hidden = hint === "";
    if (hint === "") {
      textarea.removeAttribute("aria-describedby");
      return;
    }
    description.id ||= `${this.elementId}-description`;
    textarea.setAttribute("aria-describedby", description.id);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "orc-glow-field": OrcGlowField;
  }
}
