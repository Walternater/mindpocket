const DEFAULT_SERVER = import.meta.env.WXT_API_BASE || "http://127.0.0.1:3000"
const SERVER_KEY = "mindpocket_server"
const TOKEN_KEY = "mindpocket_token"
const USER_KEY = "mindpocket_user"
const INJECTION_PLATFORMS_KEY = "mindpocket_injection_platforms"
const EXT_CLIENT_ID = "mindpocket-extension"

export const SUPPORTED_INJECTION_PLATFORMS = ["twitter", "zhihu", "xiaohongshu"] as const

export type SupportedInjectionPlatform = (typeof SUPPORTED_INJECTION_PLATFORMS)[number]
export type InjectionPlatformSettings = Record<SupportedInjectionPlatform, boolean>

const DEFAULT_INJECTION_PLATFORM_SETTINGS: InjectionPlatformSettings = {
  twitter: true,
  zhihu: true,
  xiaohongshu: true,
}

export async function getServerUrl(): Promise<string> {
  const result = await chrome.storage.local.get<Record<string, string>>(SERVER_KEY)
  return result[SERVER_KEY] || DEFAULT_SERVER
}

export async function setServerUrl(url: string): Promise<void> {
  await chrome.storage.local.set({ [SERVER_KEY]: url })
}

export async function getInjectionPlatformSettings(): Promise<InjectionPlatformSettings> {
  const result =
    await chrome.storage.local.get<Record<string, Partial<InjectionPlatformSettings>>>(
      INJECTION_PLATFORMS_KEY
    )

  return {
    ...DEFAULT_INJECTION_PLATFORM_SETTINGS,
    ...result[INJECTION_PLATFORMS_KEY],
  }
}

export async function setInjectionPlatformSettings(
  settings: InjectionPlatformSettings
): Promise<void> {
  await chrome.storage.local.set({ [INJECTION_PLATFORMS_KEY]: settings })
}

export async function getToken(): Promise<string | null> {
  const result = await chrome.storage.local.get<Record<string, string>>(TOKEN_KEY)
  return result[TOKEN_KEY] || null
}

export async function setToken(token: string): Promise<void> {
  await chrome.storage.local.set({ [TOKEN_KEY]: token })
}

export async function removeToken(): Promise<void> {
  await chrome.storage.local.remove(TOKEN_KEY)
}

export async function getCachedUser(): Promise<{ id: string; name: string; email: string } | null> {
  const result =
    await chrome.storage.local.get<Record<string, { id: string; name: string; email: string }>>(
      USER_KEY
    )
  return result[USER_KEY] || null
}

export async function setCachedUser(user: {
  id: string
  name: string
  email: string
}): Promise<void> {
  await chrome.storage.local.set({ [USER_KEY]: user })
}

export async function removeCachedUser(): Promise<void> {
  await chrome.storage.local.remove(USER_KEY)
}

async function authFetch(path: string, options: RequestInit = {}) {
  const token = await getToken()
  const baseUrl = await getServerUrl()
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  const res = await fetch(`${baseUrl}${path}`, { ...options, headers })
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  return { ok: res.ok, status: res.status, data }
}

// 设备授权流程：请求设备码
export interface DeviceCodeResponse {
  device_code: string
  user_code: string
  verification_uri: string
  verification_uri_complete: string
  expires_in: number
  interval: number
}

export async function requestDeviceCode(): Promise<DeviceCodeResponse> {
  const baseUrl = await getServerUrl()
  const res = await fetch(`${baseUrl}/api/auth/device/code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: EXT_CLIENT_ID }),
  })
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  if (!res.ok) {
    throw new Error(data?.error_description || `请求设备码失败 (${res.status})`)
  }
  return data
}

// 设备授权流程：轮询授权状态
export type DevicePollResult =
  | { status: "pending" }
  | { status: "slow_down"; intervalMs: number }
  | { status: "authorized"; accessToken: string }

export async function pollDeviceToken(
  deviceCode: string,
  currentIntervalMs: number
): Promise<DevicePollResult> {
  const baseUrl = await getServerUrl()
  const res = await fetch(`${baseUrl}/api/auth/device/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "urn:ietf:params:oauth:grant-type:device_code",
      device_code: deviceCode,
      client_id: EXT_CLIENT_ID,
    }),
  })

  if (res.ok) {
    const data = await res.json()
    return { status: "authorized", accessToken: data.access_token }
  }

  const data = await res.json()
  if (data.error === "authorization_pending") {
    return { status: "pending" }
  }
  if (data.error === "slow_down") {
    return { status: "slow_down", intervalMs: currentIntervalMs + 5000 }
  }
  if (data.error === "expired_token") {
    throw new Error("验证码已过期，请重新发起登录。")
  }
  if (data.error === "access_denied") {
    throw new Error("授权被拒绝。")
  }
  throw new Error(data.error_description || "设备授权失败。")
}

// 设备授权流程：获取用户信息并持久化
export async function completeDeviceAuth(accessToken: string) {
  await setToken(accessToken)
  const res = await getSession()
  if (res.ok && res.data?.user) {
    await setCachedUser(res.data.user)
    return res.data.user
  }
  throw new Error("登录成功但获取用户信息失败。")
}

export function getSession() {
  return authFetch("/api/auth/get-session")
}

export async function signOut() {
  await authFetch("/api/auth/sign-out", { method: "POST" })
  await removeToken()
  await removeCachedUser()
}

export function saveBookmark(payload: {
  url: string
  markdown?: string
  html?: string
  title?: string
}) {
  return authFetch("/api/ingest", {
    method: "POST",
    body: JSON.stringify({ ...payload, clientSource: "extension" }),
  })
}

// ==================== 浏览器抓取队列 ====================

export interface BrowserTask {
  id: string
  url: string | null
  title: string
}

/** 认领待抓任务（服务端抓取失败、等待浏览器补抓的书签） */
export async function claimBrowserTasks(limit = 3): Promise<BrowserTask[]> {
  const res = await authFetch("/api/ingest/browser-tasks/claim", {
    method: "POST",
    body: JSON.stringify({ limit }),
  })
  if (!res.ok) {
    return []
  }
  return (res.data?.tasks ?? []) as BrowserTask[]
}

/** 回传抓取结果（成功带 markdown/html，失败带 error） */
export function reportBrowserResult(
  id: string,
  result: { markdown?: string; html?: string; title?: string; error?: string }
) {
  return authFetch(`/api/ingest/${id}/browser-result`, {
    method: "POST",
    body: JSON.stringify(result),
  })
}
