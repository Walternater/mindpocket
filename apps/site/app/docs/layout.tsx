import { DocsLayout } from "fumadocs-ui/layouts/docs"
import type { ReactNode } from "react"
import { docsLayoutOptions } from "@/lib/layout.shared"
import { source } from "@/lib/source"

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout {...docsLayoutOptions} tree={source.pageTree}>
      {children}
    </DocsLayout>
  )
}
