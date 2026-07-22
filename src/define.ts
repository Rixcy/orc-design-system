import { OrcNavbar } from "./components/orc-navbar";
import { OrcThemeToggle } from "./components/orc-theme-toggle";

export { OrcNavbar, OrcThemeToggle };

export function defineOrcElements(
  registry: CustomElementRegistry = customElements,
): void {
  if (!registry.get("orc-navbar")) registry.define("orc-navbar", OrcNavbar);
  if (!registry.get("orc-theme-toggle")) {
    registry.define("orc-theme-toggle", OrcThemeToggle);
  }
}
