import { drizzle } from "drizzle-orm/d1"
import { userAiProvider, userAiProviderRelations } from "./schema/ai-provider"
import {
  account,
  accountRelations,
  deviceCode,
  deviceCodeRelations,
  session,
  sessionRelations,
  twoFactor,
  twoFactorRelations,
  user,
  userRelations,
  verification,
} from "./schema/auth"
import { bilibiliCredentials, bilibiliCredentialsRelations } from "./schema/bilibili-credentials"
import { bookmark, bookmarkRelations } from "./schema/bookmark"
import { chat, chatRelations, message, messageRelations } from "./schema/chat"
import { embedding } from "./schema/embedding"
import { folder, folderRelations } from "./schema/folder"
import { bookmarkTag, bookmarkTagRelations, tag, tagRelations } from "./schema/tag"

// 显式组装 schema（Better Auth 适配器与 drizzle 关系查询都依赖它）
export const schema = {
  user,
  session,
  account,
  verification,
  deviceCode,
  twoFactor,
  userRelations,
  sessionRelations,
  accountRelations,
  deviceCodeRelations,
  twoFactorRelations,
  folder,
  folderRelations,
  bookmark,
  bookmarkRelations,
  tag,
  bookmarkTag,
  tagRelations,
  bookmarkTagRelations,
  chat,
  chatRelations,
  message,
  messageRelations,
  embedding,
  userAiProvider,
  userAiProviderRelations,
  bilibiliCredentials,
  bilibiliCredentialsRelations,
}

/**
 * 基于 D1 binding 创建 Drizzle 实例
 * Workers 环境下 binding 只在请求上下文可用，因此每请求构造（无连接池开销）
 */
export function createDb(d1: D1Database) {
  return drizzle(d1, { schema })
}

export type Database = ReturnType<typeof createDb>
