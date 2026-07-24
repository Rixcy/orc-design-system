import { create } from "storybook/theming/create";

import tokens from "../src/theme/orc-tokens.json";

// Storybook's manager UI lives outside the preview iframe, so preview.css and
// tokens.css cannot reach it. This module is the one place that translates the
// canonical day/night token source (src/theme/orc-tokens.json, the same file
// scripts/sync-theme.mjs generates tokens.css from) into Storybook's own theme
// vars, so the chrome never carries a second palette.

export type OrcMode = "day" | "night";

// The chrome mirrors the OS: Storybook reads its manager theme once at load and
// does not re-render on a media-query change, so this resolves per load.
export function resolveMode(): OrcMode {
  const prefersDark =
    typeof globalThis.matchMedia === "function" &&
    globalThis.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "night" : "day";
}

// tokens.css derives --orc-muted-strong the same way: plain --orc-muted only
// reaches ~3.6:1 on these surfaces, so secondary chrome text uses the
// strengthened value to clear 4.5:1.
function mutedStrong(mode: OrcMode): string {
  const { muted, heading } = tokens[mode];
  const channels = [1, 3, 5].map((i) => {
    const from = parseInt(muted.slice(i, i + 2), 16);
    const to = parseInt(heading.slice(i, i + 2), 16);
    return Math.round(from * 0.55 + to * 0.45)
      .toString(16)
      .padStart(2, "0");
  });
  return `#${channels.join("")}`;
}

// The Orc lockup: emblem geometry copied unchanged from
// src/components/orc-logomark.ts (itself the vendored src/assets/orc-emblem.svg)
// beside the /orc wordmark. Inlined as a data URI because Storybook's
// brandImage takes a URL and the manager cannot render the orc-logomark custom
// element. Artwork colours stay first-party per src/assets/ASSETS.md; only the
// wordmark is token-coloured, so it reads on both chrome surfaces.
function lockup(mode: OrcMode): string {
  const palette = tokens[mode];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="196" height="36" viewBox="0 0 196 36" role="img" aria-label="/orc design system">
<g transform="translate(17 18) scale(0.2)">
<defs><linearGradient id="skin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9dc76b"/><stop offset="1" stop-color="#53743a"/></linearGradient></defs>
<path d="M-52 -14 L-78 -34 L-58 2 Z" fill="#53743a"/>
<path d="M52 -14 L78 -34 L58 2 Z" fill="#53743a"/>
<path d="M-54 -18 C-54 -52 -30 -64 0 -64 C30 -64 54 -52 54 -18 C54 10 40 30 26 40 C14 49 10 52 0 52 C-10 52 -14 49 -26 40 C-40 30 -54 10 -54 -18 Z" fill="url(#skin)" stroke="#202722" stroke-width="4"/>
<path d="M-40 -24 L-8 -14 L-8 -4 L-42 -12 Z" fill="#202722"/>
<path d="M40 -24 L8 -14 L8 -4 L42 -12 Z" fill="#202722"/>
<circle cx="-24" cy="0" r="6.5" fill="#eceeec"/>
<circle cx="24" cy="0" r="6.5" fill="#eceeec"/>
<circle cx="-23" cy="1" r="3" fill="#16181b"/>
<circle cx="25" cy="1" r="3" fill="#16181b"/>
<path d="M0 8 L-9 24 L9 24 Z" fill="#202722"/>
<path d="M-16 36 Q0 44 16 36" fill="none" stroke="#202722" stroke-width="4" stroke-linecap="round"/>
<path d="M-16 40 L-22 14 L-9 36 Z" fill="#eceeec" stroke="#202722" stroke-width="2.5" stroke-linejoin="round"/>
<path d="M16 40 L22 14 L9 36 Z" fill="#eceeec" stroke="#202722" stroke-width="2.5" stroke-linejoin="round"/>
</g>
<text x="38" y="23" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="15" font-weight="600" letter-spacing="-0.15"><tspan fill="${palette.green}">/</tspan><tspan fill="${palette.heading}">orc </tspan><tspan fill="${mutedStrong(mode)}" font-weight="400">design system</tspan></text>
</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function orcTheme(mode: OrcMode = resolveMode()) {
  const palette = tokens[mode];

  return create({
    base: mode === "night" ? "dark" : "light",

    colorPrimary: palette.accent,
    colorSecondary: palette.accent,

    appBg: palette.bg,
    appContentBg: palette.bg,
    appPreviewBg: palette.bg,
    appBorderColor: palette.border,
    appBorderRadius: 8,

    fontBase: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontCode: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",

    textColor: palette.text,
    textInverseColor: palette.bg,
    textMutedColor: mutedStrong(mode),

    barTextColor: mutedStrong(mode),
    barHoverColor: palette.accent,
    barSelectedColor: palette.accent,
    barBg: palette.panel,

    buttonBg: palette.panel,
    buttonBorder: palette.border,
    booleanBg: palette.chip,
    booleanSelectedBg: palette["accent-soft"],

    inputBg: palette.panel,
    inputBorder: palette.border,
    inputTextColor: palette.text,
    inputBorderRadius: 4,

    brandTitle: "Orc design system",
    brandUrl: "/",
    brandImage: lockup(mode),
  });
}
