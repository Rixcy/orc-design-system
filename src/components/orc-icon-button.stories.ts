import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { expect, userEvent, waitFor } from "storybook/test";

import { OrcIconButton } from "./orc-icon-button";

if (!customElements.get("orc-icon-button")) {
  customElements.define("orc-icon-button", OrcIconButton);
}

const SETTINGS_ICON =
  '<svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M128,82a46,46,0,1,0,46,46A46.06,46.06,0,0,0,128,82Zm0,80a34,34,0,1,1,34-34A34,34,0,0,1,128,162Z"/></svg>';

interface IconButtonArgs {
  label: string;
  variant: "plain" | "ghost";
  size: "default" | "compact";
  disabled: boolean;
  href: string;
}

function createIconButton(args: IconButtonArgs): HTMLElement {
  const button = document.createElement("orc-icon-button");
  button.setAttribute("label", args.label);
  if (args.variant !== "plain") button.setAttribute("variant", args.variant);
  if (args.size !== "default") button.setAttribute("size", args.size);
  if (args.disabled) button.setAttribute("disabled", "");
  if (args.href) button.setAttribute("href", args.href);
  button.innerHTML = SETTINGS_ICON;
  return button;
}

function getControl(
  host: Element | null | undefined,
): HTMLButtonElement | HTMLAnchorElement {
  const control = host?.shadowRoot?.querySelector<
    HTMLButtonElement | HTMLAnchorElement
  >("button, a");
  if (!control) throw new Error("Expected orc-icon-button to expose a control.");
  return control;
}

const meta = {
  title: "Components/IconButton",
  component: "orc-icon-button",
  tags: ["autodocs", "test"],
  args: {
    label: "Settings",
    variant: "plain",
    size: "default",
    disabled: false,
    href: "",
  },
  argTypes: {
    label: { control: "text" },
    variant: { control: "radio", options: ["plain", "ghost"] },
    size: { control: "radio", options: ["default", "compact"] },
    disabled: { control: "boolean" },
    href: { control: "text" },
  },
  render: (args) => createIconButton(args),
} satisfies Meta<IconButtonArgs>;

export default meta;
type Story = StoryObj<IconButtonArgs>;

export const Plain: Story = {
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("orc-icon-button");
    const control = getControl(host);
    await expect(control.tagName).toBe("BUTTON");
    await expect(control).toHaveAccessibleName("Settings");

    let clicks = 0;
    host?.addEventListener("click", () => clicks++);
    await userEvent.click(control);
    await waitFor(() => expect(clicks).toBe(1));
  },
};

export const Ghost: Story = {
  args: { label: "Filter", variant: "ghost" },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("orc-icon-button");
    await expect(host).toHaveAttribute("variant", "ghost");
    await expect(getControl(host)).toHaveAccessibleName("Filter");
  },
};

export const Compact: Story = {
  args: { label: "Filter", size: "compact" },
};

export const Link: Story = {
  args: { label: "Tickets", href: "#tickets" },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("orc-icon-button");
    const control = getControl(host);
    await expect(control.tagName).toBe("A");
    await expect(control).toHaveAttribute("href", "#tickets");
  },
};

export const Disabled: Story = {
  args: { label: "Settings", disabled: true },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("orc-icon-button");
    const control = getControl(host);
    await expect(control.tagName).toBe("BUTTON");
    await expect(control).toBeDisabled();

    let clicks = 0;
    host?.addEventListener("click", () => clicks++);
    await userEvent.click(control, { pointerEventsCheck: 0 });
    await expect(clicks).toBe(0);
  },
};

/** `disabled` wins over `href`: a disabled link is not a real state. */
export const DisabledLink: Story = {
  args: { label: "Tickets", href: "#tickets", disabled: true },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("orc-icon-button");
    const control = getControl(host);
    await expect(control.tagName).toBe("BUTTON");
    await expect(control).toBeDisabled();
    await expect(control).not.toHaveAttribute("href");
  },
};
