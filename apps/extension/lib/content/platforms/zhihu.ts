import {
  buildFallbackPayload,
  createMindPocketButton,
  removeInjectedHosts,
  type SavePayload,
  toAbsoluteUrl,
} from "../shared"

const ZHIHU_HOSTNAME_REGEX = /(^|\.)zhihu\.com$/i

function isZhihuHostname() {
  return ZHIHU_HOSTNAME_REGEX.test(window.location.hostname)
}

function findZhihuAnswerRoot(source: Element): HTMLElement | null {
  const answer =
    source.closest(".ContentItem.AnswerItem") ??
    source.closest('.AnswerItem[itemprop="answer"]') ??
    source.closest('[itemprop="answer"]')

  return answer instanceof HTMLElement ? answer : null
}

function findZhihuActionBar(answerRoot: HTMLElement): HTMLElement | null {
  const actionBar = answerRoot.querySelector(".ContentItem-actions")
  return actionBar instanceof HTMLElement ? actionBar : null
}

function findZhihuQuestionTitle(answerRoot: HTMLElement): string {
  const metaName =
    answerRoot
      .querySelector('[itemprop="zhihu:question"] meta[itemprop="name"]')
      ?.getAttribute("content")
      ?.trim() ?? ""
  if (metaName) {
    return metaName
  }

  return (
    answerRoot.querySelector(".ContentItem-title")?.textContent?.replace(/\s+/g, " ").trim() ??
    document.title
  )
}

function findZhihuQuestionUrl(answerRoot: HTMLElement): string | null {
  const metaUrl =
    answerRoot
      .querySelector('[itemprop="zhihu:question"] meta[itemprop="url"]')
      ?.getAttribute("content") ?? null
  const absoluteMetaUrl = toAbsoluteUrl(metaUrl)
  if (absoluteMetaUrl) {
    return absoluteMetaUrl
  }

  const titleLink = answerRoot.querySelector('.ContentItem-title a[href*="/question/"]')
  if (!(titleLink instanceof HTMLAnchorElement)) {
    return null
  }

  return toAbsoluteUrl(titleLink.getAttribute("href"))
}

function findZhihuAnswerPermalink(answerRoot: HTMLElement): string | null {
  const metaUrl =
    answerRoot
      .querySelector('meta[itemprop="url"][content*="/answer/"]')
      ?.getAttribute("content") ?? null
  const absoluteMetaUrl = toAbsoluteUrl(metaUrl)
  if (absoluteMetaUrl) {
    return absoluteMetaUrl
  }

  const answerLink = answerRoot.querySelector('.ContentItem-title a[href*="/answer/"]')
  if (!(answerLink instanceof HTMLAnchorElement)) {
    return null
  }

  return toAbsoluteUrl(answerLink.getAttribute("href"))
}

function findZhihuAuthorName(answerRoot: HTMLElement): string {
  const dataset = answerRoot.getAttribute("data-zop")
  if (dataset) {
    try {
      const parsed = JSON.parse(dataset) as { authorName?: string }
      if (typeof parsed.authorName === "string" && parsed.authorName.trim()) {
        return parsed.authorName.trim()
      }
    } catch {
      // Ignore malformed analytics payloads and continue with DOM-based fallbacks.
    }
  }

  const authorLink =
    answerRoot.querySelector('[itemprop="author"] [itemprop="name"]')?.textContent?.trim() ??
    answerRoot.querySelector(".AuthorInfo-name")?.textContent?.trim() ??
    answerRoot.querySelector(".UserLink-link")?.textContent?.trim() ??
    ""

  return authorLink
}

function buildZhihuQuestionContextHtml(answerRoot: HTMLElement): string {
  const questionTitle = findZhihuQuestionTitle(answerRoot)
  const questionUrl = findZhihuQuestionUrl(answerRoot)
  const safeTitle = questionTitle || document.title
  const escapedTitle = safeTitle
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")

  const titleContent = questionUrl
    ? `<a href="${questionUrl}" target="_blank" rel="noreferrer">${escapedTitle}</a>`
    : escapedTitle

  return `
    <section data-mindpocket-context="zhihu-question" style="margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid rgba(0,0,0,0.08);">
      <div style="font-size:12px;color:#8590a6;margin-bottom:6px;">知乎问题</div>
      <h1 style="margin:0;font-size:20px;line-height:1.4;font-weight:700;">${titleContent}</h1>
    </section>
  `
}

function extractZhihuAnswerHtml(answerRoot: HTMLElement): string {
  const clone = answerRoot.cloneNode(true)
  if (!(clone instanceof HTMLElement)) {
    return answerRoot.outerHTML
  }

  removeInjectedHosts(clone)

  const actionBar = clone.querySelector(".ContentItem-actions")
  if (actionBar instanceof HTMLElement) {
    actionBar.remove()
  }

  const extraLoading = clone.querySelector(".ModalLoading-content")
  if (extraLoading instanceof HTMLElement) {
    extraLoading.remove()
  }

  return `
    <article data-mindpocket-source="zhihu-answer">
      ${buildZhihuQuestionContextHtml(answerRoot)}
      ${clone.outerHTML}
    </article>
  `
}

function buildZhihuPayload(answerRoot: HTMLElement): SavePayload {
  const questionTitle = findZhihuQuestionTitle(answerRoot)
  const authorName = findZhihuAuthorName(answerRoot)

  return {
    url: findZhihuAnswerPermalink(answerRoot) ?? window.location.href,
    title: [questionTitle, authorName].filter(Boolean).join(" - ") || document.title,
    html: extractZhihuAnswerHtml(answerRoot),
  }
}

export function injectButtonsIntoZhihuAnswers() {
  if (!isZhihuHostname()) {
    return
  }

  const answers = document.querySelectorAll(
    ".ContentItem.AnswerItem, .AnswerItem[itemprop='answer']"
  )
  for (const answer of answers) {
    if (!(answer instanceof HTMLElement)) {
      continue
    }

    const actionBar = findZhihuActionBar(answer)
    if (!actionBar || actionBar.querySelector(":scope > .mindpocket-host")) {
      continue
    }

    const insertBefore =
      actionBar.querySelector(".Popover.ShareMenu") ??
      actionBar.querySelector('.Button[aria-label="收藏"]') ??
      null

    const mpBtn = createMindPocketButton({
      payloadBuilder: () => {
        const root = findZhihuAnswerRoot(actionBar)
        return root ? buildZhihuPayload(root) : buildFallbackPayload()
      },
      size: 30,
      marginLeft: 8,
      color: "#8590a6",
      hoverColor: "#056de8",
      hoverBackground: "rgba(5, 109, 232, 0.08)",
      savedColor: "#056de8",
    })

    if (insertBefore) {
      actionBar.insertBefore(mpBtn, insertBefore)
    } else {
      actionBar.appendChild(mpBtn)
    }
  }
}
