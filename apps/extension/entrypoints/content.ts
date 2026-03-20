import { injectButtonsIntoTweets } from "../lib/content/platforms/x"
import { injectButtonsIntoXiaohongshuNotes } from "../lib/content/platforms/xiaohongshu"
import { injectButtonsIntoZhihuAnswers } from "../lib/content/platforms/zhihu"
import { buildFallbackPayload } from "../lib/content/shared"

function injectButtons() {
  injectButtonsIntoTweets()
  injectButtonsIntoXiaohongshuNotes()
  injectButtonsIntoZhihuAnswers()
}

export default defineContentScript({
  matches: ["<all_urls>"],
  main() {
    browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.type === "GET_PAGE_CONTENT") {
        sendResponse(buildFallbackPayload())
      }
      return true
    })

    const observer = new MutationObserver(() => {
      injectButtons()
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    injectButtons()
  },
})
