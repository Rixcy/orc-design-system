<p align="center">
  <img src="src/assets/orc-design-system-logo.svg" alt="/orc Design System" width="520">
</p>

<p align="center"><b>Framework-neutral Orc design foundations and Web Components — one swamp palette, shared everywhere.</b></p>

Orc Design System is the single source of truth for Orc's restrained swamp
identity: a 16-color semantic palette, type and motion rules, and a small set of
standards-based Web Components. Everything ships as plain CSS, JSON, and custom
elements, so any framework — or none — can consume it without copying color
values around.

## What it ships

- **Semantic tokens** — the `--orc-*` CSS custom properties and a stable
  `{ day, night }` JSON schema. Green, yellow, red, orange, purple, and cyan
  keep the fixed meanings documented in `.impeccable/design.json`.
- **Automatic theming** — the stylesheet follows system preference by default;
  an explicit `data-theme="light"` / `data-theme="dark"` on the root wins either
  way. A parser-time `preflight.js` avoids the first-paint flash for persisted
  choices.
- **Web Components** — `<orc-button>`, `<orc-chip>`, `<orc-dialog>`,
  `<orc-glow-field>`, `<orc-navbar>`, `<orc-status-dot>`, `<orc-stepper>`,
  `<orc-tabs>`, `<orc-textarea>`, and `<orc-theme-toggle>`, defined via
  `defineOrcElements()` and driven by an exported `createThemeController()`.
- **Utility CSS** — opt-in `scrollbar.css` (`.orc-scrollbar`) and
  `typography.css` (`--orc-type-*` variables + `.orc-type-*` classes).
- **Fonts** — opt-in Inter (body) and JetBrains Mono (code); the platform sans
  and mono stacks are the default so nothing is required.
- **Preflight & assets** — the theme preflight snippet plus the packaged Orc
  marks (`orc-logo.svg`, `orc-icon.svg`).

## Install

[Bun](https://bun.sh/) is the project's package manager and script runner.

```bash
bun install
```

## Usage

Import the tokens before your application styles, then use the public roles:

```css
@import "@orc/design-system/tokens.css";

.card {
  background: var(--orc-panel);
  color: var(--orc-text);
  border: 1px solid var(--orc-border);
}
```

Register the components and let the controller manage theme:

```ts
import { defineOrcElements } from "@orc/design-system/define";

defineOrcElements();
// <orc-navbar> and <orc-theme-toggle> are now usable in your markup.
```

Non-CSS consumers can read the raw palette directly:

```ts
import tokens from "@orc/design-system/tokens.json";

const lightThemeColor = tokens.day.bg;
const darkThemeColor = tokens.night.bg;
```

See [`docs/theme-consumption.md`](docs/theme-consumption.md) for the full theming
contract and the list of derived CSS roles.

## Develop

```bash
bun run storybook       # component workbench + docs at :6006
bun run test            # unit + browser tests (Vitest)
bun run typecheck       # type-only pass
bun run build           # theme check → Vite build → static assets → verify
```

`bun run consumer:proof` packs the library and builds a real Vite consumer to
prove the published package works end to end.

## The palette is the API

Consumers import token surfaces instead of copying hex values, so the swamp
identity can evolve in one place. Ordinary UI color must always flow through the
semantic `--orc-*` roles — the logo and icon artwork keep their own first-party
colors and never define interface token meaning.
