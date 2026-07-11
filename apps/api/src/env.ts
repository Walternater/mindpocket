/**
 * Worker 环境绑定类型
 * 与 wrangler.jsonc 中的 bindings 一一对应
 */
export interface Env {
  // 静态资产（Next.js 静态导出）
  ASSETS: Fetcher
  // D1 关系数据库
  DB: D1Database
  // Vectorize 向量索引（1024 维 cosine）
  VECTORIZE: VectorizeIndex
  // R2 文件存储
  BUCKET: R2Bucket
  // R2 公开访问域名
  R2_PUBLIC_URL: string
  // 应用地址（Better Auth baseURL / trustedOrigins 用）
  NEXT_PUBLIC_APP_URL: string
  // Better Auth 密钥（wrangler secret）
  BETTER_AUTH_SECRET: string
}

/** Hono 的泛型上下文：Bindings + 每请求注入的变量 */
export interface HonoEnv {
  Bindings: Env
  Variables: {
    db: import("../db/client").Database
    auth: import("./lib/auth").Auth
    // authGuard 校验通过后注入（公开路由中为 undefined）
    session: import("./lib/auth").AuthSession
  }
}
