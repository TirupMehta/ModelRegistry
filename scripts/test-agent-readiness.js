// Agent-readiness contract tests (static, no server required).
//
// Covers the machine-facing surface that Ora-style audits check:
// content negotiation, Markdown recovery on 404, JSON API errors, rate-limit
// header publication, OpenAPI self-description, Organization trust fields,
// agent instructions, and the trust-anchor pages.
//
// Run with `pnpm test`. Live behaviour is covered by scripts/test-routes.js
// against a real production build.
const fs = require("fs")
const path = require("path")
const ts = require("typescript")
const vm = require("vm")

console.log("🤖 Verifying agent-readiness contracts...")

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
      if (spec in registry) return registry[spec]
      return require(spec)
    },
    console,
    URL,
  })
  vm.runInContext(transpiled, ctx)
  return mod.exports
}

const { modelsData } = loadTsModule("../data/models.ts")
const { companies } = loadTsModule("../data/companies.ts")
const { datasetRevision } = loadTsModule("../data/revision.ts")
const site = loadTsModule("../lib/site.ts")
const utils = loadTsModule("../lib/utils.ts")

const registry = {
  "../data/models": { modelsData },
  "@/data/models": { modelsData },
  "../data/companies": { companies },
  "@/data/companies": { companies },
  "../data/revision": { datasetRevision },
  "@/data/revision": { datasetRevision },
  "../site": site,
  "@/lib/site": site,
  "../utils": utils,
  "@/lib/utils": utils,
  // lib/markdown imports only the static repo URL from lib/github; the stub
  // keeps the markdown registry loadable without network code.
  "../github": { REPO_URL: "https://github.com/TirupMehta/ModelRegistry" },
  "@/lib/github": { REPO_URL: "https://github.com/TirupMehta/ModelRegistry" },
}

const benchmarks = loadTsModule("../lib/benchmarks.ts", registry)
const currency = loadTsModule("../lib/currency.ts", registry)
const leaderboards = loadTsModule("../lib/leaderboards.ts", {
  ...registry,
  "./benchmarks": benchmarks,
  "./currency": currency,
  "../lib/benchmarks": benchmarks,
  "../lib/currency": currency,
  "@/lib/benchmarks": benchmarks,
  "@/lib/currency": currency,
})
const standing = loadTsModule("../lib/standing.ts", {
  ...registry,
  "./leaderboards": leaderboards,
  "../lib/leaderboards": leaderboards,
  "@/lib/leaderboards": leaderboards,
})
const seo = loadTsModule("../lib/seo.ts", {
  ...registry,
  "./benchmarks": benchmarks,
  "./currency": currency,
  "../lib/benchmarks": benchmarks,
  "../lib/currency": currency,
  "@/lib/benchmarks": benchmarks,
  "@/lib/currency": currency,
})

// Extend the shared registry so downstream modules (markdown) can resolve them.
Object.assign(registry, {
  "./benchmarks": benchmarks,
  "./currency": currency,
  "./leaderboards": leaderboards,
  "./standing": standing,
  "./seo": seo,
  "../lib/benchmarks": benchmarks,
  "../lib/currency": currency,
  "../lib/leaderboards": leaderboards,
  "../lib/standing": standing,
  "../lib/seo": seo,
  "@/lib/benchmarks": benchmarks,
  "@/lib/currency": currency,
  "@/lib/leaderboards": leaderboards,
  "@/lib/standing": standing,
  "@/lib/seo": seo,
})

const { prefersMarkdown } = loadTsModule("../lib/content-negotiation.ts")
const { renderMarkdown } = loadTsModule("../lib/markdown.ts", registry)

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
function checkTrue(label, condition, detail = "") {
  if (condition) {
    console.log(`  ok: '${label}'${detail ? ` (${detail})` : ""}`)
  } else {
    console.error(`  FAIL: '${label}'${detail ? ` (${detail})` : ""}`)
    failures.push(label)
  }
}

// 1. Accept negotiation: Markdown only when it is at least as preferred as HTML.
check("accept-md", prefersMarkdown("text/markdown"), true)
check("accept-md-tie", prefersMarkdown("text/markdown, text/html;q=0.9"), true)
check("accept-md-lower", prefersMarkdown("text/markdown;q=0.5, text/html;q=0.9"), false)
check("accept-html", prefersMarkdown("text/html,application/xhtml+xml,*/*;q=0.8"), false)
check("accept-none", prefersMarkdown(null), false)
check("accept-empty", prefersMarkdown(""), false)

