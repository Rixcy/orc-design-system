import { mkdir, readFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const root = resolve(import.meta.dirname, '..');
const artifacts = resolve(root, 'artifacts');
const packageJson = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
const tarballStem = packageJson.name.replace(/^@/u, '').replaceAll('/', '-');
const tarballName = `${tarballStem}-${packageJson.version}.tgz`;
const tarballPath = resolve(artifacts, tarballName);

await mkdir(artifacts, { recursive: true });
await rm(tarballPath, { force: true });

const result = spawnSync(
  'bun',
  ['pm', 'pack', '--quiet', '--destination', artifacts],
  { cwd: root, encoding: 'utf8' },
);

if (result.status !== 0) {
  throw new Error(`bun pm pack failed:\n${result.stderr.trim()}`);
}

const packed = result.stdout.trim().split('\n').at(-1);
if (packed !== tarballPath) {
  throw new Error(`Unexpected tarball ${packed}; expected ${tarballName}.`);
}

// ponytail: bun pm pack has no --json, so read the tarball back for its manifest.
const listing = spawnSync('tar', ['-tzf', tarballPath], { encoding: 'utf8' });
if (listing.status !== 0) {
  throw new Error(`Could not list ${tarballName}:\n${listing.stderr.trim()}`);
}
const packedPaths = new Set(
  listing.stdout.split('\n')
    .filter((path) => path && !path.endsWith('/'))
    .map((path) => path.replace(/^package\//u, '')),
);
const tarball = await readFile(tarballPath);
const packResult = {
  entryCount: packedPaths.size,
  size: tarball.byteLength,
  integrity: `sha512-${createHash('sha512').update(tarball).digest('base64')}`,
};
const requiredPaths = [
  'package.json',
  'dist/index.js',
  'dist/index.d.ts',
  'dist/define.js',
  'dist/define.d.ts',
  'dist/controller.js',
  'dist/controller.d.ts',
  'dist/tokens.json',
  'dist/tokens.css',
  'dist/components.css',
  'dist/fonts.css',
  'dist/scrollbar.css',
  'dist/typography.css',
  'dist/preflight.js',
  'LICENSE',
  'README.md',
  'dist/assets/orc-logo.svg',
  'dist/assets/orc-icon.svg',
  'dist/assets/ASSETS.md',
  'dist/fonts/inter-latin-wght-normal.woff2',
  'dist/fonts/jetbrains-mono-latin-wght-normal.woff2',
  'dist/fonts/LICENSE.txt',
  'dist/fonts/PROVENANCE.md',
];
const missing = requiredPaths.filter((path) => !packedPaths.has(path));
if (missing.length > 0) {
  throw new Error(`Packed tarball is missing: ${missing.join(', ')}.`);
}

const generatedPaths = [
  'dist/controller.d.ts.map',
  'dist/controller.js.map',
  'dist/define.d.ts.map',
  'dist/index.d.ts.map',
];
// ponytail: per-component and per-theme declarations are tsc output that grows with
// every new component — match the shape instead of relisting them on each addition.
const declarationPattern = /^dist\/(components|theme)\/[a-z-]+\.d\.ts(\.map)?$/u;
const exactPaths = new Set([...requiredPaths, ...generatedPaths]);
const chunkPattern = /^dist\/(define|registry)-[A-Za-z0-9_-]+\.js$/u;
const unexpected = [...packedPaths].filter((path) => (
  !exactPaths.has(path)
  && !declarationPattern.test(path)
  && !chunkPattern.test(path)
  && !chunkPattern.test(path.replace(/\.map$/u, ''))
));
if (unexpected.length > 0) {
  throw new Error(`Packed tarball has unexpected files: ${unexpected.join(', ')}.`);
}
for (const prefix of ['define', 'registry']) {
  const chunks = [...packedPaths].filter((path) => path.match(chunkPattern)?.[1] === prefix);
  if (chunks.length !== 1 || !packedPaths.has(`${chunks[0]}.map`)) {
    throw new Error(`Packed tarball must contain one ${prefix} chunk and its source map.`);
  }
}

console.log(JSON.stringify({
  filename: `artifacts/${tarballName}`,
  files: packResult.entryCount,
  size: packResult.size,
  integrity: packResult.integrity,
}, null, 2));
