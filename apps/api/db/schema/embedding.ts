import { index, sqliteTable, text } from "drizzle-orm/sqlite-core"
import { user } from "./auth"
import { bookmark } from "./bookmark"

/**
 * embedding chunk 元数据表
 * 向量本体存 Cloudflare Vectorize（向量 id = 本表行 id），
 * D1 只保存 chunk 文本用于展示与回填
 */
export const embedding = sqliteTable(
  "embedding",
  {
    id: text("id").primaryKey(),
    bookmarkId: text("bookmark_id")
      .notNull()
      .references(() => bookmark.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
  },
  (table) => [
    index("embedding_bookmarkId_idx").on(table.bookmarkId),
    index("embedding_userId_idx").on(table.userId),
  ]
)
