import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { expect, userEvent, waitFor } from "storybook/test";

import { OrcCopyButton } from "./orc-copy-button";

if (!customElements.get("orc-copy-button")) {
  customElements.define("orc-copy-button", OrcCopyButton);
}

interface CopyButtonArgs {
  label: string;
  value: string;
  variant: "primary" | "ghost";
  size: "default" | "compact";
  disabled: boolean;
}

function createCopyButton(args: CopyButtonArgs): HTMLElement {
  const button = document.createElement("orc-copy-button");
  button.setAttribute("value", args.value);
  if (args.variant !== "primary") button.setAttribute("variant", args.variant);
  if (args.size !== "default") button.setAttribute("size", args.size);
  if (args.disabled) button.setAttribute("disabled", "");
  button.textContent = args.label;
  return button;
}

function getButton(host: Element | null | undefined): HTMLButtonElement {
  const button = host?.shadowRoot?.querySelector<HTMLButtonElement>("button");
  if (!button) throw new Error("Expected orc-copy-button to expose a native button.");
  return button;
}

// The real clipboard needs a permission and a user gesture the test runner does
// not have, so each play function decides the outcome it wants to show.
function stubClipboard(ok: boolean): void {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: {
      writeText: () => (ok ? Promise.resolve() : Promise.reject(new Error("denied"))),
    },
  });
}

const meta = {
  title: "Components/Copy button",
  component: "orc-copy-button",
  tags: ["autodocs", "test"],
  args: {
    label: "Copy",
    value: "rick/noticket/orc-copy-button",
    variant: "ghost",
    size: "default",
    disabled: false,
  },
  argTypes: {
    label: { control: "text" },
    value: { control: "text" },
    variant: { control: "radio", options: ["primary", "ghost"] },
    size: { control: "radio", options: ["default", "compact"] },
    disabled: { control: "boolean" },
  },
  render: (args) => createCopyButton(args),
} satisfies Meta<CopyButtonArgs>;

export default meta;
type Story = StoryObj<CopyButtonArgs>;

export const Ghost: Story = {
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("orc-copy-button");
    await expect(getButton(host)).toHaveAccessibleName("Copy");
    await expect(host).not.toHaveAttribute("state");
  },
};

export const Primary: Story = {
  args: {
    variant: "primary",
  },
};

export const Compact: Story = {
  args: {
    size: "compact",
  },
};

export const Copied: Story = {
  play: async ({ canvasElement }) => {
    stubClipboard(true);
    const host = canvasElement.querySelector("orc-copy-button");
    await userEvent.click(getButton(host));

    await waitFor(() => expect(host).toHaveAttribute("state", "copied"));
    await expect(getButton(host)).toHaveAccessibleName("Copied");
  },
};

export const CopyFailed: Story = {
  play: async ({ canvasElement }) => {
    stubClipboard(false);
    const host = canvasElement.querySelector("orc-copy-button");
    await userEvent.click(getButton(host));

    await waitFor(() => expect(host).toHaveAttribute("state", "failed"));
    await expect(getButton(host)).toHaveAccessibleName("Copy failed");
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
  play: async ({ canvasElement }) => {
    stubClipboard(true);
    const host = canvasElement.querySelector("orc-copy-button");
    const button = getButton(host);
    await expect(button).toBeDisabled();

    await userEvent.click(button, { pointerEventsCheck: 0 });
    await expect(host).not.toHaveAttribute("state");
  },
};
