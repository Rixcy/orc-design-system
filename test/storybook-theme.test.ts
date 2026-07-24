import { describe, expect, it } from "vitest";

import { orcTheme } from "../.storybook/orc-theme";
import tokens from "../src/theme/orc-tokens.json";

const channels = (hex: string): number[] =>
  [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

// Same 45%-toward-heading mix tokens.css uses for --orc-muted-strong.
const mutedStrong = (mode: "day" | "night"): string =>
  `#${channels(tokens[mode].muted)
    .map((from, i) =>
      Math.round(from * 0.55 + channels(tokens[mode].heading)[i]! * 0.45)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;

const contrast = (a: string, b: string): number => {
  const luminance = (hex: string): number => {
    const [red, green, blue] = channels(hex).map((value) => {
      const channel = value / 255;
      return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    }) as [number, number, number];
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  };
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (light + 0.05) / (dark + 0.05);
};

// The Storybook manager chrome must consume the canonical token source, not a
// second hand-copied palette. Same contract as test/theme-contract.test.ts,
// applied to the chrome instead of the generated CSS.
describe("Storybook chrome theme", () => {
  for (const mode of ["day", "night"] as const) {
    const palette = tokens[mode];

    it(`derives ${mode} chrome colours from orc-tokens.json`, () => {
      const theme = orcTheme(mode);

      expect(theme.base).toBe(mode === "night" ? "dark" : "light");
      expect(theme.colorPrimary).toBe(palette.accent);
      expect(theme.appBg).toBe(palette.bg);
      expect(theme.appContentBg).toBe(palette.bg);
      expect(theme.appBorderColor).toBe(palette.border);
      expect(theme.barBg).toBe(palette.panel);
      expect(theme.barSelectedColor).toBe(palette.accent);
      expect(theme.textColor).toBe(palette.text);
      // Secondary chrome text uses the strengthened muted (tokens.css's
      // --orc-muted-strong): plain muted only clears ~3.6:1 on these surfaces.
      expect(theme.textMutedColor).toBe(mutedStrong(mode));
      expect(theme.barTextColor).toBe(mutedStrong(mode));
      expect(contrast(theme.textMutedColor!, palette.panel)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(theme.textMutedColor!, palette.bg)).toBeGreaterThanOrEqual(4.5);
      expect(theme.inputBg).toBe(palette.panel);
      expect(theme.booleanSelectedBg).toBe(palette["accent-soft"]);
    });

    it(`brands the ${mode} header with the token-coloured Orc lockup`, () => {
      const theme = orcTheme(mode);

      expect(theme.brandTitle).toBe("Orc design system");
      expect(theme.brandImage?.startsWith("data:image/svg+xml,")).toBe(true);

      const svg = decodeURIComponent(theme.brandImage!.replace("data:image/svg+xml,", ""));
      expect(svg).toContain(`fill="${palette.green}">/`);
      expect(svg).toContain(`fill="${palette.heading}">orc `);
      expect(svg).toContain(`fill="${mutedStrong(mode)}" font-weight="400">design system`);
      expect(svg).toContain('aria-label="/orc design system"');
      // Emblem geometry is the vendored mark, copied unchanged.
      expect(svg).toContain('viewBox="0 0 196 36"');
      expect(svg).toContain('d="M-52 -14 L-78 -34 L-58 2 Z"');
    });
  }
});
