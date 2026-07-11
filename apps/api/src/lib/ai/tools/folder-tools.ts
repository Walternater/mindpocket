import { tool } from "ai"
import { and, eq, sql } from "drizzle-orm"
import { nanoid } from "nanoid"
import { z } from "zod"
import { db } from "@/context"
import { bookmark } from "../../../../db/schema/bookmark"
import { folder } from "../../../../db/schema/folder"

const DESCRIPTION_MAX_LENGTH = 200

function normalizeDescription(value: string | undefined): string | null {
  if (typeof value !== "string") {
    return null
  }
  const normalized = value.trim().slice(0, DESCRIPTION_MAX_LENGTH)
  return normalized || null
}

function normalizeFolderName(name: string): string {
  return name.trim().toLowerCase()
}

export function createListFoldersTool(userId: string) {
  return tool({
    description: "获取当前用户的所有文件夹列表",
    inputSchema: z.object({}),
    execute: async () => {
      try {
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

        return { success: true, data: { folders } }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "list_folders_failed",
        }
      }
    },
  })
}

export function createCreateFolderTool(userId: string) {
  return tool({
    description: "创建新文件夹",
    inputSchema: z.object({
      name: z.string().min(1).describe("文件夹名称"),
      description: z.string().optional().describe("文件夹描述，可选，最多 200 字"),
      emoji: z.string().optional().describe("文件夹图标 emoji，可选"),
    }),
    execute: async ({ name, description, emoji }) => {
      try {
        const trimmedName = name.trim()
        if (!trimmedName) {
          return { success: false, error: "folder_name_required" }
        }

        const existing = await db
          .select({
            id: folder.id,
            name: folder.name,
            description: folder.description,
            emoji: folder.emoji,
            sortOrder: folder.sortOrder,
          })
          .from(folder)
          .where(eq(folder.userId, userId))

        const duplicate = existing.find(
          (f) => normalizeFolderName(f.name) === normalizeFolderName(trimmedName)
        )
        if (duplicate) {
          return { success: true, data: { folder: duplicate } }
        }

        const [max] = await db
          .select({ maxOrder: sql<number>`coalesce(max(${folder.sortOrder}), -1)` })
          .from(folder)
          .where(eq(folder.userId, userId))

        const result = await db
          .insert(folder)
          .values({
            id: nanoid(),
            userId,
            name: trimmedName,
            description: normalizeDescription(description),
            emoji: typeof emoji === "string" && emoji.trim() ? emoji.trim() : "📁",
            sortOrder: (max?.maxOrder ?? -1) + 1,
          })
          .returning({
            id: folder.id,
            name: folder.name,
            description: folder.description,
            emoji: folder.emoji,
            sortOrder: folder.sortOrder,
          })

        return { success: true, data: { folder: result[0] } }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "create_folder_failed",
        }
      }
    },
  })
}

export function createRenameFolderTool(userId: string) {
  return tool({
    description: "重命名文件夹，可选更新描述",
    inputSchema: z.object({
      folderId: z.string().min(1),
      name: z.string().min(1).describe("新文件夹名称"),
      description: z.string().nullable().optional().describe("新描述，null 表示清空"),
    }),
    execute: async ({ folderId, name, description }) => {
      try {
        const trimmedName = name.trim()
        if (!trimmedName) {
          return { success: false, error: "folder_name_required" }
        }

        const updates: Record<string, unknown> = { name: trimmedName }
        if (description === null) {
          updates.description = null
        } else if (description !== undefined) {
          updates.description = normalizeDescription(description)
        }

        const result = await db
          .update(folder)
          .set(updates)
          .where(and(eq(folder.id, folderId), eq(folder.userId, userId)))
          .returning({
            id: folder.id,
            name: folder.name,
            description: folder.description,
            emoji: folder.emoji,
          })

        if (result.length === 0) {
          return { success: false, error: "folder_not_found" }
        }

        return { success: true, data: { folder: result[0] } }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "rename_folder_failed",
        }
      }
    },
  })
}

export function createDeleteFolderTool(userId: string) {
  return tool({
    description: "删除文件夹",
    inputSchema: z.object({
      folderId: z.string().min(1),
    }),
    execute: async ({ folderId }) => {
      try {
        const result = await db
          .delete(folder)
          .where(and(eq(folder.id, folderId), eq(folder.userId, userId)))
          .returning({ id: folder.id })

        if (result.length === 0) {
          return { success: false, error: "folder_not_found" }
        }

        return { success: true, data: { deletedFolderId: folderId } }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "delete_folder_failed",
        }
      }
    },
  })
}

export function createMoveBookmarkTool(userId: string) {
  return tool({
    description: "修改文件（书签）所属文件夹。targetFolderId 为 null 时表示移出文件夹",
    inputSchema: z.object({
      bookmarkId: z.string().min(1),
      targetFolderId: z.string().nullable(),
    }),
    execute: async ({ bookmarkId, targetFolderId }) => {
      try {
        const [bookmarkRow] = await db
          .select({ id: bookmark.id })
          .from(bookmark)
          .where(and(eq(bookmark.id, bookmarkId), eq(bookmark.userId, userId)))
          .limit(1)

        if (!bookmarkRow) {
          return { success: false, error: "bookmark_not_found" }
        }

        if (targetFolderId) {
          const [folderRow] = await db
            .select({ id: folder.id })
            .from(folder)
            .where(and(eq(folder.id, targetFolderId), eq(folder.userId, userId)))
            .limit(1)

          if (!folderRow) {
            return { success: false, error: "target_folder_not_found" }
          }
        }

        await db
          .update(bookmark)
          .set({ folderId: targetFolderId ?? null })
          .where(and(eq(bookmark.id, bookmarkId), eq(bookmark.userId, userId)))

        return {
          success: true,
          data: { bookmarkId, folderId: targetFolderId ?? null },
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "move_bookmark_failed",
        }
      }
    },
  })
}
