import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { expect, userEvent } from "storybook/test";

import { defineOrcElements } from "../define";

defineOrcElements();

interface TextareaArgs {
  label: string;
  placeholder: string;
  disabled: boolean;
  rows: number;
  footer: string;
}

function renderTextarea(args: TextareaArgs): HTMLElement {
  const surface = document.createElement("div");
  surface.className = "story-surface story-stack";
  const field = document.createElement("orc-textarea");
  field.setAttribute("label", args.label);
  field.setAttribute("placeholder", args.placeholder);
  if (args.disabled) field.setAttribute("disabled", "");
  if (args.rows) field.setAttribute("rows", String(args.rows));
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
    footer: "",
  },
  argTypes: {
    label: { control: "text" },
    placeholder: { control: "text" },
    disabled: { control: "boolean" },
    rows: { control: "number" },
    footer: { control: "text" },
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

export const Composer: Story = {
  args: { label: "", footer: "Shift+Enter for a new line" },
  render: (args) => {
    const surface = renderTextarea(args);
    // Documented at the width it ships at — the same 640px centred column
    // orc's new-conversation composer uses.
    surface.dataset.width = "composer";
    const field = surface.querySelector("orc-textarea")!;
    field.setAttribute("aria-label", "Task prompt");
    field.setAttribute("description", "Enter to start the run");
    return surface;
  },
  play: async ({ canvasElement }) => {
    const field = canvasElement.querySelector("orc-textarea");
    await expect(getTextarea(field)).toHaveAccessibleName("Task prompt");
    await expect(field?.shadowRoot?.querySelector("label")?.hidden).toBe(true);
    await expect(field?.shadowRoot?.querySelector("footer")?.hidden).toBe(false);
  },
};

export const WithoutFooter: Story = {
  play: async ({ canvasElement }) => {
    const field = canvasElement.querySelector("orc-textarea");
    await expect(field?.shadowRoot?.querySelector("footer")?.hidden).toBe(true);
  },
};

export const Focused: Story = {
  play: async ({ canvasElement }) => {
    // Focus is border-only however you reach the field: no outline from the
    // keyboard and none from a click — on the host as much as inside it, since
    // focus retargets to the host and the UA rings whatever it lands on.
    const field = canvasElement.querySelector("orc-textarea")!;
    const textarea = getTextarea(field);
    const wrapper = field.shadowRoot!.querySelector(".field")!;

    textarea.focus();
    await expect(getComputedStyle(wrapper).outlineStyle).toBe("none");
    await expect(getComputedStyle(field).outlineStyle).toBe("none");

    // A click on a text control still matches :focus-visible, so this is the
    // path where a UA ring would appear — on the host as well as the control.
    await userEvent.click(textarea);
    await expect(textarea.matches(":focus-visible")).toBe(true);
    await expect(getComputedStyle(wrapper).outlineStyle).toBe("none");
    await expect(getComputedStyle(textarea).outlineStyle).toBe("none");
    await expect(getComputedStyle(field).outlineStyle).toBe("none");
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
