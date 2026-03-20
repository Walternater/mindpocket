import {
  buildFallbackPayload,
  createMindPocketButton,
  removeInjectedHosts,
  type SavePayload,
  toAbsoluteUrl,
} from "../shared"

const CANONICAL_STATUS_PATH_REGEX = /^\/[^/]+\/status\/\d+$/
const WEB_STATUS_PATH_REGEX = /^\/i\/web\/status\/\d+$/

function isCanonicalStatusPath(pathname: string): boolean {
  return CANONICAL_STATUS_PATH_REGEX.test(pathname) || WEB_STATUS_PATH_REGEX.test(pathname)
}

function findTweetRoot(bookmarkBtn: Element): HTMLElement | null {
  const tweet =
    bookmarkBtn.closest('article[data-testid="tweet"]') ??
    bookmarkBtn.closest('article[role="article"]')

  return tweet instanceof HTMLElement ? tweet : null
}

function findCanonicalStatusLink(tweetRoot: HTMLElement): string | null {
  const timeHref = tweetRoot
    .querySelector("time")
    ?.closest('a[href*="/status/"]')
    ?.getAttribute("href")

  const absoluteTimeHref = toAbsoluteUrl(timeHref ?? null)
  if (absoluteTimeHref) {
    return absoluteTimeHref
  }

  const links = tweetRoot.querySelectorAll('a[href*="/status/"]')
  for (const link of links) {
    if (!(link instanceof HTMLAnchorElement)) {
      continue
    }

    const href = toAbsoluteUrl(link.getAttribute("href"))
    if (!href) {
      continue
    }

    const url = new URL(href)
    if (isCanonicalStatusPath(url.pathname)) {
      return url.toString()
    }
  }

  return null
}

function extractTweetPermalink(tweetRoot: HTMLElement): string {
  return findCanonicalStatusLink(tweetRoot) ?? window.location.href
}

function extractTweetTitle(tweetRoot: HTMLElement): string {
  const author =
    tweetRoot.querySelector('[data-testid="User-Name"] a[href^="/"]')?.textContent?.trim() ?? ""
  const text =
    tweetRoot
      .querySelector('[data-testid="tweetText"]')
      ?.textContent?.replace(/\s+/g, " ")
      .trim() ?? ""

  if (author && text) {
    return `${author}: ${text.slice(0, 80)}`
  }

  if (text) {
    return text.slice(0, 80)
  }

  return document.title
}

function extractTweetHtml(tweetRoot: HTMLElement): string {
  const clone = tweetRoot.cloneNode(true)
  if (!(clone instanceof HTMLElement)) {
    return tweetRoot.outerHTML
  }

  removeInjectedHosts(clone)
  return clone.outerHTML
}

function buildTweetPayload(bookmarkBtn: Element): SavePayload {
  const tweetRoot = findTweetRoot(bookmarkBtn)
  if (!tweetRoot) {
    return buildFallbackPayload()
  }

  return {
    url: extractTweetPermalink(tweetRoot),
    title: extractTweetTitle(tweetRoot),
    html: extractTweetHtml(tweetRoot),
  }
}

export function injectButtonsIntoTweets() {
  const bookmarkButtons = document.querySelectorAll('[data-testid="bookmark"]')

  for (const bookmarkBtn of bookmarkButtons) {
    const parent = bookmarkBtn.parentElement
    if (!parent || parent.querySelector(":scope > .mindpocket-host")) {
      continue
    }

    const mpBtn = createMindPocketButton({
      payloadBuilder: () => buildTweetPayload(bookmarkBtn),
      size: 34,
      marginLeft: 4,
      color: "rgb(113, 118, 123)",
      hoverColor: "rgb(29, 161, 242)",
      hoverBackground: "rgba(29, 161, 242, 0.1)",
      savedColor: "rgb(29, 161, 242)",
    })

    parent.insertBefore(mpBtn, bookmarkBtn)
  }
}
