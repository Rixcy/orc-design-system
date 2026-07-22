import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const html = await readFile(resolve(root, "dist/index.html"), "utf8");
const aliasCss = await readFile(resolve(root, "src/orc-flags-aliases.css"), "utf8");

if (!html.includes(`script-src 'self'`)) throw new Error("Fixture CSP must allow scripts from self only.");
if (!html.includes('src="/orc-preflight.js"')) throw new Error("Classic preflight is missing from built HTML.");
if (/<script(?![^>]*\bsrc=)[^>]*>/u.test(html)) throw new Error("Built fixture contains an inline script.");
await access(resolve(root, "dist/orc-preflight.js"));

const aliases = [
  "bg", "panel", "border", "text", "heading", "muted", "accent", "accent-soft", "chip", "code",
  "green", "yellow", "red", "purple", "cyan", "orange", "gate", "muted-strong", "accent-text",
  "red-text", "yellow-text", "green-text", "purple-text", "accent-strong", "button-hover",
  "button-hover-chip", "button-hover-strong",
];
const missing = aliases.filter((name) => !aliasCss.includes(`--${name}: var(--orc-${name});`));
if (missing.length) throw new Error(`Missing Orc Flags aliases: ${missing.join(", ")}.`);
for (const local of ["z-sticky", "confetti", "timer-progress"]) {
  if (aliasCss.includes(`--${local}:`)) throw new Error(`App-local --${local} must not be aliased.`);
}

console.log(`Verified strict-CSP preflight and ${aliases.length} temporary Orc Flags aliases.`);
