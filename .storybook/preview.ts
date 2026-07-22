import type { Preview } from "@storybook/web-components-vite";

import "../src/styles/tokens.css";
import "../src/styles/components.css";
import "./preview.css";

const preview: Preview = {
  decorators: [
    (Story, context) => {
      const mode = context.globals.theme;
      if (mode === "light" || mode === "dark") {
        document.documentElement.dataset.theme = mode;
      } else {
        document.documentElement.removeAttribute("data-theme");
      }
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
    layout: "fullscreen",
    options: {
      storySort: {
        order: ["Foundations", "Components"],
      },
    },
  },
};

export default preview;
