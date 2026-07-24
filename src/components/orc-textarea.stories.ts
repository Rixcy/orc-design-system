import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { expect, userEvent } from "storybook/test";

import { OrcTextarea } from "./orc-textarea";

if (!customElements.get("orc-textarea")) {
  customElements.define("orc-textarea", OrcTextarea);
}

interface TextareaArgs {
  label: string;
  placeholder: string;
  disabled: boolean;
  rows: number;
}

function renderTextarea(args: TextareaArgs): HTMLElement {
  const surface = document.createElement("div");
  surface.className = "story-surface story-stack";
  const field = document.createElement("orc-textarea");
  field.setAttribute("label", args.label);
  field.setAttribute("placeholder", args.placeholder);
  if (args.disabled) field.setAttribute("disabled", "");
  if (args.rows) field.setAttribute("rows", String(args.rows));
  surface.append(field);
  return surface;
}

function getTextarea(
  field: Element | null | undefined,
): HTMLTextAreaElement {
  const textarea =
    field?.shadowRoot?.querySelector<HTMLTextAreaElement>("textarea");
  if (!textarea) {
    throw new Error("Expected orc-textarea to expose a native textarea.");
  }
  return textarea;
}

const meta = {
  title: "Components/Textarea",
  component: "orc-textarea",
  tags: ["autodocs", "test"],
  args: {
    label: "Feedback",
    placeholder: "Tell us what happened…",
    disabled: false,
    rows: 0,
  },
  argTypes: {
    label: { control: "text" },
    placeholder: { control: "text" },
    disabled: { control: "boolean" },
    rows: { control: "number" },
  },
  render: (args) => renderTextarea(args),
} satisfies Meta<TextareaArgs>;

export default meta;
type Story = StoryObj<TextareaArgs>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const field = canvasElement.querySelector("orc-textarea");
    const textarea = getTextarea(field);
    await expect(textarea).toBeEnabled();
    await expect(textarea).toHaveAccessibleName("Feedback");

    await userEvent.type(textarea, "Everything worked great.");
    await expect(textarea).toHaveValue("Everything worked great.");
    await expect((field as HTMLElement & { value: string }).value).toBe(
      "Everything worked great.",
    );
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    const field = canvasElement.querySelector("orc-textarea");
    await expect(getTextarea(field)).toBeDisabled();
  },
};

export const CustomRows: Story = {
  args: { rows: 6 },
  play: async ({ canvasElement }) => {
    const field = canvasElement.querySelector("orc-textarea");
    await expect(getTextarea(field).rows).toBe(6);
  },
};
