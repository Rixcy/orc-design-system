import {
  getThemeController,
  registerThemeController,
  unregisterThemeController,
} from "./registry";

export type ThemeMode = "system" | "light" | "dark";
export type ResolvedTheme = Exclude<ThemeMode, "system">;
export type ThemeColor = string | Partial<Record<ResolvedTheme, string>>;
export type ThemeAnnouncement =
  | boolean
  | ((mode: ThemeMode, resolvedTheme: ResolvedTheme) => string);
export type ThemeSubscriber = (mode: ThemeMode, resolvedTheme: ResolvedTheme) => void;

export interface ThemeControllerOptions {
  document: Document;
  storageKey?: string;
  themeColor?: ThemeColor;
  announce?: ThemeAnnouncement;
}

export interface ThemeController {
  readonly mode: ThemeMode;
  setMode(mode: ThemeMode): void;
  cycle(): void;
  subscribe(subscriber: ThemeSubscriber): () => void;
  dispose(): void;
}

const DEFAULT_STORAGE_KEY = "orcTheme";
const MODES: readonly ThemeMode[] = ["system", "light", "dark"];

export function createThemeController(options: ThemeControllerOptions): ThemeController {
  const { document } = options;
  if (!document?.documentElement) {
    throw new TypeError("createThemeController requires a browser Document.");
  }
  if (getThemeController(document)) {
    throw new Error("This document already has a live theme controller.");
  }

  const storageKey = options.storageKey || DEFAULT_STORAGE_KEY;
  const view = document.defaultView;
  const mediaQuery = getColorSchemeQuery(view);
  const subscribers = new Set<ThemeSubscriber>();
  const root = document.documentElement;
  const originalTheme = root.getAttribute("data-theme");
  const originalColorScheme = root.style.getPropertyValue("color-scheme");
  const originalColorSchemePriority = root.style.getPropertyPriority("color-scheme");
  const metaState = createMetaState(document, options.themeColor);
  const announcer = createAnnouncer(document, options.announce);
  let disposed = false;
  let mode = readStoredMode(view, storageKey);
  let lastResolved: ResolvedTheme = resolveMode(mode, mediaQuery);

  const notify = (shouldAnnounce: boolean): void => {
    lastResolved = resolveMode(mode, mediaQuery);
    root.dataset.theme = lastResolved;
    root.style.setProperty("color-scheme", lastResolved);
    updateThemeColor(metaState, options.themeColor, lastResolved);

    if (shouldAnnounce && announcer) {
      announcer.textContent = formatAnnouncement(options.announce, mode, lastResolved);
    }

    for (const subscriber of subscribers) {
      subscriber(mode, lastResolved);
    }
  };

  const persist = (): void => {
    withStorage(view, (storage) => {
      if (mode === "system") storage.removeItem(storageKey);
      else storage.setItem(storageKey, mode);
    });
  };

  const onColorSchemeChange = (): void => {
    if (!disposed && mode === "system") notify(true);
  };

  const controller: ThemeController = {
    get mode() {
      return mode;
    },
    setMode(nextMode) {
      assertActive(disposed);
      assertMode(nextMode);
      mode = nextMode;
      persist();
      notify(true);
    },
    cycle() {
      assertActive(disposed);
      const nextIndex = (MODES.indexOf(mode) + 1) % MODES.length;
      controller.setMode(MODES[nextIndex]!);
    },
    subscribe(subscriber) {
      assertActive(disposed);
      if (typeof subscriber !== "function") {
        throw new TypeError("Theme subscriber must be a function.");
      }
      subscribers.add(subscriber);
      subscriber(mode, lastResolved);
      return () => subscribers.delete(subscriber);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      removeMediaListener(mediaQuery, onColorSchemeChange);
      subscribers.clear();
      announcer?.remove();
      restoreMeta(metaState);
      restoreAttribute(root, "data-theme", originalTheme);
      if (originalColorScheme) {
        root.style.setProperty(
          "color-scheme",
          originalColorScheme,
          originalColorSchemePriority,
        );
      } else {
        root.style.removeProperty("color-scheme");
      }
      unregisterThemeController(document, controller);
    },
  };

  notify(false);
  addMediaListener(mediaQuery, onColorSchemeChange);
  registerThemeController(document, controller);
  return controller;
}

function assertActive(disposed: boolean): void {
  if (disposed) throw new Error("Theme controller has been disposed.");
}

