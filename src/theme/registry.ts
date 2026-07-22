import type { ThemeController } from "./controller";

export const THEME_CONTROLLER_CHANGE_EVENT = "orc-theme-controller-change";

const controllers = new WeakMap<Document, ThemeController>();

export function getThemeController(document: Document): ThemeController | undefined {
  return controllers.get(document);
}

export function registerThemeController(
  document: Document,
  controller: ThemeController,
): void {
  if (controllers.has(document)) {
    throw new Error("This document already has a live theme controller.");
  }

  controllers.set(document, controller);
  dispatchControllerChange(document);
}

export function unregisterThemeController(
  document: Document,
  controller: ThemeController,
): void {
  if (controllers.get(document) !== controller) return;
  controllers.delete(document);
  dispatchControllerChange(document);
}

function dispatchControllerChange(document: Document): void {
  const EventConstructor = document.defaultView?.Event;
  if (EventConstructor) {
    document.dispatchEvent(new EventConstructor(THEME_CONTROLLER_CHANGE_EVENT));
    return;
  }

  const event = document.createEvent("Event");
  event.initEvent(THEME_CONTROLLER_CHANGE_EVENT, false, false);
  document.dispatchEvent(event);
}
