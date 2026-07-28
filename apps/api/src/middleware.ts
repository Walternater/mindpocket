import { createMiddleware } from "hono/factory"
import { createDb } from "../db/client"
import { requestContext } from "./context"
import type { HonoEnv } from "./env"
import { createAuth } from "./lib/auth"

// 免登录路由前缀（与原 proxy.ts 的 publicRoutes 一致）
const PUBLIC_API_PREFIXES = ["/api/auth", "/api/check-registration", "/api/health"]

// 浏览器直连允许的跨域来源（原 lib/cors.ts）
const ALLOWED_ORIGINS = new Set([
  "http://127.0.0.1:3000",
  "http://localhost:3000",
  "http://127.0.0.1:8081",
  "http://localhost:8081",
])

/** 每请求注入 db 与 auth 实例，并初始化 AsyncLocalStorage 上下文 */
export const contextMiddleware = createMiddleware<HonoEnv>(async (c, next) => {
  const db = createDb(c.env.DB)
  c.set("db", db)
  c.set("auth", createAuth(c.env, db))
  await requestContext.run({ env: c.env, db, executionCtx: c.executionCtx }, () => next())
})

/** CORS：合并原 proxy.ts 的 chrome 扩展逻辑与 lib/cors.ts 白名单 */
export const corsMiddleware = createMiddleware<HonoEnv>(async (c, next) => {
  const origin = c.req.header("origin") ?? ""
  const allowed = origin.startsWith("chrome-extension://") || ALLOWED_ORIGINS.has(origin)

  // 预检请求直接返回
  if (c.req.method === "OPTIONS" && allowed) {
    const requestedHeaders = c.req.header("access-control-request-headers")
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
        "Access-Control-Allow-Headers":
          requestedHeaders || "Content-Type, Authorization, x-requested-with",
        Vary: "Origin, Access-Control-Request-Headers",
      },
    })
  }

  await next()

  if (allowed) {
    c.res.headers.set("Access-Control-Allow-Origin", origin)
    c.res.headers.set("Access-Control-Allow-Credentials", "true")
    c.res.headers.append("Vary", "Origin")
  }
})

/** 登录守卫：非公开 API 校验 session 并注入上下文（原 proxy.ts 的 API 分支） */
export const authGuard = createMiddleware<HonoEnv>(async (c, next) => {
  const { pathname } = new URL(c.req.url)
  if (PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    await next()
    return
  }

  const session = await c.get("auth").api.getSession({ headers: c.req.raw.headers })
  if (!session) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  c.set("session", session)
  await next()
})
