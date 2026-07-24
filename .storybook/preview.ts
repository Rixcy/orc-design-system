import type { Preview } from "@storybook/web-components-vite";
import { setCustomElementsManifest } from "@storybook/web-components-vite";
import { GLOBALS_UPDATED } from "storybook/internal/core-events";
import { addons } from "storybook/preview-api";

import customElements from "../custom-elements.json";

import "../src/styles/tokens.css";
import "../src/styles/components.css";
import "../src/styles/typography.css";
import "./preview.css";

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
    // ponytail: docs chrome stays on Storybook's default light theme — the
    // branded dark manager theme fights the day token palette the preview
    // renders stories with.
    docs: {
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
