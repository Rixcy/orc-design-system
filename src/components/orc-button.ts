const HTMLElementBase = (
  typeof HTMLElement === "undefined" ? class {} : HTMLElement
) as typeof HTMLElement;

// A native-CSS port of the reference app's action buttons: a filled
// `primary` action and a bordered `ghost` action, both sharing size and
// focus-ring rules.
const template = `
  <style>
    :host {
      display: inline-block;
      max-inline-size: 100%;
      font-family: var(--orc-font-sans, Inter, ui-sans-serif, system-ui, sans-serif);
    }

    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      max-inline-size: 100%;
      padding: var(--orc-space-2, 0.5rem) var(--orc-space-3, 0.75rem);
      border: 1px solid transparent;
      border-radius: var(--orc-radius-md, 8px);
      background: transparent;
      color: inherit;
      font: inherit;
      font-weight: 600;
      font-size: 0.8125rem;
      line-height: 1.25;
      overflow-wrap: anywhere;
      cursor: pointer;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
      transition: background-color 120ms ease, border-color 120ms ease, color 120ms ease;
    }

    :host([size="compact"]) button {
      padding: calc(var(--orc-space-2, 0.5rem) * 0.75) var(--orc-space-2, 0.5rem);
      font-size: 0.75rem;
    }

    :host(:not([variant])) button,
    :host([variant="primary"]) button {
      background: var(--orc-green, #9dc76b);
      border-color: var(--orc-green, #9dc76b);
      color: var(--orc-panel, #16181b);
    }

    :host(:not([variant])) button:hover:not(:disabled),
    :host([variant="primary"]) button:hover:not(:disabled) {
      background: color-mix(in srgb, var(--orc-green, #9dc76b) 86%, var(--orc-heading, #e0e5e2));
      border-color: color-mix(in srgb, var(--orc-green, #9dc76b) 86%, var(--orc-heading, #e0e5e2));
    }

    :host([variant="ghost"]) button {
      background: transparent;
      border-color: var(--orc-border, #3b4540);
      color: var(--orc-text, #c7cfca);
    }

    :host([variant="ghost"]) button:hover:not(:disabled) {
      border-color: var(--orc-accent, #78a9c2);
      color: var(--orc-accent-text, var(--orc-accent, #78a9c2));
    }

    button:focus-visible {
      outline: var(--orc-focus-ring, 2px solid #78a9c2);
      outline-offset: var(--orc-focus-offset, 2px);
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    @media (prefers-reduced-motion: reduce) {
      button {
        transition: none;
      }
    }
  </style>
  <button type="button"><slot></slot></button>
`;

export class OrcButton extends HTMLElementBase {
  static get observedAttributes(): string[] {
    return ["disabled", "type"];
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

  private get button(): HTMLButtonElement | null {
    return this.shadowRoot?.querySelector("button") ?? null;
  }

  private render(): void {
    const button = this.button;
    if (!button) return;
    button.disabled = this.hasAttribute("disabled");
    const type = this.getAttribute("type");
    button.type = type === "submit" ? "submit" : "button";
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "orc-button": OrcButton;
  }
}
