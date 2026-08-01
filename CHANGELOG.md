# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

## [5.1.0](https://github.com/Rixcy/orc-design-system/compare/v5.0.0...v5.1.0) (2026-08-01)


### Features

* **cli:** add an upgrade command that bumps, installs, then migrates ([7f9bc13](https://github.com/Rixcy/orc-design-system/commit/7f9bc13bbe8908ef403030a1422c8dd50fa2db78))

## [5.0.0](https://github.com/Rixcy/orc-design-system/compare/v4.0.2...v5.0.0) (2026-08-01)


### ⚠ BREAKING CHANGES

* **tokens:** --orc-button-hover and --orc-button-hover-chip resolve
through --orc-green instead of --orc-accent. Consumers relying on a blue
hover tint must set those tokens themselves.

### Features

* **tokens:** move hover and tab selection to green ([d287fbe](https://github.com/Rixcy/orc-design-system/commit/d287fbe2eb420d0e482348d6e1e5de5a6a9ba650))


### Bug Fixes

* **orc-input,orc-textarea:** stop the internal label accessor shadowing the label attribute ([5838864](https://github.com/Rixcy/orc-design-system/commit/58388640537937aa3704e468d7584a65e7d78ad6))
* **tokens:** replace the leftover Tokyo Night fallbacks ([cd35675](https://github.com/Rixcy/orc-design-system/commit/cd35675eef586010357567e473529944ec4db3be)), closes [#3b4261](https://github.com/Rixcy/orc-design-system/issues/3b4261) [#565f89](https://github.com/Rixcy/orc-design-system/issues/565f89) [#7aa2f7](https://github.com/Rixcy/orc-design-system/issues/7aa2f7) [#aeb5b0](https://github.com/Rixcy/orc-design-system/issues/aeb5b0) [#757d79](https://github.com/Rixcy/orc-design-system/issues/757d79)

## [4.0.2](https://github.com/Rixcy/orc-design-system/compare/v4.0.1...v4.0.2) (2026-07-31)

## [4.0.1](https://github.com/Rixcy/orc-design-system/compare/v4.0.0...v4.0.1) (2026-07-31)


### Bug Fixes

* **migrations:** report the 4.0.0 focus hairline change and guard the gap ([ad53948](https://github.com/Rixcy/orc-design-system/commit/ad539481ac6d356b9d56769965ef96ff81d22629))

## [4.0.0](https://github.com/Rixcy/orc-design-system/compare/v3.0.0...v4.0.0) (2026-07-31)


### ⚠ BREAKING CHANGES

* **tokens:** --orc-focus-ring is 1px instead of 2px and
--orc-focus-offset is 3px instead of 2px. Consumers relying on the old
2px/2px focus ring will see 1px/3px.

### Features

* **rollout:** ship per-release migrations and a consumer rollout script ([63e4ef7](https://github.com/Rixcy/orc-design-system/commit/63e4ef7947785e4242c2c137541c1ec949e75dd9))
* **site:** explode orc-logo confetti from the hero send button ([aef3203](https://github.com/Rixcy/orc-design-system/commit/aef3203450d14ff49df3b3c64c2a1ea20dca15ce))
* **tokens:** make the focus ring a hairline ([322974a](https://github.com/Rixcy/orc-design-system/commit/322974a5c8d4583ad94c15c712d0eaa611328ab6))

## [3.0.0](https://github.com/Rixcy/orc-design-system/compare/v2.0.1...v3.0.0) (2026-07-27)


### ⚠ BREAKING CHANGES

* **tokens:** --orc-focus-ring is green rather than accent blue. Consumers
relying on a blue focus ring must set --orc-focus-ring themselves.

### Features

* add generated 1280x640 GitHub social preview card ([76fbb7b](https://github.com/Rixcy/orc-design-system/commit/76fbb7bde0d7324113313c15b13e2923067c9ecd))
* publish as @orc-tools/orc-design-system ([4e6ae20](https://github.com/Rixcy/orc-design-system/commit/4e6ae20f38f91d9adf16c76d558b709c7134186e))
* **site:** add Storybook link to landing header ([4dde6e8](https://github.com/Rixcy/orc-design-system/commit/4dde6e8d107b27a8ecdb8d1220740513bcb9c21e))
* **tokens:** make the focus ring green ([0ce033b](https://github.com/Rixcy/orc-design-system/commit/0ce033bb0b686706beef4a29c78b5a3c5e4acca8))


### Bug Fixes

* **orc-button:** tint ghost hover and press from the green family ([b7b3bba](https://github.com/Rixcy/orc-design-system/commit/b7b3bba0ee480a56a9a0475ff904565387510b4f))
* **orc-navbar:** vertically centre header brand and nav text ([98787f5](https://github.com/Rixcy/orc-design-system/commit/98787f5f46d24fae4c048b378e61e366565c16ea))
* **orc-textarea,orc-input:** drop the focus outline on the host ([6d194e9](https://github.com/Rixcy/orc-design-system/commit/6d194e945a7c59bc5bbcdea766d4f1331fb25969))
* **pack-proof:** match declaration output by shape, not by list ([47ef82d](https://github.com/Rixcy/orc-design-system/commit/47ef82dfc2ef9d54afd9d9ea85ced2b6121cd5f4))

## [2.0.1](https://github.com/Rixcy/orc-design-system/compare/v2.0.0...v2.0.1) (2026-07-26)


### Bug Fixes

* **orc-chip:** give the neutral chip DESIGN.md §5's Soft Fill ([7c111da](https://github.com/Rixcy/orc-design-system/commit/7c111da1c224b8a7d4b218dc92b95faf3afa4765))

## [2.0.0](https://github.com/Rixcy/orc-design-system/compare/v1.5.0...v2.0.0) (2026-07-26)


### ⚠ BREAKING CHANGES

* **orc-textarea,orc-input:** `<orc-glow-field>` and the `OrcGlowField` export are
removed. Use `<orc-textarea>` with `aria-label` and a `footer` slot. The
`suppress-focus-ring` attribute is gone too — there is no focus ring left
to suppress.

### Features

* **orc-chip,orc-button:** link chips, §5 chip size, --orc-button-text ([15f1f4f](https://github.com/Rixcy/orc-design-system/commit/15f1f4f12efc4522108a70849060af1bdf657b4e))
* **orc-glow-field:** document at composer scale and take app-composer knobs ([4e56f7a](https://github.com/Rixcy/orc-design-system/commit/4e56f7aa613f28126a6ea8769917c54a661d45a7))
* **orc-textarea,orc-input:** one glowing field surface ([1757dc2](https://github.com/Rixcy/orc-design-system/commit/1757dc29a2461429653c2f34ce62e4acd1d9b14e))
* **tokens:** emit derived roles in dist/tokens.json ([44d9d87](https://github.com/Rixcy/orc-design-system/commit/44d9d87e2b46279004386a17f86a812e28d86c0f))


### Bug Fixes

* **docs:** use the themed logomark on the Storybook intro page ([0c6ee46](https://github.com/Rixcy/orc-design-system/commit/0c6ee46e731c35228e998a080ace5f0d09cd76f0))
* **orc-glow-field:** drop the description IDREF when there is no description ([2a4df7b](https://github.com/Rixcy/orc-design-system/commit/2a4df7bdec89eaaa58d208e0778c0f46bc932238))
* **orc-navbar:** keep actions beside the brand at phone width ([03912ca](https://github.com/Rixcy/orc-design-system/commit/03912ca44a427a75ad0d8f27b108dc478235bb04))
* **orc-navbar:** reflow off the component's own width, not the viewport ([1cdbed3](https://github.com/Rixcy/orc-design-system/commit/1cdbed3bd8393b4ded5c65b7ddfd1ef165d352b2))

## [1.5.0](https://github.com/Rixcy/orc-design-system/compare/v1.4.2...v1.5.0) (2026-07-25)


### Features

* **orc-chip,orc-dialog:** match the documented chip shape, size the close target ([a55b359](https://github.com/Rixcy/orc-design-system/commit/a55b35977855d10207a33c495c4bb2fa238cb2e1))

## [1.4.2](https://github.com/Rixcy/orc-design-system/compare/v1.4.1...v1.4.2) (2026-07-25)


### Bug Fixes

* **orc-dialog:** only pad the body when a description is actually shown ([52a129f](https://github.com/Rixcy/orc-design-system/commit/52a129f3a9d0f16f742d1f093d9d227d4919caf9))

## [1.4.1](https://github.com/Rixcy/orc-design-system/compare/v1.4.0...v1.4.1) (2026-07-25)


### Bug Fixes

* **orc-dialog:** collapse the chrome row for a bare dialog ([d3f38dd](https://github.com/Rixcy/orc-design-system/commit/d3f38ddf9b8389ebd917100c9264442e29f8652a))

## [1.4.0](https://github.com/Rixcy/orc-design-system/compare/v1.3.0...v1.4.0) (2026-07-25)


### Features

* **orc-dialog:** allow a bare, positioned dialog surface ([2dd2cb8](https://github.com/Rixcy/orc-design-system/commit/2dd2cb8f78252756322cf739e4a817bd1871493e))

## [1.3.0](https://github.com/Rixcy/orc-design-system/compare/v1.2.0...v1.3.0) (2026-07-25)


### Features

* **components:** reflect disabled and open as properties ([004e504](https://github.com/Rixcy/orc-design-system/commit/004e504f3378741665ada177357a74b4a375cd8e))

## [1.2.0](https://github.com/Rixcy/orc-design-system/compare/v1.1.0...v1.2.0) (2026-07-25)


### Features

* **orc-dialog:** add a description slot wired to the accessible description ([f0f8c6f](https://github.com/Rixcy/orc-design-system/commit/f0f8c6f885a45aca0866addebeca27b64df571e3))
* **storybook:** theme manager chrome and brand from Orc tokens ([3e14bca](https://github.com/Rixcy/orc-design-system/commit/3e14bca0aefe7b14cff247389ad101f3280f89ec))


### Bug Fixes

* **components:** give ghost button real surface and pressed state ([5fbbec4](https://github.com/Rixcy/orc-design-system/commit/5fbbec46c97aeebad340e9376afa2652826ac196))
* **stepper:** render a fully complete state ([6ac6c4d](https://github.com/Rixcy/orc-design-system/commit/6ac6c4dabcfaa20bbfe49316375dd97198d3a7ae))
* **stories:** reuse one theme controller and trim theme-toggle stories ([bba0f2f](https://github.com/Rixcy/orc-design-system/commit/bba0f2f036d120f0b6724a0095c9d28d8f10ddd2))
* **stories:** stop chip story stretching chips to surface height ([2a495f2](https://github.com/Rixcy/orc-design-system/commit/2a495f2dc681188fd250e380f72b53881c07ab63))
* **stories:** use orc-button in dialog story trigger and footer ([18f9da7](https://github.com/Rixcy/orc-design-system/commit/18f9da70c8d8a1800e478309c624162762635a98))
* **storybook:** trim oversized story surface slabs ([dee4d1b](https://github.com/Rixcy/orc-design-system/commit/dee4d1b200e3b2c88c0d7c46548417e77efc9a4a))

## [1.1.0](https://github.com/Rixcy/orc-design-system/compare/v1.0.1...v1.1.0) (2026-07-24)


### Features

* **components:** add orc-logomark lockup element ([e21e732](https://github.com/Rixcy/orc-design-system/commit/e21e73259d76a52246b210633b3efa638b8a7fed))
* **site:** add orc emblem favicon to landing page ([0bca8ad](https://github.com/Rixcy/orc-design-system/commit/0bca8adf3db84e2a99d066d51684052c2d9f8f33))

## [1.0.1](https://github.com/Rixcy/orc-design-system/compare/v1.0.0...v1.0.1) (2026-07-24)


### Bug Fixes

* **orc-glow-field:** restore accent focus ring to match orc composer ([06ee134](https://github.com/Rixcy/orc-design-system/commit/06ee134f91252d7bc4f829317de3290260e5148e))
