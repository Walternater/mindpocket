import { embed, embedMany } from "ai"
import { eq, inArray } from "drizzle-orm"
import { nanoid } from "nanoid"
import { db, getEnv } from "@/context"
import { getDefaultProvider } from "../../../db/queries/ai-provider"
import { bookmark } from "../../../db/schema/bookmark"
import { embedding } from "../../../db/schema/embedding"
import { getEmbeddingModel } from "./provider"

const CHUNK_SPLIT_REGEX = /[。.!\n]+/

export function generateChunks(input: string): string[] {
  return input
    .trim()
    .split(CHUNK_SPLIT_REGEX)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

export async function generateEmbedding(
  value: string,
  model: ReturnType<typeof getEmbeddingModel>
): Promise<number[]> {
  const { embedding: vector } = await embed({ model, value })
  return vector
}

const EMBED_BATCH_SIZE = 10

/**
 * 生成并存储 embeddings：
 * 向量本体写入 Vectorize（id 与 D1 行一致，metadata 带 userId 供过滤），
 * chunk 文本写入 D1 embedding 表
 */
export async function storeEmbeddings(
  bookmarkId: string,
  userId: string,
  content: string,
  model: ReturnType<typeof getEmbeddingModel>
): Promise<number> {
  const chunks = generateChunks(content)
  if (chunks.length === 0) {
    return 0
  }

  const allEmbeddings: number[][] = []
  for (let i = 0; i < chunks.length; i += EMBED_BATCH_SIZE) {
    const batch = chunks.slice(i, i + EMBED_BATCH_SIZE)
    const { embeddings } = await embedMany({ model, values: batch })
    allEmbeddings.push(...embeddings)
  }

  const rows = chunks.map((chunk, i) => ({
    id: nanoid(),
    bookmarkId,
    userId,
    content: chunk,
    vector: allEmbeddings[i]!,
  }))

  // 覆盖旧数据：先删同书签的旧向量与旧行
  await deleteEmbeddingsByBookmarkId(bookmarkId)

  await getEnv().VECTORIZE.upsert(
    rows.map((row) => ({
      id: row.id,
      values: row.vector,
      metadata: { userId, bookmarkId },
    }))
  )

  await db.insert(embedding).values(
    rows.map(({ id, content: chunkContent }) => ({
      id,
      bookmarkId,
      userId,
      content: chunkContent,
    }))
  )

  return rows.length
}

/** 删除某书签的全部向量（Vectorize + D1） */
export async function deleteEmbeddingsByBookmarkId(bookmarkId: string) {
  const rows = await db
    .select({ id: embedding.id })
    .from(embedding)
    .where(eq(embedding.bookmarkId, bookmarkId))

  if (rows.length > 0) {
    await getEnv().VECTORIZE.deleteByIds(rows.map((r) => r.id))
    await db.delete(embedding).where(eq(embedding.bookmarkId, bookmarkId))
  }
}

const SIMILARITY_THRESHOLD = 0.3
const RESULT_LIMIT = 6
// 多取一些再过滤归档书签
const QUERY_TOP_K = 12

/** 语义检索：Vectorize 查询 → D1 回填 chunk 文本并过滤归档书签 */
export async function findRelevantContent(userId: string, userQuery: string) {
  const config = await getDefaultProvider(userId, "embedding")
  if (!config) {
    return []
  }

  const model = getEmbeddingModel(config)
  const userQueryEmbedded = await generateEmbedding(userQuery, model)

  const matches = await getEnv().VECTORIZE.query(userQueryEmbedded, {
    topK: QUERY_TOP_K,
    filter: { userId },
    returnMetadata: "none",
  })

  const candidates = matches.matches.filter((m) => m.score > SIMILARITY_THRESHOLD)
  if (candidates.length === 0) {
    return []
  }

  const rows = await db
    .select({
      id: embedding.id,
      content: embedding.content,
      bookmarkId: embedding.bookmarkId,
      isArchived: bookmark.isArchived,
    })
    .from(embedding)
    .innerJoin(bookmark, eq(embedding.bookmarkId, bookmark.id))
    .where(
      inArray(
        embedding.id,
        candidates.map((m) => m.id)
      )
    )

  const scoreById = new Map(candidates.map((m) => [m.id, m.score]))

  return rows
    .filter((row) => !row.isArchived)
    .map((row) => ({
      content: row.content,
      bookmarkId: row.bookmarkId,
      similarity: scoreById.get(row.id) ?? 0,
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, RESULT_LIMIT)
}
