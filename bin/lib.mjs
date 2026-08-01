import { existsSync } from "node:fs";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
export const PACKAGE = "@orc-tools/orc-design-system";
const SOURCE_EXTENSIONS = new Set([
  ".astro",
  ".css",
  ".html",
  ".js",
  ".json",
  ".jsx",
  ".mdx",
  ".svelte",
  ".ts",
  ".tsx",
  ".vue",
]);
const SKIPPED_DIRECTORIES = new Set([
  ".astro",
  ".git",
  ".next",
  ".output",
  ".vercel",
  ".svelte-kit",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "storybook-static",
]);

// ponytail: numeric-only comparison. Prereleases sort as their release, which is
// wrong for 3.0.0-beta.1; use a semver library the day a prerelease ships.
function compareVersions(left, right) {
  const a = left.split(".").map(Number);
  const b = right.split(".").map(Number);
  for (let index = 0; index < 3; index += 1) {
    if ((a[index] ?? 0) !== (b[index] ?? 0)) return (a[index] ?? 0) - (b[index] ?? 0);
  }
  return 0;
}

export function parseVersion(range) {
  const match = /\d+\.\d+\.\d+/u.exec(range ?? "");
  if (!match) throw new Error(`Cannot read a version from "${range}".`);
  return match[0];
}

export function installer(dir) {
  if (existsSync(resolve(dir, "bun.lock"))) return ["bun", ["install"]];
  if (existsSync(resolve(dir, "pnpm-lock.yaml"))) return ["pnpm", ["install"]];
  return ["npm", ["install"]];
}

export function dependencyField(manifest) {
  if (manifest.dependencies?.[PACKAGE]) return "dependencies";
  if (manifest.devDependencies?.[PACKAGE]) return "devDependencies";
  return null;
}

// Keep whatever range style the consumer chose; only the version moves.
export async function bumpDependency(dir, version) {
  const manifestPath = resolve(dir, "package.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const field = dependencyField(manifest);
  if (!field) return null;
  manifest[field][PACKAGE] = manifest[field][PACKAGE].replace(/\d+\.\d+\.\d+/u, version);
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest[field][PACKAGE];
}

export function selectMigrations(names, from, to) {
  return names
    .filter((name) => name.endsWith(".mjs"))
    .map((name) => ({ name, version: parseVersion(name) }))
    .filter(({ version }) => compareVersions(version, from) > 0 && compareVersions(version, to) <= 0)
    .sort((a, b) => compareVersions(a.version, b.version));
}

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (SKIPPED_DIRECTORIES.has(entry.name)) continue;
      files.push(...(await collectFiles(path)));
      continue;
    }
    if (SOURCE_EXTENSIONS.has(entry.name.slice(entry.name.lastIndexOf("."))))
      files.push(path);
  }
  return files;
}

export async function migrate({ dir, from, to, dryRun }) {
  const files = await collectFiles(dir);
  const contents = new Map(
    await Promise.all(files.map(async (file) => [file, await readFile(file, "utf8")])),
  );
  const migrationNames = await readdir(resolve(root, "migrations"));
  const results = [];

  for (const { name, version } of selectMigrations(migrationNames, from, to)) {
    const migration = await import(resolve(root, "migrations", name));
    const changes = [];
    const notes = [];
    await migration.run({
      files,
      read: (file) => contents.get(file),
      // A transform returning null means "nothing to do here".
      edit(file, transform) {
        const next = transform(contents.get(file));
        if (next === null || next === contents.get(file)) return false;
        contents.set(file, next);
        changes.push(file);
        return true;
      },
      report: (file, message) => notes.push({ file, message }),
    });
    results.push({ version, description: migration.description, changes, notes });
  }

  if (!dryRun) {
    const touched = new Set(results.flatMap((result) => result.changes));
    await Promise.all([...touched].map((file) => writeFile(file, contents.get(file))));
  }
  return results;
}

function relative(dir, file) {
  return file.startsWith(dir) ? file.slice(dir.length + 1) : file;
}
