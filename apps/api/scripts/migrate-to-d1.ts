/**
 * 一次性数据迁移脚本：PostgreSQL → D1 + Vectorize
 *
 * 用法：
 *   DATABASE_URL=postgres://... pnpm tsx scripts/migrate-to-d1.ts
 *
 * 产出（migration-output/）：
 *   - d1-import.sql       → wrangler d1 execute mindpocket --remote --file=migration-output/d1-import.sql
 *   - vectorize.ndjson    → wrangler vectorize insert mindpocket-embeddings --file=migration-output/vectorize.ndjson
 */

import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { Client } from "pg"

const OUTPUT_DIR = join(import.meta.dirname, "..", "migration-output")

// 迁移表清单：pg 表名 → 列映射（保持插入顺序满足外键依赖）
// 列类型转换：timestamp → 毫秒整数，boolean → 0/1，json/jsonb → JSON 字符串
const TABLES: Array<{
  name: string
  timestampCols: string[]
  booleanCols: string[]
  jsonCols: string[]
  skipCols?: string[]
}> = [
  {
    name: "user",
    timestampCols: ["created_at", "updated_at"],
    booleanCols: ["email_verified", "two_factor_enabled"],
    jsonCols: [],
  },
  {
    name: "session",
    timestampCols: ["expires_at", "created_at", "updated_at"],
    booleanCols: [],
    jsonCols: [],
  },
  {
    name: "account",
    timestampCols: [
      "access_token_expires_at",
      "refresh_token_expires_at",
      "created_at",
      "updated_at",
    ],
    booleanCols: [],
    jsonCols: [],
  },
  {
    name: "verification",
    timestampCols: ["expires_at", "created_at", "updated_at"],
    booleanCols: [],
    jsonCols: [],
  },
  {
    name: "device_code",
    timestampCols: ["expires_at", "last_polled_at"],
    booleanCols: [],
    jsonCols: [],
  },
  { name: "two_factor", timestampCols: [], booleanCols: [], jsonCols: [] },
  {
    name: "folder",
    timestampCols: ["created_at", "updated_at"],
    booleanCols: [],
    jsonCols: [],
  },
  {
    name: "bookmark",
    timestampCols: ["source_created_at", "created_at", "updated_at"],
    booleanCols: ["is_favorite", "is_archived"],
    jsonCols: ["metadata"],
  },
  { name: "tag", timestampCols: ["created_at"], booleanCols: [], jsonCols: [] },
  { name: "bookmark_tag", timestampCols: [], booleanCols: [], jsonCols: [] },
  { name: "chat", timestampCols: ["created_at"], booleanCols: [], jsonCols: [] },
  {
    name: "message",
    timestampCols: ["created_at"],
    booleanCols: [],
    jsonCols: ["parts", "attachments"],
  },
  {
    name: "user_ai_provider",
    timestampCols: ["created_at", "updated_at"],
    booleanCols: ["is_default"],
    jsonCols: [],
  },
  {
    name: "bilibili_credentials",
    timestampCols: ["created_at", "updated_at"],
    booleanCols: [],
    jsonCols: [],
  },
]

/** SQL 字符串转义 */
function sqlValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "NULL"
  }
  if (typeof value === "number") {
    return String(value)
  }
  if (typeof value === "boolean") {
    return value ? "1" : "0"
  }
  if (value instanceof Date) {
    return String(value.getTime())
  }
  if (typeof value === "object") {
    return `'${JSON.stringify(value).replace(/'/g, "''")}'`
  }
  return `'${String(value).replace(/'/g, "''")}'`
}

/** 按列类型转换单个值（timestamp → 毫秒、boolean → 0/1、json → 字符串） */
function convertValue(key: string, value: unknown, spec: (typeof TABLES)[number]): unknown {
  if (value === null) {
    return null
  }
  if (spec.timestampCols.includes(key)) {
    return value instanceof Date ? value.getTime() : new Date(String(value)).getTime()
  }
  if (spec.booleanCols.includes(key)) {
    return value ? 1 : 0
  }
  if (spec.jsonCols.includes(key)) {
    return typeof value === "string" ? value : JSON.stringify(value)
  }
  return value
}

function convertRow(
  row: Record<string, unknown>,
  spec: (typeof TABLES)[number]
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(row)) {
    if (spec.skipCols?.includes(key)) {
      continue
    }
    out[key] = convertValue(key, value, spec)
  }
  return out
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error("DATABASE_URL is required")
    process.exit(1)
  }

  const client = new Client({ connectionString: databaseUrl })
  await client.connect()
  mkdirSync(OUTPUT_DIR, { recursive: true })

  const sqlLines: string[] = ["PRAGMA defer_foreign_keys = true;"]

  // 关系数据 → INSERT 语句
  for (const spec of TABLES) {
    const { rows } = await client.query(`SELECT * FROM "${spec.name}"`)
    console.log(`[migrate] ${spec.name}: ${rows.length} rows`)
    for (const raw of rows) {
      const row = convertRow(raw, spec)
      const cols = Object.keys(row)
      const values = cols.map((c) => sqlValue(row[c]))
      sqlLines.push(
        `INSERT INTO "${spec.name}" (${cols.map((c) => `"${c}"`).join(", ")}) VALUES (${values.join(", ")});`
      )
    }
  }

  // embedding 表：D1 行（不含向量）+ Vectorize NDJSON（含向量与 metadata）
  const { rows: embeddings } = await client.query(`
    SELECT e.id, e.bookmark_id, e.content, e.embedding, b.user_id
    FROM "embedding" e
    JOIN "bookmark" b ON b.id = e.bookmark_id
  `)
  console.log(`[migrate] embedding: ${embeddings.length} rows`)

  const ndjsonLines: string[] = []
  for (const row of embeddings) {
    sqlLines.push(
      `INSERT INTO "embedding" ("id", "bookmark_id", "user_id", "content") VALUES (${sqlValue(row.id)}, ${sqlValue(row.bookmark_id)}, ${sqlValue(row.user_id)}, ${sqlValue(row.content)});`
    )
    // pgvector 返回字符串 "[0.1,0.2,...]"
    const values = typeof row.embedding === "string" ? JSON.parse(row.embedding) : row.embedding
    ndjsonLines.push(
      JSON.stringify({
        id: row.id,
        values,
        metadata: { userId: row.user_id, bookmarkId: row.bookmark_id },
      })
    )
  }

  writeFileSync(join(OUTPUT_DIR, "d1-import.sql"), sqlLines.join("\n"))
  writeFileSync(join(OUTPUT_DIR, "vectorize.ndjson"), ndjsonLines.join("\n"))

  console.log(`\n输出完成：${OUTPUT_DIR}`)
  console.log("后续步骤：")
  console.log("  1. wrangler d1 execute mindpocket --remote --file=migration-output/d1-import.sql")
  console.log(
    "  2. wrangler vectorize insert mindpocket-embeddings --file=migration-output/vectorize.ndjson"
  )

  await client.end()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
