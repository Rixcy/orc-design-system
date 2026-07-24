const HTMLElementBase = (
  typeof HTMLElement === "undefined" ? class {} : HTMLElement
) as typeof HTMLElement;

// A native-CSS port of the reference app's tag/chip family:
// a small pill label with a
// tinted background and an AA-contrast text token per variant. This is a
// static label, not a control, so it renders a <span> with no button
// semantics — status is always conveyed by the slotted text, never by the
// leading dot alone.
const template = `
  <style>
    :host {
      display: inline-flex;
      max-inline-size: 100%;
      font-family: var(--orc-font-sans, Inter, ui-sans-serif, system-ui, sans-serif);
    }

    .chip {
      display: inline-flex;
      align-items: center;
      gap: var(--orc-space-1, 4px);
      max-inline-size: 100%;
      padding: 2px 8px;
      border-radius: var(--orc-radius-pill, 999px);
      border: 1px solid transparent;
      font-size: 11px;
      font-weight: 600;
      line-height: 1.4;
      overflow-wrap: anywhere;
      color: var(--orc-muted-strong, #565f89);
      background: transparent;
      border-color: var(--orc-border, #3b4540);
    }

    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      flex-shrink: 0;
      background: currentColor;
    }

    :host([variant="green"]) .chip {
      color: var(--orc-green-text, #9dc76b);
      background: color-mix(in srgb, var(--orc-green, #9dc76b) 15%, transparent);
      border-color: transparent;
    }

    :host([variant="yellow"]) .chip {
      color: var(--orc-yellow-text, #d5b05c);
      background: color-mix(in srgb, var(--orc-yellow, #d5b05c) 15%, transparent);
      border-color: transparent;
    }

    :host([variant="red"]) .chip {
      color: var(--orc-red-text, #e87878);
      background: color-mix(in srgb, var(--orc-red, #e87878) 15%, transparent);
      border-color: transparent;
    }

    :host([variant="purple"]) .chip {
      color: var(--orc-purple-text, #b497d6);
      background: color-mix(in srgb, var(--orc-purple, #b497d6) 15%, transparent);
      border-color: transparent;
    }

    :host([variant="cyan"]) .chip {
      color: var(
        --orc-cyan-text,
        color-mix(in srgb, var(--orc-cyan, #77b8b1) 55%, var(--orc-heading, #e0e5e2))
      );
      background: color-mix(in srgb, var(--orc-cyan, #77b8b1) 15%, transparent);
      border-color: transparent;
    }

    :host([variant="orange"]) .chip {
      color: var(
        --orc-orange-text,
        color-mix(in srgb, var(--orc-orange, #e69257) 55%, var(--orc-heading, #e0e5e2))
      );
      background: color-mix(in srgb, var(--orc-orange, #e69257) 15%, transparent);
      border-color: transparent;
    }

    :host([variant="accent"]) .chip {
      color: var(--orc-accent-text, #78a9c2);
      background: color-mix(in srgb, var(--orc-accent, #78a9c2) 15%, transparent);
      border-color: transparent;
    }
  </style>
  <span class="chip">
    <span class="dot" aria-hidden="true" hidden></span>
    <slot></slot>
  </span>
`;

const VARIANTS = new Set([
  "neutral",
  "green",
  "yellow",
  "red",
  "purple",
  "cyan",
  "orange",
  "accent",
]);

/**
 * `<orc-chip>` is a compact status pill in one of the token colour families,
 * optionally preceded by a status dot.
 *
 * @customElement orc-chip
 * @attr {"neutral"|"green"|"yellow"|"red"|"purple"|"cyan"|"orange"|"accent"} variant - Colour family. Unknown values fall back to `neutral`.
 * @attr {boolean} dot - Shows the leading status dot.
 * @slot - Chip label content.
 */
export class OrcChip extends HTMLElementBase {
  static get observedAttributes(): string[] {
    return ["variant", "dot"];
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

  private get dotEl(): HTMLElement | null {
    return this.shadowRoot?.querySelector(".dot") ?? null;
  }

  private render(): void {
    const variant = this.getAttribute("variant");
    if (!variant || !VARIANTS.has(variant)) {
      this.setAttribute("variant", "neutral");
      return;
    }

    const dot = this.dotEl;
    if (dot) dot.hidden = !this.hasAttribute("dot");
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "orc-chip": OrcChip;
  }
}
