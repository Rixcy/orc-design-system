import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { expect } from "storybook/test";

import { defineOrcElements } from "../define";

defineOrcElements();

interface NavbarArgs {
  brandLabel: string;
  homeHref: string;
  homeLabel: string;
}

function createLink(label: string, href: string): HTMLAnchorElement {
  const link = document.createElement("a");
  link.className = "story-nav-link";
  link.slot = "nav";
  link.href = href;
  link.textContent = label;
  return link;
}

function renderNavbar(
  args: NavbarArgs,
  options: { longContent?: boolean; narrow?: boolean; slots?: boolean } = {},
): HTMLElement {
  const surface = document.createElement("div");
  surface.className = "story-surface";
  if (options.narrow) surface.dataset.width = "narrow";

  const navbar = document.createElement("orc-navbar");
  navbar.setAttribute("brand-label", args.brandLabel);
  navbar.setAttribute("home-href", args.homeHref);
  navbar.setAttribute("home-label", args.homeLabel);

  if (options.longContent) {
    navbar.append(
      createLink("Component Documentation & Integration Guidance", "#documentation"),
      createLink("Accessibility Acceptance Evidence", "#accessibility"),
    );
    const action = document.createElement("button");
    action.className = "story-action";
    action.slot = "actions";
    action.type = "button";
    action.textContent = "Open Installation Instructions";
    navbar.append(action);
  } else if (options.slots) {
    const brand = document.createElement("a");
    brand.className = "story-nav-link";
    brand.slot = "brand";
    brand.href = "/custom";
    brand.setAttribute("aria-label", "Orc Platform home");
    brand.textContent = "/orc platform";

    const docs = createLink("Docs", "#docs");
    const patterns = createLink("Patterns", "#patterns");
    const action = document.createElement("button");
    action.className = "story-action";
    action.slot = "actions";
    action.type = "button";
    action.textContent = "View Tokens";
    navbar.append(brand, docs, patterns, action);
  }

  surface.append(navbar);
  return surface;
}

const meta = {
  title: "Components/Navbar",
  component: "orc-navbar",
  tags: ["autodocs", "test"],
  args: {
    brandLabel: "Orc",
    homeHref: "/",
    homeLabel: "Orc home",
  },
  argTypes: {
    brandLabel: { control: "text", name: "brand-label" },
    homeHref: { control: "text", name: "home-href" },
    homeLabel: { control: "text", name: "home-label" },
  },
  render: (args) => renderNavbar(args),
} satisfies Meta<NavbarArgs>;

export default meta;
type Story = StoryObj<NavbarArgs>;

export const FallbackBrand: Story = {
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("orc-navbar");
    const nav = host?.shadowRoot?.querySelector("nav");
    const link = host?.shadowRoot?.querySelector<HTMLAnchorElement>("#brand-link");

    await expect(nav).toHaveAttribute("aria-label", "Primary");
    await expect(link).toHaveAttribute("aria-label", "Orc home");
    await expect(link?.getAttribute("href")).toBe("/");
  },
};

export const SlottedContent: Story = {
  render: (args) => renderNavbar(args, { slots: true }),
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("orc-navbar");
    await expect(host?.querySelectorAll('[slot="nav"]')).toHaveLength(2);
    await expect(host?.querySelector('[slot="actions"]')).toHaveTextContent("View Tokens");
    await expect(host?.querySelector('[slot="brand"]')).toHaveAttribute(
      "aria-label",
      "Orc Platform home",
    );
  },
};

export const ExplicitLight: Story = {
  globals: { theme: "light" },
  render: (args) => renderNavbar(args, { slots: true }),
};

export const ExplicitDark: Story = {
  globals: { theme: "dark" },
  render: (args) => renderNavbar(args, { slots: true }),
};

export const NarrowWithLongLabels: Story = {
  args: {
    brandLabel: "/orc design system foundations with an intentionally long product name",
    homeHref: "/foundations",
    homeLabel: "Orc Design System Foundations home",
  },
  render: (args) => renderNavbar(args, { longContent: true, narrow: true }),
  parameters: {
    docs: {
      description: {
        story: "A 320 px content surface exercises wrapping and reflow with long brand, navigation, and action labels.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const surface = canvasElement.querySelector<HTMLElement>('[data-width="narrow"]');
    const host = canvasElement.querySelector("orc-navbar");
    await expect(surface).toHaveStyle({ width: "320px" });
    await expect(host?.querySelectorAll('[slot="nav"]')).toHaveLength(2);
    if (!surface || !host) throw new Error("Expected narrow navbar story elements.");
    const surfaceBounds = surface.getBoundingClientRect();
    const hostBounds = host.getBoundingClientRect();
    const nav = host.shadowRoot?.querySelector<HTMLElement>("nav");
    await expect(surface.scrollWidth).toBeLessThanOrEqual(surface.clientWidth);
    await expect(hostBounds.left).toBeGreaterThanOrEqual(surfaceBounds.left);
    await expect(hostBounds.right).toBeLessThanOrEqual(surfaceBounds.right);
    await expect(nav?.scrollWidth).toBeLessThanOrEqual(nav?.clientWidth ?? 0);
  },
};

export const KeyboardFocus: Story = {
  render: (args) => renderNavbar(args, { slots: true }),
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector("orc-navbar");
    const slottedBrand = host?.querySelector<HTMLAnchorElement>('[slot="brand"]');
    const navLink = host?.querySelector<HTMLAnchorElement>('[slot="nav"]');
    const action = host?.querySelector<HTMLButtonElement>('[slot="actions"]');

    slottedBrand?.focus();
    await expect(document.activeElement).toBe(slottedBrand);
    navLink?.focus();
    await expect(document.activeElement).toBe(navLink);
    action?.focus();
    await expect(document.activeElement).toBe(action);
  },
};
