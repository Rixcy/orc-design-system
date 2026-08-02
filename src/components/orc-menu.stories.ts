import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { expect, userEvent, waitFor } from "storybook/test";

import { defineOrcElements } from "../define";
import type { OrcMenu } from "./orc-menu";

defineOrcElements();

interface MenuArgs {
  disabled: boolean;
  label: string;
  trigger: string;
}

function item(
  label: string,
  role: "menuitem" | "menuitemradio" = "menuitem",
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.setAttribute("role", role);
  button.textContent = label;
  return button;
}

function renderMenu(args: MenuArgs, content?: HTMLElement[]): HTMLElement {
  const surface = document.createElement("div");
  surface.className = "story-surface story-stack";

  const menu = document.createElement("orc-menu") as OrcMenu;
  menu.setAttribute("label", args.label);
  if (args.disabled) menu.setAttribute("disabled", "");
  const trigger = document.createElement("span");
  trigger.slot = "trigger";
  trigger.textContent = args.trigger;
  menu.append(trigger, ...(content ?? [item("Open run"), item("Copy link"), item("Archive")]));
  surface.append(menu);
  return surface;
}

function getMenu(canvasElement: HTMLElement): OrcMenu {
  const menu = canvasElement.querySelector<OrcMenu>("orc-menu");
  if (!menu) throw new Error("Expected an orc-menu to be rendered.");
  return menu;
}

const meta = {
  title: "Components/Menu",
  component: "orc-menu",
  tags: ["autodocs", "test"],
  args: {
    disabled: false,
    label: "Run actions",
    trigger: "Actions",
  },
  argTypes: {
    disabled: { control: "boolean" },
    label: { control: "text" },
    trigger: { control: "text" },
  },
  render: (args) => renderMenu(args),
} satisfies Meta<MenuArgs>;

export default meta;
type Story = StoryObj<MenuArgs>;

export const PointerInteraction: Story = {
  play: async ({ canvasElement }) => {
    const menu = getMenu(canvasElement);
    await expect(menu.trigger).toHaveAccessibleName("Actions");
    await expect(menu.trigger).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(menu.trigger!);
    await waitFor(() => expect(menu.trigger).toHaveAttribute("aria-expanded", "true"));
    const copy = [...menu.querySelectorAll<HTMLElement>('[role="menuitem"]')].find(
      (candidate) => candidate.textContent === "Copy link",
    );
    await userEvent.click(copy!);
    await waitFor(() => expect(menu.trigger).toHaveAttribute("aria-expanded", "false"));
    await expect(menu.shadowRoot?.activeElement).toBe(menu.trigger);
  },
};

export const KeyboardNavigation: Story = {
  render: (args) => {
    const disabled = item("Unavailable");
    disabled.disabled = true;
    return renderMenu(args, [item("First"), disabled, item("Last")]);
  },
  play: async ({ canvasElement }) => {
    const menu = getMenu(canvasElement);
    menu.trigger?.focus();
    await userEvent.keyboard("{ArrowDown}");
    const [first, , last] = [...menu.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')];
    await waitFor(() => expect(document.activeElement).toBe(first));
    await userEvent.keyboard("{ArrowDown}");
    await expect(document.activeElement).toBe(last);
    await userEvent.keyboard("{Home}");
    await expect(document.activeElement).toBe(first);
    await userEvent.keyboard("{End}");
    await expect(document.activeElement).toBe(last);
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(menu.trigger).toHaveAttribute("aria-expanded", "false"));
    await expect(menu.shadowRoot?.activeElement).toBe(menu.trigger);
  },
};

export const GroupedRadioItems: Story = {
  render: (args) => {
    const group = document.createElement("div");
    group.setAttribute("role", "group");
    group.setAttribute("aria-label", "Status");
    const all = item("All", "menuitemradio");
    all.setAttribute("aria-checked", "true");
    const running = item("Running", "menuitemradio");
    running.setAttribute("aria-checked", "false");
    const finished = item("Finished", "menuitemradio");
    finished.setAttribute("aria-checked", "false");
    for (const radio of [all, running, finished]) {
      radio.className = "story-action";
      radio.addEventListener("click", () => {
        for (const candidate of [all, running, finished]) {
          candidate.setAttribute("aria-checked", String(candidate === radio));
        }
      });
    }
    group.append(all, running, finished);
    return renderMenu(args, [group]);
  },
  play: async ({ canvasElement }) => {
    const menu = getMenu(canvasElement);
    await userEvent.click(menu.trigger!);
    const group = menu.querySelector('[role="group"]');
    const radios = [...menu.querySelectorAll<HTMLElement>('[role="menuitemradio"]')];
    await expect(group).toHaveAccessibleName("Status");
    await userEvent.click(radios[1]!);
    await expect(radios[1]).toHaveAttribute("aria-checked", "true");
    await expect(radios[0]).toHaveAttribute("aria-checked", "false");
  },
};

export const Empty: Story = {
  render: (args) => renderMenu(args, []),
  play: async ({ canvasElement }) => {
    const menu = getMenu(canvasElement);
    await userEvent.click(menu.trigger!);
    const empty = menu.shadowRoot?.querySelector(".empty");
    await waitFor(() => expect(menu.trigger).toHaveAttribute("aria-expanded", "true"));
    await waitFor(() => expect(empty).not.toHaveAttribute("hidden"));
    await expect(empty).toHaveTextContent("No actions available");
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    const menu = getMenu(canvasElement);
    await expect(menu.trigger).toBeDisabled();
    await expect(menu.trigger).toHaveAttribute("aria-expanded", "false");
  },
};

export const LongContentOnNarrowSurface: Story = {
  render: (args) => {
    const content = Array.from({ length: 18 }, (_, index) =>
      item(
        index === 0
          ? "Review the complete implementation notes for the selected repository"
          : `History entry ${index + 1}`,
      ),
    );
    const surface = renderMenu(args, content);
    surface.dataset.width = "narrow";
    return surface;
  },
  play: async ({ canvasElement }) => {
    const menu = getMenu(canvasElement);
    await userEvent.click(menu.trigger!);
    const layer = menu.menu!;
    const rect = layer.getBoundingClientRect();
    await expect(rect.left).toBeGreaterThanOrEqual(8);
    await expect(rect.right).toBeLessThanOrEqual(window.innerWidth - 8);
    await expect(getComputedStyle(layer).overflowY).toMatch(/auto|scroll/);
  },
};

export const DarkTheme: Story = {
  globals: { theme: "dark" },
  play: PointerInteraction.play,
};

export const LightTheme: Story = {
  globals: { theme: "light" },
  play: PointerInteraction.play,
};

export const ReducedMotion: Story = {
  play: async ({ canvasElement }) => {
    const menu = getMenu(canvasElement);
    const css = menu.shadowRoot?.querySelector("style")?.textContent ?? "";
    await expect(css).toContain("prefers-reduced-motion: no-preference");
    await expect(css).not.toContain("prefers-reduced-motion: reduce");
    await userEvent.click(menu.trigger!);
    await expect(menu.trigger).toHaveAttribute("aria-expanded", "true");
  },
};