// 2. Markdown documents: real routes render, unknown routes 404 with recovery.
const home = renderMarkdown("/")
check("md-home-status", home.status, 200)
checkTrue("md-home-nonempty", home.body.length > 500, `${home.body.length} chars`)
checkTrue("md-home-title", home.body.startsWith("# ModelRegistry"))
checkTrue("md-home-when-to-use", home.body.includes("When to use ModelRegistry"))
checkTrue("md-home-api-link", home.body.includes(`${site.SITE_URL}/api/v1/models`))

const docs = renderMarkdown("/docs")
check("md-docs-status", docs.status, 200)
checkTrue("md-docs-endpoints", docs.body.includes("/api/v1/changes") && docs.body.includes("/api/markdown"))
checkTrue("md-docs-error-contract", docs.body.includes("model_not_found") && docs.body.includes("Retry-After"))

const flagship = modelsData.find((m) => m.isCompanyFlagship)
const modelDoc = renderMarkdown(`/models/${flagship.id}`)
check("md-model-status", modelDoc.status, 200)
checkTrue("md-model-name", modelDoc.body.includes(flagship.name))
checkTrue("md-model-verification", modelDoc.body.includes(`${flagship.sources.length} primary source`))

const labId = Object.keys(companies)[0]
const labDoc = renderMarkdown(`/companies/${labId}`)
check("md-lab-status", labDoc.status, 200)
checkTrue("md-lab-name", labDoc.body.includes(companies[labId].name))

for (const route of ["/contact", "/privacy", "/about", "/methodology", "/pricing", "/changelog", "/flagships", "/companies", "/cli", "/open-source"]) {
  const doc = renderMarkdown(route)
  checkTrue(`md-${route}-200`, doc.status === 200 && doc.body.length > 300, `${doc.body.length} chars`)
}

const missing = renderMarkdown("/__ora-404-probe-js7krwol")
check("md-404-status", missing.status, 404)
checkTrue("md-404-length", missing.body.length >= 20, `${missing.body.length} chars`)
checkTrue("md-404-docs", missing.body.includes(`${site.SITE_URL}/docs`))
checkTrue("md-404-sitemap", missing.body.includes(`${site.SITE_URL}/sitemap.xml`))
checkTrue("md-404-llms", missing.body.includes(`${site.SITE_URL}/llms.txt`))
check("md-unknown-model-404", renderMarkdown("/models/does-not-exist").status, 404)
check("md-unknown-lab-404", renderMarkdown("/companies/does-not-exist").status, 404)

// Trailing slashes must not change the answer.
check("md-trailing-slash", renderMarkdown("/docs/").status, 200)

// 3. Middleware: Markdown rewrite must be evaluated before the curl shortcut.
const middleware = fs.readFileSync(path.resolve(__dirname, "../middleware.ts"), "utf8")
checkTrue("middleware-markdown", middleware.includes("/api/markdown"))
checkTrue(
  "middleware-markdown-before-curl",
  middleware.indexOf("prefersMarkdown(") >= 0 &&
    middleware.indexOf("prefersMarkdown(") < middleware.indexOf('includes("curl")')
)
// An explicit text/html request must never be answered with the CLI table.
checkTrue("middleware-html-wins-over-curl", middleware.includes("prefersHtml") && middleware.includes("!prefersHtml"))

// 4. JSON error contract: shared helper + catch-all API route.
const apiErrors = fs.readFileSync(path.resolve(__dirname, "../lib/api-errors.ts"), "utf8")
for (const token of ["code", "hint", "docs", "route_not_found", "method_not_allowed"]) {
  checkTrue(`api-error-src-${token}`, apiErrors.includes(token))
}
const catchAll = fs.readFileSync(path.resolve(__dirname, "../app/api/[...path]/route.ts"), "utf8")
checkTrue("api-catchall-json", catchAll.includes("apiError") && catchAll.includes("route_not_found"))
checkTrue("api-root-json", fs.existsSync(path.resolve(__dirname, "../app/api/route.ts")))

// 5. OpenAPI: every operation self-describing, typed, and error-typed.
const openapiPath = path.resolve(__dirname, "../public/openapi.json")
const openapi = JSON.parse(fs.readFileSync(openapiPath, "utf8"))
const operations = []
for (const [routePath, methods] of Object.entries(openapi.paths)) {
  for (const [method, operation] of Object.entries(methods)) {
    operations.push({ routePath, method, operation })
  }
}
checkTrue("openapi-operations", operations.length >= 10, `${operations.length} operations`)

