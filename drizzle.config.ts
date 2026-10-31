import { defineConfig } from "drizzle-kit"

// `drizzle-kit generate` only needs the schema and output directory, so a local
// build never depends on a database being reachable. `db:migrate` resolves its
// own connection string from .env.local (see scripts/db-migrate.mjs).
export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  strict: true,
  verbose: true,
})
