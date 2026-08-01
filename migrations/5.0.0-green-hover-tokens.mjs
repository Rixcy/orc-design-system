export const description =
  "--orc-button-hover and --orc-button-hover-chip resolve through --orc-green instead of --orc-accent";

// Report-only, like 3.0.0 and 4.0.0: hover tint is a design decision, and
// pinning the old accent-blue values everywhere would opt every consumer out
// of the change by default.
export function run({ files, read, report }) {
  for (const file of files) {
    const text = read(file);
    if (text.includes("--orc-button-hover"))
      report(file, "sets a button hover token — confirm it against the new green tint");
    else if (text.includes("--orc-accent"))
      report(file, "uses --orc-accent — check nothing relied on it tinting hover or tab selection");
  }
}
