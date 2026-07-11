/**
 * 内容转换模块
 * 负责将 URL、HTML 转换为 Markdown 格式
 * Workers 版：用 node-html-markdown（纯 JS，无 DOM 依赖）替代 markitdown
 */

import { NodeHtmlMarkdown } from "node-html-markdown"
import type { BookmarkType } from "./types"
import { EXTENSION_TYPE_MAP, URL_TYPE_PATTERNS } from "./types"

// 转换器单例
let nhmInstance: NodeHtmlMarkdown | null = null

// 段落分隔正则
const PARAGRAPH_SPLIT_REGEX = /\n\n/

// HTML 标题提取正则
const TITLE_TAG_REGEX = /<title[^>]*>([^<]*)<\/title>/i
const OG_TITLE_REGEX = /<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i

// 移除 script/style 等不需要转换的块
const STRIP_BLOCKS_REGEX = /<(script|style|noscript|iframe|svg)[^>]*>[\s\S]*?<\/\1>/gi

// 需要浏览器渲染的网站（微信文章等），Workers 无法抓取，请用扩展保存
const BROWSER_ONLY_PATTERNS = [/^https?:\/\/mp\.weixin\.qq\.com\//]

export const BROWSER_ONLY_ERROR = "此网站需要浏览器渲染，请使用浏览器扩展保存"

/** 获取转换器实例（单例模式） */
function getConverter(): NodeHtmlMarkdown {
  if (!nhmInstance) {
    nhmInstance = new NodeHtmlMarkdown({
      bulletMarker: "-",
      codeFence: "```",
    })
  }
  return nhmInstance
}

/** 从 HTML 提取标题（og:title 优先，其次 <title>） */
function extractHtmlTitle(html: string): string | null {
  const og = html.match(OG_TITLE_REGEX)
  if (og?.[1]) {
    return og[1].trim()
  }
  const title = html.match(TITLE_TAG_REGEX)
  return title?.[1]?.trim() || null
}

/** 判断 URL 是否只能由浏览器扩展保存 */
export function isBrowserOnlyUrl(url: string): boolean {
  return BROWSER_ONLY_PATTERNS.some((p) => p.test(url))
}

/**
 * 将 HTML 内容转换为 Markdown
 */
export function convertHtml(html: string, _sourceUrl: string) {
  const cleaned = html.replace(STRIP_BLOCKS_REGEX, "")
  const markdown = getConverter().translate(cleaned).trim()
  if (!markdown) {
    return null
  }
  return { title: extractHtmlTitle(html), markdown }
}

/**
 * 将 URL 转换为 Markdown
 * Workers 端只做静态抓取；需要 JS 渲染的站点抛错引导用扩展保存
 */
export async function convertUrl(url: string) {
  if (isBrowserOnlyUrl(url)) {
    throw new Error(BROWSER_ONLY_ERROR)
  }

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  })
  if (!res.ok) {
    throw new Error(`Fetch failed with status ${res.status}`)
  }

  const html = await res.text()
  return convertHtml(html, url)
}

/** 根据文件扩展名推断书签类型 */
export function inferTypeFromExtension(ext: string): BookmarkType {
  return EXTENSION_TYPE_MAP[ext.toLowerCase()] ?? "other"
}

/** 根据 URL 推断书签类型 */
export function inferTypeFromUrl(url: string): BookmarkType {
  for (const { pattern, type } of URL_TYPE_PATTERNS) {
    if (pattern.test(url)) {
      return type
    }
  }
  return "link"
}

/**
 * 从 Markdown 中提取描述文本
 * 移除标题、图片、链接格式等，保留纯文本段落
 */
export function extractDescription(markdown: string): string {
  const text = markdown
    .replace(/^#+\s+.+$/gm, "") // 移除标题
    .replace(/!\[.*?\]\(.*?\)/g, "") // 移除图片
    .replace(/\[([^\]]+)\]\(.*?\)/g, "$1") // 将链接转为文字
    .replace(/[*_~`#>|-]/g, "") // 移除格式字符
    .trim()
  const firstParagraph = text.split(PARAGRAPH_SPLIT_REGEX)[0] ?? ""
  return firstParagraph.slice(0, 200).trim()
}
