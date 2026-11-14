/**
 * scripts/test-provenance.js
 * Trust-surface tests: proves the site never claims verification, currency,
 * or leadership it cannot evidence - across copy, schema, feeds, sitemap,
 * OpenAPI, and the revision system. Runs offline (no server needed).
 *
 * Fails (exit 1) on the first violated invariant, naming the file and rule.
 */
const fs = require("fs")
const path = require("path")

const ROOT = path.resolve(__dirname, "..")
let failures = 0

function check(name, cond, detail) {
  if (cond) {
    console.log(`  ✓ ${name}`)
  } else {
    failures++
    console.error(`  ✗ ${name}${detail ? ` - ${detail}` : ""}`)
  }
}

function read(rel) {
  return fs.readFileSync(path.resolve(ROOT, rel), "utf8")
}

function exists(rel) {
  return fs.existsSync(path.resolve(ROOT, rel))
}

// 1. No dishonest freshness / leadership copy anywhere in app copy or data.
// House style bans the em dash outright (use "-" or restructure), so its
// U+2014 code point is forbidden here as an escape: the guard file itself
// stays em-dash-free, which also keeps future scripts/ scans honest.
const FORBIDDEN = [
  "Real-Time Verified",
  "Last Verified:",
  "Last Chronological Verification",
  "is up to date with frontier",
  "SoftwareApplication",
  "hold the state of the art",
  "Domain SOTA",
  "SEPTEMBER 2026",
  "September 2026",
  "Live Frontier Radar",
  "\u2014",
]
const SCAN_DIRS = ["app", "components", "lib", "data", "public", "README.md", "CONTRIBUTING.md"]
function allFiles(dir, out = []) {
  const full = path.resolve(ROOT, dir)
  if (!fs.existsSync(full)) return out
  if (fs.statSync(full).isFile()) {
    out.push(full)
    return out
  }
  for (const e of fs.readdirSync(full)) {
    if (["node_modules", ".next"].includes(e)) continue
    allFiles(path.join(dir, e), out)
  }
  return out
}
const corpus = [...new Set(SCAN_DIRS.flatMap((d) => allFiles(d)))]
  .filter((f) => /\.(tsx?|json|md|css)$/.test(f) && !f.includes(".next"))
const hits = []
for (const f of corpus) {
  const text = fs.readFileSync(f, "utf8")
  for (const phrase of FORBIDDEN) {
    if (text.includes(phrase)) hits.push(`${path.relative(ROOT, f)} :: ${phrase}`)
  }
}
check("no dishonest/trust-inflating copy in repo", hits.length === 0, hits.slice(0, 5).join(" | "))

// 2. Every model page surface renders the Verification section.
const pageView = read("components/model-page-view.tsx")
const modal = read("components/model-details-modal.tsx")
check("model page links the report-error form and renders the sources strip", pageView.includes("reportIssueUrl(model.id)") && pageView.includes("{footer}") && read("app/models/[id]/page.tsx").includes("footer={<ModelProvenance model={model} />}"))
check("model modal renders VerificationSection", modal.includes("<VerificationSection model={model} />"))
check(
  "report-error link points at data-correction template",
  read("components/verification-section.tsx").includes("template=data-correction.yml")
)

// 3. Freshness comes from content, never build/request time.
const sitemap = read("app/sitemap.ts")
check("sitemap core routes use revision date", sitemap.includes("lastModified: revisedAt"))
check("sitemap has no bare build-time lastmod", !/lastModified: now\b/.test(sitemap))
for (const p of ["methodology", "editorial-policy", "changelog", "flagships", "pricing", "context", "licenses", "modalities", "retired", "feed.json", "open-source"]) {
  check(`sitemap covers /${p}`, sitemap.includes(`/${p}`))
}
check("model JSON-LD uses TechArticle", read("app/models/[id]/page.tsx").includes('"@type": "TechArticle"'))
check("model JSON-LD carries dateModified", read("app/models/[id]/page.tsx").includes("dateModified: model.lastVerifiedAt"))
check("model JSON-LD carries citations", read("app/models/[id]/page.tsx").includes("citation: model.sources"))
check("no invisible FAQPage schema in layout", !read("app/layout.tsx").includes('"@type": "FAQPage"'))
check(
  "companies FAQ schema has visible Q&A",
  read("app/companies/[id]/page.tsx").includes("What is the latest AI model from") &&
    read("app/companies/[id]/page.tsx").includes("FAQPage")
)

// 4. The best-by-task page is framed as independent evidence with its method stated.
const best = read("app/best/page.tsx")
check("best page avoids 'state of the art'", !/state of the art/i.test(best))
check("best page names its evaluator and read date", best.includes("INDEPENDENT_EVALUATOR.retrievedAt"))
check("best page explains how answers are chosen", best.includes("How these answers are chosen"))

// 5. Health endpoint honesty.
const health = read("app/api/check-updates/route.ts")
check("health never claims 'up to date'", !health.includes("up to date"))
check("health reports generatedAt separately", health.includes("generatedAt"))
check("health reports datasetLastChangedAt", health.includes("datasetLastChangedAt"))
check("health reports verification counts", health.includes("verifiedModelCount") && health.includes("unverifiedModelCount"))
check("health reports upstream separately", health.includes("upstreamAvailability"))

