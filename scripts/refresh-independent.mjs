/**
 * scripts/refresh-independent.mjs
 *
 * Re-reads the independent results behind the standing and /best from the
 * evaluator's own pages and reports what moved, so the numbers do not quietly
 * go stale. Artificial Analysis comparison pages are server-rendered tables, so
 * they can be read directly; arena.ai blocks automated clients, so that source
 * is checked for age only and refreshed by hand.
 *
 * A comparison page carries two models. Where the evaluator has withdrawn the
 * comparison for a retired model, the record points at the model's own page and
 * only the two figures that page still prints are re-read, and said so in the
 * output rather than being passed off as a full re-read.
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
import { matchesLabel, parseComparison, parseModelVariants } from "./lib/aa-table.mjs"

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
const partial = []
const pages = new Map()
const modelPages = new Map()

for (const record of independentRecords) {
  // Comparison pages are the full suite. A model page only ever covers the
  // models whose comparison page the evaluator has withdrawn (retired models
  // still get benchmarked, but no longer take part in comparisons).
  const bucket = record.sourceUrl.includes("/models/comparisons/")
    ? pages
    : /\/models\/[a-z0-9.-]+$/.test(record.sourceUrl)
      ? modelPages
      : null
  if (!bucket) continue
  if (!bucket.has(record.sourceUrl)) bucket.set(record.sourceUrl, [])
  bucket.get(record.sourceUrl).push(record)
}

const toNumber = (text) => {
  const cleaned = (text ?? "").replace(/[,$\s]/g, "").replace(/min$/i, "")
  const value = Number(cleaned)
  return Number.isFinite(value) ? value : null
}

function recordChange(record, key, next, isMeta) {
  if (next === null || next === undefined) return
  const prev = isMeta ? record[key] : record.values[key]
  // Whole-number percentages are the page rounding, not a change.
  if (record.rounded && typeof prev === "number" && Math.round(next) === Math.round(prev)) return
  if (prev !== next) changes.push({ record, key, isMeta, prev: prev ?? null, next })
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
    const index = parsed.columns.findIndex((label) => matchesLabel(label, record.evaluatedAs))
    if (index < 0) {
      unread.push(`${record.modelId}: column "${record.evaluatedAs}" not found (page has: ${parsed.columns.join("; ")})`)
      continue
    }
    for (const [key, cells] of Object.entries(parsed.rows)) {
      recordChange(record, key, cells[index], key === "costPerTask" || key === "minutesPerTask")
    }
  }
}

for (const [url, records] of modelPages) {
  let parsed
  try {
    parsed = parseModelVariants(await fetchPage(url))
  } catch (error) {
    for (const r of records) unread.push(`${r.modelId}: model page not readable (${error.message})`)
    continue
  }
  if (!parsed) {
    // Boards such as /models/speech-to-speech are not per-model pages and were
    // never part of this check; only a benchmark record pointing at a dead
    // model page is worth reporting.
    for (const r of records) {
      if (Object.keys(r.values ?? {}).length > 0) unread.push(`${r.modelId}: no variant table found on ${url}`)
    }
    continue
  }
  for (const record of records) {
    const row = parsed.rows.find((cells) => matchesLabel(cells["Model Name"], record.evaluatedAs))
    if (!row) {
      unread.push(`${record.modelId}: variant "${record.evaluatedAs}" not listed (page has: ${parsed.rows.map((cells) => cells["Model Name"]).join("; ")})`)
      continue
    }
    partial.push(`${record.modelId}: comparison page withdrawn, so only the Intelligence Index and time per task were re-read`)
    recordChange(record, "intelligenceIndex", toNumber(row.Intelligence), false)
    recordChange(record, "minutesPerTask", toNumber(row["Time per Task Minutes"]), true)
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
console.log(`  ${pages.size} pages read, ${modelPages.size} model page(s) checked, ${changes.length} changed value(s), ${unread.length} unread record(s)\n`)
for (const c of changes) {
  console.log(`  ${c.record.modelId}.${c.key}: ${c.prev ?? "(none)"} -> ${c.next}`)
}
if (unread.length) {
  console.log("\nNot refreshed:")
  for (const line of unread) console.log(`  ${line}`)
}
if (partial.length) {
  console.log("\nPartly checked (the evaluator withdrew the comparison page):")
  for (const line of partial) console.log(`  ${line}`)
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
