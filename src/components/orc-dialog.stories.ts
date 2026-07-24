import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { expect, userEvent, waitFor } from "storybook/test";

import { defineOrcElements } from "../define";
import type { OrcDialog } from "./orc-dialog";

defineOrcElements();

interface DialogArgs {
  heading: string;
  body: string;
  noLightDismiss: boolean;
}

function getDialog(host: Element | null | undefined): OrcDialog {
  const dialog = host?.querySelector<OrcDialog>("orc-dialog");
  if (!dialog) throw new Error("Expected an orc-dialog to be rendered.");
  return dialog;
}

function createStory(args: DialogArgs): HTMLElement {
  const surface = document.createElement("div");
  surface.className = "story-surface story-stack";

  const dialog = document.createElement("orc-dialog") as OrcDialog;
  dialog.setAttribute("heading", args.heading);
  if (args.noLightDismiss) dialog.setAttribute("no-light-dismiss", "");

  const body = document.createElement("p");
  body.textContent = args.body;
  dialog.append(body);

  const cancelButton = document.createElement("orc-button");
  cancelButton.setAttribute("variant", "ghost");
  cancelButton.slot = "footer";
  cancelButton.textContent = "Cancel";
  cancelButton.addEventListener("click", () => dialog.close("cancel"));

  const confirmButton = document.createElement("orc-button");
  confirmButton.slot = "footer";
  confirmButton.textContent = "Confirm";
  confirmButton.addEventListener("click", () => dialog.close("confirm"));

  dialog.append(cancelButton, confirmButton);

  const trigger = document.createElement("orc-button");
  trigger.dataset.story = "trigger";
  trigger.textContent = "Open dialog";
  trigger.addEventListener("click", () => dialog.show());

  surface.append(trigger, dialog);
  return surface;
}

const meta = {
  title: "Components/Dialog",
  component: "orc-dialog",
  tags: ["autodocs", "test"],
  args: {
    heading: "Run history",
    body: "This is the dialog body content, slotted into the default slot.",
    noLightDismiss: false,
  },
  argTypes: {
    heading: { control: "text" },
    body: { control: "text" },
    noLightDismiss: { control: "boolean" },
  },
  render: (args) => createStory(args),
} satisfies Meta<DialogArgs>;

export default meta;
type Story = StoryObj<DialogArgs>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const dialog = getDialog(canvasElement);
    const trigger = canvasElement.querySelector<HTMLElement>('[data-story="trigger"]');
    if (!trigger) throw new Error("Expected a trigger button.");

    await expect(dialog.hasAttribute("open")).toBe(false);

    await userEvent.click(trigger);
    await waitFor(() => expect(dialog.hasAttribute("open")).toBe(true));

    const heading = dialog.shadowRoot?.querySelector("h2");
    await expect(heading).toHaveTextContent("Run history");

    // Esc-to-close is real <dialog> UA behavior wired up for free by
    // showModal() (see orc-dialog.test.ts, which dispatches a native
    // "cancel" event directly). Synthetic keyboard events from userEvent
    // are not always treated as trusted by the browser's own dialog
    // close-watcher, so this story exercises the close path via the
    // dialog's own close() call — the same call the Esc key ultimately
    // triggers.
    dialog.close();
    await waitFor(() => expect(dialog.hasAttribute("open")).toBe(false));
  },
};

export const CloseButton: Story = {
  play: async ({ canvasElement }) => {
    const dialog = getDialog(canvasElement);
    const trigger = canvasElement.querySelector<HTMLElement>('[data-story="trigger"]');
    if (!trigger) throw new Error("Expected a trigger button.");

    await userEvent.click(trigger);
    await waitFor(() => expect(dialog.hasAttribute("open")).toBe(true));

    const closeButton = dialog.shadowRoot?.querySelector<HTMLButtonElement>("button.close");
    if (!closeButton) throw new Error("Expected an accessible close button.");
    await expect(closeButton).toHaveAccessibleName("Close");

    await userEvent.click(closeButton);
    await waitFor(() => expect(dialog.hasAttribute("open")).toBe(false));
  },
};

export const FooterActions: Story = {
  play: async ({ canvasElement }) => {
    const dialog = getDialog(canvasElement);
    const trigger = canvasElement.querySelector<HTMLElement>('[data-story="trigger"]');
    if (!trigger) throw new Error("Expected a trigger button.");

    await userEvent.click(trigger);
    await waitFor(() => expect(dialog.hasAttribute("open")).toBe(true));

    const footer = dialog.shadowRoot?.querySelector("footer");
    await expect(footer).not.toHaveAttribute("hidden");

    const confirmButton = [...dialog.querySelectorAll<HTMLElement>('[slot="footer"]')].find(
      (button) => button.textContent === "Confirm",
    );
    if (!confirmButton) throw new Error("Expected a slotted Confirm button.");

    let closeReturnValue: string | undefined;
    dialog.addEventListener("close", () => {
      closeReturnValue = dialog.shadowRoot?.querySelector("dialog")?.returnValue;
    });

    await userEvent.click(confirmButton);
    await waitFor(() => expect(dialog.hasAttribute("open")).toBe(false));
    await expect(closeReturnValue).toBe("confirm");
  },
};

export const NoLightDismiss: Story = {
  args: {
    noLightDismiss: true,
  },
  play: async ({ canvasElement }) => {
    const dialog = getDialog(canvasElement);
    const trigger = canvasElement.querySelector<HTMLElement>('[data-story="trigger"]');
    if (!trigger) throw new Error("Expected a trigger button.");

    await userEvent.click(trigger);
    await waitFor(() => expect(dialog.hasAttribute("open")).toBe(true));

    const nativeDialog = dialog.shadowRoot?.querySelector("dialog");
    nativeDialog?.click();

    await expect(dialog.hasAttribute("open")).toBe(true);

    const closeButton = dialog.shadowRoot?.querySelector<HTMLButtonElement>("button.close");
    await userEvent.click(closeButton as HTMLButtonElement);
    await waitFor(() => expect(dialog.hasAttribute("open")).toBe(false));
  },
};
