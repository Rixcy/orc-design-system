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

Logo and icon artwork retain their first-party colors. Those colors may compose
palette hues as art, but do not define interface token meaning. Ordinary UI
color must continue through the semantic `--orc-*` tokens.
