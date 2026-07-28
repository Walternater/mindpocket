// 书签 API：列表 / 搜索 / 详情 / 更新 / 删除
import { parseSearchMode, parseSearchScope } from "@repo/types"
import { and, eq } from "drizzle-orm"
import { Hono } from "hono"
import { db } from "@/context"
import { getBookmarkById, getBookmarksByUserId, getBookmarkTags } from "../../db/queries/bookmark"
import { searchBookmarks } from "../../db/queries/search"
import { bookmark } from "../../db/schema/bookmark"
import { folder } from "../../db/schema/folder"
import type { HonoEnv } from "../env"

export const bookmarksRoute = new Hono<HonoEnv>()

// GET / 书签列表（带搜索时走 searchBookmarks）
bookmarksRoute.get("/", async (c) => {
  const userId = c.get("session").user.id

  const type = c.req.query("type") || undefined
  const platform = c.req.query("platform") || undefined
  const folderId = c.req.query("folderId") || undefined
  const search = c.req.query("search") || undefined
  const searchMode = parseSearchMode(c.req.query("searchMode") ?? null, "keyword")
  const searchScope = parseSearchScope(c.req.query("searchScope") ?? null)
  const limit = Number(c.req.query("limit")) || 20
  const offset = Number(c.req.query("offset")) || 0

  if (search) {
    const result = await searchBookmarks({
      userId,
      q: search,
      mode: searchMode,
      scope: searchScope,
      folderId,
      type,
      platform,
      limit,
      offset,
    })

    return c.json({
      bookmarks: result.items.map((item) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        description: item.description,
        url: item.url,
        coverImage: item.coverImage,
        isFavorite: item.isFavorite,
        createdAt: item.createdAt,
        folderId: item.folderId,
        folderName: item.folderName,
        folderEmoji: item.folderEmoji,
        platform: item.platform,
      })),
      total: result.total,
      hasMore: result.hasMore,
      modeUsed: result.modeUsed,
      fallbackReason: result.fallbackReason,
    })
  }

  const bookmarksResult = await getBookmarksByUserId({
    userId,
    type,
    platform,
    folderId,
    search,
    limit,
    offset,
  })

  return c.json(bookmarksResult)
})

// GET /:id 书签详情（含标签）
bookmarksRoute.get("/:id", async (c) => {
  const userId = c.get("session").user.id

  const id = c.req.param("id")
  const item = await getBookmarkById({ id, userId })
  if (!item) {
    return c.json({ error: "Not found" }, 404)
  }

  const tags = await getBookmarkTags(id)

  return c.json({ ...item, tags })
})

// PATCH /:id 更新书签（标题 / 内容 / 描述 / 所属文件夹）
bookmarksRoute.patch("/:id", async (c) => {
  const userId = c.get("session").user.id

  const id = c.req.param("id")
  const existing = await getBookmarkById({ id, userId })
  if (!existing) {
    return c.json({ error: "Not found" }, 404)
  }

  const body = await c.req.json()
  const { title, content, description, folderId } = body

  const updates: Record<string, unknown> = {}
  if (title !== undefined) {
    updates.title = title
  }
  if (content !== undefined) {
    updates.content = content
  }
  if (description !== undefined) {
    updates.description = description
  }
  if (folderId !== undefined) {
    if (folderId === null) {
      updates.folderId = null
    } else if (typeof folderId === "string" && folderId.trim()) {
      // 校验目标文件夹属于当前用户
      const [targetFolder] = await db
        .select({ id: folder.id })
        .from(folder)
        .where(and(eq(folder.id, folderId.trim()), eq(folder.userId, userId)))
        .limit(1)

      if (!targetFolder) {
        return c.json({ error: "Invalid folder" }, 400)
      }

      updates.folderId = folderId.trim()
    } else {
      return c.json({ error: "Invalid folderId" }, 400)
    }
  }

  if (Object.keys(updates).length === 0) {
    return c.json({ error: "No fields to update" }, 400)
  }

  await db.update(bookmark).set(updates).where(eq(bookmark.id, id))

  return c.json({ success: true })
})

// DELETE /:id 删除书签
bookmarksRoute.delete("/:id", async (c) => {
  const userId = c.get("session").user.id

  const id = c.req.param("id")
  const existing = await getBookmarkById({ id, userId })
  if (!existing) {
    return c.json({ error: "Not found" }, 404)
  }

  await db.delete(bookmark).where(eq(bookmark.id, id))

  return c.json({ success: true })
})
