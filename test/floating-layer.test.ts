// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  FloatingLayerController,
  computeFloatingLayerPosition,
  type FloatingLayerDismissReason,
} from "../src/components/floating-layer";

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

function rect(
  left: number,
  top: number,
  width: number,
  height: number,
): DOMRect {
  return {
    bottom: top + height,
    height,
    left,
    right: left + width,
    top,
    width,
    x: left,
    y: top,
    toJSON: () => ({}),
  };
}

function createLayer(
  onDismiss: (reason: FloatingLayerDismissReason) => boolean | void = () => {},
  returnFocus?: (reason: FloatingLayerDismissReason) => void,
): {
  anchor: HTMLButtonElement;
  controller: FloatingLayerController;
  layer: HTMLElement;
} {
  const anchor = document.createElement("button");
  const layer = document.createElement("div");
  document.body.append(anchor, layer);
  vi.spyOn(anchor, "getBoundingClientRect").mockReturnValue(rect(90, 70, 40, 20));
  vi.spyOn(layer, "getBoundingClientRect").mockReturnValue(rect(0, 0, 80, 50));
  const controller = new FloatingLayerController({
    anchor,
    layer,
    onDismiss,
    returnFocus,
  });
  return { anchor, controller, layer };
}

describe("computeFloatingLayerPosition", () => {
  it("places below when it fits and clamps to the viewport edge", () => {
    expect(
      computeFloatingLayerPosition(
        rect(180, 20, 30, 20),
        rect(0, 0, 90, 50),
        { width: 240, height: 160 },
      ),
    ).toEqual({ left: 142, top: 44, placement: "below" });
  });

  it("moves above near the lower edge and clamps an oversized layer", () => {
    expect(
      computeFloatingLayerPosition(
        rect(-20, 120, 30, 20),
        rect(0, 0, 300, 90),
        { width: 240, height: 160 },
      ),
    ).toEqual({ left: 8, top: 26, placement: "above" });
  });
});

describe("FloatingLayerController", () => {
  it("positions on open and responds to viewport resize", () => {
    const { anchor, controller, layer } = createLayer();
    controller.open();

    expect(layer.style.left).toBe("90px");
    expect(layer.style.top).toBe("94px");
    expect(layer.dataset.placement).toBe("below");

    vi.mocked(anchor.getBoundingClientRect).mockReturnValue(rect(12, 8, 40, 20));
    window.dispatchEvent(new Event("resize"));
    expect(layer.style.left).toBe("12px");
    expect(layer.style.top).toBe("32px");
    controller.destroy();
  });

  it("keeps inside pointer and scroll interactions open", () => {
    const dismiss = vi.fn();
    const { controller, layer } = createLayer(dismiss);
    controller.open();

    layer.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true }));
    layer.dispatchEvent(new Event("scroll", { bubbles: false, composed: true }));

    expect(dismiss).not.toHaveBeenCalled();
    expect(controller.isOpen).toBe(true);
    controller.destroy();
  });

  it.each([
    ["outside-pointer", () => window.dispatchEvent(new PointerEvent("pointerdown"))],
    ["scroll", () => window.dispatchEvent(new Event("scroll"))],
  ] as const)("dismisses for %s and removes listeners", (reason, dispatch) => {
    const dismiss = vi.fn();
    const { controller } = createLayer(dismiss);
    controller.open();
    dispatch();

    expect(dismiss).toHaveBeenCalledWith(reason);
    expect(controller.isOpen).toBe(false);

    dispatch();
    expect(dismiss).toHaveBeenCalledTimes(1);
  });

  it("runs the focus-return hook after Escape dismissal", () => {
    const order: string[] = [];
    const { controller } = createLayer(
      (reason) => {
        order.push(`dismiss:${reason}`);
      },
      (reason) => order.push(`focus:${reason}`),
    );
    controller.open();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

    expect(order).toEqual(["dismiss:escape", "focus:escape"]);
    expect(controller.isOpen).toBe(false);
  });

  it("keeps listeners active when dismissal is cancelled", () => {
    const dismiss = vi.fn(() => false);
    const { controller } = createLayer(dismiss);
    controller.open();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

    expect(controller.isOpen).toBe(true);
    window.dispatchEvent(new PointerEvent("pointerdown"));
    expect(dismiss).toHaveBeenCalledTimes(2);
    controller.destroy();
  });

  it("cleans up when destroyed or disconnected", () => {
    const dismiss = vi.fn();
    const { controller, layer } = createLayer(dismiss);
    controller.open();
    layer.remove();
    controller.update();

    expect(controller.isOpen).toBe(false);
    window.dispatchEvent(new PointerEvent("pointerdown"));
    expect(dismiss).not.toHaveBeenCalled();
  });
});
