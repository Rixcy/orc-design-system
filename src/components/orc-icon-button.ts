const HTMLElementBase = (
  typeof HTMLElement === "undefined" ? class {} : HTMLElement
) as typeof HTMLElement;

// Square icon-only control: a borderless `plain` weight (the orc-ui
// settings/stats/tickets buttons) and a bordered `ghost` weight (orc-ui's
// filter button). It renders as a link when `href` is set and a button
// otherwise, matching orc-theme-toggle's borderless sizing and orc-button's
// :host([variant=...]) pattern.
const template = `
  <style>
    :host {
      display: inline-block;
      font-family: var(--orc-font-sans, Inter, ui-sans-serif, system-ui, sans-serif);
    }

    button, a {
      display: flex;
      flex: 0 0 auto;
      inline-size: 2.25rem;
      block-size: 2.25rem;
      align-items: center;
      justify-content: center;
      padding: 0;
      border: 1px solid transparent;
      border-radius: var(--orc-radius-md, 0.5rem);
      color: var(--orc-muted-strong, #aeb5b0);
      background: none;
      text-decoration: none;
      cursor: pointer;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
      transition: background-color 120ms ease, border-color 120ms ease, color 120ms ease;
    }

    :host([size="compact"]) button,
    :host([size="compact"]) a {
      inline-size: 1.875rem;
      block-size: 1.875rem;
    }

    :host([variant="ghost"]) button,
    :host([variant="ghost"]) a {
      border-color: var(--orc-control-border, var(--orc-border, #3b4540));
    }

    button:hover:not(:disabled),
    a:hover {
      background: var(--orc-button-hover-chip, #374334);
      color: var(--orc-heading, #e0e5e2);
    }

    :host([variant="ghost"]) button:hover:not(:disabled),
    :host([variant="ghost"]) a:hover {
      border-color: var(--orc-green, #9dc76b);
    }

    button:focus-visible,
    a:focus-visible {
      outline: var(--orc-focus-ring, 1px solid #9dc76b);
      outline-offset: var(--orc-focus-offset, 3px);
      color: var(--orc-heading, #e0e5e2);
    }

    button:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }

    ::slotted(svg) {
      inline-size: 1rem;
      block-size: 1rem;
    }

    @media (pointer: coarse) {
      button, a {
        inline-size: 44px;
        block-size: 44px;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      button, a {
        transition: none;
      }
    }
  </style>
  <button type="button"><slot></slot></button>
`;

/**
 * `<orc-icon-button>` is a square, icon-only control: a borderless `plain`
 * weight (the default) and a bordered `ghost` weight, rendering as an
 * `<a href>` when `href` is set and a `<button type="button">` otherwise.
 * `disabled` always wins, forcing a disabled native `<button>` with no href.
 *
 * @customElement orc-icon-button
 * @attr {"plain"|"ghost"} variant - Visual weight. Defaults to `plain`.
 * @attr {"default"|"compact"} size - Control density. Defaults to `default`.
 * @attr {boolean} disabled - Disables the control and forces a `<button>`, overriding `href`.
 * @attr {string} label - Required accessible name; mirrored onto `aria-label` and `title`.
 * @attr {string} href - Renders the control as an `<a href>` instead of a `<button>`.
 * @attr {string} target - Passed through to the internal `<a>` when `href` is set.
 * @attr {string} rel - Passed through to the internal `<a>` when `href` is set.
 * @slot - Icon content. Mark it `aria-hidden="true"`; `label` supplies the accessible name.
 */
export class OrcIconButton extends HTMLElementBase {
  static get observedAttributes(): string[] {
    return ["disabled", "label", "href", "target", "rel"];
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

  // Reflected so `el.disabled = true` behaves the way it does on a native
  // button, matching orc-button.
  get disabled(): boolean {
    return this.hasAttribute("disabled");
  }

  set disabled(next: boolean) {
    this.toggleAttribute("disabled", Boolean(next));
  }

  private get control(): HTMLButtonElement | HTMLAnchorElement | null {
    return this.shadowRoot?.querySelector("button, a") ?? null;
  }

  private render(): void {
    const shadow = this.shadowRoot;
    if (!shadow) return;

    const disabled = this.hasAttribute("disabled");
    const href = this.getAttribute("href");
    const wantsLink = Boolean(href) && !disabled;
    const wantsTag = wantsLink ? "a" : "button";

    let el = this.control;
    // Swapping the element drops focus to <body>, so a control that was focused
    // when href/disabled changed has to be refocused by hand — but only after
    // the attributes below land: an <a> without an href is not a focusable
    // area, so focusing it here would silently do nothing. happy-dom does not
    // enforce that rule, so only a real browser catches a regression.
    let refocus = false;
    if (!el || el.tagName.toLowerCase() !== wantsTag) {
      const next = document.createElement(wantsTag);
      next.append(document.createElement("slot"));
      refocus = el !== null && shadow.activeElement === el && !disabled;
      if (el) el.replaceWith(next);
      else shadow.append(next);
      el = next;
    }

    if (wantsLink) {
      const a = el as HTMLAnchorElement;
      a.href = href!;
      const target = this.getAttribute("target");
      target ? a.setAttribute("target", target) : a.removeAttribute("target");
      const rel = this.getAttribute("rel");
      rel ? a.setAttribute("rel", rel) : a.removeAttribute("rel");
    } else {
      const button = el as HTMLButtonElement;
      button.type = "button";
      button.disabled = disabled;
    }

    // No label means no name to give: leave the attributes off rather than
    // asserting an empty one, which reads as a deliberate blank name.
    const label = this.getAttribute("label")?.trim() ?? "";
    if (label) {
      el.setAttribute("aria-label", label);
      el.title = label;
    } else {
      el.removeAttribute("aria-label");
      el.removeAttribute("title");
    }

    if (refocus) el.focus();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "orc-icon-button": OrcIconButton;
  }
}
