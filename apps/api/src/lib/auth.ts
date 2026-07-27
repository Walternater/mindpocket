import { expo } from "@better-auth/expo"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { APIError } from "better-auth/api"
import { bearer } from "better-auth/plugins/bearer"
import { deviceAuthorization } from "better-auth/plugins/device-authorization"
import { count } from "drizzle-orm"
import { type Database, schema } from "../../db/client"
import type { Env } from "../env"
import { BETTER_AUTH_COOKIE_PREFIX } from "./auth-flow"

const DEFAULT_APP_URL = "http://127.0.0.1:8787"
const CLI_CLIENT_ID = "mindpocket-cli"
const EXT_CLIENT_ID = "mindpocket-extension"

/**
 * 每请求构造 Better Auth 实例
 * Workers 环境下 D1 binding 只在请求上下文可用，无法用模块级单例
 */
export function createAuth(env: Env, db: Database) {
  const appUrl = env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL

  return betterAuth({
    appName: "MindPocket",
    baseURL: appUrl,
    secret: env.BETTER_AUTH_SECRET,
    advanced: {
      // Keep the Better Auth cookie prefix explicit so route-level state checks stay in sync.
      cookiePrefix: BETTER_AUTH_COOKIE_PREFIX,
    },
    trustedOrigins: [
      appUrl,
      "chrome-extension://*",
      DEFAULT_APP_URL,
      "http://127.0.0.1:8081",
      "http://localhost:8081",
      "mindpocket://",
      "exp://",
      "exp://**",
    ],
    database: drizzleAdapter(db, {
      provider: "sqlite",
      // 需要显式传入 schema，否则插件添加的模型无法被适配器发现
      schema,
    }),
    emailAndPassword: {
      enabled: true,
      sendResetPassword(_data, _request) {
        // Send an email to the user with a link to reset their password
        return Promise.resolve()
      },
    },
    databaseHooks: {
      user: {
        create: {
          before: async () => {
            const result = await db.select({ count: count() }).from(schema.user)
            const userCount = result[0]?.count || 0
            if (userCount > 0) {
              throw new APIError("FORBIDDEN", {
                message: "注册已关闭",
              })
            }
          },
        },
      },
    },
    plugins: [
      bearer(),
      expo(),
      deviceAuthorization({
        expiresIn: "15m",
        interval: "5s",
        verificationUri: "/device",
        validateClient(clientId) {
          return clientId === CLI_CLIENT_ID || clientId === EXT_CLIENT_ID
        },
      }),
    ],
  })
}

export type Auth = ReturnType<typeof createAuth>
export type AuthSession = NonNullable<Awaited<ReturnType<Auth["api"]["getSession"]>>>