// 6. API honesty: revision-based updatedAt + ETag + dataset version.
const api = read("app/api/v1/models/route.ts")
check("api updatedAt is revision-based", api.includes("datasetRevision.revisedAt") && !api.includes("new Date().toISOString()"))
check("api supports ETag/304", api.includes("if-none-match") && api.includes("304"))
check("api exposes datasetVersion", api.includes("datasetVersion"))

// 7. JSON Feed mirrors RSS from the same data.
check("feed.json route exists", exists("app/feed.json/route.ts"))
const feed = read("app/feed.json/route.ts")
check("feed declares JSON Feed 1.1", feed.includes("jsonfeed.org/version/1.1"))
check("feed carries verification status", feed.includes("_verification_status"))
check("feed uses record modification dates", feed.includes("lastVerifiedAt"))

// 8. Revision system: file exists, valid shape, idempotent writer.
check("data/revision.ts exists", exists("data/revision.ts"))
const rev = read("data/revision.ts")
check(
  "revision has version + date + hash",
  /datasetVersion:\s*"[\d.]+(-r\d+)?"/.test(rev) && /revisedAt:\s*"\d{4}-\d{2}-\d{2}"/.test(rev) && /contentHash:\s*"[0-9a-f]{16}"/.test(rev)
)

// 9. OpenAPI documents provenance + honesty fields and matches real routes.
const openapi = JSON.parse(read("public/openapi.json"))
// Schemas are shared through components; resolve a $ref before asserting fields.
function resolveSchema(schema) {
  if (schema && schema.$ref) {
    const name = schema.$ref.split("/").pop()
    return openapi.components?.schemas?.[name]
  }
  return schema
}
check("openapi documents SourceRef", !!openapi.components?.schemas?.SourceRef)
check("openapi documents ModelItem provenance", !!openapi.components?.schemas?.ModelItem?.properties?.fieldSources)
check("openapi documents check-updates honesty fields", !!resolveSchema(openapi.paths?.["/api/check-updates"]?.get?.responses?.["200"]?.content?.["application/json"]?.schema)?.properties?.oldestVerificationDate)
check("provider listing route is documented", !!openapi.paths?.["/api/v1/models/{id}/providers"]?.get)
check("provider mapping stays explicit and separate", exists("data/provider-catalog.ts") && read("data/provider-catalog.ts").includes("openRouterModelIds"))
check("provider listing route exists", exists("app/api/v1/models/[id]/providers/route.ts"))
function routeFileFor(urlPath) {
  // /api/v1/models -> app/api/v1/models/route.ts ; /feed.json -> app/feed.json/route.ts ...
  const clean = urlPath.replace(/\{[^}]+\}/g, "__dyn__")
  const direct = path.join("app", clean.slice(1), "route.ts")
  const directTsx = path.join("app", clean.slice(1), "route.tsx")
  // A route may also be an optional catch-all (e.g. /api/markdown ->
  // app/api/markdown/[[...path]]/route.ts) so one handler serves the root and
  // every sub-path.
  const optionalCatchAll = path.join("app", clean.slice(1), "[[...path]]", "route.ts")
  const catchAll = path.join("app", clean.slice(1), "[...path]", "route.ts")
  if (clean.includes("__dyn__")) return true // dynamic segments verified by test-routes
  return exists(direct) || exists(directTsx) || exists(optionalCatchAll) || exists(catchAll)
}
for (const p of Object.keys(openapi.paths || {})) {
  check(`openapi path ${p} has a route file`, routeFileFor(p))
}

// 10. Audit + methodology docs exist and agree on counts.
check("methodology page exists", exists("app/methodology/page.tsx"))
check("editorial policy page exists", exists("app/editorial-policy/page.tsx"))
check("changelog page exists", exists("app/changelog/page.tsx"))
check("contributor guide requires primary sources", read("CONTRIBUTING.md").includes("Provenance Rule"))
check("contributor guide points at live lab list", read("CONTRIBUTING.md").includes("data/companies.ts"))
check("contributor guide carries no hardcoded lab enumeration", !/one of:\s*anthropic/.test(read("CONTRIBUTING.md")))

