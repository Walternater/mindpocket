import {
  getInjectionPlatformSettings,
  SUPPORTED_INJECTION_PLATFORMS,
  type SupportedInjectionPlatform,
} from "../lib/auth-client"
import { injectButtonsIntoTweets } from "../lib/content/platforms/x"
import { injectButtonsIntoXiaohongshuNotes } from "../lib/content/platforms/xiaohongshu"
import { injectButtonsIntoZhihuAnswers } from "../lib/content/platforms/zhihu"
import {
  buildElementPayload,
  buildFallbackPayload,
  isMindPocketInjectedElement,
} from "../lib/content/shared"

const PLATFORM_INJECTORS: Record<SupportedInjectionPlatform, () => void> = {
  twitter: injectButtonsIntoTweets,
  zhihu: injectButtonsIntoZhihuAnswers,
  xiaohongshu: injectButtonsIntoXiaohongshuNotes,
}
const CLASS_NAME_SPLIT_REGEX = /\s+/
const SKIP_TAG_NAMES = new Set(["script", "style", "noscript"])

async function injectButtons() {
  const settings = await getInjectionPlatformSettings()

  for (const platform of SUPPORTED_INJECTION_PLATFORMS) {
    if (!settings[platform]) {
      continue
    }

    PLATFORM_INJECTORS[platform]()
  }
}

function scheduleButtonInjection() {
  injectButtons().catch((error) => {
    console.error("[MindPocket] injectButtons error:", error)
  })
}

// 页面内 toast 通知
function showPageToast(title: string, message: string, type: "success" | "error") {
  // 移除已有的 toast
  const existing = document.querySelector("mindpocket-toast-host")
  if (existing) {
    existing.remove()
  }

  const host = document.createElement("mindpocket-toast-host")
  const shadow = host.attachShadow({ mode: "open" })

  const isSuccess = type === "success"

  const style = document.createElement("style")
  style.textContent = `
    .toast {
      position: fixed;
      top: 40px;
      left: 50%;
      transform: translateX(-50%) translateY(-20px);
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 20px;
      border-radius: 12px;
      background: ${isSuccess ? "#f0fdf4" : "#fef2f2"};
      border: 1px solid ${isSuccess ? "#bbf7d0" : "#fecaca"};
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 14px;
      color: #1a1a1a;
      z-index: 2147483647;
      opacity: 0;
      animation: mindpocket-toast-in 0.3s ease forwards;
      max-width: 400px;
    }
    .toast.hiding {
      animation: mindpocket-toast-out 0.3s ease forwards;
    }
    .icon {
      flex-shrink: 0;
      width: 20px;
      height: 20px;
    }
    .content {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }
    .title {
      font-weight: 600;
      font-size: 14px;
    }
    .message {
      font-size: 13px;
      color: #666;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    @keyframes mindpocket-toast-in {
      from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
      to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
    @keyframes mindpocket-toast-out {
      from { opacity: 1; transform: translateX(-50%) translateY(0); }
      to { opacity: 0; transform: translateX(-50%) translateY(-20px); }
    }
  `

  const toast = document.createElement("div")
  toast.className = "toast"

  // 图标
  const iconSvg = isSuccess
    ? `<svg class="icon" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="10" fill="#22c55e"/>
        <path d="M6 10.5l2.5 2.5L14 7.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`
    : `<svg class="icon" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="10" fill="#ef4444"/>
        <path d="M7 7l6 6M13 7l-6 6" stroke="white" stroke-width="2" stroke-linecap="round"/>
      </svg>`

  toast.innerHTML = `
    ${iconSvg}
    <div class="content">
      <div class="title">${title}</div>
      ${message ? `<div class="message">${message}</div>` : ""}
    </div>
  `

  shadow.appendChild(style)
  shadow.appendChild(toast)
  document.body.appendChild(host)

  // 2.5 秒后自动消失
  setTimeout(() => {
    toast.classList.add("hiding")
    setTimeout(() => host.remove(), 300)
  }, 2500)
}

interface PickerElements {
  host: HTMLElement
  highlight: HTMLDivElement
  panelMeta: HTMLDivElement
}

function formatElementMeta(element: Element) {
  const tagName = element.tagName.toLowerCase()
  const id = element.id ? `#${element.id}` : ""
  const className =
    typeof element.className === "string"
      ? element.className
          .trim()
          .split(CLASS_NAME_SPLIT_REGEX)
          .filter(Boolean)
          .slice(0, 2)
          .map((item) => `.${item}`)
          .join("")
      : ""

  return `${tagName}${id}${className}`
}

