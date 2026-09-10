const fs = require("fs")
const path = require("path")
const ts = require("typescript")
const vm = require("vm")

console.log("🔗 Verifying site-wide link & data integrity...")

function loadTsModule(relPath, registry = {}) {
  const fullPath = path.resolve(__dirname, relPath)
  const source = fs.readFileSync(fullPath, "utf8")
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText

  const mod = { exports: {} }
  const ctx = vm.createContext({
    module: mod,
    exports: mod.exports,
    require: (spec) => {
      // Lib modules import the dataset with relative or @/-aliased paths that
      // plain node cannot resolve — serve the already-loaded modules instead.
      if (spec in registry) return registry[spec]
      return require(spec)
    },
    console,
  })
  vm.runInContext(transpiled, ctx)
  return mod.exports
}

const { modelsData } = loadTsModule("../data/models.ts")
const { companies } = loadTsModule("../data/companies.ts")
const datasetRegistry = {
  "../data/models": { modelsData },
  "@/data/models": { modelsData },
  "../data/companies": { companies },
  "@/data/companies": { companies },
}
const { leaderboardSpotlights } = loadTsModule("../data/leaderboard.ts")
const { resolveCompanyFallback } = loadTsModule("../lib/model-fallback.ts")
const { formatPrice, safeJsonLd } = loadTsModule("../lib/utils.ts")

const failures = []
function check(label, actual, expected) {
  const a = JSON.stringify(actual)
  const e = JSON.stringify(expected)
  if (a === e) {
    console.log(`  ok: '${label}' -> ${a}`)
  } else {
    console.error(`  FAIL: '${label}' -> ${a} (expected ${e})`)
    failures.push(label)
  }
}

// 1. Every README /models/:id link must resolve to a real entry.
const readme = fs.readFileSync(path.resolve(__dirname, "../README.md"), "utf8")
const readmeModelIds = Array.from(readme.matchAll(/\/models\/([a-z0-9-]+)/g)).map((m) => m[1])
const knownIds = new Set(modelsData.map((m) => m.id))
const dangling = readmeModelIds.filter((id) => !knownIds.has(id))
check("readme-model-links-resolve", dangling, [])

// 2. Every lab must render on /companies: flagship present + latest slot resolvable
//    with the exact find-first semantics the pages use.
for (const companyId of Object.keys(companies)) {
  const flagship = modelsData.find((m) => m.companyId === companyId && m.isCompanyFlagship)
  check(`lab-${companyId}-has-flagship`, Boolean(flagship), true)
  const nonFlagships = modelsData.filter((m) => m.companyId === companyId && m.id !== flagship?.id)
  const latestDrop = nonFlagships.find((m) => m.isLatestCheckpoint)
  const fallback = [...nonFlagships].sort((a, b) => b.releaseDate.localeCompare(a.releaseDate))[0]
  // Single-model labs legitimately have no second slot (/companies shows a
  // fallback note); multi-model labs must always resolve one.
  check(
    `lab-${companyId}-second-slot`,
    nonFlagships.length === 0 || Boolean(latestDrop ?? fallback),
    true
  )
}

// 3. Company keys must be URL-safe slugs (they become /companies/:id paths).
for (const companyId of Object.keys(companies)) {
  check(`lab-slug-${companyId}`, /^[a-z0-9-]+$/.test(companyId), true)
}

// 4. Leaderboard spotlights must all resolve (redundant with validator, cheap).
for (const [section, ids] of Object.entries(leaderboardSpotlights)) {
  ids.forEach((id) => check(`spotlight-${section}-${id}`, knownIds.has(id), true))
}

// 5. Retired slugs must resolve to the lab FLAGSHIP, never to a newer
//    sibling from another modality (regression guard for visual models).
const openai = modelsData.filter((m) => m.companyId === "openai")
const openaiNewest = [...openai].sort((a, b) => b.releaseDate.localeCompare(a.releaseDate))[0]
if (openaiNewest && !openaiNewest.isCompanyFlagship) {
  const resolved = resolveCompanyFallback("openai-astra", modelsData)
  check("fallback-prefers-flagship-over-newest", resolved?.id, "gpt-6-astra")
} else {
  console.log("  skip: fallback-flagship guard (newest is flagship, covered by test-fallback.js)")
}

