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
 *   remote-dns - this machine cannot resolve the host, but an independent
 *               public DoH resolver confirms it resolves elsewhere (regional
 *               DNS filtering or a resolver outage - not a dead page)
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

// Public DoH resolver for triage when this machine reaches nothing. A page can
// be perfectly live elsewhere while a local resolver, ISP filter, or VPN
// blackout makes DNS fail here - retry the name against an independent public
// resolver before calling the link broken. Only NXDOMAIN means the name is gone.
const DOH_ENDPOINT = "https://cloudflare-dns.com/dns-query"
async function hostResolvesPublicly(hostname) {
  try {
    const res = await fetch(
      `${DOH_ENDPOINT}?name=${encodeURIComponent(hostname)}&type=A`,
      { headers: { accept: "application/dns-json" }, signal: AbortSignal.timeout(8000) }
    )
    if (!res.ok) return null
    const body = await res.json()
    if (body.Status === 3) return false // NXDOMAIN - the hostname does not exist
    return Boolean(
      body.Status === 0 &&
        Array.isArray(body.Answer) &&
        body.Answer.some((record) => record.type === 1)
    )
  } catch {
    return null // DoH itself unreachable - cannot triage
  }
}

async function classifyUnreachable(url) {
  let hostname
  try {
    hostname = new URL(url).hostname
  } catch {
    return { state: "error", status: 0, detail: "invalid URL" }
  }
  const resolves = await hostResolvesPublicly(hostname)
  if (resolves === true) {
    return {
      state: "remote-dns",
      status: 0,
      detail: "host resolves via public DoH; this machine's resolver cannot reach it (regional block, not a dead page)",
    }
  }
  if (resolves === false) {
    return { state: "dead", status: 0, detail: "NXDOMAIN - the hostname no longer exists" }
  }
  return { state: "error", status: 0, detail: "unreachable and DoH triage unavailable" }
}

async function probe(url) {
  let status
  try {
    status = await statusOnce(url, "HEAD")
  } catch {
    try {
      status = await statusOnce(url, "GET")
    } catch {
      return await classifyUnreachable(url)
    }
  }
  // Some hosts answer HEAD with 403/405 yet serve GET fine; some CDNs and
  // edge runtimes even answer HEAD with 404 for a perfectly live page. Never
  // trust a negative HEAD verdict - re-probe with GET before classifying.
  if ([403, 405, 501, 404, 410].includes(status)) {
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

  const byState = { ok: [], gated: [], dead: [], warn: [], error: [], remoteDns: [] }
  for (const r of results) {
    // Result state stays "remote-dns"; the counter bucket is camelCase.
    byState[r.state === "remote-dns" ? "remoteDns" : r.state].push(r)
  }

  const rd = byState.remoteDns
  if (JSON_OUT) {
    console.log(JSON.stringify({ total: results.length, counts: {
      ok: byState.ok.length,
      gated: byState.gated.length,
      dead: byState.dead.length,
      warn: byState.warn.length,
      error: byState.error.length,
      remoteDns: rd.length,
    }, results }, null, 2))
  } else {
    console.log(
      `\nSummary: ${results.length} URLs - ok=${byState.ok.length} gated=${byState.gated.length} ` +
        `dead=${byState.dead.length} warn=${byState.warn.length} error=${byState.error.length} remoteDns=${rd.length}`
    )
    if (byState.dead.length > 0) {
      console.error("\nDead links (HTTP 404/410) - fix or re-source:")
      for (const r of byState.dead) {
        console.error(`  ${r.url}  <- ${r.where.join(", ")}`)
      }
    }
    if (rd.length > 0) {
      console.log("\nUnresolvable from this network but live by public DoH (regional DNS artifact):")
      for (const r of rd) {
        console.log(`  ${r.url}  <- ${r.where.join(", ")}`)
      }
    }
  }

  if (process.env.GITHUB_STEP_SUMMARY) {
    const lines = [
      "## Link check",
      "",
      `Checked **${results.length}** distinct cited URLs: ` +
        `${byState.ok.length} ok, ${byState.gated.length} gated, ` +
        `${byState.dead.length} dead, ${byState.warn.length} warn, ${byState.error.length} error, ` +
        `${rd.length} remoteDns.`,
    ]
    if (byState.dead.length > 0) {
      lines.push("", "### Dead links (404/410)", "")
      for (const r of byState.dead) lines.push(`- \`${r.url}\` <- ${r.where.join(", ")}`)
    }
    if (rd.length > 0) {
      lines.push(
        "",
        "### Unresolvable here, live by public DoH (regional DNS artifact, not dead)",
        ""
      )
      for (const r of rd) lines.push(`- \`${r.url}\` <- ${r.where.join(", ")}`)
    }
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join("\n") + "\n")
  }

  process.exit(byState.dead.length > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error("link check failed:", e)
  process.exit(2)
})
