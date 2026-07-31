const HTMLElementBase = (
  typeof HTMLElement === "undefined" ? class {} : HTMLElement
) as typeof HTMLElement;

// A native-CSS tag/chip: a small soft-filled label with a tinted background, a
// hairline border and an AA-contrast text token per variant. It is a label,
// never a button — status is always conveyed by the slotted text, never by the
// leading dot alone. With `href` it becomes the one thing a chip may also be:
// a link, rendered as a real <a> so it keeps native activation, middle-click
// and context menu. The accessible name still comes from the slotted content,
// which stays in the light DOM, so a consumer can extend it with its own
// visually-hidden text instead of an aria-label the shadow root can never see.
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
      /* DESIGN.md §5: Soft Fill background, 1px Border, 12px radius, 12px text,
         3px 10px padding. A soft-filled rounded rectangle, not a pill: the chip
         is a label on a dense surface, and the 12px corner keeps it reading as a
         sibling of the panels and inputs around it rather than as a floating
         capsule. */
      padding: 3px 10px;
      border-radius: var(--orc-radius-chip, 12px);
      border: 1px solid transparent;
      font-size: 12px;
      font-weight: 600;
      line-height: 1.4;
      overflow-wrap: anywhere;
      color: var(--orc-muted-strong, #aeb5b0);
      /* §5's Soft Fill, which the neutral chip was missing: every coloured
         variant carries its own 13-15% tint, and neutral had nothing, so a
         neutral chip read as an outline next to the filled pills around it.
         Consumers that want the outline back set --orc-chip: transparent. */
      background: var(--orc-chip, #29312c);
      border-color: var(--orc-border, #3b4540);
    }

    /* The chip's one interactive state, and it only exists on the link form:
       hover moves border and text to --orc-green, the colour this chip already
       focuses in. The variant rules below are written against the chip class,
       so they style the anchor and the span alike; this block is the only
       place the two differ. */
    a.chip {
      cursor: pointer;
      text-decoration: none;
      transition: background-color 120ms ease, border-color 120ms ease, color 120ms ease;
    }

    a.chip:hover {
      border-color: var(--orc-green, #9dc76b);
      color: var(--orc-green-text, var(--orc-green, #9dc76b));
    }

    a.chip:focus-visible {
      outline: var(--orc-focus-ring, 1px solid #9dc76b);
      outline-offset: var(--orc-focus-offset, 3px);
    }

    @media (prefers-reduced-motion: reduce) {
      a.chip {
        transition: none;
      }
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
      border-color: color-mix(in srgb, var(--orc-green, #9dc76b) 40%, transparent);
    }

    :host([variant="yellow"]) .chip {
      color: var(--orc-yellow-text, #d5b05c);
      background: color-mix(in srgb, var(--orc-yellow, #d5b05c) 15%, transparent);
      border-color: color-mix(in srgb, var(--orc-yellow, #d5b05c) 40%, transparent);
    }

    :host([variant="red"]) .chip {
      color: var(--orc-red-text, #e87878);
      background: color-mix(in srgb, var(--orc-red, #e87878) 15%, transparent);
      border-color: color-mix(in srgb, var(--orc-red, #e87878) 40%, transparent);
    }

    :host([variant="purple"]) .chip {
      color: var(--orc-purple-text, #b497d6);
      background: color-mix(in srgb, var(--orc-purple, #b497d6) 15%, transparent);
      border-color: color-mix(in srgb, var(--orc-purple, #b497d6) 40%, transparent);
    }

    :host([variant="cyan"]) .chip {
      color: var(
        --orc-cyan-text,
        color-mix(in srgb, var(--orc-cyan, #77b8b1) 55%, var(--orc-heading, #e0e5e2))
      );
      background: color-mix(in srgb, var(--orc-cyan, #77b8b1) 15%, transparent);
      border-color: color-mix(in srgb, var(--orc-cyan, #77b8b1) 40%, transparent);
    }

    :host([variant="orange"]) .chip {
      color: var(
        --orc-orange-text,
        color-mix(in srgb, var(--orc-orange, #e69257) 55%, var(--orc-heading, #e0e5e2))
      );
      background: color-mix(in srgb, var(--orc-orange, #e69257) 15%, transparent);
      border-color: color-mix(in srgb, var(--orc-orange, #e69257) 40%, transparent);
    }

    :host([variant="accent"]) .chip {
      color: var(--orc-accent-text, #78a9c2);
      background: color-mix(in srgb, var(--orc-accent, #78a9c2) 15%, transparent);
      border-color: color-mix(in srgb, var(--orc-accent, #78a9c2) 40%, transparent);
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
 * `<orc-chip>` is a compact status label in one of the token colour families,
 * optionally preceded by a status dot. With `href` it renders as a link chip.
 *
 * @customElement orc-chip
 * @attr {"neutral"|"green"|"yellow"|"red"|"purple"|"cyan"|"orange"|"accent"} variant - Colour family. Unknown values fall back to `neutral`.
 * @attr {boolean} dot - Shows the leading status dot.
 * @attr {string} href - Renders the chip as an `<a>` with this destination.
 * @attr {string} target - Anchor target. Only applies with `href`; `_blank`
 *   gets `rel="noopener"` unless the consumer supplies its own `rel`.
 * @attr {string} rel - Anchor relationship. Only applies with `href`.
 * @cssprop [--orc-radius-chip=12px] - Corner radius. Set it to a pill radius
 *   for a capsule chip.
 * @cssprop [--orc-chip] - Soft Fill behind the neutral chip. Set it to
 *   `transparent` for an outline-only chip.
 * @slot - Chip label content.
 */
export class OrcChip extends HTMLElementBase {
  static get observedAttributes(): string[] {
    return ["variant", "dot", "href", "target", "rel"];
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

  private get chipEl(): HTMLElement | null {
    return this.shadowRoot?.querySelector(".chip") ?? null;
  }

  private render(): void {
    const variant = this.getAttribute("variant");
    if (!variant || !VARIANTS.has(variant)) {
      this.setAttribute("variant", "neutral");
      return;
    }

    this.renderHref();

    const dot = this.dotEl;
    if (dot) dot.hidden = !this.hasAttribute("dot");
  }

  // Swaps the wrapper element rather than rendering two of them: a link chip is
  // an <a>, a label chip is a <span>, and nothing in between is a sensible
  // thing to expose to assistive technology.
  private renderHref(): void {
    const href = this.getAttribute("href");
    const wantsLink = href !== null && href !== "";
    let chip = this.chipEl;
    if (!chip) return;

    if (wantsLink !== (chip.tagName === "A")) {
      const next = this.ownerDocument.createElement(wantsLink ? "a" : "span");
      next.className = "chip";
      next.append(...chip.childNodes);
      chip.replaceWith(next);
      chip = next;
    }

    if (!wantsLink) return;
    chip.setAttribute("href", href);

    const target = this.getAttribute("target");
    if (target) chip.setAttribute("target", target);
    else chip.removeAttribute("target");

    // A new browsing context gets `noopener` by default; an explicit rel from
    // the consumer always wins, so opting into `opener` stays possible.
    const rel = this.getAttribute("rel");
    if (rel) chip.setAttribute("rel", rel);
    else if (target === "_blank") chip.setAttribute("rel", "noopener");
    else chip.removeAttribute("rel");
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "orc-chip": OrcChip;
  }
}
