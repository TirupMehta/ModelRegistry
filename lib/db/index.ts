import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import * as schema from "./schema"

/**
 * Thrown when the deployment has no connection string. Callers translate this
 * into a 503 with a generic user-facing message; the detail stays in the log so
 * a misconfigured deployment is obvious to whoever owns it.
 */
export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super("DATABASE_URL is not set for this deployment")
    this.name = "DatabaseNotConfiguredError"
  }
}

/**
 * Neon's HTTP driver is the right fit here: this app deploys to Vercel, where
 * functions are frozen between invocations, so a TCP pool would be opened and
 * torn down constantly. Every query here is a single short statement over
 * HTTPS, which also means no pool sizing to tune and no connection ceiling to
 * exhaust under load.
 *
 * The instances are cached per process because creating a client per request
 * would rebuild the fetch plumbing on every call.
 */
function createDatabase() {
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL
  if (!url) throw new DatabaseNotConfiguredError()

  return drizzle(neon(url), { schema })
}

type Database = ReturnType<typeof createDatabase>

let cached: Database | undefined

export function getDb(): Database {
  cached ??= createDatabase()
  return cached
}

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL ?? process.env.POSTGRES_URL)
}

export { schema }
