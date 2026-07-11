"use client"

import { Loader2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"
import { SidebarInset } from "@/components/ui/sidebar"
import { apiUrl } from "@/lib/api-base"
import { FolderDetailClient } from "./folder-detail-client"

/** 文件夹详情接口返回结构 */
interface FolderDetailResponse {
  folder: {
    id: string
    name: string
    emoji: string
  }
}

/** 文件夹详情：静态导出后改为 /folders?id=xxx 查询参数路由，客户端拉取数据 */
function FoldersPageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const id = searchParams.get("id")
  const [folder, setFolder] = useState<FolderDetailResponse["folder"] | null>(null)

  useEffect(() => {
    // 缺少 id 时回到首页
    if (!id) {
      router.replace("/")
      return
    }
    let cancelled = false
    fetch(apiUrl(`/api/folders/${encodeURIComponent(id)}`), { credentials: "include" })
      .then((res) => {
        if (!res.ok) {
          throw new Error("folder not found")
        }
        return res.json() as Promise<FolderDetailResponse>
      })
      .then((data) => {
        if (!cancelled) {
          setFolder(data.folder)
        }
      })
      .catch(() => {
        // 文件夹不存在或无权限时回到首页
        if (!cancelled) {
          router.replace("/")
        }
      })
    return () => {
      cancelled = true
    }
  }, [id, router])

  if (!folder) {
    return (
      <SidebarInset className="flex min-w-0 flex-col overflow-hidden">
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      </SidebarInset>
    )
  }

  return <FolderDetailClient folder={folder} key={folder.id} />
}

export default function FoldersPage() {
  // useSearchParams 需要 Suspense 边界（静态导出要求）
  return (
    <Suspense fallback={null}>
      <FoldersPageInner />
    </Suspense>
  )
}
