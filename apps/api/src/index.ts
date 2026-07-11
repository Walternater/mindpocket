import { Hono } from "hono"
import type { HonoEnv } from "./env"
import { authGuard, contextMiddleware, corsMiddleware } from "./middleware"
import { aiProvidersRoute } from "./routes/ai-providers"
import { bilibiliCredentialsRoute } from "./routes/bilibili-credentials"
import { bookmarksRoute } from "./routes/bookmarks"
import { chatRoute } from "./routes/chat"
import { checkRegistrationRoute } from "./routes/check-registration"
import { dashboardRoute } from "./routes/dashboard"
import { filesRoute } from "./routes/files"
import { foldersRoute } from "./routes/folders"
import { historyRoute } from "./routes/history"
import { ingestRoute } from "./routes/ingest"
import { searchRoute } from "./routes/search"
import { userRoute } from "./routes/user"

const app = new Hono<HonoEnv>()

// 中间件顺序：CORS → 上下文注入 → 登录守卫
app.use("/api/*", corsMiddleware)
app.use("/api/*", contextMiddleware)
app.use("/api/*", authGuard)

// Better Auth 全部端点
app.on(["GET", "POST"], "/api/auth/*", (c) => c.get("auth").handler(c.req.raw))

// 健康检查（与原 Next.js /api/health 契约一致）
app.get("/api/health", (c) => c.json({ ok: true }))

// 业务路由（路径与原 Next.js API 完全一致）
app.route("/api/chat", chatRoute)
app.route("/api/ingest", ingestRoute)
app.route("/api/search", searchRoute)
app.route("/api/bookmarks", bookmarksRoute)
app.route("/api/folders", foldersRoute)
app.route("/api/dashboard", dashboardRoute)
app.route("/api/history", historyRoute)
app.route("/api/user", userRoute)
app.route("/api/check-registration", checkRegistrationRoute)
app.route("/api/ai-providers", aiProvidersRoute)
app.route("/api/bilibili-credentials", bilibiliCredentialsRoute)
app.route("/api/files", filesRoute)

export default app