const operationIds = operations.map(({ operation }) => operation.operationId)
checkTrue("openapi-operation-ids-present", operationIds.every((id) => typeof id === "string" && id.length > 0))
checkTrue("openapi-operation-ids-unique", new Set(operationIds).size === operationIds.length)
checkTrue(
  "openapi-descriptions",
  operations.every(({ operation }) => typeof operation.description === "string" && operation.description.length > 40)
)

function schemaRefFor(response) {
  if (!response) return null
  if (response.$ref) {
    const name = response.$ref.split("/").pop()
    return openapi.components.responses[name]
  }
  return response
}

const typingProblems = operations.filter(({ operation }) => {
  const ok = responseSchemaTypes(operation.responses?.["200"])
  return !ok
})
checkTrue(
  "openapi-typed-200s",
  typingProblems.length === 0,
  `${operations.length - typingProblems.length}/${operations.length} typed`
)

function responseSchemaTypes(response) {
  const resolved = schemaRefFor(response)
  const content = resolved?.content
  if (!content) return false
  return Object.values(content).every((media) => {
    if (!media || !media.schema) return false
    // Typed = a $ref to a component schema, or an explicit type.
    return Boolean(media.schema.$ref || media.schema.type)
  })
}

const errorResponses = operations.flatMap(({ operation, routePath, method }) =>
  Object.entries(operation.responses ?? {})
    .filter(([status]) => Number(status) >= 400)
    .map(([status, response]) => ({ routePath, method, status, response }))
)
checkTrue("openapi-error-responses", errorResponses.length > 0, `${errorResponses.length} documented`)
checkTrue(
  "openapi-errors-typed",
  errorResponses.every(({ response }) => {
    const resolved = schemaRefFor(response)
    const content = resolved?.content
    if (!content || Object.keys(content).length === 0) return true
    // Non-JSON errors (the Markdown 404 body) are legitimately not ErrorResponse.
    const json = content["application/json"]
    if (!json) return true
    return Boolean(json.schema && json.schema.$ref && json.schema.$ref.endsWith("/ErrorResponse"))
  })
)
checkTrue("openapi-error-schema", Boolean(openapi.components.schemas.ErrorResponse))
checkTrue(
  "openapi-error-codes",
  Array.isArray(openapi.components.schemas.ErrorResponse.properties.code.enum) &&
    openapi.components.schemas.ErrorResponse.properties.code.enum.includes("route_not_found")
)

// Rate-limit headers documented and advertised on the main list endpoint.
checkTrue("openapi-rate-limit-header", Boolean(openapi.components.headers.RateLimit))
checkTrue(
  "openapi-list-rate-headers",
  Boolean(
    openapi.paths["/api/v1/models"].get.responses["200"].headers?.RateLimit &&
      openapi.paths["/api/v1/models"].get.responses["200"].headers?.["X-RateLimit-Limit"]
  )
)
checkTrue("openapi-429", Boolean(openapi.components.responses.TooManyRequests))
checkTrue(
  "openapi-429-retry-after",
  Boolean(openapi.components.responses.TooManyRequests.headers?.["Retry-After"])
)

// 6. Organization schema completeness (contactPoint + address).
const entities = fs.readFileSync(path.resolve(__dirname, "../lib/entities.ts"), "utf8")
checkTrue("org-contact-point", entities.includes("contactPoint") && entities.includes("ContactPoint"))
checkTrue("org-contact-type", entities.includes("contactType"))
checkTrue("org-address", entities.includes("PostalAddress") && entities.includes("addressCountry"))
checkTrue("org-knows-about", entities.includes("knowsAbout") && entities.includes("keywords"))

// 7. Agent instructions: when-to-use lives in llms.txt and the skill.
const llms = fs.readFileSync(path.resolve(__dirname, "../app/llms.txt/route.ts"), "utf8")
for (const token of ["When to use ModelRegistry", "How an agent should call it", "text/markdown", "/openapi.json", "/contact", "/privacy", "/open-source", "/api/mcp"]) {
  checkTrue(`llms-${token.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`, llms.includes(token))
}
const skills = fs.readFileSync(path.resolve(__dirname, "../lib/skills.ts"), "utf8")
checkTrue("skill-when-to-use", skills.includes("When to use this skill"))
checkTrue("skill-error-codes", skills.includes("model_not_found") && skills.includes("Retry-After"))
const skillsIndex = fs.readFileSync(path.resolve(__dirname, "../app/api/agent-skills/route.ts"), "utf8")
checkTrue("skills-index-when-to-use", /description:[\s\S]{0,200}Use when/.test(skillsIndex))

