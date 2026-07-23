import { OrcGlowField } from "./components/orc-glow-field";
import { OrcNavbar } from "./components/orc-navbar";
import { OrcThemeToggle } from "./components/orc-theme-toggle";

export { OrcGlowField, OrcNavbar, OrcThemeToggle };

export function defineOrcElements(
  registry: CustomElementRegistry = customElements,
): void {
  if (!registry.get("orc-glow-field")) {
    registry.define("orc-glow-field", OrcGlowField);
  }
  if (!registry.get("orc-navbar")) registry.define("orc-navbar", OrcNavbar);
  if (!registry.get("orc-theme-toggle")) {
    registry.define("orc-theme-toggle", OrcThemeToggle);
  }
}
