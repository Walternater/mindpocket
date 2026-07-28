// 数据摄入 API，支持 URL、扩展程序和文件上传三种导入方式
import { INGEST_STATUSES } from "@repo/types"
import { and, desc, eq, inArray, lt, or, type SQL } from "drizzle-orm"
import { Hono } from "hono"
import { db } from "@/context"
import { bookmark } from "../../db/schema/bookmark"
import type { HonoEnv } from "../env"
import { resolveFolderForIngest } from "../lib/ingest/auto-folder"
import {
  completeBrowserIngest,
  failBrowserIngest,
  ingestFromExtension,
  ingestFromFile,
  ingestFromUrl,
} from "../lib/ingest/pipeline"
import type { ClientSource } from "../lib/ingest/types"
import {
  ALLOWED_INGEST_FILE_EXTENSIONS,
  CLIENT_SOURCES,
  ingestExtensionSchema,
  ingestUrlSchema,
} from "../lib/ingest/types"

const MAX_FILE_SIZE = 50 * 1024 * 1024
const FILE_EXT_REGEX = /\.[^.]+$/
const STALE_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes

export const ingestRoute = new Hono<HonoEnv>()

function getFileExtension(fileName: string) {
  return fileName.match(FILE_EXT_REGEX)?.[0]?.toLowerCase() ?? ""
}

function isClientSource(value: string | null): value is ClientSource {
  return value !== null && CLIENT_SOURCES.some((source) => source === value)
}

function resolveFolderIdOrAuto(params: {
  userId: string
  folderId?: string | null
  sourceType: "url" | "file" | "extension"
  url?: string
  title?: string
  fileName?: string
}) {
  const { folderId, ...rest } = params
  if (folderId) {
    return folderId
  }

  return resolveFolderForIngest(rest)
}

ingestRoute.post("/", async (c) => {
  const userId = c.get("session").user.id
  const contentType = c.req.header("content-type") ?? ""

  try {
    if (contentType.includes("multipart/form-data")) {
      return await handleFileUpload(c.req.raw, userId, (data, status) =>
        c.json(data, status as 201)
      )
    }

    return await handleJsonIngest(c.req.raw, userId, (data, status) => c.json(data, status as 201))
  } catch (error) {
    console.error("[ingest] Unexpected error:", error)
    return c.json({ error: "Internal server error" }, 500)
  }
})

type JsonResponder = (data: unknown, status: number) => Response

async function handleJsonIngest(request: Request, userId: string, respond: JsonResponder) {
  // biome-ignore lint/suspicious/noExplicitAny: 原始请求体在 zod 校验前只做存在性探测
  const body = (await request.json()) as Record<string, any>
  console.log("[ingest] request", {
    clientSource: body?.clientSource,
    hasMarkdown: typeof body?.markdown === "string" && body.markdown.length > 0,
    hasHtml: typeof body?.html === "string" && body.html.length > 0,
    url: body?.url,
  })

  const isExtensionClient = body?.clientSource === "extension"
  if (isExtensionClient || body.markdown || body.html) {
    const parsed = ingestExtensionSchema.safeParse(body)
    if (!parsed.success) {
      return respond({ error: "Invalid request", details: parsed.error.flatten() }, 400)
    }

    const resolvedFolderId = await resolveFolderIdOrAuto({
      userId,
      folderId: parsed.data.folderId,
      sourceType: "extension",
      url: parsed.data.url,
      title: parsed.data.title,
    })

    const result = await ingestFromExtension({
      userId,
      url: parsed.data.url,
      markdown: parsed.data.markdown,
      html: parsed.data.html,
      folderId: resolvedFolderId ?? undefined,
      title: parsed.data.title,
      clientSource: parsed.data.clientSource,
    })
    return respond(result, 201)
  }

  const parsed = ingestUrlSchema.safeParse(body)
  if (!parsed.success) {
    return respond({ error: "Invalid request", details: parsed.error.flatten() }, 400)
  }

  const resolvedFolderId = await resolveFolderIdOrAuto({
    userId,
    folderId: parsed.data.folderId,
    sourceType: "url",
    url: parsed.data.url,
    title: parsed.data.title,
  })

  const result = await ingestFromUrl({
    userId,
    url: parsed.data.url,
    folderId: resolvedFolderId ?? undefined,
    title: parsed.data.title,
    clientSource: parsed.data.clientSource,
  })
  return respond(result, 201)
}

async function handleFileUpload(request: Request, userId: string, respond: JsonResponder) {
  const formData = await request.formData()
  const file = formData.get("file") as File | null
  const rawFolderId = formData.get("folderId")
  const folderId =
    typeof rawFolderId === "string" && rawFolderId.trim().length > 0 ? rawFolderId.trim() : null
  const title = formData.get("title") as string | null
  const clientSource = formData.get("clientSource") as string | null
  // 客户端解析好的正文（PDF/Word 等在浏览器端解析后附带上传）
  const rawMarkdown = formData.get("markdown")
  const extractedMarkdown =
    typeof rawMarkdown === "string" && rawMarkdown.trim().length > 0 ? rawMarkdown : undefined

  if (!file) {
    return respond({ error: "No file provided" }, 400)
  }

  if (!isClientSource(clientSource)) {
    return respond({ error: "Invalid or missing clientSource" }, 400)
  }

  if (file.size > MAX_FILE_SIZE) {
    return respond({ error: "File size exceeds 50MB limit" }, 400)
  }

  const ext = getFileExtension(file.name)
  if (!ALLOWED_INGEST_FILE_EXTENSIONS.includes(ext)) {
    return respond({ error: `Unsupported file type: ${ext}` }, 400)
  }

  const resolvedFolderId = await resolveFolderIdOrAuto({
    userId,
    folderId,
    sourceType: "file",
    title: title ?? undefined,
    fileName: file.name,
  })

  const result = await ingestFromFile({
    userId,
    file,
    folderId: resolvedFolderId ?? undefined,
    title: title ?? undefined,
    clientSource,
    extractedMarkdown,
  })

  return respond(result, 201)
}

