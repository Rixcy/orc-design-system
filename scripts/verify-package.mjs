import { access, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const packageJson = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
const expectedExports = [
  '.',
  './define',
  './controller',
  './tokens.json',
  './tokens.css',
  './components.css',
  './fonts.css',
  './scrollbar.css',
  './typography.css',
  './preflight.js',
  './assets/orc-logo.svg',
  './assets/orc-icon.svg',
  './fonts/inter-latin-wght-normal.woff2',
  './fonts/jetbrains-mono-latin-wght-normal.woff2',
];

const actualExports = Object.keys(packageJson.exports ?? {});
if (JSON.stringify(actualExports) !== JSON.stringify(expectedExports)) {
  throw new Error(`Package exports changed. Expected ${expectedExports.join(', ')}; received ${actualExports.join(', ')}.`);
}

const expectedFiles = [
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
  'dist/assets/orc-logo.svg',
  'dist/assets/orc-icon.svg',
  'dist/assets/ASSETS.md',
  'dist/fonts/inter-latin-wght-normal.woff2',
  'dist/fonts/jetbrains-mono-latin-wght-normal.woff2',
  'dist/fonts/LICENSE.txt',
  'dist/fonts/PROVENANCE.md',
];

await Promise.all(expectedFiles.map((file) => access(resolve(root, file))));

for (const font of expectedFiles.filter((file) => file.endsWith('.woff2'))) {
  const bytes = await readFile(resolve(root, font));
  if (bytes.subarray(0, 4).toString('ascii') !== 'wOF2') {
    throw new Error(`${font} is not a valid WOFF2 file.`);
  }
}

const preflight = await readFile(resolve(root, 'dist/preflight.js'), 'utf8');
if (/^\s*(?:import|export)\s/mu.test(preflight)) {
  throw new Error('dist/preflight.js contains ESM syntax and cannot run as a classic head script.');
}

const design = JSON.parse(await readFile(resolve(root, '.impeccable/design.json'), 'utf8'));
const designKeys = Object.keys(design);
const extensionKeys = Object.keys(design.extensions ?? {});
if (JSON.stringify(designKeys) !== JSON.stringify(['schemaVersion', 'title', 'extensions', 'narrative'])) {
  throw new Error(`design.json contains non-durable top-level fields: ${designKeys.join(', ')}.`);
}
if (JSON.stringify(extensionKeys) !== JSON.stringify(['colorMeta', 'typographyMeta', 'motion'])) {
  throw new Error(`design.json extensions must contain only colorMeta, typographyMeta, and motion.`);
}
if ('components' in design || 'generatedAt' in design) {
  throw new Error('design.json must not contain generated component inventory or timestamps.');
}

const tokens = await readFile(resolve(root, 'dist/tokens.css'), 'utf8');
const tokenNames = [
  'bg', 'panel', 'border', 'text', 'heading', 'muted', 'accent', 'accent-soft', 'chip', 'code',
  'green', 'yellow', 'red', 'purple', 'cyan', 'orange', 'gate', 'muted-strong',
  'accent-text', 'red-text', 'yellow-text', 'green-text', 'purple-text', 'accent-strong',
  'control-border', 'button-hover', 'button-hover-chip', 'button-hover-strong',
];
const missingTokens = tokenNames.filter((name) => !tokens.includes(`--orc-${name}:`));
if (missingTokens.length > 0) {
  throw new Error(`Token contract is missing: ${missingTokens.join(', ')}.`);
}
if (tokens.includes('@font-face') || tokens.includes('"Inter"') || tokens.includes('"JetBrains Mono"')) {
  throw new Error('tokens.css must retain platform-font defaults; packaged fonts belong in opt-in fonts.css.');
}

const themeProvenance = JSON.parse(await readFile(resolve(root, 'src/theme/orc-theme.provenance.json'), 'utf8'));
const sourceHashes = new Map([
  ...Object.entries(themeProvenance.artifacts).map(([file, record]) => [file, record.sha256]),
  ['src/assets/fonts/inter-latin-wght-normal.woff2', '3100e775e8616cd2611beecfa23a4263d7037586789b43f035236a2e6fbd4c62'],
  ['src/assets/fonts/jetbrains-mono-latin-wght-normal.woff2', '18be452724bfdc236c074ca94a249a7f41a86752c7d04ab258ce9ed5651f6a7e'],
  ['src/assets/fonts/LICENSE.txt', '8dc31394ae6cedbd627afec44c752a2733e5b036d69d5215b078ef976e95db6e'],
]);
for (const [file, expectedHash] of sourceHashes) {
  const hash = createHash('sha256').update(await readFile(resolve(root, file))).digest('hex');
  if (hash !== expectedHash) {
    throw new Error(`${file} no longer matches its recorded Orc source (${hash}).`);
  }
}

const packagedTokens = JSON.parse(await readFile(resolve(root, 'dist/tokens.json'), 'utf8'));
if (JSON.stringify(Object.keys(packagedTokens)) !== JSON.stringify(['day', 'night'])) {
  throw new Error('tokens.json must expose ordered day and night palettes.');
}

console.log(`Verified ${actualExports.length} exports, ${expectedFiles.length} package files, curated design guidance, and source provenance.`);