// 11. Ranking and currency invariants (see lib/currency.ts, lib/best.ts).
{
  const ts = require("typescript")
  const modelsSrc = ts.transpileModule(read("data/models.ts"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText
  const mod = { exports: {} }
  new Function("module", "exports", "require", modelsSrc)(mod, mod.exports, require)
  const models = mod.exports.modelsData
  const byId = new Map(models.map((m) => [m.id, m]))

  const supersededFlagships = models.filter((m) => m.supersededBy && m.isCompanyFlagship)
  check(
    "no superseded record is a company flagship",
    supersededFlagships.length === 0,
    supersededFlagships.map((m) => m.id).join(", "),
  )
  const dangling = models.filter((m) => m.supersededBy && !byId.has(m.supersededBy))
  check("every supersededBy points at a real record", dangling.length === 0, dangling.map((m) => m.id).join(", "))
  check("no record supersedes itself", models.every((m) => m.supersededBy !== m.id))
  const chainEndsCurrent = models
    .filter((m) => m.supersededBy)
    .every((m) => {
      const seen = new Set([m.id])
      let cursor = byId.get(m.supersededBy)
      while (cursor && cursor.supersededBy) {
        if (seen.has(cursor.id)) return false
        seen.add(cursor.id)
        cursor = byId.get(cursor.supersededBy)
      }
      return Boolean(cursor)
    })
  check("every supersession chain ends at a current record", chainEndsCurrent)

  const spotMod = { exports: {} }
  new Function("module", "exports", "require", ts.transpileModule(read("data/leaderboard.ts"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText)(spotMod, spotMod.exports, require)
  const { leaderboardSpotlights } = spotMod.exports
  const staleSpotlights = Object.entries(leaderboardSpotlights).flatMap(([section, list]) =>
    list.filter((id) => byId.get(id)?.supersededBy).map((id) => `${section}:${id}`),
  )
  check("no leaderboard spotlight lists a superseded model", staleSpotlights.length === 0, staleSpotlights.join(", "))

  const absolute = models.filter((m) => /in existence|best-in-class/i.test(m.highlight))
  check(
    "no unattributed absolute claims in highlights",
    absolute.length === 0,
    absolute.map((m) => m.id).join(", "),
  )
}

// 11b. Independent benchmark records must be traceable and in range.
{
  const ts = require("typescript")
  const load = (rel) => {
    const out = ts.transpileModule(read(rel), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText
    const mod = { exports: {} }
    new Function("module", "exports", "require", out)(mod, mod.exports, require)
    return mod.exports
  }
  const { independentRecords, INDEPENDENT_EVALUATOR, INDEPENDENT_BENCHMARKS } = load("data/independent-benchmarks.ts")
  const { modelsData } = load("data/models.ts")
  const ids = new Set(modelsData.map((m) => m.id))
  const keys = new Set(INDEPENDENT_BENCHMARKS.map((b) => b.key))
  const info = new Map(INDEPENDENT_BENCHMARKS.map((b) => [b.key, b]))
  const problems = []
  const seen = new Set()
  for (const record of independentRecords) {
    if (!ids.has(record.modelId)) problems.push(`${record.modelId}: unknown model`)
    if (seen.has(record.modelId)) problems.push(`${record.modelId}: duplicate record`)
    seen.add(record.modelId)
    if (!/^https:\/\/artificialanalysis\.ai\//.test(record.sourceUrl)) problems.push(`${record.modelId}: source is not the evaluator`)
    if (!record.evaluatedAs) problems.push(`${record.modelId}: no evaluated-as configuration`)
    if (record.values.arenaText !== undefined && !/^https:\/\/arena\.ai\//.test(record.arenaSourceUrl || "")) problems.push(`${record.modelId}: arena score without an arena.ai source`)
    for (const [key, value] of Object.entries(record.values)) {
      if (!keys.has(key)) problems.push(`${record.modelId}: unknown benchmark ${key}`)
      const unit = info.get(key)?.unit
      if (typeof value !== "number" || Number.isNaN(value)) problems.push(`${record.modelId}.${key}: not a number`)
      else if (unit === "percent" && (value < 0 || value > 100)) problems.push(`${record.modelId}.${key}: percent out of range`)
      else if (unit === "net" && (value < -100 || value > 100)) problems.push(`${record.modelId}.${key}: net score out of range`)
      else if (unit === "index" && (value < 0 || value > 100)) problems.push(`${record.modelId}.${key}: index out of range`)
    }
  }
  check("independent records are traceable and in range", problems.length === 0, problems.slice(0, 4).join(" | "))
  check("independent evaluator has a retrieval date", /^\d{4}-\d{2}-\d{2}$/.test(INDEPENDENT_EVALUATOR.retrievedAt))
}

// 12. Encoding and placeholder regressions that make a page look unfinished.
{
  const files = []
  for (const dir of ["app", "components", "lib"]) allFiles(dir, files)
  const sources = files.filter((f) => /\.(ts|tsx)$/.test(f))
  const corrupted = sources.filter((f) => fs.readFileSync(f, "utf8").includes("�"))
  check(
    "no U+FFFD replacement characters in source",
    corrupted.length === 0,
    corrupted.map((f) => path.relative(ROOT, f)).join(", "),
  )
  const placeholder = sources.filter((f) => fs.readFileSync(f, "utf8").includes("accessed YYYY-MM-DD"))
  check(
    "no literal date placeholder in citation text",
    placeholder.length === 0,
    placeholder.map((f) => path.relative(ROOT, f)).join(", "),
  )
}

if (failures > 0) {
  console.error(`\n❌ test-provenance failed with ${failures} failure(s).`)
  process.exit(1)
}
console.log("\n✔ test-provenance: all trust invariants hold.")
