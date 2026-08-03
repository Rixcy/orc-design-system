import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { expect, userEvent } from "storybook/test";

import { defineOrcElements } from "../define";

defineOrcElements();

interface InputArgs {
  label: string;
  placeholder: string;
  type: string;
  disabled: boolean;
  size: "default" | "compact";
}

function renderInput(args: InputArgs): HTMLElement {
  const surface = document.createElement("div");
  surface.className = "story-surface story-stack";
  const field = document.createElement("orc-input");
  field.setAttribute("label", args.label);
  field.setAttribute("placeholder", args.placeholder);
  if (args.type) field.setAttribute("type", args.type);
  if (args.disabled) field.setAttribute("disabled", "");
  if (args.size === "compact") field.setAttribute("size", "compact");
  surface.append(field);
  return surface;
}

function getInput(field: Element | null | undefined): HTMLInputElement {
  const input = field?.shadowRoot?.querySelector<HTMLInputElement>("input");
  if (!input) {
    throw new Error("Expected orc-input to expose a native input.");
  }
  return input;
}

const meta = {
  title: "Components/Input",
  component: "orc-input",
  tags: ["autodocs", "test"],
  args: {
    label: "Run name",
    placeholder: "add-token-export",
    type: "text",
    disabled: false,
    size: "default",
  },
  argTypes: {
    label: { control: "text" },
    placeholder: { control: "text" },
    type: {
      control: "select",
      options: ["text", "email", "number", "password", "search", "tel", "url"],
    },
    disabled: { control: "boolean" },
    size: { control: "select", options: ["default", "compact"] },
  },
  render: (args) => renderInput(args),
} satisfies Meta<InputArgs>;

export default meta;
type Story = StoryObj<InputArgs>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const field = canvasElement.querySelector("orc-input");
    const input = getInput(field);
    await expect(input).toBeEnabled();
    await expect(input).toHaveAccessibleName("Run name");

    await userEvent.type(input, "add-token-export");
    await expect((field as HTMLElement & { value: string }).value).toBe(
      "add-token-export",
    );
  },
};

export const Search: Story = {
  args: { label: "", type: "search", placeholder: "Search runs…" },
  render: (args) => {
    const surface = renderInput(args);
    surface.querySelector("orc-input")?.setAttribute("aria-label", "Search runs");
    return surface;
  },
  play: async ({ canvasElement }) => {
    const field = canvasElement.querySelector("orc-input");
    await expect(getInput(field)).toHaveAccessibleName("Search runs");
    await expect(field?.shadowRoot?.querySelector("label")?.hidden).toBe(true);
  },
};

export const CompactSearch: Story = {
  args: {
    label: "",
    type: "search",
    placeholder: "Search runs…",
    size: "compact",
  },
  render: (args) => {
    const surface = renderInput(args);
    surface.querySelector("orc-input")?.setAttribute("aria-label", "Search runs");
    return surface;
  },
  play: async ({ canvasElement }) => {
    const field = canvasElement.querySelector("orc-input")!;
    const input = getInput(field);
    await expect(input).toHaveAccessibleName("Search runs");
    await expect(field.getBoundingClientRect().height).toBe(36);
    await expect(field.shadowRoot!.querySelector(".field")!.getBoundingClientRect().height).toBe(36);
  },
};

export const Focused: Story = {
  play: async ({ canvasElement }) => {
    // Same contract as the textarea: border-only, no outline from either path.
    const field = canvasElement.querySelector("orc-input");
    const input = getInput(field);
    const wrapper = field!.shadowRoot!.querySelector(".field")!;

    input.focus();
    await expect(getComputedStyle(wrapper).outlineStyle).toBe("none");

    await userEvent.click(input);
    await expect(getComputedStyle(wrapper).outlineStyle).toBe("none");
    await expect(getComputedStyle(input).outlineStyle).toBe("none");
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    const field = canvasElement.querySelector("orc-input");
    await expect(getInput(field)).toBeDisabled();
  },
};
