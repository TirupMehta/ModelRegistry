/**
 * Minimal .env loader for the standalone scripts. The app itself gets env vars
 * from Next.js, but `node scripts/*.mjs` runs outside that runtime and would
 * otherwise need a dotenv dependency for two variables.
 *
 * Precedence matches Next.js: an already-set process env wins, then .env.local,
 * then .env. Nothing is logged, so values cannot leak into CI output.
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

export function loadEnv(files = [".env.local", ".env"]) {
  for (const file of files) {
    const full = path.join(ROOT, file)
    if (!fs.existsSync(full)) continue

    for (const line of fs.readFileSync(full, "utf8").split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
      if (!match) continue

      const [, key, rawValue] = match
      if (process.env[key] !== undefined) continue

      const value = rawValue.replace(/^(['"])(.*)\1$/, "$2")
      process.env[key] = value
    }
  }
}
