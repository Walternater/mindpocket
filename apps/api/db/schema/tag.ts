import { relations } from "drizzle-orm"
import { index, integer, primaryKey, sqliteTable, text, unique } from "drizzle-orm/sqlite-core"
import { user } from "./auth"
import { bookmark } from "./bookmark"

const timestampMs = (name: string) => integer(name, { mode: "timestamp_ms" })

export const tag = sqliteTable(
  "tag",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color"),
    createdAt: timestampMs("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("tag_userId_idx").on(table.userId),
    unique("tag_userId_name_unique").on(table.userId, table.name),
  ]
)

export const bookmarkTag = sqliteTable(
  "bookmark_tag",
  {
    bookmarkId: text("bookmark_id")
      .notNull()
      .references(() => bookmark.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tag.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.bookmarkId, table.tagId] }),
    index("bookmarkTag_tagId_idx").on(table.tagId),
  ]
)

export const tagRelations = relations(tag, ({ one, many }) => ({
  user: one(user, {
    fields: [tag.userId],
    references: [user.id],
  }),
  bookmarkTags: many(bookmarkTag),
}))

export const bookmarkTagRelations = relations(bookmarkTag, ({ one }) => ({
  bookmark: one(bookmark, {
    fields: [bookmarkTag.bookmarkId],
    references: [bookmark.id],
  }),
  tag: one(tag, {
    fields: [bookmarkTag.tagId],
    references: [tag.id],
  }),
}))
