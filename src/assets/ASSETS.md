# Asset provenance

The Orc marks are exact copies from the swamp-identity authority:

- Repository: `https://github.com/Rixcy/orc`
- Commit: `d6c5b8279668ca215114f0e662150c58e4bdc38b`
- `orc-logo.svg` source: `assets/orc-logo.svg`; SHA-256: `c37fcee66cfef7a827005213c56f330927f218f447a9f45196a0bf86b1ec0796`
- `orc-icon.svg` source: `assets/orc-icon.svg`; SHA-256: `1c8baf6bace1e6ec2b615caa9568ead402327b3728423aa1e19075580a27a920`

The landing site footer (`site/index.html`) inlines a first-party lockup that
reuses this emblem geometry (unchanged) but recolours the `/orc` wordmark
through theme tokens (`--orc-green` for the slash, footer text colour for
`orc`) so it reads on both the light and dark footer. The vendored
`orc-logo.svg` targets a light card and is left untouched.

`orc-design-system-logo.svg` is a first-party project mascot lockup for this
repo's README. It reuses the canonical emblem geometry from `orc-logo.svg`
(unchanged) and adds the `DESIGN SYSTEM` wordmark and a neutral swamp swatch
ramp closing on the interaction accent. Its swatch fills use the day-palette
neutral scale plus `--orc-accent` as artwork; like the other marks, they do not
define interface token meaning.

`.github/social-preview.png` is the repository's GitHub social card (1280×640,
the size GitHub asks for). It is first-party and generated, never hand-edited:
`scripts/render-social-preview.mjs` (`bun run social-preview`) inlines
`orc-emblem.svg` unchanged, reads every colour from `src/theme/orc-tokens.json`,
embeds the vendored Inter and JetBrains Mono faces, and screenshots the result
through the existing `playwright` devDependency — so the card cannot drift from
the night palette, and rendering fetches nothing over the network (an installed
Playwright Chromium is the only prerequisite). Its hue strip is artwork from the
palette; like the other marks, it does not define interface token meaning. The
PNG ships with the repository only, never with the package (`files: ["dist"]`).

## Third-party marks

The landing navbar's Storybook link (`site/index.html`) inlines Storybook's own
icon so the destination is recognisable. It is not vendored into `src/assets/`
and ships with the site only, never with the package.

- Repository: `https://github.com/storybookjs/brand`
- Commit: `136fa3fdfe25b43c5b0a8ea2a3f0b9a44fa09db4`
- Source: `icon/icon-storybook-default.svg`; SHA-256: `af4c15e6af99322f18efe7334937c3c2674050bceb5c0e3447754bd78802e7c0`
- Changes, all rendering no-ops: element ids namespaced (`sb-book` / `sb-mask`)
  to avoid collisions in the page; `xlink:href` modernised; `<title>` and the
  intrinsic width/height dropped in favour of CSS sizing and `aria-hidden` (the
  link's own text is its accessible name); the export's two wrapper `<g>`
  elements collapsed into one carrying the `transform` and the `fill-rule` that
  was uniform across every path; and two zero-length `lineto` repeats removed
  from the outer path. Path geometry and Storybook's `#FF4785` are unchanged.
- Terms: the Storybook brand repository grants use of these assets for
  "articles, talks, addons, websites, and anything else you can think of".

That pink is Storybook's artwork, used nominatively for a link to Storybook. It
does not become an orc interface color: the button's chrome stays on `--orc-*`
tokens like every other control in the bar.

Logo and icon artwork retain their first-party colors. Those colors may compose
palette hues as art, but do not define interface token meaning. Ordinary UI
color must continue through the semantic `--orc-*` tokens.

## Licensing

These marks are **not** covered by the repository's MIT licence. The Orc name and
the emblem, icon, and lockup artwork are reserved; no trademark or brand licence
is granted. The MIT terms cover the code only — see the README's License section.
