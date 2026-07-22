import type { ThemeController, ThemeMode } from "../theme/controller";
import {
  getThemeController,
  THEME_CONTROLLER_CHANGE_EVENT,
} from "../theme/registry";

const HTMLElementBase = (
  typeof HTMLElement === "undefined" ? class {} : HTMLElement
) as typeof HTMLElement;

const template = `
  <style>
    :host {
      display: inline-block;
      max-inline-size: 100%;
      font-family: var(--orc-font-sans, Inter, ui-sans-serif, system-ui, sans-serif);
    }

    button {
      display: inline-flex;
      max-inline-size: 100%;
      min-block-size: 2.5rem;
      align-items: center;
      justify-content: center;
      padding: var(--orc-space-2, 0.5rem) var(--orc-space-3, 0.75rem);
      border: 1px solid var(--orc-accent-strong, #7aa2f7);
      border-radius: var(--orc-radius-md, 0.5rem);
      color: var(--orc-heading, #c0caf5);
      background: var(--orc-chip, #292e42);
      font: inherit;
      font-weight: 600;
      line-height: 1.25;
      overflow-wrap: anywhere;
      cursor: pointer;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
      transition: background-color 120ms ease, border-color 120ms ease;
    }

    button:hover:not(:disabled) {
      border-color: var(--orc-accent-strong, #7aa2f7);
      background: var(--orc-button-hover-chip, #292e42);
    }

    button:active:not(:disabled) {
      background: var(--orc-button-hover-strong, #3b4261);
    }

    button:focus-visible {
      outline: var(--orc-focus-ring, 2px solid #7aa2f7);
      outline-offset: var(--orc-focus-offset, 2px);
    }

    button:disabled {
      color: var(--orc-muted-strong, #565f89);
      cursor: not-allowed;
      opacity: 0.72;
    }

    @media (prefers-reduced-motion: reduce) {
      button {
        transition: none;
      }
    }
  </style>
  <button type="button" disabled></button>
`;

const DISPLAY_NAMES: Record<ThemeMode, string> = {
  system: "System",
  light: "Light",
  dark: "Dark",
};

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
    const label = this.getAttribute("label")?.trim() || "Theme";
    const modeLabel = DISPLAY_NAMES[mode];
    button.textContent = `${label}: ${modeLabel}`;
    button.setAttribute(
      "aria-label",
      `${label}: ${modeLabel}. Activate to switch theme.`,
    );
    button.disabled = this.hasAttribute("disabled") || !this.controller;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "orc-theme-toggle": OrcThemeToggle;
  }
}
