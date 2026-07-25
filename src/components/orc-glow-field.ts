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
      min-height: 82px;
      resize: vertical;
      box-sizing: border-box;
      padding: 13px 14px 8px;
      border: 0;
      outline: 0;
      background: transparent;
      color: var(--orc-text, #c7cfca);
      font: inherit;
      font-size: 13px;
      line-height: 1.5;
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
    <footer hidden><slot name="footer"></slot></footer>
  </div>
`;

export class OrcGlowField extends HTMLElementBase {
  static get observedAttributes(): string[] {
    return ["placeholder", "label", "disabled"];
  }

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

  private get textarea(): HTMLTextAreaElement | null {
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
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "orc-glow-field": OrcGlowField;
  }
}
