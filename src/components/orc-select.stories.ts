import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { expect, userEvent, waitFor } from "storybook/test";

import { OrcSelect } from "./orc-select";

if (!customElements.get("orc-select")) {
  customElements.define("orc-select", OrcSelect);
}

interface SelectArgs {
  label: string;
  searchable: boolean;
  disableSearch: boolean;
  multiple: boolean;
  disabled: boolean;
}

const FRUIT = ["Apple", "Banana", "Cherry", "Date", "Elderberry"];

/**
 * Content API: give light-DOM `<option>` children, exactly like a native
 * `<select>`. They're mirrored into a shadow-root `<select>`, which is the
 * real value holder.
 *
 * ```html
 * <orc-select label="Fruit">
 *   <option value="apple">Apple</option>
 *   <option value="banana" selected>Banana</option>
 * </orc-select>
 * ```
 */
function renderSelect(
  args: SelectArgs,
  options: string[] = FRUIT,
  selected: string[] = [],
): HTMLElement {
  const surface = document.createElement("div");
  surface.className = "story-surface story-stack";

  const select = document.createElement("orc-select");
  select.setAttribute("label", args.label);
  if (args.searchable) select.setAttribute("searchable", "");
  if (args.disableSearch) select.setAttribute("disable-search", "");
  if (args.multiple) select.setAttribute("multiple", "");
  if (args.disabled) select.setAttribute("disabled", "");

  for (const value of options) {
    const option = document.createElement("option");
    option.value = value.toLowerCase();
    option.textContent = value;
    if (selected.includes(value)) option.selected = true;
    select.append(option);
  }

  surface.append(select);
  return surface;
}

function getTrigger(host: Element | null | undefined): HTMLButtonElement {
  const trigger = host?.shadowRoot?.querySelector<HTMLButtonElement>(".trigger");
  if (!trigger) throw new Error("Expected orc-select to expose a trigger button.");
  return trigger;
}

const meta = {
  title: "Components/Select",
  component: "orc-select",
  tags: ["autodocs", "test"],
  args: {
    label: "Fruit",
    searchable: false,
    disableSearch: false,
    multiple: false,
    disabled: false,
  },
  argTypes: {
    label: { control: "text" },
    searchable: { control: "boolean" },
    disableSearch: { control: "boolean" },
    multiple: { control: "boolean" },
    disabled: { control: "boolean" },
  },
  render: (args) => renderSelect(args, FRUIT, ["Banana"]),
} satisfies Meta<SelectArgs>;

export default meta;
type Story = StoryObj<SelectArgs>;

export const Closed: Story = {
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("orc-select");
    const trigger = getTrigger(host);
    await expect(trigger).toHaveAccessibleName("Fruit Banana");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  },
};

export const Open: Story = {
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("orc-select");
    const trigger = getTrigger(host);
    await userEvent.click(trigger);
    await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "true"));
    const listbox = host?.shadowRoot?.querySelector('[role="listbox"]');
    await expect(listbox).not.toBeNull();
    await expect(listbox as HTMLElement).toHaveAccessibleName("Fruit");
  },
};

export const Searchable: Story = {
  args: { searchable: true },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("orc-select");
    const trigger = getTrigger(host);
    await userEvent.click(trigger);
    const search = host?.shadowRoot?.querySelector<HTMLInputElement>(".search");
    await waitFor(() => expect(host?.shadowRoot?.activeElement).toBe(search));

    await userEvent.type(search!, "berr");
    await waitFor(() => {
      const visible = [
        ...(host?.shadowRoot?.querySelectorAll<HTMLElement>(".option") ?? []),
      ].filter((option) => !option.hidden);
      expect(visible.map((option) => option.textContent)).toEqual(["Elderberry"]);
    });
  },
};

export const SearchDisabled: Story = {
  args: { searchable: true, disableSearch: true },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("orc-select");
    const trigger = getTrigger(host);
    await userEvent.click(trigger);

    const search = host?.shadowRoot?.querySelector<HTMLInputElement>(".search");
    const selected = host?.shadowRoot?.querySelector<HTMLElement>(
      '.option[aria-selected="true"]',
    );
    await expect(search).not.toBeNull();
    await expect(search).not.toBeVisible();
    await waitFor(() => expect(host?.shadowRoot?.activeElement).toBe(selected));
    await userEvent.keyboard("{Escape}");
  },
};

export const NoMatches: Story = {
  args: { searchable: true },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("orc-select");
    const trigger = getTrigger(host);
    await userEvent.click(trigger);
    const search = host?.shadowRoot?.querySelector<HTMLInputElement>(".search");
    await userEvent.type(search!, "zzz");

    const empty = host?.shadowRoot?.querySelector(".empty");
    await waitFor(() => expect(empty).toHaveTextContent("No matches"));
    await expect(empty).toBeVisible();
  },
};

export const NoOptions: Story = {
  render: (args) => renderSelect(args, []),
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("orc-select");
    const trigger = getTrigger(host);
    await userEvent.click(trigger);

    const empty = host?.shadowRoot?.querySelector(".empty");
    await waitFor(() => expect(empty).toHaveTextContent("No options available"));
    await expect(empty).toBeVisible();
  },
};

export const Loading: Story = {
  render: (args) => renderSelect(args, []),
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("orc-select") as OrcSelect;
    host.setCustomSelectStatus("Loading…", true);

    const trigger = getTrigger(host);
    await userEvent.click(trigger);

    const listbox = host.shadowRoot?.querySelector(".listbox");
    const empty = host.shadowRoot?.querySelector(".empty");
    await expect(listbox).toHaveAttribute("aria-busy", "true");
    await expect(empty).toHaveTextContent("Loading…");
  },
};

export const StableHeightAcrossAsyncContent: Story = {
  render: (args) => renderSelect(args, []),
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("orc-select") as OrcSelect;
    const trigger = getTrigger(host);
    await document.fonts.ready;

    const emptyHeight = trigger.getBoundingClientRect().height;
    await expect(trigger).toHaveAccessibleName("Fruit");

    host.setCustomSelectStatus("Loading…", true);
    const loadingHeight = trigger.getBoundingClientRect().height;

    const option = document.createElement("option");
    option.value = "banana";
    option.textContent = "Banana";
    option.selected = true;
    host.append(option);
    host.setCustomSelectStatus();
    host.syncCustomSelect();

    await expect(trigger).toHaveAccessibleName("Fruit Banana");
    const contentHeight = trigger.getBoundingClientRect().height;
    expect(loadingHeight).toBe(emptyHeight);
    expect(contentHeight).toBe(emptyHeight);
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("orc-select");
    await expect(getTrigger(host)).toBeDisabled();
  },
};

export const MultiSelect: Story = {
  args: { multiple: true },
  render: (args) => renderSelect(args, FRUIT, ["Banana", "Cherry"]),
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("orc-select");
    const trigger = getTrigger(host);
    await expect(trigger).toHaveTextContent("Banana, Cherry");

    await userEvent.click(trigger);
    const listbox = host?.shadowRoot?.querySelector('[role="listbox"]');
    await expect(listbox).toHaveAttribute("aria-multiselectable", "true");

    const apple = [
      ...(host?.shadowRoot?.querySelectorAll<HTMLElement>(".option") ?? []),
    ].find((option) => option.textContent?.includes("Apple"));
    await userEvent.click(apple!);
    await waitFor(() => expect(trigger).toHaveTextContent("Apple, Banana, Cherry"));
    // multi-select stays open after a pick
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
  },
};
