import { neon } from "@neondatabase/serverless"
import { config } from "dotenv"

config({
  path: ".env.local",
})

async function main() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is missing. Set it in Vercel or apps/web/.env.local")
  }

  const sql = neon(databaseUrl)
  await sql`CREATE EXTENSION IF NOT EXISTS vector`
  console.log("[ensure-extensions] pgvector extension ready")
}

main().catch((error) => {
  console.error("[ensure-extensions] Failed to ensure pgvector extension")
  console.error(error)
  process.exit(1)
})
