import { and, eq } from "drizzle-orm"
import { nanoid } from "nanoid"
import { db } from "@/context"
import { decrypt, encrypt } from "@/lib/crypto"
import { userAiProvider } from "../schema/ai-provider"

export async function getProvidersByUserId(userId: string) {
  const rows = await db
    .select({
      id: userAiProvider.id,
      name: userAiProvider.name,
      type: userAiProvider.type,
      baseUrl: userAiProvider.baseUrl,
      modelId: userAiProvider.modelId,
      isDefault: userAiProvider.isDefault,
      createdAt: userAiProvider.createdAt,
      updatedAt: userAiProvider.updatedAt,
    })
    .from(userAiProvider)
    .where(eq(userAiProvider.userId, userId))
  return rows
}

export async function getProviderWithDecryptedKey(id: string, userId: string) {
  const [row] = await db
    .select()
    .from(userAiProvider)
    .where(and(eq(userAiProvider.id, id), eq(userAiProvider.userId, userId)))

  if (!row) {
    return null
  }

  return {
    ...row,
    apiKey: decrypt(row.apiKey),
  }
}

export async function getDefaultProvider(userId: string, type: string) {
  const [row] = await db
    .select()
    .from(userAiProvider)
    .where(
      and(
        eq(userAiProvider.userId, userId),
        eq(userAiProvider.type, type),
        eq(userAiProvider.isDefault, true)
      )
    )

  if (!row) {
    return null
  }

  return {
    ...row,
    apiKey: decrypt(row.apiKey),
  }
}

export async function createProvider(data: {
  userId: string
  name: string
  type: string
  baseUrl: string
  apiKey: string
  modelId: string
  isDefault?: boolean
}) {
  const id = nanoid()
  const encryptedKey = encrypt(data.apiKey)

  await db.insert(userAiProvider).values({
    id,
    userId: data.userId,
    name: data.name,
    type: data.type,
    baseUrl: data.baseUrl,
    apiKey: encryptedKey,
    modelId: data.modelId,
    isDefault: data.isDefault ?? false,
  })

  return { id }
}

export async function updateProvider(
  id: string,
  userId: string,
  data: {
    name?: string
    baseUrl?: string
    apiKey?: string
    modelId?: string
    isDefault?: boolean
  }
) {
  const values: Record<string, unknown> = {}
  if (data.name !== undefined) {
    values.name = data.name
  }
  if (data.baseUrl !== undefined) {
    values.baseUrl = data.baseUrl
  }
  if (data.apiKey !== undefined) {
    values.apiKey = encrypt(data.apiKey)
  }
  if (data.modelId !== undefined) {
    values.modelId = data.modelId
  }
  if (data.isDefault !== undefined) {
    values.isDefault = data.isDefault
  }

  if (Object.keys(values).length === 0) {
    return
  }

  await db
    .update(userAiProvider)
    .set(values)
    .where(and(eq(userAiProvider.id, id), eq(userAiProvider.userId, userId)))
}

export async function deleteProvider(id: string, userId: string) {
  await db
    .delete(userAiProvider)
    .where(and(eq(userAiProvider.id, id), eq(userAiProvider.userId, userId)))
}

export async function clearDefaultProvider(userId: string, type: string) {
  await db
    .update(userAiProvider)
    .set({ isDefault: false })
    .where(
      and(
        eq(userAiProvider.userId, userId),
        eq(userAiProvider.type, type),
        eq(userAiProvider.isDefault, true)
      )
    )
}
