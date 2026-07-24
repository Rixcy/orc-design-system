import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { expect } from "storybook/test";

import { OrcStepper } from "./orc-stepper";

if (!customElements.get("orc-stepper")) {
  customElements.define("orc-stepper", OrcStepper);
}

interface StepperArgs {
  steps: string;
  current: string;
}

function createStepper(args: StepperArgs): HTMLElement {
  const surface = document.createElement("div");
  surface.className = "story-surface";
  const stepper = document.createElement("orc-stepper");
  stepper.setAttribute("steps", args.steps);
  stepper.setAttribute("current", args.current);
  surface.append(stepper);
  return surface;
}

function getStepper(host: Element | null | undefined): Element {
  const stepper = host?.querySelector("orc-stepper");
  if (!stepper) throw new Error("Expected an orc-stepper to be rendered.");
  return stepper;
}

const meta = {
  title: "Components/Stepper",
  component: "orc-stepper",
  tags: ["autodocs", "test"],
  args: {
    steps: "plan,build,review,qa",
    current: "1",
  },
  argTypes: {
    steps: { control: "text" },
    current: { control: "text" },
  },
  render: (args) => createStepper(args),
} satisfies Meta<StepperArgs>;

export default meta;
type Story = StoryObj<StepperArgs>;

export const Complete: Story = {
  args: {
    steps: "plan,build,review,qa",
    current: "4",
  },
  play: async ({ canvasElement }) => {
    const stepper = getStepper(canvasElement);
    const items = [
      ...(stepper.shadowRoot?.querySelectorAll("li") ?? []),
    ] as HTMLLIElement[];

    await expect(items).toHaveLength(4);
    for (const item of items) {
      await expect(item).not.toHaveAttribute("aria-current");
      await expect(item.querySelector(".step")).toHaveClass("done");
    }
  },
};

export const NotStarted: Story = {
  args: {
    steps: "plan,build,review,qa",
    current: "",
  },
  play: async ({ canvasElement }) => {
    const stepper = getStepper(canvasElement);
    const items = [
      ...(stepper.shadowRoot?.querySelectorAll("li") ?? []),
    ] as HTMLLIElement[];

    for (const item of items) {
      await expect(item).not.toHaveAttribute("aria-current");
      await expect(item.querySelector(".step")).toHaveClass("pending");
    }
  },
};
