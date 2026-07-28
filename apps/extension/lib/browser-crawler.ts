/**
 * 浏览器抓取队列
 * 服务端轻量抓取失败的链接（微信等 JS 渲染站点）进入 pending_browser 队列，
 * 由扩展在用户浏览器里打开后台标签页抓取——带登录态，质量优于任何服务端方案
 */

import { type BrowserTask, claimBrowserTasks, getToken, reportBrowserResult } from "./auth-client"

// 页面 load 完成后再等一段时间让 JS 渲染
const RENDER_WAIT_MS = 4000
// 页面加载超时（超时后仍尝试解析已有内容）
const LOAD_TIMEOUT_MS = 30_000
// 每轮最多抓取数（小批量、串行，减少对用户的干扰）
const MAX_TASKS_PER_RUN = 3

// 防止 alarm 与手动触发并发
let crawling = false

/** 执行一轮抓取：认领任务 → 逐个后台标签页抓取 → 回传 */
export async function runBrowserCrawl() {
  if (crawling) {
    return
  }
  // 未登录不抓取
  const token = await getToken()
  if (!token) {
    return
  }

  crawling = true
  try {
    const tasks = await claimBrowserTasks(MAX_TASKS_PER_RUN)
    if (tasks.length > 0) {
      console.log(`[MindPocket] Browser crawl: ${tasks.length} task(s)`)
    }
    for (const task of tasks) {
      await crawlTask(task)
    }
  } catch (error) {
    console.error("[MindPocket] Browser crawl failed:", error)
  } finally {
    crawling = false
  }
}

/** 抓取单个任务：开后台标签页 → 等渲染 → 内容脚本解析 → 回传 → 关标签页 */
async function crawlTask(task: BrowserTask) {
  if (!task.url) {
    await reportBrowserResult(task.id, { error: "Bookmark has no URL" })
    return
  }

  let tabId: number | undefined
  try {
    const tab = await browser.tabs.create({ url: task.url, active: false })
    tabId = tab.id
    if (tabId === undefined) {
      throw new Error("Failed to create tab")
    }

    await waitForTabComplete(tabId, LOAD_TIMEOUT_MS)
    await sleep(RENDER_WAIT_MS)

    // 复用内容脚本的 Readability 解析（GET_PAGE_CONTENT 返回 markdown/html + title）
    const payload = (await browser.tabs.sendMessage(tabId, { type: "GET_PAGE_CONTENT" })) as
      | { markdown?: string; html?: string; title?: string }
      | undefined

    if (payload?.markdown || payload?.html) {
      await reportBrowserResult(task.id, {
        markdown: payload.markdown,
        html: payload.html,
        title: payload.title,
      })
    } else {
      await reportBrowserResult(task.id, { error: "Page content is empty" })
    }
  } catch (error) {
    // 页面无法注入/加载失败等，回报失败（用户可在历史里看到原因）
    await reportBrowserResult(task.id, { error: String(error) }).catch(() => {
      // 回报失败则保留租约，超时后自动重试
    })
  } finally {
    if (tabId !== undefined) {
      await browser.tabs.remove(tabId).catch(() => {
        // 标签页可能已被用户关闭
      })
    }
  }
}

/** 等待标签页加载完成（超时不报错，尽力解析） */
function waitForTabComplete(tabId: number, timeoutMs: number): Promise<void> {
  return new Promise((resolve) => {
    const listener = (updatedTabId: number, changeInfo: { status?: string }) => {
      if (updatedTabId === tabId && changeInfo.status === "complete") {
        cleanup()
        resolve()
      }
    }
    const timer = setTimeout(() => {
      cleanup()
      resolve()
    }, timeoutMs)
    const cleanup = () => {
      clearTimeout(timer)
      browser.tabs.onUpdated.removeListener(listener)
    }
    browser.tabs.onUpdated.addListener(listener)
  })
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
