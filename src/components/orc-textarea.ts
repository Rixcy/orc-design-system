import { fieldChromeStyles, syncDescription } from "./field-chrome";

const HTMLElementBase = (
  typeof HTMLElement === "undefined" ? class {} : HTMLElement
) as typeof HTMLElement;

let instanceCount = 0;

// The multi-line half of the Orc field surface: the shared glowing chrome plus
// a resizable textarea and an optional footer row for composer actions.
const template = `
  <style>
    ${fieldChromeStyles("textarea")}

    textarea {
      resize: vertical;
      min-height: var(--orc-textarea-min-height, 82px);
      font-size: var(--orc-textarea-font-size, 13px);
      padding: 13px 14px 8px;
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
  </style>
  <label></label>
  <div class="field">
    <textarea></textarea>
    <p class="sr-only description" hidden></p>
    <footer hidden><slot name="footer"></slot></footer>
  </div>
`;

/**
 * `<orc-textarea>` is Orc's multi-line field: an animated beam border, a green
 * focus border, and no focus outline in any path. Set `label` for a visible
 * label, or `aria-label` alone for a bare composer surface.
 *
 * @customElement orc-textarea
 * @attr {string} label - Visible label text, wired to the textarea via for/id.
 * @attr {string} aria-label - Accessible name used when no visible label is set.
 * @attr {string} placeholder - Native placeholder text.
 * @attr {boolean} disabled - Disables the inner textarea.
 * @attr {number} rows - Native rows attribute, for app composers that size by line count.
 * @attr {string} description - Extra hint announced with the textarea (rendered visually hidden; the visible copy belongs in the footer).
 * @slot footer - Actions below the input; the footer row stays hidden while empty.
 * @cssprop [--orc-textarea-min-height=82px] - Minimum height of the textarea.
 * @cssprop [--orc-textarea-font-size=13px] - Font size of the textarea.
 * @cssprop [--orc-beam-angle] - Current beam rotation angle (animated).
 * @cssprop [--orc-beam-underlay] - Beam underlay colour behind the field.
 * @cssprop [--orc-control-border] - Border colour of the resting field.
 */
export class OrcTextarea extends HTMLElementBase {
  static get observedAttributes(): string[] {
    return ["label", "aria-label", "placeholder", "disabled", "rows", "description"];
  }

  private readonly elementId = `orc-textarea-${++instanceCount}`;

  constructor() {
    super();
    this.attachShadow({ mode: "open" }).innerHTML = template;
    const textarea = this.textarea;
    const label = this.labelEl;
    if (textarea) textarea.id = this.elementId;
    if (label) label.setAttribute("for", this.elementId);

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

  /** The native textarea, so an app can wire its own listeners and attachment plumbing to it. */
  get textarea(): HTMLTextAreaElement | null {
    return this.shadowRoot?.querySelector("textarea") ?? null;
  }

  private get labelEl(): HTMLLabelElement | null {
    return this.shadowRoot?.querySelector("label") ?? null;
  }

  private render(): void {
    const textarea = this.textarea;
    const label = this.labelEl;
    if (!textarea || !label) return;

    const labelText = this.getAttribute("label")?.trim() ?? "";
    label.textContent = labelText;
    label.hidden = labelText === "";

    // A composer with no visible label still needs a name; forward the host's
    // aria-label rather than inventing a second labelling attribute.
    const ariaLabel = this.getAttribute("aria-label")?.trim() ?? "";
    if (!labelText && ariaLabel) {
      textarea.setAttribute("aria-label", ariaLabel);
    } else {
      textarea.removeAttribute("aria-label");
    }

    textarea.placeholder = this.getAttribute("placeholder") ?? "";
    textarea.disabled = this.hasAttribute("disabled");

    const rows = this.getAttribute("rows");
    if (rows && /^\d+$/.test(rows)) {
      textarea.rows = Number(rows);
    } else {
      textarea.removeAttribute("rows");
    }

    syncDescription(
      this.shadowRoot,
      textarea,
      this.getAttribute("description")?.trim() ?? "",
      this.elementId,
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "orc-textarea": OrcTextarea;
  }
}
