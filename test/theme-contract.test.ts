import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const roles = [
  "bg", "panel", "border", "text", "heading", "muted", "accent", "accent-soft",
  "chip", "code", "green", "yellow", "red", "purple", "cyan", "orange",
] as const;

const expected = {
  day: {
    bg: "#e3e5e4", panel: "#eceeec", border: "#a8b0aa", text: "#38423c",
    heading: "#202722", muted: "#6e7971", accent: "#2d6983", "accent-soft": "#cbd1cc",
    chip: "#cbd1cc", code: "#d4d8d5", green: "#53743a", yellow: "#8a6a2f",
    red: "#b83f50", purple: "#76518f", cyan: "#256f72", orange: "#9a5a25",
  },
  night: {
    bg: "#1a1c20", panel: "#16181b", border: "#3b4540", text: "#c7cfca",
    heading: "#e0e5e2", muted: "#707a73", accent: "#78a9c2", "accent-soft": "#29312c",
    chip: "#29312c", code: "#1f2422", green: "#9dc76b", yellow: "#d5b05c",
    red: "#e87878", purple: "#b497d6", cyan: "#77b8b1", orange: "#e69257",
  },
} as const;

describe("Orc theme contract", () => {
  it("keeps the canonical 16-role day/night source exact", async () => {
    const tokens = JSON.parse(await readFile(resolve(root, "src/theme/orc-tokens.json"), "utf8"));

    expect(tokens).toEqual(expected);
    expect(Object.keys(tokens)).toEqual(["day", "night"]);
    expect(Object.keys(tokens.day)).toEqual(roles);
    expect(Object.keys(tokens.night)).toEqual(roles);
  });

  it("records exact source paths, commit, and artifact hashes", async () => {
    const provenance = JSON.parse(
      await readFile(resolve(root, "src/theme/orc-theme.provenance.json"), "utf8"),
    );

    expect(provenance).toEqual({
      schemaVersion: 1,
      source: {
        repository: "https://github.com/Rixcy/orc",
        commit: "d6c5b8279668ca215114f0e662150c58e4bdc38b",
      },
      artifacts: {
        "src/theme/orc-tokens.json": {
          sourcePath: "theme/orc-tokens.json",
          sha256: "f2f5c91dabc1189abb409a72cb73efe908bbb9ab10da422aff2e0651888e4a49",
        },
        "src/assets/orc-logo.svg": {
          sourcePath: "assets/orc-logo.svg",
          sha256: "c37fcee66cfef7a827005213c56f330927f218f447a9f45196a0bf86b1ec0796",
        },
        "src/assets/orc-icon.svg": {
          sourcePath: "assets/orc-icon.svg",
          sha256: "1c8baf6bace1e6ec2b615caa9568ead402327b3728423aa1e19075580a27a920",
        },
      },
    });

    for (const [path, record] of Object.entries<{ sha256: string }>(provenance.artifacts)) {
      const digest = createHash("sha256")
        .update(await readFile(resolve(root, path)))
        .digest("hex");
      expect(digest, path).toBe(record.sha256);
    }
  });

  it("keeps generated CSS in sync with day/light and night/dark mappings", async () => {
    const result = spawnSync(process.execPath, ["scripts/sync-theme.mjs", "--check"], {
      cwd: root,
      encoding: "utf8",
    });

    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Theme CSS is synchronized.");
    expect(result.status).toBe(0);

    const css = await readFile(resolve(root, "src/styles/tokens.css"), "utf8");
    expect(themeValues(css, ":root")).toMatchObject(expected.day);
    expect(themeValues(css, '@media (prefers-color-scheme: dark) {\n  :root')).toMatchObject(expected.night);
    expect(themeValues(css, ':root[data-theme="dark"]')).toMatchObject(expected.night);
    expect(themeValues(css, ':root[data-theme="light"]')).toMatchObject(expected.day);
    expect(css).toContain("--orc-control-border: color-mix(in srgb, var(--orc-border) 65%, var(--orc-heading));");
    expect(css).toContain("--orc-font-sans:");
    expect(css).toContain("--orc-focus-ring: 1px solid var(--orc-green);");
    expect(css).toContain("--orc-focus-offset: 3px;");
  });

  it("keeps every shadow-DOM focus fallback in sync with the token", async () => {
    const bothFallbacks = [
      "src/components/orc-button.ts",
      "src/components/orc-chip.ts",
      "src/components/orc-dialog.ts",
      "src/components/orc-theme-toggle.ts",
      "src/components/orc-navbar.ts",
    ];
    for (const path of bothFallbacks) {
      const source = await readFile(resolve(root, path), "utf8");
      expect(source, path).toContain("var(--orc-focus-ring, 1px solid #9dc76b)");
      expect(source, path).toContain("var(--orc-focus-offset, 3px)");
      expect(source, path).not.toContain("2px solid #9dc76b");
      expect(source, path).not.toContain("var(--orc-focus-offset, 2px)");
    }

    const outlineOnlyFallbacks = ["src/components/orc-tabs.ts", "src/components/orc-segmented.ts"];
    for (const path of outlineOnlyFallbacks) {
      const source = await readFile(resolve(root, path), "utf8");
      expect(source, path).toContain("var(--orc-focus-ring, 1px solid #9dc76b)");
      expect(source, path).not.toContain("2px solid #9dc76b");
    }

    const site = await readFile(resolve(root, "site/site.css"), "utf8");
    expect(site).toContain("var(--orc-focus-ring, 1px solid var(--orc-accent))");
    expect(site).toContain("var(--orc-focus-offset, 3px)");
    expect(site).not.toContain("2px solid var(--orc-accent)");
    expect(site).not.toContain("var(--orc-focus-offset, 2px)");
  });

  it("packages derived roles as resolved hex for both themes", () => {
    const result = spawnSync(
      process.execPath,
      [
        "-e",
        "const m = await import('./scripts/sync-theme.mjs');"
          + " console.log(JSON.stringify(m.buildTokens(await m.readPalettes())));",
      ],
      { cwd: root, encoding: "utf8" },
    );

    expect(result.stderr).toBe("");
    const tokens = JSON.parse(result.stdout);

    expect(Object.keys(tokens)).toEqual(["day", "night", "derived"]);
    expect(tokens.day).toEqual(expected.day);
    expect(tokens.night).toEqual(expected.night);

    expect(tokens.derived.day).toEqual({
      gate: mix(expected.day.orange, expected.day.heading, 0.6),
      "muted-strong": mix(expected.day.muted, expected.day.heading, 0.45),
      "accent-text": mix(expected.day.accent, expected.day.heading, 0.7),
      "red-text": mix(expected.day.red, expected.day.heading, 0.6),
      "yellow-text": mix(expected.day.yellow, expected.day.heading, 0.7),
      "green-text": mix(expected.day.green, expected.day.heading, 0.7),
      "purple-text": mix(expected.day.purple, expected.day.heading, 0.65),
      "cyan-text": mix(expected.day.cyan, expected.day.heading, 0.6),
      "orange-text": mix(expected.day.orange, expected.day.heading, 0.6),
      "accent-strong": mix(expected.day.accent, expected.day.heading, 0.7),
      "control-border": mix(expected.day.border, expected.day.heading, 0.65),
      "button-hover": mix(expected.day.green, expected.day.bg, 0.1),
      "button-hover-chip": mix(expected.day.green, expected.day.chip, 0.12),
      "button-hover-strong": mix(
        mix(expected.day.accent, expected.day.heading, 0.7),
        expected.day.heading,
        0.86,
      ),
    });

    expect(tokens.derived.night).toEqual({
      gate: expected.night.orange,
      "muted-strong": mix(expected.night.muted, expected.night.heading, 0.45),
      "accent-text": expected.night.accent,
      "red-text": expected.night.red,
      "yellow-text": expected.night.yellow,
      "green-text": expected.night.green,
      "purple-text": expected.night.purple,
      "cyan-text": expected.night.cyan,
      "orange-text": expected.night.orange,
      "accent-strong": expected.night.accent,
      "control-border": mix(expected.night.border, expected.night.heading, 0.65),
      "button-hover": mix(expected.night.green, expected.night.bg, 0.1),
      "button-hover-chip": mix(expected.night.green, expected.night.chip, 0.12),
      "button-hover-strong": mix(expected.night.accent, expected.night.heading, 0.86),
    });
  });

  it("keeps design guidance aligned with every swamp role", async () => {
    const designSource = await readFile(resolve(root, ".impeccable/design.json"), "utf8");
    const design = JSON.parse(designSource);
    const canonicalColors = Object.values(design.extensions.colorMeta)
      .map((entry) => (entry as { canonical: string }).canonical);

    for (const palette of Object.values(expected)) {
      for (const value of Object.values(palette)) expect(canonicalColors).toContain(value);
    }
    expect(designSource).toContain("Orc swamp");
    expect(designSource).not.toContain("Tokyo Night");
  });

  it("meets text and meaningful-boundary contrast on both surfaces", () => {
    for (const palette of Object.values(expected)) {
      const strengthened = {
        text: palette.text,
        heading: palette.heading,
        accent: palette.accent,
        cyan: palette.cyan,
        muted: mix(palette.muted, palette.heading, 0.45),
        green: palette === expected.day ? mix(palette.green, palette.heading, 0.70) : palette.green,
        yellow: palette === expected.day ? mix(palette.yellow, palette.heading, 0.70) : palette.yellow,
        red: palette === expected.day ? mix(palette.red, palette.heading, 0.60) : palette.red,
        purple: palette === expected.day ? mix(palette.purple, palette.heading, 0.65) : palette.purple,
        gate: palette === expected.day ? mix(palette.orange, palette.heading, 0.60) : palette.orange,
      };
      const controlBorder = mix(palette.border, palette.heading, 0.65);

      for (const surface of [palette.bg, palette.panel]) {
        for (const [name, color] of Object.entries(strengthened)) {
          expect(contrast(color, surface), `${name} on ${surface}`).toBeGreaterThanOrEqual(4.5);
        }
        expect(contrast(controlBorder, surface), `control border on ${surface}`).toBeGreaterThanOrEqual(3);
      }
    }
  });
});

