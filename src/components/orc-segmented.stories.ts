import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { expect, userEvent, waitFor } from "storybook/test";

import { OrcSegmented } from "./orc-segmented";

if (!customElements.get("orc-segmented")) {
  customElements.define("orc-segmented", OrcSegmented);
}

interface SegmentedArgs {
  value: string;
}

/**
 * Content API: give each direct child a `value` attribute; its text becomes the
 * segment label. Selecting a segment reflects `value` and fires `change`.
 *
 * ```html
 * <orc-segmented value="orc" label="Orc mode">
 *   <button value="orc">/orc</button>
 *   <button value="orc-quick">/orc-quick</button>
 * </orc-segmented>
 * ```
 */
function renderSegmented(
  args: SegmentedArgs,
  values: string[] = ["orc", "orc-quick"],
): HTMLElement {
  const surface = document.createElement("div");
  surface.className = "story-surface story-stack";

  const segmented = document.createElement("orc-segmented");
  segmented.setAttribute("label", "Orc mode");
  if (args.value) segmented.setAttribute("value", args.value);

  for (const value of values) {
    const option = document.createElement("button");
    option.setAttribute("value", value);
    option.textContent = `/${value}`;
    segmented.append(option);
  }

  surface.append(segmented);
  return surface;
}

const meta = {
  title: "Components/Segmented",
  component: "orc-segmented",
  tags: ["autodocs", "test"],
  args: {
    value: "orc",
  },
  argTypes: {
    value: { control: "text" },
  },
  render: (args) => renderSegmented(args),
} satisfies Meta<SegmentedArgs>;

export default meta;
type Story = StoryObj<SegmentedArgs>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("orc-segmented");
    const options = [
      ...(host?.shadowRoot?.querySelectorAll<HTMLButtonElement>(
        '[role="radio"]',
      ) ?? []),
    ];
    await expect(options).toHaveLength(2);
    await expect(options[0]).toHaveAttribute("aria-checked", "true");
  },
};

/** Three segments — the group is not limited to a two-way switch. */
export const ThreeSegments: Story = {
  args: { value: "orc-quick" },
  render: (args) =>
    renderSegmented(args, ["orc", "orc-quick", "orc-ultraquick"]),
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("orc-segmented");
    const options = [
      ...(host?.shadowRoot?.querySelectorAll<HTMLButtonElement>(
        '[role="radio"]',
      ) ?? []),
    ];
    await expect(options).toHaveLength(3);
    await expect(options[1]).toHaveAttribute("aria-checked", "true");
  },
};

export const ClickAndKeyboardNavigation: Story = {
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("orc-segmented");
    const shadow = host?.shadowRoot;
    const options = () => [
      ...(shadow?.querySelectorAll<HTMLButtonElement>('[role="radio"]') ?? []),
    ];

    await userEvent.click(options()[1]);
    await waitFor(() =>
      expect(options()[1]).toHaveAttribute("aria-checked", "true"),
    );
    await expect(host).toHaveAttribute("value", "orc-quick");

    await userEvent.keyboard("{ArrowLeft}");
    await waitFor(() =>
      expect(options()[0]).toHaveAttribute("aria-checked", "true"),
    );
    await expect(shadow?.activeElement).toBe(options()[0]);
  },
};
