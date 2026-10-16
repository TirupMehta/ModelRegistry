/**
 * scripts/check-links.js
 * Verifies every cited URL still resolves: model `links.*`, `sources`,
 * `fieldSources`, variant links, company websites, and leaderboard
 * methodology sources. The registry's whole value is that its citations are
 * live - this is the automation the manual source audit (docs/audit-*.md)
 * implies but never had.
 *
 * Classification:
 *   ok    - HTTP 2xx/3xx
 *   gated - 401/403/405/429/451/503 (bot wall or rate limit, not a dead page)
 *   dead  - 404/410 (page gone: fix or re-source)
 *   warn  - other 4xx
 *   error - network failure / timeout / 5xx
 *
 * Only `dead` links fail the run. Bot-gated hosts (OpenAI, x.ai, claude.ai,
 * chat consoles) stay green so the check is never noise.
 *
 * Usage:
 *   node scripts/check-links.js            # human summary, exit 1 on dead
 *   node scripts/check-links.js --json     # machine-readable results
 *   LINK_CHECK_CONCURRENCY=16 node scripts/check-links.js
 *   LINK_CHECK_LIMIT=10 node scripts/check-links.js   # smoke-test a subset
 */
const fs = require("fs")
const path = require("path")
const ts = require("typescript")
const vm = require("vm")

const JSON_OUT = process.argv.includes("--json")
const CONCURRENCY = Math.max(1, Number(process.env.LINK_CHECK_CONCURRENCY || 8))
const TIMEOUT_MS = Number(process.env.LINK_CHECK_TIMEOUT_MS || 15000)
const UA =
  "Mozilla/5.0 (compatible; ModelRegistry-LinkCheck/1.0; +https://modelregistry.tirup.in/docs)"

function loadTsModule(relPath) {
  const fullPath = path.resolve(__dirname, relPath)
  const source = fs.readFileSync(fullPath, "utf8")
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText

  const mod = { exports: {} }
  const ctx = vm.createContext({ module: mod, exports: mod.exports, require, console })
  vm.runInContext(transpiled, ctx)
  return mod.exports
}

const { modelsData } = loadTsModule("../data/models.ts")
const { companies } = loadTsModule("../data/companies.ts")
const { leaderboardMethodology } = loadTsModule("../data/leaderboard.ts")

// url -> Set of "where" labels that cite it.
const registry = new Map()
function cite(url, where) {
  if (typeof url !== "string" || url.length === 0) return
  let parsed
  try {
    parsed = new URL(url)
  } catch {
    return
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return
  if (!registry.has(url)) registry.set(url, new Set())
  registry.get(url).add(where)
}

for (const m of modelsData) {
  const links = m.links || {}
  for (const key of ["announcement", "playground", "apiDocs", "paper", "weights"]) {
    if (links[key]) cite(links[key], `${m.id}.links.${key}`)
  }
  for (const s of m.sources || []) cite(s && s.url, `${m.id}.sources`)
  for (const [field, refs] of Object.entries(m.fieldSources || {})) {
    for (const r of refs || []) cite(r && r.url, `${m.id}.fieldSources.${field}`)
  }
  for (const v of m.variants || []) if (v.link) cite(v.link, `${m.id}.variants`)
}
for (const c of Object.values(companies)) cite(c.website, `company:${c.id}.website`)
for (const [section, method] of Object.entries(leaderboardMethodology || {})) {
  for (const u of (method && method.sources) || []) cite(u, `leaderboard:${section}`)
}

async function statusOnce(url, method) {
  const res = await fetch(url, {
    method,
    redirect: "follow",
    headers: { "user-agent": UA, accept: "text/html,application/json,*/*" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  return res.status
}

async function probe(url) {
  let status
  try {
    status = await statusOnce(url, "HEAD")
  } catch {
    try {
      status = await statusOnce(url, "GET")
    } catch (e) {
      return { state: "error", status: 0, detail: (e && (e.code || e.name)) || "fetch failed" }
    }
  }
  // Some hosts answer HEAD with 403/405 yet serve GET fine.
  if ([403, 405, 501].includes(status)) {
    try {
      status = await statusOnce(url, "GET")
    } catch {
      // Keep the HEAD status; classify below.
    }
  }
  if (status >= 200 && status < 400) return { state: "ok", status }
  if ([401, 403, 405, 429, 451, 503].includes(status)) return { state: "gated", status }
  if (status === 404 || status === 410) return { state: "dead", status }
  if (status >= 500) return { state: "error", status }
  return { state: "warn", status }
}

async function main() {
  const limit = Math.max(0, Number(process.env.LINK_CHECK_LIMIT || 0))
  const entries = limit > 0 ? [...registry.entries()].slice(0, limit) : [...registry.entries()]
  if (!JSON_OUT) console.log(`Checking ${entries.length} distinct cited URLs...\n`)

  const results = []
  let cursor = 0
  async function worker() {
    while (cursor < entries.length) {
      const index = cursor++
      const [url, where] = entries[index]
      const outcome = await probe(url)
      const record = { url, where: [...where].sort(), ...outcome }
      results.push(record)
      if (!JSON_OUT) {
        const mark =
          outcome.state === "dead" ? "DEAD" : outcome.state === "ok" ? "ok" : outcome.state
        console.log(`  [${mark}] ${url}`)
      }
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, entries.length) }, () => worker())
  )

  const byState = { ok: [], gated: [], dead: [], warn: [], error: [] }
  for (const r of results) byState[r.state].push(r)

  if (JSON_OUT) {
    console.log(JSON.stringify({ total: results.length, counts: {
      ok: byState.ok.length,
      gated: byState.gated.length,
      dead: byState.dead.length,
      warn: byState.warn.length,
      error: byState.error.length,
    }, results }, null, 2))
  } else {
    console.log(
      `\nSummary: ${results.length} URLs - ok=${byState.ok.length} gated=${byState.gated.length} ` +
        `dead=${byState.dead.length} warn=${byState.warn.length} error=${byState.error.length}`
    )
    if (byState.dead.length > 0) {
      console.error("\nDead links (HTTP 404/410) - fix or re-source:")
      for (const r of byState.dead) {
        console.error(`  ${r.url}  <- ${r.where.join(", ")}`)
      }
    }
  }

  if (process.env.GITHUB_STEP_SUMMARY) {
    const lines = [
      "## Link check",
      "",
      `Checked **${results.length}** distinct cited URLs: ` +
        `${byState.ok.length} ok, ${byState.gated.length} gated, ` +
        `${byState.dead.length} dead, ${byState.warn.length} warn, ${byState.error.length} error.`,
    ]
    if (byState.dead.length > 0) {
      lines.push("", "### Dead links (404/410)", "")
      for (const r of byState.dead) lines.push(`- \`${r.url}\` <- ${r.where.join(", ")}`)
    }
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join("\n") + "\n")
  }

  process.exit(byState.dead.length > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error("link check failed:", e)
  process.exit(2)
})