function themeValues(css: string, selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  expect(start, selector).toBeGreaterThanOrEqual(0);
  const openingBrace = css.indexOf("{", start);
  let depth = 0;
  let end = openingBrace;
  for (; end < css.length; end += 1) {
    if (css[end] === "{") depth += 1;
    if (css[end] === "}" && --depth === 0) break;
  }
  const block = css.slice(openingBrace, end);
  const entries: Array<[string, string]> = roles.map((role) => {
    const value = block.match(new RegExp(`--orc-${role}:\\s*(#[0-9a-f]{6})`, "i"))?.[1];
    if (!value) throw new Error(`${selector} is missing --orc-${role}`);
    return [role, value];
  });
  return Object.fromEntries(entries);
}

function mix(first: string, second: string, firstWeight: number): string {
  const a = rgb(first);
  const b = rgb(second);
  return `#${a.map((value, index) => Math.round(value * firstWeight + b[index] * (1 - firstWeight))
    .toString(16).padStart(2, "0")).join("")}`;
}

function contrast(first: string, second: string): number {
  const [lighter, darker] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

function luminance(color: string): number {
  const channels = rgb(color).map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function rgb(color: string): [number, number, number] {
  return [1, 3, 5].map((offset) => Number.parseInt(color.slice(offset, offset + 2), 16)) as [number, number, number];
}
