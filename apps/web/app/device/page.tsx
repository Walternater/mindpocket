"use client"

import { Loader2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect } from "react"
import { DeviceApprovalCard } from "@/components/device-approval-card"
import { useSession } from "@/lib/auth-client"

/** 未登录时携带 user_code 跳转登录页，登录后回到本页 */
function buildLoginRedirect(userCode: string) {
  const target = userCode ? `/device?user_code=${encodeURIComponent(userCode)}` : "/device"
  return `/login?redirect=${encodeURIComponent(target)}`
}

/** CLI 设备授权页：静态导出后改为客户端 session 校验 */
function DevicePageInner() {
  const searchParams = useSearchParams()
  const userCode = searchParams.get("user_code") ?? ""
  const { data: session, isPending } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!(isPending || session?.user)) {
      router.replace(buildLoginRedirect(userCode))
    }
  }, [isPending, session, router, userCode])

  // 加载中或未登录（等待跳转）时显示占位
  if (isPending || !session?.user) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-muted p-6 md:p-10">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted p-6 md:p-10">
      <DeviceApprovalCard
        initialUserCode={userCode}
        userName={session.user.name || session.user.email || "当前账户"}
      />
    </div>
  )
}

export default function DevicePage() {
  // useSearchParams 需要 Suspense 边界（静态导出要求）
  return (
    <Suspense fallback={null}>
      <DevicePageInner />
    </Suspense>
  )
}
