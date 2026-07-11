interface SavePayload {
  url: string
  // 端侧解析好的 Markdown（新协议，优先）
  markdown?: string
  // 原始 HTML（解析失败时的降级方案）
  html?: string
  title?: string
}

function isSavePayload(value: unknown): value is SavePayload {
  if (typeof value !== "object" || value === null) {
    return false
  }

  const candidate = value as Record<string, unknown>
  const hasContent = typeof candidate.markdown === "string" || typeof candidate.html === "string"
  return (
    typeof candidate.url === "string" &&
    hasContent &&
    (typeof candidate.title === "string" || typeof candidate.title === "undefined")
  )
}

// 浏览器抓取队列的定时器：浏览器启动 1 分钟后首跑，之后每 10 分钟一轮
const CRAWL_ALARM = "mindpocket-browser-crawl"
const CRAWL_PERIOD_MINUTES = 10

function scheduleCrawlAlarm() {
  browser.alarms.create(CRAWL_ALARM, {
    delayInMinutes: 1,
    periodInMinutes: CRAWL_PERIOD_MINUTES,
  })
}

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "SAVE_PAGE") {
      handleSavePage(message.payload).then(sendResponse)
      return true
    }
  })

  // 安装/浏览器启动时注册定时抓取
  browser.runtime.onInstalled.addListener(scheduleCrawlAlarm)
  browser.runtime.onStartup.addListener(scheduleCrawlAlarm)

  browser.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === CRAWL_ALARM) {
      const { runBrowserCrawl } = await import("../lib/browser-crawler")
      await runBrowserCrawl()
    }
  })
})

async function notify(title: string, message: string) {
  await browser.notifications.create({
    type: "basic",
    iconUrl: browser.runtime.getURL("/icon/128.png"),
    title,
    message,
  })
}

async function requestPageContent(): Promise<SavePayload> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true })
  if (!tab?.id) {
    throw new Error("No active tab")
  }

  const response = await browser.tabs.sendMessage(tab.id, { type: "GET_PAGE_CONTENT" })
  if (!isSavePayload(response)) {
    throw new Error("Failed to get page content")
  }

  return response
}

async function handleSavePage(payload?: unknown) {
  try {
    const response = isSavePayload(payload) ? payload : await requestPageContent()

    // TODO: 来源，更多参数
    const { saveBookmark } = await import("../lib/auth-client")
    const result = await saveBookmark({
      url: response.url,
      markdown: response.markdown,
      html: response.html,
      title: response.title,
    })

    if (!result.ok) {
      const error = result.data?.error || "Save failed"
      await notify("保存失败", error)
      return { success: false, error }
    }

    await notify("已收藏", result.data?.title || response.title || "页面已保存")
    return { success: true, data: result.data }
  } catch (err) {
    await notify("保存失败", String(err))
    return { success: false, error: String(err) }
  }
}