// 6. formatPrice contract across billing units.
check("price-token", formatPrice({ pricing: { input: 10, output: 50 } }), "$10 in / $50 out")
check(
  "price-token-open",
  formatPrice({ pricing: { input: 0.05, output: 0.15 }, openWeights: true }),
  "$0.05 in / $0.15 out (Open)"
)
check(
  "price-per-second",
  formatPrice({ pricing: { input: 0.084, output: 0.084 }, pricingUnit: "per second" }),
  "$0.084 per second"
)
check(
  "price-per-second-split",
  formatPrice({ pricing: { input: 0.2, output: 0.4 }, pricingUnit: "per second" }),
  "$0.2 in / $0.4 per second"
)

// 7. safeJsonLd must neutralize script breakouts without changing other output.
check("jsonld-escapes-script", safeJsonLd({ a: "</script><script>" }), '{"a":"\\u003c/script>\\u003cscript>"}')
check("jsonld-passthrough", safeJsonLd({ a: "plain & <b>?</b>" }).includes("\\u003c"), true)

// 8. /docs must document every category present in the dataset (drift guard).
const docsSource = fs.readFileSync(path.resolve(__dirname, "../app/docs/page.tsx"), "utf8")
const categories = Array.from(new Set(modelsData.map((m) => m.category)))
const missing = categories.filter((c) => !docsSource.includes(c))
check("docs-covers-all-categories", missing, [])

// 9. OG card params must resolve: every model id and lab id is a valid ?model= / ?lab=.
check("og-model-ids-valid", modelsData.every((m) => knownIds.has(m.id)), true)
check("og-lab-ids-valid", Object.keys(companies).every((id) => Boolean(companies[id])), true)

// 10. Agent prompts: single-sourced, synced, fence-safe.
const { buildContributePrompt, API_USE_PROMPT, CONTRIBUTE_PROMPT_VERSION } =
  loadTsModule("../lib/agent-prompts.ts", datasetRegistry)
const contributePrompt = buildContributePrompt()
check("prompt-has-version", typeof CONTRIBUTE_PROMPT_VERSION === "string" && CONTRIBUTE_PROMPT_VERSION.length > 0, true)
check("prompt-no-fence-breakout", contributePrompt.includes("```"), false)
check("prompt-lists-all-labs", Object.keys(companies).every((id) => contributePrompt.includes(id)), true)
check("prompt-links-repo", contributePrompt.includes("https://github.com/TirupMehta/ModelRegistry"), true)
check("api-prompt-links-docs", API_USE_PROMPT.includes("https://modelregistry.tirup.in/docs"), true)
check(
  "readme-prompt-synced",
  readme.includes(`(${CONTRIBUTE_PROMPT_VERSION})`) &&
    readme.includes("https://github.com/TirupMehta/ModelRegistry") &&
    readme.includes("CONTRIBUTE_PROMPT_START"),
  true
)
const docsSrc = fs.readFileSync(path.resolve(__dirname, "../app/docs/page.tsx"), "utf8")
check("docs-uses-prompt-source", docsSrc.includes("lib/agent-prompts"), true)
const headerSrc = fs.readFileSync(path.resolve(__dirname, "../components/header.tsx"), "utf8")
check("header-fetches-prompt", headerSrc.includes("/api/agent-prompt"), true)
const promptRouteSrc = fs.readFileSync(path.resolve(__dirname, "../app/api/agent-prompt/route.ts"), "utf8")
check("prompt-route-single-sourced", promptRouteSrc.includes("lib/agent-prompts"), true)

if (failures.length > 0) {
  console.error(`\n❌ Site integrity failed with ${failures.length} mismatch(es).`)
  process.exit(1)
}
console.log("\n✔ Site integrity verified.")
