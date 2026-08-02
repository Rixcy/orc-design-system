import { OrcButton } from "./components/orc-button";
import { OrcChip } from "./components/orc-chip";
import { OrcCombobox } from "./components/orc-combobox";
import { OrcCopyButton } from "./components/orc-copy-button";
import { OrcDialog } from "./components/orc-dialog";
import { OrcIconButton } from "./components/orc-icon-button";
import { OrcInput } from "./components/orc-input";
import { OrcLogomark } from "./components/orc-logomark";
import { OrcNavbar } from "./components/orc-navbar";
import { OrcSegmented } from "./components/orc-segmented";
import { OrcSelect } from "./components/orc-select";
import { OrcStatusDot } from "./components/orc-status-dot";
import { OrcStepper } from "./components/orc-stepper";
import { OrcTabs } from "./components/orc-tabs";
import { OrcTextarea } from "./components/orc-textarea";
import { OrcThemeToggle } from "./components/orc-theme-toggle";

export {
  OrcButton,
  OrcChip,
  OrcCombobox,
  OrcCopyButton,
  OrcDialog,
  OrcIconButton,
  OrcInput,
  OrcLogomark,
  OrcNavbar,
  OrcSegmented,
  OrcSelect,
  OrcStatusDot,
  OrcStepper,
  OrcTabs,
  OrcTextarea,
  OrcThemeToggle,
};

const ELEMENTS: ReadonlyArray<[string, CustomElementConstructor]> = [
  ["orc-button", OrcButton],
  ["orc-chip", OrcChip],
  ["orc-combobox", OrcCombobox],
  ["orc-copy-button", OrcCopyButton],
  ["orc-dialog", OrcDialog],
  ["orc-icon-button", OrcIconButton],
  ["orc-input", OrcInput],
  ["orc-logomark", OrcLogomark],
  ["orc-navbar", OrcNavbar],
  ["orc-segmented", OrcSegmented],
  ["orc-select", OrcSelect],
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
