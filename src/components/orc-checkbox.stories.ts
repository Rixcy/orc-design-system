import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { expect, userEvent } from "storybook/test";

import { defineOrcElements } from "../define";

defineOrcElements();

interface CheckboxArgs {
  label: string;
  checked: boolean;
  indeterminate: boolean;
  disabled: boolean;
  required: boolean;
}

function renderCheckbox(args: CheckboxArgs): HTMLElement {
  const surface = document.createElement("div");
  surface.className = "story-surface story-stack";
  const field = document.createElement("orc-checkbox");
  field.setAttribute("label", args.label);
  if (args.checked) field.setAttribute("checked", "");
  if (args.indeterminate) field.setAttribute("indeterminate", "");
  if (args.disabled) field.setAttribute("disabled", "");
  if (args.required) field.setAttribute("required", "");
  surface.append(field);
  return surface;
}

function getCheckbox(field: Element | null | undefined): HTMLInputElement {
  const input = field?.shadowRoot?.querySelector<HTMLInputElement>("input");
  if (!input) {
    throw new Error("Expected orc-checkbox to expose a native input.");
  }
  return input;
}

const meta = {
  title: "Components/Checkbox",
  component: "orc-checkbox",
  tags: ["autodocs", "test"],
  args: {
    label: "Notify me",
    checked: false,
    indeterminate: false,
    disabled: false,
    required: false,
  },
  argTypes: {
    label: { control: "text" },
    checked: { control: "boolean" },
    indeterminate: { control: "boolean" },
    disabled: { control: "boolean" },
    required: { control: "boolean" },
  },
  render: (args) => renderCheckbox(args),
} satisfies Meta<CheckboxArgs>;

export default meta;
type Story = StoryObj<CheckboxArgs>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const field = canvasElement.querySelector("orc-checkbox");
    const input = getCheckbox(field);
    await expect(input).toBeEnabled();
    await expect(input).toHaveAccessibleName("Notify me");
    await expect(input.checked).toBe(false);

    await userEvent.click(input);
    await expect(input.checked).toBe(true);

    await userEvent.click(input);
    await expect(input.checked).toBe(false);
    await userEvent.keyboard("{Tab}");
  },
};

export const KeyboardToggle: Story = {
  play: async ({ canvasElement }) => {
    const field = canvasElement.querySelector("orc-checkbox");
    const input = getCheckbox(field);

    input.focus();
    await expect(input.checked).toBe(false);

    await userEvent.keyboard(" ");
    await expect(input.checked).toBe(true);
  },
};

export const Checked: Story = {
  args: { checked: true },
  play: async ({ canvasElement }) => {
    const field = canvasElement.querySelector("orc-checkbox");
    await expect(getCheckbox(field).checked).toBe(true);
  },
};

export const Indeterminate: Story = {
  args: { indeterminate: true },
  play: async ({ canvasElement }) => {
    const field = canvasElement.querySelector("orc-checkbox");
    await expect(getCheckbox(field).indeterminate).toBe(true);
  },
};

export const Required: Story = {
  args: { required: true, label: "" },
  render: (args) => {
    const surface = renderCheckbox(args);
    surface
      .querySelector("orc-checkbox")
      ?.setAttribute("aria-label", "Accept terms");
    return surface;
  },
  play: async ({ canvasElement }) => {
    const field = canvasElement.querySelector("orc-checkbox");
    const input = getCheckbox(field);
    await expect(input).toBeRequired();
    await expect(input).toHaveAccessibleName("Accept terms");
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    const field = canvasElement.querySelector("orc-checkbox");
    await expect(getCheckbox(field)).toBeDisabled();
  },
};

export const Focused: Story = {
  play: async ({ canvasElement }) => {
    const field = canvasElement.querySelector("orc-checkbox");
    const input = getCheckbox(field);

    input.focus();
    // Focus inside a shadow tree retargets `document.activeElement` to the
    // host; the input itself is reachable via the shadow root instead.
    await expect(field).toHaveFocus();
    await expect(field?.shadowRoot?.activeElement).toBe(input);
    await expect(getComputedStyle(input).outlineStyle).not.toBe("none");
  },
};
