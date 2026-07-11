// 仪表盘 API：统计数据 / 类型分布 / 文件夹排行 / 增长趋势
import { and, count, eq, gte, sql } from "drizzle-orm"
import { Hono } from "hono"
import { db } from "@/context"
import { bookmark } from "../../db/schema/bookmark"
import { chat } from "../../db/schema/chat"
import { embedding } from "../../db/schema/embedding"
import { folder } from "../../db/schema/folder"
import type { HonoEnv } from "../env"

export const dashboardRoute = new Hono<HonoEnv>()

dashboardRoute.get("/", async (c) => {
  const userId = c.get("session").user.id
  const days = Number(c.req.query("days") || "30")

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const [stats, typeDistribution, folderRanking, growthTrend] = await Promise.all([
    getStats(userId, weekAgo),
    getTypeDistribution(userId),
    getFolderRanking(userId),
    getGrowthTrend(userId, startDate),
  ])

  return c.json({ ...stats, typeDistribution, folderRanking, growthTrend })
})

// 总量 / 本周新增 / 对话数 / 向量化率
async function getStats(userId: string, weekAgo: Date) {
  const [totalResult] = await db
    .select({ count: count() })
    .from(bookmark)
    .where(eq(bookmark.userId, userId))

  const [weekResult] = await db
    .select({ count: count() })
    .from(bookmark)
    .where(and(eq(bookmark.userId, userId), gte(bookmark.createdAt, weekAgo)))

  const [chatResult] = await db.select({ count: count() }).from(chat).where(eq(chat.userId, userId))

  const [embeddedResult] = await db
    .select({ count: count() })
    .from(embedding)
    .innerJoin(bookmark, eq(embedding.bookmarkId, bookmark.id))
    .where(eq(bookmark.userId, userId))

  const totalBookmarks = totalResult?.count ?? 0
  const weekBookmarks = weekResult?.count ?? 0
  const totalChats = chatResult?.count ?? 0
  const totalEmbeddings = embeddedResult?.count ?? 0
  const embeddingRate =
    totalBookmarks > 0 ? Math.round((totalEmbeddings / totalBookmarks) * 100) : 0

  return { totalBookmarks, weekBookmarks, totalChats, embeddingRate }
}

// 按类型统计书签数
async function getTypeDistribution(userId: string) {
  const result = await db
    .select({
      type: bookmark.type,
      count: count(),
    })
    .from(bookmark)
    .where(eq(bookmark.userId, userId))
    .groupBy(bookmark.type)

  return result
}

// 文件夹书签数排行（前 10）
async function getFolderRanking(userId: string) {
  const result = await db
    .select({
      name: folder.name,
      emoji: folder.emoji,
      count: count(bookmark.id),
    })
    .from(folder)
    .leftJoin(bookmark, eq(folder.id, bookmark.folderId))
    .where(eq(folder.userId, userId))
    .groupBy(folder.id, folder.name, folder.emoji)
    .orderBy(sql`count(${bookmark.id}) desc`)
    .limit(10)

  return result
}

// 按天统计增长趋势（createdAt 为毫秒时间戳，用 strftime 格式化，替代 pg 的 to_char）
async function getGrowthTrend(userId: string, startDate: Date) {
  const dateExpr = sql<string>`strftime('%Y-%m-%d', ${bookmark.createdAt} / 1000, 'unixepoch')`

  const result = await db
    .select({
      date: dateExpr,
      count: count(),
    })
    .from(bookmark)
    .where(and(eq(bookmark.userId, userId), gte(bookmark.createdAt, startDate)))
    .groupBy(dateExpr)
    .orderBy(dateExpr)

  // 补齐没有数据的日期为 0
  const dateMap = new Map(result.map((r) => [r.date, r.count]))
  const trend: Array<{ date: string; count: number }> = []
  const current = new Date(startDate)
  const today = new Date()

  while (current <= today) {
    const dateStr = current.toISOString().split("T")[0]!
    trend.push({ date: dateStr, count: dateMap.get(dateStr) ?? 0 })
    current.setDate(current.getDate() + 1)
  }

  return trend
}
