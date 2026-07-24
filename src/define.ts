import { OrcButton } from "./components/orc-button";
import { OrcChip } from "./components/orc-chip";
import { OrcGlowField } from "./components/orc-glow-field";
import { OrcNavbar } from "./components/orc-navbar";
import { OrcStatusDot } from "./components/orc-status-dot";
import { OrcStepper } from "./components/orc-stepper";
import { OrcTabs } from "./components/orc-tabs";
import { OrcTextarea } from "./components/orc-textarea";
import { OrcThemeToggle } from "./components/orc-theme-toggle";

export {
  OrcButton,
  OrcChip,
  OrcGlowField,
  OrcNavbar,
  OrcStatusDot,
  OrcStepper,
  OrcTabs,
  OrcTextarea,
  OrcThemeToggle,
};

const ELEMENTS: ReadonlyArray<[string, CustomElementConstructor]> = [
  ["orc-button", OrcButton],
  ["orc-chip", OrcChip],
  ["orc-glow-field", OrcGlowField],
  ["orc-navbar", OrcNavbar],
  ["orc-status-dot", OrcStatusDot],
  ["orc-stepper", OrcStepper],
  ["orc-tabs", OrcTabs],
  ["orc-textarea", OrcTextarea],
  ["orc-theme-toggle", OrcThemeToggle],
];

export function defineOrcElements(
  registry: CustomElementRegistry = customElements,
): void {
  for (const [tag, ctor] of ELEMENTS) {
    if (!registry.get(tag)) registry.define(tag, ctor);
  }
}
