/**
 * scripts/refresh-independent.mjs
 *
 * Re-reads the independent results behind the standing and /best from the
 * evaluator's own pages and reports what moved, so the numbers do not quietly
 * go stale. Artificial Analysis comparison pages are server-rendered tables, so
 * they can be read directly; arena.ai blocks automated clients, so that source
 * is checked for age only and refreshed by hand.
 *
 *   node scripts/refresh-independent.mjs            report only; exit 1 if anything changed
 *   node scripts/refresh-independent.mjs --write    patch data/independent-benchmarks.ts
 *
 * A value is only ever copied as printed on the page. If a page cannot be read,
 * or a model column cannot be matched, the record is left alone and listed.
 */
import fs from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import { norm, parseComparison } from "./lib/aa-table.mjs"

const require = createRequire(import.meta.url)
const ts = require("typescript")
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const DATA_FILE = path.join(ROOT, "data", "independent-benchmarks.ts")
const WRITE = process.argv.includes("--write")
const UA = "Mozilla/5.0 (compatible; ModelRegistryRefresh/1.0; +https://modelregistry.tirup.in)"
const STALE_DAYS = { arena: 14, aa: 7 }

function loadData() {
  const out = ts.transpileModule(fs.readFileSync(DATA_FILE, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText
  const mod = { exports: {} }
  new Function("module", "exports", "require", out)(mod, mod.exports, require)
  return mod.exports
}

async function fetchPage(url) {
  const res = await fetch(url, { headers: { "user-agent": UA, accept: "text/html" }, redirect: "follow" })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.text()
}

const daysSince = (iso) => Math.floor((Date.now() - new Date(`${iso}T00:00:00Z`).getTime()) / 86_400_000)

const data = loadData()
const { independentRecords, INDEPENDENT_EVALUATOR, ARENA_EVALUATOR } = data
const changes = []
const unread = []
const pages = new Map()

for (const record of independentRecords) {
  if (!record.sourceUrl.includes("/models/comparisons/")) continue
  if (!pages.has(record.sourceUrl)) pages.set(record.sourceUrl, [])
  pages.get(record.sourceUrl).push(record)
}

for (const [url, records] of pages) {
  let parsed
  try {
    parsed = parseComparison(await fetchPage(url))
  } catch (error) {
    for (const r of records) unread.push(`${r.modelId}: page not readable (${error.message})`)
    continue
  }
  if (!parsed || parsed.columns.length === 0) {
    for (const r of records) unread.push(`${r.modelId}: no table found on ${url}`)
    continue
  }
  for (const record of records) {
    const wanted = norm(record.evaluatedAs)
    const index = parsed.columns.findIndex((label) => norm(label).includes(wanted))
    if (index < 0) {
      unread.push(`${record.modelId}: column "${record.evaluatedAs}" not found (page has: ${parsed.columns.join("; ")})`)
      continue
    }
    for (const [key, cells] of Object.entries(parsed.rows)) {
      const next = cells[index]
      if (next === null || next === undefined) continue
      const isMeta = key === "costPerTask" || key === "minutesPerTask"
      const prev = isMeta ? record[key] : record.values[key]
      // Whole-number percentages are the page rounding, not a change.
      if (record.rounded && typeof prev === "number" && Math.round(next) === Math.round(prev)) continue
      if (prev !== next) changes.push({ record, key, isMeta, prev: prev ?? null, next })
    }
  }
}

console.log(`Independent results refresh (${WRITE ? "write" : "report"})`)
console.log(`  Artificial Analysis data read ${INDEPENDENT_EVALUATOR.retrievedAt} (${daysSince(INDEPENDENT_EVALUATOR.retrievedAt)} days ago)`)
if (ARENA_EVALUATOR) {
  const age = daysSince(ARENA_EVALUATOR.asOf)
  console.log(
    `  arena.ai leaderboard dated ${ARENA_EVALUATOR.asOf} (${age} days ago)${age > STALE_DAYS.arena ? "  STALE: refresh by hand, the site blocks automated reads" : ""}`,
  )
}
console.log(`  ${pages.size} pages read, ${changes.length} changed value(s), ${unread.length} unread record(s)\n`)
for (const c of changes) {
  console.log(`  ${c.record.modelId}.${c.key}: ${c.prev ?? "(none)"} -> ${c.next}`)
}
if (unread.length) {
  console.log("\nNot refreshed:")
  for (const line of unread) console.log(`  ${line}`)
}

if (WRITE && changes.length > 0) {
  let source = fs.readFileSync(DATA_FILE, "utf8")
  const crlf = source.includes("\r\n")
  if (crlf) source = source.replace(/\r\n/g, "\n")
  for (const c of changes) {
    const start = source.indexOf(`modelId: "${c.record.modelId}"`)
    const end = source.indexOf("\n  },", start)
    let block = source.slice(start, end)
    if (c.isMeta) {
      const re = new RegExp(`(${c.key}:\\s*)[-\\d.]+`)
      block = re.test(block) ? block.replace(re, `$1${c.next}`) : block.replace(/\n$/, "") + `\n    ${c.key}: ${c.next},`
    } else {
      const re = new RegExp(`(\\b${c.key}:\\s*)[-\\d.]+`)
      block = re.test(block)
        ? block.replace(re, `$1${c.next}`)
        : block.replace(/(values: \{ )/, `$1${c.key}: ${c.next}, `)
    }
    source = source.slice(0, start) + block + source.slice(end)
  }
  const today = new Date().toISOString().slice(0, 10)
  source = source.replace(/(retrievedAt:\s*")\d{4}-\d{2}-\d{2}(")/, `$1${today}$2`)
  if (crlf) source = source.replace(/\n/g, "\r\n")
  fs.writeFileSync(DATA_FILE, source)
  console.log(`\nWrote ${changes.length} change(s) to data/independent-benchmarks.ts and set retrievedAt to ${today}.`)
  console.log("Next: node scripts/write-revision.js && npm test")
  process.exit(0)
}

process.exit(changes.length > 0 || unread.length > 0 ? 1 : 0)