function createPickerElements(): PickerElements {
  const host = document.createElement("mindpocket-picker-host")
  const shadow = host.attachShadow({ mode: "open" })

  const style = document.createElement("style")
  style.textContent = `
    :host {
      all: initial;
    }
    .overlay {
      position: fixed;
      inset: 0;
      z-index: 2147483646;
      pointer-events: none;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .highlight {
      position: fixed;
      top: 0;
      left: 0;
      width: 0;
      height: 0;
      border: 2px solid #2563eb;
      background: rgba(37, 99, 235, 0.14);
      border-radius: 8px;
      box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.9);
      transition: transform 0.05s ease, width 0.05s ease, height 0.05s ease;
    }
    .panel {
      position: fixed;
      top: 16px;
      right: 16px;
      min-width: 240px;
      max-width: min(320px, calc(100vw - 32px));
      padding: 12px 14px;
      border-radius: 14px;
      background: rgba(15, 23, 42, 0.94);
      color: #f8fafc;
      box-shadow: 0 14px 36px rgba(15, 23, 42, 0.28);
      backdrop-filter: blur(14px);
    }
    .panel-title {
      font-size: 13px;
      font-weight: 700;
      line-height: 1.4;
    }
    .panel-text {
      margin-top: 4px;
      font-size: 12px;
      line-height: 1.5;
      color: rgba(226, 232, 240, 0.92);
    }
    .panel-meta {
      margin-top: 8px;
      font-size: 11px;
      line-height: 1.4;
      color: rgba(148, 163, 184, 0.95);
      word-break: break-all;
    }
  `

  const overlay = document.createElement("div")
  overlay.className = "overlay"

  const highlight = document.createElement("div")
  highlight.className = "highlight"

  const panel = document.createElement("div")
  panel.className = "panel"

  const panelTitle = document.createElement("div")
  panelTitle.className = "panel-title"
  panelTitle.textContent = "选择要保存的页面元素"

  const panelText = document.createElement("div")
  panelText.className = "panel-text"
  panelText.textContent = "移动鼠标高亮元素，点击立即保存，按 Esc 退出。"

  const panelMeta = document.createElement("div")
  panelMeta.className = "panel-meta"
  panelMeta.textContent = "等待选择元素..."

  panel.append(panelTitle, panelText, panelMeta)
  overlay.append(highlight, panel)
  shadow.append(style, overlay)
  document.documentElement.appendChild(host)

  return { host, highlight, panelMeta }
}

function createElementPicker() {
  let active = false
  let hoveredElement: Element | null = null
  let pickerElements: PickerElements | null = null

  const updateHighlight = (element: Element | null) => {
    if (!pickerElements) {
      return
    }

    if (!element) {
      pickerElements.highlight.style.width = "0"
      pickerElements.highlight.style.height = "0"
      pickerElements.panelMeta.textContent = "等待选择元素..."
      return
    }

    const rect = element.getBoundingClientRect()
    pickerElements.highlight.style.transform = `translate(${rect.left}px, ${rect.top}px)`
    pickerElements.highlight.style.width = `${Math.max(rect.width, 0)}px`
    pickerElements.highlight.style.height = `${Math.max(rect.height, 0)}px`
    pickerElements.panelMeta.textContent = `当前元素: ${formatElementMeta(element)}`
  }

  const resolveTarget = (eventTarget: EventTarget | null) => {
    let element: Element | null = null

    if (eventTarget instanceof Element) {
      element = eventTarget
    } else if (eventTarget instanceof Node) {
      element = eventTarget.parentElement
    }

    if (!element) {
      return null
    }

    if (isMindPocketInjectedElement(element)) {
      return null
    }

    if (element === document.documentElement || element === document.body) {
      return null
    }

    const tagName = element.tagName.toLowerCase()
    if (SKIP_TAG_NAMES.has(tagName)) {
      return null
    }

    return element
  }

  const handlePointerMove = (event: MouseEvent) => {
    if (!active) {
      return
    }

    const nextElement = resolveTarget(event.target)
    if (hoveredElement === nextElement) {
      return
    }

    hoveredElement = nextElement
    updateHighlight(hoveredElement)
  }

  const exit = () => {
    if (!active) {
      return
    }

    active = false
    hoveredElement = null
    window.removeEventListener("mousemove", handlePointerMove, true)
    window.removeEventListener("click", handleClick, true)
    window.removeEventListener("keydown", handleKeyDown, true)
    pickerElements?.host.remove()
    pickerElements = null
  }

  const handleClick = async (event: MouseEvent) => {
    if (!active) {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    const element = resolveTarget(event.target)
    if (!element) {
      showPageToast("请选择元素", "当前区域不可保存，请选择更具体的内容。", "error")
      return
    }

    const payload = buildElementPayload(element)
    exit()

    try {
      const response = await browser.runtime.sendMessage({ type: "SAVE_PAGE", payload })
      if (!response?.success) {
        showPageToast("保存失败", response?.error || "未能保存当前元素。", "error")
      }
    } catch (error) {
      showPageToast("保存失败", String(error), "error")
    }
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!active || event.key !== "Escape") {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    exit()
    showPageToast("已退出选择", "元素选择模式已关闭。", "success")
  }

  const enter = () => {
    if (active) {
      return
    }

    active = true
    hoveredElement = null
    pickerElements = createPickerElements()
    updateHighlight(null)

    window.addEventListener("mousemove", handlePointerMove, true)
    window.addEventListener("click", handleClick, true)
    window.addEventListener("keydown", handleKeyDown, true)
  }

  return { enter, exit, isActive: () => active }
}

export default defineContentScript({
  matches: ["<all_urls>"],
  main() {
    const elementPicker = createElementPicker()

    browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.type === "GET_PAGE_CONTENT") {
        sendResponse(buildFallbackPayload())
      }
      if (message.type === "SHOW_TOAST") {
        showPageToast(message.title, message.message, message.toastType)
      }
      if (message.type === "ENTER_ELEMENT_PICK_MODE") {
        elementPicker.enter()
        sendResponse({ success: true })
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
