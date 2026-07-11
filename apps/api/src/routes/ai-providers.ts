// AI 服务商 API：增删改查 / 设为默认 / 连通性测试
import { embed, generateText } from "ai"
import { Hono } from "hono"
import { z } from "zod"
import {
  clearDefaultProvider,
  createProvider,
  deleteProvider,
  getProvidersByUserId,
  getProviderWithDecryptedKey,
  updateProvider,
} from "../../db/queries/ai-provider"
import type { HonoEnv } from "../env"
import { getChatModel, getEmbeddingModel } from "../lib/ai/provider"

// 创建参数校验
const createSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["chat", "embedding"]),
  baseUrl: z.string().url(),
  apiKey: z.string().min(1),
  modelId: z.string().min(1),
  isDefault: z.boolean().optional(),
})

// 更新参数校验
const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  baseUrl: z.string().url().optional(),
  apiKey: z.string().min(1).optional(),
  modelId: z.string().min(1).optional(),
  isDefault: z.boolean().optional(),
})

export const aiProvidersRoute = new Hono<HonoEnv>()

// GET / 服务商列表（不含明文 apiKey）
aiProvidersRoute.get("/", async (c) => {
  const userId = c.get("session").user.id

  const providers = await getProvidersByUserId(userId)
  return c.json(providers)
})

// POST / 创建服务商
aiProvidersRoute.post("/", async (c) => {
  const userId = c.get("session").user.id

  const body = await c.req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400)
  }

  const { id } = await createProvider({
    userId,
    ...parsed.data,
  })

  return c.json({ id }, 201)
})

// PATCH /:id 更新服务商
aiProvidersRoute.patch("/:id", async (c) => {
  const userId = c.get("session").user.id

  const id = c.req.param("id")
  const body = await c.req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400)
  }

  await updateProvider(id, userId, parsed.data)
  return c.json({ ok: true })
})

// DELETE /:id 删除服务商
aiProvidersRoute.delete("/:id", async (c) => {
  const userId = c.get("session").user.id

  const id = c.req.param("id")
  await deleteProvider(id, userId)
  return c.json({ ok: true })
})

// POST /:id/default 设为同类型默认
aiProvidersRoute.post("/:id/default", async (c) => {
  const userId = c.get("session").user.id

  const id = c.req.param("id")
  const provider = await getProviderWithDecryptedKey(id, userId)
  if (!provider) {
    return c.json({ error: "Not found" }, 404)
  }

  // 先清除同类型原默认，再设置新默认
  await clearDefaultProvider(userId, provider.type)
  await updateProvider(id, userId, { isDefault: true })

  return c.json({ ok: true })
})

// POST /:id/test 测试连通性（chat 发一条消息 / embedding 做一次向量化）
aiProvidersRoute.post("/:id/test", async (c) => {
  const userId = c.get("session").user.id

  const id = c.req.param("id")
  const provider = await getProviderWithDecryptedKey(id, userId)
  if (!provider) {
    return c.json({ error: "Not found" }, 404)
  }

  try {
    if (provider.type === "chat") {
      await generateText({
        model: getChatModel(provider),
        prompt: "Hi",
      })
    } else {
      await embed({
        model: getEmbeddingModel(provider),
        value: "test",
      })
    }

    return c.json({ ok: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error"
    return c.json({ error: message }, 400)
  }
})
