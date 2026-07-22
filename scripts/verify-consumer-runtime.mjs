import { createReadStream } from "node:fs";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve } from "node:path";

import { chromium } from "playwright";

const root = resolve(import.meta.dirname, "../fixtures/vite-consumer/dist");
const mime = new Map([
  [".css", "text/css"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript"],
  [".svg", "image/svg+xml"],
  [".woff2", "font/woff2"],
]);
const server = createServer(async (request, response) => {
  const pathname = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
  const requested = pathname === "/" ? "index.html" : pathname.slice(1);
  const file = resolve(root, requested);
  if (!file.startsWith(`${root}/`)) {
    response.writeHead(403).end();
    return;
  }
  try {
    await readFile(file);
    response.setHeader("Content-Type", mime.get(extname(file)) ?? "application/octet-stream");
    createReadStream(file).pipe(response);
  } catch {
    response.writeHead(404).end();
  }
});

await new Promise((resolveListening) => server.listen(0, "127.0.0.1", resolveListening));
const address = server.address();
if (!address || typeof address === "string") throw new Error("Consumer proof server failed.");
const origin = `http://127.0.0.1:${address.port}`;
const browser = await chromium.launch({ headless: true });

try {
  for (const mode of ["light", "dark"]) {
    const context = await browser.newContext();
    await context.addInitScript((savedMode) => localStorage.setItem("orcTheme", savedMode), mode);
    const page = await context.newPage();
    const errors = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));
    await page.route("**/assets/*.js", (route) => route.abort());
    await page.goto(origin, { waitUntil: "domcontentloaded" });
    const applied = await page.locator("html").getAttribute("data-theme");
    if (applied !== mode) throw new Error(`Preflight did not apply saved ${mode}; got ${applied}.`);
    if (errors.some((error) => /content security policy|refused to (?:execute|load)/iu.test(error))) {
      throw new Error(`Consumer CSP blocked preflight: ${errors.join(" | ")}`);
    }
    await context.close();
  }
} finally {
  await browser.close();
  await new Promise((resolveClosed, reject) =>
    server.close((error) => (error ? reject(error) : resolveClosed())),
  );
}

console.log("Verified parser-time light/dark preflight execution under fixture CSP.");
