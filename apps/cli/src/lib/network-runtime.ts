import { Agent, Dispatcher, ProxyAgent, setGlobalDispatcher } from "undici"
import { CliError } from "./errors.js"

const PROXY_URL_ENV_KEYS = ["http_proxy", "https_proxy", "HTTP_PROXY", "HTTPS_PROXY"] as const
const NO_PROXY_SPLIT_REGEX = /[,\s]/
const NO_PROXY_HOST_PORT_REGEX = /^(.+):(\d+)$/
const NO_PROXY_WILDCARD_PREFIX_REGEX = /^\*?\./

type SerializableDetails =
  | string
  | number
  | boolean
  | null
  | SerializableDetails[]
  | { [key: string]: SerializableDetails }

const DEFAULT_PORTS: Record<string, number> = {
  "http:": 80,
  "https:": 443,
}

interface ProxyConfig {
  httpProxy?: string
  httpsProxy?: string
  noProxy?: string
}

interface NoProxyEntry {
  hostname: string
  port: number
}

export class ProxyEnvironmentDispatcher extends Dispatcher {
  private readonly noProxyAgent = new Agent()
  private readonly httpProxyAgent: Dispatcher
  private readonly httpsProxyAgent: Dispatcher
  private readonly noProxyEntries: NoProxyEntry[]

  constructor(config: ProxyConfig) {
    super()

    this.httpProxyAgent = config.httpProxy
      ? new ProxyAgent({ uri: config.httpProxy })
      : this.noProxyAgent

    this.httpsProxyAgent = config.httpsProxy
      ? new ProxyAgent({ uri: config.httpsProxy })
      : this.httpProxyAgent

    this.noProxyEntries = parseNoProxy(config.noProxy)
  }

  override dispatch(options: Dispatcher.DispatchOptions, handler: Dispatcher.DispatchHandlers) {
    const origin =
      typeof options.origin === "string" || options.origin instanceof URL
        ? new URL(options.origin)
        : null

    const dispatcher = origin ? this.getDispatcherForOrigin(origin) : this.noProxyAgent
    return dispatcher.dispatch(options, handler)
  }

  override async close() {
    const closers = [this.noProxyAgent, this.httpProxyAgent, this.httpsProxyAgent]
    await Promise.all(
      [...new Set(closers)].map(async (dispatcher) => {
        await dispatcher.close()
      })
    )
  }

  override destroy(err?: Error | null): Promise<void>
  override destroy(callback: () => void): void
  override destroy(err: Error | null, callback: () => void): void
  override destroy(
    errOrCallback?: Error | null | (() => void),
    callback?: () => void
  ): Promise<void> | void {
    const error = typeof errOrCallback === "function" ? null : errOrCallback || null
    const complete = typeof errOrCallback === "function" ? errOrCallback : callback
    const destroyers = [this.noProxyAgent, this.httpProxyAgent, this.httpsProxyAgent]
    const work = Promise.all(
      [...new Set(destroyers)].map(async (dispatcher) => {
        await dispatcher.destroy(error)
      })
    ).then(() => undefined)

    if (complete) {
      work.finally(complete).catch(() => undefined)
      return
    }

    return work
  }

  private getDispatcherForOrigin(url: URL) {
    if (!shouldProxy(url, this.noProxyEntries)) {
      return this.noProxyAgent
    }

    return url.protocol === "https:" ? this.httpsProxyAgent : this.httpProxyAgent
  }
}

export function resolveProxyConfig(env: NodeJS.ProcessEnv = process.env): ProxyConfig | null {
  const httpProxy = env.http_proxy || env.HTTP_PROXY
  const httpsProxy = env.https_proxy || env.HTTPS_PROXY

  if (!(httpProxy || httpsProxy)) {
    return null
  }

  return {
    httpProxy,
    httpsProxy,
    noProxy: env.no_proxy || env.NO_PROXY,
  }
}

export function hasProxyEnv(env: NodeJS.ProcessEnv = process.env) {
  return PROXY_URL_ENV_KEYS.some((key) => Boolean(env[key]))
}

export function installNetworkRuntime(env: NodeJS.ProcessEnv = process.env) {
  const proxyConfig = resolveProxyConfig(env)
  if (!proxyConfig) {
    return false
  }

  setGlobalDispatcher(new ProxyEnvironmentDispatcher(proxyConfig))
  return true
}

function parseNoProxy(noProxyValue?: string) {
  if (!noProxyValue) {
    return []
  }

  return noProxyValue
    .split(NO_PROXY_SPLIT_REGEX)
    .filter(Boolean)
    .map((entry) => {
      const parsed = entry.match(NO_PROXY_HOST_PORT_REGEX)
      return {
        hostname: (parsed ? parsed[1] : entry)
          .replace(NO_PROXY_WILDCARD_PREFIX_REGEX, "")
          .toLowerCase(),
        port: parsed ? Number.parseInt(parsed[2], 10) : 0,
      }
    })
}

function shouldProxy(url: URL, noProxyEntries: NoProxyEntry[]) {
  if (noProxyEntries.length === 0) {
    return true
  }

  const hostname = url.hostname.toLowerCase()
  const port = Number.parseInt(url.port, 10) || DEFAULT_PORTS[url.protocol] || 0

  for (const entry of noProxyEntries) {
    if (entry.hostname === "*") {
      return false
    }

    if (entry.port && entry.port !== port) {
      continue
    }

    if (hostname === entry.hostname || hostname.endsWith(`.${entry.hostname}`)) {
      return false
    }
  }

  return true
}

function isSerializablePrimitive(value: unknown): value is string | number | boolean | null {
  return (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === null
  )
}

function serializeErrorLikeObject(
  value: Record<string, unknown>,
  depth: number
): Record<string, SerializableDetails> {
  const details: Record<string, SerializableDetails> = {}

  for (const [key, entry] of Object.entries(value)) {
    const serialized = serializeErrorDetails(entry, depth + 1)
    if (serialized !== undefined) {
      details[key] = serialized
    }
  }

  return details
}

export function serializeErrorDetails(error: unknown, depth = 0): SerializableDetails | undefined {
  if (depth > 3 || error === undefined) {
    return undefined
  }

  if (isSerializablePrimitive(error)) {
    return error
  }

  if (Array.isArray(error)) {
    return error
      .map((entry) => serializeErrorDetails(entry, depth + 1))
      .filter((entry): entry is SerializableDetails => entry !== undefined)
  }

  if (error instanceof Error) {
    const details: Record<string, SerializableDetails> = {
      name: error.name,
      message: error.message,
    }

    const candidates = error as Error & Record<string, unknown>
    for (const key of ["code", "errno", "syscall", "hostname", "address", "port"]) {
      const value = candidates[key]
      const serialized = serializeErrorDetails(value, depth + 1)
      if (serialized !== undefined) {
        details[key] = serialized
      }
    }

    if ("cause" in candidates) {
      const serializedCause = serializeErrorDetails(candidates.cause, depth + 1)
      if (serializedCause !== undefined) {
        details.cause = serializedCause
      }
    }

    return details
  }

  if (typeof error === "object" && error) {
    return serializeErrorLikeObject(error as Record<string, unknown>, depth)
  }

  return String(error)
}

export function toServerUnreachableError(error: unknown) {
  return new CliError(
    "SERVER_UNREACHABLE",
    "Failed to reach MindPocket server",
    serializeErrorDetails(error)
  )
}
