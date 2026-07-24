import { copyFile, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const fixture = resolve(root, "fixtures/vite-consumer");
const installedPackage = resolve(fixture, "node_modules/@orc/design-system");
const packageJson = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
const tarballName = `${packageJson.name.replace(/^@/u, "").replaceAll("/", "-")}-${packageJson.version}.tgz`;
const tarball = resolve(root, "artifacts", tarballName);
const temporaryDirectory = await mkdtemp(join(tmpdir(), "orc-consumer-package-"));
const uniqueTarball = resolve(temporaryDirectory, basename(tarball));

// The proof package keeps a development version, so npm may otherwise reuse a
// previous tarball with the same name/version and silently test stale exports.
try {
  await copyFile(tarball, uniqueTarball);
  await rm(installedPackage, { recursive: true, force: true });

  const result = spawnSync(
    "npm",
    ["install", "--no-audit", "--no-fund", "--no-save", "--package-lock=false", uniqueTarball],
    { cwd: fixture, encoding: "utf8", stdio: "inherit" },
  );
  if (result.status !== 0) {
    throw new Error(`Consumer package install failed with status ${result.status ?? "unknown"}.`);
  }
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
