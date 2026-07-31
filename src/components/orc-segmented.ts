const HTMLElementBase = (
  typeof HTMLElement === "undefined" ? class {} : HTMLElement
) as typeof HTMLElement;

const template = `
  <style>
    :host {
      display: inline-block;
      max-inline-size: 100%;
      font-family: var(--orc-font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
    }

    [role="radiogroup"] {
      display: inline-flex;
      flex-wrap: wrap;
      gap: var(--orc-space-1, 4px);
      padding: 3px;
      border-radius: var(--orc-radius-2, 8px);
      background: var(--orc-button-hover-chip, color-mix(in srgb, var(--orc-accent, #7aa2f7) 12%, var(--orc-panel, #16181b)));
      inline-size: fit-content;
    }

    [role="radio"] {
      border: none;
      background: none;
      cursor: pointer;
      padding: 5px 12px;
      border-radius: var(--orc-radius-1, 6px);
      font: inherit;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--orc-muted-strong, #565f89);
      white-space: nowrap;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
    }

    [role="radio"]:hover:not([aria-checked="true"]) {
      color: var(--orc-heading, var(--orc-text, #c0caf5));
    }

    [role="radio"]:focus-visible {
      outline: var(--orc-focus-ring, 1px solid #9dc76b);
      outline-offset: 1px;
    }

    [role="radio"][aria-checked="true"] {
      background: var(--orc-bg, #1a1b26);
      color: var(--orc-heading, var(--orc-text, #c0caf5));
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
    }

    @media (prefers-reduced-motion: no-preference) {
      [role="radio"] {
        transition: color 120ms ease, background-color 120ms ease;
      }
    }
  </style>
  <div role="radiogroup"></div>
`;

interface Segment {
  label: string;
  value: string;
}

/**
 * `<orc-segmented>` is a single-select segmented control (WAI-ARIA radiogroup
 * pattern). Unlike `<orc-tabs>` it owns no panels — it just picks one value.
 *
 * Content API: provide direct child elements carrying a `value` attribute; each
 * child's text becomes the segment label. Children are read from light DOM as
 * data and re-rendered as accessible radios in the shadow root.
 *
 * ```html
 * <orc-segmented value="orc" label="Orc mode">
 *   <button value="orc">/orc</button>
 *   <button value="orc-quick">/orc-quick</button>
 * </orc-segmented>
 * ```
 *
 * `value` selects the active segment and stays in sync with the selection. A
 * `change` CustomEvent (composed, bubbles) fires on selection with
 * `detail: { value, label }`. `label` sets the group's accessible name.
 *
 * @customElement orc-segmented
 * @attr {string} value - Selected segment value; stays in sync with selection.
 * @attr {string} label - Accessible name for the radiogroup.
 * @slot - Elements carrying a `value` attribute, read as segment data.
 * @fires change - `CustomEvent<{ value: string; label: string }>` on selection.
 */
export class OrcSegmented extends HTMLElementBase {
  static get observedAttributes(): string[] {
    return ["value", "label"];
  }

  private segments: Segment[] = [];
  private activeIndex = 0;
  private mutationObserver: MutationObserver | undefined;
  private reflecting = false;

  private readonly onKeydown = (event: KeyboardEvent): void => {
    if (this.segments.length === 0) return;
    const count = this.segments.length;
    let nextIndex: number | undefined;

    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        nextIndex = (this.activeIndex + 1) % count;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        nextIndex = (this.activeIndex - 1 + count) % count;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = count - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    this.select(nextIndex, { focus: true, emit: true });
  };

  constructor() {
    super();
    this.attachShadow({ mode: "open" }).innerHTML = template;
    this.group?.addEventListener("keydown", this.onKeydown);
  }

  connectedCallback(): void {
    this.collectSegments();
    this.render();
    this.applyValueAttribute();
    this.applyLabelAttribute();

    this.mutationObserver = new MutationObserver(() => {
      this.collectSegments();
      this.render();
      this.applyValueAttribute();
    });
    this.mutationObserver.observe(this, { childList: true });
  }

  disconnectedCallback(): void {
    this.mutationObserver?.disconnect();
    this.mutationObserver = undefined;
  }

  attributeChangedCallback(name: string): void {
    if (this.reflecting) return;
    if (name === "value") this.applyValueAttribute();
    if (name === "label") this.applyLabelAttribute();
  }

  /** The value of the currently selected segment, or "" when empty. */
  get value(): string {
    return this.segments[this.activeIndex]?.value ?? "";
  }

  set value(next: string) {
    this.setAttribute("value", next);
  }

  private get group(): HTMLElement | null {
    return this.shadowRoot?.querySelector('[role="radiogroup"]') ?? null;
  }

  private collectSegments(): void {
    const children = [...this.children].filter(
      (child): child is HTMLElement =>
        child instanceof HTMLElement && child.hasAttribute("value"),
    );
    this.segments = children.map((child) => {
      // Original light-DOM children are data only — the shadow radios are the
      // interactive surface, so keep the source out of the a11y tree.
      child.hidden = true;
      return {
        label: (child.textContent ?? "").trim(),
        value: child.getAttribute("value") ?? "",
      };
    });
    if (this.activeIndex > this.segments.length - 1) {
      this.activeIndex = Math.max(0, this.segments.length - 1);
    }
  }

  private render(): void {
    const group = this.group;
    if (!group) return;

    group.replaceChildren(
      ...this.segments.map((segment, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.role = "radio";
        button.setAttribute("value", segment.value);
        button.setAttribute("aria-checked", String(index === this.activeIndex));
        button.tabIndex = index === this.activeIndex ? 0 : -1;
        button.textContent = segment.label;
        button.addEventListener("click", () => {
          this.select(index, { focus: true, emit: true });
        });
        return button;
      }),
    );
  }

  private applyValueAttribute(): void {
    const raw = this.getAttribute("value");
    if (raw === null || this.segments.length === 0) return;
    const index = this.segments.findIndex((segment) => segment.value === raw);
    if (index >= 0 && index !== this.activeIndex) {
      this.select(index, { focus: false, emit: false });
    }
  }

  private applyLabelAttribute(): void {
    const label = this.getAttribute("label");
    if (label) this.group?.setAttribute("aria-label", label);
    else this.group?.removeAttribute("aria-label");
  }

  private select(
    index: number,
    { focus, emit }: { focus: boolean; emit: boolean },
  ): void {
    if (index < 0 || index >= this.segments.length) return;
    this.activeIndex = index;

    const buttons = [
      ...(this.group?.querySelectorAll<HTMLButtonElement>('[role="radio"]') ??
        []),
    ];
    buttons.forEach((button, i) => {
      button.setAttribute("aria-checked", String(i === index));
      button.tabIndex = i === index ? 0 : -1;
    });

    if (focus) buttons[index]?.focus();

    const segment = this.segments[index];
    this.reflecting = true;
    this.setAttribute("value", segment?.value ?? "");
    this.reflecting = false;

    if (emit) {
      this.dispatchEvent(
        new CustomEvent("change", {
          detail: { value: segment?.value ?? "", label: segment?.label ?? "" },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "orc-segmented": OrcSegmented;
  }
}
