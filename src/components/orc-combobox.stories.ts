import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { expect, userEvent, waitFor } from "storybook/test";

import { defineOrcElements } from "../define";
import type {
  OrcCombobox,
  OrcComboboxGroup,
  OrcComboboxOption,
} from "./orc-combobox";

defineOrcElements();

interface ComboboxArgs {
  label: string;
  placeholder: string;
}

const GROUPS: readonly OrcComboboxGroup[] = [
  {
    id: "recent",
    label: "Recent runs",
    options: [
      {
        id: "open-run",
        label: "Open run",
        description: "Open the selected run in Orc",
        keywords: ["view", "inspect"],
      },
      {
        id: "archived-run",
        label: "Open archived run",
        description: "Archived runs are unavailable from this workspace",
        disabled: true,
      },
    ],
  },
  {
    id: "actions",
    label: "Actions",
    options: [
      {
        id: "new-run",
        label: "Start a new run",
        description: "Create a run from a prompt",
      },
      {
        id: "settings",
        label: "Open workspace settings",
      },
    ],
  },
];

function renderCombobox(
  args: ComboboxArgs,
  options: readonly OrcComboboxGroup[] = GROUPS,
  state: { loading?: boolean; narrow?: boolean } = {},
): HTMLElement {
  const surface = document.createElement("div");
  surface.className = "story-surface story-stack";
  if (state.narrow) surface.dataset.width = "narrow";

  const host = document.createElement("orc-combobox") as OrcCombobox;
  host.setAttribute("label", args.label);
  host.setAttribute("placeholder", args.placeholder);
  host.options = options;
  host.loading = Boolean(state.loading);

  const output = document.createElement("p");
  output.dataset.story = "activation";
  output.setAttribute("aria-live", "polite");
  output.textContent = "No action activated";
  host.addEventListener("activate", (event) => {
    const option = (event as CustomEvent<OrcComboboxOption>).detail;
    output.textContent = `Activated: ${option.label}`;
  });

  surface.append(host, output);
  return surface;
}

function getHost(canvasElement: HTMLElement): OrcCombobox {
  const host = canvasElement.querySelector<OrcCombobox>("orc-combobox");
  if (!host) throw new Error("Expected an orc-combobox.");
  return host;
}

const meta = {
  title: "Components/Combobox",
  component: "orc-combobox",
  tags: ["autodocs", "test"],
  args: {
    label: "Run actions",
    placeholder: "Search actions",
  },
  argTypes: {
    label: { control: "text" },
    placeholder: { control: "text" },
  },
  render: (args) => renderCombobox(args),
} satisfies Meta<ComboboxArgs>;

export default meta;
type Story = StoryObj<ComboboxArgs>;

export const GroupedActions: Story = {
  play: async ({ canvasElement }) => {
    const host = getHost(canvasElement);
    const input = host.input;
    await expect(input).toHaveAttribute("role", "combobox");
    await expect(input).toHaveAccessibleName("Run actions");
    await expect(host.shadowRoot?.querySelectorAll('[role="group"]')).toHaveLength(2);
    await expect(host.shadowRoot?.querySelectorAll('[role="option"]')).toHaveLength(4);
  },
};

export const FilteredResult: Story = {
  play: async ({ canvasElement }) => {
    const host = getHost(canvasElement);
    await userEvent.type(host.input!, "inspect");
    await waitFor(() =>
      expect(host.shadowRoot?.querySelectorAll('[role="option"]')).toHaveLength(1),
    );
    await expect(host.shadowRoot?.querySelector('[role="option"]')).toHaveTextContent(
      "Open run",
    );
    await expect(host.shadowRoot?.querySelector(".status")).toHaveTextContent(
      "1 action available",
    );
  },
};

export const KeyboardActivation: Story = {
  play: async ({ canvasElement }) => {
    const host = getHost(canvasElement);
    host.input?.focus();
    await userEvent.keyboard("{ArrowDown}{Enter}");
    await expect(host.shadowRoot?.activeElement).toBe(host.input);
    await expect(canvasElement.querySelector('[data-story="activation"]')).toHaveTextContent(
      "Activated: Start a new run",
    );
  },
};

export const DisabledOption: Story = {
  play: async ({ canvasElement }) => {
    const host = getHost(canvasElement);
    const disabled = host.shadowRoot?.querySelector<HTMLElement>(
      '[data-option-id="archived-run"]',
    );
    await expect(disabled).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(disabled!);
    await expect(canvasElement.querySelector('[data-story="activation"]')).toHaveTextContent(
      "No action activated",
    );
  },
};

export const Empty: Story = {
  render: (args) => renderCombobox(args, []),
  play: async ({ canvasElement }) => {
    const host = getHost(canvasElement);
    await expect(host.input).toHaveAttribute("aria-expanded", "false");
    await expect(host.shadowRoot?.querySelector(".status")).toHaveTextContent(
      "No actions available",
    );
  },
};

export const Loading: Story = {
  render: (args) => renderCombobox(args, [], { loading: true }),
  play: async ({ canvasElement }) => {
    const host = getHost(canvasElement);
    await expect(host.shadowRoot?.querySelector('[role="listbox"]')).toHaveAttribute(
      "aria-busy",
      "true",
    );
    await expect(host.shadowRoot?.querySelector(".status")).toHaveTextContent(
      "Loading actions",
    );
  },
};

export const RuntimeUpdate: Story = {
  render: (args) => renderCombobox(args, [], { loading: true }),
  play: async ({ canvasElement }) => {
    const host = getHost(canvasElement);
    host.options = GROUPS;
    host.value = "settings";
    host.loading = false;

    await waitFor(() =>
      expect(host.shadowRoot?.querySelectorAll('[role="option"]')).toHaveLength(1),
    );
    await expect(host.shadowRoot?.querySelector('[role="option"]')).toHaveTextContent(
      "Open workspace settings",
    );
    await expect(host.input).toHaveAttribute("aria-activedescendant");
  },
};

export const NarrowLongContent: Story = {
  render: (args) =>
    renderCombobox(
      args,
      [
        {
          id: "long-actions",
          label: "Workspace actions with long names",
          options: [
            {
              id: "long-action",
              label: "Open the complete verification history for this particularly long workspace name",
              description:
                "Review every standards, specification, and test result without losing content at a narrow width.",
            },
          ],
        },
      ],
      { narrow: true },
    ),
  play: async ({ canvasElement }) => {
    const surface = canvasElement.querySelector<HTMLElement>('[data-width="narrow"]');
    const host = getHost(canvasElement);
    await expect(surface).toHaveStyle({ width: "320px" });
    await expect(host.shadowRoot?.querySelector(".option-label")).toHaveTextContent(
      "Open the complete verification history",
    );
    await expect(host.shadowRoot?.querySelector(".option-description")).toHaveTextContent(
      "Review every standards, specification, and test result",
    );
  },
};
