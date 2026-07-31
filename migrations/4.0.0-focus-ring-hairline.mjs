export const description =
  "--orc-focus-ring is 1px (was 2px) and --orc-focus-offset is 3px (was 2px)";

// Report-only for the same reason as 3.0.0: ring weight is a design decision,
// and pinning the old 2px everywhere would opt every consumer out by default.
export function run({ files, read, report }) {
  for (const file of files) {
    const text = read(file);
    if (text.includes("--orc-focus-ring") || text.includes("--orc-focus-offset"))
      report(file, "sets a focus token — confirm it against the new 1px ring at 3px offset");
    else if (text.includes("outline-offset") || text.includes(":focus-visible"))
      report(file, "styles focus directly — check it still lines up with the 1px/3px hairline");
  }
}
