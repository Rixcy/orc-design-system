const HTMLElementBase = (
  typeof HTMLElement === "undefined" ? class {} : HTMLElement
) as typeof HTMLElement;

const template = `
  <style>
    :host {
      display: block;
      color: var(--orc-text, #c0caf5);
      background: var(--orc-panel, #16161e);
      border-block-end: 1px solid var(--orc-border, #3b4261);
      font-family: var(--orc-font-sans, Inter, ui-sans-serif, system-ui, sans-serif);
    }

    nav {
      display: grid;
      grid-template-columns: minmax(0, auto) minmax(0, 1fr) minmax(0, auto);
      align-items: center;
      gap: var(--orc-space-4, 1rem);
      max-inline-size: 80rem;
      min-block-size: 3.5rem;
      margin-inline: auto;
      padding-block: var(--orc-space-2, 0.5rem);
      padding-inline: max(var(--orc-space-4, 1rem), env(safe-area-inset-left)) max(var(--orc-space-4, 1rem), env(safe-area-inset-right));
    }

    .brand,
    .navigation,
    .actions {
      min-inline-size: 0;
    }

    .navigation {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--orc-space-3, 0.75rem);
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      align-items: center;
      gap: var(--orc-space-2, 0.5rem);
    }

    a {
      display: inline-flex;
      min-inline-size: 0;
      align-items: center;
      padding: var(--orc-space-2, 0.5rem);
      border-radius: var(--orc-radius-sm, 0.25rem);
      color: var(--orc-heading, #c0caf5);
      font-weight: 700;
      line-height: 1.25;
      text-decoration: none;
      overflow-wrap: anywhere;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
    }

    a:hover {
      background: var(--orc-button-hover, #292e42);
    }

    a:focus-visible {
      outline: var(--orc-focus-ring, 2px solid #7aa2f7);
      outline-offset: var(--orc-focus-offset, 2px);
    }

    ::slotted(*) {
      min-inline-size: 0;
      max-inline-size: 100%;
    }

    @media (max-width: 40rem) {
      nav {
        grid-template-columns: minmax(0, 1fr) auto;
      }

      .navigation {
        grid-column: 1 / -1;
        grid-row: 2;
      }
    }
  </style>
  <nav aria-label="Primary">
    <div class="brand">
      <slot name="brand">
        <a id="brand-link" href="/" aria-label="Orc home" translate="no">
          <span id="brand-text">Orc</span>
        </a>
      </slot>
    </div>
    <div class="navigation"><slot name="nav"></slot></div>
    <div class="actions"><slot name="actions"></slot></div>
  </nav>
`;

export class OrcNavbar extends HTMLElementBase {
  static get observedAttributes(): string[] {
    return ["brand-label", "home-href", "home-label"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" }).innerHTML = template;
  }

  connectedCallback(): void {
    this.updateFallbackBrand();
  }

  attributeChangedCallback(): void {
    this.updateFallbackBrand();
  }

  private updateFallbackBrand(): void {
    const root = this.shadowRoot;
    if (!root) return;
    const brandLabel = this.getAttribute("brand-label")?.trim() || "Orc";
    const homeHref = this.getAttribute("home-href")?.trim() || "/";
    const homeLabel = this.getAttribute("home-label")?.trim() || `${brandLabel} home`;
    const link = root.querySelector<HTMLAnchorElement>("#brand-link");
    const text = root.querySelector<HTMLElement>("#brand-text");
    if (link) {
      link.href = homeHref;
      link.setAttribute("aria-label", homeLabel);
    }
    if (text) text.textContent = brandLabel;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "orc-navbar": OrcNavbar;
  }
}
