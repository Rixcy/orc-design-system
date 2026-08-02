export type FloatingLayerDismissReason =
  | "escape"
  | "outside-pointer"
  | "scroll";

export interface FloatingLayerPosition {
  left: number;
  top: number;
  placement: "above" | "below";
}

export interface FloatingLayerViewport {
  width: number;
  height: number;
}

export interface FloatingLayerOptions {
  anchor: HTMLElement;
  layer: HTMLElement;
  gap?: number;
  padding?: number;
  onDismiss: (reason: FloatingLayerDismissReason) => boolean | void;
  returnFocus?: (reason: FloatingLayerDismissReason) => void;
}

export function computeFloatingLayerPosition(
  anchor: Pick<DOMRect, "bottom" | "left" | "top">,
  layer: Pick<DOMRect, "height" | "width">,
  viewport: FloatingLayerViewport,
  gap = 4,
  padding = 8,
): FloatingLayerPosition {
  const maxLeft = Math.max(padding, viewport.width - layer.width - padding);
  const left = Math.max(padding, Math.min(anchor.left, maxLeft));
  const belowTop = anchor.bottom + gap;
  const aboveTop = anchor.top - gap - layer.height;
  const belowSpace = viewport.height - padding - belowTop;
  const aboveSpace = anchor.top - gap - padding;
  const placement =
    layer.height <= belowSpace || belowSpace >= aboveSpace ? "below" : "above";
  const desiredTop = placement === "below" ? belowTop : aboveTop;
  const maxTop = Math.max(padding, viewport.height - layer.height - padding);
  const top = Math.max(padding, Math.min(desiredTop, maxTop));

  return { left, top, placement };
}

export class FloatingLayerController {
  private active = false;
  private readonly view: Window;

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (!this.eventIsWithinManagedElements(event)) {
      this.dismiss("outside-pointer");
    }
  };

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== "Escape" || event.defaultPrevented) return;
    event.preventDefault();
    this.dismiss("escape");
  };

  private readonly onScroll = (event: Event): void => {
    if (!this.eventIsWithin(this.options.layer, event)) this.dismiss("scroll");
  };

  private readonly onViewportChange = (): void => this.update();

  constructor(private readonly options: FloatingLayerOptions) {
    const view = options.layer.ownerDocument.defaultView;
    if (!view) throw new Error("A floating layer requires a window-backed document.");
    this.view = view;
  }

  get isOpen(): boolean {
    return this.active;
  }

  open(): void {
    if (this.active) {
      this.update();
      return;
    }

    this.active = true;
    this.view.addEventListener("pointerdown", this.onPointerDown, true);
    this.view.addEventListener("keydown", this.onKeyDown, true);
    this.view.addEventListener("scroll", this.onScroll, true);
    this.view.addEventListener("resize", this.onViewportChange);
    this.view.visualViewport?.addEventListener("resize", this.onViewportChange);
    this.view.visualViewport?.addEventListener("scroll", this.onViewportChange);
    this.update();
  }

  update(): void {
    if (!this.active || !this.options.anchor.isConnected || !this.options.layer.isConnected) {
      if (this.active) this.close();
      return;
    }

    const anchorRect = this.options.anchor.getBoundingClientRect();
    const layerRect = this.options.layer.getBoundingClientRect();
    const position = computeFloatingLayerPosition(
      anchorRect,
      layerRect,
      { width: this.view.innerWidth, height: this.view.innerHeight },
      this.options.gap,
      this.options.padding,
    );
    this.options.layer.style.left = `${position.left}px`;
    this.options.layer.style.top = `${position.top}px`;
    this.options.layer.dataset.placement = position.placement;
  }

  close(): void {
    if (!this.active) return;
    this.active = false;
    this.view.removeEventListener("pointerdown", this.onPointerDown, true);
    this.view.removeEventListener("keydown", this.onKeyDown, true);
    this.view.removeEventListener("scroll", this.onScroll, true);
    this.view.removeEventListener("resize", this.onViewportChange);
    this.view.visualViewport?.removeEventListener("resize", this.onViewportChange);
    this.view.visualViewport?.removeEventListener("scroll", this.onViewportChange);
  }

  destroy(): void {
    this.close();
  }

  private dismiss(reason: FloatingLayerDismissReason): void {
    if (this.options.onDismiss(reason) === false) return;
    this.close();
    this.options.returnFocus?.(reason);
  }

  private eventIsWithinManagedElements(event: Event): boolean {
    return (
      this.eventIsWithin(this.options.anchor, event) ||
      this.eventIsWithin(this.options.layer, event)
    );
  }

  private eventIsWithin(element: HTMLElement, event: Event): boolean {
    return event.composedPath().includes(element);
  }
}
