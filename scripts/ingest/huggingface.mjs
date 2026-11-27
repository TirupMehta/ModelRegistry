/**
 * scripts/ingest/huggingface.mjs
 *
 * Refreshes the open-weight layer from the public Hugging Face Hub API.
 *
 * What it writes (data/huggingface.ts, generated and committed):
 *   - the canonical repository for every open-weight model we can resolve
 *   - 30-day download counts, likes, licence tag, created/last-modified and commit
 *   - gated / disabled flags
 *
 * What it deliberately does NOT do:
 *   - guess a repository (an org page or a collection is not a repository)
 *   - invent a number for a repo that 404s (the record is simply left out)
 *   - overwrite the laboratory's own parameter count with a checkpoint size
 *   - run during `next build`; the build reads the committed file, so a network
 *     failure can never break a deploy
 *
 * Usage:
 *   node scripts/ingest/huggingface.mjs            # fetch and write
 *   node scripts/ingest/huggingface.mjs --dry-run  # report, write nothing
 *
 * After a refresh, the snapshot is stale by design:
 *   npm run validate && npm run snapshot && npm test
 */
import fs from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"

const require = createRequire(import.meta.url)
const { load, ROOT } = require("../lib/ts-load.js")

const { modelsData } = load("data/models.ts")
const { canonicalOverrides } = load("data/canonical-overrides.ts")
const { huggingFaceRepoFromLink } = load("lib/canonical.ts")

const OUT = path.join(ROOT, "data", "huggingface.ts")
const UA = "ModelRegistry-Ingest/1.0 (+https://modelregistry.tirup.in/verify)"
const DRY = process.argv.includes("--dry-run")
const DELAY_MS = 400
const TIMEOUT_MS = 20000

/**
 * Licence tags the Hub publishes that map to one unambiguous SPDX identifier.
 * Anything else stays null: a custom licence is not an SPDX id, and inventing one
 * would be a claim the source does not make.
 */
const SPDX = {
  mit: "MIT",
  "apache-2.0": "Apache-2.0",
  "cc-by-4.0": "CC-BY-4.0",
  "cc-by-sa-4.0": "CC-BY-SA-4.0",
  "cc-by-nc-4.0": "CC-BY-NC-4.0",
  "bsd-3-clause": "BSD-3-Clause",
  "gpl-3.0": "GPL-3.0",
}

function targets() {
  const list = []
  for (const model of modelsData) {
    if (!model.openWeights) continue
    const override = canonicalOverrides[model.id]
    const repo = override?.huggingfaceRepo ?? huggingFaceRepoFromLink(model.links.weights)
    if (repo) list.push({ slug: model.id, repo })
  }
  return list.sort((a, b) => a.slug.localeCompare(b.slug))
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function fetchRepo(repo) {
  const url = `https://huggingface.co/api/models/${repo}`
  let lastError = null
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      })
      if (res.status === 404) return { status: 404 }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      const licenseTag = (json.tags || []).find((tag) => String(tag).startsWith("license:"))
      const cardLicense = json.cardData?.license
      const license =
        (typeof cardLicense === "string" ? cardLicense : null) ||
        (licenseTag ? String(licenseTag).slice("license:".length) : null)
      return {
        status: 200,
        record: {
          repo: json.id || repo,
          downloads: typeof json.downloads === "number" ? json.downloads : null,
          likes: typeof json.likes === "number" ? json.likes : null,
          licenseSpdx: license ? (SPDX[license.toLowerCase()] ?? null) : null,
          createdAt: json.createdAt || null,
          lastModified: json.lastModified || null,
          sha: json.sha || null,
          gated: Boolean(json.gated),
        },
      }
    } catch (error) {
      lastError = error
      if (attempt < 2) await sleep(1500)
    }
  }
  return { status: 0, error: lastError?.message ?? "unknown error" }
}

const list = targets()
console.log(`Hugging Face ingestion: ${list.length} open-weight repositories to check.\n`)

const records = {}
const missing = []
const failed = []

for (const { slug, repo } of list) {
  const result = await fetchRepo(repo)
  if (result.status === 200) {
    const { record } = result
    records[slug] = record
    console.log(
      `  ok   ${slug.padEnd(30)} ${String(record.downloads ?? "?").padStart(9)} downloads  ${record.licenseSpdx ?? "-"}`,
    )
  } else if (result.status === 404) {
    missing.push({ slug, repo })
    console.log(`  404  ${slug.padEnd(30)} ${repo} (not a public repository)`)
  } else {
    failed.push({ slug, repo, error: result.error })
    console.log(`  err  ${slug.padEnd(30)} ${repo} (${result.error})`)
  }
  await sleep(DELAY_MS)
}

const retrievedAt = new Date().toISOString().slice(0, 10)
const okCount = Object.keys(records).length

console.log(
  `\n${okCount} verified, ${missing.length} not found, ${failed.length} failed, retrieved ${retrievedAt}.`,
)

if (missing.length > 0) {
  console.log("\nNot found (left out of the snapshot; the record keeps no download figure):")
  for (const entry of missing) console.log(`  - ${entry.slug} -> ${entry.repo}`)
}
if (failed.length > 0) {
  console.log("\nFailed (network or server error; the published snapshot is not touched):")
  for (const entry of failed) console.log(`  - ${entry.slug} -> ${entry.repo}: ${entry.error}`)
}

if (failed.length > 0) {
  // A partial refresh would silently drop records that were previously published.
  console.error("\nRefusing to write a partial snapshot. Re-run when the Hub is reachable.")
  process.exit(1)
}

const sorted = Object.fromEntries(Object.entries(records).sort(([a], [b]) => a.localeCompare(b)))

const file = `/**
 * data/huggingface.ts - GENERATED by scripts/ingest/huggingface.mjs. Do not edit.
 *
 * Open-weight facts read from the public Hugging Face Hub API. A repository that
 * returned 404 is absent rather than zeroed: no downloads, no likes, no licence.
 * \`downloads\` is the Hub's own 30-day counter, not a registry measurement.
 */
export interface HuggingFaceRecord {
  repo: string
  downloads: number | null
  likes: number | null
  /** SPDX identifier only when the Hub licence tag maps to one unambiguously. */
  licenseSpdx: string | null
  createdAt: string | null
  lastModified: string | null
  sha: string | null
  gated: boolean
}

export interface HuggingFaceSnapshot {
  /** Where the numbers came from. */
  source: string
  sourceUrl: string
  /** The day the API was read. Not a live signal. */
  retrievedAt: string
  records: Record<string, HuggingFaceRecord>
}

export const huggingfaceSnapshot: HuggingFaceSnapshot = ${JSON.stringify(
  {
    source: "Hugging Face Hub API",
    sourceUrl: "https://huggingface.co/api/models",
    retrievedAt,
    records: sorted,
  },
  null,
  2,
)}
`

if (DRY) {
  console.log("\nDry run: nothing written.")
  process.exit(0)
}

fs.writeFileSync(OUT, file)
console.log(`\nWrote ${path.relative(ROOT, OUT)} (${okCount} records).`)
console.log("Next: npm run validate && npm run snapshot && npm test")
