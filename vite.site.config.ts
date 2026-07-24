import { defineConfig } from "vite";

// ponytail: separate config — Vite lib mode (vite.config.ts) and an HTML app
// build cannot share one config. This one owns the landing page only.
export default defineConfig({
  root: "site",
  base: "./",
  build: {
    outDir: "../site-dist",
    emptyOutDir: true,
  },
});
