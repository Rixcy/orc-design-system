import { copyFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const source = fileURLToPath(import.meta.resolve("@orc/design-system/preflight.js"));
const publicDir = fileURLToPath(new URL("../public/", import.meta.url));
await mkdir(publicDir, { recursive: true });
await copyFile(source, new URL("orc-preflight.js", new URL("../public/", import.meta.url)));
