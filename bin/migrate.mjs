#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { PACKAGE, bumpDependency, dependencyField, installer, migrate, parseVersion } from "./lib.mjs";

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
// `upgrade` also moves the dependency; `migrate` (the default) only runs codemods.
const command = args.find((arg) => !arg.startsWith("--")) ?? "migrate";
const to = parseVersion(
  flag("to") ?? JSON.parse(await readFile(resolve(root, "package.json"), "utf8")).version,
);
const manifest = JSON.parse(await readFile(resolve(dir, "package.json"), "utf8"));
const field = dependencyField(manifest);
if (!flag("from") && field === null) {
  console.error(`${dir} does not depend on ${PACKAGE}. Install it first, or pass --from.`);
  process.exit(1);
}
const from = parseVersion(flag("from") ?? manifest[field][PACKAGE]);

if (from === to) {
  console.log(
    `Already on ${to}. If a newer release exists, this ran an older copy of the CLI — use \`npx ${PACKAGE}@latest ${command}\`.`,
  );
  process.exit(0);
}

if (command === "upgrade" && !dryRun) {
  const range = await bumpDependency(dir, to);
  const [installCommand, installArgs] = installer(dir);
  console.log(`${PACKAGE} ${from} → ${range}, running ${installCommand} ${installArgs.join(" ")}…`);
  if (spawnSync(installCommand, installArgs, { cwd: dir, stdio: "inherit" }).status !== 0) {
    console.error(`${installCommand} install failed. package.json is bumped; install by hand, then re-run.`);
    process.exit(1);
  }
}

if (command === "upgrade" && dryRun) console.log(`Would move ${PACKAGE} ${from} → ${to} and install.`);

const results = await migrate({ dir, from, to, dryRun });
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
