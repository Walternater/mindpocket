"use client"

import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useSession } from "@/lib/auth-client"

/**
 * 客户端登录守卫
 * 静态导出后没有服务端 session 校验，改为客户端检查：
 * 加载中显示骨架，未登录跳转 /login
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!(isPending || session?.user)) {
      router.replace("/login")
    }
  }, [isPending, session, router])

  // 加载中或未登录（等待跳转）时显示占位
  if (isPending || !session?.user) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return <>{children}</>
}
