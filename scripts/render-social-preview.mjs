// Renders .github/social-preview.png — the 1280x640 card GitHub shows when the
// repository is linked anywhere. Colors come from src/theme/orc-tokens.json and
// the mascot geometry is inlined from src/assets/orc-emblem.svg, so the card
// cannot drift from the palette or fork the mark. Regenerate with
// `bun run social-preview`.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import { chromium } from 'playwright';

const root = resolve(import.meta.dirname, '..');
const output = resolve(root, '.github/social-preview.png');
const WIDTH = 1280;
const HEIGHT = 640;

const { night } = JSON.parse(await readFile(resolve(root, 'src/theme/orc-tokens.json'), 'utf8'));

// The emblem is used unchanged; only the outer <svg> attributes are replaced so
// it can be sized by CSS (see src/assets/ASSETS.md).
const emblem = (await readFile(resolve(root, 'src/assets/orc-emblem.svg'), 'utf8')).replace(
  /^[\s\S]*?<svg[^>]*>/u,
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-84 -78 168 144" class="emblem" aria-hidden="true">',
);

const fontFace = async (family, file) => {
  const data = await readFile(resolve(root, 'src/assets/fonts', file), 'base64');
  return `@font-face{font-family:"${family}";font-weight:100 900;font-display:block;src:url(data:font/woff2;base64,${data}) format("woff2");}`;
};

// The bottom strip is the night palette's hue set — the neutrals are omitted
// because they vanish against the canvas, and these are the one element that
// still reads at thumbnail size.
const strip = ['accent', 'green', 'yellow', 'orange', 'red', 'purple', 'cyan']
  .map((role) => `<i style="background:${night[role]}"></i>`)
  .join('');

const html = `<!doctype html>
<meta charset="utf-8">
<style>
  ${await fontFace('Inter', 'inter-latin-wght-normal.woff2')}
  ${await fontFace('JetBrains Mono', 'jetbrains-mono-latin-wght-normal.woff2')}
  *{margin:0;padding:0;box-sizing:border-box}
  body{
    width:${WIDTH}px;height:${HEIGHT}px;overflow:hidden;position:relative;
    background:${night.bg};color:${night.text};
    font-family:Inter,sans-serif;-webkit-font-smoothing:antialiased;
  }
  /* The site's one animated artifact is a green beam; here it rests as a still
     glow behind the mascot so the card keeps the same light source. */
  .glow{
    position:absolute;inset:0;
    background:radial-gradient(46% 60% at 78% 46%, ${night.green}2e 0%, ${night.green}0d 45%, transparent 72%);
  }
  .card{position:relative;height:100%;display:flex;align-items:center;gap:64px;padding:0 88px 10px}
  .copy{flex:1;min-width:0}
  .lockup{font-family:"JetBrains Mono",monospace;line-height:1}
  .lockup b{font-size:42px;font-weight:700;color:${night.heading};letter-spacing:-1px}
  .lockup b span{color:${night.green}}
  .lockup small{
    display:block;margin-top:12px;font-size:16px;font-weight:600;
    letter-spacing:5.5px;color:${night.muted};
  }
  h1{
    margin:38px 0 26px;font-size:70px;line-height:1.04;font-weight:700;
    letter-spacing:-2.4px;color:${night.heading};
  }
  p{font-size:25px;line-height:1.44;max-width:19em;color:${night.text}}
  code{
    display:inline-block;margin-top:38px;padding:11px 20px;border-radius:10px;
    border:1px solid ${night.border};background:${night.code};
    font-family:"JetBrains Mono",monospace;font-size:21px;color:${night.accent};
  }
  .emblem{width:400px;height:auto;flex:none;filter:drop-shadow(0 0 60px ${night.green}33)}
  .strip{position:absolute;left:0;right:0;bottom:0;display:flex;height:10px}
  .strip i{flex:1}
</style>
<div class="glow"></div>
<div class="card">
  <div class="copy">
    <div class="lockup"><b><span>/</span>orc</b><small>DESIGN SYSTEM</small></div>
    <h1>Components that carry the swamp.</h1>
    <p>Framework-neutral Web Components, a sixteen-color day/night palette, and native-first accessibility.</p>
    <code>npm install @orc-tools/orc-design-system</code>
  </div>
  ${emblem}
</div>
<div class="strip">${strip}</div>
`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT } });
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await mkdir(dirname(output), { recursive: true });
await writeFile(output, await page.screenshot({ type: 'png' }));
await browser.close();

console.log(`wrote ${output} (${WIDTH}x${HEIGHT})`);
