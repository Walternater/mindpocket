import { relations } from "drizzle-orm"
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"
import { user } from "./auth"

const timestampMs = (name: string) => integer(name, { mode: "timestamp_ms" })

export const chat = sqliteTable(
  "chat",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    activeStreamId: text("active_stream_id"),
    createdAt: timestampMs("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [index("chat_userId_idx").on(table.userId)]
)

export const message = sqliteTable(
  "message",
  {
    id: text("id").primaryKey(),
    chatId: text("chat_id")
      .notNull()
      .references(() => chat.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    parts: text("parts", { mode: "json" }).notNull(),
    attachments: text("attachments", { mode: "json" })
      .notNull()
      .$defaultFn(() => []),
    createdAt: timestampMs("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [index("message_chatId_idx").on(table.chatId)]
)

export const chatRelations = relations(chat, ({ one, many }) => ({
  user: one(user, {
    fields: [chat.userId],
    references: [user.id],
  }),
  messages: many(message),
}))

export const messageRelations = relations(message, ({ one }) => ({
  chat: one(chat, {
    fields: [message.chatId],
    references: [chat.id],
  }),
}))
