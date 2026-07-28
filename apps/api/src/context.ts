import { AsyncLocalStorage } from "node:async_hooks"
import type { Database } from "../db/client"
import type { Env } from "./env"

// 只依赖 waitUntil，避免 Hono 与 workers-types 的 ExecutionContext 类型冲突
interface ExecutionCtxLike {
  waitUntil(promise: Promise<unknown>): void
}

interface RequestStore {
  env: Env
  db: Database
  executionCtx: ExecutionCtxLike
}

// 每请求上下文：让业务代码不必逐层传递 env/db
export const requestContext = new AsyncLocalStorage<RequestStore>()

function getStore(): RequestStore {
  const store = requestContext.getStore()
  if (!store) {
    throw new Error("Request context not initialized")
  }
  return store
}

/** 获取当前请求的 Worker 环境绑定（D1/Vectorize/R2 等） */
export function getEnv(): Env {
  return getStore().env
}

/**
 * 后台执行任务（响应返回后继续运行）
 * Workers 上 fire-and-forget 的 Promise 会被运行时终止，必须用 waitUntil 挂住
 */
export function runInBackground(task: Promise<unknown>) {
  getStore().executionCtx.waitUntil(
    task.catch((error) => {
      console.error("[background] task failed:", error)
    })
  )
}

/**
 * 当前请求的 Drizzle 实例
 * Proxy 转发到 ALS 中的实例，保持与原 web 代码相同的模块级 db 用法
 */
export const db = new Proxy({} as Database, {
  get(_target, prop, receiver) {
    const database = getStore().db
    const value = Reflect.get(database as object, prop, receiver)
    return typeof value === "function" ? value.bind(database) : value
  },
  has(_target, prop) {
    return prop in getStore().db
  },
})
