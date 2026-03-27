import type { DocsLayoutProps } from "fumadocs-ui/layouts/docs"

// Shared layout options keep the docs shell aligned with the marketing site.
export const docsLayoutOptions: Omit<DocsLayoutProps, "children" | "tree"> = {
  nav: {
    title: "MindPocket Docs",
    url: "/",
  },
  links: [
    {
      text: "Home",
      url: "/",
    },
    {
      text: "Changelog",
      url: "/changelog",
    },
  ],
}
