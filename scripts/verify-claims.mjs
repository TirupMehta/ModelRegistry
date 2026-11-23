// Checks the numeric claims in each record's highlight and benchmarks against the
// live text of its cited sources.
// Usage: node scripts/verify-claims.mjs [modelId ...]
// A number found on a cited page is confirmed. A number not found proves nothing on
// its own (charts, scripted pages, bot walls), so it is listed for a human to check,
// never treated as wrong. Writes nothing; prints a report.
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
const ids = process.argv.slice(2).filter((a) => !a.startsWith("--"))
const models = ids.length ? modelsData.filter((m) => ids.includes(m.id)) : modelsData

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
      if (!res.ok) return ""
      return (await res.text())
        .replace(/<script[\s\S]*?<\/script[^>]*>/gi, " ")
        .replace(/<style[\s\S]*?<\/style[^>]*>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;|&#160;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/\s+/g, " ")
    } catch {
      return ""
    }
  })()
  cache.set(url, p)
  return p
}

// Numbers worth checking: percentages and decimals, and plain numbers of three or more
// digits that are not dates or prices (those have their own checker).
function claims(model) {
  const text = [model.highlight, ...Object.values(model.benchmarks ?? {})].join(" ")
  const out = new Set()
  for (const m of text.matchAll(/(?<![\d.$])(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)\s?%?/g)) {
    const raw = m[0].trim()
    const n = m[1]
    if (/^(19|20)\d\d$/.test(n)) continue
    if (!raw.endsWith("%") && !n.includes(".") && n.replace(/,/g, "").length < 3) continue
    out.add(n)
  }
  return [...out]
}

let totalMissing = 0
for (const m of models) {
  const urls = [...new Set([...(m.sources ?? []).map((s) => s.url), ...Object.values(m.fieldSources ?? {}).flatMap((r) => (r ?? []).map((s) => s.url))])]
  const texts = await Promise.all(urls.map(pageText))
  const readable = texts.filter(Boolean).length
  const hay = texts.join(" ")
  const missing = claims(m).filter((n) => !hay.includes(n))
  totalMissing += missing.length
  console.log(`${m.id.padEnd(34)} pages ${readable}/${urls.length}  ${missing.length ? "not found: " + missing.join(", ") : "all numeric claims found"}`)
}
console.log(`\n${models.length} checked; ${totalMissing} number(s) not found on a readable cited page (review by hand).`)
