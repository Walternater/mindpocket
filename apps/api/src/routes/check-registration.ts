// 注册开关检查 API（公开路由，authGuard 已放行，不能读取 session）
import { count } from "drizzle-orm"
import { Hono } from "hono"
import { db } from "@/context"
import { user } from "../../db/schema/auth"
import type { HonoEnv } from "../env"

export const checkRegistrationRoute = new Hono<HonoEnv>()

checkRegistrationRoute.get("/", async (c) => {
  try {
    // 系统仅允许一个用户：已存在用户则关闭注册
    const result = await db.select({ count: count() }).from(user)
    const userCount = result[0]?.count || 0

    return c.json({
      allowed: userCount === 0,
      message: userCount > 0 ? "注册已关闭，系统仅允许一个用户" : null,
    })
  } catch (error) {
    console.error("Error checking registration status:", error)
    return c.json({ allowed: false, message: "检查注册状态失败" }, 500)
  }
})
