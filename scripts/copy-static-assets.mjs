import { copyFile, mkdir, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const copies = [
  ['src/theme/orc-tokens.json', 'dist/tokens.json'],
  ['src/styles/tokens.css', 'dist/tokens.css'],
  ['src/styles/components.css', 'dist/components.css'],
  ['src/styles/fonts.css', 'dist/fonts.css'],
  ['src/theme/preflight.js', 'dist/preflight.js'],
  ['src/assets/orc-logo.svg', 'dist/assets/orc-logo.svg'],
  ['src/assets/orc-icon.svg', 'dist/assets/orc-icon.svg'],
  ['src/assets/ASSETS.md', 'dist/assets/ASSETS.md'],
  ['src/assets/fonts/inter-latin-wght-normal.woff2', 'dist/fonts/inter-latin-wght-normal.woff2'],
  ['src/assets/fonts/jetbrains-mono-latin-wght-normal.woff2', 'dist/fonts/jetbrains-mono-latin-wght-normal.woff2'],
  ['src/assets/fonts/LICENSE.txt', 'dist/fonts/LICENSE.txt'],
  ['src/assets/fonts/PROVENANCE.md', 'dist/fonts/PROVENANCE.md'],
];

const preflightSource = await readFile(resolve(root, 'src/theme/preflight.js'), 'utf8');
if (/^\s*(?:import|export)\s/mu.test(preflightSource)) {
  throw new Error('src/theme/preflight.js must remain a classic script without ESM syntax.');
}

for (const [sourcePath, outputPath] of copies) {
  const source = resolve(root, sourcePath);
  const output = resolve(root, outputPath);
  await mkdir(dirname(output), { recursive: true });
  await copyFile(source, output);
}

// vite-plugin-dts preserves source structure. Add the public controller alias
// while retaining dist/theme/controller.d.ts for root declaration re-exports.
await copyFile(resolve(root, 'dist/theme/controller.d.ts'), resolve(root, 'dist/controller.d.ts'));
const controllerMap = resolve(root, 'dist/theme/controller.d.ts.map');
try {
  await copyFile(controllerMap, resolve(root, 'dist/controller.d.ts.map'));
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}
