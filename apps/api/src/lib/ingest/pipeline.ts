import type { IngestResult, IngestStatus } from "@repo/types"
import { eq } from "drizzle-orm"
import { nanoid } from "nanoid"
import { db, runInBackground } from "@/context"
import { getDefaultProvider } from "../../../db/queries/ai-provider"
import { getBilibiliCredentials } from "../../../db/queries/bilibili-credentials"
import { bookmark } from "../../../db/schema/bookmark"
import { storeEmbeddings } from "../ai/embedding"
import { getEmbeddingModel } from "../ai/provider"
import { put } from "../storage/r2"
import {
  convertHtml,
  convertUrl,
  extractDescription,
  inferTypeFromExtension,
  inferTypeFromUrl,
} from "./converter"
import { convertWithoutHtml, convertWithPlatform, needsBrowser } from "./platforms"
import { HTML_FILE_EXTENSIONS, inferPlatform, TEXT_FILE_EXTENSIONS } from "./types"

const FILE_EXT_REGEX = /\.[^.]+$/

interface IngestUrlParams {
  userId: string
  url: string
  folderId?: string
  title?: string
  clientSource: string
}

interface IngestFileParams {
  userId: string
  file: File
  folderId?: string
  title?: string
  clientSource: string
  // 客户端解析好的正文（PDF/Word 等由浏览器端解析后上传）
  extractedMarkdown?: string
}

interface IngestExtensionParams {
  userId: string
  url: string
  markdown?: string
  html?: string
  folderId?: string
  title?: string
  clientSource: string
}

interface ConversionResult {
  title: string | null
  markdown: string
}

function sanitizeForDb(str: string): string {
  // 清理字符串，移除控制字符，截断到 1000 字符
  // biome-ignore lint/suspicious/noControlCharactersInRegex: strip NULL bytes
  return str.replace(/\x00/g, "").slice(0, 1000)
}

async function updateBookmarkStatus(bookmarkId: string, status: IngestStatus, error?: string) {
  await db
    .update(bookmark)
    .set({ ingestStatus: status, ingestError: error ? sanitizeForDb(error) : null })
    .where(eq(bookmark.id, bookmarkId))
}

async function completeBookmarkIngest(params: {
  bookmarkId: string
  userId: string
  result: ConversionResult
  fallbackTitle: string
}) {
  const { bookmarkId, userId, result, fallbackTitle } = params
  const finalTitle = result.title || fallbackTitle
  const description = extractDescription(result.markdown)

  await db
    .update(bookmark)
    .set({
      title: finalTitle,
      description,
      content: result.markdown,
      ingestStatus: "completed",
      ingestError: null,
    })
    .where(eq(bookmark.id, bookmarkId))

  await generateAndStoreEmbeddings(bookmarkId, result.markdown, userId)
}

async function failBookmarkIngest(bookmarkId: string, error: string) {
  await updateBookmarkStatus(bookmarkId, "failed", error)
}

async function generateAndStoreEmbeddings(bookmarkId: string, content: string, userId: string) {
  const config = await getDefaultProvider(userId, "embedding")
  if (!config) {
    return
  }

  const model = getEmbeddingModel(config)
  // storeEmbeddings 内部会先清理旧向量（Vectorize + D1）
  await storeEmbeddings(bookmarkId, userId, content, model)
}

export async function ingestFromUrl(params: IngestUrlParams): Promise<IngestResult> {
  const { userId, url, folderId, title: userTitle, clientSource } = params
  const bookmarkId = nanoid()
  const type = inferTypeFromUrl(url)

  await db.insert(bookmark).values({
    id: bookmarkId,
    userId,
    folderId: folderId ?? null,
    type,
    title: userTitle || url,
    url,
    sourceType: "url",
    clientSource,
    platform: inferPlatform(url),
    ingestStatus: "pending" as IngestStatus,
  })

  runInBackground(processIngestUrl(bookmarkId, url, userId, userTitle))

  return { bookmarkId, title: userTitle || url, markdown: null, type, status: "pending" }
}