// 8. Trust anchors: contact and privacy exist, are linked, and are in the sitemap.
checkTrue("page-contact", fs.existsSync(path.resolve(__dirname, "../app/contact/page.tsx")))
checkTrue("page-privacy", fs.existsSync(path.resolve(__dirname, "../app/privacy/page.tsx")))
const contactSrc = fs.readFileSync(path.resolve(__dirname, "../app/contact/page.tsx"), "utf8")
const privacySrc = fs.readFileSync(path.resolve(__dirname, "../app/privacy/page.tsx"), "utf8")
checkTrue("contact-content-length", contactSrc.length > 2000, `${contactSrc.length} chars`)
checkTrue("privacy-content-length", privacySrc.length > 2000, `${privacySrc.length} chars`)
const sitemap = fs.readFileSync(path.resolve(__dirname, "../app/sitemap.ts"), "utf8")
checkTrue("sitemap-contact", sitemap.includes("/contact"))
checkTrue("sitemap-privacy", sitemap.includes("/privacy"))
const footer = fs.readFileSync(path.resolve(__dirname, "../components/footer.tsx"), "utf8")
checkTrue("footer-contact", footer.includes('href="/contact"'))
checkTrue("footer-privacy", footer.includes('href="/privacy"'))
// Open-source page: existence, sitemap, and footer sync, same contract as the trust anchors.
checkTrue("page-open-source", fs.existsSync(path.resolve(__dirname, "../app/open-source/page.tsx")))
const openSourceSrc = fs.readFileSync(path.resolve(__dirname, "../app/open-source/page.tsx"), "utf8")
checkTrue("open-source-honest-fallback", openSourceSrc.includes("unavailable right now"))
checkTrue("sitemap-open-source", sitemap.includes("/open-source"))
checkTrue("footer-open-source", footer.includes('href="/open-source"'))
checkTrue("markdown-open-source", fs.readFileSync(path.resolve(__dirname, "../lib/markdown.ts"), "utf8").includes('"/open-source"'))
// GitHub webhook refresh: push events must actually clear the caches the page reads.
const refreshSrc = fs.readFileSync(path.resolve(__dirname, "../app/api/github-refresh/route.ts"), "utf8")
checkTrue("refresh-revalidates-page", refreshSrc.includes("revalidatePath") && refreshSrc.includes('"/open-source"'))
checkTrue("refresh-revalidates-tag", refreshSrc.includes("revalidateTag") && refreshSrc.includes('"github-repo"'))
checkTrue("repo-fetch-tagged", fs.readFileSync(path.resolve(__dirname, "../lib/github.ts"), "utf8").includes('tags: ["github-repo"]'))
// MCP server: tool logic and endpoint stay paired; the docs reference and openapi list it.
checkTrue("page-mcp-endpoint", fs.existsSync(path.resolve(__dirname, "../app/api/mcp/route.ts")))
checkTrue("mcp-tools-module", fs.existsSync(path.resolve(__dirname, "../lib/mcp.ts")))
const mcpToolsSrc = fs.readFileSync(path.resolve(__dirname, "../lib/mcp.ts"), "utf8")
for (const tool of ["list_models", "get_model", "list_labs", "get_changes", "get_health", "read_page_markdown"]) {
  checkTrue(`mcp-tool-${tool}`, mcpToolsSrc.includes(`name: "${tool}"`) || mcpToolsSrc.includes(`'${tool}'`))
}
checkTrue("mcp-resources-exported", mcpToolsSrc.includes("export const RESOURCE_LIST") && (mcpToolsSrc.includes("export function readResource") || mcpToolsSrc.includes("export async function readResource")))
checkTrue("mcp-landing-module", fs.existsSync(path.resolve(__dirname, "../lib/mcp-landing.ts")))
checkTrue("mcp-prompts-exported", mcpToolsSrc.includes("export const PROMPT_LIST") && mcpToolsSrc.includes("export function getPrompt"))
checkTrue("well-known-mcp", fs.existsSync(path.resolve(__dirname, "../app/.well-known/mcp/route.ts")))

// 9. Rate-limit headers are actually emitted by the server config.
const nextConfig = fs.readFileSync(path.resolve(__dirname, "../next.config.mjs"), "utf8")
checkTrue("config-rate-limit", nextConfig.includes("RateLimit") && nextConfig.includes("X-RateLimit-Limit"))
checkTrue("config-rate-limit-source", nextConfig.includes('source: "/api/:path*"'))

