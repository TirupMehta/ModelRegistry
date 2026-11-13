/**
 * scripts/intake.mjs <facts.json> [--base <git-ref>]
 *
 * Adds one model the way a model is added today, without the hand work:
 *   1. every quoted sentence is looked up on the live page, and the numbers
 *      and date inside the value are checked against it;
 *   2. a full record is written in the exact ModelItem format of data/models.ts,
 *      with a source list and a per-field citation for each verified fact;
 *   3. the lab's role handover is applied (the previous newest release loses the
 *      latest-checkpoint flag and gets a dated change-log entry);
 *   4. the independent evaluator's row is read and written as a record snippet;
 *   5. a real unified diff of data/models.ts is produced.
 *
 * Output goes to .intake/<id>/. Nothing in the repository is edited: a person
 * reads the diff and applies it. --base builds the diff against an older commit,
 * so the script can be tested by re-adding a model that already exists.
 */
import fs from "node:fs"
import path from "node:path"
import { execFileSync } from "node:child_process"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import { norm as nameNorm, parseComparison } from "./lib/aa-table.mjs"

const require = createRequire(import.meta.url)
const ts = require("typescript")
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const UA = "Mozilla/5.0 (compatible; ModelRegistryIntake/1.0; +https://modelregistry.tirup.in)"
const today = new Date().toISOString().slice(0, 10)

const args = process.argv.slice(2)
const factsPath = args.find((a) => !a.startsWith("--") && a !== args[args.indexOf("--base") + 1])
const baseRef = args.includes("--base") ? args[args.indexOf("--base") + 1] : null
if (!factsPath) {
  console.error("usage: node scripts/intake.mjs <facts.json> [--base <git-ref>]")
  process.exit(2)
}
const spec = JSON.parse(fs.readFileSync(path.resolve(factsPath), "utf8"))
const m = spec.maintainer

// ---------------------------------------------------------------- helpers
const normText = (s) =>
  s.replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim()
const toText = (html) =>
  normText(html.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " "))

function evalTs(text) {
  const out = ts.transpileModule(text, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText
  const mod = { exports: {} }
  new Function("module", "exports", "require", out)(mod, mod.exports, require)
  return mod.exports
}

const IDENT = /^[A-Za-z_$][\w$]*$/
const isPrimitive = (v) => v === null || ["string", "number", "boolean"].includes(typeof v)
/** Serialises in the style data/models.ts is written in: 2 spaces, unquoted keys, trailing commas. */
function ser(value, ind, key) {
  const pad = " ".repeat(ind)
  if (typeof value === "string") return JSON.stringify(value)
  if (isPrimitive(value)) return String(value)
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]"
    if (value.every(isPrimitive) && value.map((v) => ser(v, 0)).join(", ").length < 90) return `[${value.map((v) => ser(v, 0)).join(", ")}]`
    return `[\n${value.map((v) => `${pad}  ${ser(v, ind + 2)},\n`).join("")}${pad}]`
  }
  const entries = Object.entries(value).filter(([, v]) => v !== undefined)
  if (key === "pricing") return `{ ${entries.map(([k, v]) => `${k}: ${ser(v, 0)}`).join(", ")} }`
  return `{\n${entries.map(([k, v]) => `${pad}  ${IDENT.test(k) ? k : JSON.stringify(k)}: ${ser(v, ind + 2, k)},\n`).join("")}${pad}}`
}