/**
 * 浏览器抓取队列：扩展认领待抓任务
 * 认领即置 processing_browser（updatedAt 自动刷新作为租约时间），
 * 超过租约时间未回传的任务可被重新认领
 */
ingestRoute.post("/browser-tasks/claim", async (c) => {
  const userId = c.get("session").user.id
  const body = (await c.req.json().catch(() => ({}))) as { limit?: number }
  const limit = Math.min(Number(body?.limit) || 3, 10)

  const staleThreshold = new Date(Date.now() - STALE_TIMEOUT_MS)
  const candidates = await db
    .select({ id: bookmark.id, url: bookmark.url, title: bookmark.title })
    .from(bookmark)
    .where(
      and(
        eq(bookmark.userId, userId),
        or(
          eq(bookmark.ingestStatus, "pending_browser"),
          // 认领后超时未回传（扩展崩溃/浏览器关闭），允许重新认领
          and(
            eq(bookmark.ingestStatus, "processing_browser"),
            lt(bookmark.updatedAt, staleThreshold)
          )
        )
      )
    )
    .orderBy(desc(bookmark.createdAt))
    .limit(limit)

  if (candidates.length === 0) {
    return c.json({ tasks: [] })
  }

  await db
    .update(bookmark)
    .set({ ingestStatus: "processing_browser" })
    .where(
      and(
        eq(bookmark.userId, userId),
        inArray(
          bookmark.id,
          candidates.map((t) => t.id)
        )
      )
    )

  return c.json({ tasks: candidates })
})

// 浏览器抓取结果回传：成功带 markdown（或降级 html），失败带 error
ingestRoute.post("/:id/browser-result", async (c) => {
  const userId = c.get("session").user.id
  const id = c.req.param("id")
  const body = (await c.req.json()) as {
    markdown?: string
    html?: string
    title?: string
    error?: string
  }

  const [row] = await db
    .select({ id: bookmark.id })
    .from(bookmark)
    .where(and(eq(bookmark.id, id), eq(bookmark.userId, userId)))
    .limit(1)
  if (!row) {
    return c.json({ error: "Not found" }, 404)
  }

  if (!(body.markdown || body.html)) {
    await failBrowserIngest(id, body.error || "Browser capture failed")
    return c.json({ ok: true })
  }

  await completeBrowserIngest({
    bookmarkId: id,
    userId,
    markdown: body.markdown,
    html: body.html,
    title: body.title,
  })
  return c.json({ ok: true })
})

// 摄入历史（必须注册在 /:id 之前，避免被参数路由吞掉）
ingestRoute.get("/history", async (c) => {
  const userId = c.get("session").user.id

  // Auto-fail stale pending/processing bookmarks older than 5 minutes
  const staleThreshold = new Date(Date.now() - STALE_TIMEOUT_MS)
  await db
    .update(bookmark)
    .set({ ingestStatus: "failed", ingestError: "Ingest timed out" })
    .where(
      and(
        eq(bookmark.userId, userId),
        inArray(bookmark.ingestStatus, ["pending", "processing"]),
        lt(bookmark.createdAt, staleThreshold)
      )
    )

  // 浏览器认领超时的任务回退到待抓状态（等下次浏览器在线时重试）
  await db
    .update(bookmark)
    .set({ ingestStatus: "pending_browser" })
    .where(
      and(
        eq(bookmark.userId, userId),
        eq(bookmark.ingestStatus, "processing_browser"),
        lt(bookmark.updatedAt, staleThreshold)
      )
    )

  const status = c.req.query("status")
  const limit = Math.min(Number(c.req.query("limit")) || 20, 100)
  const offset = Number(c.req.query("offset")) || 0

  const conditions: SQL[] = [eq(bookmark.userId, userId)]

  if (status && INGEST_STATUSES.includes(status as (typeof INGEST_STATUSES)[number])) {
    conditions.push(eq(bookmark.ingestStatus, status))
  }

  const items = await db
    .select({
      id: bookmark.id,
      title: bookmark.title,
      type: bookmark.type,
      sourceType: bookmark.sourceType,
      clientSource: bookmark.clientSource,
      ingestStatus: bookmark.ingestStatus,
      ingestError: bookmark.ingestError,
      url: bookmark.url,
      platform: bookmark.platform,
      createdAt: bookmark.createdAt,
    })
    .from(bookmark)
    .where(and(...conditions))
    .orderBy(desc(bookmark.createdAt))
    .limit(limit)
    .offset(offset)

  return c.json({ items })
})

// 单条摄入状态查询
ingestRoute.get("/:id", async (c) => {
  const userId = c.get("session").user.id
  const id = c.req.param("id")

  const result = await db
    .select({
      id: bookmark.id,
      title: bookmark.title,
      type: bookmark.type,
      ingestStatus: bookmark.ingestStatus,
      ingestError: bookmark.ingestError,
      createdAt: bookmark.createdAt,
    })
    .from(bookmark)
    .where(and(eq(bookmark.id, id), eq(bookmark.userId, userId)))

  const item = result[0]
  if (!item) {
    return c.json({ error: "Not found" }, 404)
  }

  return c.json(item)
})