async function processIngestUrl(
  bookmarkId: string,
  url: string,
  userId: string,
  userTitle?: string
) {
  await updateBookmarkStatus(bookmarkId, "processing")
  try {
    const platform = inferPlatform(url)
    let result: ConversionResult | null = null

    // 可直接从 API 解析的平台（B 站等）
    if (platform && !needsBrowser(platform)) {
      const credentials = platform === "bilibili" ? await getBilibiliCredentials(userId) : null
      result = await convertWithoutHtml(url, platform, credentials)
    }

    if (!result?.markdown) {
      result = await convertUrl(url)
    }

    if (!result?.markdown) {
      // 服务端轻量抓取失败 → 转入浏览器抓取队列，由扩展在用户浏览器里补抓
      await markPendingBrowser(bookmarkId, "Conversion returned empty result")
      return
    }

    await completeBookmarkIngest({
      bookmarkId,
      userId,
      result,
      fallbackTitle: userTitle || url,
    })
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error"
    // 抓取异常（JS 渲染站点、反爬、网络失败）同样降级到浏览器抓取队列
    await markPendingBrowser(bookmarkId, errMsg)
  }
}

/** 标记为等待浏览器扩展抓取（ingestError 记录服务端失败原因，便于排查） */
async function markPendingBrowser(bookmarkId: string, reason: string) {
  await updateBookmarkStatus(bookmarkId, "pending_browser", reason)
}

/**
 * 浏览器扩展抓取结果回填：
 * 扩展在用户浏览器里打开页面解析后，通过 browser-result 端点提交
 */
export async function completeBrowserIngest(params: {
  bookmarkId: string
  userId: string
  markdown?: string
  html?: string
  title?: string
}): Promise<boolean> {
  const { bookmarkId, userId, markdown, html, title } = params

  const [row] = await db
    .select({ url: bookmark.url, title: bookmark.title, platform: bookmark.platform })
    .from(bookmark)
    .where(eq(bookmark.id, bookmarkId))
    .limit(1)
  if (!row) {
    return false
  }

  let result: ConversionResult | null = null
  if (markdown) {
    result = { title: title ?? null, markdown }
  } else if (html) {
    // 扩展端侧解析失败时回退原始 HTML，服务端做平台定制转换
    result = await convertWithPlatform(html, row.url ?? "", row.platform)
  }

  if (!result?.markdown) {
    await failBookmarkIngest(bookmarkId, "Browser capture returned empty result")
    return true
  }

  await completeBookmarkIngest({
    bookmarkId,
    userId,
    result,
    fallbackTitle: title || row.title || row.url || "Untitled",
  })
  return true
}

/** 浏览器扩展抓取失败回报 */
export async function failBrowserIngest(bookmarkId: string, error: string) {
  await failBookmarkIngest(bookmarkId, error)
}

export async function ingestFromFile(params: IngestFileParams): Promise<IngestResult> {
  const { userId, file, folderId, title: userTitle, clientSource, extractedMarkdown } = params
  const bookmarkId = nanoid()
  const fileName = file.name
  const extMatch = fileName.match(FILE_EXT_REGEX)
  const fileExtension = extMatch ? extMatch[0].toLowerCase() : ""
  const type = inferTypeFromExtension(fileExtension)

  await db.insert(bookmark).values({
    id: bookmarkId,
    userId,
    folderId: folderId ?? null,
    type,
    title: userTitle || fileName,
    sourceType: "file",
    clientSource,
    fileExtension,
    fileSize: file.size,
    ingestStatus: "pending" as IngestStatus,
  })

  const fileBuffer = await file.arrayBuffer()
  const blobResult = await put(`ingest/${bookmarkId}/${fileName}`, fileBuffer, {
    access: "public",
  })

  await db
    .update(bookmark)
    .set({ fileUrl: blobResult.url, url: blobResult.url })
    .where(eq(bookmark.id, bookmarkId))

  runInBackground(
    processIngestFile({
      bookmarkId,
      fileBuffer,
      fileExtension,
      userId,
      userTitle,
      fileName,
      extractedMarkdown,
    })
  )

  return { bookmarkId, title: userTitle || fileName, markdown: null, type, status: "pending" }
}

