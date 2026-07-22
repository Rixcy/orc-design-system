// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createThemeController } from "../src/theme/controller";

const controllers: Array<{ dispose(): void }> = [];
let storage: Storage;

beforeEach(() => {
  storage = createMemoryStorage();
  Object.defineProperty(document.defaultView!, "localStorage", {
    configurable: true,
    value: storage,
  });
});

afterEach(() => {
  while (controllers.length > 0) controllers.pop()?.dispose();
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.style.removeProperty("color-scheme");
  document.head.replaceChildren();
  document.body.replaceChildren();
  storage.clear();
  vi.restoreAllMocks();
});

describe("createThemeController", () => {
  it("restores a saved explicit mode and synchronizes subscribers", () => {
    storage.setItem("orcTheme", "dark");
    const controller = createThemeController({ document, announce: false });
    controllers.push(controller);
    const listener = vi.fn();

    const unsubscribe = controller.subscribe(listener);

    expect(controller.mode).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(listener).toHaveBeenLastCalledWith("dark", "dark");

    controller.setMode("light");
    expect(storage.getItem("orcTheme")).toBe("light");
    expect(listener).toHaveBeenLastCalledWith("light", "light");

    unsubscribe();
  });

  it("cycles system, light, and dark while removing persistence for system", () => {
    const controller = createThemeController({ document, announce: false });
    controllers.push(controller);

    expect(controller.mode).toBe("system");
    controller.cycle();
    expect(controller.mode).toBe("light");
    controller.cycle();
    expect(controller.mode).toBe("dark");
    controller.cycle();
    expect(controller.mode).toBe("system");
    expect(storage.getItem("orcTheme")).toBeNull();
  });

  it("rejects duplicate live owners and permits a new owner after disposal", () => {
    const first = createThemeController({ document, announce: false });
    expect(() => createThemeController({ document, announce: false })).toThrow(
      /already has a live theme controller/i,
    );

    first.dispose();
    const second = createThemeController({ document, announce: false });
    controllers.push(second);

    expect(second.mode).toBe("system");
  });

  it("survives storage access failures", () => {
    vi.spyOn(storage, "getItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    vi.spyOn(storage, "setItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    vi.spyOn(storage, "removeItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });

    const controller = createThemeController({ document, announce: false });
    controllers.push(controller);

    expect(() => controller.setMode("dark")).not.toThrow();
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(() => controller.setMode("system")).not.toThrow();
  });

  it("tracks OS changes only while mode is system", () => {
    let dark = false;
    let changeListener: ((event: MediaQueryListEvent) => void) | undefined;
    const media = {
      get matches() {
        return dark;
      },
      media: "(prefers-color-scheme: dark)",
      onchange: null,
      addEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) => {
        changeListener = listener;
      },
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList;
    vi.spyOn(document.defaultView!, "matchMedia").mockReturnValue(media);

    const controller = createThemeController({ document, announce: false });
    controllers.push(controller);
    const listener = vi.fn();
    controller.subscribe(listener);

    dark = true;
    changeListener?.({ matches: true } as MediaQueryListEvent);
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(listener).toHaveBeenLastCalledWith("system", "dark");

    controller.setMode("light");
    dark = false;
    changeListener?.({ matches: false } as MediaQueryListEvent);
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("owns optional theme-color and announcer nodes, then cleans them up", () => {
    const originalMeta = document.createElement("meta");
    originalMeta.name = "theme-color";
    originalMeta.content = "original";
    document.head.append(originalMeta);
    const controller = createThemeController({
      document,
      themeColor: { light: "#ffffff", dark: "#111111" },
      announce: true,
    });

    controller.setMode("dark");
    expect(originalMeta.content).toBe("#111111");
    expect(document.querySelectorAll("[data-orc-theme-announcer]")).toHaveLength(1);

    controller.dispose();
    expect(originalMeta.content).toBe("original");
    expect(document.querySelector("[data-orc-theme-announcer]")).toBeNull();
  });

  it("restores theme-color when a partial mapping omits the active theme", () => {
    const originalMeta = document.createElement("meta");
    originalMeta.name = "theme-color";
    originalMeta.content = "original";
    document.head.append(originalMeta);
    const controller = createThemeController({
      document,
      themeColor: { light: "#ffffff" },
      announce: false,
    });
    controllers.push(controller);

    expect(originalMeta.content).toBe("#ffffff");
    controller.setMode("dark");
    expect(originalMeta.content).toBe("original");
    controller.setMode("light");
    expect(originalMeta.content).toBe("#ffffff");
  });

  it("removes a controller-created meta when a partial mapping omits the active theme", () => {
    const controller = createThemeController({
      document,
      themeColor: { dark: "#111111" },
      announce: false,
    });
    controllers.push(controller);

    expect(document.querySelector('meta[name="theme-color"]')).toBeNull();
    controller.setMode("dark");
    expect(document.querySelector('meta[name="theme-color"]')?.getAttribute("content")).toBe(
      "#111111",
    );
    controller.setMode("light");
    expect(document.querySelector('meta[name="theme-color"]')).toBeNull();
  });

  it("disposal is complete and idempotent", () => {
    const controller = createThemeController({ document });
    const listener = vi.fn();
    controller.subscribe(listener);

    controller.dispose();
    controller.dispose();

    expect(() => controller.setMode("dark")).toThrow(/disposed/i);
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
    expect(document.documentElement.style.colorScheme).toBe("");
  });
});

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => void values.delete(key),
    setItem: (key, value) => void values.set(key, String(value)),
  };
}
