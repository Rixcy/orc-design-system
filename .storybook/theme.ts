import { create } from "storybook/theming";

import tokens from "../src/theme/orc-tokens.json";

const night = tokens.night;

// Manager chrome uses the night palette so the sidebar reads as Orc regardless
// of which preview theme a story is being viewed in.
export default create({
  base: "dark",
  brandTitle: "Orc design system",
  brandUrl: "https://github.com/rixcy/orc-design-system",
  brandImage: "/orc-logo.svg",
  brandTarget: "_self",

  colorPrimary: night.green,
  colorSecondary: night.accent,

  appBg: night.bg,
  appContentBg: night.bg,
  appPreviewBg: night.bg,
  appBorderColor: night.border,
  appBorderRadius: 8,

  textColor: night.text,
  textInverseColor: night.panel,
  textMutedColor: night.muted,

  barTextColor: night.muted,
  barSelectedColor: night.accent,
  barHoverColor: night.accent,
  barBg: night.panel,

  inputBg: night.panel,
  inputBorder: night.border,
  inputTextColor: night.text,
  inputBorderRadius: 4,

  fontBase: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontCode: 'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace',
});
