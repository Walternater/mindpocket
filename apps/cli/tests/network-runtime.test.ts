import assert from "node:assert/strict"
import test from "node:test"
import { Agent, getGlobalDispatcher, setGlobalDispatcher } from "undici"
import {
  hasProxyEnv,
  installNetworkRuntime,
  ProxyEnvironmentDispatcher,
  resolveProxyConfig,
  serializeErrorDetails,
  toServerUnreachableError,
} from "../src/lib/network-runtime.js"

test("hasProxyEnv detects upper and lower case proxy variables", () => {
  assert.equal(hasProxyEnv({ HTTPS_PROXY: "http://127.0.0.1:7890" }), true)
  assert.equal(hasProxyEnv({ http_proxy: "http://127.0.0.1:7890" }), true)
  assert.equal(hasProxyEnv({ NO_PROXY: "example.com" }), false)
  assert.equal(hasProxyEnv({}), false)
})

test("resolveProxyConfig merges proxy env values and keeps NO_PROXY rules", () => {
  assert.deepEqual(
    resolveProxyConfig({
      HTTPS_PROXY: "http://127.0.0.1:7890",
      HTTP_PROXY: "http://127.0.0.1:7891",
      NO_PROXY: "example.com,localhost",
    }),
    {
      httpsProxy: "http://127.0.0.1:7890",
      httpProxy: "http://127.0.0.1:7891",
      noProxy: "example.com,localhost",
    }
  )
})

test("installNetworkRuntime keeps the current dispatcher when no proxy env is set", async () => {
  const originalDispatcher = getGlobalDispatcher()
  const sentinelDispatcher = new Agent()
  setGlobalDispatcher(sentinelDispatcher)

  try {
    assert.equal(installNetworkRuntime({}), false)
    assert.equal(getGlobalDispatcher(), sentinelDispatcher)
  } finally {
    setGlobalDispatcher(originalDispatcher)
    await sentinelDispatcher.close()
  }
})

test("installNetworkRuntime installs a proxy-aware dispatcher when proxy env is present", async () => {
  const originalDispatcher = getGlobalDispatcher()
  const sentinelDispatcher = new Agent()
  setGlobalDispatcher(sentinelDispatcher)

  try {
    assert.equal(
      installNetworkRuntime({
        HTTPS_PROXY: "http://127.0.0.1:7890",
      }),
      true
    )
    assert.ok(getGlobalDispatcher() instanceof ProxyEnvironmentDispatcher)
  } finally {
    const activeDispatcher = getGlobalDispatcher()
    setGlobalDispatcher(originalDispatcher)
    if (activeDispatcher !== originalDispatcher && "close" in activeDispatcher) {
      await (activeDispatcher as Agent | ProxyEnvironmentDispatcher).close()
    }
    await sentinelDispatcher.close()
  }
})

test("network failures are converted into serializable SERVER_UNREACHABLE details", () => {
  const cause = Object.assign(new Error("lookup failed"), {
    code: "ENOTFOUND",
    hostname: "mindpocket-web.vercel.app",
  })
  const error = Object.assign(new TypeError("fetch failed"), {
    code: "UND_ERR_CONNECT_TIMEOUT",
    cause,
  })

  assert.deepEqual(serializeErrorDetails(error), {
    name: "TypeError",
    message: "fetch failed",
    code: "UND_ERR_CONNECT_TIMEOUT",
    cause: {
      name: "Error",
      message: "lookup failed",
      code: "ENOTFOUND",
      hostname: "mindpocket-web.vercel.app",
    },
  })

  const cliError = toServerUnreachableError(error)
  assert.equal(cliError.code, "SERVER_UNREACHABLE")
  assert.equal(cliError.message, "Failed to reach MindPocket server")
  assert.deepEqual(cliError.details, {
    name: "TypeError",
    message: "fetch failed",
    code: "UND_ERR_CONNECT_TIMEOUT",
    cause: {
      name: "Error",
      message: "lookup failed",
      code: "ENOTFOUND",
      hostname: "mindpocket-web.vercel.app",
    },
  })
})
