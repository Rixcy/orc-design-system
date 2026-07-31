import "../src/styles/tokens.css";
import "../src/styles/components.css";
import "../src/styles/typography.css";
import "../src/styles/scrollbar.css";
import "./site.css";

import { burstConfetti } from "./confetti";
import { defineOrcElements } from "../src/define";
import { createThemeController } from "../src/theme/controller";
import type { OrcDialog, OrcTextarea } from "../src/define";
import tokens from "../src/theme/orc-tokens.json";

defineOrcElements();
createThemeController({ document });

// Palette bands render straight from the token source — a new or changed
// color shows up here on the next build with zero page edits.
type TokenSet = Record<string, string>;
const themes = tokens as { day: TokenSet; night: TokenSet };

for (const [theme, set] of Object.entries(themes)) {
  const band = document.querySelector<HTMLElement>(`[data-palette="${theme}"]`);
  if (!band) continue;
  for (const [name, value] of Object.entries(set)) {
    const stripe = document.createElement("div");
    stripe.className = "swatch";
    stripe.style.setProperty("--swatch", value);
    stripe.innerHTML = `<span class="swatch-name">${name}</span><code class="swatch-hex">${value}</code>`;
    band.append(stripe);
  }
}

// Type specimen: annotate each role with its live spec, read from the
// --orc-type-* custom properties so the sheet renders straight from
// typography.css and can't drift. getComputedStyle resolves the font
// shorthand to "<weight> <size>/<line-height> <family stack>".
const rootStyle = getComputedStyle(document.documentElement);
for (const row of document.querySelectorAll<HTMLElement>(
  ".type-row[data-role]",
)) {
  const role = row.dataset.role;
  const spec = row.querySelector(".type-spec");
  if (!role || !spec) continue;
  const shorthand = rootStyle.getPropertyValue(`--orc-type-${role}`).trim();
  const parts = shorthand.match(/^(\d+)\s+([\d.]+px)\/([\d.]+)\s+(.+)$/);
  if (!parts) continue;
  const [, weight, size, lineHeight, familyStack] = parts;
  const family = /mono/i.test(familyStack) ? "JetBrains Mono" : "Inter";
  spec.textContent = `${weight} · ${size}/${lineHeight} · ${family}`;
}

// Dialog demo
const dialog = document.querySelector<OrcDialog>("#demo-dialog");
document
  .querySelector("#open-dialog")
  ?.addEventListener("click", () => dialog?.show());
document
  .querySelector("#close-dialog")
  ?.addEventListener("click", () => dialog?.close());

// Hero composer: pressing send clears the field and throws orc confetti —
// the demo is the beam, not a backend.
const field = document.querySelector<OrcTextarea>("#hero-field");
const send = document.querySelector("#hero-send");
send?.addEventListener("click", () => {
  burstConfetti(send);
  if (!field) return;
  field.value = "";
  field.focus();
});

// Keep the year honest.
const year = document.querySelector("#year");
if (year) year.textContent = String(new Date().getFullYear());
