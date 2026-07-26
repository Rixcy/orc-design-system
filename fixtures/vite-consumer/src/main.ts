import "@orc-tools/orc-design-system/tokens.css";
import "@orc-tools/orc-design-system/components.css";
import "@orc-tools/orc-design-system/fonts.css";
import iconUrl from "@orc-tools/orc-design-system/assets/orc-icon.svg";
import logoUrl from "@orc-tools/orc-design-system/assets/orc-logo.svg";
import tokens from "@orc-tools/orc-design-system/tokens.json";
import { createThemeController } from "@orc-tools/orc-design-system/controller";
import { defineOrcElements } from "@orc-tools/orc-design-system/define";

import "./orc-flags-aliases.css";
import "./styles.css";

defineOrcElements();

const favicon = document.createElement("link");
favicon.rel = "icon";
favicon.href = iconUrl;
document.head.append(favicon);

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("Missing fixture app root.");

const navbar = document.createElement("orc-navbar");
navbar.setAttribute("brand-label", "Orc consumer fixture");
navbar.setAttribute("home-href", "/");
navbar.setAttribute("home-label", "Orc consumer fixture home");

const brand = document.createElement("a");
brand.slot = "brand";
brand.href = "/";
brand.className = "fixture-brand";
brand.setAttribute("aria-label", "Orc consumer fixture home");
const logo = document.createElement("img");
logo.src = logoUrl;
logo.alt = "";
logo.width = 54;
logo.height = 24;
logo.fetchPriority = "high";
brand.append(logo, document.createTextNode("design system"));

const docs = document.createElement("a");
docs.slot = "nav";
docs.href = "#proof";
docs.className = "fixture-nav-link";
docs.textContent = "Package proof";

const toggle = document.createElement("orc-theme-toggle");
toggle.slot = "actions";
toggle.setAttribute("label", "Theme");
navbar.append(brand, docs, toggle);

const main = document.createElement("main");
main.id = "proof";
main.innerHTML = `<h1>Packed-Package Consumer</h1><p>This vanilla TypeScript/Vite app resolves exported CSS, assets, types, custom elements, and controller code from the generated tarball.</p>`;

const skipLink = document.createElement("a");
skipLink.className = "skip-link";
skipLink.href = "#proof";
skipLink.textContent = "Skip to Main Content";

app.append(skipLink, navbar, main);

const controller = createThemeController({
  document,
  storageKey: "orcTheme",
  themeColor: { light: tokens.day.bg, dark: tokens.night.bg },
  announce: true,
});

if (import.meta.hot) import.meta.hot.dispose(() => controller.dispose());
