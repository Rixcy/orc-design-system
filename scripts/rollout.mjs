import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { PACKAGE, bumpDependency, dependencyField, installer, migrate, parseVersion } from "../bin/lib.mjs";

const root = resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const openPr = args.includes("--pr");
const only = args.filter((arg) => !arg.startsWith("--"));

const version = JSON.parse(await readFile(resolve(root, "package.json"), "utf8")).version;
const consumers = JSON.parse(await readFile(resolve(root, "consumers.json"), "utf8"))
  .map((path) => resolve(root, path))
  .filter((path) => only.length === 0 || only.some((name) => path.endsWith(name)));

function run(cwd, command, commandArgs) {
  return spawnSync(command, commandArgs, { cwd, encoding: "utf8" });
}

const summary = [];
for (const dir of consumers) {
  const name = dir.slice(dir.lastIndexOf("/") + 1);
  const record = (state, detail) => summary.push({ name, state, detail });

  const manifestPath = resolve(dir, "package.json");
  if (!existsSync(manifestPath)) {
    record("skipped", "no package.json");
    continue;
  }
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const field = dependencyField(manifest);
  if (!field) {
    record("skipped", `does not depend on ${PACKAGE}`);
    continue;
  }
  const from = parseVersion(manifest[field][PACKAGE]);
  if (from === version) {
    record("current", version);
    continue;
  }
  if (run(dir, "git", ["status", "--porcelain"]).stdout.trim()) {
    record("skipped", "uncommitted changes");
    continue;
  }

  console.log(`\n=== ${name}: ${from} → ${version} ===`);
  const notes = (await migrate({ dir, from, to: version, dryRun })).flatMap((result) => result.notes);
  for (const note of notes) console.log(`  needs you: ${note.file.slice(dir.length + 1)} — ${note.message}`);

  if (dryRun) {
    record("dry run", `${notes.length} item(s) need a decision`);
    continue;
  }

  const branch = `chore/orc-ds-${version}`;
  const branched = run(dir, "git", ["checkout", "-b", branch]);
  if (branched.status !== 0) {
    record("failed", `git checkout: ${branched.stderr.trim()}`);
    continue;
  }

  await bumpDependency(dir, version);
  const [command, commandArgs] = installer(dir);
  if (run(dir, command, commandArgs).status !== 0) {
    record("needs hands", `${command} install failed`);
    continue;
  }

  const failed = ["build", "test"]
    .filter((script) => manifest.scripts?.[script])
    .find((script) => run(dir, command, ["run", script]).status !== 0);
  if (failed) {
    record("needs hands", `${failed} failed on ${branch}`);
    continue;
  }

  run(dir, "git", ["commit", "-am", `chore(deps): orc design system ${version}`]);
  if (openPr) {
    run(dir, "git", ["push", "-u", "origin", branch]);
    const pr = run(dir, "gh", ["pr", "create", "--fill"]);
    record(pr.status === 0 ? "pr opened" : "committed", pr.status === 0 ? pr.stdout.trim() : "gh pr create failed");
    continue;
  }
  record("committed", `${branch}${notes.length ? `, ${notes.length} item(s) need a decision` : ""}`);
}

console.log("");
for (const { name, state, detail } of summary) console.log(`${name.padEnd(20)} ${state.padEnd(12)} ${detail}`);
if (!dryRun && !openPr) console.log("\nNothing pushed. Review each branch, then re-run with --pr.");
