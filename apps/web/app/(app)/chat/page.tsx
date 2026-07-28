"use client"

import type { UIMessage } from "ai"
import { Loader2 } from "lucide-react"
import { nanoid } from "nanoid"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useMemo, useState } from "react"
import { Chat } from "@/components/chat"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { apiUrl } from "@/lib/api-base"
import { ChatClient } from "./chat-client"

/** 聊天详情接口返回结构 */
interface ChatDetailResponse {
  chat: { id: string; title: string; createdAt: string }
  messages: Array<{
    id: string
    role: string
    parts: UIMessage["parts"]
    createdAt: string
  }>
}

/** 新对话页面 */
function NewChat() {
  const id = useMemo(() => nanoid(), [])

  return (
    <SidebarInset className="flex min-w-0 flex-col overflow-hidden">
      <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 bg-background">
        <div className="flex flex-1 items-center gap-2 px-3">
          <SidebarTrigger />
          <Separator className="mr-2 data-[orientation=vertical]:h-4" orientation="vertical" />
          <span className="text-sm">新对话</span>
        </div>
      </header>
      <Chat id={id} />
    </SidebarInset>
  )
}

/** 已有对话详情：静态导出后改为客户端拉取历史消息 */
function ChatDetail({ id }: { id: string }) {
  const router = useRouter()
  const [detail, setDetail] = useState<{ title: string; messages: UIMessage[] } | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(apiUrl(`/api/chat?id=${encodeURIComponent(id)}`), { credentials: "include" })
      .then((res) => {
        if (!res.ok) {
          throw new Error("chat not found")
        }
        return res.json() as Promise<ChatDetailResponse>
      })
      .then((data) => {
        if (cancelled) {
          return
        }
        setDetail({
          title: data.chat.title,
          messages: data.messages.map((msg) => ({
            id: msg.id,
            role: msg.role as "user" | "assistant",
            parts: msg.parts,
          })),
        })
      })
      .catch(() => {
        // 对话不存在或无权限时回到新对话
        if (!cancelled) {
          router.replace("/chat")
        }
      })
    return () => {
      cancelled = true
    }
  }, [id, router])

  if (!detail) {
    return (
      <SidebarInset className="flex min-w-0 flex-col overflow-hidden">
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      </SidebarInset>
    )
  }

  return <ChatClient chatTitle={detail.title} id={id} initialMessages={detail.messages} />
}

/** 静态导出不支持动态段，聊天详情改为 /chat?id=xxx 查询参数路由 */
function ChatPageInner() {
  const searchParams = useSearchParams()
  const chatId = searchParams.get("id")

  if (chatId) {
    // key 保证切换对话时重建组件
    return <ChatDetail id={chatId} key={chatId} />
  }
  return <NewChat />
}

export default function ChatPage() {
  // useSearchParams 需要 Suspense 边界（静态导出要求）
  return (
    <Suspense fallback={null}>
      <ChatPageInner />
    </Suspense>
  )
}
