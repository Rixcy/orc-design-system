import type { ThemeController, ThemeMode } from "../theme/controller";
import {
  getThemeController,
  THEME_CONTROLLER_CHANGE_EVENT,
} from "../theme/registry";

const HTMLElementBase = (
  typeof HTMLElement === "undefined" ? class {} : HTMLElement
) as typeof HTMLElement;

// Phosphor monitor / sun / moon, matching the orc-flags theme picker.
const template = `
  <style>
    :host {
      display: inline-block;
      font-family: var(--orc-font-sans, Inter, ui-sans-serif, system-ui, sans-serif);
    }

    button {
      display: flex;
      flex: 0 0 auto;
      inline-size: 2.25rem;
      block-size: 2.25rem;
      align-items: center;
      justify-content: center;
      padding: 0;
      border: 1px solid transparent;
      border-radius: var(--orc-radius-md, 0.5rem);
      color: var(--orc-muted-strong, #565f89);
      background: none;
      cursor: pointer;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
      transition: background-color 120ms ease, border-color 120ms ease;
    }

    button:hover:not(:disabled) {
      border-color: var(--orc-border, #292e42);
      background: var(--orc-button-hover-chip, #292e42);
      color: var(--orc-heading, #c0caf5);
    }

    button:focus-visible {
      outline: var(--orc-focus-ring, 2px solid #9dc76b);
      outline-offset: var(--orc-focus-offset, 2px);
      color: var(--orc-heading, #c0caf5);
    }

    button:disabled {
      cursor: not-allowed;
      opacity: 0.72;
    }

    svg {
      inline-size: 1rem;
      block-size: 1rem;
    }

    /* The UA [hidden] rule is HTML-only, so SVG icons need this explicitly. */
    svg[hidden] {
      display: none;
    }

    @media (prefers-reduced-motion: reduce) {
      button {
        transition: none;
      }
    }
  </style>
  <button type="button" disabled>
    <svg data-mode="system" width="16" height="16" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M208,42H48A22,22,0,0,0,26,64V176a22,22,0,0,0,22,22H208a22,22,0,0,0,22-22V64A22,22,0,0,0,208,42Zm10,134a10,10,0,0,1-10,10H48a10,10,0,0,1-10-10V64A10,10,0,0,1,48,54H208a10,10,0,0,1,10,10Zm-52,48a6,6,0,0,1-6,6H96a6,6,0,0,1,0-12h64A6,6,0,0,1,166,224Z"/></svg>
    <svg data-mode="light" hidden width="16" height="16" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M122,40V16a6,6,0,0,1,12,0V40a6,6,0,0,1-12,0Zm68,88a62,62,0,1,1-62-62A62.07,62.07,0,0,1,190,128Zm-12,0a50,50,0,1,0-50,50A50.06,50.06,0,0,0,178,128ZM59.76,68.24a6,6,0,1,0,8.48-8.48l-16-16a6,6,0,0,0-8.48,8.48Zm0,119.52-16,16a6,6,0,1,0,8.48,8.48l16-16a6,6,0,1,0-8.48-8.48ZM192,70a6,6,0,0,0,4.24-1.76l16-16a6,6,0,0,0-8.48-8.48l-16,16A6,6,0,0,0,192,70Zm4.24,117.76a6,6,0,0,0-8.48,8.48l16,16a6,6,0,0,0,8.48-8.48ZM46,128a6,6,0,0,0-6-6H16a6,6,0,0,0,0,12H40A6,6,0,0,0,46,128Zm82,82a6,6,0,0,0-6,6v24a6,6,0,0,0,12,0V216A6,6,0,0,0,128,210Zm112-88H216a6,6,0,0,0,0,12h24a6,6,0,0,0,0-12Z"/></svg>
    <svg data-mode="dark" hidden width="16" height="16" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M232.13,143.64a6,6,0,0,0-6-1.49A90.07,90.07,0,0,1,113.86,29.85a6,6,0,0,0-7.49-7.48A102.88,102.88,0,0,0,54.48,58.68,102,102,0,0,0,197.32,201.52a102.88,102.88,0,0,0,36.31-51.89A6,6,0,0,0,232.13,143.64Zm-42,48.29a90,90,0,0,1-126-126A90.9,90.9,0,0,1,99.65,37.66,102.06,102.06,0,0,0,218.34,156.35,90.9,90.9,0,0,1,190.1,191.93Z"/></svg>
  </button>
`;

const MODES: readonly ThemeMode[] = ["system", "light", "dark"];

const nextMode = (mode: ThemeMode): ThemeMode =>
  MODES[(MODES.indexOf(mode) + 1) % MODES.length]!;

/**
 * `<orc-theme-toggle>` cycles the theme controller through
 * system -> light -> dark and mirrors the resolved mode in its icon.
 *
 * @customElement orc-theme-toggle
 * @attr {boolean} disabled - Disables the control.
 * @attr {string} label - Base accessible name. Defaults to `Theme`.
 */
export class OrcThemeToggle extends HTMLElementBase {
  static get observedAttributes(): string[] {
    return ["disabled", "label"];
  }

  private controller: ThemeController | undefined;
  private unsubscribe: (() => void) | undefined;
  private readonly onControllerChange = (): void => this.connectController();
  private readonly onClick = (): void => {
    const controller = getThemeController(this.ownerDocument);
    if (!controller || this.hasAttribute("disabled")) return;
    controller.cycle();
  };

  constructor() {
    super();
    this.attachShadow({ mode: "open" }).innerHTML = template;
    this.button?.addEventListener("click", this.onClick);
  }

  connectedCallback(): void {
    this.ownerDocument.addEventListener(
      THEME_CONTROLLER_CHANGE_EVENT,
      this.onControllerChange,
    );
    this.connectController();
  }

  disconnectedCallback(): void {
    this.ownerDocument.removeEventListener(
      THEME_CONTROLLER_CHANGE_EVENT,
      this.onControllerChange,
    );
    this.disconnectController();
    this.render("system");
  }

  adoptedCallback(): void {
    this.disconnectController();
    this.connectController();
  }

  attributeChangedCallback(): void {
    this.render(this.controller?.mode ?? "system");
  }

  private get button(): HTMLButtonElement | null {
    return this.shadowRoot?.querySelector("button") ?? null;
  }

  private connectController(): void {
    const controller = getThemeController(this.ownerDocument);
    if (controller === this.controller) {
      this.render(controller?.mode ?? "system");
      return;
    }

    this.disconnectController();
    this.controller = controller;
    if (controller) {
      this.unsubscribe = controller.subscribe((mode) => this.render(mode));
    } else {
      this.render("system");
    }
  }

  private disconnectController(): void {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    this.controller = undefined;
  }

  private render(mode: ThemeMode): void {
    const button = this.button;
    if (!button) return;
    for (const icon of button.querySelectorAll<SVGElement>("svg[data-mode]")) {
      icon.toggleAttribute("hidden", icon.dataset.mode !== mode);
    }
    const label = this.getAttribute("label")?.trim() || "Theme";
    const description = `${label}: ${mode} — switch to ${nextMode(mode)}`;
    button.setAttribute("aria-label", description);
    button.title = description;
    button.disabled = this.hasAttribute("disabled") || !this.controller;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "orc-theme-toggle": OrcThemeToggle;
  }
}
