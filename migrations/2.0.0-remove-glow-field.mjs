export const description = "Replace orc-glow-field with orc-textarea and drop suppress-focus-ring";

export function run({ files, read, edit, report }) {
  for (const file of files) {
    const before = read(file);
    if (!before.includes("orc-glow-field") && !before.includes("OrcGlowField")) continue;

    const renamed = edit(file, (text) =>
      text
        .replaceAll("orc-glow-field", "orc-textarea")
        .replaceAll(/\s+suppress-focus-ring(=(["'])[^"']*\2)?/gu, ""),
    );
    if (renamed)
      report(file, "give the renamed <orc-textarea> an aria-label, and move any trailing controls into its footer slot");
    if (before.includes("OrcGlowField"))
      report(file, "OrcGlowField no longer exists — import OrcTextarea instead");
  }
}
