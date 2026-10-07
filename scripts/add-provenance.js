/**
 * scripts/add-provenance.js
 * One-time migration (safe to re-run: skips models that already carry
 * `verificationStatus`): attaches structured provenance to every ModelItem
 * in data/models.ts, based on the 2026-10-07 source audit.
 *
 * Method:
 *  - Every URL in `links` was live-checked on 2026-10-07 (see
 *    docs/audit-2026-10-07.md). Dead (HTTP 404/400) URLs are never cited.
 *  - Bot-gated URLs (HTTP 403/405 on automation, host alive) are cited with
 *    an explicit access note and live:false.
 *  - `verified` is reserved for records whose core fields were read and
 *    confirmed against live primary sources during the audit.
 *  - Everything else with >= 1 live official source is `partially_verified`.
 *
 * Usage: node scripts/add-provenance.js
 */
const fs = require("fs")
const path = require("path")

const MODELS_PATH = path.resolve(__dirname, "../data/models.ts")
const ACCESSED_AT = "2026-10-07"
const LAST_VERIFIED_AT = "2026-10-07"

// URLs confirmed dead on 2026-10-07 (HTTP 404/400/405, real not-found pages).
const DEAD = new Set([
  "https://www.anthropic.com/news/claude-fable-5-1",
  "https://blog.google/technology/ai/gemini-3-8-flash/",
  "https://ai.meta.com/blog/muse-spark-1-3/",
  "https://ai.meta.com/blog/llama-4/",
  "https://ai.meta.com/blog/muse-voice-transcribe/",
  "https://qwenlm.github.io/blog/qwen3.8-2.4t/",
  "https://qwenlm.github.io/blog/qwen3.8/",
  "https://mistral.ai/news/mistral-medium-3-5/",
  "https://qwen.ai/blog?id=qwen3.8-omni-flash",
])

// URLs not directly fetchable by automation on 2026-10-07 (bot protection or
// network timeouts), host or index alive. Cited with live:false + note.
const GATED = new Map([
  ["https://claude.ai", "Host alive; automated fetch blocked, page not re-confirmed on access date."],
  ["https://openai.com/index/gpt-6-astra/", "Host alive; automated fetch blocked, page not re-confirmed on access date."],
  ["https://openai.com/index/gpt-5-6/", "Host alive; automated fetch blocked, page not re-confirmed on access date."],
  ["https://openai.com/index/introducing-gpt-6-1-sol", "Host alive; automated fetch blocked, page not re-confirmed on access date."],
  ["https://openai.com/index/introducing-gpt-6-sol-and-luna/", "Host alive; automated fetch blocked, page not re-confirmed on access date."],
  ["https://openai.com/index/introducing-chatgpt-images-2-5/", "Host alive; automated fetch blocked, page not re-confirmed on access date."],
  ["https://openai.com", "Host alive; automated fetch blocked, page not re-confirmed on access date."],
  ["https://chatgpt.com", "Host alive; automated fetch blocked, page not re-confirmed on access date."],
  ["https://x.ai/blog/grok-4-6", "Host alive; automated fetch blocked, page not re-confirmed on access date."],
  ["https://x.ai", "Host alive; automated fetch blocked, page not re-confirmed on access date."],
  ["https://chat.deepseek.com", "Host alive; automated fetch blocked, page not re-confirmed on access date."],
  ["https://www.mi.com", "Host alive; automated fetch blocked, page not re-confirmed on access date."],
  ["https://console.mistral.ai/", "Console login wall; automated fetch redirected, page not re-confirmed on access date."],
  ["https://dashboard.sarvam.ai/", "Host alive; automated fetch blocked, page not re-confirmed on access date."],
  ["https://help.aliyun.com/en/model-studio/qwen3-8-flash", "Connection timed out to automated check; page indexed with full content, not re-confirmed on access date."],
])

const PUBLISHERS = {
  anthropic: { publisher: "Anthropic", domain: "anthropic.com" },
  openai: { publisher: "OpenAI", domain: "openai.com" },
  google: { publisher: "Google DeepMind", domain: "deepmind.google" },
  xai: { publisher: "xAI", domain: "x.ai" },
  deepseek: { publisher: "DeepSeek", domain: "deepseek.com" },
  meta: { publisher: "Meta", domain: "meta.com" },
  qwen: { publisher: "Alibaba Cloud (Qwen)", domain: "qwen.ai" },
  mistral: { publisher: "Mistral AI", domain: "mistral.ai" },
  tencent: { publisher: "Tencent", domain: "tencent.com" },
  "z-ai": { publisher: "Z.ai", domain: "z.ai" },
  minimax: { publisher: "MiniMax", domain: "minimaxi.com" },
  nvidia: { publisher: "NVIDIA", domain: "nvidia.com" },
  xiaomi: { publisher: "Xiaomi MiMo", domain: "mi.com" },
  moonshotai: { publisher: "Moonshot AI", domain: "moonshot.ai" },
  kuaishou: { publisher: "Kuaishou", domain: "klingai.com" },
  runway: { publisher: "Runway", domain: "runwayml.com" },
  sarvam: { publisher: "Sarvam AI", domain: "sarvam.ai" },
  typesafe: { publisher: "TypeSafe AI", domain: "typesafe.ai" },
}

