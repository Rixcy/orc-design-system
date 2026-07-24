const HTMLElementBase = (
  typeof HTMLElement === "undefined" ? class {} : HTMLElement
) as typeof HTMLElement;

// The canonical Orc lockup: emblem, the `/orc` wordmark, then an optional
// product word. The emblem geometry is the vendored mark from
// src/assets/orc-emblem.svg, inlined so the element carries no external asset
// reference (a background url() would not resolve for package consumers). Its
// artwork colours stay first-party per src/assets/ASSETS.md; the wordmark is
// theme-token coloured so it reads on light and dark surfaces alike.
const template = `
  <style>
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--orc-space-2, 0.5rem);
      font-family: var(--orc-font-sans, Inter, ui-sans-serif, system-ui, sans-serif);
      font-weight: 600;
      font-size: 15px;
      line-height: 1;
      letter-spacing: -0.01em;
      color: var(--orc-heading, #c0caf5);
    }

    :host([size="sm"]) {
      gap: 0.375rem;
      font-size: 13px;
    }

    :host([size="lg"]) {
      gap: 0.625rem;
      font-size: 22px;
    }

    .mark {
      width: 2em;
      height: 2em;
      flex: none;
    }

    .slash {
      color: var(--orc-green-text, var(--orc-green, #9dc76b));
    }

    /* muted-strong, not muted: the product word is body-size prose and must
       clear 4.5:1 on the day panel, which plain --orc-muted does not. */
    .product {
      color: var(--orc-muted-strong, #565f89);
      font-weight: 400;
    }

    .product:empty {
      display: none;
    }
  </style>
  <svg class="mark" viewBox="-84 -78 168 144" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="skin" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#9dc76b"/>
        <stop offset="1" stop-color="#53743a"/>
      </linearGradient>
    </defs>
    <path d="M-52 -14 L-78 -34 L-58 2 Z" fill="#53743a"/>
    <path d="M52 -14 L78 -34 L58 2 Z" fill="#53743a"/>
    <path d="M-54 -18 C-54 -52 -30 -64 0 -64 C30 -64 54 -52 54 -18 C54 10 40 30 26 40 C14 49 10 52 0 52 C-10 52 -14 49 -26 40 C-40 30 -54 10 -54 -18 Z" fill="url(#skin)" stroke="#202722" stroke-width="4"/>
    <path d="M-40 -24 L-8 -14 L-8 -4 L-42 -12 Z" fill="#202722"/>
    <path d="M40 -24 L8 -14 L8 -4 L42 -12 Z" fill="#202722"/>
    <circle cx="-24" cy="0" r="6.5" fill="#eceeec"/>
    <circle cx="24" cy="0" r="6.5" fill="#eceeec"/>
    <circle cx="-23" cy="1" r="3" fill="#16181b"/>
    <circle cx="25" cy="1" r="3" fill="#16181b"/>
    <path d="M0 8 L-9 24 L9 24 Z" fill="#202722"/>
    <path d="M-16 36 Q0 44 16 36" fill="none" stroke="#202722" stroke-width="4" stroke-linecap="round"/>
    <path d="M-16 40 L-22 14 L-9 36 Z" fill="#eceeec" stroke="#202722" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M16 40 L22 14 L9 36 Z" fill="#eceeec" stroke="#202722" stroke-width="2.5" stroke-linejoin="round"/>
  </svg>
  <span class="word" translate="no"><span class="slash">/</span>orc <span class="product"></span></span>
`;

const SIZES = new Set(["sm", "md", "lg"]);

/**
 * `<orc-logomark>` renders the Orc mark plus wordmark lockup, optionally
 * suffixed with a product name.
 *
 * @customElement orc-logomark
 * @attr {string} product - Product name shown after the wordmark.
 * @attr {"sm"|"md"|"lg"} size - Lockup size. Unknown values fall back to `md`.
 */
export class OrcLogomark extends HTMLElementBase {
  static get observedAttributes(): string[] {
    return ["product", "size"];
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

  private render(): void {
    const size = this.getAttribute("size");
    if (size !== null && !SIZES.has(size)) this.setAttribute("size", "md");
    const product = this.shadowRoot?.querySelector<HTMLElement>(".product");
    // The lockup's visible text is its accessible name — the emblem is
    // aria-hidden, so nothing announces twice.
    if (product) product.textContent = this.getAttribute("product")?.trim() ?? "";
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "orc-logomark": OrcLogomark;
  }
}
