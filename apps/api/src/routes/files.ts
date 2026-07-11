import { Hono } from "hono"
import type { HonoEnv } from "../env"
import { put } from "../lib/storage/r2"

export const filesRoute = new Hono<HonoEnv>()

// 图片上传（≤5MB），存 R2 后返回公开 URL
filesRoute.post("/upload", async (c) => {
  try {
    const formData = await c.req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return c.json({ error: "No file uploaded" }, 400)
    }

    if (file.size > 5 * 1024 * 1024) {
      return c.json({ error: "File size should be less than 5MB" }, 400)
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!validTypes.includes(file.type)) {
      return c.json({ error: "File type should be JPEG, PNG, WebP or GIF" }, 400)
    }

    const fileBuffer = await file.arrayBuffer()

    const data = await put(file.name, fileBuffer, {
      access: "public",
    })

    return c.json(data)
  } catch {
    return c.json({ error: "Failed to process request" }, 500)
  }
})