// 10. The docs page names the product and API in its title and heading.
const docsSrc = fs.readFileSync(path.resolve(__dirname, "../app/docs/page.tsx"), "utf8")
checkTrue("docs-title-product", /title:\s*"ModelRegistry API Reference/.test(docsSrc))
checkTrue("docs-h1-product", docsSrc.includes("ModelRegistry API Reference"))
checkTrue("docs-mcp-section", docsSrc.includes('id="mcp"') && docsSrc.includes("/api/mcp"))
const openapiFull = fs.readFileSync(path.resolve(__dirname, "../public/openapi.json"), "utf8")
checkTrue("openapi-mcp-path", openapiFull.includes("/api/mcp") && openapiFull.includes("mcpRpc"))

// 11. The new test runs from pnpm test.
const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../package.json"), "utf8"))
checkTrue("pnpm-test-includes-agent-readiness", pkg.scripts.test.includes("test-agent-readiness.js"))

// 12. CLI: a real packaged client, documented where an agent will look.
const cliPkgPath = path.resolve(__dirname, "../cli/package.json")
checkTrue("cli-package-exists", fs.existsSync(cliPkgPath))
if (fs.existsSync(cliPkgPath)) {
  const cliPkg = JSON.parse(fs.readFileSync(cliPkgPath, "utf8"))
  checkTrue("cli-bin", cliPkg.bin?.modelregistry === "./index.mjs", JSON.stringify(cliPkg.bin))
  checkTrue("cli-not-private", cliPkg.private !== true)
  checkTrue("cli-zero-deps", !cliPkg.dependencies)
}
const cliEntry = path.resolve(__dirname, "../cli/index.mjs")
checkTrue("cli-entry-shebang", fs.existsSync(cliEntry) && fs.readFileSync(cliEntry, "utf8").startsWith("#!/usr/bin/env node"))
checkTrue("cli-package-test-script", pkg.scripts.test.includes("test-cli.js"))
checkTrue("cli-in-docs", docsSrc.includes("cli/index.mjs"))
checkTrue("cli-in-llms", llms.includes("Official CLI"))
checkTrue("page-cli", fs.existsSync(path.resolve(__dirname, "../app/cli/page.tsx")))
const cliPage = fs.readFileSync(path.resolve(__dirname, "../app/cli/page.tsx"), "utf8")
checkTrue("cli-page-title-product", /title:\s*"ModelRegistry CLI/.test(cliPage))
checkTrue("cli-page-software-schema", cliPage.includes("SoftwareSourceCode"))
checkTrue("sitemap-cli", sitemap.includes("/cli"))

// 13. Docs reference rail: pinned while reading, released before the footer.
// A `fixed` rail ignores the footer (it paints over it) and cannot be
// constrained by the document column, so the rail must stay `sticky` inside
// its reserved lane and cap its own height on short viewports.
const docsPagePath = path.resolve(__dirname, "../app/docs/page.tsx")
checkTrue("docs-page-exists", fs.existsSync(docsPagePath))
if (fs.existsSync(docsPagePath)) {
  const docsPage = fs.readFileSync(docsPagePath, "utf8")
  const asideClass = (docsPage.match(/<aside className="([^"]+)"/) || [])[1] || ""
  checkTrue("docs-rail-sticky", /\bsticky\b/.test(asideClass), asideClass)
  checkTrue("docs-rail-not-fixed", !/\bfixed\b/.test(asideClass), asideClass)
  checkTrue("docs-rail-lane", asideClass.includes("col-start-1"), asideClass)
  checkTrue("docs-rail-self-start", asideClass.includes("self-start"), asideClass)
  checkTrue("docs-rail-height-cap", asideClass.includes("max-h-["), asideClass)
  checkTrue("docs-rail-inner-scroll", asideClass.includes("overflow-y-auto"), asideClass)
  checkTrue("docs-rail-hidden-below-1440", asideClass.includes("hidden") && asideClass.includes("min-[1440px]:block"), asideClass)
}

const docsNavPath = path.resolve(__dirname, "../components/docs-nav.tsx")
checkTrue("docs-nav-exists", fs.existsSync(docsNavPath))
if (fs.existsSync(docsNavPath)) {
  const docsNavSrc = fs.readFileSync(docsNavPath, "utf8")
  checkTrue("docs-nav-readable-type", docsNavSrc.includes("text-[16px]"), "section links stay at 16px")
  checkTrue("docs-nav-label-type", docsNavSrc.includes("text-[12px]"), "REFERENCE label stays at 12px")
}

if (failures.length > 0) {
  console.error(`\n❌ Agent-readiness failed with ${failures.length} mismatch(es).`)
  process.exit(1)
}
console.log("\n✔ Agent-readiness contracts verified.")