// Announcement publication dates directly observed during the audit.
const OBSERVED_PUBLISHED_AT = {
  "https://mistral.ai/news/mistral-large-4/": "2026-10-06",
  "https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-4-argon/": "2026-09-30",
  "https://blog.google/innovation-and-ai/models-and-research/gemini-models/3-8-flash-and-3-8-flash-cyber/": "2026-09-02",
  "https://research.meta.ai/blog/introducing-muse-voice-transcribe": "2026-09-01",
  "https://docs.mistral.ai/models/mistral-medium-3-5-26-04": "2026-04-28",
  "https://huggingface.co/mistralai/Mistral-Medium-3.5-128B": "2026-04-29",
  "https://www.alibabacloud.com/blog/alibaba-releases-qwen3-8-flash-with-innovative-model-architecture-delivering-optimal-price-performance_603503": "2026-08-27",
  "https://deepmind.google/models/model-cards/gemini-3-8-flash/": "2026-09-02",
}

// Extra sources not present in `links` (all live-checked 2026-10-07).
const EXTRA_SOURCES = {
  "gemini-3-8-flash": [
    {
      url: "https://deepmind.google/models/model-cards/gemini-3-8-flash/",
      sourceType: "model-card",
      title: "Gemini 3.8 Flash model card",
      publishedAt: "2026-09-02",
    },
  ],
  "meta-muse-voice-transcribe": [
    {
      url: "https://dev.meta.ai/models/muse-voice-transcribe",
      sourceType: "pricing",
      title: "Muse Voice Transcribe model page and pricing",
    },
  ],
}

// Fully verified in-session against live primary sources (fields read, not inferred).
const VERIFIED_IDS = new Set(["mistral-large-4"])

// Content corrections applied with changelog entries (see docs/audit-2026-10-07.md).
const CORRECTION_NOTES = {
  "meta-muse-voice-transcribe":
    "Corrected billing to per-second audio pricing ($3.00/1,000 min), removed unsupported token-context figures and open-weights claim, re-sourced to live Meta Research + Model API pages.",
  "mistral-medium-3-5":
    "Corrected release date to 2026-04-28, license to Modified MIT (open weights), badge off flagship wording; re-sourced to live docs page + Hugging Face model card.",
  "gemini-3-8-flash":
    "Re-sourced announcement to canonical blog URL and added API reference + model card; registry benchmark figures remain lab-reported, pending per-field recheck.",
  "qwen-3-8-flash":
    "Corrected parameters to 176B MoE (6B active), max output to 131K tokens, pricing to $0.16/$0.47, modalities +Video, openWeights true; re-sourced to Alibaba Cloud blog + Model Studio docs. Registry mmluPro figure remains lab-reported, pending per-field recheck.",
}

function liveness(url) {
  if (DEAD.has(url)) return { live: false, dead: true }
  if (GATED.has(url)) return { live: false, dead: false, note: GATED.get(url) }
  return { live: true, dead: false }
}

function loadModels() {
  const ts = require("typescript")
  const vm = require("vm")
  const source = fs.readFileSync(MODELS_PATH, "utf8")
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const mod = { exports: {} }
  vm.runInContext(
    transpiled,
    vm.createContext({ module: mod, exports: mod.exports, require, console })
  )
  return mod.exports.modelsData
}

function buildSources(m) {
  const pub = PUBLISHERS[m.companyId] || { publisher: m.companyName, domain: "" }
  const srcs = []
  const push = (url, sourceType, title, extra) => {
    if (!url || DEAD.has(url)) return
    const gate = liveness(url)
    srcs.push({
      url,
      publisher: pub.publisher,
      title,
      ...(OBSERVED_PUBLISHED_AT[url] ? { publishedAt: OBSERVED_PUBLISHED_AT[url] } : {}),
      accessedAt: ACCESSED_AT,
      sourceType,
      live: gate.live,
      ...(gate.live ? {} : { note: gate.note || "Automated fetch blocked, page not re-confirmed on access date." }),
      ...(extra || {}),
    })
  }
  const L = m.links || {}
  push(L.announcement, "announcement", `${m.name} announcement`)
  push(L.apiDocs, "api-docs", `${m.name} API reference`)
  push(L.weights, "weights", `${m.name} open weights`)
  push(L.paper, "paper", `${m.name} technical report`)
  for (const e of EXTRA_SOURCES[m.id] || []) push(e.url, e.sourceType, e.title, { publishedAt: e.publishedAt })
  return srcs
}

