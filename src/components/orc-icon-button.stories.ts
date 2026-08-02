import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { expect, userEvent, waitFor } from "storybook/test";

import { OrcIconButton } from "./orc-icon-button";

if (!customElements.get("orc-icon-button")) {
  customElements.define("orc-icon-button", OrcIconButton);
}

// The full Phosphor gear — a truncated path renders as a near-invisible dot in
// the docs preview, which is the first thing anyone sees of the component.
const SETTINGS_ICON =
  '<svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M128,82a46,46,0,1,0,46,46A46.06,46.06,0,0,0,128,82Zm0,80a34,34,0,1,1,34-34A34,34,0,0,1,128,162ZM214,130.84c.06-1.89.06-3.79,0-5.68L229.33,106a6,6,0,0,0,1.11-5.29A105.34,105.34,0,0,0,219.76,74.9a6,6,0,0,0-4.53-3l-24.45-2.71q-1.93-2.07-4-4l-2.72-24.46a6,6,0,0,0-3-4.53,105.65,105.65,0,0,0-25.77-10.66A6,6,0,0,0,150,26.68l-19.2,15.37c-1.89-.06-3.79-.06-5.68,0L106,26.67a6,6,0,0,0-5.29-1.11A105.34,105.34,0,0,0,74.9,36.24a6,6,0,0,0-3,4.53L69.23,65.22q-2.07,1.94-4,4L40.76,72a6,6,0,0,0-4.53,3,105.65,105.65,0,0,0-10.66,25.77A6,6,0,0,0,26.68,106l15.37,19.2c-.06,1.89-.06,3.79,0,5.68L26.67,150.05a6,6,0,0,0-1.11,5.29A105.34,105.34,0,0,0,36.24,181.1a6,6,0,0,0,4.53,3l24.45,2.71q1.94,2.07,4,4L72,215.24a6,6,0,0,0,3,4.53,105.65,105.65,0,0,0,25.77,10.66,6,6,0,0,0,5.29-1.11L125.16,214c1.89.06,3.79-.06,5.68,0l19.21,15.38a6,6,0,0,0,3.75,1.31,6.2,6.2,0,0,0,1.54-.2,105.34,105.34,0,0,0,25.76-10.68,6,6,0,0,0,3-4.53l2.71-24.45q2.07-1.93,4-4l24.46-2.72a6,6,0,0,0,4.53-3,105.49,105.49,0,0,0,10.66-25.77,6,6,0,0,0-1.11-5.29Z"/></svg>';

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
