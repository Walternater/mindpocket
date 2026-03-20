import {
  buildFallbackPayload,
  createMindPocketButton,
  removeInjectedHosts,
  type SavePayload,
} from "../shared"

const XIAOHONGSHU_HOSTNAME_REGEX = /(^|\.)xiaohongshu\.com$/i

function isXiaohongshuHostname() {
  return XIAOHONGSHU_HOSTNAME_REGEX.test(window.location.hostname)
}

function findNoteRoot(source?: Element | null): HTMLElement | null {
  const note =
    source?.closest("#noteContainer") ??
    document.querySelector("#noteContainer") ??
    document.querySelector(".note-container")

  return note instanceof HTMLElement ? note : null
}

function findActionBar(noteRoot: HTMLElement): HTMLElement | null {
  const actionBar =
    noteRoot.querySelector(".engage-bar .buttons.engage-bar-style .share-wrapper") ??
    noteRoot.querySelector(".engage-bar-container .buttons.engage-bar-style .share-wrapper") ??
    noteRoot.querySelector(".engage-bar .interact-container .share-wrapper")

  return actionBar instanceof HTMLElement ? actionBar : null
}

function findCanonicalUrl(): string {
  const canonicalHref =
    document.querySelector('link[rel="canonical"]')?.getAttribute("href")?.trim() ?? ""

  if (canonicalHref) {
    try {
      return new URL(canonicalHref, window.location.origin).toString()
    } catch {
      // Ignore malformed canonical URLs and fall back to the current location.
    }
  }

  return window.location.href
}

function collapseText(value: string | null | undefined): string {
  return value?.replace(/\s+/g, " ").trim() ?? ""
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

function getNoteTitle(noteRoot: HTMLElement): string {
  const title =
    collapseText(noteRoot.querySelector("#detail-title")?.textContent) ||
    collapseText(noteRoot.querySelector(".note-content .title")?.textContent)

  return title || document.title
}

function getNoteDescription(noteRoot: HTMLElement): string {
  return (
    collapseText(noteRoot.querySelector("#detail-desc")?.textContent) ||
    collapseText(noteRoot.querySelector(".note-content .desc")?.textContent)
  )
}

function cloneAndClean(node: Element | null, selectorsToRemove: string[] = []): string {
  if (!(node instanceof HTMLElement)) {
    return ""
  }

  const clone = node.cloneNode(true)
  if (!(clone instanceof HTMLElement)) {
    return node.outerHTML
  }

  removeInjectedHosts(clone)

  for (const selector of selectorsToRemove) {
    for (const element of clone.querySelectorAll(selector)) {
      element.remove()
    }
  }

  return clone.outerHTML
}

function getMediaHtml(noteRoot: HTMLElement): string {
  return cloneAndClean(noteRoot.querySelector(".media-container"), [
    ".arrow-controller",
    ".slider-pagination-container",
    ".pagination-teleport-container",
    ".fraction",
    "#copy-img-guide",
  ])
}

function getAuthorHtml(noteRoot: HTMLElement): string {
  return (
    cloneAndClean(noteRoot.querySelector(".interaction-container .author-container"), [
      ".note-detail-follow-btn",
    ]) ||
    cloneAndClean(noteRoot.querySelector(":scope > .author"), [".note-detail-follow-btn"])
  )
}

function getContentHtml(noteRoot: HTMLElement): string {
  return cloneAndClean(noteRoot.querySelector(".interaction-container .note-content"), [
    ".notedetail-menu",
  ])
}

function getOgImages(noteRoot: HTMLElement): string[] {
  const imageUrls = new Set<string>()

  for (const img of noteRoot.querySelectorAll(".media-container img[src]")) {
    const src = img.getAttribute("src")?.trim()
    if (src) {
      imageUrls.add(src)
    }
  }

  return [...imageUrls]
}

function buildMetaBlock(noteRoot: HTMLElement) {
  const title = escapeHtml(getNoteTitle(noteRoot))
  const description = escapeHtml(getNoteDescription(noteRoot))
  const url = escapeHtml(findCanonicalUrl())
  const images = getOgImages(noteRoot)

  const parts = [
    `<meta property="og:title" content="${title}">`,
    `<meta name="description" content="${description}">`,
    `<meta property="og:url" content="${url}">`,
  ]

  for (const image of images) {
    parts.push(`<meta property="og:image" content="${escapeHtml(image)}">`)
  }

  return parts.join("")
}

function extractNoteHtml(noteRoot: HTMLElement): string {
  const authorHtml = getAuthorHtml(noteRoot)
  const mediaHtml = getMediaHtml(noteRoot)
  const contentHtml = getContentHtml(noteRoot)

  if (!(authorHtml || mediaHtml || contentHtml)) {
    return noteRoot.outerHTML
  }

  return `
    ${buildMetaBlock(noteRoot)}
    <article data-mindpocket-source="xiaohongshu-note">
      ${authorHtml}
      ${mediaHtml}
      ${contentHtml}
    </article>
  `.trim()
}

function buildXiaohongshuPayload(source: Element): SavePayload {
  const noteRoot = findNoteRoot(source)
  if (!noteRoot) {
    return buildFallbackPayload()
  }

  return {
    url: findCanonicalUrl(),
    title: getNoteTitle(noteRoot),
    html: extractNoteHtml(noteRoot),
  }
}

function findActionBars(): HTMLElement[] {
  const bars = document.querySelectorAll(
    ".buttons.engage-bar-style .share-wrapper, .engage-bar-container .buttons .share-wrapper, .engage-bar .share-wrapper"
  )

  return [...bars].filter((element): element is HTMLElement => element instanceof HTMLElement)
}

export function injectButtonsIntoXiaohongshuNotes() {
  if (!isXiaohongshuHostname()) {
    return
  }

  for (const actionBar of findActionBars()) {
    const note = findNoteRoot(actionBar)
    if (!note) {
      continue
    }

    const resolvedActionBar = findActionBar(note) ?? actionBar
    if (
      resolvedActionBar.dataset.mindpocketInjected === "true" ||
      resolvedActionBar.querySelector(".mindpocket-host")
    ) {
      continue
    }

    const button = createMindPocketButton({
      payloadBuilder: () => buildXiaohongshuPayload(resolvedActionBar),
      size: 32,
      marginLeft: 0,
      color: "rgba(16, 24, 40, 0.72)",
      hoverColor: "#ff2442",
      hoverBackground: "rgba(255, 36, 66, 0.08)",
      savedColor: "#ff2442",
    })

    resolvedActionBar.insertBefore(button, resolvedActionBar.firstChild)

    resolvedActionBar.dataset.mindpocketInjected = "true"
  }
}