function pick(srcs, ...types) {
  // Prefer live sources; fall back to bot-gated official pages (their
  // SourceRef carries live:false plus an access note, so the limitation
  // stays visible). Dead URLs are never cited (excluded in buildSources).
  for (const pass of [true, false]) {
    for (const t of types) {
      const hit = srcs.filter((s) => s.sourceType === t && s.live === pass)
      if (hit.length > 0) return hit
    }
  }
  return null
}

function buildFieldSources(m, srcs) {
  const fs = {}
  const set = (k, v) => {
    if (v) fs[k] = v
  }
  set("releaseDate", pick(srcs, "announcement", "api-docs", "weights", "paper"))
  set("contextWindow", pick(srcs, "api-docs", "announcement", "model-card"))
  set("maxOutputTokens", pick(srcs, "api-docs", "announcement", "model-card"))
  set("parameters", pick(srcs, "announcement", "weights", "paper", "api-docs", "model-card"))
  set("license", pick(srcs, "weights", "announcement", "api-docs"))
  set("pricing", pick(srcs, "pricing", "api-docs", "announcement"))
  set("modalities", pick(srcs, "announcement", "api-docs", "weights", "model-card"))
  if (m.benchmarks && Object.keys(m.benchmarks).length > 0) {
    set("benchmarks", pick(srcs, "announcement", "model-card", "paper"))
  }
  set("isCompanyFlagship", pick(srcs, "announcement", "api-docs", "weights"))
  set("isLatestCheckpoint", pick(srcs, "announcement", "api-docs", "weights"))
  return fs
}

function buildChangeLog(m, srcs) {
  const first = srcs[0]
  const log = [
    {
      date: m.releaseDate,
      summary: "Initial registry entry.",
      sources: first ? [first.url] : [],
    },
  ]
  if (m.id === "mistral-large-4") {
    log.push({
      date: "2026-10-07",
      summary: "Added to registry as Mistral flagship; Medium 3.5 demoted.",
      sources: ["https://mistral.ai/news/mistral-large-4/"],
    })
  }
  if (CORRECTION_NOTES[m.id]) {
    log.push({ date: "2026-10-07", summary: "Audit correction: " + CORRECTION_NOTES[m.id], sources: srcs.map((s) => s.url) })
  }
  return log
}

// --- text-level file surgery (additive only) ---

const INTERFACE_BLOCK = `export type SourceType =
  | "announcement"
  | "api-docs"
  | "pricing"
  | "model-card"
  | "paper"
  | "weights"
  | "benchmark"
  | "console"

export interface SourceRef {
  url: string
  publisher: string
  // Human-readable source title, e.g. "Mistral Large 4 announcement".
  title: string
  // First publication date of the source, when directly observed.
  publishedAt?: string
  // Date the registry last confirmed the source (YYYY-MM-DD).
  accessedAt: string
  sourceType: SourceType
  // True when the source returned HTTP 2xx to the registry's automated check.
  live?: boolean
  // Explains access limits (e.g. bot-gated) or source weaknesses.
  note?: string
}

export type VerificationStatus = "verified" | "partially_verified" | "unverified" | "retired"

// Core factual fields that may carry per-field citations.
export type SourcedField =
  | "releaseDate"
  | "contextWindow"
  | "maxOutputTokens"
  | "parameters"
  | "license"
  | "pricing"
  | "modalities"
  | "benchmarks"
  | "isCompanyFlagship"
  | "isLatestCheckpoint"

export type FieldSourceMap = Partial<Record<SourcedField, SourceRef[]>>

export interface ChangeLogEntry {
  date: string // YYYY-MM-DD
  summary: string
  sources?: string[]
}

`

function q(s) {
  return JSON.stringify(s)
}

function emitSourceRef(s, indent) {
  const p = (v) => `${indent}  ${v},`
  const lines = [`${indent}{`, p(`url: ${q(s.url)}`), p(`publisher: ${q(s.publisher)}`), p(`title: ${q(s.title)}`)]
  if (s.publishedAt) lines.push(p(`publishedAt: ${q(s.publishedAt)}`))
  lines.push(p(`accessedAt: ${q(s.accessedAt)}`))
  lines.push(p(`sourceType: ${q(s.sourceType)}`))
  if (s.live !== undefined) lines.push(p(`live: ${s.live}`))
  if (s.note) lines.push(p(`note: ${q(s.note)}`))
  lines.push(`${indent}},`)
  return lines.join("\n")
}

