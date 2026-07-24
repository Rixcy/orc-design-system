// @vitest-environment happy-dom

import { afterEach, beforeAll, describe, expect, it } from "vitest";

import { OrcDialog } from "../src/components/orc-dialog";

const supportsShowModal =
  typeof HTMLDialogElement !== "undefined" &&
  typeof HTMLDialogElement.prototype.showModal === "function";

beforeAll(() => {
  if (!customElements.get("orc-dialog")) {
    customElements.define("orc-dialog", OrcDialog);
  }
});

afterEach(() => {
  document.body.replaceChildren();
});

function createDialog(heading?: string): OrcDialog {
  const host = document.createElement("orc-dialog") as OrcDialog;
  if (heading) host.setAttribute("heading", heading);
  document.body.append(host);
  return host;
}

function getDialogEl(host: OrcDialog): HTMLDialogElement {
  const dialog = host.shadowRoot?.querySelector("dialog");
  if (!dialog) throw new Error("Expected orc-dialog to expose a native <dialog>.");
  return dialog;
}

describe("orc-dialog", () => {
  it("show() opens the dialog and reflects the open attribute", () => {
    const host = createDialog();
    const dialog = getDialogEl(host);

    expect(host.hasAttribute("open")).toBe(false);
    host.show();

    expect(host.hasAttribute("open")).toBe(true);
    if (supportsShowModal) {
      expect(dialog.open).toBe(true);
    }
  });

  it("close() closes the dialog and removes the open attribute", () => {
    const host = createDialog();
    host.show();
    host.close();

    expect(host.hasAttribute("open")).toBe(false);
    if (supportsShowModal) {
      const dialog = getDialogEl(host);
      expect(dialog.open).toBe(false);
    }
  });

  it("setting the open attribute directly opens the dialog", () => {
    const host = createDialog();
    host.setAttribute("open", "");
    const dialog = getDialogEl(host);
    if (supportsShowModal) {
      expect(dialog.open).toBe(true);
    }
  });

  it("wires the heading attribute to an <h2> referenced by aria-labelledby", () => {
    const host = createDialog("Run history");
    const dialog = getDialogEl(host);
    const heading = host.shadowRoot?.querySelector("h2");

    expect(heading?.textContent).toBe("Run history");
    expect(heading?.id).toBeTruthy();
    expect(dialog.getAttribute("aria-labelledby")).toBe(heading?.id);
  });

  it("removes aria-labelledby when there is no heading", () => {
    const host = createDialog();
    const dialog = getDialogEl(host);
    expect(dialog.hasAttribute("aria-labelledby")).toBe(false);
  });

  it("re-dispatches a composed close event when the inner dialog closes", () => {
    const host = createDialog();
    host.show();

    let closeEvent: Event | undefined;
    host.addEventListener("close", (event) => {
      closeEvent = event;
    });

    host.close("confirmed");

    expect(closeEvent).toBeDefined();
    expect(closeEvent?.composed).toBe(true);
  });

  it("re-dispatches a composed cancel event from the inner dialog", () => {
    const host = createDialog();
    host.show();
    const dialog = getDialogEl(host);

    let cancelEvent: Event | undefined;
    host.addEventListener("cancel", (event) => {
      cancelEvent = event;
    });

    dialog.dispatchEvent(new Event("cancel", { cancelable: true }));

    expect(cancelEvent).toBeDefined();
    expect(cancelEvent?.composed).toBe(true);
  });

  it("allows cancelling the host cancel event to prevent the inner dialog's default close", () => {
    const host = createDialog();
    host.show();
    const dialog = getDialogEl(host);

    host.addEventListener("cancel", (event) => event.preventDefault());

    const nativeCancel = new Event("cancel", { cancelable: true });
    dialog.dispatchEvent(nativeCancel);

    expect(nativeCancel.defaultPrevented).toBe(true);
  });

  it("the close button has an accessible name", () => {
    const host = createDialog();
    const closeButton = host.shadowRoot?.querySelector<HTMLButtonElement>("button.close");

    expect(closeButton).not.toBeNull();
    expect(closeButton?.getAttribute("aria-label")).toBe("Close");
  });

  it("closes when clicking the close button", () => {
    const host = createDialog();
    host.show();
    const closeButton = host.shadowRoot?.querySelector<HTMLButtonElement>("button.close");

    closeButton?.click();

    expect(host.hasAttribute("open")).toBe(false);
  });

  it("closes on backdrop click by default", () => {
    const host = createDialog();
    host.show();
    const dialog = getDialogEl(host);

    // A click landing on the <dialog> element itself (not its content) is a
    // backdrop click: content is nested inside, so real clicks on it target
    // a descendant instead.
    dialog.click();

    expect(host.hasAttribute("open")).toBe(false);
  });

  it("suppresses backdrop-click close when no-light-dismiss is set", () => {
    const host = createDialog();
    host.setAttribute("no-light-dismiss", "");
    host.show();
    const dialog = getDialogEl(host);

    dialog.click();

    expect(host.hasAttribute("open")).toBe(true);
  });

  it("exposes default and footer slots", () => {
    const host = createDialog();
    const slots = [...(host.shadowRoot?.querySelectorAll("slot") ?? [])];
    const names = slots.map((slot) => slot.getAttribute("name") ?? "");
    expect(names).toContain("");
    expect(names).toContain("footer");
  });
});
