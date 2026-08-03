import { createReadStream } from "node:fs";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve } from "node:path";

import { chromium } from "playwright";

const root = resolve(import.meta.dirname, "../fixtures/vite-consumer/dist");
const tokens = JSON.parse(await readFile(resolve(import.meta.dirname, "../dist/tokens.json"), "utf8"));
const mime = new Map([
  [".css", "text/css"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript"],
  [".svg", "image/svg+xml"],
  [".woff2", "font/woff2"],
]);
const server = createServer(async (request, response) => {
  const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");
  const pathname = requestUrl.pathname;
  const requested = pathname === "/" ? "index.html" : pathname.slice(1);
  const file = resolve(root, requested);
  if (!file.startsWith(`${root}/`)) {
    response.writeHead(403).end();
    return;
  }
  try {
    const bytes = await readFile(file);
    response.setHeader("Content-Type", mime.get(extname(file)) ?? "application/octet-stream");
    if (requested === "index.html" && requestUrl.searchParams.has("runtime")) {
      // Parser-time preflight is proven against fixture CSP below. Full
      // controller proof uses its existing inline color-scheme/announcer
      // behavior, so serve the same built app without document CSP here.
      response.end(bytes.toString("utf8").replace(/\s*<meta http-equiv="Content-Security-Policy"[^>]+>/u, ""));
      return;
    }
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
  // Parser-time preflight must honor both persisted modes even when the app
  // bundle is unavailable under a strict CSP.
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

  const cases = [
    { name: "system light", colorScheme: "light", saved: undefined, resolved: "light", palette: tokens.day },
    { name: "system dark", colorScheme: "dark", saved: undefined, resolved: "dark", palette: tokens.night },
    { name: "explicit light", colorScheme: "dark", saved: "light", resolved: "light", palette: tokens.day },
    { name: "explicit dark", colorScheme: "light", saved: "dark", resolved: "dark", palette: tokens.night },
  ];

  for (const proof of cases) {
    const context = await browser.newContext({ colorScheme: proof.colorScheme });
    if (proof.saved) {
      await context.addInitScript((savedMode) => localStorage.setItem("orcTheme", savedMode), proof.saved);
    }
    const page = await context.newPage();
    const errors = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${origin}/?runtime=1`, { waitUntil: "networkidle" });

    const observed = await page.evaluate(({ palette, resolved }) => {
      const root = document.documentElement;
      const styles = getComputedStyle(root);
      const base = Object.fromEntries(
        Object.keys(palette).map((role) => [role, styles.getPropertyValue(`--orc-${role}`).trim()]),
      );
      const heading = palette.heading;
      const accentStrong = resolved === "light"
        ? `color-mix(in srgb, ${palette.accent} 70%, ${heading})`
        : palette.accent;
      const derivedExpressions = {
        gate: resolved === "light" ? `color-mix(in srgb, ${palette.orange} 60%, ${heading})` : palette.orange,
        "muted-strong": `color-mix(in srgb, ${palette.muted} 45%, ${heading})`,
        "accent-text": resolved === "light" ? `color-mix(in srgb, ${palette.accent} 70%, ${heading})` : palette.accent,
        "red-text": resolved === "light" ? `color-mix(in srgb, ${palette.red} 60%, ${heading})` : palette.red,
        "yellow-text": resolved === "light" ? `color-mix(in srgb, ${palette.yellow} 70%, ${heading})` : palette.yellow,
        "green-text": resolved === "light" ? `color-mix(in srgb, ${palette.green} 70%, ${heading})` : palette.green,
        "purple-text": resolved === "light" ? `color-mix(in srgb, ${palette.purple} 65%, ${heading})` : palette.purple,
        "accent-strong": accentStrong,
        "control-border": `color-mix(in srgb, ${palette.border} 65%, ${heading})`,
        "button-hover": `color-mix(in srgb, ${palette.green} 10%, ${palette.bg})`,
        "button-hover-chip": `color-mix(in srgb, ${palette.green} 12%, ${palette.chip})`,
        "button-hover-strong": `color-mix(in srgb, ${accentStrong} 86%, ${heading})`,
      };
      const colorOf = (value) => {
        const probe = document.createElement("span");
        probe.style.color = value;
        document.body.append(probe);
        const color = getComputedStyle(probe).color;
        probe.remove();
        return color;
      };
      const derived = Object.fromEntries(
        Object.entries(derivedExpressions).map(([role, expression]) => [role, {
          actual: colorOf(`var(--orc-${role})`),
          expected: colorOf(expression),
        }]),
      );
      return {
        theme: root.dataset.theme,
        colorScheme: root.style.colorScheme,
        themeColor: document.querySelector('meta[name="theme-color"]')?.getAttribute("content"),
        favicon: document.querySelector('link[rel="icon"]')?.getAttribute("href"),
        base,
        derived,
      };
    }, { palette: proof.palette, resolved: proof.resolved });

    if (observed.theme !== proof.resolved || observed.colorScheme !== proof.resolved) {
      throw new Error(`${proof.name} resolved ${observed.theme}/${observed.colorScheme}; expected ${proof.resolved}.`);
    }
    if (observed.themeColor !== proof.palette.bg) {
      throw new Error(`${proof.name} theme-color ${observed.themeColor}; expected ${proof.palette.bg}.`);
    }
    for (const [role, expected] of Object.entries(proof.palette)) {
      if (observed.base[role].toLowerCase() !== expected) {
        throw new Error(`${proof.name} --orc-${role} ${observed.base[role]}; expected ${expected}.`);
      }
    }
    for (const [role, colors] of Object.entries(observed.derived)) {
      if (colors.actual !== colors.expected) {
        throw new Error(`${proof.name} --orc-${role} ${colors.actual}; expected ${colors.expected}.`);
      }
    }
    if (!observed.favicon) throw new Error(`${proof.name} did not resolve the packaged Orc icon.`);
    if (errors.length > 0) throw new Error(`${proof.name} browser errors: ${errors.join(" | ")}`);
    await context.close();
  }
} finally {
  await browser.close();
  await new Promise((resolveClosed, reject) =>
    server.close((error) => (error ? reject(error) : resolveClosed())),
  );
}

console.log("Verified parser-time CSP preflight plus packed system/light/dark token, asset, and theme-color consumption.");
