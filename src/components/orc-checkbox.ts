import { syncDescription } from "./field-chrome";

const HTMLElementBase = (
  typeof HTMLElement === "undefined" ? class {} : HTMLElement
) as typeof HTMLElement;

let instanceCount = 0;

// A native checkbox with Orc's chrome painted on via `appearance: none` — the
// platform still owns role, tab stop, Space-toggle and `indeterminate`.
const template = `
  <style>
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--orc-space-2, 8px);
      font-family: var(--orc-font-sans, Inter, ui-sans-serif, system-ui, sans-serif);
    }

    :host([disabled]) {
      opacity: 0.72;
    }

    input {
      appearance: none;
      margin: 0;
      flex-shrink: 0;
      width: 16px;
      height: 16px;
      border: 1px solid var(--orc-control-border, #757d79);
      border-radius: var(--orc-radius-1, 4px);
      background: var(--orc-panel, #16181b);
      display: inline-grid;
      place-content: center;
      cursor: pointer;
    }

    input:disabled {
      cursor: not-allowed;
    }

    input::before {
      content: "";
      width: 10px;
      height: 10px;
      transform: scale(0);
      background: var(--orc-green, #9dc76b);
      clip-path: polygon(14% 44%, 0 65%, 38% 100%, 100% 21%, 83% 6%, 38% 72%);
    }

    input:checked,
    input:indeterminate {
      border-color: var(--orc-green, #9dc76b);
    }

    input:checked::before {
      transform: scale(1);
    }

    input:indeterminate::before {
      clip-path: none;
      width: 8px;
      height: 2px;
      transform: scale(1);
    }

    input:focus-visible {
      outline: var(--orc-focus-ring, 1px solid #9dc76b);
      outline-offset: 2px;
    }

    label {
      color: var(--orc-text, #c7cfca);
      font-size: 13px;
      cursor: pointer;
    }

    label[hidden] {
      display: none;
    }

    :host([disabled]) label {
      cursor: not-allowed;
    }

    /* Same screen-reader-only treatment as the other Orc fields' .sr-only. */
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    @media (prefers-reduced-motion: no-preference) {
      input::before {
        transition: transform 0.12s ease-out;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      input::before {
        transition: none;
      }
    }
  </style>
  <input type="checkbox" />
  <label></label>
  <p class="sr-only description" hidden></p>
`;

/**
 * `<orc-checkbox>` wraps a native `<input type="checkbox">` with Orc's field
 * chrome. Set `label` for visible label text, or `aria-label` alone for a
 * bare surface.
 *
 * @customElement orc-checkbox
 * @attr {string} label - Visible label text, wired to the input via for/id.
 * @attr {string} aria-label - Accessible name used when no visible label is set.
 * @attr {string} description - Extra hint announced with the input (rendered visually hidden).
 * @attr {boolean} disabled - Disables the inner input.
 * @attr {boolean} required - Marks the inner input as required.
 * @attr {boolean} indeterminate - Reflects the native mixed/indeterminate state.
 * @fires change - `CustomEvent<{ checked: boolean }>` on toggle.
 * @cssprop [--orc-focus-ring] - Focus ring applied to the checkbox on `:focus-visible`.
 * @cssprop [--orc-control-border] - Border colour of the resting checkbox.
 */
export class OrcCheckbox extends HTMLElementBase {
  static get observedAttributes(): string[] {
    return ["label", "aria-label", "disabled", "required", "indeterminate", "description"];
  }

  private readonly elementId = `orc-checkbox-${++instanceCount}`;
  private checkedSeeded = false;

  constructor() {
    super();
    this.attachShadow({ mode: "open" }).innerHTML = template;
    const input = this.input;
    const label = this.labelEl;
    if (input) {
      input.id = this.elementId;
      input.addEventListener("change", () => {
        this.dispatchEvent(
          new CustomEvent("change", {
            detail: { checked: input.checked },
            bubbles: true,
            composed: true,
          }),
        );
      });
    }
    if (label) label.setAttribute("for", this.elementId);
  }

  connectedCallback(): void {
    // The `checked` attribute seeds initial state only, same as native
    // `<input checked>`; afterwards `checked` lives on the native input,
    // same as `value` on <orc-input>. Seed once so a later reconnect can't
    // clobber a user's toggle.
    if (!this.checkedSeeded) {
      this.checkedSeeded = true;
      const input = this.input;
      if (input) {
        input.checked = this.hasAttribute("checked");
        input.indeterminate = this.hasAttribute("indeterminate");
      }
    }
    this.render();
  }

  attributeChangedCallback(name: string): void {
    // `indeterminate` is applied only when its own attribute moves. Syncing it
    // on every render would reset a property-set mixed state the next time any
    // unrelated attribute (say `disabled`) changed.
    if (name === "indeterminate") {
      const input = this.input;
      if (input) input.indeterminate = this.hasAttribute("indeterminate");
    }
    this.render();
  }

  get checked(): boolean {
    return this.input?.checked ?? false;
  }

  set checked(next: boolean) {
    const input = this.input;
    if (input) input.checked = next;
  }

  get indeterminate(): boolean {
    return this.input?.indeterminate ?? false;
  }

  set indeterminate(next: boolean) {
    const input = this.input;
    if (input) input.indeterminate = next;
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

    input.disabled = this.hasAttribute("disabled");
    input.required = this.hasAttribute("required");

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
    "orc-checkbox": OrcCheckbox;
  }
}
