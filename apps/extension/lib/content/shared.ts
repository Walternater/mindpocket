export interface SavePayload {
  url: string
  html: string
  title?: string
}

interface MindPocketButtonOptions {
  payloadBuilder: () => SavePayload
  size: number
  marginLeft: number
  color: string
  hoverColor: string
  hoverBackground: string
  savedColor: string
}

export function toAbsoluteUrl(href: string | null): string | null {
  if (!href) {
    return null
  }

  try {
    return new URL(href, window.location.origin).toString()
  } catch {
    return null
  }
}

export function buildFallbackPayload(): SavePayload {
  return {
    url: window.location.href,
    title: document.title,
    html: document.documentElement.outerHTML,
  }
}

export function removeInjectedHosts(root: ParentNode) {
  for (const node of root.querySelectorAll(".mindpocket-host")) {
    node.remove()
  }
}

function createButtonIcon() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path fill="currentColor" d="M14 2a3 3 0 0 1 .054 6l-.218.653A4.507 4.507 0 0 1 15.89 11.5h1.319a2.5 2.5 0 1 1 0 2h-1.32a4.487 4.487 0 0 1-1.006 1.968l.704.704a2.5 2.5 0 1 1-1.414 1.414l-.934-.934A4.485 4.485 0 0 1 11.5 17a4.481 4.481 0 0 1-1.982-.46l-.871 1.046a3 3 0 1 1-1.478-1.35l.794-.954A4.48 4.48 0 0 1 7 12.5c0-.735.176-1.428.488-2.041l-.868-.724A2.5 2.5 0 1 1 7.9 8.2l.87.724a4.48 4.48 0 0 1 3.169-.902l.218-.654A3 3 0 0 1 14 2M6 18a1 1 0 1 0 0 2 1 1 0 0 0 0-2m10.5 0a.5.5 0 1 0 0 1 .5.5 0 0 0 0-1m-5-8a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5m8 2a.5.5 0 1 0 0 1 .5.5 0 0 0 0-1m-14-5a.5.5 0 1 0 0 1 .5.5 0 0 0 0-1M14 4a1 1 0 1 0 0 2 1 1 0 0 0 0-2"/>
    </svg>
  `
}

export function createMindPocketButton(options: MindPocketButtonOptions) {
  const host = document.createElement("div")
  host.className = "mindpocket-host"
  host.style.display = "inline-flex"
  host.style.alignItems = "center"
  host.style.verticalAlign = "middle"

  const shadow = host.attachShadow({ mode: "open" })

  const btn = document.createElement("button")
  btn.className = "mindpocket-btn"
  btn.setAttribute("aria-label", "收藏到 MindPocket")
  btn.title = "收藏到 MindPocket"
  btn.innerHTML = createButtonIcon()

  const style = document.createElement("style")
  style.textContent = `
    .mindpocket-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: ${options.size}px;
      height: ${options.size}px;
      padding: 0;
      margin-left: ${options.marginLeft}px;
      background: transparent;
      border: none;
      border-radius: 9999px;
      cursor: pointer;
      color: ${options.color};
      transition: color 0.2s ease, background-color 0.2s ease, opacity 0.2s ease;
    }
    .mindpocket-btn:hover {
      color: ${options.hoverColor};
      background-color: ${options.hoverBackground};
    }
    .mindpocket-btn.saved {
      color: ${options.savedColor};
    }
    .mindpocket-btn.saving {
      opacity: 0.5;
      cursor: wait;
    }
    .mindpocket-btn:focus-visible {
      outline: 2px solid ${options.hoverColor};
      outline-offset: 2px;
    }
    svg {
      display: block;
    }
  `

  shadow.appendChild(style)
  shadow.appendChild(btn)

  btn.addEventListener("click", async (event) => {
    event.preventDefault()
    event.stopPropagation()

    if (btn.classList.contains("saving")) {
      return
    }

    btn.classList.add("saving")

    try {
      const payload = options.payloadBuilder()
      const res = await browser.runtime.sendMessage({ type: "SAVE_PAGE", payload })
      if (res?.success) {
        btn.classList.add("saved")
        btn.title = "已收藏到 MindPocket"
      } else {
        console.error("[MindPocket] Save failed:", res?.error)
      }
    } catch (err) {
      console.error("[MindPocket] Save error:", err)
    } finally {
      btn.classList.remove("saving")
    }
  })

  return host
}
