import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { expect, userEvent, waitFor } from "storybook/test";

import { OrcButton } from "./orc-button";

if (!customElements.get("orc-button")) {
  customElements.define("orc-button", OrcButton);
}

interface ButtonArgs {
  label: string;
  variant: "primary" | "ghost";
  size: "default" | "compact";
  disabled: boolean;
  type: "button" | "submit";
}

function createButton(args: ButtonArgs): HTMLElement {
  const button = document.createElement("orc-button");
  if (args.variant !== "primary") button.setAttribute("variant", args.variant);
  if (args.size !== "default") button.setAttribute("size", args.size);
  if (args.disabled) button.setAttribute("disabled", "");
  if (args.type !== "button") button.setAttribute("type", args.type);
  button.textContent = args.label;
  return button;
}

function getButton(host: Element | null | undefined): HTMLButtonElement {
  const button = host?.shadowRoot?.querySelector<HTMLButtonElement>("button");
  if (!button) throw new Error("Expected orc-button to expose a native button.");
  return button;
}

const meta = {
  title: "Components/Button",
  component: "orc-button",
  tags: ["autodocs", "test"],
  args: {
    label: "Send",
    variant: "primary",
    size: "default",
    disabled: false,
    type: "button",
  },
  argTypes: {
    label: { control: "text" },
    variant: { control: "radio", options: ["primary", "ghost"] },
    size: { control: "radio", options: ["default", "compact"] },
    disabled: { control: "boolean" },
    type: { control: "radio", options: ["button", "submit"] },
  },
  render: (args) => createButton(args),
} satisfies Meta<ButtonArgs>;

export default meta;
type Story = StoryObj<ButtonArgs>;

export const Primary: Story = {
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("orc-button");
    const button = getButton(host);
    await expect(button).toBeEnabled();
    await expect(button).toHaveAccessibleName("Send");

    let clicks = 0;
    host?.addEventListener("click", () => clicks++);
    await userEvent.click(button);
    await waitFor(() => expect(clicks).toBe(1));
  },
};

export const Ghost: Story = {
  args: {
    label: "Copy",
    variant: "ghost",
  },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("orc-button");
    await expect(host).toHaveAttribute("variant", "ghost");
    await expect(getButton(host)).toHaveAccessibleName("Copy");
  },
};

export const Compact: Story = {
  args: {
    label: "Copy",
    size: "compact",
  },
};

export const Disabled: Story = {
  args: {
    label: "Send",
    disabled: true,
  },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("orc-button");
    const button = getButton(host);
    await expect(button).toBeDisabled();

    let clicks = 0;
    host?.addEventListener("click", () => clicks++);
    await userEvent.click(button, { pointerEventsCheck: 0 });
    await expect(clicks).toBe(0);
  },
};

export const SubmitType: Story = {
  args: {
    label: "Submit",
    type: "submit",
  },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("orc-button");
    await expect(getButton(host).type).toBe("submit");
  },
};
