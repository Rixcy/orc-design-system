export const description =
  "--orc-focus-ring is now a 1px green hairline, not an accent-blue ring";

// Report-only: whether the new ring is right for a given app is a design
// decision, and a codemod that pins the old value everywhere would freeze every
// consumer on the old look by default.
export function run({ files, read, report }) {
  for (const file of files) {
    const text = read(file);
    if (text.includes("--orc-focus-ring"))
      report(file, "overrides or reads --orc-focus-ring — confirm it still means what you want");
    else if (text.includes(":focus-visible"))
      report(file, "styles :focus-visible — check it against the green hairline, or set --orc-focus-ring yourself");
  }
}