// ---------------------------------------------------------------- 1. verify
const pages = {}
for (const [key, src] of Object.entries(spec.sources)) {
  try {
    const res = await fetch(src.url, { headers: { "user-agent": UA }, redirect: "follow" })
    const html = res.ok ? await res.text() : ""
    pages[key] = { ok: res.ok, status: res.status, html, text: toText(html) }
  } catch {
    pages[key] = { ok: false, status: 0, html: "", text: "" }
  }
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
function check(ev, date) {
  const page = pages[ev.source]
  if (!page?.ok) return { status: "page-unreadable", detail: `HTTP ${page?.status ?? 0}` }
  const quote = normText(ev.quote)
  const from = ev.anchor ? page.text.indexOf(ev.anchor) : 0
  if (from < 0) return { status: "quote-missing", detail: `Anchor "${ev.anchor}" not on the page.` }
  if (page.text.indexOf(quote, from) < 0) return { status: "quote-missing", detail: "Sentence is not on the page." }
  const absent = (ev.mustContain ?? []).filter((t) => !quote.includes(t))
  if (absent.length) return { status: "value-mismatch", detail: `Quote lacks: ${absent.join(", ")}` }
  if (date) {
    const d = quote.match(/(\d{1,2}) ([A-Za-z]+) (\d{4})/)
    const iso = d ? `${d[3]}-${String(MONTHS.indexOf(d[2]) + 1).padStart(2, "0")}-${d[1].padStart(2, "0")}` : null
    if (iso !== date) return { status: "value-mismatch", detail: `Quote says ${iso}, value says ${date}` }
  }
  return { status: "found", detail: "Sentence found on the live page." }
}

const checks = []
const verified = {}
for (const [field, f] of Object.entries(spec.fields)) {
  verified[field] = []
  for (const ev of f.evidence) {
    const result = check(ev, f.date)
    checks.push({ field, source: ev.source, quote: ev.quote, ...result })
    if (result.status === "found") verified[field].push(ev)
  }
}
for (const ev of spec.changeLog.evidence) checks.push({ field: "changeLog", source: ev.source, quote: ev.quote, ...check(ev) })

// ---------------------------------------------------------------- 2. record
const baseText = (baseRef ? execFileSync("git", ["show", `${baseRef}:data/models.ts`], { cwd: ROOT, maxBuffer: 64 << 20 }).toString("utf8") : fs.readFileSync(path.join(ROOT, "data", "models.ts"), "utf8"))
const crlf = baseText.includes("\r\n")
const base = baseText.replace(/\r\n/g, "\n")
const { modelsData } = evalTs(base)
const labModels = modelsData.filter((x) => x.companyId === spec.lab.companyId && x.id !== m.id)
const previousLatest = labModels.filter((x) => x.isLatestCheckpoint)

const ref = (key, ev) => {
  const s = spec.sources[key]
  return { url: s.url, publisher: s.publisher, title: ev?.title ?? s.title, publishedAt: s.publishedAt, accessedAt: today, sourceType: s.sourceType, live: pages[key].ok, note: ev?.note }
}
const fieldSources = {}
for (const field of Object.keys(spec.fields)) {
  if (verified[field].length) fieldSources[field] = verified[field].map((ev) => ref(ev.source, ev))
}
const cited = [...new Set(Object.values(verified).flat().map((ev) => ev.source))]
const get = (field, fallback) => spec.fields[field]?.value ?? fallback
const price = get("pricing", { input: 0, output: 0 })
const money = (n) => (Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`)
const releaseDate = get("releaseDate")
const isLatestCheckpoint = labModels.every((x) => x.releaseDate < releaseDate)
const everyFieldSourced = Object.keys(spec.fields).every((f) => verified[f].length === spec.fields[f].evidence.length)

const highlight = `Released ${new Date(`${releaseDate}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })} by ${spec.lab.companyName}; ${get("contextWindow")} of context, ${money(price.input)} in and ${money(price.output)} out per 1M tokens, ${get("parameters").toLowerCase()}.`
const links = Object.fromEntries(Object.entries(m.links).map(([k, v]) => [k, spec.sources[v]?.url ?? v]))
const changeLogSources = [...new Set(spec.changeLog.evidence.map((e) => spec.sources[e.source].url))]

const candidate = {
  id: m.id,
  companyId: spec.lab.companyId,
  companyName: spec.lab.companyName,
  name: m.name,
  version: m.version,
  releaseDate,
  isCompanyFlagship: spec.fields.isCompanyFlagship.value,
  isLatestCheckpoint,
  statusBadge: m.statusBadge,
  category: m.category,
  categoryLabel: m.categoryLabel,
  contextWindow: get("contextWindow"),
  contextWindowTokens: spec.fields.contextWindow.tokens,
  maxOutputTokens: get("maxOutputTokens"),
  parameters: get("parameters"),
  openWeights: m.openWeights,
  license: get("license"),
  pricing: price,
  highlight,
  modalities: [...get("modalities"), ...(m.extraModalities ?? [])],
  benchmarks: get("benchmarks", {}),
  links,
  sources: cited.map((k) => ref(k)),
  fieldSources,
  lastVerifiedAt: today,
  verificationStatus: everyFieldSourced ? "verified" : "partially_verified",
  changeLog: [{ date: releaseDate, summary: spec.changeLog.summary, sources: changeLogSources }],
}

// ---------------------------------------------------------------- 3. patch data/models.ts
const blockBounds = (text, id) => {
  const at = text.indexOf(`    id: "${id}",`)
  if (at < 0) throw new Error(`model ${id} not found`)
  return [text.lastIndexOf("\n  {\n", at) + 1, text.indexOf("\n  },\n", at) + 6]
}
let after = base
const handover = []
for (const prev of previousLatest) {
  if (!isLatestCheckpoint) break
  let [s, e] = blockBounds(after, prev.id)
  let block = after.slice(s, e)
  block = block.replace("isLatestCheckpoint: true,", "isLatestCheckpoint: false,")
  const entry = fieldSources.isLatestCheckpoint?.[0]
  if (entry) {
    const note = `Recorded so the handover of the latest-checkpoint flag is dated; ${prev.name} is no longer the newest release as of ${releaseDate}.`
    const item = `      ${ser({ ...entry, note }, 6)},\n`
    block = block.replace(/(\n      isLatestCheckpoint: \[\n)[\s\S]*?(\n      \],\n)/, (_, a, b) => `${a}${item.replace(/\n$/, "")}${b}`)
  }
  const log = {
    date: releaseDate,
    summary: `No longer the lab's newest release: ${m.name} shipped and takes the latest-checkpoint flag. ${prev.isCompanyFlagship ? `${prev.name} keeps the flagship role.` : ""}`.trim(),
    sources: [spec.sources.blog?.url ?? changeLogSources[0]],
  }
  block = block.replace(/\n    \],\n  \},\n$/, `\n      ${ser(log, 6)},\n    ],\n  },\n`)
  after = after.slice(0, s) + block + after.slice(e)
  handover.push(prev.name)
}
const lastLab = labModels.map((x) => ({ id: x.id, at: after.indexOf(`    id: "${x.id}",`) })).sort((a, b) => b.at - a.at)[0]
const [, lastEnd] = blockBounds(after, lastLab.id)
const header = `  // ─── ${spec.lab.groupComment} `.padEnd(78, "─")
after = `${after.slice(0, lastEnd)}\n${header}\n  ${ser(candidate, 2)},\n${after.slice(lastEnd)}`

// ---------------------------------------------------------------- 4. independent row
let independentSnippet = null
if (spec.independent) {
  const page = pages[spec.independent.source]
  const parsed = page.ok ? parseComparison(page.html) : null
  const col = parsed?.columns.findIndex((c) => nameNorm(c).includes(nameNorm(spec.independent.column))) ?? -1
  if (parsed && col >= 0) {
    const values = {}
    let cost, minutes
    for (const [k, cells] of Object.entries(parsed.rows)) {
      const v = cells[col]
      if (v == null) continue
      if (k === "costPerTask") cost = v
      else if (k === "minutesPerTask") minutes = v
      else values[k] = v
    }
    independentSnippet = `  {\n    modelId: ${JSON.stringify(m.id)},\n    evaluatedAs: ${JSON.stringify(spec.independent.column)},\n    sourceUrl: ${JSON.stringify(spec.sources[spec.independent.source].url)},\n    retrievedAt: "${today}",\n    values: { ${Object.entries(values).map(([k, v]) => `${k}: ${v}`).join(", ")} },\n    costPerTask: ${cost},\n    minutesPerTask: ${minutes},\n  },\n`
  }
}

// ---------------------------------------------------------------- 5. write
const out = path.join(ROOT, ".intake", m.id)
fs.mkdirSync(out, { recursive: true })
const eol = (s) => (crlf ? s.replace(/\n/g, "\r\n") : s)
fs.writeFileSync(path.join(out, "models.before.ts"), eol(base))
fs.writeFileSync(path.join(out, "models.after.ts"), eol(after))
let diff = ""
try {
  diff = execFileSync("git", ["diff", "--no-index", "--no-color", "--ignore-cr-at-eol", "models.before.ts", "models.after.ts"], { cwd: out, maxBuffer: 64 << 20 }).toString("utf8")
} catch (e) {
  diff = e.stdout?.toString("utf8") ?? ""
}
fs.writeFileSync(path.join(out, "models.patch.diff"), diff)
if (independentSnippet) fs.writeFileSync(path.join(out, "independent.snippet.ts"), independentSnippet)

const patched = evalTs(after).modelsData.find((x) => x.id === m.id)
fs.writeFileSync(path.join(out, "candidate.json"), JSON.stringify(patched, null, 2))

let againstRegistry = null
if (!baseRef) {
  const live = evalTs(fs.readFileSync(path.join(ROOT, "data", "models.ts"), "utf8")).modelsData.find((x) => x.id === m.id)
  if (live) againstRegistry = Object.keys(candidate).filter((k) => JSON.stringify(live[k]) !== JSON.stringify(patched[k]))
}
const report = {
  id: m.id,
  ranAt: new Date().toISOString(),
  base: baseRef ?? "working tree",
  checks,
  maintainerDecided: ["id", "name", "version", "category", "categoryLabel", "statusBadge", "isCompanyFlagship", "openWeights", "extraModalities", "links"],
  handover,
  independent: Boolean(independentSnippet),
  nextSteps: ["node scripts/sync-readme.js", "node scripts/write-revision.js", "pnpm test"],
  diffLines: diff.split("\n").length,
  differsFromRegistry: againstRegistry,
}
fs.writeFileSync(path.join(out, "report.json"), JSON.stringify(report, null, 2))

const bad = checks.filter((c) => c.status !== "found")
console.log(`Intake: ${m.name}  (base: ${report.base})`)
console.log(`  ${checks.length - bad.length}/${checks.length} quoted sentences found on the live pages`)
for (const c of bad) console.log(`  FLAG ${c.field}: ${c.status} - ${c.detail}`)
console.log(`  status: ${candidate.verificationStatus}; handover: ${handover.join(", ") || "none"}; independent row: ${independentSnippet ? "read" : "not read"}`)
console.log(`  data/models.ts diff: ${report.diffLines} lines -> .intake/${m.id}/models.patch.diff`)
if (againstRegistry) console.log(`  fields differing from the record already in the registry: ${againstRegistry.join(", ") || "none"}`)
console.log("  repository untouched. After applying: " + report.nextSteps.join(" && "))
