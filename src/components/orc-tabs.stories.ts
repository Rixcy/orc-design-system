import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { expect, userEvent, waitFor } from "storybook/test";

import { OrcTabs } from "./orc-tabs";

// This component is intentionally not registered by `defineOrcElements()`
// yet, so it defines and guards its own custom element here.
if (!customElements.get("orc-tabs")) {
  customElements.define("orc-tabs", OrcTabs);
}

interface TabsArgs {
  selected: string;
}

/**
 * Content API: mark direct children with `data-tab="Label"`. Each marked
 * child becomes a tab panel and its `data-tab` value becomes the tab label.
 *
 * ```html
 * <orc-tabs selected="0">
 *   <div data-tab="Overview">Overview content</div>
 *   <div data-tab="Details">Details content</div>
 *   <div data-tab="Settings">Settings content</div>
 * </orc-tabs>
 * ```
 */
function renderTabs(args: TabsArgs): HTMLElement {
  const surface = document.createElement("div");
  surface.className = "story-surface story-stack";

  const tabs = document.createElement("orc-tabs");
  if (args.selected) tabs.setAttribute("selected", args.selected);

  const overview = document.createElement("div");
  overview.setAttribute("data-tab", "Overview");
  overview.textContent =
    "The overview panel summarizes the component at a glance.";

  const details = document.createElement("div");
  details.setAttribute("data-tab", "Details");
  details.textContent =
    "The details panel goes deeper into behavior and edge cases.";

  const settings = document.createElement("div");
  settings.setAttribute("data-tab", "Settings");
  settings.textContent = "The settings panel lists configurable options.";

  tabs.append(overview, details, settings);
  surface.append(tabs);
  return surface;
}

const meta = {
  title: "Components/Tabs",
  component: "orc-tabs",
  tags: ["autodocs", "test"],
  args: {
    selected: "0",
  },
  argTypes: {
    selected: { control: "text" },
  },
  render: (args) => renderTabs(args),
} satisfies Meta<TabsArgs>;

export default meta;
type Story = StoryObj<TabsArgs>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("orc-tabs");
    const tabs = [
      ...(host?.shadowRoot?.querySelectorAll<HTMLButtonElement>(
        '[role="tab"]',
      ) ?? []),
    ];
    await expect(tabs).toHaveLength(3);
    await expect(tabs[0]).toHaveAttribute("aria-selected", "true");
  },
};

export const Focused: Story = {
  globals: { theme: "light" },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("orc-tabs")!;
    const shadow = host.shadowRoot!;
    const tabs = [
      ...shadow.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
    ];
    const selectedRectBeforeFocus = tabs[0].getBoundingClientRect();

    tabs[0].focus();
    await expect(tabs[0].getBoundingClientRect().width).toBe(
      selectedRectBeforeFocus.width,
    );
    await expect(tabs[0].getBoundingClientRect().height).toBe(
      selectedRectBeforeFocus.height,
    );

    await userEvent.keyboard("{ArrowRight}");
    await expect(shadow.activeElement).toBe(tabs[1]);
    await expect(tabs[1]).toHaveAttribute("aria-selected", "true");

    const selectedPanel = shadow.querySelector<HTMLElement>(
      '#orc-tab-panel-1',
    )!;
    selectedPanel.focus();
    const selectedRectWithoutFocus = tabs[1].getBoundingClientRect();
    tabs[1].focus();

    await expect(tabs[1].matches(":focus-visible")).toBe(true);
    const focusedStyle = getComputedStyle(tabs[1]);
    await expect(focusedStyle.outlineStyle).toBe("none");
    await expect(focusedStyle.boxShadow).toBe("none");
    await expect(focusedStyle.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
    await expect(tabs[1].getBoundingClientRect().width).toBe(
      selectedRectWithoutFocus.width,
    );
    await expect(tabs[1].getBoundingClientRect().height).toBe(
      selectedRectWithoutFocus.height,
    );
    await expect(focusedStyle.borderBottomWidth).toBe("2px");

    tabs[2].focus();
    await expect(shadow.activeElement).toBe(tabs[2]);
    await expect(tabs[2]).toHaveAttribute("aria-selected", "false");
    await expect(tabs[2].matches(":focus-visible")).toBe(true);
    const unselectedFocusedStyle = getComputedStyle(tabs[2]);
    await expect(unselectedFocusedStyle.outlineStyle).toBe("none");
    await expect(unselectedFocusedStyle.boxShadow).toBe("none");
    await expect(unselectedFocusedStyle.backgroundColor).not.toBe(
      "rgba(0, 0, 0, 0)",
    );
    await expect(tabs[1]).toHaveAttribute("tabindex", "0");
    await expect(tabs[2]).toHaveAttribute("tabindex", "-1");
  },
};

export const FocusedDark: Story = {
  globals: { theme: "dark" },
  play: Focused.play,
};

export const ClickAndKeyboardNavigation: Story = {
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("orc-tabs");
    const shadow = host?.shadowRoot;
    const tabs = () => [
      ...(shadow?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? []),
    ];

    // Click the second tab.
    await userEvent.click(tabs()[1]);
    await waitFor(() =>
      expect(tabs()[1]).toHaveAttribute("aria-selected", "true"),
    );
    await expect(tabs()[0]).toHaveAttribute("aria-selected", "false");
    await expect(host).toHaveAttribute("selected", "1");

    // ArrowRight moves selection (and focus) to the third tab.
    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() =>
      expect(tabs()[2]).toHaveAttribute("aria-selected", "true"),
    );
    await expect(shadow?.activeElement).toBe(tabs()[2]);
  },
};
