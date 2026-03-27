import type { Page } from "fumadocs-core/source"
import defaultMdxComponents, { createRelativeLink } from "fumadocs-ui/mdx"
import { source } from "@/lib/source"

export function getMdxComponents(page: Page) {
  return {
    ...defaultMdxComponents,
    a: createRelativeLink(source, page),
  }
}
