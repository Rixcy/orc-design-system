import type { Preview } from "@storybook/web-components-vite";
import { setCustomElementsManifest } from "@storybook/web-components-vite";
import { GLOBALS_UPDATED } from "storybook/internal/core-events";
import { addons } from "storybook/preview-api";

import customElements from "../custom-elements.json";

import "../src/styles/tokens.css";
import "../src/styles/components.css";
import "../src/styles/typography.css";
import "../src/styles/prose.css";
import "./preview.css";
import { orcTheme } from "./orc-theme";

setCustomElementsManifest(customElements);

function applyTheme(mode: unknown): void {
  if (mode === "light" || mode === "dark") {
    document.documentElement.dataset.theme = mode;
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}

// Decorators only run for stories, so MDX-only pages (Foundations, Introduction)
// would otherwise ignore the theme toolbar.
addons.getChannel().on(GLOBALS_UPDATED, ({ globals }) => {
  applyTheme(globals?.theme);
});

const preview: Preview = {
  decorators: [
    (Story, context) => {
      applyTheme(context.globals.theme);
      return Story();
    },
  ],
  globalTypes: {
    theme: {
      description: "Preview theme",
      toolbar: {
        icon: "paintbrush",
        items: [
          { value: "system", title: "System" },
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: "system",
  },
  parameters: {
    a11y: {
      test: "error",
    },
    controls: {
      expanded: true,
    },
    // Docs pages render inside the preview but wear the manager's chrome, so
    // they take the same token-derived theme.
    docs: {
      theme: orcTheme(),
      toc: true,
    },
    layout: "fullscreen",
    options: {
      storySort: {
        order: ["Introduction", "Foundations", "Components"],
      },
    },
  },
};

export default preview;
