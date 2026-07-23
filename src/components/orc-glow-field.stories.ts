import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { expect } from "storybook/test";

import { defineOrcElements } from "../define";

defineOrcElements();

interface GlowFieldArgs {
  placeholder: string;
  label: string;
  disabled: boolean;
  footer: string;
}

function renderField(args: GlowFieldArgs): HTMLElement {
  const surface = document.createElement("div");
  surface.className = "story-surface story-stack";
  const field = document.createElement("orc-glow-field");
  field.setAttribute("placeholder", args.placeholder);
  field.setAttribute("label", args.label);
  if (args.disabled) field.setAttribute("disabled", "");
  if (args.footer) {
    const hint = document.createElement("span");
    hint.slot = "footer";
    hint.textContent = args.footer;
    field.append(hint);
  }
  surface.append(field);
  return surface;
}

function getTextarea(
  field: Element | null | undefined,
): HTMLTextAreaElement {
  const textarea =
    field?.shadowRoot?.querySelector<HTMLTextAreaElement>("textarea");
  if (!textarea) {
    throw new Error("Expected orc-glow-field to expose a native textarea.");
  }
  return textarea;
}

const meta = {
  title: "Components/Glow Field",
  component: "orc-glow-field",
  tags: ["autodocs", "test"],
  args: {
    placeholder: "Describe the task…",
    label: "Task prompt",
    disabled: false,
    footer: "Shift+Enter for a new line",
  },
  argTypes: {
    placeholder: { control: "text" },
    label: { control: "text" },
    disabled: { control: "boolean" },
    footer: { control: "text" },
  },
  render: (args) => renderField(args),
} satisfies Meta<GlowFieldArgs>;

export default meta;
type Story = StoryObj<GlowFieldArgs>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const field = canvasElement.querySelector("orc-glow-field");
    const textarea = getTextarea(field);
    await expect(textarea).toBeEnabled();
    await expect(textarea).toHaveAccessibleName("Task prompt");
    textarea.focus();
    const wrapper = field!.shadowRoot!.querySelector(".field")!;
    await expect(getComputedStyle(wrapper).outlineStyle).toBe("solid");
  },
};

export const WithoutFooter: Story = {
  args: { footer: "" },
  play: async ({ canvasElement }) => {
    const field = canvasElement.querySelector("orc-glow-field");
    const footer = field?.shadowRoot?.querySelector("footer");
    await expect(footer?.hidden).toBe(true);
  },
};

export const SuppressedFocusRing: Story = {
  render: (args) => {
    const surface = renderField(args);
    surface
      .querySelector("orc-glow-field")
      ?.setAttribute("suppress-focus-ring", "");
    return surface;
  },
  play: async ({ canvasElement }) => {
    const field = canvasElement.querySelector("orc-glow-field");
    const textarea = getTextarea(field);
    textarea.focus();
    const wrapper = field!.shadowRoot!.querySelector(".field")!;
    await expect(getComputedStyle(wrapper).outlineStyle).toBe("none");
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    const field = canvasElement.querySelector("orc-glow-field");
    await expect(getTextarea(field)).toBeDisabled();
  },
};
