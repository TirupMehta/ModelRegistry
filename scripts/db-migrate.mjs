/**
 * Applies the versioned SQL migrations in ./drizzle to the database named by
 * DATABASE_URL_UNPOOLED (falling back to DATABASE_URL).
 *
 * Run with: pnpm db:migrate
 *
 * The unpooled string is preferred because migrations take advisory locks and
 * run several statements; a transaction-pooled connection is the wrong shape
 * for that and some providers reject it outright. Both point at the same
 * database, so nothing else changes.
 */
import path from "node:path"
import { fileURLToPath } from "node:url"
import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import { migrate } from "drizzle-orm/neon-http/migrator"
import { loadEnv } from "./load-env.mjs"

loadEnv()

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL
if (!url) {
  console.error("Missing DATABASE_URL_UNPOOLED / DATABASE_URL. Run: neon env pull")
  process.exit(1)
}

const migrationsFolder = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../drizzle")
const db = drizzle(neon(url))

try {
  await migrate(db, { migrationsFolder })
  console.log("Migrations applied from ./drizzle")
} catch (error) {
  console.error("Migration failed:", error instanceof Error ? error.message : error)
  process.exit(1)
}
