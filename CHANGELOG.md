# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

## [5.4.0](https://github.com/Rixcy/orc-design-system/compare/v5.3.0...v5.4.0) (2026-08-04)


### Features

* **callout:** add orc-callout notice component (Ticket-1) ([d6f42b5](https://github.com/Rixcy/orc-design-system/commit/d6f42b50895c63a9d897eee8d3e44a71e67cbddc))
* **checkbox:** add orc-checkbox component (Ticket-1) ([fddf680](https://github.com/Rixcy/orc-design-system/commit/fddf680a120bb6bb98279de80bfbf595679095e5))
* **controls:** add compact input and menu APIs (Ticket-1) ([07680ad](https://github.com/Rixcy/orc-design-system/commit/07680ad0495082522581fc6ede691ad6782b8645))
* **site:** add checkbox demo to the homepage (Ticket-2) ([aeeb8e6](https://github.com/Rixcy/orc-design-system/commit/aeeb8e63e10e693b8753abb8f10ab96a3050d6f0))
* **site:** add the callout demo to the homepage (Ticket-2) ([34c4736](https://github.com/Rixcy/orc-design-system/commit/34c473682be00aa302afbfe7f63cf3ab7f0dd873))
* **site:** add the switch demo to the homepage (Ticket-2) ([dcbf8b8](https://github.com/Rixcy/orc-design-system/commit/dcbf8b8639f7c531b76a9f32f477666091cd1403))
* **switch:** add orc-switch toggle component (Ticket-1) ([ee4b5bd](https://github.com/Rixcy/orc-design-system/commit/ee4b5bdfbae0b4d0b2a712d3a1410e945f92d236))


### Bug Fixes

* **callout:** keep body text neutral and radius above chip (Ticket-1) ([a1ccacf](https://github.com/Rixcy/orc-design-system/commit/a1ccacf3eacf0c67769b1553368ba9e957e5bbf0))
* **checkbox:** keep property-set state through attribute changes (Ticket-1) ([482b748](https://github.com/Rixcy/orc-design-system/commit/482b74871bdd6dcdb4f3a1ba29f463e217a3cea5))
* **checkbox:** stop the label selecting its own text (Ticket-3) ([9956a74](https://github.com/Rixcy/orc-design-system/commit/9956a74adefce7077f719cd20d8ab40203dba074))
* **site:** stack checkbox demos in the block stage (Ticket-2) ([810bf9b](https://github.com/Rixcy/orc-design-system/commit/810bf9bcfaa4f7d45fe8fcb495e5ec7a651eb89f))
* **switch:** dim the whole control when disabled (Ticket-1) ([c52a016](https://github.com/Rixcy/orc-design-system/commit/c52a01692e6c9139a17b8eddfb77cf2cff116090))
* **switch:** stop the label selecting its own text (Ticket-3) ([e0c4994](https://github.com/Rixcy/orc-design-system/commit/e0c4994ffb21b65eecda11d5e17bf6d000e223bd))
* **tabs:** integrate focus with bottom edge (Ticket-1) ([ab8397c](https://github.com/Rixcy/orc-design-system/commit/ab8397caaf81a1ffc8d18434a2a67a5772d70bd2))
* **tabs:** prevent focus treatment growth (Ticket-1) ([6dcda0e](https://github.com/Rixcy/orc-design-system/commit/6dcda0eb15047be861477a78404a88d9a6de3f51))
* **tabs:** refine focus styling (Ticket-1) ([60db5fc](https://github.com/Rixcy/orc-design-system/commit/60db5fcd79d145cb9f11e2cfcb819b7b4b27d1f7))

## [5.3.0](https://github.com/Rixcy/orc-design-system/compare/v5.2.0...v5.3.0) (2026-08-02)


### Features

* **combobox:** add reusable action foundation ([f8b3e47](https://github.com/Rixcy/orc-design-system/commit/f8b3e47ee38122186c13d982d2e8b814335c9a8f))
* **copy-button:** add orc-copy-button ([9cbe86a](https://github.com/Rixcy/orc-design-system/commit/9cbe86a7ec77425c236bb50f25016401581b121d))
* **menu:** add reusable floating layer foundation ([c154450](https://github.com/Rixcy/orc-design-system/commit/c15445057a55b7382e4ca998fc1999e0df821b40))
* **orc-icon-button:** add icon-only button with link support ([1ad27de](https://github.com/Rixcy/orc-design-system/commit/1ad27de0533da201219fbc6d787d681449b3495f))
* **prose:** add opt-in .orc-prose stylesheet ([78dc496](https://github.com/Rixcy/orc-design-system/commit/78dc496fe4cd93a220c6c29261a2cce49789976b))
* **select:** add disable-search override ([4aed134](https://github.com/Rixcy/orc-design-system/commit/4aed13499e484f7fd23045411a2543ff2b0ceea2))
* **site:** add recent components to landing page ([d095ab5](https://github.com/Rixcy/orc-design-system/commit/d095ab5fb3b472915349e69233a88fd4013464a0))


### Bug Fixes

* **combobox:** align focus offset fallback ([5079322](https://github.com/Rixcy/orc-design-system/commit/50793224d7514630d14d89732ea5f21120dbdec7))
* **combobox:** close interaction gaps ([8730eea](https://github.com/Rixcy/orc-design-system/commit/8730eea1511aacd2a0c97be73b8eb95630965892))
* **copy-button:** clear the outcome state when the button is removed ([d74f137](https://github.com/Rixcy/orc-design-system/commit/d74f137fc0047393bb37b411fd5e80319bbc4971))
* **menu:** correct empty-state semantics ([704f680](https://github.com/Rixcy/orc-design-system/commit/704f680134168b51be7db193f7f1cba1ff0bf898))
* **menu:** restore floating layer after reconnect ([2f9ac7f](https://github.com/Rixcy/orc-design-system/commit/2f9ac7f618b0eb0dc324fb0e3048cd5968caa3d3))
* **orc-icon-button:** keep focus across control swap, drop empty accessible name ([75175ef](https://github.com/Rixcy/orc-design-system/commit/75175ef6d96a0b108b3d1ad4abaf9f0672aeefc4))
* **orc-icon-button:** refocus the swapped control after its href lands ([e1ca945](https://github.com/Rixcy/orc-design-system/commit/e1ca9459b63d17523ced64a7b125ade718d1867c))
* **prose:** underline links and document the table trade-off ([45f39d9](https://github.com/Rixcy/orc-design-system/commit/45f39d9628afb6d4cab2e40365b142b23cc67331))
* **select:** name the open listbox, stop the open-animation opacity dip, correct multi-select order assertion ([cf5f302](https://github.com/Rixcy/orc-design-system/commit/cf5f302596cf23b08327b5f0c0080846bdf0fdb9))
* **select:** stabilize loading height ([9098066](https://github.com/Rixcy/orc-design-system/commit/9098066c92ef55d6d81c6483cba761b33da3187e))

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
