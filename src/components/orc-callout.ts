const HTMLElementBase = (
  typeof HTMLElement === "undefined" ? class {} : HTMLElement
) as typeof HTMLElement;

// A block-level notice: the same soft-filled, tinted-border recipe as
// orc-chip, scaled up to a panel instead of a label. Where a chip is a
// glanceable status word inline with other content, a callout is the block
// a reader stops on, so it gets room to breathe (bigger padding, a bigger
// radius than the chip's 12px) and an optional bold heading line instead of
// a leading dot. Tone is carried by the tinted fill, the tinted border and
// the heading colour, never by the body text: a whole paragraph painted in
// --orc-green reads like a chip label blown up to prose size, so the body
// always stays high-contrast --orc-text and only the heading picks up the
// variant colour. The body stays in the light DOM behind a plain default
// slot, exactly like the chip's label, so a consumer can put arbitrary rich
// content in it and still own its own accessible name. Notices are silent
// by default: a callout only announces itself to assistive tech when the
// consumer opts in with `live`, because most callouts sit in already-visible
// static content and don't need to interrupt anyone.
const template = `
  <style>
    :host {
      display: block;
      max-inline-size: 100%;
      font-family: var(--orc-font-sans, Inter, ui-sans-serif, system-ui, sans-serif);
    }

    .callout {
      box-sizing: border-box;
      max-inline-size: 100%;
      /* Bigger than the chip's 3px 10px padding and 12px radius: a callout is
         a block a reader stops on, not a glanceable inline label, so it gets
         room to breathe and a softer, panel-like corner. */
      padding: var(--orc-space-4, 16px) var(--orc-space-5, 24px);
      border-radius: var(--orc-radius-callout, 16px);
      border: 1px solid transparent;
      font-size: 14px;
      line-height: 1.5;
      overflow-wrap: break-word;
      color: var(--orc-text, #c7cfca);
      /* Same neutral Soft Fill as the chip: --orc-chip background, --orc-border
         hairline. Consumers that want the outline-only look set --orc-chip to
         transparent, exactly as they would on a chip. */
      background: var(--orc-chip, #29312c);
      border-color: var(--orc-border, #3b4540);
    }

    .heading {
      margin: 0 0 var(--orc-space-1, 4px);
      font-weight: 600;
      color: var(--orc-heading, #e0e5e2);
    }

    .heading[hidden] {
      display: none;
    }

    :host([variant="green"]) .callout {
      background: color-mix(in srgb, var(--orc-green, #9dc76b) 15%, transparent);
      border-color: color-mix(in srgb, var(--orc-green, #9dc76b) 40%, transparent);
    }
    :host([variant="green"]) .heading {
      color: var(--orc-green-text, #9dc76b);
    }

    :host([variant="yellow"]) .callout {
      background: color-mix(in srgb, var(--orc-yellow, #d5b05c) 15%, transparent);
      border-color: color-mix(in srgb, var(--orc-yellow, #d5b05c) 40%, transparent);
    }
    :host([variant="yellow"]) .heading {
      color: var(--orc-yellow-text, #d5b05c);
    }

    :host([variant="red"]) .callout {
      background: color-mix(in srgb, var(--orc-red, #e87878) 15%, transparent);
      border-color: color-mix(in srgb, var(--orc-red, #e87878) 40%, transparent);
    }
    :host([variant="red"]) .heading {
      color: var(--orc-red-text, #e87878);
    }

    :host([variant="purple"]) .callout {
      background: color-mix(in srgb, var(--orc-purple, #b497d6) 15%, transparent);
      border-color: color-mix(in srgb, var(--orc-purple, #b497d6) 40%, transparent);
    }
    :host([variant="purple"]) .heading {
      color: var(--orc-purple-text, #b497d6);
    }

    :host([variant="cyan"]) .callout {
      background: color-mix(in srgb, var(--orc-cyan, #77b8b1) 15%, transparent);
      border-color: color-mix(in srgb, var(--orc-cyan, #77b8b1) 40%, transparent);
    }
    :host([variant="cyan"]) .heading {
      color: var(
        --orc-cyan-text,
        color-mix(in srgb, var(--orc-cyan, #77b8b1) 55%, var(--orc-heading, #e0e5e2))
      );
    }

    :host([variant="orange"]) .callout {
      background: color-mix(in srgb, var(--orc-orange, #e69257) 15%, transparent);
      border-color: color-mix(in srgb, var(--orc-orange, #e69257) 40%, transparent);
    }
    :host([variant="orange"]) .heading {
      color: var(
        --orc-orange-text,
        color-mix(in srgb, var(--orc-orange, #e69257) 55%, var(--orc-heading, #e0e5e2))
      );
    }

    :host([variant="accent"]) .callout {
      background: color-mix(in srgb, var(--orc-accent, #78a9c2) 15%, transparent);
      border-color: color-mix(in srgb, var(--orc-accent, #78a9c2) 40%, transparent);
    }
    :host([variant="accent"]) .heading {
      color: var(--orc-accent-text, #78a9c2);
    }
  </style>
  <div class="callout">
    <p class="heading" hidden></p>
    <slot></slot>
  </div>
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
 * `<orc-callout>` is a block-level notice in one of the token colour
 * families, with an optional bold heading above a slotted body.
 *
 * @customElement orc-callout
 * @attr {"neutral"|"green"|"yellow"|"red"|"purple"|"cyan"|"orange"|"accent"} variant - Colour family. Unknown values fall back to `neutral`.
 * @attr {string} heading - Bold heading line shown above the body. Hidden when absent or empty.
 * @attr {boolean} live - Opts the callout into `role="status"` and `aria-live="polite"` for assistive-tech announcement. Off by default.
 * @cssprop [--orc-chip] - Soft Fill behind the neutral callout. Set it to
 *   `transparent` for an outline-only callout.
 * @cssprop [--orc-radius-callout=16px] - Corner radius.
 * @slot - Callout body content.
 */
export class OrcCallout extends HTMLElementBase {
  static get observedAttributes(): string[] {
    return ["variant", "heading", "live"];
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

  private get calloutEl(): HTMLElement | null {
    return this.shadowRoot?.querySelector(".callout") ?? null;
  }

  private get headingEl(): HTMLElement | null {
    return this.shadowRoot?.querySelector(".heading") ?? null;
  }

  private render(): void {
    const variant = this.getAttribute("variant");
    if (!variant || !VARIANTS.has(variant)) {
      this.setAttribute("variant", "neutral");
      return;
    }

    const heading = this.headingEl;
    if (heading) {
      const text = this.getAttribute("heading") ?? "";
      heading.textContent = text;
      heading.hidden = text === "";
    }

    const callout = this.calloutEl;
    if (callout) {
      if (this.hasAttribute("live")) {
        callout.setAttribute("role", "status");
        callout.setAttribute("aria-live", "polite");
      } else {
        callout.removeAttribute("role");
        callout.removeAttribute("aria-live");
      }
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "orc-callout": OrcCallout;
  }
}
