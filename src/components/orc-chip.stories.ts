import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { expect } from "storybook/test";

import { OrcChip } from "./orc-chip";
import { OrcStatusDot } from "./orc-status-dot";

if (!customElements.get("orc-chip")) {
  customElements.define("orc-chip", OrcChip);
}
if (!customElements.get("orc-status-dot")) {
  customElements.define("orc-status-dot", OrcStatusDot);
}

const VARIANTS = [
  "neutral",
  "green",
  "yellow",
  "red",
  "purple",
  "cyan",
  "orange",
  "accent",
] as const;

function createChip(
  variant: (typeof VARIANTS)[number],
  label: string,
  withDot = false,
): HTMLElement {
  const chip = document.createElement("orc-chip");
  chip.setAttribute("variant", variant);
  if (withDot) chip.setAttribute("dot", "");
  chip.textContent = label;
  return chip;
}

function createStatusDot(
  tone: "accent" | "muted" | "red" | "green" | "yellow",
  label: string,
  pulse = false,
): HTMLElement {
  const dot = document.createElement("orc-status-dot");
  dot.setAttribute("tone", tone);
  dot.setAttribute("label", label);
  if (pulse) dot.setAttribute("pulse", "");
  return dot;
}

const meta = {
  title: "Components/Chip",
  component: "orc-chip",
  tags: ["autodocs", "test"],
  render: () => {
    const wrap = document.createElement("div");
    wrap.className = "story-surface story-stack";
    wrap.style.display = "flex";
    wrap.style.flexWrap = "wrap";
    wrap.style.alignItems = "flex-start";
    wrap.style.gap = "8px";

    wrap.append(
      createChip("neutral", "Neutral"),
      createChip("green", "Done", true),
      createChip("yellow", "Stale", true),
      createChip("red", "Escalated", true),
      createChip("purple", "Merged", true),
      createChip("cyan", "Review", true),
      createChip("orange", "Gate", true),
      createChip("accent", "Working", true),
    );

    return wrap;
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const AllVariants: Story = {
  play: async ({ canvasElement }) => {
    const chips = [...canvasElement.querySelectorAll("orc-chip")];
    await expect(chips).toHaveLength(8);
    await expect(chips[0]?.getAttribute("variant")).toBe("neutral");
  },
};

export const WithLeadingDot: Story = {
  render: () => {
    const wrap = document.createElement("div");
    wrap.className = "story-surface story-stack";
    wrap.append(createChip("green", "Done", true));
    return wrap;
  },
  play: async ({ canvasElement }) => {
    const chip = canvasElement.querySelector("orc-chip");
    const dot = chip?.shadowRoot?.querySelector<HTMLElement>(".dot");
    await expect(dot?.hidden).toBe(false);
  },
};

export const NeutralFallback: Story = {
  render: () => {
    const wrap = document.createElement("div");
    wrap.className = "story-surface story-stack";
    const chip = document.createElement("orc-chip");
    chip.textContent = "Untagged";
    wrap.append(chip);
    return wrap;
  },
  play: async ({ canvasElement }) => {
    const chip = canvasElement.querySelector("orc-chip");
    await expect(chip?.getAttribute("variant")).toBe("neutral");
  },
};

export const StatusDots: Story = {
  render: () => {
    const wrap = document.createElement("div");
    wrap.className = "story-surface story-stack";
    wrap.style.display = "flex";
    wrap.style.flexDirection = "column";
    wrap.style.gap = "8px";

    wrap.append(
      createStatusDot("accent", "Working"),
      createStatusDot("green", "Done"),
      createStatusDot("yellow", "Paused"),
      createStatusDot("red", "Escalated"),
      createStatusDot("muted", "Idle"),
    );

    return wrap;
  },
};

export const StatusDotPulsing: Story = {
  render: () => {
    const wrap = document.createElement("div");
    wrap.className = "story-surface story-stack";
    wrap.append(createStatusDot("accent", "Live activity", true));
    return wrap;
  },
  play: async ({ canvasElement }) => {
    const dot = canvasElement.querySelector("orc-status-dot");
    await expect(dot?.hasAttribute("pulse")).toBe(true);
    const label = dot?.shadowRoot?.querySelector(".sr-only");
    await expect(label?.textContent).toBe("Live activity");
  },
};
