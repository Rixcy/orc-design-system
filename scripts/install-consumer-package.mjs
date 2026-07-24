import { copyFile, readFile, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const fixture = resolve(root, "fixtures/vite-consumer");
const installedPackage = resolve(fixture, "node_modules/@orc/design-system");
const packageJson = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
const tarballName = `${packageJson.name.replace(/^@/u, "").replaceAll("/", "-")}-${packageJson.version}.tgz`;
const tarball = resolve(root, "artifacts", tarballName);
const fixturePackageJson = JSON.parse(await readFile(resolve(fixture, "package.json"), "utf8"));
const declaredTarball = resolve(
  fixture,
  fixturePackageJson.dependencies["@orc/design-system"].replace(/^file:/u, ""),
);

// The proof package keeps a development version, so the fixture always depends on
// the same path; --force re-extracts it instead of reusing a stale cached copy.
await copyFile(tarball, declaredTarball);
await rm(installedPackage, { recursive: true, force: true });

const result = spawnSync("bun", ["install", "--force"], {
  cwd: fixture,
  encoding: "utf8",
  stdio: "inherit",
});
if (result.status !== 0) {
  throw new Error(`Consumer package install failed with status ${result.status ?? "unknown"}.`);
}
