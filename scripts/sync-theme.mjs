import { readFile, realpath, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const sourcePath = resolve(root, "src/theme/orc-tokens.json");
const targetPath = resolve(root, "src/styles/tokens.css");

// Derived roles, declared once so the stylesheet and the packaged JSON cannot drift.
// `mix(a, percent, b)` mirrors CSS `color-mix(in srgb, …)`; `alias(role)` mirrors `var(--orc-role)`.
const themeDerivations = {
  day: {
    gate: mix("orange", 60, "heading"),
    "muted-strong": mix("muted", 45, "heading"),
    "accent-text": mix("accent", 70, "heading"),
    "red-text": mix("red", 60, "heading"),
    "yellow-text": mix("yellow", 70, "heading"),
    "green-text": mix("green", 70, "heading"),
    "purple-text": mix("purple", 65, "heading"),
    "cyan-text": mix("cyan", 60, "heading"),
    "orange-text": mix("orange", 60, "heading"),
    "accent-strong": mix("accent", 70, "heading"),
  },
  night: {
    gate: alias("orange"),
    "muted-strong": mix("muted", 45, "heading"),
    "accent-text": alias("accent"),
    "red-text": alias("red"),
    "yellow-text": alias("yellow"),
    "green-text": alias("green"),
    "purple-text": alias("purple"),
    "cyan-text": alias("cyan"),
    "orange-text": alias("orange"),
    "accent-strong": alias("accent"),
  },
};

// Declared once on :root; they reference theme-dependent roles, so they resolve per theme.
const sharedDerivations = {
  "control-border": mix("border", 65, "heading"),
  "button-hover": mix("accent", 10, "bg"),
  "button-hover-chip": mix("accent", 12, "chip"),
  "button-hover-strong": mix("accent-strong", 86, "heading"),
};

export async function readPalettes() {
  const palettes = JSON.parse(await readFile(sourcePath, "utf8"));
  validatePalettes(palettes);
  return palettes;
}

/** Packaged token payload: the raw day/night palettes plus resolved derived roles. */
export function buildTokens(palettes) {
  return {
    ...palettes,
    derived: {
      day: resolveDerivations(palettes.day, themeDerivations.day),
      night: resolveDerivations(palettes.night, themeDerivations.night),
    },
  };
}

// realpath, not argv[1] directly: a symlinked invocation path would otherwise skip
// the CLI silently and let `theme:check` report success without checking anything.
const invokedPath = process.argv[1]
  ? await realpath(process.argv[1]).catch(() => process.argv[1])
  : "";

if (invokedPath === import.meta.filename) {
  const mode = process.argv[2] ?? "--check";

  if (!["--check", "--write"].includes(mode) || process.argv.length > 3) {
    console.error("Usage: node scripts/sync-theme.mjs [--check|--write]");
    process.exitCode = 2;
  } else {
    const desired = renderCss(await readPalettes());
    const current = await readFile(targetPath, "utf8").catch((error) => {
      if (error?.code === "ENOENT") return "";
      throw error;
    });

    if (current === desired) {
      console.log("Theme CSS is synchronized.");
    } else if (mode === "--write") {
      await writeFile(targetPath, desired);
      console.log("Synchronized src/styles/tokens.css.");
    } else {
      console.error("src/styles/tokens.css has drifted. Run `bun run theme:write`.");
      process.exitCode = 1;
    }
  }
}

function mix(from, percent, to) {
  return { from, percent, to };
}

function alias(role) {
  return { from: role, percent: 100, to: role };
}

function resolveDerivations(palette, themeRecipes) {
  const resolved = {};
  const lookup = (role) => palette[role] ?? resolved[role];
  // Theme recipes first: shared `button-hover-strong` mixes the derived `accent-strong`.
  for (const [role, recipe] of [...Object.entries(themeRecipes), ...Object.entries(sharedDerivations)]) {
    resolved[role] = mixHex(lookup(recipe.from), lookup(recipe.to), recipe.percent / 100);
  }
  return resolved;
}

/** CSS `color-mix(in srgb, …)` over two opaque colors is a component-wise sRGB mix. */
function mixHex(first, second, firstWeight) {
  const channels = [1, 3, 5].map((offset) => {
    const a = Number.parseInt(first.slice(offset, offset + 2), 16);
    const b = Number.parseInt(second.slice(offset, offset + 2), 16);
    return Math.round(a * firstWeight + b * (1 - firstWeight)).toString(16).padStart(2, "0");
  });
  return `#${channels.join("")}`;
}

function validatePalettes(palettes) {
  const expectedThemes = ["day", "night"];
  const expectedRoles = [
    "bg", "panel", "border", "text", "heading", "muted", "accent", "accent-soft",
    "chip", "code", "green", "yellow", "red", "purple", "cyan", "orange",
  ];

  if (JSON.stringify(Object.keys(palettes)) !== JSON.stringify(expectedThemes)) {
    throw new Error("Theme source must contain only ordered day and night palettes.");
  }
  for (const theme of expectedThemes) {
    if (JSON.stringify(Object.keys(palettes[theme])) !== JSON.stringify(expectedRoles)) {
      throw new Error(`${theme} must contain the canonical 16 ordered roles.`);
    }
    for (const [role, value] of Object.entries(palettes[theme])) {
      if (!/^#[0-9a-f]{6}$/.test(value)) {
        throw new Error(`${theme}.${role} must be a lowercase six-digit hex color.`);
      }
    }
  }
}

function renderCss({ day, night }) {
  return `/* Generated by scripts/sync-theme.mjs from src/theme/orc-tokens.json. */
:root {
  color-scheme: light dark;

  /* Orc day */
${renderPalette(day, "  ")}

  /* Surface-aware semantic derivations. */
${renderDayDerivations("  ")}
${renderSharedDerivations("  ")}

  /* Stable typography, layout, and focus tokens. */
  --orc-font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --orc-font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  --orc-space-1: 4px;
  --orc-space-2: 8px;
  --orc-space-3: 12px;
  --orc-space-4: 16px;
  --orc-space-5: 24px;
  --orc-radius-sm: 4px;
  --orc-radius-md: 8px;
  --orc-radius-pill: 999px;
  /* Green, not accent: fields already mark focus with a green border, so a
     blue ring on the controls beside them read as two focus languages. */
  --orc-focus-ring: 1px solid var(--orc-green);
  --orc-focus-offset: 3px;
}

@media (prefers-color-scheme: dark) {
  :root {
    /* Orc night */
${renderPalette(night, "    ")}
${renderNightDerivations("    ")}
  }
}

:root[data-theme="dark"] {
  color-scheme: dark;
${renderPalette(night, "  ")}
${renderNightDerivations("  ")}
}

:root[data-theme="light"] {
  color-scheme: light;
${renderPalette(day, "  ")}
${renderDayDerivations("  ")}
}
`;
}

function renderPalette(palette, indent) {
  return Object.entries(palette)
    .map(([role, value]) => `${indent}--orc-${role}: ${value};`)
    .join("\n");
}

function renderDayDerivations(indent) {
  return renderDerivations(themeDerivations.day, indent);
}

function renderNightDerivations(indent) {
  return renderDerivations(themeDerivations.night, indent);
}

function renderSharedDerivations(indent) {
  return renderDerivations(sharedDerivations, indent);
}

function renderDerivations(recipes, indent) {
  return Object.entries(recipes)
    .map(([role, { from, percent, to }]) => (percent === 100
      ? `${indent}--orc-${role}: var(--orc-${from});`
      : `${indent}--orc-${role}: color-mix(in srgb, var(--orc-${from}) ${percent}%, var(--orc-${to}));`))
    .join("\n");
}
