import "@orc/design-system-preview/tokens.css";
import "@orc/design-system-preview/components.css";
import "@orc/design-system-preview/fonts.css";
import logoUrl from "@orc/design-system-preview/assets/orc-logo.svg";
import { createThemeController } from "@orc/design-system-preview/controller";
import { defineOrcElements } from "@orc/design-system-preview/define";

import "./orc-flags-aliases.css";
import "./styles.css";

defineOrcElements();

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
  themeColor: { light: "#e1e2e7", dark: "#1a1b26" },
  announce: true,
});

if (import.meta.hot) import.meta.hot.dispose(() => controller.dispose());
