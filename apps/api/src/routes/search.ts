import { parseSearchMode } from "@repo/types"
import { Hono } from "hono"
import { searchBookmarks } from "../../db/queries/search"
import type { HonoEnv } from "../env"

export const searchRoute = new Hono<HonoEnv>()

searchRoute.get("/", async (c) => {
  const userId = c.get("session").user.id

  const q = c.req.query("q")?.trim() || ""
  const mode = parseSearchMode(c.req.query("mode") ?? null, "hybrid")
  const folderId = c.req.query("folderId") || undefined
  const type = c.req.query("type") || undefined
  const limit = Math.min(Number(c.req.query("limit") || "20"), 50)

  const result = await searchBookmarks({
    userId,
    q,
    mode,
    scope: "compact",
    folderId,
    type,
    limit,
  })

  return c.json({
    items: result.items.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      url: item.url,
      type: item.type,
      folderName: item.folderName,
      folderEmoji: item.folderEmoji,
      createdAt: item.createdAt,
      score: item.score,
      matchReasons: item.matchReasons,
    })),
    modeUsed: result.modeUsed,
    fallbackReason: result.fallbackReason,
  })
})
