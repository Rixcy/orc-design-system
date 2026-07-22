import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runInNewContext } from "node:vm";

import { describe, expect, it, vi } from "vitest";

const source = readFileSync(resolve(process.cwd(), "src/theme/preflight.js"), "utf8");

function executePreflight(saved: string | null, storageKey = "orcTheme") {
  const setAttribute = vi.fn();
  const getItem = vi.fn(() => saved);
  const script = { getAttribute: vi.fn(() => storageKey) };
  runInNewContext(source, {
    document: {
      currentScript: script,
      documentElement: { setAttribute },
    },
    localStorage: { getItem },
  });
  return { getItem, script, setAttribute };
}

describe("classic theme preflight", () => {
  it.each(["light", "dark"])("applies saved %s synchronously", (mode) => {
    const result = executePreflight(mode);
    expect(result.getItem).toHaveBeenCalledWith("orcTheme");
    expect(result.setAttribute).toHaveBeenCalledWith("data-theme", mode);
  });

  it("reads data-storage-key and ignores unsupported values", () => {
    const result = executePreflight("system", "customTheme");
    expect(result.getItem).toHaveBeenCalledWith("customTheme");
    expect(result.setAttribute).not.toHaveBeenCalled();
  });

  it("does not fail when storage throws", () => {
    expect(() =>
      runInNewContext(source, {
        document: {
          currentScript: { getAttribute: () => null },
          documentElement: { setAttribute: vi.fn() },
        },
        localStorage: {
          getItem: () => {
            throw new Error("blocked");
          },
        },
      }),
    ).not.toThrow();
  });
});
