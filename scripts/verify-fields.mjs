// Checks each record's key fields against the live text of its cited sources.
// Usage: node scripts/verify-fields.mjs [--stale] [--write] [modelId ...]
// --write regenerates data/field-checks.ts (only with a full run, no model ids).
// Writes .intake/field-check.json (gitignored). Finding a value on a cited page
// confirms it. Not finding it proves nothing (JS pages, bot walls), so those
// fields are reported as "not found", never as wrong.
import fs from "node:fs"
import path from "node:path"
import vm from "node:vm"
import { createRequire } from "node:module"

const require = createRequire(import.meta.url)
const ts = require("typescript")
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..")

function load(rel) {
  const src = fs.readFileSync(path.join(root, rel), "utf8")
  const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const mod = { exports: {} }
  vm.runInContext(out, vm.createContext({ module: mod, exports: mod.exports, require, console }))
  return mod.exports
}
const { modelsData } = load("data/models.ts")

const args = process.argv.slice(2)
const onlyStale = args.includes("--stale")
const ids = args.filter((a) => !a.startsWith("--"))
let models = modelsData
if (ids.length) models = models.filter((m) => ids.includes(m.id))
if (onlyStale) models = models.filter((m) => m.lastVerifiedAt <= "2026-10-27")

const UA = "Mozilla/5.0 (compatible; ModelRegistry-Verify/1.0; +https://modelregistry.tirup.in/methodology)"
const cache = new Map()
async function pageText(url) {
  if (cache.has(url)) return cache.get(url)
  const p = (async () => {
    try {
      const ctl = new AbortController()
      const t = setTimeout(() => ctl.abort(), 20000)
      const res = await fetch(url, { headers: { "user-agent": UA, accept: "text/html,*/*" }, signal: ctl.signal, redirect: "follow" })
      clearTimeout(t)
      if (!res.ok) return { status: res.status, text: "" }
      const html = await res.text()
      const text = html
        .replace(/<script[\s\S]*?<\/script[^>]*>/gi, " ")
        .replace(/<style[\s\S]*?<\/style[^>]*>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;|&#160;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/\s+/g, " ")
      return { status: res.status, text }
    } catch {
      return { status: 0, text: "" }
    }
  })()
  cache.set(url, p)
  return p
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
function dateHit(text, iso) {
  const [y, m, d] = iso.split("-").map(Number)
  const mn = MONTHS[m - 1]
  const forms = [iso, `${mn} ${d}`, `${mn.slice(0, 3)} ${d}`, `${mn.slice(0, 3)}. ${d}`, `${d} ${mn}`, `${d} ${mn.slice(0, 3)}`, `${m}/${d}/${y}`]
  if (m === 9) forms.push(`Sept ${d}`)
  const low = text.toLowerCase()
  return forms.some((f) => new RegExp(`(^|[^0-9])${f.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![0-9])`).test(low))
}
function priceHit(text, n) {
  const s = String(n).replace(".", "\\.")
  return new RegExp(`\\$\\s?${s}(\\.0+)?(?![0-9])`).test(text) || (n < 1 && new RegExp(`\\$\\s?0?\\.${String(n).split(".")[1] || ""}(?![0-9])`).test(text))
}
function ctxHit(text, tokens) {
  if (!tokens) return null
  const forms = new Set([tokens.toLocaleString("en-US")])
  if (tokens >= 1_000_000) {
    const mm = tokens / 1_000_000
    forms.add(`${mm}M`); forms.add(`${mm} million`); forms.add(`${mm}m`)
  } else {
    const k = Math.round(tokens / 1000)
    forms.add(`${k}K`); forms.add(`${k}k`); forms.add(`${tokens / 1000}K`)
  }
  return [...forms].some((f) => new RegExp(`(^|[^0-9.,])${f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![0-9])`, "i").test(text))
}

const results = []
const queue = [...models]
async function worker() {
  while (queue.length) {
    const m = queue.shift()
    const fsUrls = Object.values(m.fieldSources || {}).flat().map((s) => s.url)
    const urls = [...new Set((m.sources || []).map((s) => s.url).concat(fsUrls).concat(Object.values(m.links || {}).filter((u) => typeof u === "string" && /^https?:/.test(u) && !/playground|chat\.|claude\.ai$/.test(u))))]
    const pages = await Promise.all(urls.map(async (u) => ({ url: u, ...(await pageText(u)) })))
    const ok = pages.filter((p) => p.text)
    const find = (fn) => ok.find((p) => fn(p.text))?.url || null
    const nameLast = m.name.toLowerCase()
    const price = m.pricing && (m.pricing.input || m.pricing.output)
      ? { in: find((t) => priceHit(t, m.pricing.input)), out: find((t) => priceHit(t, m.pricing.output)) }
      : null
    const rec = {
      id: m.id,
      reachable: `${ok.length}/${pages.length}`,
      name: find((t) => t.toLowerCase().includes(nameLast)),
      releaseDate: find((t) => dateHit(t, m.releaseDate)),
      context: m.contextWindowTokens ? find((t) => ctxHit(t, m.contextWindowTokens)) : "n/a",
      price: price ? (price.in && price.out ? price.in : null) : "n/a",
      verified: m.lastVerifiedAt,
    }
    results.push(rec)
    process.stderr.write(`${m.id.padEnd(34)} pages ${rec.reachable}  name:${rec.name ? "Y" : "-"} date:${rec.releaseDate ? "Y" : "-"} ctx:${rec.context === "n/a" ? "n/a" : rec.context ? "Y" : "-"} price:${rec.price === "n/a" ? "n/a" : rec.price ? "Y" : "-"}\n`)
  }
}
await Promise.all(Array.from({ length: 6 }, worker))
fs.mkdirSync(path.join(root, ".intake"), { recursive: true })
fs.writeFileSync(path.join(root, ".intake", "field-check.json"), JSON.stringify(results, null, 2))
if (args.includes("--write") && !ids.length) {
  const today = new Date().toISOString().slice(0, 10)
  const rows = results
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((r) => {
      const c = {}
      if (r.name) c.name = r.name
      if (r.releaseDate) c.releaseDate = r.releaseDate
      if (r.context && r.context !== "n/a") c.contextWindow = r.context
      if (r.price && r.price !== "n/a") c.pricing = r.price
      return `  ${JSON.stringify(r.id)}: ${JSON.stringify(c)},`
    })
  const out = `/**
 * data/field-checks.ts - GENERATED by scripts/verify-fields.mjs --write.
 * For each record: the cited page where a field's value was found in the page
 * text on checkedAt. A field that is absent was not found on any cited page,
 * which is not the same as wrong (some pages are scripted or gated).
 */
export const fieldChecksAt = ${JSON.stringify(today)}

export type CheckedField = "name" | "releaseDate" | "contextWindow" | "pricing"

export const fieldChecks: Record<string, Partial<Record<CheckedField, string>>> = {
${rows.join(String.fromCharCode(10))}
}
`
  fs.writeFileSync(path.join(root, "data", "field-checks.ts"), out)
  console.log("wrote data/field-checks.ts")
}
const full = results.filter((r) => r.name && r.releaseDate && r.context && r.price)
console.log(`\n${results.length} checked; ${full.length} have name, release date, context and price all found on a cited page.`)
