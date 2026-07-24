import "../src/styles/tokens.css";
import "../src/styles/components.css";
import "../src/styles/typography.css";
import "../src/styles/scrollbar.css";
import "./site.css";

import { defineOrcElements } from "../src/define";
import { createThemeController } from "../src/theme/controller";
import type { OrcDialog, OrcGlowField } from "../src/define";
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

// Dialog demo
const dialog = document.querySelector<OrcDialog>("#demo-dialog");
document
  .querySelector("#open-dialog")
  ?.addEventListener("click", () => dialog?.show());
document
  .querySelector("#close-dialog")
  ?.addEventListener("click", () => dialog?.close());

// Hero composer: pressing send just clears with a tiny acknowledgement —
// the demo is the beam, not a backend.
const field = document.querySelector<OrcGlowField>("#hero-field");
const send = document.querySelector("#hero-send");
send?.addEventListener("click", () => {
  if (!field) return;
  field.value = "";
  field.focus();
});

// Keep the year honest.
const year = document.querySelector("#year");
if (year) year.textContent = String(new Date().getFullYear());
