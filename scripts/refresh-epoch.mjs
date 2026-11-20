/**
 * scripts/refresh-epoch.mjs
 *
 * Re-reads the Epoch Capabilities Index (ECI) from Epoch AI's public data file
 * and regenerates data/epoch-eci.ts, so the second-evaluator agreement check
 * does not quietly go stale. The ECI is a cross-check, never an input to the
 * ModelRegistry Score: it is itself a composite of 50+ benchmarks, and it
 * trails the newest releases, so mixing it into the score would double-count
 * tests and change every published number.
 *
 *   node scripts/refresh-epoch.mjs            report only; exit 1 if the file would change
 *   node scripts/refresh-epoch.mjs --write    rewrite data/epoch-eci.ts
 *
 * A model joins the check only through the explicit map below: the Epoch name
 * and organisation must match the registry record. A name that is missing from
 * the Epoch file is listed and left out, never guessed. To add a model, add one
 * line to MAP and run with --write.
 */
import fs from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"

const require = createRequire(import.meta.url)
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const OUT = path.join(ROOT, "data", "epoch-eci.ts")
const WRITE = process.argv.includes("--write")
const SOURCE_URL = "https://epoch.ai/eci"
const DATA_URL = "https://epoch.ai/data/eci_scores.csv"
const UA = "Mozilla/5.0 (compatible; ModelRegistryRefresh/1.0; +https://modelregistry.tirup.in)"

/** Registry id -> the exact model name in Epoch's file, and the organisation it must carry. */
const MAP = {
  "claude-fable-5-2": ["Claude Fable 5.2", "Anthropic"],
  "claude-opus-5-5": ["Claude Opus 5.5", "Anthropic"],
  "claude-sonnet-5-5": ["Claude Sonnet 5.5", "Anthropic"],
  "claude-haiku-5-5": ["Claude Haiku 5.5", "Anthropic"],
  "gpt-6-2-astra": ["GPT-6.2 Astra", "OpenAI"],
  "gpt-6-1-terra": ["GPT-6.1 Terra", "OpenAI"],
  "gemini-4-carbon": ["Gemini 4 Carbon", "Google DeepMind"],
  "gemini-4-argon": ["Gemini 4 Argon", "Google DeepMind"],
  "gemini-3-8-flash": ["Gemini 3.8 Flash", "Google DeepMind"],
  "kimi-k3-1-pro": ["Kimi K3.1 Pro", "Moonshot"],
  "muse-wonder": ["Muse Wonder", "Meta AI"],
  "muse-spark-open": ["Muse Spark Open", "Meta AI"],
  "grok-4-7": ["Grok 4.7", "xAI"],
  "deepseek-v4-1-flash-1017": ["DeepSeek V4.1 Flash 1017", "DeepSeek"],
  "deepseek-v4-pro-0813": ["DeepSeek V4 Pro 0813", "DeepSeek"],
  "glm-5-3": ["GLM-5.3", "Z.ai (Zhipu AI)"],
  "glm-5-3-flash": ["GLM-5.3-Flash", "Z.ai (Zhipu AI)"],
  "mistral-large-4": ["Mistral Large 4", "Mistral AI"],
  "beam-1": ["Beam 1.0", "Reflection"],
  "nemotron-3-ultra": ["Nemotron 3 Ultra", "Nvidia"],
}

/** Minimal CSV reader: Epoch's file quotes only a few text fields. */
function parseCsv(text) {
  const rows = []
  let row = []
  let field = ""
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"'
        i++
      } else if (c === '"') quoted = false
      else field += c
    } else if (c === '"') quoted = true
    else if (c === ",") {
      row.push(field)
      field = ""
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++
      row.push(field)
      field = ""
      if (row.length > 1 || row[0] !== "") rows.push(row)
      row = []
    } else field += c
  }
  if (field !== "" || row.length) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

const response = await fetch(DATA_URL, { headers: { "user-agent": UA } })
if (!response.ok) {
  console.error(`Could not read ${DATA_URL}: HTTP ${response.status}. Nothing changed.`)
  process.exit(1)
}
const [header, ...body] = parseCsv(await response.text())
const col = Object.fromEntries(header.map((name, index) => [name, index]))
for (const needed of ["Model", "eci", "eci_ci_low", "eci_ci_high", "date", "Organization"]) {
  if (!(needed in col)) {
    console.error(`Epoch's file no longer has a "${needed}" column. Nothing changed.`)
    process.exit(1)
  }
}

