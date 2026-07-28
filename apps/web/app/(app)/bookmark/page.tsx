"use client"

import { Loader2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"
import { SidebarInset } from "@/components/ui/sidebar"
import { apiUrl } from "@/lib/api-base"
import { type BookmarkDetail, BookmarkDetailClient } from "./bookmark-detail-client"

/** 书签详情：静态导出后改为 /bookmark?id=xxx 查询参数路由，客户端拉取数据 */
function BookmarkPageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const id = searchParams.get("id")
  const [bookmark, setBookmark] = useState<BookmarkDetail | null>(null)

  useEffect(() => {
    // 缺少 id 时回到首页
    if (!id) {
      router.replace("/")
      return
    }
    let cancelled = false
    fetch(apiUrl(`/api/bookmarks/${encodeURIComponent(id)}`), { credentials: "include" })
      .then((res) => {
        if (!res.ok) {
          throw new Error("bookmark not found")
        }
        return res.json() as Promise<BookmarkDetail>
      })
      .then((data) => {
        if (!cancelled) {
          setBookmark(data)
        }
      })
      .catch(() => {
        // 书签不存在或无权限时回到首页
        if (!cancelled) {
          router.replace("/")
        }
      })
    return () => {
      cancelled = true
    }
  }, [id, router])

  if (!bookmark) {
    return (
      <SidebarInset className="flex min-w-0 flex-col overflow-hidden">
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      </SidebarInset>
    )
  }

  return <BookmarkDetailClient bookmark={bookmark} key={bookmark.id} />
}

export default function BookmarkPage() {
  // useSearchParams 需要 Suspense 边界（静态导出要求）
  return (
    <Suspense fallback={null}>
      <BookmarkPageInner />
    </Suspense>
  )
}
