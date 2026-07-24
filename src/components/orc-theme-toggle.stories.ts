import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { expect, userEvent, waitFor } from "storybook/test";

import { defineOrcElements } from "../define";
import {
  createThemeController,
  type ThemeController,
  type ThemeMode,
} from "../theme/controller";
import tokens from "../theme/orc-tokens.json";

defineOrcElements();

interface ToggleArgs {
  label: string;
}

let activeController: ThemeController | undefined;
let restoreMatchMedia: (() => void) | undefined;

function cleanStoryState(): void {
  activeController?.dispose();
  activeController = undefined;
  restoreMatchMedia?.();
  restoreMatchMedia = undefined;
  try {
    window.localStorage.removeItem("orcTheme");
  } catch {
    // A storage-failure story deliberately exercises this path.
  }
  document.documentElement.removeAttribute("data-theme");
}

function startController(mode: ThemeMode = "system"): ThemeController {
  cleanStoryState();
  activeController = createThemeController({
    document,
    storageKey: "orcTheme",
    themeColor: { light: tokens.day.bg, dark: tokens.night.bg },
    announce: true,
  });
  activeController.setMode(mode);
  return activeController;
}

function createToggle(label: string): HTMLElement {
  const toggle = document.createElement("orc-theme-toggle");
  toggle.setAttribute("label", label);
  return toggle;
}

function getButton(toggle: Element | null | undefined): HTMLButtonElement {
  const button = toggle?.shadowRoot?.querySelector<HTMLButtonElement>("button");
  if (!button) throw new Error("Expected orc-theme-toggle to expose a native button.");
  return button;
}

function visibleIcon(button: HTMLButtonElement): string | undefined {
  // Rendered, not merely unmarked: `hidden` alone does not hide an SVG.
  const rendered = [...button.querySelectorAll<SVGElement>("svg[data-mode]")].filter((icon) =>
    icon.checkVisibility(),
  );
  if (rendered.length > 1) {
    throw new Error(
      `Expected one visible theme icon, saw ${rendered.map((icon) => icon.dataset.mode).join(", ")}.`,
    );
  }
  return rendered[0]?.dataset.mode;
}

function renderToggle(args: ToggleArgs, mode: ThemeMode = "system"): HTMLElement {
  startController(mode);
  const surface = document.createElement("div");
  surface.className = "story-surface story-stack";
  surface.append(createToggle(args.label));
  return surface;
}

function installMatchMedia(initialMatches = false): {
  mediaQuery: MediaQueryList;
  setMatches(matches: boolean): void;
} {
  const original = window.matchMedia;
  const target = new EventTarget();
  let matches = initialMatches;
  const legacyListeners = new Set<(event: MediaQueryListEvent) => void>();
  const mediaQuery = {
    get matches() {
      return matches;
    },
    media: "(prefers-color-scheme: dark)",
    onchange: null,
    addEventListener: target.addEventListener.bind(target),
    removeEventListener: target.removeEventListener.bind(target),
    dispatchEvent: target.dispatchEvent.bind(target),
    addListener(listener: (event: MediaQueryListEvent) => void) {
      legacyListeners.add(listener);
    },
    removeListener(listener: (event: MediaQueryListEvent) => void) {
      legacyListeners.delete(listener);
    },
  } as MediaQueryList;

  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: () => mediaQuery,
  });
  restoreMatchMedia = () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: original,
    });
  };

  return {
    mediaQuery,
    setMatches(nextMatches) {
      matches = nextMatches;
      const event = new Event("change") as MediaQueryListEvent;
      target.dispatchEvent(event);
      for (const listener of legacyListeners) listener(event);
    },
  };
}

const meta = {
  title: "Components/Theme Toggle",
  component: "orc-theme-toggle",
  tags: ["autodocs", "test"],
  args: {
    label: "Theme",
  },
  argTypes: {
    label: { control: "text" },
  },
  render: (args) => renderToggle(args),
} satisfies Meta<ToggleArgs>;

export default meta;
type Story = StoryObj<ToggleArgs>;

export const System: Story = {
  play: async ({ canvasElement }) => {
    const toggle = canvasElement.querySelector("orc-theme-toggle");
    const button = getButton(toggle);
    await expect(button).toBeEnabled();
    await expect(visibleIcon(button)).toBe("system");
    await expect(button).toHaveAccessibleName("Theme: system — switch to light");
  },
};

export const ExplicitLight: Story = {
  globals: { theme: "light" },
  render: (args) => renderToggle(args, "light"),
  play: async ({ canvasElement }) => {
    const button = getButton(canvasElement.querySelector("orc-theme-toggle"));
    await expect(visibleIcon(button)).toBe("light");
    await expect(button).toHaveAccessibleName("Theme: light — switch to dark");
  },
};

export const ExplicitDark: Story = {
  globals: { theme: "dark" },
  render: (args) => renderToggle(args, "dark"),
  play: async ({ canvasElement }) => {
    const button = getButton(canvasElement.querySelector("orc-theme-toggle"));
    await expect(visibleIcon(button)).toBe("dark");
    await expect(button).toHaveAccessibleName("Theme: dark — switch to system");
  },
};

export const NarrowWithLongLabel: Story = {
  args: {
    label: "Website Appearance & Operating System Theme Preference",
  },
  render: (args) => {
    const surface = renderToggle(args);
    surface.dataset.width = "narrow";
    return surface;
  },
};

