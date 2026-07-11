"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { LoginForm } from "@/components/login-form"
import { resolveAuthRedirectTarget } from "@/lib/auth-flow"

/** 登录页：静态导出后改为客户端读取 redirect 参数 */
function LoginPageInner() {
  const searchParams = useSearchParams()
  const nextPath = resolveAuthRedirectTarget(searchParams.get("redirect"))

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        {/* 2FA 待验证 cookie 为 httpOnly，客户端无法读取，统一从凭据步骤开始 */}
        <LoginForm initialStep="credentials" nextPath={nextPath} />
      </div>
    </div>
  )
}

export default function LoginPage() {
  // useSearchParams 需要 Suspense 边界（静态导出要求）
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  )
}
