import { syncDescription } from "./field-chrome";

const HTMLElementBase = (
  typeof HTMLElement === "undefined" ? class {} : HTMLElement
) as typeof HTMLElement;

let instanceCount = 0;

// Style-only over a native checkbox: the input carries every interaction
// (click, Space, label click, disabled, focus) for free, and `role="switch"`
// remaps its accessible role. The track/thumb are purely decorative siblings
// stacked under the same, absolutely-positioned footprint as the input, which
// stays visually transparent but present and hit-testable.
const template = `
  <style>
    :host {
      display: inline-block;
      max-inline-size: 100%;
      font-family: var(--orc-font-sans, Inter, ui-sans-serif, system-ui, sans-serif);
    }

    /* Toggling the label repeatedly is a double-click, and a double-click
       selects text. Suppress it on the label only — the description below
       stays selectable, because that one is prose worth copying. */
    label {
      position: relative;
      display: inline-flex;
      align-items: center;
      gap: var(--orc-space-2, 8px);
      padding-inline-start: 44px;
      min-block-size: 20px;
      color: var(--orc-text, #c7cfca);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      -webkit-user-select: none;
      user-select: none;
    }

    input {
      position: absolute;
      inset-inline-start: 0;
      inset-block-start: 0;
      margin: 0;
      inline-size: 36px;
      block-size: 20px;
      opacity: 0;
      cursor: pointer;
    }

    .track {
      position: absolute;
      inset-inline-start: 0;
      inset-block-start: 0;
      inline-size: 36px;
      block-size: 20px;
      border-radius: 999px;
      background: var(--orc-control-border, #757d79);
      pointer-events: none;
    }

    .thumb {
      position: absolute;
      inset-block-start: 2px;
      inset-inline-start: 2px;
      inline-size: 16px;
      block-size: 16px;
      border-radius: 50%;
      background: var(--orc-panel, #16181b);
    }

    input:checked + .track {
      background: var(--orc-green, #9dc76b);
    }

    input:checked + .track .thumb {
      transform: translateX(16px);
    }

    input:focus-visible + .track {
      outline: var(--orc-focus-ring, 1px solid #9dc76b);
      outline-offset: 2px;
    }

    input:disabled {
      cursor: not-allowed;
    }

    /* Dim the whole control, not just the track: a track-only fade reads as
       "off" rather than "disabled" next to a real off switch. */
    label:has(input:disabled) {
      cursor: not-allowed;
      opacity: 0.55;
    }

    .text[hidden] {
      display: none;
    }

    /* Same screen-reader-only treatment as <orc-status-dot>'s .sr-only. */
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
      .track,
      .thumb {
        transition: background-color 120ms ease, transform 120ms ease;
      }
    }

    @media (forced-colors: active) {
      .track {
        background: none;
        border: 1px solid CanvasText;
      }
      .thumb {
        background: CanvasText;
      }
      input:checked + .track {
        border-color: Highlight;
      }
      input:checked + .track .thumb {
        background: Highlight;
      }
      input:focus-visible + .track {
        outline-color: Highlight;
      }
    }
  </style>
  <label>
    <input type="checkbox" role="switch" />
    <span class="track"><span class="thumb"></span></span>
    <span class="text"></span>
  </label>
  <p class="sr-only description" hidden></p>
`;

/**
 * `<orc-switch>` is Orc's boolean toggle: a native `<input type="checkbox"
 * role="switch">` styled as a track/thumb. It stays a real checkbox — Space,
 * disabled, and label-click reach come from the platform, not a reimplemented
 * `keydown` handler.
 *
 * ```html
 * <orc-switch label="Auto-merge" checked></orc-switch>
 * ```
 *
 * `checked` reflects to/from the `checked` property. The native `change`
 * event does not cross a shadow boundary, so the host re-dispatches a
 * composed `change` CustomEvent with `detail: { checked }`.
 *
 * @customElement orc-switch
 * @attr {string} label - Visible label text, wired to the input via for/id.
 * @attr {string} aria-label - Accessible name used when no visible label is set.
 * @attr {string} description - Extra hint announced with the input (rendered visually hidden).
 * @attr {boolean} checked - Whether the switch is on; mirrors the `checked` property.
 * @attr {boolean} disabled - Disables the inner input.
 * @fires change - `CustomEvent<{ checked: boolean }>` when the switch is toggled.
 * @cssprop [--orc-control-border] - Track colour when off.
 * @cssprop [--orc-green] - Track colour when on.
 * @cssprop [--orc-focus-ring] - Focus outline on the track.
 */
export class OrcSwitch extends HTMLElementBase {
  static get observedAttributes(): string[] {
    return ["label", "aria-label", "description", "checked", "disabled"];
  }

  private readonly elementId = `orc-switch-${++instanceCount}`;
  private reflecting = false;

  private readonly onChange = (): void => {
    const input = this.input;
    if (!input) return;
    this.reflecting = true;
    this.toggleAttribute("checked", input.checked);
    this.reflecting = false;
    this.dispatchEvent(
      new CustomEvent("change", {
        detail: { checked: input.checked },
        bubbles: true,
        composed: true,
      }),
    );
  };

  constructor() {
    super();
    this.attachShadow({ mode: "open" }).innerHTML = template;
    const input = this.input;
    const label = this.labelEl;
    if (input) {
      input.id = this.elementId;
      input.addEventListener("change", this.onChange);
    }
    if (label) label.setAttribute("for", this.elementId);
  }

  connectedCallback(): void {
    this.render();
  }

  attributeChangedCallback(): void {
    if (this.reflecting) return;
    this.render();
  }

  /** Whether the switch is on. Mirrors the `checked` attribute. */
  get checked(): boolean {
    return this.input?.checked ?? this.hasAttribute("checked");
  }

  set checked(next: boolean) {
    const value = Boolean(next);
    this.reflecting = true;
    this.toggleAttribute("checked", value);
    this.reflecting = false;
    if (this.input) this.input.checked = value;
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

  private get textEl(): HTMLElement | null {
    return this.shadowRoot?.querySelector(".text") ?? null;
  }

  private render(): void {
    const input = this.input;
    const label = this.labelEl;
    const text = this.textEl;
    if (!input || !label || !text) return;

    const labelText = this.getAttribute("label")?.trim() ?? "";
    text.textContent = labelText;
    text.hidden = labelText === "";

    // No visible label still needs a name; forward the host's aria-label rather
    // than inventing a second labelling attribute. Never both, since a visible
    // label already wins via label-wrapping association.
    const ariaLabel = this.getAttribute("aria-label")?.trim() ?? "";
    if (!labelText && ariaLabel) {
      input.setAttribute("aria-label", ariaLabel);
    } else {
      input.removeAttribute("aria-label");
    }

    input.disabled = this.hasAttribute("disabled");
    input.checked = this.hasAttribute("checked");

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
    "orc-switch": OrcSwitch;
  }
}