function assertMode(mode: string): asserts mode is ThemeMode {
  if (!MODES.includes(mode as ThemeMode)) {
    throw new TypeError(`Unsupported theme mode: ${mode}`);
  }
}

function readStoredMode(view: Window | null, storageKey: string): ThemeMode {
  let stored: string | null = null;
  withStorage(view, (storage) => {
    stored = storage.getItem(storageKey);
  });
  return stored === "light" || stored === "dark" ? stored : "system";
}

function withStorage(view: Window | null, callback: (storage: Storage) => void): void {
  try {
    if (view?.localStorage) callback(view.localStorage);
  } catch {
    // Storage may be unavailable in private contexts or blocked by policy.
  }
}

function getColorSchemeQuery(view: Window | null): MediaQueryList | undefined {
  try {
    return view?.matchMedia?.("(prefers-color-scheme: dark)");
  } catch {
    return undefined;
  }
}

function resolveMode(mode: ThemeMode, mediaQuery?: MediaQueryList): ResolvedTheme {
  if (mode !== "system") return mode;
  return mediaQuery?.matches ? "dark" : "light";
}

function addMediaListener(
  mediaQuery: MediaQueryList | undefined,
  listener: () => void,
): void {
  if (!mediaQuery) return;
  if (typeof mediaQuery.addEventListener === "function") {
    mediaQuery.addEventListener("change", listener);
  } else {
    mediaQuery.addListener(listener);
  }
}

function removeMediaListener(
  mediaQuery: MediaQueryList | undefined,
  listener: () => void,
): void {
  if (!mediaQuery) return;
  if (typeof mediaQuery.removeEventListener === "function") {
    mediaQuery.removeEventListener("change", listener);
  } else {
    mediaQuery.removeListener(listener);
  }
}

interface MetaState {
  document: Document;
  element: HTMLMetaElement | undefined;
  created: boolean;
  originalContent: string | null;
}

function createMetaState(document: Document, themeColor?: ThemeColor): MetaState {
  if (themeColor === undefined) {
    return { document, element: undefined, created: false, originalContent: null };
  }
  const existing = document.head?.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  return {
    document,
    element: existing ?? undefined,
    created: false,
    originalContent: existing?.getAttribute("content") ?? null,
  };
}

function updateThemeColor(
  state: MetaState,
  themeColor: ThemeColor | undefined,
  resolvedTheme: ResolvedTheme,
): void {
  if (themeColor === undefined) return;
  const color = typeof themeColor === "string" ? themeColor : themeColor[resolvedTheme];
  if (!color) {
    restoreMeta(state);
    return;
  }

  if (!state.element) {
    const { document } = state;
    if (!document?.head) return;
    state.element = document.createElement("meta");
    state.element.name = "theme-color";
    state.created = true;
    document.head.append(state.element);
  }
  state.element.content = color;
}

function restoreMeta(state: MetaState): void {
  if (!state.element) return;
  if (state.created) {
    state.element.remove();
    state.element = undefined;
    state.created = false;
  } else {
    restoreAttribute(state.element, "content", state.originalContent);
  }
}

function createAnnouncer(
  document: Document,
  announce: ThemeAnnouncement | undefined,
): HTMLElement | undefined {
  if (announce === false) return undefined;
  const announcer = document.createElement("span");
  announcer.dataset.orcThemeAnnouncer = "";
  announcer.setAttribute("aria-live", "polite");
  announcer.setAttribute("aria-atomic", "true");
  announcer.style.cssText =
    "position:fixed;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0";
  (document.body ?? document.documentElement).append(announcer);
  return announcer;
}

function formatAnnouncement(
  announce: ThemeAnnouncement | undefined,
  mode: ThemeMode,
  resolvedTheme: ResolvedTheme,
): string {
  if (typeof announce === "function") return announce(mode, resolvedTheme);
  const modeLabel = mode.charAt(0).toUpperCase() + mode.slice(1);
  if (mode === "system") {
    const resolvedLabel =
      resolvedTheme.charAt(0).toUpperCase() + resolvedTheme.slice(1);
    return `Theme: ${modeLabel} (${resolvedLabel})`;
  }
  return `Theme: ${modeLabel}`;
}

function restoreAttribute(element: Element, name: string, value: string | null): void {
  if (value === null) element.removeAttribute(name);
  else element.setAttribute(name, value);
}
