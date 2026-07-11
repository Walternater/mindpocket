// B 站凭据 API：查询是否已保存 / 保存 / 删除 / 测试有效性
import { Hono } from "hono"
import {
  deleteBilibiliCredentials,
  hasBilibiliCredentials,
  saveBilibiliCredentials,
} from "../../db/queries/bilibili-credentials"
import type { HonoEnv } from "../env"

export const bilibiliCredentialsRoute = new Hono<HonoEnv>()

// GET / 是否已保存凭据
bilibiliCredentialsRoute.get("/", async (c) => {
  const userId = c.get("session").user.id

  const hasCredentials = await hasBilibiliCredentials(userId)
  return c.json({ hasCredentials })
})

// POST / 保存（加密存储）凭据
bilibiliCredentialsRoute.post("/", async (c) => {
  const userId = c.get("session").user.id

  try {
    const body = await c.req.json()
    const { sessdata, biliJct, buvid3 } = body

    if (!(sessdata && biliJct && buvid3)) {
      return c.json({ error: "Missing required fields: sessdata, biliJct, buvid3" }, 400)
    }

    await saveBilibiliCredentials(userId, {
      sessdata,
      biliJct,
      buvid3,
    })

    return c.json({ success: true })
  } catch (error) {
    console.error("Failed to save Bilibili credentials:", error)
    return c.json({ error: "Failed to save credentials" }, 500)
  }
})

// DELETE / 删除凭据
bilibiliCredentialsRoute.delete("/", async (c) => {
  const userId = c.get("session").user.id

  try {
    await deleteBilibiliCredentials(userId)
    return c.json({ success: true })
  } catch (error) {
    console.error("Failed to delete Bilibili credentials:", error)
    return c.json({ error: "Failed to delete credentials" }, 500)
  }
})

// POST /test 用一个已知有字幕的视频测试凭据有效性
bilibiliCredentialsRoute.post("/test", async (c) => {
  try {
    const body = await c.req.json()
    const { sessdata, biliJct, buvid3 } = body

    if (!(sessdata && biliJct && buvid3)) {
      return c.json({ error: "Missing required fields: sessdata, biliJct, buvid3" }, 400)
    }

    // 已知有字幕的测试视频
    const testBvid = "BV1uT4y1P7CX"
    const videoInfoRes = await fetch(
      `https://api.bilibili.com/x/web-interface/view?bvid=${testBvid}`,
      {
        headers: { "User-Agent": "Mozilla/5.0" },
      }
    )
    const videoInfo = (await videoInfoRes.json()) as {
      data?: { aid?: number; cid?: number }
    }

    if (!(videoInfo?.data?.aid && videoInfo?.data?.cid)) {
      return c.json({ error: "Failed to fetch test video info" }, 500)
    }

    const { aid, cid } = videoInfo.data
    const cookieHeader = `SESSDATA=${sessdata}; bili_jct=${biliJct}; buvid3=${buvid3}`

    const playerRes = await fetch(
      `https://api.bilibili.com/x/player/wbi/v2?aid=${aid}&cid=${cid}`,
      {
        headers: {
          Cookie: cookieHeader,
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Referer: "https://www.bilibili.com",
        },
      }
    )

    const playerData = (await playerRes.json()) as { code?: number; message?: string }

    if (playerData.code !== 0) {
      return c.json(
        {
          valid: false,
          error: "Invalid credentials or API error",
          details: playerData.message,
        },
        200
      )
    }

    return c.json({
      valid: true,
      message: "Credentials are valid",
    })
  } catch (error) {
    console.error("Failed to test Bilibili credentials:", error)
    return c.json({ error: "Failed to test credentials" }, 500)
  }
})
