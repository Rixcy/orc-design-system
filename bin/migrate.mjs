#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { migrate, parseVersion } from "./lib.mjs";

const root = resolve(import.meta.dirname, "..");

function relative(dir, file) {
  return file.startsWith(dir) ? file.slice(dir.length + 1) : file;
}

const args = process.argv.slice(2);
const flag = (name) => {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? undefined : args[index + 1];
};
const dir = resolve(flag("dir") ?? process.cwd());
const dryRun = args.includes("--dry-run");
const to = flag("to") ?? JSON.parse(await readFile(resolve(root, "package.json"), "utf8")).version;
const from =
  flag("from") ??
  parseVersion(
    JSON.parse(await readFile(resolve(dir, "package.json"), "utf8")).dependencies?.[
      "@orc-tools/orc-design-system"
    ],
  );

const results = await migrate({ dir, from: parseVersion(from), to: parseVersion(to), dryRun });
if (results.length === 0) {
  console.log(`No migrations between ${from} and ${to}.`);
  process.exit(0);
}

let attention = 0;
for (const result of results) {
  console.log(`\n${result.version} — ${result.description}`);
  for (const file of result.changes) console.log(`  ${dryRun ? "would edit" : "edited"} ${relative(dir, file)}`);
  for (const note of result.notes) {
    attention += 1;
    console.log(`  needs you: ${relative(dir, note.file)} — ${note.message}`);
  }
  if (result.changes.length === 0 && result.notes.length === 0) console.log("  nothing to do");
}
console.log(
  `\n${dryRun ? "Dry run. " : "Files written, nothing committed. "}${attention} item(s) need a decision from you.`,
);
