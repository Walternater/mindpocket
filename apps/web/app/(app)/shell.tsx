"use client"

import { Suspense } from "react"
import { GlobalSearchDialog } from "@/components/search/global-search-dialog"
import { SidebarLeft } from "@/components/sidebar-left"
import { SidebarProvider } from "@/components/ui/sidebar"

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      {/* SidebarLeft 内部使用 useSearchParams，静态导出要求包裹 Suspense */}
      <Suspense fallback={null}>
        <SidebarLeft variant="inset" />
      </Suspense>
      {children}
      <GlobalSearchDialog />
    </SidebarProvider>
  )
}
