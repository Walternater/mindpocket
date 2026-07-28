import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto"
import { getEnv } from "../context"

const ALGORITHM = "aes-256-gcm"

function deriveKey(): Buffer {
  const secret = getEnv().BETTER_AUTH_SECRET
  if (!secret) {
    throw new Error("BETTER_AUTH_SECRET is not set")
  }
  return createHash("sha256").update(secret).digest()
}

export function encrypt(plaintext: string): string {
  const key = deriveKey()
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()

  return `${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`
}

export function decrypt(encoded: string): string {
  const key = deriveKey()
  const [ivB64, tagB64, ciphertextB64] = encoded.split(":")

  if (!(ivB64 && tagB64 && ciphertextB64)) {
    throw new Error("Invalid encrypted format")
  }

  const iv = Buffer.from(ivB64, "base64")
  const tag = Buffer.from(tagB64, "base64")
  const ciphertext = Buffer.from(ciphertextB64, "base64")

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8")
}
