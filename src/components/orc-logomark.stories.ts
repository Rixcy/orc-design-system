import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { expect } from "storybook/test";

import { OrcLogomark } from "./orc-logomark";
import { OrcNavbar } from "./orc-navbar";

if (!customElements.get("orc-logomark")) {
  customElements.define("orc-logomark", OrcLogomark);
}
if (!customElements.get("orc-navbar")) {
  customElements.define("orc-navbar", OrcNavbar);
}

function createLogomark(size?: "sm" | "md" | "lg", product?: string): HTMLElement {
  const mark = document.createElement("orc-logomark");
  if (size) mark.setAttribute("size", size);
  if (product) mark.setAttribute("product", product);
  return mark;
}

const meta = {
  title: "Components/Logomark",
  component: "orc-logomark",
  tags: ["autodocs", "test"],
  render: () => {
    const wrap = document.createElement("div");
    wrap.className = "story-surface story-stack";
    wrap.append(createLogomark(undefined, "design-system"));
    return wrap;
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const mark = canvasElement.querySelector("orc-logomark");
    const word = mark?.shadowRoot?.querySelector(".word");
    await expect(word?.textContent?.trim()).toBe("/orc design-system");
  },
};

export const WithoutProduct: Story = {
  render: () => {
    const wrap = document.createElement("div");
    wrap.className = "story-surface story-stack";
    wrap.append(createLogomark());
    return wrap;
  },
  play: async ({ canvasElement }) => {
    const mark = canvasElement.querySelector("orc-logomark");
    const product = mark?.shadowRoot?.querySelector(".product");
    await expect(product?.textContent).toBe("");
  },
};

export const Sizes: Story = {
  render: () => {
    const wrap = document.createElement("div");
    wrap.className = "story-surface story-stack";
    wrap.style.display = "flex";
    wrap.style.flexDirection = "column";
    wrap.style.alignItems = "flex-start";
    wrap.style.gap = "16px";

    wrap.append(
      createLogomark("sm", "design-system"),
      createLogomark("md", "design-system"),
      createLogomark("lg", "design-system"),
    );

    return wrap;
  },
  play: async ({ canvasElement }) => {
    const marks = [...canvasElement.querySelectorAll("orc-logomark")];
    await expect(marks.map((m) => m.getAttribute("size"))).toEqual([
      "sm",
      "md",
      "lg",
    ]);
  },
};

export const InNavbar: Story = {
  render: () => {
    const wrap = document.createElement("div");
    wrap.className = "story-surface";

    const navbar = document.createElement("orc-navbar");
    navbar.setAttribute("brand-label", "Orc Design System");
    const brand = createLogomark("md", "design-system");
    brand.setAttribute("slot", "brand");
    navbar.append(brand);

    wrap.append(navbar);
    return wrap;
  },
};

export const UnknownSizeFallsBackToMedium: Story = {
  render: () => {
    const wrap = document.createElement("div");
    wrap.className = "story-surface story-stack";
    wrap.append(createLogomark("xl" as "lg", "design-system"));
    return wrap;
  },
  play: async ({ canvasElement }) => {
    const mark = canvasElement.querySelector("orc-logomark");
    await expect(mark?.getAttribute("size")).toBe("md");
  },
};
