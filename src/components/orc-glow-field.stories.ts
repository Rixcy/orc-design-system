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
  surface.dataset.width = "composer";
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

/**
 * The composer as an app wires it: orc's new-conversation ("agents") prompt —
 * four rows, 14px text, a live status hint and the send actions in the footer.
 */
export const AgentComposer: Story = {
  args: {
    placeholder: "Describe the task…",
    label: "Prompt",
    footer: "",
  },
  render: (args) => {
    const surface = renderField(args);
    const field = surface.querySelector("orc-glow-field")!;
    field.setAttribute("rows", "4");
    field.setAttribute("description", "Enter to start, Shift+Enter for a new line");
    field.style.setProperty("--orc-glow-field-min-height", "110px");
    field.style.setProperty("--orc-glow-field-font-size", "14px");

    const status = document.createElement("span");
    status.slot = "footer";
    status.textContent = "Enter to start · Shift+Enter for a new line";

    const actions = document.createElement("span");
    actions.slot = "footer";
    actions.style.display = "flex";
    actions.style.gap = "6px";
    for (const [text, variant] of [
      ["Copy prompt", "ghost"],
      ["Start", "primary"],
    ]) {
      const button = document.createElement("orc-button");
      button.setAttribute("variant", variant);
      button.setAttribute("size", "compact");
      button.textContent = text;
      actions.append(button);
    }

    field.append(status, actions);
    return surface;
  },
  play: async ({ canvasElement }) => {
    const field = canvasElement.querySelector("orc-glow-field");
    const textarea = getTextarea(field);
    await expect(textarea.getAttribute("rows")).toBe("4");
    // The app reaches its own listeners through the public accessor, since the
    // textarea lives in the shadow root.
    await expect((field as { textarea?: HTMLTextAreaElement }).textarea).toBe(
      textarea,
    );
    const description = field!.shadowRoot!.querySelector(".description");
    await expect(textarea.getAttribute("aria-describedby")).toBe(
      description?.id,
    );
    await expect(description).toHaveTextContent("Shift+Enter for a new line");
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    const field = canvasElement.querySelector("orc-glow-field");
    await expect(getTextarea(field)).toBeDisabled();
  },
};
