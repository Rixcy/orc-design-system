import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { expect } from "storybook/test";

import { OrcCallout } from "./orc-callout";

if (!customElements.get("orc-callout")) {
  customElements.define("orc-callout", OrcCallout);
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

function createCallout(
  variant: (typeof VARIANTS)[number],
  body: string,
  heading?: string,
): HTMLElement {
  const callout = document.createElement("orc-callout");
  callout.setAttribute("variant", variant);
  if (heading) callout.setAttribute("heading", heading);
  callout.textContent = body;
  return callout;
}

const meta = {
  title: "Components/Callout",
  component: "orc-callout",
  tags: ["autodocs", "test"],
  render: () => {
    const wrap = document.createElement("div");
    wrap.className = "story-surface story-stack";
    wrap.style.display = "flex";
    wrap.style.flexDirection = "column";
    wrap.style.gap = "8px";

    wrap.append(
      createCallout("neutral", "No blockers on this run.", "Status"),
      createCallout("green", "The build finished and shipped clean.", "Done"),
      createCallout("yellow", "This run is stale and needs a refresh.", "Stale"),
      createCallout("red", "The last deploy failed and was rolled back.", "Escalated"),
      createCallout("purple", "This branch merged into main.", "Merged"),
      createCallout("cyan", "A reviewer requested changes.", "Review"),
      createCallout("orange", "Waiting on an approval gate.", "Gate"),
      createCallout("accent", "The agent is still working on this task.", "Working"),
    );

    return wrap;
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const AllVariants: Story = {
  play: async ({ canvasElement }) => {
    const callouts = [...canvasElement.querySelectorAll("orc-callout")];
    await expect(callouts).toHaveLength(8);
    await expect(callouts[0]?.getAttribute("variant")).toBe("neutral");
  },
};

export const WithHeading: Story = {
  render: () => {
    const wrap = document.createElement("div");
    wrap.className = "story-surface story-stack";
    wrap.append(
      createCallout("green", "The build finished and shipped clean.", "Done"),
    );
    return wrap;
  },
  play: async ({ canvasElement }) => {
    const callout = canvasElement.querySelector("orc-callout");
    const heading = callout?.shadowRoot?.querySelector<HTMLElement>(".heading");
    await expect(heading?.hidden).toBe(false);
    await expect(heading?.textContent).toBe("Done");
  },
};

export const WithoutHeading: Story = {
  render: () => {
    const wrap = document.createElement("div");
    wrap.className = "story-surface story-stack";
    wrap.append(createCallout("neutral", "No heading here, body content only."));
    return wrap;
  },
  play: async ({ canvasElement }) => {
    const callout = canvasElement.querySelector("orc-callout");
    const heading = callout?.shadowRoot?.querySelector<HTMLElement>(".heading");
    await expect(heading?.hidden).toBe(true);
  },
};

export const NeutralFallback: Story = {
  render: () => {
    const wrap = document.createElement("div");
    wrap.className = "story-surface story-stack";
    const callout = document.createElement("orc-callout");
    callout.textContent = "Untagged notice.";
    wrap.append(callout);
    return wrap;
  },
  play: async ({ canvasElement }) => {
    const callout = canvasElement.querySelector("orc-callout");
    await expect(callout?.getAttribute("variant")).toBe("neutral");
  },
};

export const Live: Story = {
  render: () => {
    const wrap = document.createElement("div");
    wrap.className = "story-surface story-stack";
    const callout = createCallout(
      "red",
      "This run failed and needs attention.",
      "Escalated",
    );
    callout.setAttribute("live", "");
    wrap.append(callout);
    return wrap;
  },
  play: async ({ canvasElement }) => {
    const callout = canvasElement.querySelector("orc-callout");
    const wrapper = callout?.shadowRoot?.querySelector<HTMLElement>(".callout");
    await expect(wrapper?.getAttribute("role")).toBe("status");
    await expect(wrapper?.getAttribute("aria-live")).toBe("polite");
  },
};