const { load } = require("./lib/ts-load")
const { modelsData } = load("data/models.ts")
const known = new Set(modelsData.map((model) => model.id))

const records = []
const missing = []
for (const [id, [epochName, organisation]] of Object.entries(MAP)) {
  if (!known.has(id)) {
    console.error(`MAP names "${id}", which is not a registry record.`)
    process.exit(1)
  }
  const row = body.find((candidate) => candidate[col.Model] === epochName && candidate[col.Organization] === organisation)
  if (!row) {
    missing.push(`${id} (${epochName}, ${organisation})`)
    continue
  }
  const eci = Number(row[col.eci])
  const ciLow = Number(row[col.eci_ci_low])
  const ciHigh = Number(row[col.eci_ci_high])
  if (![eci, ciLow, ciHigh].every(Number.isFinite) || !(ciLow <= eci && eci <= ciHigh)) {
    console.error(`${id}: the interval is not usable (${row[col.eci]} [${row[col.eci_ci_low]}, ${row[col.eci_ci_high]}]).`)
    process.exit(1)
  }
  records.push({ modelId: id, epochName, eci, ciLow, ciHigh, evaluatedAt: row[col.date] })
}

const today = new Date().toISOString().slice(0, 10)
const previous = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : ""
const kept = previous.match(/retrievedAt: "(\d{4}-\d{2}-\d{2})"/)
const render = (retrievedAt) => `/**
 * data/epoch-eci.ts
 * The Epoch Capabilities Index (ECI) for the models the registry can match to
 * Epoch's own file. GENERATED by \`node scripts/refresh-epoch.mjs --write\`; do
 * not edit by hand. Add a model by adding a line to MAP in that script.
 *
 * The ECI is a second evaluator used only to check the ModelRegistry Score. It is
 * never an input to it: the ECI is itself a composite of 50+ benchmarks, so
 * mixing it in would count tests twice and change every published score.
 *
 * Every figure is copied as printed in Epoch's data file. \`evaluatedAt\` is the
 * date Epoch lists for the model, not the date of the registry's record.
 */

export const EPOCH_EVALUATOR = {
  name: "Epoch AI",
  index: "Epoch Capabilities Index",
  url: ${JSON.stringify(SOURCE_URL)},
  dataUrl: ${JSON.stringify(DATA_URL)},
  retrievedAt: ${JSON.stringify(retrievedAt)},
  license: "CC BY 4.0",
  credit: "Epoch AI, 'Epoch Capabilities Index'. Published online at epoch.ai.",
  method:
    "A composite of 50+ benchmarks fitted on one capability scale; each model carries a credible interval. Epoch's method paper was funded by Google DeepMind, and Epoch states the index is an independent Epoch AI product.",
} as const

export interface EpochRecord {
  /** Registry model id. */
  modelId: string
  /** The name exactly as Epoch's file prints it. */
  epochName: string
  eci: number
  ciLow: number
  ciHigh: number
  /** Date Epoch lists for the model. */
  evaluatedAt: string
}

export const epochRecords: EpochRecord[] = ${JSON.stringify(records, null, 2)}
`

// Keep the existing retrieval date unless something changed, so a clean re-read is a no-op.
const sameData = (text) => text.replace(/retrievedAt: "[^"]*"/, "") === render("x").replace(/retrievedAt: "[^"]*"/, "")
const changed = !sameData(previous)
const next = render(changed ? today : kept ? kept[1] : today)

console.log(`${records.length} of ${Object.keys(MAP).length} mapped models read from ${DATA_URL}.`)
if (missing.length) console.log(`Not found in Epoch's file (left out): ${missing.join("; ")}`)
if (!changed) {
  console.log("data/epoch-eci.ts already matches Epoch's file: 0 changed values.")
  process.exit(0)
}
if (WRITE) {
  fs.writeFileSync(OUT, next)
  console.log(`Wrote ${path.relative(ROOT, OUT)}.`)
  process.exit(0)
}
console.error("data/epoch-eci.ts is out of date with Epoch's file. Run: node scripts/refresh-epoch.mjs --write")
process.exit(1)
