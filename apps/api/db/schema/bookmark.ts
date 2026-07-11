import { relations } from "drizzle-orm"
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"
import { user } from "./auth"
import { folder } from "./folder"
import { bookmarkTag } from "./tag"

const timestampMs = (name: string) => integer(name, { mode: "timestamp_ms" })

export const bookmark = sqliteTable(
  "bookmark",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    folderId: text("folder_id").references(() => folder.id, {
      onDelete: "set null",
    }),
    type: text("type").notNull().default("link"),
    title: text("title").notNull(),
    description: text("description"),
    url: text("url"),
    content: text("content"),
    coverImage: text("cover_image"),
    metadata: text("metadata", { mode: "json" }),
    isFavorite: integer("is_favorite", { mode: "boolean" }).notNull().default(false),
    sourceType: text("source_type"),
    clientSource: text("client_source").notNull().default("web"),
    fileUrl: text("file_url"),
    fileExtension: text("file_extension"),
    fileSize: integer("file_size"),
    ingestStatus: text("ingest_status").notNull().default("pending"),
    ingestError: text("ingest_error"),
    platform: text("platform"),
    author: text("author"),
    language: text("language"),
    sourceCreatedAt: timestampMs("source_created_at"),
    isArchived: integer("is_archived", { mode: "boolean" }).notNull().default(false),
    createdAt: timestampMs("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestampMs("updated_at")
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("bookmark_userId_idx").on(table.userId),
    index("bookmark_folderId_idx").on(table.folderId),
    index("bookmark_type_idx").on(table.type),
    index("bookmark_createdAt_idx").on(table.createdAt),
  ]
)

export const bookmarkRelations = relations(bookmark, ({ one, many }) => ({
  user: one(user, {
    fields: [bookmark.userId],
    references: [user.id],
  }),
  folder: one(folder, {
    fields: [bookmark.folderId],
    references: [folder.id],
  }),
  bookmarkTags: many(bookmarkTag),
}))
