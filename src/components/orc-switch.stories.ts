import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { expect, userEvent, waitFor } from "storybook/test";

import { OrcSwitch } from "./orc-switch";

if (!customElements.get("orc-switch")) {
  customElements.define("orc-switch", OrcSwitch);
}

interface SwitchArgs {
  label: string;
  checked: boolean;
  disabled: boolean;
  description: string;
}

function renderSwitch(args: SwitchArgs): HTMLElement {
  const surface = document.createElement("div");
  surface.className = "story-surface story-stack";

  const toggle = document.createElement("orc-switch");
  if (args.label) toggle.setAttribute("label", args.label);
  if (args.checked) toggle.setAttribute("checked", "");
  if (args.disabled) toggle.setAttribute("disabled", "");
  if (args.description) toggle.setAttribute("description", args.description);

  surface.append(toggle);
  return surface;
}

const meta = {
  title: "Components/Switch",
  component: "orc-switch",
  tags: ["autodocs", "test"],
  args: {
    label: "Auto-merge",
    checked: false,
    disabled: false,
    description: "",
  },
  argTypes: {
    label: { control: "text" },
    checked: { control: "boolean" },
    disabled: { control: "boolean" },
    description: { control: "text" },
  },
  render: (args) => renderSwitch(args),
} satisfies Meta<SwitchArgs>;

export default meta;
type Story = StoryObj<SwitchArgs>;

export const Off: Story = {
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("orc-switch");
    const input = host?.shadowRoot?.querySelector("input");
    await expect(input).not.toBeNull();
    await expect(input).not.toBeChecked();
  },
};

export const Checked: Story = {
  args: { checked: true },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("orc-switch");
    const input = host?.shadowRoot?.querySelector("input");
    await expect(input).toBeChecked();
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("orc-switch");
    const input = host?.shadowRoot?.querySelector("input");
    await expect(input).toBeDisabled();
  },
};

export const ClickAndKeyboardToggle: Story = {
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("orc-switch");
    const shadow = host?.shadowRoot;
    const input = () => shadow?.querySelector<HTMLInputElement>("input");

    await userEvent.click(input() as HTMLInputElement);
    await waitFor(() => expect(input()).toBeChecked());
    await expect(host).toHaveAttribute("checked");

    input()?.focus();
    await userEvent.keyboard(" ");
    await waitFor(() => expect(input()).not.toBeChecked());
    await expect(host).not.toHaveAttribute("checked");
  },
};
