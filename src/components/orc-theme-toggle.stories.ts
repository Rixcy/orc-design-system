import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { expect, userEvent } from "storybook/test";

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

// One controller per document, reused by every story: the theme is a global
// singleton, and disposing it between renders left every already-rendered
// toggle on the docs page permanently disabled.
let controller: ThemeController | undefined;

function useController(mode: ThemeMode = "system"): ThemeController {
  try {
    window.localStorage.removeItem("orcTheme");
  } catch {
    // Storage can be blocked by policy; the controller tolerates it.
  }
  controller ??= createThemeController({
    document,
    storageKey: "orcTheme",
    themeColor: { light: tokens.day.bg, dark: tokens.night.bg },
    announce: true,
  });
  controller.setMode(mode);
  return controller;
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

function surfaceWith(...children: HTMLElement[]): HTMLElement {
  const surface = document.createElement("div");
  surface.className = "story-surface story-stack";
  surface.append(...children);
  return surface;
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
  render: (args) => {
    useController();
    return surfaceWith(createToggle(args.label));
  },
} satisfies Meta<ToggleArgs>;

export default meta;
type Story = StoryObj<ToggleArgs>;

/** Cycles system -> light -> dark -> system, the toggle's whole state machine. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const button = getButton(canvasElement.querySelector("orc-theme-toggle"));
    const steps: ThemeMode[] = ["system", "light", "dark", "system"];

    for (const [index, mode] of steps.entries()) {
      const next = steps[index + 1] ?? "light";
      await expect(button).toBeEnabled();
      await expect(visibleIcon(button)).toBe(mode);
      await expect(button).toHaveAccessibleName(`Theme: ${mode} — switch to ${next}`);
      if (index < steps.length - 1) await userEvent.click(button);
    }
  },
};

export const MultipleInstancesStayInSync: Story = {
  render: (args) => {
    useController();
    return surfaceWith(createToggle(`${args.label} A`), createToggle(`${args.label} B`));
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
    await expect(controller?.mode).toBe("light");
  },
};

export const Disabled: Story = {
  render: (args) => {
    useController();
    const toggle = createToggle(args.label);
    toggle.setAttribute("disabled", "");
    return surfaceWith(toggle);
  },
  play: async ({ canvasElement }) => {
    await expect(getButton(canvasElement.querySelector("orc-theme-toggle"))).toBeDisabled();
  },
};