async function processIngestFile(params: {
  bookmarkId: string
  fileBuffer: ArrayBuffer
  fileExtension: string
  userId: string
  userTitle?: string
  fileName?: string
  extractedMarkdown?: string
}) {
  const { bookmarkId, fileBuffer, fileExtension, userId, userTitle, fileName, extractedMarkdown } =
    params
  await updateBookmarkStatus(bookmarkId, "processing")
  try {
    let result: ConversionResult | null = null

    if (extractedMarkdown) {
      // 客户端已解析（PDF/Word 等），直接使用
      result = { title: userTitle ?? null, markdown: extractedMarkdown }
    } else if (TEXT_FILE_EXTENSIONS.has(fileExtension)) {
      // 纯文本类文件服务端直接解码
      const text = new TextDecoder("utf-8").decode(fileBuffer).trim()
      result = text ? { title: userTitle ?? null, markdown: text } : null
    } else if (HTML_FILE_EXTENSIONS.has(fileExtension)) {
      const html = new TextDecoder("utf-8").decode(fileBuffer)
      result = convertHtml(html, fileName ?? "")
    } else {
      // 其余格式（PDF/Word 等）需客户端解析后附带 markdown 上传
      await failBookmarkIngest(bookmarkId, `此文件类型需要客户端解析：${fileExtension}`)
      return
    }

    if (!result?.markdown) {
      await failBookmarkIngest(bookmarkId, "Conversion returned empty result")
      return
    }

    await completeBookmarkIngest({
      bookmarkId,
      userId,
      result,
      fallbackTitle: userTitle || fileName || "Untitled",
    })
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error"
    await failBookmarkIngest(bookmarkId, errMsg)
  }
}

export async function ingestFromExtension(params: IngestExtensionParams): Promise<IngestResult> {
  const { userId, url, markdown, html, folderId, title: userTitle, clientSource } = params
  const bookmarkId = nanoid()
  const platform = inferPlatform(url)

  await db.insert(bookmark).values({
    id: bookmarkId,
    userId,
    folderId: folderId ?? null,
    type: "article",
    title: userTitle || url,
    url,
    sourceType: "extension",
    clientSource,
    platform,
    ingestStatus: "pending" as IngestStatus,
  })

  runInBackground(
    processIngestExtension(bookmarkId, markdown, html, url, platform, userId, userTitle)
  )

  return { bookmarkId, title: userTitle || url, markdown: null, type: "article", status: "pending" }
}

async function processIngestExtension(
  bookmarkId: string,
  markdown: string | undefined,
  html: string | undefined,
  url: string,
  platform: string | null,
  userId: string,
  userTitle?: string
) {
  await updateBookmarkStatus(bookmarkId, "processing")
  try {
    let result: ConversionResult | null = null

    // 新协议：扩展端已在浏览器里解析为 Markdown，直接入库
    if (markdown) {
      result = { title: userTitle ?? null, markdown }
    }

    // B 站等可直接从 API 解析的平台
    if (!result && platform && !needsBrowser(platform)) {
      const credentials = platform === "bilibili" ? await getBilibiliCredentials(userId) : null
      result = await convertWithoutHtml(url, platform, credentials)
    }

    // 旧协议：扩展上传原始 HTML，服务端做平台定制转换
    if (!result) {
      if (!html) {
        await failBookmarkIngest(
          bookmarkId,
          `HTML is required for platform: ${platform ?? "unknown"}`
        )
        return
      }
      result = await convertWithPlatform(html, url, platform)
    }

    if (!result?.markdown) {
      await failBookmarkIngest(bookmarkId, "Conversion returned empty result")
      return
    }

    await completeBookmarkIngest({
      bookmarkId,
      userId,
      result,
      fallbackTitle: userTitle || url,
    })
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error"
    await failBookmarkIngest(bookmarkId, errMsg)
  }
}
