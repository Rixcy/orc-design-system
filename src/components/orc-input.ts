import { fieldChromeStyles, syncDescription } from "./field-chrome";

const HTMLElementBase = (
  typeof HTMLElement === "undefined" ? class {} : HTMLElement
) as typeof HTMLElement;

let instanceCount = 0;

// The single-line half of the Orc field surface: identical chrome to
// <orc-textarea>, one line tall, no footer.
const template = `
  <style>
    ${fieldChromeStyles("input")}

    input {
      font-size: var(--orc-input-font-size, 13px);
      padding: 10px 14px;
    }

    :host([size="compact"]) .field {
      box-sizing: border-box;
      block-size: 36px;
    }

    :host([size="compact"]) input {
      block-size: 100%;
      padding-block: 0;
    }
  </style>
  <label></label>
  <div class="field">
    <input />
    <p class="sr-only description" hidden></p>
  </div>
`;

const TYPES = new Set([
  "text",
  "email",
  "number",
  "password",
  "search",
  "tel",
  "url",
]);

/**
 * `<orc-input>` is Orc's single-line field — the same beam and green,
 * outline-free focus border as `<orc-textarea>`. Set `label` for a visible
 * label, or `aria-label` alone for a bare surface.
 *
 * @customElement orc-input
 * @attr {string} label - Visible label text, wired to the input via for/id.
 * @attr {string} aria-label - Accessible name used when no visible label is set.
 * @attr {string} type - Native text-entry input type; anything else falls back to `text`.
 * @attr {string} placeholder - Native placeholder text.
 * @attr {string} description - Extra hint announced with the input (rendered visually hidden).
 * @attr {"default"|"compact"} size - Control density. Defaults to `default`.
 * @attr {boolean} disabled - Disables the inner input.
 * @cssprop [--orc-input-font-size=13px] - Font size of the input.
 * @cssprop [--orc-beam-angle] - Current beam rotation angle (animated).
 * @cssprop [--orc-beam-underlay] - Beam underlay colour behind the field.
 * @cssprop [--orc-control-border] - Border colour of the resting field.
 */
export class OrcInput extends HTMLElementBase {
  static get observedAttributes(): string[] {
    return ["label", "aria-label", "type", "placeholder", "disabled", "description"];
  }

  private readonly elementId = `orc-input-${++instanceCount}`;

  constructor() {
    super();
    this.attachShadow({ mode: "open" }).innerHTML = template;
    const input = this.input;
    const label = this.labelEl;
    if (input) input.id = this.elementId;
    if (label) label.setAttribute("for", this.elementId);
  }

  connectedCallback(): void {
    this.render();
  }

  attributeChangedCallback(): void {
    this.render();
  }

  get value(): string {
    return this.input?.value ?? "";
  }

  set value(next: string) {
    const input = this.input;
    if (input) input.value = next;
  }

  focus(options?: FocusOptions): void {
    this.input?.focus(options);
  }

  /** The native input, so an app can wire its own listeners to it. */
  get input(): HTMLInputElement | null {
    return this.shadowRoot?.querySelector("input") ?? null;
  }

  private get labelEl(): HTMLLabelElement | null {
    return this.shadowRoot?.querySelector("label") ?? null;
  }

  private render(): void {
    const input = this.input;
    const label = this.labelEl;
    if (!input || !label) return;

    const labelText = this.getAttribute("label")?.trim() ?? "";
    label.textContent = labelText;
    label.hidden = labelText === "";

    // No visible label still needs a name; forward the host's aria-label rather
    // than inventing a second labelling attribute.
    const ariaLabel = this.getAttribute("aria-label")?.trim() ?? "";
    if (!labelText && ariaLabel) {
      input.setAttribute("aria-label", ariaLabel);
    } else {
      input.removeAttribute("aria-label");
    }

    // Checkboxes, radios and file pickers have their own chrome — this field is
    // a text surface, so anything outside the allowlist falls back to text.
    const type = this.getAttribute("type")?.trim() ?? "";
    input.type = TYPES.has(type) ? type : "text";

    input.placeholder = this.getAttribute("placeholder") ?? "";
    input.disabled = this.hasAttribute("disabled");

    syncDescription(
      this.shadowRoot,
      input,
      this.getAttribute("description")?.trim() ?? "",
      this.elementId,
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "orc-input": OrcInput;
  }
}
