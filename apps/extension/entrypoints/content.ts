import {
  getInjectionPlatformSettings,
  SUPPORTED_INJECTION_PLATFORMS,
  type SupportedInjectionPlatform,
} from "../lib/auth-client"
import { injectButtonsIntoTweets } from "../lib/content/platforms/x"
import { injectButtonsIntoXiaohongshuNotes } from "../lib/content/platforms/xiaohongshu"
import { injectButtonsIntoZhihuAnswers } from "../lib/content/platforms/zhihu"
import { buildFallbackPayload } from "../lib/content/shared"

const PLATFORM_INJECTORS: Record<SupportedInjectionPlatform, () => void> = {
  twitter: injectButtonsIntoTweets,
  zhihu: injectButtonsIntoZhihuAnswers,
  xiaohongshu: injectButtonsIntoXiaohongshuNotes,
}

async function injectButtons() {
  const settings = await getInjectionPlatformSettings()
  console.log("[MindPocket] Platform settings:", settings)

  for (const platform of SUPPORTED_INJECTION_PLATFORMS) {
    if (!settings[platform]) {
      console.log(`[MindPocket] Skipping ${platform} (disabled)`)
      continue
    }

    console.log(`[MindPocket] Injecting buttons for ${platform}`)
    PLATFORM_INJECTORS[platform]()
  }
}

function scheduleButtonInjection() {
  injectButtons().catch((error) => {
    console.error("[MindPocket] injectButtons error:", error)
  })
}

export default defineContentScript({
  matches: ["<all_urls>"],
  main() {
    console.log("[MindPocket] Content script loaded on", window.location.href)

    browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.type === "GET_PAGE_CONTENT") {
        sendResponse(buildFallbackPayload())
      }
      return true
    })

    const observer = new MutationObserver(() => {
      scheduleButtonInjection()
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    scheduleButtonInjection()
  },
})
