// 对话历史 API：分页获取用户的聊天列表（CORS 由全局中间件处理）
import { Hono } from "hono"
import { getChatsByUserId } from "../../db/queries/chat"
import type { HonoEnv } from "../env"

export const historyRoute = new Hono<HonoEnv>()

historyRoute.get("/", async (c) => {
  const userId = c.get("session").user.id

  const limit = Number(c.req.query("limit") || "20")
  const endingBefore = c.req.query("ending_before") || undefined

  const chats = await getChatsByUserId({
    id: userId,
    limit,
    endingBefore,
  })

  // 多查一条用于判断是否还有更多
  const hasMore = chats.length > limit
  const result = hasMore ? chats.slice(0, limit) : chats

  return c.json({ chats: result, hasMore })
})
