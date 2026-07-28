import { and, desc, eq, like, or, sql } from "drizzle-orm"
import { db } from "@/context"
import { bookmark } from "../schema/bookmark"
import { folder } from "../schema/folder"
import { bookmarkTag, tag } from "../schema/tag"

export async function getBookmarksByUserId({
  userId,
  type,
  platform,
  folderId,
  search,
  limit = 20,
  offset = 0,
}: {
  userId: string
  type?: string
  platform?: string
  folderId?: string
  search?: string
  limit?: number
  offset?: number
}) {
  const conditions = [eq(bookmark.userId, userId), eq(bookmark.isArchived, false)]

  if (type && type !== "all") {
    conditions.push(eq(bookmark.type, type))
  }

  if (platform && platform !== "all") {
    conditions.push(eq(bookmark.platform, platform))
  }

  if (folderId) {
    conditions.push(eq(bookmark.folderId, folderId))
  }

  if (search) {
    // SQLite 的 LIKE 对 ASCII 默认不区分大小写，等价原 pg 的 ilike
    conditions.push(
      or(like(bookmark.title, `%${search}%`), like(bookmark.description, `%${search}%`))!
    )
  }

  const [items, countResult] = await Promise.all([
    db
      .select({
        id: bookmark.id,
        type: bookmark.type,
        title: bookmark.title,
        description: bookmark.description,
        url: bookmark.url,
        coverImage: bookmark.coverImage,
        isFavorite: bookmark.isFavorite,
        createdAt: bookmark.createdAt,
        folderId: bookmark.folderId,
        folderName: folder.name,
        folderEmoji: folder.emoji,
        platform: bookmark.platform,
      })
      .from(bookmark)
      .leftJoin(folder, eq(bookmark.folderId, folder.id))
      .where(and(...conditions))
      .orderBy(desc(bookmark.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(bookmark)
      .where(and(...conditions)),
  ])

  return {
    bookmarks: items,
    total: Number(countResult[0]?.count ?? 0),
    hasMore: offset + limit < Number(countResult[0]?.count ?? 0),
  }
}

export async function getBookmarkById({ id, userId }: { id: string; userId: string }) {
  const result = await db
    .select({
      id: bookmark.id,
      type: bookmark.type,
      title: bookmark.title,
      description: bookmark.description,
      url: bookmark.url,
      content: bookmark.content,
      coverImage: bookmark.coverImage,
      isFavorite: bookmark.isFavorite,
      sourceType: bookmark.sourceType,
      fileUrl: bookmark.fileUrl,
      fileExtension: bookmark.fileExtension,
      ingestStatus: bookmark.ingestStatus,
      ingestError: bookmark.ingestError,
      platform: bookmark.platform,
      author: bookmark.author,
      language: bookmark.language,
      sourceCreatedAt: bookmark.sourceCreatedAt,
      createdAt: bookmark.createdAt,
      updatedAt: bookmark.updatedAt,
      folderId: bookmark.folderId,
      folderName: folder.name,
      folderEmoji: folder.emoji,
    })
    .from(bookmark)
    .leftJoin(folder, eq(bookmark.folderId, folder.id))
    .where(and(eq(bookmark.id, id), eq(bookmark.userId, userId)))
    .limit(1)

  return result[0] ?? null
}

export function getBookmarkTags(bookmarkId: string) {
  return db
    .select({ id: tag.id, name: tag.name, color: tag.color })
    .from(bookmarkTag)
    .innerJoin(tag, eq(bookmarkTag.tagId, tag.id))
    .where(eq(bookmarkTag.bookmarkId, bookmarkId))
}
