# Orc theme consumption

The package owns Orc's restrained swamp palette. Consumers should import the
package surfaces instead of copying color values.

## CSS

Import tokens before application styles:

```css
@import "@orc/design-system-preview/tokens.css";
```

Use the public `--orc-*` semantic roles. `--orc-bg` and `--orc-panel` are
canvases; `--orc-text` and `--orc-heading` carry prose; `--orc-accent` is for
interaction; green, yellow, red, orange, purple, and cyan retain the meanings
documented in `.impeccable/design.json`. Small colored text should use the
derived `*-text` roles, and resting control edges should use
`--orc-control-border`.

The stylesheet follows system preference by default. An explicit
`data-theme="light"` or `data-theme="dark"` on the root wins in either
direction. Use the exported controller and parser-time `preflight.js` when a
consumer offers a persisted theme choice.

## JSON

Build tools and non-CSS consumers can import the raw palette:

```ts
import tokens from "@orc/design-system-preview/tokens.json";

const lightThemeColor = tokens.day.bg;
const darkThemeColor = tokens.night.bg;
```

The stable raw schema is `{ day, night }`. CSS maps `day` to light and `night`
to dark. Derived CSS roles are intentionally absent from JSON: the package
generator computes them from the 16 raw semantic colors.

## Brand assets

The package exports `assets/orc-logo.svg` and `assets/orc-icon.svg`. Their
first-party artwork may compose palette colors, but embedded artwork colors do
not create additional UI token meanings.

## Adoption

1. Import `tokens.css` before app styles and map legacy variables temporarily.
2. Load the classic `preflight.js` synchronously in `<head>` when persistence is needed.
3. Initialize one `createThemeController` per document with `tokens.day.bg` and `tokens.night.bg` as theme colors.
4. Verify system, explicit light, explicit dark, contrast, focus, and reduced motion before removing aliases.

Orc itself remains a downstream consumer. Updating Orc's embedded declarations
belongs in a separate adoption change after this package surface is approved.
