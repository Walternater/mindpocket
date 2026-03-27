import { ensureOk, parseJsonResponse } from "./http.js"
import { toServerUnreachableError } from "./network-runtime.js"

export class ApiClient {
  private readonly baseUrl: string
  private readonly accessToken?: string

  constructor(baseUrl: string, accessToken?: string) {
    this.baseUrl = baseUrl
    this.accessToken = accessToken
  }

  async request<T>(path: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers)
    headers.set("Accept", "application/json")

    if (init.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json")
    }

    if (this.accessToken) {
      headers.set("Authorization", `Bearer ${this.accessToken}`)
    }

    let response: Response
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        headers,
      })
    } catch (error) {
      throw toServerUnreachableError(error)
    }

    await ensureOk(response)
    return (await parseJsonResponse(response)) as T
  }
}
