// 当前用户信息 API
import { Hono } from "hono"
import type { HonoEnv } from "../env"

export const userRoute = new Hono<HonoEnv>()

userRoute.get("/", (c) => {
  const { user } = c.get("session")

  return c.json({
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.image || "",
  })
})