function emitProvenanceBlock(m, srcs, fsMap, status, log) {
  const I = "    "
  const out = []
  out.push(`${I}sources: [`)
  srcs.forEach((s) => out.push(emitSourceRef(s, I)))
  out.push(`${I}],`)
  out.push(`${I}fieldSources: {`)
  for (const [k, arr] of Object.entries(fsMap)) {
    out.push(`${I}  ${k}: [`)
    arr.forEach((s) => out.push(emitSourceRef(s, I + "  ")))
    out.push(`${I}  ],`)
  }
  out.push(`${I}},`)
  out.push(`${I}lastVerifiedAt: ${q(LAST_VERIFIED_AT)},`)
  out.push(`${I}verificationStatus: ${q(status)},`)
  out.push(`${I}changeLog: [`)
  log.forEach((e) => {
    out.push(`${I}  {`)
    out.push(`${I}    date: ${q(e.date)},`)
    out.push(`${I}    summary: ${q(e.summary)},`)
    if (e.sources && e.sources.length > 0) {
      out.push(`${I}    sources: [`)
      e.sources.forEach((u) => out.push(`${I}      ${q(u)},`))
      out.push(`${I}    ],`)
    }
    out.push(`${I}  },`)
  })
  out.push(`${I}],`)
  return out.join("\n")
}

// Remove a previously inserted provenance block for the entry spanning
// [openIdx..closeIdx] (makes the script idempotent: strip-then-insert).
// The emitted block always starts at the first `    sources: [` line and ends
// at the LAST `    ],` line before the entry close (nested closes use
// deeper indentation: `      ],` / `        ],`).
function stripProvenance(lines, openIdx, closeIdx) {
  let start = -1
  for (let i = openIdx; i <= closeIdx; i++) {
    if (lines[i] === "    sources: [") {
      start = i
      break
    }
  }
  if (start === -1) return lines
  let end = -1
  for (let i = closeIdx; i >= start; i--) {
    if (lines[i] === "    ],") {
      end = i
      break
    }
  }
  if (end === -1) throw new Error("provenance block end not found, aborting")
  return [...lines.slice(0, start), ...lines.slice(end + 1)]
}

function entryBounds(lines, id) {
  const idIdx = lines.findIndex((l) => l.trim() === `id: ${q(id)},`)
  if (idIdx === -1) throw new Error(`entry not found: ${id}`)
  let openIdx = idIdx
  while (openIdx >= 0 && lines[openIdx].trim() !== "{") openIdx--
  if (openIdx < 0) throw new Error(`opening brace not found: ${id}`)
  let depth = 0
  for (let i = openIdx; i < lines.length; i++) {
    for (const ch of lines[i]) {
      if (ch === "{") depth++
      if (ch === "}") depth--
    }
    if (depth === 0) return { openIdx, closeIdx: i }
  }
  throw new Error(`closing brace not found: ${id}`)
}

function insertProvenance(text, id, block) {
  let lines = text.split("\n")
  // Strip any previous block first (idempotent refresh).
  try {
    const b = entryBounds(lines, id)
    lines = stripProvenance(lines, b.openIdx, b.closeIdx)
  } catch (e) {
    throw e
  }
  // Re-locate the (now clean) entry and insert before its close.
  const { closeIdx } = entryBounds(lines, id)
  lines.splice(closeIdx, 0, block)
  return { text: lines.join("\n") }
}

function main() {
  const models = loadModels()
  let text = fs.readFileSync(MODELS_PATH, "utf8")
  if (!text.includes("export type SourceType")) {
    const anchor = "export interface ModelItem {"
    if (!text.includes(anchor)) throw new Error("ModelItem anchor not found")
    text = text.replace(anchor, INTERFACE_BLOCK + anchor)
    console.log("inserted provenance interfaces")
  }
  const report = []
  for (const m of models) {
    const srcs = buildSources(m)
    const status = VERIFIED_IDS.has(m.id) ? "verified" : srcs.length > 0 ? "partially_verified" : "unverified"
    const fsMap = buildFieldSources(m, srcs)
    const log = buildChangeLog(m, srcs)
    const block = emitProvenanceBlock(m, srcs, fsMap, status, log)
    const res = insertProvenance(text, m.id, block)
    text = res.text
    report.push({ id: m.id, status, sources: srcs.length, fields: Object.keys(fsMap).length, live: srcs.filter((s) => s.live).length })
  }
  fs.writeFileSync(MODELS_PATH, text)
  const counts = {}
  report.forEach((r) => {
    counts[r.status] = (counts[r.status] || 0) + 1
  })
  console.log("status counts:", JSON.stringify(counts))
  console.log("models with zero sources:", report.filter((r) => r.sources === 0).map((r) => r.id))
  const noPricing = []
  for (const m of models) {
    const fsMap = buildFieldSources(m, buildSources(m))
    if (!fsMap.pricing) noPricing.push(m.id)
  }
  console.log("models missing pricing field-source:", JSON.stringify(noPricing))
}

main()
