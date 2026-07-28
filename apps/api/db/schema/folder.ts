import { relations } from "drizzle-orm"
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"
import { user } from "./auth"
import { bookmark } from "./bookmark"

const timestampMs = (name: string) => integer(name, { mode: "timestamp_ms" })

export const folder = sqliteTable(
  "folder",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    emoji: text("emoji").notNull().default("📁"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestampMs("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestampMs("updated_at")
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("folder_userId_idx").on(table.userId)]
)

export const folderRelations = relations(folder, ({ one, many }) => ({
  user: one(user, {
    fields: [folder.userId],
    references: [user.id],
  }),
  bookmarks: many(bookmark),
}))
