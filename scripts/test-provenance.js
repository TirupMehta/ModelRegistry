/**
 * scripts/test-provenance.js
 * Trust-surface tests: proves the site never claims verification, currency,
 * or leadership it cannot evidence — across copy, schema, feeds, sitemap,
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
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`)
  }
}

function read(rel) {
  return fs.readFileSync(path.resolve(ROOT, rel), "utf8")
}

function exists(rel) {
  return fs.existsSync(path.resolve(ROOT, rel))
}

// 1. No dishonest freshness / leadership copy anywhere in app copy or data.
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
]
const SCAN_DIRS = ["app", "components", "lib", "data", "public/openapi.json", "README.md", "CONTRIBUTING.md"]
function allFiles(dir, out = []) {
  const full = path.resolve(ROOT, dir)
  if (!fs.existsSync(full)) return out
  if (fs.statSync(full).isFile()) return [...out, full]
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
check("model page renders VerificationSection", pageView.includes("<VerificationSection model={model} />"))
check("model modal renders VerificationSection", modal.includes("<VerificationSection model={model} />"))
check(
  "report-error link points at data-correction template",
  read("components/verification-section.tsx").includes("template=data-correction.yml")
)

// 3. Freshness comes from content, never build/request time.
const sitemap = read("app/sitemap.ts")
check("sitemap core routes use revision date", sitemap.includes("lastModified: revisedAt"))
check("sitemap has no bare build-time lastmod", !/lastModified: now\b/.test(sitemap))
for (const p of ["methodology", "editorial-policy", "changelog", "flagships", "pricing", "context", "licenses", "modalities", "retired", "feed.json"]) {
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

// 4. Leaderboard is framed as editorial with methodology + dates.
const lb = read("app/leaderboard/page.tsx")
check("leaderboard avoids 'state of the art'", !/state of the art/i.test(lb))
check("leaderboard avoids 'Domain SOTA'", !lb.includes("Domain SOTA"))
check("leaderboard links methodology", lb.includes('href="/methodology"'))
check("leaderboard shows evaluation basis per section", lb.includes("How this is judged"))

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
check("openapi documents SourceRef", !!openapi.components?.schemas?.SourceRef)
check("openapi documents ModelItem provenance", !!openapi.components?.schemas?.ModelItem?.properties?.fieldSources)
check("openapi documents check-updates honesty fields", !!openapi.paths?.["/api/check-updates"]?.get?.responses?.["200"]?.content?.["application/json"]?.schema?.properties?.oldestVerificationDate)
function routeFileFor(urlPath) {
  // /api/v1/models -> app/api/v1/models/route.ts ; /feed.json -> app/feed.json/route.ts ...
  const clean = urlPath.replace(/\{[^}]+\}/g, "__dyn__")
  const direct = path.join("app", clean.slice(1), "route.ts")
  const directTsx = path.join("app", clean.slice(1), "route.tsx")
  if (clean.includes("__dyn__")) return true // dynamic segments verified by test-routes
  return exists(direct) || exists(directTsx)
}
for (const p of Object.keys(openapi.paths || {})) {
  check(`openapi path ${p} has a route file`, routeFileFor(p))
}

// 10. Audit + methodology docs exist and agree on counts.
check("audit report exists", exists("docs/audit-2026-10-07.md"))
const audit = read("docs/audit-2026-10-07.md")
check("audit states verified=1", audit.includes("verified 1") || audit.includes("verified: 1"))
check("methodology page exists", exists("app/methodology/page.tsx"))
check("editorial policy page exists", exists("app/editorial-policy/page.tsx"))
check("changelog page exists", exists("app/changelog/page.tsx"))
check("contributor guide requires primary sources", read("CONTRIBUTING.md").includes("Provenance Rule"))

if (failures > 0) {
  console.error(`\n❌ test-provenance failed with ${failures} failure(s).`)
  process.exit(1)
}
console.log("\n✔ test-provenance: all trust invariants hold.")
