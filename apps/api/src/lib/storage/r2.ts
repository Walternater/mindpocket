import { getEnv } from "../../context"

// 去除末尾斜杠
const TRAILING_SLASH = /\/$/

/** 根据文件扩展名推断 Content-Type */
function getContentType(pathname: string): string {
  const ext = pathname.split(".").pop()?.toLowerCase() ?? ""
  const mimeMap: Record<string, string> = {
    // 图片
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    ico: "image/x-icon",
    // 文档
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    // 文本
    txt: "text/plain",
    md: "text/markdown",
    csv: "text/csv",
    html: "text/html",
    css: "text/css",
    js: "text/javascript",
    json: "application/json",
    xml: "application/xml",
    // 压缩
    zip: "application/zip",
    tar: "application/x-tar",
    gz: "application/gzip",
  }
  return mimeMap[ext] || "application/octet-stream"
}

interface PutResult {
  url: string
  pathname: string
}

/**
 * 上传文件到 R2，返回公开访问 URL
 * （接口与原 MinIO 版 put() 保持一致；bucket 公开访问在控制台配置一次即可）
 */
export async function put(
  pathname: string,
  body: ArrayBuffer | string,
  _options?: { access?: "public" | "private" }
): Promise<PutResult> {
  const env = getEnv()

  await env.BUCKET.put(pathname, body, {
    httpMetadata: { contentType: getContentType(pathname) },
  })

  const publicBase = env.R2_PUBLIC_URL.replace(TRAILING_SLASH, "")
  const url = `${publicBase}/${pathname}`

  return { url, pathname }
}
