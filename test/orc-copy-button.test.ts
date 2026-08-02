// @vitest-environment happy-dom

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { OrcButton } from "../src/components/orc-button";
import { OrcCopyButton, type OrcCopyDetail } from "../src/components/orc-copy-button";
import { defineOrcElements } from "../src/define";

beforeAll(() => defineOrcElements());

let writeText: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.useFakeTimers();
  writeText = vi.fn(() => Promise.resolve());
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
});

afterEach(() => {
  vi.useRealTimers();
  document.body.replaceChildren();
});

function mount(value = "sha-1234", label = "Copy"): OrcCopyButton {
  const el = document.createElement("orc-copy-button");
  el.setAttribute("value", value);
  el.textContent = label;
  document.body.append(el);
  return el;
}

function innerButton(el: OrcCopyButton): HTMLButtonElement {
  const button = el.shadowRoot?.querySelector<HTMLButtonElement>("button");
  if (!button) throw new Error("Expected orc-copy-button to expose a native button.");
  return button;
}

// The click handler is async, so every assertion waits on the event the
// component fires once the clipboard attempt has settled and the state is set.
function click(el: OrcCopyButton): Promise<CustomEvent<OrcCopyDetail>> {
  const settled = new Promise<CustomEvent<OrcCopyDetail>>((resolve) => {
    el.addEventListener("orc-copy", (event) => resolve(event as CustomEvent<OrcCopyDetail>), {
      once: true,
    });
  });
  innerButton(el).click();
  return settled;
}

describe("orc-copy-button", () => {
  it("is an orc-button and inherits its native control", () => {
    const el = mount();
    expect(el).toBeInstanceOf(OrcButton);
    expect(innerButton(el).type).toBe("button");
  });

  it("reflects disabled onto the inherited button", () => {
    const el = mount();
    el.disabled = true;
    expect(el.hasAttribute("disabled")).toBe(true);
    expect(innerButton(el).disabled).toBe(true);
  });

  it("copies the value and shows the copied state", async () => {
    const el = mount("branch-name");
    await click(el);

    expect(writeText).toHaveBeenCalledWith("branch-name");
    expect(el.getAttribute("state")).toBe("copied");
  });

  it("shows the failed state when the clipboard rejects", async () => {
    writeText.mockRejectedValueOnce(new Error("denied"));
    const el = mount();
    await click(el);

    expect(el.getAttribute("state")).toBe("failed");
  });

  it("reverts to rest after 1200ms", async () => {
    const el = mount();
    await click(el);

    vi.advanceTimersByTime(1199);
    expect(el.getAttribute("state")).toBe("copied");

    vi.advanceTimersByTime(1);
    expect(el.hasAttribute("state")).toBe(false);
  });

  it("restarts the revert timer instead of stacking one", async () => {
    const el = mount();
    await click(el);

    vi.advanceTimersByTime(1000);
    await click(el);

    // The first click's timer would have fired here had it survived.
    vi.advanceTimersByTime(400);
    expect(el.getAttribute("state")).toBe("copied");

    vi.advanceTimersByTime(800);
    expect(el.hasAttribute("state")).toBe(false);
  });

  it("swaps the label and announces the outcome", async () => {
    const el = mount();
    const label = el.shadowRoot?.querySelector(".state-label");
    const live = el.shadowRoot?.querySelector(".live");

    expect(live?.getAttribute("role")).toBe("status");
    expect(live?.getAttribute("aria-live")).toBe("polite");

    await click(el);
    expect(label?.textContent).toBe("Copied");
    expect(live?.textContent).toBe("Copied");

    writeText.mockRejectedValueOnce(new Error("denied"));
    await click(el);
    expect(label?.textContent).toBe("Copy failed");
    expect(live?.textContent).toBe("Copy failed");
  });

  it("hides the slotted label while an outcome shows", () => {
    const el = mount();
    const css = [...(el.shadowRoot?.querySelectorAll("style") ?? [])]
      .map((style) => style.textContent ?? "")
      .join("\n");

    expect(css).toContain(":host([state]) slot");
    expect(css).toContain("display: none;");
  });

  it("pins its width for the swap and clears it on revert", async () => {
    const el = mount();
    expect(el.style.minWidth).toBe("");

    await click(el);
    expect(el.style.minWidth).not.toBe("");

    vi.advanceTimersByTime(1200);
    expect(el.style.minWidth).toBe("");
  });

  it("fires orc-copy once per attempt with the outcome and value", async () => {
    const el = mount("run-id-9");
    const seen: OrcCopyDetail[] = [];
    document.addEventListener("orc-copy", (event) => {
      seen.push((event as CustomEvent<OrcCopyDetail>).detail);
    });

    await click(el);
    expect(seen).toEqual([{ ok: true, value: "run-id-9" }]);

    writeText.mockRejectedValueOnce(new Error("denied"));
    await click(el);
    expect(seen).toEqual([
      { ok: true, value: "run-id-9" },
      { ok: false, value: "run-id-9" },
    ]);
  });

  it("does not copy while disabled", async () => {
    const el = mount();
    el.disabled = true;
    innerButton(el).click();
    await Promise.resolve();

    expect(writeText).not.toHaveBeenCalled();
    expect(el.hasAttribute("state")).toBe(false);
  });

  it("does not come back still showing an outcome after removal", async () => {
    const el = mount();
    await click(el);
    el.remove();

    expect(el.hasAttribute("state")).toBe(false);
    expect(el.style.minWidth).toBe("");
  });

  it("is registered by defineOrcElements", () => {
    expect(customElements.get("orc-copy-button")).toBe(OrcCopyButton);
  });
});
