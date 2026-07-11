import { relations } from "drizzle-orm"
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"
import { user } from "./auth"

const timestampMs = (name: string) => integer(name, { mode: "timestamp_ms" })

export const userAiProvider = sqliteTable(
  "user_ai_provider",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: text("type").notNull(), // "chat" | "embedding"
    baseUrl: text("base_url").notNull(),
    apiKey: text("api_key").notNull(), // AES-256-GCM encrypted
    modelId: text("model_id").notNull(),
    isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
    createdAt: timestampMs("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestampMs("updated_at")
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("user_ai_provider_userId_idx").on(table.userId)]
)

export const userAiProviderRelations = relations(userAiProvider, ({ one }) => ({
  user: one(user, {
    fields: [userAiProvider.userId],
    references: [user.id],
  }),
}))
