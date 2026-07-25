# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Single maintainer, building and maintaining a set of personal web projects.
Consumes the design system while building those surfaces and wants one
identity 

## Product Purpose

`@orc/design-system` is the single source of truth for Orc's visual
identity: a 16-color semantic swamp palette, type and motion rules, theming
(day/night), and a small set of standards-based Web Components. Success means
any Orc surface — regardless of framework — imports tokens and components
instead of duplicating design decisions.

## Positioning

Framework-neutral by construction: everything ships as plain CSS, JSON, and
custom elements (`defineOrcElements()`), so any framework or none can consume
it. The palette is the API — consumers use semantic `--orc-*` roles, never raw
hex.

## Operating Context

- Consuming apps are first-party web surfaces built by the same maintainer.
- Bun is the package manager and script runner; Vite builds; Storybook (:6006)
  is the component workbench; Vitest (unit + browser + reduced-motion configs)
  tests.
- `consumer:proof` packs and builds a real Vite consumer to verify the
  published package end to end.

## Capabilities and Constraints

Binding constraints (user-confirmed):

- The 16-color semantic palette is fixed; color meanings documented in
  `.impeccable/design.json` stay binding (green, yellow, red, orange, purple,
  cyan have fixed meanings).
- Framework-neutral forever: plain CSS, JSON, and custom elements; no
  framework lock-in.

Current facts (not pinned as binding):

- Fonts are opt-in: platform sans/mono stacks are the default; Inter (body)
  and JetBrains Mono (code) are optional.
- Theming: system preference by default; explicit `data-theme` on root wins;
  `preflight.js` prevents first-paint flash for persisted choices.
- Stable raw token schema is `{ day, night }` JSON; derived CSS roles are
  generated, intentionally absent from JSON.
- Components: `<orc-navbar>`, `<orc-theme-toggle>`, `<orc-glow-field>`.
- Private, unlicensed package; not intended for third-party consumers.

## Brand Commitments

- Name: Orc. Identity: "restrained swamp" — restrained neutral ramp with
  semantic accents.
- Marks: `orc-logo.svg`, `orc-icon.svg`, `orc-design-system-logo.svg`
  (`src/assets/`). Logo/icon artwork keeps its own first-party colors and
  never defines interface token meaning.
- Fonts on hand: Inter and JetBrains Mono woff2 with provenance recorded in
  `src/assets/fonts/PROVENANCE.md`.

## Product Principles

1. The palette is the API — identity evolves in one place, consumers follow.
2. Standards over frameworks — Web Components and plain CSS outlive any stack.
3. Semantic roles over raw values — meaning is fixed, rendering may change.
4. Prove the package, not the source — consumer-proof builds gate releases.

## Accessibility & Inclusion

- Storybook a11y addon is part of the workbench.
- Reduced-motion behavior is tested via a dedicated Vitest config; motion work
  must keep honoring `prefers-reduced-motion`.
