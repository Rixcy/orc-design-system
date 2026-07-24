const HTMLElementBase = (
  typeof HTMLElement === "undefined" ? class {} : HTMLElement
) as typeof HTMLElement;

// A native-CSS port of the reference app's phase pills: small rounded steps
// joined by connector rules, with `done` (green tint) and `current` (accent
// tint) states layered over a muted pending default. Presentational only —
// an ordered progress indicator, not a navigation control.
const template = `
  <style>
    :host {
      display: block;
      max-inline-size: 100%;
      font-family: var(--orc-font-sans, Inter, ui-sans-serif, system-ui, sans-serif);
    }

    ol {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 4px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    li {
      display: flex;
      align-items: center;
      gap: 4px;
      margin: 0;
    }

    li:not(:last-child)::after {
      content: "";
      inline-size: 14px;
      block-size: 1px;
      background: var(--orc-border, #3b4540);
      flex-shrink: 0;
    }

    .step {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 10px;
      border: 1px solid var(--orc-border, #3b4540);
      color: var(--orc-heading, #e0e5e2);
      background: var(--orc-chip, #1d201f);
    }

    .step.pending {
      color: var(--orc-muted-strong, #7d8a85);
    }

    .step.done {
      border-color: var(--orc-green, #9dc76b);
      background: color-mix(in srgb, var(--orc-green, #9dc76b) 12%, transparent);
      color: var(--orc-green-text, #9dc76b);
    }

    .step.current {
      border-color: var(--orc-accent, #78a9c2);
      background: color-mix(in srgb, var(--orc-accent, #78a9c2) 12%, transparent);
      color: var(--orc-accent-text, #78a9c2);
      font-weight: 600;
    }

    .visually-hidden {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      margin: -1px;
      padding: 0;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  </style>
  <ol part="list"></ol>
`;

function parseSteps(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((label) => label.trim())
    .filter((label) => label.length > 0);
}

function resolveCurrentIndex(steps: string[], current: string | null): number {
  if (current === null) return -1;
  const trimmed = current.trim();
  if (trimmed.length === 0) return -1;

  if (/^\d+$/.test(trimmed)) {
    const index = Number.parseInt(trimmed, 10);
    return index >= 0 && index < steps.length ? index : -1;
  }

  return steps.findIndex((label) => label === trimmed);
}

export class OrcStepper extends HTMLElementBase {
  static get observedAttributes(): string[] {
    return ["steps", "current"];
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

  private get list(): HTMLOListElement | null {
    return this.shadowRoot?.querySelector("ol") ?? null;
  }

  private render(): void {
    const list = this.list;
    if (!list) return;

    const steps = parseSteps(this.getAttribute("steps"));
    const currentIndex = resolveCurrentIndex(steps, this.getAttribute("current"));

    list.replaceChildren(
      ...steps.map((label, index) => {
        const item = document.createElement("li");

        const pill = document.createElement("span");
        pill.className = "step";
        pill.setAttribute("part", "step");
        pill.textContent = label;

        if (index === currentIndex) {
          pill.classList.add("current");
          item.setAttribute("aria-current", "step");
        } else if (currentIndex !== -1 && index < currentIndex) {
          pill.classList.add("done");
          const affix = document.createElement("span");
          affix.className = "visually-hidden";
          affix.textContent = " (done)";
          pill.append(affix);
        } else {
          pill.classList.add("pending");
        }

        item.append(pill);
        return item;
      }),
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "orc-stepper": OrcStepper;
  }
}
