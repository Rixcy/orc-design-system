import { resolve } from 'node:path';

import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(import.meta.dirname, 'src/index.ts'),
        define: resolve(import.meta.dirname, 'src/define.ts'),
        controller: resolve(import.meta.dirname, 'src/theme/controller.ts'),
      },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    sourcemap: true,
  },
  plugins: [
    dts({
      entryRoot: 'src',
      include: ['src'],
      outDirs: 'dist',
      tsconfigPath: './tsconfig.build.json',
    }),
  ],
});
