import { relations } from "drizzle-orm"
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"
import { user } from "./auth"

const timestampMs = (name: string) => integer(name, { mode: "timestamp_ms" })

export const bilibiliCredentials = sqliteTable(
  "bilibili_credentials",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    sessdata: text("sessdata").notNull(), // AES-256-GCM encrypted
    biliJct: text("bili_jct").notNull(), // AES-256-GCM encrypted
    buvid3: text("buvid3").notNull(),
    createdAt: timestampMs("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestampMs("updated_at")
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("bilibili_credentials_userId_idx").on(table.userId)]
)

export const bilibiliCredentialsRelations = relations(bilibiliCredentials, ({ one }) => ({
  user: one(user, {
    fields: [bilibiliCredentials.userId],
    references: [user.id],
  }),
}))
