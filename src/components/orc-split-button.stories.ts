import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { expect, userEvent, waitFor } from "storybook/test";

import { defineOrcElements } from "../define";
import type { OrcSplitButton } from "./orc-split-button";

defineOrcElements();

interface SplitButtonArgs {
  disabled: boolean;
  label: string;
  primary: string;
  primaryKind: "native" | "orc-button";
  size: "default" | "compact";
  variant: "primary" | "ghost";
}

function item(label: string): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.slot = "menu";
  button.setAttribute("role", "menuitem");
  button.textContent = label;
  return button;
}

function renderSplitButton(args: SplitButtonArgs, content?: HTMLElement[]): HTMLElement {
  const surface = document.createElement("div");
  surface.className = "story-surface story-stack";

  const host = document.createElement("orc-split-button") as OrcSplitButton;
  host.setAttribute("label", args.label);
  host.setAttribute("variant", args.variant);
  if (args.disabled) host.setAttribute("disabled", "");
  if (args.size === "compact") host.setAttribute("size", "compact");

  const primary = document.createElement(args.primaryKind === "orc-button" ? "orc-button" : "button");
  primary.setAttribute("type", "button");
  primary.setAttribute("variant", args.variant);
  if (args.size === "compact") primary.setAttribute("size", "compact");
  primary.textContent = args.primary;
  host.append(primary, ...(content ?? [item("Remove worktree"), item("Stop worktree app")]));
  surface.append(host);
  return surface;
}

function getSplitButton(canvasElement: HTMLElement): OrcSplitButton {
  const host = canvasElement.querySelector<OrcSplitButton>("orc-split-button");
  if (!host) throw new Error("Expected an orc-split-button to be rendered.");
  return host;
}

function itemNamed(host: OrcSplitButton, label: string): HTMLElement {
  const match = [...host.querySelectorAll<HTMLElement>('[role="menuitem"]')].find(
    (candidate) => candidate.textContent === label,
  );
  if (!match) throw new Error(`Expected a menu item named ${label}.`);
  return match;
}

const meta = {
  title: "Components/Split button",
  component: "orc-split-button",
  tags: ["autodocs", "test"],
  args: {
    disabled: false,
    label: "More delivery actions",
    primary: "Merge to main",
    primaryKind: "orc-button",
    size: "default",
    variant: "primary",
  },
  argTypes: {
    disabled: { control: "boolean" },
    label: { control: "text" },
    primary: { control: "text" },
    primaryKind: { control: "select", options: ["orc-button", "native"] },
    size: { control: "select", options: ["default", "compact"] },
    variant: { control: "select", options: ["primary", "ghost"] },
  },
  render: (args) => renderSplitButton(args),
} satisfies Meta<SplitButtonArgs>;

export default meta;
type Story = StoryObj<SplitButtonArgs>;

export const PointerInteraction: Story = {
  play: async ({ canvasElement }) => {
    const host = getSplitButton(canvasElement);
    await expect(host.trigger).toHaveAccessibleName("More actions");
    await expect(host.trigger).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(host.trigger!);
    await waitFor(() => expect(host.trigger).toHaveAttribute("aria-expanded", "true"));
    await expect(host).toHaveAttribute("open");
    await userEvent.click(itemNamed(host, "Stop worktree app"));
    await waitFor(() => expect(host.trigger).toHaveAttribute("aria-expanded", "false"));
    await expect(host).not.toHaveAttribute("open");
  },
};

export const NativePrimary: Story = {
  args: { primaryKind: "native" },
  play: async ({ canvasElement }) => {
    const host = getSplitButton(canvasElement);
    const primary = host.querySelector<HTMLButtonElement>("button:not([slot])")!;
    const trigger = host.trigger!;
    // One joined control: the primary's end corners are squared against the
    // chevron and the two halves share a height.
    await expect(getComputedStyle(primary).borderTopRightRadius).toBe("0px");
    await expect(getComputedStyle(primary).borderBottomRightRadius).toBe("0px");
    await expect(trigger.getBoundingClientRect().height).toBe(
      primary.getBoundingClientRect().height,
    );
  },
};

export const ArmThenConfirm: Story = {
  render: (args) => {
    const arm = item("Remove worktree");
    arm.addEventListener("click", (event) => {
      if (arm.dataset.armed === "true") return;
      arm.dataset.armed = "true";
      arm.textContent = "Confirm: Remove worktree";
      event.preventDefault();
    });
    return renderSplitButton(args, [arm, item("Stop worktree app")]);
  },
  play: async ({ canvasElement }) => {
    const host = getSplitButton(canvasElement);
    await userEvent.click(host.trigger!);
    await waitFor(() => expect(host).toHaveAttribute("open"));
    const arm = itemNamed(host, "Remove worktree");
    await userEvent.click(arm);
    await expect(arm).toHaveTextContent("Confirm: Remove worktree");
    await expect(host).toHaveAttribute("open");
    await userEvent.click(arm);
    await waitFor(() => expect(host).not.toHaveAttribute("open"));
  },
};

export const KeyboardNavigation: Story = {
  play: async ({ canvasElement }) => {
    const host = getSplitButton(canvasElement);
    host.trigger?.focus();
    await userEvent.keyboard("{ArrowDown}");
    await waitFor(() => expect(document.activeElement).toBe(itemNamed(host, "Remove worktree")));
    await userEvent.keyboard("{ArrowDown}");
    await expect(document.activeElement).toBe(itemNamed(host, "Stop worktree app"));
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(host).not.toHaveAttribute("open"));
    await expect(host.menu?.shadowRoot?.activeElement).toBe(host.trigger);
  },
};

export const Ghost: Story = {
  args: { variant: "ghost" },
};

export const Compact: Story = {
  args: { size: "compact" },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    const host = getSplitButton(canvasElement);
    await expect(host.trigger).toBeDisabled();
    const primary = host.querySelector("orc-button, button:not([slot])")!;
    await expect(primary).not.toHaveAttribute("disabled");
  },
};
