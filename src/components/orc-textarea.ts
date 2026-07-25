const HTMLElementBase = (
  typeof HTMLElement === "undefined" ? class {} : HTMLElement
) as typeof HTMLElement;

let instanceCount = 0;

// A plain labelled form textarea with the repo's "more green" focus treatment
// (green border + soft ring instead of a drop shadow).
const template = `
  <style>
    :host {
      display: block;
      font-family: var(--orc-font-sans, Inter, ui-sans-serif, system-ui, sans-serif);
    }

    label {
      display: block;
      margin-bottom: 6px;
      color: var(--orc-text, #c7cfca);
      font-size: 13px;
      font-weight: 600;
    }

    textarea {
      display: block;
      width: 100%;
      box-sizing: border-box;
      resize: vertical;
      min-height: var(--orc-textarea-min-height, 62px);
      padding: 10px 12px;
      border: 1px solid var(--orc-border, #3b4540);
      border-radius: var(--orc-radius-md, 8px);
      background: var(--orc-bg, #1a1c20);
      color: var(--orc-text, #c7cfca);
      font: inherit;
      font-size: 13px;
      line-height: 1.5;
      transition: border-color 0.16s ease-out;
    }

    textarea::placeholder {
      color: var(--orc-muted-strong, #565f89);
    }

    textarea:focus-visible {
      border-color: var(--orc-green, #9dc76b);
      outline: 2px solid var(--orc-green, #9dc76b);
      outline-offset: 1px;
    }

    textarea:disabled {
      color: var(--orc-muted-strong, #565f89);
      cursor: not-allowed;
      opacity: 0.72;
    }

    @media (prefers-reduced-motion: reduce) {
      textarea {
        transition: none;
      }
    }

    @media (forced-colors: active) {
      textarea:focus-visible {
        border-color: Highlight;
        outline: 2px solid Highlight;
        outline-offset: 2px;
      }
    }
  </style>
  <label></label>
  <textarea></textarea>
`;

/**
 * `<orc-textarea>` is the plain labelled multi-line input — the quiet
 * counterpart to `<orc-glow-field>`.
 *
 * @customElement orc-textarea
 * @attr {string} label - Visible label text, wired to the textarea.
 * @attr {string} placeholder - Native placeholder text.
 * @attr {boolean} disabled - Disables the inner textarea.
 * @attr {number} rows - Native rows attribute.
 * @cssprop [--orc-textarea-min-height] - Minimum height of the textarea.
 */
export class OrcTextarea extends HTMLElementBase {
  static get observedAttributes(): string[] {
    return ["label", "placeholder", "disabled", "rows"];
  }

  private readonly elementId = `orc-textarea-${++instanceCount}`;

  constructor() {
    super();
    this.attachShadow({ mode: "open" }).innerHTML = template;
    const textarea = this.textarea;
    const label = this.label;
    if (textarea) textarea.id = this.elementId;
    if (label) label.setAttribute("for", this.elementId);
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

  private get textarea(): HTMLTextAreaElement | null {
    return this.shadowRoot?.querySelector("textarea") ?? null;
  }

  private get label(): HTMLLabelElement | null {
    return this.shadowRoot?.querySelector("label") ?? null;
  }

  private render(): void {
    const textarea = this.textarea;
    const label = this.label;
    if (!textarea || !label) return;

    const labelText = this.getAttribute("label")?.trim() ?? "";
    label.textContent = labelText;

    textarea.placeholder = this.getAttribute("placeholder") ?? "";
    textarea.disabled = this.hasAttribute("disabled");

    const rows = this.getAttribute("rows");
    if (rows && /^\d+$/.test(rows)) {
      textarea.rows = Number(rows);
    } else {
      textarea.removeAttribute("rows");
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "orc-textarea": OrcTextarea;
  }
}
