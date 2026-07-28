"use client"

import { AuthGuard } from "@/components/auth-guard"
import { AppShell } from "./shell"

// 静态导出后由客户端守卫负责登录校验
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  )
}
