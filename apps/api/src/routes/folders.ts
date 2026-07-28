// 文件夹 API：列表 / 创建 / 排序 / 删除 / 详情 / 更新
import { and, eq, inArray, sql } from "drizzle-orm"
import { Hono } from "hono"
import { nanoid } from "nanoid"
import { db } from "@/context"
import { bookmark } from "../../db/schema/bookmark"
import { folder } from "../../db/schema/folder"
import type { HonoEnv } from "../env"

export const foldersRoute = new Hono<HonoEnv>()

// GET / 文件夹列表（每个文件夹附带最多 5 条书签）
foldersRoute.get("/", async (c) => {
  const userId = c.get("session").user.id

  const folders = await db
    .select({
      id: folder.id,
      name: folder.name,
      description: folder.description,
      emoji: folder.emoji,
      sortOrder: folder.sortOrder,
    })
    .from(folder)
    .where(eq(folder.userId, userId))
    .orderBy(folder.sortOrder)

  // 获取每个文件夹下的书签（最多显示 5 条）
  const foldersWithBookmarks = await Promise.all(
    folders.map(async (f) => {
      const bookmarks = await db
        .select({ id: bookmark.id, title: bookmark.title })
        .from(bookmark)
        .where(eq(bookmark.folderId, f.id))
        .limit(5)

      return { ...f, items: bookmarks }
    })
  )

  return c.json({ folders: foldersWithBookmarks })
})

// POST / 创建文件夹
foldersRoute.post("/", async (c) => {
  const userId = c.get("session").user.id

  const body = await c.req.json()
  const name = typeof body.name === "string" ? body.name.trim() : ""
  if (!name) {
    return c.json({ error: "名称不能为空" }, 400)
  }

  const emoji = typeof body.emoji === "string" ? body.emoji : "📁"
  const description =
    typeof body.description === "string" ? body.description.trim().slice(0, 200) || null : null

  // 获取当前最大 sortOrder
  const [max] = await db
    .select({ maxOrder: sql<number>`coalesce(max(${folder.sortOrder}), -1)` })
    .from(folder)
    .where(eq(folder.userId, userId))

  const newFolder = await db
    .insert(folder)
    .values({
      id: nanoid(),
      userId,
      name,
      description,
      emoji,
      sortOrder: (max?.maxOrder ?? -1) + 1,
    })
    .returning({
      id: folder.id,
      name: folder.name,
      description: folder.description,
      emoji: folder.emoji,
      sortOrder: folder.sortOrder,
    })

  return c.json({ folder: { ...newFolder[0], items: [] } }, 201)
})

// PATCH / 批量更新排序
foldersRoute.patch("/", async (c) => {
  const userId = c.get("session").user.id

  const body = await c.req.json()
  const orderedIds: string[] = Array.isArray(body.orderedIds) ? body.orderedIds : []
  if (orderedIds.length === 0) {
    return c.json({ error: "orderedIds is required" }, 400)
  }

  // 验证所有 folder 都属于当前用户
  const userFolders = await db
    .select({ id: folder.id })
    .from(folder)
    .where(and(eq(folder.userId, userId), inArray(folder.id, orderedIds)))

  if (userFolders.length !== orderedIds.length) {
    return c.json({ error: "Invalid folder ids" }, 400)
  }

  // 批量更新 sortOrder
  await Promise.all(
    orderedIds.map((id, index) =>
      db
        .update(folder)
        .set({ sortOrder: index })
        .where(and(eq(folder.id, id), eq(folder.userId, userId)))
    )
  )

  return c.json({ success: true })
})

// DELETE / 删除文件夹（body 传 id）
foldersRoute.delete("/", async (c) => {
  const userId = c.get("session").user.id

  const body = await c.req.json()
  const id = typeof body.id === "string" ? body.id : ""
  if (!id) {
    return c.json({ error: "缺少文件夹 ID" }, 400)
  }

  await db.delete(folder).where(and(eq(folder.id, id), eq(folder.userId, userId)))

  return c.json({ success: true })
})

// GET /:id 文件夹详情（附带最多 5 条书签）
foldersRoute.get("/:id", async (c) => {
  const userId = c.get("session").user.id
  const id = c.req.param("id")

  const [item] = await db
    .select({
      id: folder.id,
      name: folder.name,
      description: folder.description,
      emoji: folder.emoji,
      sortOrder: folder.sortOrder,
    })
    .from(folder)
    .where(and(eq(folder.id, id), eq(folder.userId, userId)))
    .limit(1)

  if (!item) {
    return c.json({ error: "Not found" }, 404)
  }

  const items = await db
    .select({ id: bookmark.id, title: bookmark.title })
    .from(bookmark)
    .where(eq(bookmark.folderId, id))
    .limit(5)

  return c.json({
    folder: {
      ...item,
      items,
    },
  })
})

// PATCH /:id 更新文件夹（emoji / 名称 / 描述）
foldersRoute.patch("/:id", async (c) => {
  const userId = c.get("session").user.id

  const id = c.req.param("id")
  const body = await c.req.json()
  const { emoji, name, description } = body

  const updates: Record<string, unknown> = {}
  if (typeof emoji === "string") {
    updates.emoji = emoji
  }
  if (typeof name === "string" && name.trim()) {
    updates.name = name.trim()
  }
  if (description === null) {
    updates.description = null
  } else if (typeof description === "string") {
    updates.description = description.trim().slice(0, 200) || null
  }

  if (Object.keys(updates).length === 0) {
    return c.json({ error: "No fields to update" }, 400)
  }

  const result = await db
    .update(folder)
    .set(updates)
    .where(and(eq(folder.id, id), eq(folder.userId, userId)))
    .returning({
      id: folder.id,
      name: folder.name,
      description: folder.description,
      emoji: folder.emoji,
    })

  if (result.length === 0) {
    return c.json({ error: "Not found" }, 404)
  }

  return c.json(result[0])
})
