/**
 * scripts/test-completeness.js
 * Completeness gate for model records. A record that is added or changed must
 * be fully described: every core field present and cited, and (for text
 * models) our own score backed by an independent result with every test,
 * the cost per task and the time per task filled in. An unknown is written
 * as an explicit "Undisclosed", never left blank.
 *
 * Records released after BASELINE_CUTOFF can never carry a gap. Older records
 * may carry the gaps listed in scripts/completeness-baseline.json, which is a
 * backlog that only shrinks: fixing a gap while leaving it in the baseline also
 * fails, so the list stays honest.
 *
 *   node scripts/test-completeness.js              run the gate
 *   node scripts/test-completeness.js --baseline   print the current gaps as baseline JSON
 *
 * Offline: reads data/models.ts and data/independent-benchmarks.ts only.
 */
const fs = require("fs")
const path = require("path")
const vm = require("vm")
const ts = require("typescript")

const ROOT = path.resolve(__dirname, "..")
const BASELINE_PATH = path.join(__dirname, "completeness-baseline.json")
// Records released after this date are held to the full standard with no exceptions.
const BASELINE_CUTOFF = "2026-11-17"

const TEXT_TESTS = [
  "intelligenceIndex",
  "aaBriefcase",
  "automationBench",
  "terminalBench4",
  "frontierCode",
  "omniscience",
  "gdpPdf",
  "hleDiamond",
  "critPt",
  "terminalBenchScience",
]
const REQUIRED_TEXT = ["name", "version", "releaseDate", "contextWindow", "maxOutputTokens", "parameters", "license", "highlight", "categoryLabel", "statusBadge"]
const ALWAYS_CITED = ["releaseDate", "license", "pricing", "modalities"]
const NON_TEXT = new Set(["audio", "image", "video"])

function load(rel) {
  const src = fs.readFileSync(path.join(ROOT, rel), "utf8")
  const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText
  const mod = { exports: {} }
  vm.runInNewContext(out, { module: mod, exports: mod.exports, require: (name) => { throw new Error(`data file imports ${name}; the completeness gate reads data only`) }, console })
  return mod.exports
}

const blank = (value) => value === undefined || value === null || /^\s*$/.test(String(value)) || /^(n\/a|tbd|unknown|-|none)$/i.test(String(value).trim())
const undisclosed = (value) => /^undisclosed/i.test(String(value ?? "").trim())
const hasUrl = (ref) => typeof ref?.url === "string" && /^https:\/\//.test(ref.url)

/** The gaps a record has today, as short stable codes. */
function gapsFor(model, independent) {
  const gaps = []
  const textModel = !model.pricingUnit && !NON_TEXT.has(model.category)

  for (const field of REQUIRED_TEXT) if (blank(model[field])) gaps.push(`empty:${field}`)
  if (!model.links?.announcement) gaps.push("no-announcement-link")

  // Token limits: a text model states them, or says "Undisclosed" in words.
  if (textModel && !(model.contextWindowTokens > 0) && !undisclosed(model.contextWindow)) gaps.push("context-tokens")

  const cited = (field) => (model.fieldSources?.[field] ?? []).some(hasUrl)
  for (const field of ALWAYS_CITED) if (!cited(field)) gaps.push(`uncited:${field}`)
  if (textModel) {
    if (!undisclosed(model.contextWindow) && !cited("contextWindow")) gaps.push("uncited:contextWindow")
    if (!undisclosed(model.maxOutputTokens) && !cited("maxOutputTokens")) gaps.push("uncited:maxOutputTokens")
  }
  if (!undisclosed(model.parameters) && !cited("parameters")) gaps.push("uncited:parameters")

  // Measurement: some published reading, and for text models our own score.
  const labBenchmarks = Object.values(model.benchmarks ?? {}).filter((value) => !blank(value))
  const row = independent.find((record) => record.modelId === model.id)
  if (!row && labBenchmarks.length === 0) gaps.push("no-measurement")
  if (textModel && !row) gaps.push("no-independent-result")
  if (textModel && row) {
    const missing = TEXT_TESTS.filter((key) => typeof row.values?.[key] !== "number")
    if (typeof row.costPerTask !== "number") missing.push("costPerTask")
    if (typeof row.minutesPerTask !== "number") missing.push("minutesPerTask")
    if (missing.length) gaps.push("independent-incomplete")
    if (blank(row.evaluatedAs) || !/^https:\/\//.test(row.sourceUrl ?? "")) gaps.push("independent-unsourced")
  }
  return gaps
}

const { modelsData } = load("data/models.ts")
const { independentRecords } = load("data/independent-benchmarks.ts")
const current = modelsData.filter((model) => !model.supersededBy && model.verificationStatus !== "retired")
const found = Object.fromEntries(current.map((model) => [model.id, gapsFor(model, independentRecords)]).filter(([, gaps]) => gaps.length > 0))

if (process.argv.includes("--baseline")) {
  const baseline = Object.fromEntries(
    current
      .filter((model) => found[model.id] && model.releaseDate <= BASELINE_CUTOFF)
      .map((model) => [model.id, found[model.id]]),
  )
  console.log(JSON.stringify(baseline, null, 2))
  process.exit(0)
}

let failures = 0
function check(name, ok, detail) {
  if (ok) console.log(`  ✓ ${name}`)
  else {
    failures += 1
    console.error(`  ✗ ${name}${detail ? ` - ${detail}` : ""}`)
  }
}

const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, "utf8"))
const byId = new Map(modelsData.map((model) => [model.id, model]))

// 1. Nothing new: every gap on a record is already on the backlog.
const fresh = []
for (const [id, gaps] of Object.entries(found)) {
  const allowed = new Set(baseline[id] ?? [])
  for (const gap of gaps) if (!allowed.has(gap)) fresh.push(`${id}: ${gap}`)
}
check(
  "every current record is complete (no gap beyond the known backlog)",
  fresh.length === 0,
  `${fresh.length} gap(s): ${fresh.slice(0, 8).join("; ")}. Fill the field, cite it, or write "Undisclosed"; do not add it to the baseline.`,
)

// 2. The backlog only holds older records, and only gaps that still exist.
const lateEntries = Object.keys(baseline).filter((id) => !byId.has(id) || byId.get(id).releaseDate > BASELINE_CUTOFF)
check("the backlog holds no record released after the cutoff", lateEntries.length === 0, lateEntries.join(", "))

const stale = []
for (const [id, gaps] of Object.entries(baseline)) {
  const now = new Set(found[id] ?? [])
  for (const gap of gaps) if (!now.has(gap)) stale.push(`${id}: ${gap}`)
}
check("the backlog lists only gaps that still exist", stale.length === 0, `${stale.length} fixed: ${stale.slice(0, 8).join("; ")}. Remove them from scripts/completeness-baseline.json.`)

// 3. The two records that opened the standard stay complete.
for (const id of ["gpt-6-2-sol", "gpt-6-2-astra"]) {
  check(`${id} is complete`, byId.has(id) && !(found[id] ?? []).length, (found[id] ?? ["missing record"]).join(", "))
}

const backlog = Object.values(baseline).reduce((total, gaps) => total + gaps.length, 0)
console.log(`\n  Known backlog: ${Object.keys(baseline).length} older record(s) with ${backlog} gap(s) in scripts/completeness-baseline.json. Fix them and remove the entries.`)

if (failures > 0) {
  console.error(`\n❌ test-completeness failed with ${failures} failure(s).`)
  process.exit(1)
}
console.log("\n✔ test-completeness: every new record is complete.")