export const KeyboardFocus: Story = {
  play: async ({ canvasElement }) => {
    const toggle = canvasElement.querySelector("orc-theme-toggle");
    const button = getButton(toggle);
    button.focus();
    await expect(document.activeElement).toBe(toggle);
    await expect(toggle?.shadowRoot?.activeElement).toBe(button);
  },
};

export const MultipleInstancesStayInSync: Story = {
  render: (args) => {
    startController("system");
    const surface = document.createElement("div");
    surface.className = "story-surface story-stack";
    surface.append(
      createToggle(`${args.label} A`),
      createToggle(`${args.label} B`),
    );
    return surface;
  },
  play: async ({ canvasElement }) => {
    const toggles = [...canvasElement.querySelectorAll("orc-theme-toggle")];
    const first = getButton(toggles[0]);
    const second = getButton(toggles[1]);

    await userEvent.click(first);
    await expect(visibleIcon(first)).toBe("light");
    await expect(first).toHaveAccessibleName("Theme A: light — switch to dark");
    await expect(visibleIcon(second)).toBe("light");
    await expect(second).toHaveAccessibleName("Theme B: light — switch to dark");
    await expect(activeController?.mode).toBe("light");
  },
};

export const PersistenceFailureIsNonFatal: Story = {
  render: (args) => renderToggle(args),
  play: async ({ canvasElement }) => {
    const button = getButton(canvasElement.querySelector("orc-theme-toggle"));
    const storagePrototype = Object.getPrototypeOf(window.localStorage) as Storage;
    const originalSetItem = storagePrototype.setItem;
    storagePrototype.setItem = () => {
      throw new DOMException("Storage blocked by policy", "SecurityError");
    };
    try {
      await userEvent.click(button);
      await expect(activeController?.mode).toBe("light");
      await expect(visibleIcon(button)).toBe("light");
    } finally {
      storagePrototype.setItem = originalSetItem;
    }
  },
};

export const OperatingSystemChange: Story = {
  render: (args) => {
    cleanStoryState();
    const media = installMatchMedia(false);
    activeController = createThemeController({ document, announce: true });

    const surface = document.createElement("div");
    surface.className = "story-surface story-stack";
    const toggle = createToggle(args.label);
    const simulation = document.createElement("button");
    simulation.className = "story-action";
    simulation.type = "button";
    simulation.textContent = "Simulate Dark Operating System";
    const output = document.createElement("output");
    output.className = "story-output";
    output.setAttribute("aria-live", "polite");
    activeController.subscribe((mode, resolvedTheme) => {
      output.value = `${mode} resolves to ${resolvedTheme}`;
    });
    simulation.addEventListener("click", () => media.setMatches(true));
    surface.append(toggle, simulation, output);
    return surface;
  },
  play: async ({ canvasElement }) => {
    const simulation = canvasElement.querySelector<HTMLButtonElement>(".story-action");
    const output = canvasElement.querySelector("output");
    const toggle = canvasElement.querySelector("orc-theme-toggle");
    await expect(output).toHaveTextContent("system resolves to light");
    await userEvent.click(simulation as HTMLButtonElement);
    await expect(output).toHaveTextContent("system resolves to dark");
    // Mode stays "system" (monitor icon) even as the OS resolves to dark.
    await waitFor(() => expect(visibleIcon(getButton(toggle))).toBe("system"));
  },
};

export const NoController: Story = {
  render: (args) => {
    cleanStoryState();
    const surface = document.createElement("div");
    surface.className = "story-surface story-stack";
    surface.append(createToggle(args.label));
    return surface;
  },
  play: async ({ canvasElement }) => {
    const button = getButton(canvasElement.querySelector("orc-theme-toggle"));
    await expect(button).toBeDisabled();
    await expect(visibleIcon(button)).toBe("system");
    await expect(button).toHaveAccessibleName("Theme: system — switch to light");
  },
};

export const ExplicitlyDisabled: Story = {
  render: (args) => {
    startController();
    const surface = document.createElement("div");
    surface.className = "story-surface story-stack";
    const toggle = createToggle(args.label);
    toggle.setAttribute("disabled", "");
    surface.append(toggle);
    return surface;
  },
  play: async ({ canvasElement }) => {
    await expect(getButton(canvasElement.querySelector("orc-theme-toggle"))).toBeDisabled();
  },
};

export const ControllerTeardown: Story = {
  render: (args) => {
    const controller = startController("dark");
    const surface = document.createElement("div");
    surface.className = "story-surface story-stack";
    const note = document.createElement("p");
    note.className = "story-note";
    note.textContent = "The controller has been disposed; connected toggles return to a disabled state.";
    surface.append(createToggle(args.label), createToggle(`${args.label} Secondary`), note);
    queueMicrotask(() => {
      controller.dispose();
      surface.dataset.disposed = "true";
    });
    return surface;
  },
  play: async ({ canvasElement }) => {
    const surface = canvasElement.querySelector<HTMLElement>(".story-surface");
    await waitFor(() => expect(surface).toHaveAttribute("data-disposed", "true"));
    const buttons = [...canvasElement.querySelectorAll("orc-theme-toggle")].map(getButton);
    for (const button of buttons) await expect(button).toBeDisabled();

    const replacement = createThemeController({ document, announce: false });
    await waitFor(() => expect(buttons[0]).toBeEnabled());
    replacement.dispose();
    await waitFor(() => expect(buttons[0]).toBeDisabled());
  },
};
