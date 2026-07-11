import { defineConfig } from "drizzle-kit"

// 只用于生成 SQL 迁移文件，应用迁移走 wrangler d1 migrations apply
export default defineConfig({
  dialect: "sqlite",
  driver: "d1-http",
  schema: "./db/schema/index.ts",
  out: "./db/migrations",
})
