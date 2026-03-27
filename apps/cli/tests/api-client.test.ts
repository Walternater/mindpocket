import assert from "node:assert/strict"
import test from "node:test"
import { ApiClient } from "../src/lib/api-client.js"
import { CliError } from "../src/lib/errors.js"

test("ApiClient wraps fetch failures as SERVER_UNREACHABLE with useful details", async () => {
  const originalFetch = globalThis.fetch
  const networkFailure = Object.assign(new TypeError("fetch failed"), {
    code: "ENOTFOUND",
    cause: Object.assign(new Error("dns lookup failed"), {
      hostname: "mindpocket-web.vercel.app",
    }),
  })

  globalThis.fetch = (() => Promise.reject(networkFailure)) as typeof fetch

  try {
    const client = new ApiClient("https://mindpocket-web.vercel.app")

    await assert.rejects(
      () => client.request("/api/health"),
      (error: unknown) => {
        assert.ok(error instanceof CliError)
        assert.equal(error.code, "SERVER_UNREACHABLE")
        assert.deepEqual(error.details, {
          name: "TypeError",
          message: "fetch failed",
          code: "ENOTFOUND",
          cause: {
            name: "Error",
            message: "dns lookup failed",
            hostname: "mindpocket-web.vercel.app",
          },
        })
        return true
      }
    )
  } finally {
    globalThis.fetch = originalFetch
  }
})
