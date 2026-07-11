/**
 * 端侧解析模块
 * 在 content script（有真实 DOM）里把页面/片段 HTML 转成 Markdown，
 * 服务端（Cloudflare Workers）不再做重解析
 */

import { Readability } from "@mozilla/readability"
import TurndownService from "turndown"

// turndown 单例
let turndownInstance: TurndownService | null = null

function getTurndown(): TurndownService {
  if (!turndownInstance) {
    turndownInstance = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
      bulletListMarker: "-",
    })
    turndownInstance.remove(["script", "style", "noscript"])
    // 懒加载图片：优先取 data-src（微信等站点）
    turndownInstance.addRule("lazyImage", {
      filter: "img",
      replacement: (_content, node) => {
        const img = node as HTMLImageElement
        const src = img.getAttribute("data-src") || img.getAttribute("src") || ""
        if (!src || src.startsWith("data:")) {
          return ""
        }
        const alt = img.getAttribute("alt") || ""
        return `![${alt}](${src})`
      },
    })
  }
  return turndownInstance
}

/** 将 HTML 片段转为 Markdown（转换失败返回 null） */
export function htmlToMarkdown(html: string): string | null {
  try {
    const markdown = getTurndown().turndown(html).trim()
    return markdown || null
  } catch (error) {
    console.error("[MindPocket] htmlToMarkdown failed:", error)
    return null
  }
}

/**
 * 解析当前页面为 Markdown
 * 用 Readability 提取正文（在克隆文档上操作，避免污染页面），再转 Markdown
 */
export function parseDocumentToMarkdown(): { title: string | null; markdown: string | null } {
  try {
    const documentClone = document.cloneNode(true) as Document
    const article = new Readability(documentClone).parse()
    if (article?.content) {
      const markdown = htmlToMarkdown(article.content)
      if (markdown) {
        return { title: article.title || document.title || null, markdown }
      }
    }
  } catch (error) {
    console.error("[MindPocket] Readability parse failed:", error)
  }

  // Readability 失败时降级：直接转整个 body
  const markdown = htmlToMarkdown(document.body?.outerHTML ?? "")
  return { title: document.title || null, markdown }
}
