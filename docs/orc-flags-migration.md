# Orc Flags token migration

Orc Flags remains unchanged in this run. Validate adoption in a separate run after consuming a published or otherwise approved package identity.

## Temporary alias layer

Import `@orc/design-system/tokens.css`, then map these 27 app names one-for-one to their `--orc-*` equivalents:

```css
--bg --panel --border --text --heading --muted --accent --accent-soft --chip --code
--green --yellow --red --purple --cyan --orange --gate --muted-strong
--accent-text --red-text --yellow-text --green-text --purple-text --accent-strong
--button-hover --button-hover-chip --button-hover-strong
```

Keep `--z-sticky`, all `--confetti-*`, and `--timer-progress` app-local; they describe Orc Flags layout/game behavior, not design-system foundations.

## Follow-up sequence

1. Install the approved package and import `tokens.css` before Orc Flags styles.
2. Add the exact temporary alias layer from `fixtures/vite-consumer/src/orc-flags-aliases.css` and remove duplicated theme values only after both explicit themes match.
3. Copy the exported classic `preflight.js` into Orc Flags public output and load it synchronously in `<head>` with `data-storage-key="orcTheme"`.
4. Replace the inline controller/navbar/toggle with `defineOrcElements()` and one disposable `createThemeController()` owner.
5. Verify system/light/dark, storage denial, OS changes, multiple toggles, theme-color meta, focus, announcements, and teardown before deleting aliases.
