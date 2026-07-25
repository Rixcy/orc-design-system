const HTMLElementBase = (
  typeof HTMLElement === "undefined" ? class {} : HTMLElement
) as typeof HTMLElement;

// A native-CSS status indicator: an 8px
// tone-tinted dot with a required accessible label, since the dot itself is
// decorative and status must never be conveyed by color alone.
const template = `
  <style>
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--orc-space-1, 4px);
      font-family: var(--orc-font-sans, Inter, ui-sans-serif, system-ui, sans-serif);
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
      background: var(--orc-accent, #78a9c2);
    }

    :host([tone="muted"]) .dot {
      background: var(--orc-muted-strong, #565f89);
    }

    :host([tone="red"]) .dot {
      background: var(--orc-red, #e87878);
    }

    :host([tone="green"]) .dot {
      background: var(--orc-green, #9dc76b);
    }

    :host([tone="yellow"]) .dot {
      background: var(--orc-yellow, #d5b05c);
    }

    @media (prefers-reduced-motion: no-preference) {
      :host([pulse]) .dot {
        animation: orc-dot-pulse 1.6s ease-in-out infinite;
      }
    }

    @keyframes orc-dot-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }

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
  </style>
  <span class="dot" aria-hidden="true"></span>
  <span class="sr-only"></span>
`;

/**
 * `<orc-status-dot>` is a small coloured status indicator with a
 * screen-reader-only label, optionally pulsing or announced live.
 *
 * @customElement orc-status-dot
 * @attr {"accent"|"muted"|"red"|"green"|"yellow"} tone - Dot colour.
 * @attr {boolean} pulse - Animates the dot; respects `prefers-reduced-motion`.
 * @attr {string} label - Text exposed to assistive technology.
 * @attr {boolean} live - Announces label changes via `role="status"`.
 */
export class OrcStatusDot extends HTMLElementBase {
  static get observedAttributes(): string[] {
    return ["tone", "pulse", "label", "live"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" }).innerHTML = template;
  }

  connectedCallback(): void {
    this.render();
  }

  attributeChangedCallback(): void {
    this.render();
  }

  private get labelEl(): HTMLElement | null {
    return this.shadowRoot?.querySelector(".sr-only") ?? null;
  }

  private render(): void {
    const label = this.labelEl;
    if (!label) return;
    label.textContent = this.getAttribute("label")?.trim() ?? "";
    if (this.hasAttribute("live")) {
      label.setAttribute("role", "status");
    } else {
      label.removeAttribute("role");
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "orc-status-dot": OrcStatusDot;
  }
}
