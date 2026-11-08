// Live route-contract tests. Run in CI (see .github/workflows/ci.yml, routes
// job: build -> serve production on :3100 -> test), or manually:
//   npm run build
//   node node_modules/next/dist/bin/next start -p 3100
//   BASE_URL=http://localhost:3100 pnpm test:routes
// Verifies status codes, redirects, API shapes, the badge XSS guard,
// OG image bytes, payload size, and basic response timing.
//
// Content assertions derive from the live dataset (EXPECTED below) so they
// stay green when models rotate - never hardcode model names, dates, or
// prices in new checks.
const fs = require("fs")
const path = require("path")
const ts = require("typescript")
const vm = require("vm")
const { spawnSync } = require("child_process")
const BASE = process.env.BASE_URL || "http://localhost:3000"

// Expected heartbeat counts derive from the live dataset so this test
// never goes stale when a model or lab is added.
function countDataset() {
  function loadTsModule(relPath) {
    const source = fs.readFileSync(path.resolve(__dirname, relPath), "utf8")
    const transpiled = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText
    const mod = { exports: {} }
    vm.runInContext(transpiled, vm.createContext({ module: mod, exports: mod.exports, require, console }))
    return mod.exports
  }
  const modelsData = loadTsModule("../data/models.ts").modelsData
  const labIds = Object.keys(loadTsModule("../data/companies.ts").companies)
  const sorted = [...modelsData].sort((a, b) => b.releaseDate.localeCompare(a.releaseDate))
  const newest = sorted[0]
  const openaiFlagship = modelsData.find((m) => m.companyId === "openai" && m.isCompanyFlagship)
  // A priced flagship whose "$in/$out" pair fits the fixed CLI column:
  // asserts the full pair survives layout untruncated (over-long values
  // truncate by design, and non-flagships never appear in the table, so
  // only a fitting flagship pair can prove this).
  const pairFits = (m) => `$${m.pricing.input}/$${m.pricing.output}`.length <= 13
  const priceModel =
    modelsData.find((m) => m.pricingUnit && m.isCompanyFlagship && pairFits(m)) ??
    modelsData.find((m) => m.isCompanyFlagship && pairFits(m)) ??
    openaiFlagship
  return {
    models: modelsData.length,
    labs: labIds.length,
    flagships: modelsData.filter((m) => m.isCompanyFlagship).length,
    lastLab: labIds[labIds.length - 1] ?? null,
    openaiFlagship: openaiFlagship?.id ?? null,
    openaiFlagshipName: openaiFlagship?.name ?? null,
    newestId: newest?.id ?? null,
    newestName: newest?.name ?? null,
    // Near-miss slug of a real record: exercises the fuzzy fallback
    // redirect without depending on any retired slug existing.
    nearMissSlug: openaiFlagship ? `${openaiFlagship.id}-v2` : null,
    priceModelId: priceModel?.id ?? openaiFlagship?.id ?? null,
    // Full "$in/$out" pair must survive CLI column layout untruncated.
    pricePair:
      priceModel != null ? `$${priceModel.pricing.input}/$${priceModel.pricing.output}` : null,
    // Rolling window keeps the changes filter exercised whatever today is.
    sinceDate: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
  }
}
const EXPECTED = countDataset()

// Fail fast when the dataset cannot supply a fixture - a clear message here
// beats twenty confusing downstream failures after a data rotation.
for (const key of ["openaiFlagship", "newestId", "nearMissSlug", "priceModelId"]) {
  if (!EXPECTED[key]) {
    console.error(`❌ Route tests need dataset fixture '${key}' - check data/models.ts.`)
    process.exit(1)
  }
}

console.log(`🌐 Testing live routes against ${BASE}...`)

const failures = []
let checked = 0

async function get(path, { redirect = "follow", accept, headers: extraHeaders } = {}) {
  const started = Date.now()
  const headers = { ...(extraHeaders || {}) }
  if (accept) headers.accept = accept
  const res = await fetch(`${BASE}${path}`, { redirect, headers })
  const ms = Date.now() - started
  return { res, ms }
}

function pass(label, detail = "") {
  checked += 1
  console.log(`  ok: '${label}'${detail ? ` (${detail})` : ""}`)
}

function fail(label, detail) {
  checked += 1
  console.error(`  FAIL: '${label}' (${detail})`)
  failures.push(label)
}

async function expectStatus(path, expected, opts) {
  try {
    const { res, ms } = await get(path, opts)
    if (res.status === expected) pass(`${opts?.redirect === "manual" ? "redirect " : ""}${path} -> ${expected}`, `${ms}ms`)
    else fail(`${path}`, `status ${res.status}, expected ${expected}`)
    return res
  } catch (e) {
    fail(path, `fetch failed: ${e.message}`)
    return null
  }
}

async function expectContains(path, snippet, contentTypePart) {
  try {
    const { res, ms } = await get(path)
    const ct = res.headers.get("content-type") || ""
    const body = await res.text()
    if (res.status !== 200) return fail(path, `status ${res.status}`)
    if (contentTypePart && !ct.includes(contentTypePart)) return fail(path, `content-type '${ct}'`)
    if (!body.includes(snippet)) return fail(path, `body missing '${snippet.slice(0, 60)}...'`)
    pass(`${path} contains key content`, `${ms}ms, ${(body.length / 1024).toFixed(1)}KB`)
    return { res, body }
  } catch (e) {
    fail(path, `fetch failed: ${e.message}`)
    return null
  }
}

async function expectPng(path) {
  try {
    const { res, ms } = await get(path)
    const ct = res.headers.get("content-type") || ""
    const buf = Buffer.from(await res.arrayBuffer())
    const magic = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
    const isPng = magic.every((b, i) => buf[i] === b)
    const width = buf.readUInt32BE(16)
    const height = buf.readUInt32BE(20)
    if (res.status !== 200) return fail(path, `status ${res.status}`)
    if (!ct.includes("image/png")) return fail(path, `content-type '${ct}'`)
    if (!isPng) return fail(path, "not PNG bytes")
    if (width !== 1200 || height !== 630) return fail(path, `size ${width}x${height}`)
    if (buf.length < 10 * 1024) return fail(path, `suspiciously small (${buf.length}B)`)
    pass(`${path} valid 1200x630 PNG`, `${ms}ms, ${(buf.length / 1024).toFixed(1)}KB`)
  } catch (e) {
    fail(path, `fetch failed: ${e.message}`)
  }
}

async function main() {
  // Pages
  await expectStatus("/companies", 200)
  await expectStatus("/companies/openai", 200)
  await expectStatus("/companies/nope", 404)
  await expectStatus(`/models/${EXPECTED.openaiFlagship}`, 200)
  await expectStatus(`/models/${EXPECTED.newestId}`, 200)
  await expectStatus("/leaderboard", 200)
  await expectStatus("/timeline", 200)
  await expectStatus("/docs", 200)
  await expectStatus("/cli", 200)
  await expectStatus("/open-source", 200)
  await expectStatus("/api/mcp", 200) // landing page (GET); POST is JSON-RPC

  // Fuzzy fallback: a near-miss slug of a real record redirects (307) to the
  // owning lab's flagship (manual: assert target, no follow).
  const redir = await expectStatus(`/models/${EXPECTED.nearMissSlug}`, 307, { redirect: "manual" })
  if (redir) {
    const loc = redir.headers.get("location") || ""
    if (EXPECTED.openaiFlagship && loc.endsWith(`/models/${EXPECTED.openaiFlagship}`))
      pass("retired slug target", loc)
    else fail("retired slug target", `location '${loc}'`)
  }
  await expectStatus("/models/pro", 404)

  // Content spot-checks (all subjects derived from live data above)
  await expectContains("/companies/openai", EXPECTED.openaiFlagshipName, "text/html")
  await expectContains("/docs", "?company=", "text/html")
  await expectContains("/cli", "ModelRegistry CLI", "text/html")
  await expectContains("/sitemap.xml", "/companies/openai", "xml")
  await expectContains("/sitemap.xml", "/docs", "xml")
  await expectContains("/rss.xml", EXPECTED.newestName, "xml")
  await expectContains("/llms.txt", `/companies/${EXPECTED.lastLab}`, "text/plain")
  await expectContains("/llms-full.txt", EXPECTED.newestName, "text/plain")

  // ---- Agent readiness: negotiation, JSON errors, rate-limit publication ----
  // These are the machine-facing contracts summarised in llms.txt, /docs,
  // OpenAPI and the README. They are asserted against a real response, never
  // against source text, because headers and status codes are the contract.

  // Homepage Markdown negotiation (acceptmarkdown.com): Markdown body, correct
  // content type, and Vary: Accept so caches keep the variants apart.
  try {
    const { res, ms } = await get("/", { accept: "text/markdown" })
    const ct = res.headers.get("content-type") || ""
    const vary = (res.headers.get("vary") || "").toLowerCase()
    const body = await res.text()
    if (res.status === 200 && ct.includes("text/markdown") && vary.includes("accept") && body.length > 200) {
      pass("homepage markdown negotiation", `${ms}ms, ${(body.length / 1024).toFixed(1)}KB, vary '${vary}'`)
    } else {
      fail("homepage markdown negotiation", `status ${res.status}, ct '${ct}', vary '${vary}', ${body.length}B`)
    }
  } catch (e) {
    fail("homepage markdown negotiation", `fetch failed: ${e.message}`)
  }

  // Homepage HTML must stay HTML. The UA is set to a curl string because the
  // terminal shortcut rewrites curl user agents to the plain-text CLI table -
  // an explicit Accept: text/html has to win over that.
  for (const [uaLabel, ua] of [
    ["browser", `Mozilla/5.0 (compatible; route-test)`],
    ["curl", "curl/8.5.0"],
  ]) {
    try {
      const { res } = await get("/", { accept: "text/html", headers: { "user-agent": ua } })
      const ct = res.headers.get("content-type") || ""
      if (res.status === 200 && ct.includes("text/html")) pass(`homepage html (${uaLabel} ua)`)
      else fail(`homepage html (${uaLabel} ua)`, `status ${res.status}, ct '${ct}'`)
    } catch (e) {
      fail(`homepage html (${uaLabel} ua)`, e.message)
    }
  }

  // The terminal shortcut survives for a bare curl request.
  try {
    const { res } = await get("/", { headers: { "user-agent": "curl/8.5.0" } })
    const text = await res.text()
    if (res.status === 200 && text.startsWith("====")) pass("bare curl root -> cli table")
    else fail("bare curl root", `status ${res.status}, first line '${text.split("\n")[0]}'`)
  } catch (e) {
    fail("bare curl root", e.message)
  }

  // Markdown 404: a real 404 with a parseable body that links the recovery docs.
  try {
    const { res } = await get("/__ora-404-probe-js7krwol", { accept: "text/markdown" })
    const ct = res.headers.get("content-type") || ""
    const body = await res.text()
    const links = ["/docs", "/sitemap.xml", "/llms.txt"].every((p) => body.includes(p))
    if (res.status === 404 && ct.includes("text/markdown") && body.length > 20 && links) {
      pass("markdown 404 body", `${body.length}B with docs/sitemap/llms links`)
    } else {
      fail("markdown 404 body", `status ${res.status}, ct '${ct}', ${body.length}B, links=${links}`)
    }
  } catch (e) {
    fail("markdown 404 body", e.message)
  }
  try {
    const { res } = await get("/__ora-404-probe-js7krwol", { accept: "text/html" })
    const ct = res.headers.get("content-type") || ""
    if (res.status === 404 && ct.includes("text/html")) pass("html 404 unchanged")
    else fail("html 404 unchanged", `status ${res.status}, ct '${ct}'`)
  } catch (e) {
    fail("html 404 unchanged", e.message)
  }

  // Direct Markdown endpoint (documented fallback, both forms).
  for (const probe of ["/api/markdown?path=/docs", "/api/markdown/docs"]) {
    try {
      const { res } = await get(probe)
      const ct = res.headers.get("content-type") || ""
      const body = await res.text()
      if (res.status === 200 && ct.includes("text/markdown") && body.includes("ModelRegistry API Reference")) {
        pass(`markdown endpoint ${probe}`)
      } else {
        fail(`markdown endpoint ${probe}`, `status ${res.status}, ct '${ct}'`)
      }
    } catch (e) {
      fail(`markdown endpoint ${probe}`, e.message)
    }
  }

  // Unknown API path: JSON 404 with code, hint, docs and the endpoint list.
  try {
    const { res } = await get("/api/v1/nope")
    const ct = res.headers.get("content-type") || ""
    const body = await res.json()
    const ok =
      res.status === 404 &&
      ct.includes("application/json") &&
      body.status === "error" &&
      body.code === "route_not_found" &&
      typeof body.hint === "string" &&
      typeof body.docs === "string" &&
      Array.isArray(body.endpoints)
    if (ok) pass("unknown api path -> json 404", body.code)
    else fail("unknown api path", `status ${res.status}, ct '${ct}', body ${JSON.stringify(body).slice(0, 120)}`)
  } catch (e) {
    fail("unknown api path", e.message)
  }

  // Read-only enforcement: JSON 405 with an Allow header.
  try {
    const res = await fetch(`${BASE}/api/v1/models`, { method: "POST" })
    const ct = res.headers.get("content-type") || ""
    const allow = res.headers.get("allow") || ""
    const body = await res.json()
    if (res.status === 405 && ct.includes("application/json") && allow.includes("GET") && body.code === "method_not_allowed") {
      pass("POST /api/v1/models -> json 405", allow)
    } else {
      fail("POST /api/v1/models", `status ${res.status}, allow '${allow}', code '${body.code}'`)
    }
  } catch (e) {
    fail("POST /api/v1/models", e.message)
  }

  // Rate-limit publication (RFC RateLimit hints + X-RateLimit mirror).
  for (const path of ["/api/v1/models", "/api/check-updates"]) {
    try {
      const { res } = await get(path)
      const rateLimit = res.headers.get("ratelimit") || ""
      const policy = res.headers.get("ratelimit-policy") || ""
      const limit = res.headers.get("x-ratelimit-limit") || ""
      if (rateLimit.includes("r=600") && policy && limit === "600") pass(`${path} rate-limit headers`)
      else fail(`${path} rate-limit headers`, `RateLimit '${rateLimit}', Policy '${policy}', X-RateLimit-Limit '${limit}'`)
    } catch (e) {
      fail(`${path} rate-limit headers`, e.message)
    }
  }

  // Model 404 keeps its machine-readable code, hint and ETag-less error shape.
  try {
    const { res } = await get("/api/v1/models/nope-not-real")
    const body = await res.json()
    if (res.status === 404 && body.code === "model_not_found" && typeof body.hint === "string") {
      pass("model 404 has code + hint", body.code)
    } else {
      fail("model 404 code", `status ${res.status}, code '${body.code}'`)
    }
  } catch (e) {
    fail("model 404 code", e.message)
  }

  // Invalid query input: typed 400.
  try {
    const { res } = await get("/api/v1/changes?since=last-week")
    const body = await res.json()
    if (res.status === 400 && body.code === "invalid_date") pass("changes bad date -> json 400", body.code)
    else fail("changes bad date code", `status ${res.status}, code '${body.code}'`)
  } catch (e) {
    fail("changes bad date code", e.message)
  }

  // OpenAPI: served, parseable, self-describing, error-typed.
  try {
    const { res } = await get("/openapi.json")
    const ct = res.headers.get("content-type") || ""
    const spec = await res.json()
    const ops = Object.values(spec.paths).flatMap((methods) => Object.values(methods))
    const ids = ops.map((op) => op.operationId)
    const uniqueIds = new Set(ids).size === ids.length && ids.every(Boolean)
    const errorSchema = Boolean(spec.components?.schemas?.ErrorResponse)
    const retryAfter = Boolean(spec.components?.responses?.TooManyRequests?.headers?.["Retry-After"])
    const rateLimit = Boolean(spec.components?.headers?.RateLimit)
    if (res.status === 200 && ct.includes("application/json") && uniqueIds && errorSchema && retryAfter && rateLimit) {
      pass("openapi.json self-describing", `${ops.length} operations, ${ids.length} operationIds`)
    } else {
      fail("openapi.json", `status ${res.status}, ids=${uniqueIds}, errors=${errorSchema}, retry=${retryAfter}, ratelimit=${rateLimit}`)
    }
  } catch (e) {
    fail("openapi.json", e.message)
  }

  // Agent Skills discovery index, served at the well-known URI.
  try {
    const { res } = await get("/.well-known/agent-skills/index.json")
    const ct = res.headers.get("content-type") || ""
    const body = await res.json()
    const skill = body.skills?.[0]
    if (res.status === 200 && ct.includes("application/json") && skill?.description?.includes("Use when")) {
      pass("agent-skills index", skill.name)
    } else {
      fail("agent-skills index", `status ${res.status}, ct '${ct}'`)
    }
  } catch (e) {
    fail("agent-skills index", e.message)
  }

  // Trust anchors: real pages, linked from the footer and listed in the sitemap.
  for (const path of ["/contact", "/privacy", "/open-source"]) {
    try {
      const { res } = await get(path, { accept: "text/html" })
      const body = await res.text()
      const text = body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")
      if (res.status === 200 && text.length > 500) pass(`${path} trust page`, `${text.length} chars of text`)
      else fail(`${path} trust page`, `status ${res.status}, ${text.length} chars`)
    } catch (e) {
      fail(`${path} trust page`, e.message)
    }
  }

  // MCP server (POST-only JSON-RPC, stateless): initialize handshake,
  // tools/list schema, tools/call round trip, and the honest error contract.
  // Each call is a real transport exchange, not a source-text assertion.
  async function mcpPost(body) {
    return fetch(`${BASE}/api/mcp`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(body),
    })
  }
  try {
    const res = await mcpPost({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {} } })
    const envelope = await res.json()
    const ok =
      res.status === 200 &&
      envelope.jsonrpc === "2.0" &&
      envelope.id === 1 &&
      envelope.result?.serverInfo?.name === "modelregistry" &&
      envelope.result?.protocolVersion === "2025-06-18" &&
      typeof envelope.result?.capabilities?.tools === "object"
    if (ok) pass("mcp initialize", envelope.result.serverInfo.version)
    else fail("mcp initialize", `status ${res.status}, ${JSON.stringify(envelope).slice(0, 120)}`)
  } catch (e) {
    fail("mcp initialize", e.message)
  }
  try {
    const res = await mcpPost({ jsonrpc: "2.0", id: 2, method: "tools/list" })
    const envelope = await res.json()
    const tools = envelope.result?.tools
    const named = new Set((tools ?? []).map((t) => t.name))
    const complete = ["list_models", "get_model", "list_labs", "get_changes", "get_health", "read_page_markdown"].every((n) => named.has(n))
    const shaped = (tools ?? []).every((t) => t.inputSchema?.type === "object" && typeof t.description === "string")
    if (res.status === 200 && complete && shaped) pass("mcp tools/list", `${tools.length} tools, schemas ok`)
    else fail("mcp tools/list", `status ${res.status}, complete=${complete}, shaped=${shaped}`)
  } catch (e) {
    fail("mcp tools/list", e.message)
  }
  try {
    const res = await mcpPost({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: { name: "get_model", arguments: { id: EXPECTED.openaiFlagship } },
    })
    const envelope = await res.json()
    const text = String(envelope.result?.content?.[0]?.text ?? "")
    const record = JSON.parse(text)
    if (res.status === 200 && !envelope.result?.isError && record.model?.id === EXPECTED.openaiFlagship) {
      pass("mcp tools/call get_model", record.model.name)
    } else {
      fail("mcp tools/call get_model", `status ${res.status}, isError=${envelope.result?.isError}, text=${text.slice(0, 80)}`)
    }
  } catch (e) {
    fail("mcp tools/call get_model", e.message)
  }
  try {
    const res = await mcpPost({
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: { name: "get_model", arguments: { id: "nor-this-model-exists-42kx" } },
    })
    const envelope = await res.json()
    const payload = JSON.parse(String(envelope.result?.content?.[0]?.text ?? "{}"))
    if (res.status === 200 && envelope.result?.isError === true && payload.code === "model_not_found" && typeof payload.hint === "string") {
      pass("mcp unknown model -> code + hint inside isError", payload.code)
    } else {
      fail("mcp unknown model", `status ${res.status}, ${String(envelope.result?.content?.[0]?.text ?? "").slice(0, 120)}`)
    }
  } catch (e) {
    fail("mcp unknown model", e.message)
  }
  try {
    const res = await mcpPost({ jsonrpc: "2.0", id: 5, method: "tools/call", params: { name: "does_not_exist" } })
    const envelope = await res.json()
    if (res.status === 200 && envelope.error?.code === -32602 && Array.isArray(envelope.error?.data)) {
      pass("mcp unknown tool -> json-rpc -32602", envelope.error.data.join(","))
    } else {
      fail("mcp unknown tool", `status ${res.status}, error ${JSON.stringify(envelope.error)}`)
    }
  } catch (e) {
    fail("mcp unknown tool", e.message)
  }
  try {
    const res = await mcpPost({ jsonrpc: "2.0", method: "notifications/initialized" })
    if (res.status === 202) pass("mcp notification -> 202")
    else fail("mcp notification", `status ${res.status}`)
  } catch (e) {
    fail("mcp notification", e.message)
  }
  try {
    const res = await fetch(`${BASE}/api/mcp`, {
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        // curl UA variant: the browser shortcut at "/" must never leak here
        "user-agent": "curl/8.5.0",
      },
      body: "not json",
      method: "POST",
    })
    const envelope = await res.json()
    if (res.status === 200 && envelope.error?.code === -32700) pass("mcp parse error -> json-rpc -32700")
    else fail("mcp parse error", `status ${res.status}, error ${JSON.stringify(envelope.error)}`)
  } catch (e) {
    fail("mcp parse error", e.message)
  }

  try {
    const res = await mcpPost({ jsonrpc: "2.0", id: 6, method: "resources/list" })
    const envelope = await res.json()
    const resources = envelope.result?.resources ?? []
    if (res.status === 200 && resources.length >= 6 && resources.every((r) => r.uri && (r.mimeType === "text/markdown" || r.mimeType === "text/plain"))) {
      pass("mcp resources/list", `${resources.length} resources`)
    } else {
      fail("mcp resources/list", `status ${res.status}, ${resources.length} resources`)
    }
  } catch (e) {
    fail("mcp resources/list", e.message)
  }
  try {
    const res = await mcpPost({ jsonrpc: "2.0", id: 7, method: "resources/read", params: { uri: "modelregistry://docs" } })
    const envelope = await res.json()
    const text = String(envelope.result?.contents?.[0]?.text ?? "")
    if (res.status === 200 && text.includes("ModelRegistry API Reference") && text.length > 1000) {
      pass("mcp resources/read docs", `${text.length} chars`)
    } else {
      fail("mcp resources/read docs", `status ${res.status}, ${text.length} chars`)
    }
  } catch (e) {
    fail("mcp resources/read docs", e.message)
  }
  try {
    const res = await mcpPost({ jsonrpc: "2.0", id: 8, method: "resources/read", params: { uri: "modelregistry://page/models/" + EXPECTED.openaiFlagship } })
    const envelope = await res.json()
    const text = String(envelope.result?.contents?.[0]?.text ?? "")
    if (res.status === 200 && text.includes(EXPECTED.openaiFlagshipName)) {
      pass("mcp resources/read model page", EXPECTED.openaiFlagshipName)
    } else {
      fail("mcp resources/read model page", `status ${res.status}, ${text.slice(0, 80)}`)
    }
  } catch (e) {
    fail("mcp resources/read model page", e.message)
  }
  try {
    const res = await mcpPost({ jsonrpc: "2.0", id: 9, method: "prompts/list" })
    const envelope = await res.json()
    const prompts = envelope.result?.prompts ?? []
    const names = new Set(prompts.map((p) => p.name))
    if (res.status === 200 && ["registry_overview", "research_model", "compare_models", "incremental_sync"].every((n) => names.has(n))) {
      pass("mcp prompts/list", `${prompts.length} prompts`)
    } else {
      fail("mcp prompts/list", `status ${res.status}, ${prompts.length} prompts`)
    }
  } catch (e) {
    fail("mcp prompts/list", e.message)
  }
  try {
    const res = await mcpPost({ jsonrpc: "2.0", id: 10, method: "prompts/get", params: { name: "research_model", arguments: { id: EXPECTED.openaiFlagship } } })
    const envelope = await res.json()
    const text = String(envelope.result?.messages?.[0]?.content?.text ?? "")
    if (res.status === 200 && text.includes(EXPECTED.openaiFlagship) && text.includes("get_model")) {
      pass("mcp prompts/get research_model", `${text.length} chars`)
    } else {
      fail("mcp prompts/get research_model", `status ${res.status}, ${text.length} chars`)
    }
  } catch (e) {
    fail("mcp prompts/get research_model", e.message)
  }
  try {
    const res = await fetch(`${BASE}/.well-known/mcp`)
    const body = await res.json()
    if (res.status === 200 && typeof body.endpoint === "string" && body.endpoint.endsWith("/api/mcp") && Array.isArray(body.tools) && body.tools.includes("get_model")) {
      pass("well-known mcp discovery", `${body.tools.length} tools`)
    } else {
      fail("well-known mcp discovery", `status ${res.status}`)
    }
  } catch (e) {
    fail("well-known mcp discovery", e.message)
  }
  // llms.txt carries the when-to-use and call-convention guidance.
  try {
    const { res } = await get("/llms.txt")
    const text = await res.text()
    const hasWhen = text.includes("When to use ModelRegistry")
    const hasHow = text.includes("How an agent should call it")
    if (res.status === 200 && hasWhen && hasHow) pass("llms.txt agent instructions")
    else fail("llms.txt agent instructions", `whenToUse=${hasWhen}, howToCall=${hasHow}`)
  } catch (e) {
    fail("llms.txt agent instructions", e.message)
  }

  // API contracts
  const api = await expectContains("/api/v1/models", '"status":"success"', "application/json")
  if (api) {
    const data = JSON.parse(api.body)
    if (data.total === data.models.length) pass("api total matches models.length", `${data.total}`)
    else fail("api total", `${data.total} vs ${data.models.length}`)
    const co = data.companies.find((c) => c.id === "openai")
    if (co && co.page === "/companies/openai") pass("api companies[].page", co.page)
    else fail("api companies[].page", JSON.stringify(co))
    if (data.metadata.docs === "https://modelregistry.tirup.in/docs") pass("api metadata.docs")
    else fail("api metadata.docs", String(data.metadata.docs))
  }
  const flagship = await get("/api/v1/models?company=openai&flagshipOnly=true").then(async ({ res }) => {
    const d = await res.json()
    return d
  }).catch(() => null)
  if (flagship && flagship.total === 1 && flagship.models[0].id === EXPECTED.openaiFlagship) {
    pass("api flagshipOnly filter", `openai -> 1 (${EXPECTED.openaiFlagship})`)
  } else {
    fail("api flagshipOnly filter", JSON.stringify(flagship?.total))
  }
  const empty = await get("/api/v1/models?company=nope").then(async ({ res }) => res.json()).catch(() => null)
  if (empty && empty.total === 0 && Array.isArray(empty.models)) pass("api unknown company -> empty 200")
  else fail("api unknown company", JSON.stringify(empty?.total))
  const video = await get("/api/v1/models?category=video").then(async ({ res }) => res.json()).catch(() => null)
  if (video && video.total > 0 && video.models.every((m) => m.category === "video")) {
    pass("api category=video filter", `${video.total} models`)
  } else {
    fail("api category=video filter", JSON.stringify(video?.total))
  }

  // Single-model endpoint: one record without the full payload.
  try {
    const { res } = await get(`/api/v1/models/${EXPECTED.openaiFlagship}`)
    const one = await res.json()
    if (res.status === 200 && one.status === "success" && one.model?.id === EXPECTED.openaiFlagship) {
      pass("api single model", `${(JSON.stringify(one).length / 1024).toFixed(1)}KB`)
    } else {
      fail("api single model", `status ${res.status}`)
    }
    if (res.headers.get("etag")) pass("api single model etag")
    else fail("api single model etag", "missing ETag")
  } catch (e) {
    fail(`/api/v1/models/${EXPECTED.openaiFlagship}`, e.message)
  }
  try {
    const { res } = await get("/api/v1/models/nope-not-real")
    const body = await res.json()
    if (res.status === 404 && body.status === "error") pass("api unknown model -> 404 json")
    else fail("api unknown model", `status ${res.status}`)
  } catch (e) {
    fail("api unknown model probe", e.message)
  }

  // Changelog diff endpoint: incremental sync without the full payload.
  try {
    const { res } = await get(`/api/v1/changes?since=${EXPECTED.sinceDate}`)
    const ch = await res.json()
    if (res.status === 200 && ch.status === "success" && Array.isArray(ch.changes) && ch.total >= ch.returned) {
      pass("api changes since filter", `total ${ch.total}`)
    } else {
      fail("api changes since filter", `status ${res.status}`)
    }
  } catch (e) {
    fail("/api/v1/changes", e.message)
  }
  try {
    const { res } = await get("/api/v1/changes?since=last-week")
    if (res.status === 400) pass("api changes bad date -> 400")
    else fail("api changes bad date", `status ${res.status}`)
  } catch (e) {
    fail("api changes bad date probe", e.message)
  }

  // CLI table: fixed-width columns must stay aligned, lab names untruncated,
  // prices complete, and the curl view must carry an edge-cacheable TTL.
  try {
    const { res } = await get("/api/v1/cli")
    const text = await res.text()
    const cc = res.headers.get("cache-control") || ""
    const rows = text.split("\n").filter((l) => /^ \d{2}  /.test(l))
    const widths = new Set(rows.map((r) => r.length))
    if (res.status === 200 && rows.length === EXPECTED.labs && widths.size === 1) {
      pass("cli flagship rows aligned", `${rows.length} rows x ${[...widths][0]} cols`)
    } else {
      fail("cli flagship rows aligned", `${rows.length} rows (expected ${EXPECTED.labs}), widths ${[...widths].join(",")}`)
    }
    const rowText = rows.join("\n")
    if (!rowText.includes("Alibaba Cloud (Qw") && rowText.includes("Alibaba (Qwen)")) {
      pass("cli lab name shortened")
    } else {
      fail("cli lab name shortened", "long lab name truncated mid-word")
    }
    if (text.includes(EXPECTED.pricePair)) pass("cli full per-second price", EXPECTED.pricePair)
    else fail("cli full per-second price", `pair '${EXPECTED.pricePair}' truncated`)
    if (/[^\x00-\x7F]/.test(rows.join("\n"))) fail("cli rows ascii-only", "wide char in fixed columns")
    else pass("cli rows ascii-only")
    if (cc.includes("s-maxage=3600")) pass("cli edge cache ttl", cc)
    else fail("cli edge cache ttl", `'${cc}'`)
  } catch (e) {
    fail("/api/v1/cli table", e.message)
  }

  // Health heartbeat reflects the live dataset
  try {
    const { res } = await get("/api/check-updates")
    const h = await res.json()
    if (h.trackedLabsCount === EXPECTED.labs && h.trackedModelsCount === EXPECTED.models) {
      pass("heartbeat counts live", `${h.trackedLabsCount} labs / ${h.trackedModelsCount} models`)
    } else {
      fail("heartbeat counts", `${h.trackedLabsCount} labs / ${h.trackedModelsCount} models (expected ${EXPECTED.labs} / ${EXPECTED.models})`)
    }
  } catch (e) {
    fail("/api/check-updates", e.message)
  }

  // Badge XSS guard: injected markup must come back escaped, never raw.
  // A payload containing a literal '/' (e.g. </script>) 404s at the routing
  // layer - also safe (fail-closed) - so probe without one to reach handler.
  // The handler uppercases the company text, so compare case-insensitively.
  try {
    const { res } = await get("/api/badge/%3Cscript%3Ealert(1)%3C")
    const body = await res.text()
    const escapedPresent = /&lt;script&gt;/i.test(body)
    if (res.status === 200 && !body.includes("<script>") && escapedPresent) {
      pass("badge company param escaped")
    } else {
      fail("badge company param escaped", `status ${res.status}, escaped=${escapedPresent}`)
    }
  } catch (e) {
    fail("badge xss probe", e.message)
  }
  try {
    const slashProbe = await get("/api/badge/%3Cscript%3Ealert(1)%3C/script%3E", { redirect: "manual" })
    if (slashProbe.res.status === 404) pass("badge slash payload fail-closed (404)")
    else if (slashProbe.res.status === 200) fail("badge slash payload", "raw path slash served - check route guard")
    else pass("badge slash payload fail-closed", `status ${slashProbe.res.status}`)
  } catch (e) {
    fail("badge slash probe", e.message)
  }
  await expectStatus("/api/badge/openai", 200)
  await expectStatus(`/api/badge?model=${EXPECTED.priceModelId}&type=pricing`, 200)
  await expectContains("/api/agent-prompt", "ModelRegistry", "text/plain")

  // OG cards render real PNGs (model, lab, default)
  await expectPng(`/api/og?model=${EXPECTED.openaiFlagship}`)
  await expectPng("/api/og?lab=openai")
  await expectPng("/api/og")

  // Official CLI (cli/): the packaged client must work against this build, not
  // just against production. Each call is a real child process.
  function runCli(args) {
    return spawnSync(
      process.execPath,
      [path.resolve(__dirname, "../cli/index.mjs"), ...args, "--base-url", BASE],
      { encoding: "utf8", timeout: 30_000 }
    )
  }
  try {
    const result = runCli(["models", "--flagship-only", "--json"])
    const data = JSON.parse(result.stdout || "null")
    if (result.status === 0 && data?.total === EXPECTED.flagships && data.models.every((m) => m.isCompanyFlagship)) {
      pass("cli models --flagship-only", `${data.total} flagships`)
    } else {
      fail("cli models --flagship-only", `exit ${result.status}, ${(result.stderr || "").trim()}`)
    }
  } catch (e) {
    fail("cli models --flagship-only", e.message)
  }
  try {
    const result = runCli(["model", EXPECTED.openaiFlagship, "--json"])
    const data = JSON.parse(result.stdout || "null")
    if (result.status === 0 && data?.model?.id === EXPECTED.openaiFlagship) {
      pass("cli model <id>", data.model.id)
    } else {
      fail("cli model <id>", `exit ${result.status}, ${(result.stderr || "").trim()}`)
    }
  } catch (e) {
    fail("cli model <id>", e.message)
  }
  try {
    const result = runCli(["markdown", "/docs"])
    if (result.status === 0 && (result.stdout || "").includes("ModelRegistry API Reference")) {
      pass("cli markdown /docs")
    } else {
      fail("cli markdown /docs", `exit ${result.status}, ${(result.stderr || "").trim()}`)
    }
  } catch (e) {
    fail("cli markdown /docs", e.message)
  }
  try {
    const result = runCli(["health", "--json"])
    const data = JSON.parse(result.stdout || "null")
    if (result.status === 0 && data?.trackedModelsCount === EXPECTED.models) {
      pass("cli health", `${data.trackedModelsCount} models`)
    } else {
      fail("cli health", `exit ${result.status}, ${(result.stderr || "").trim()}`)
    }
  } catch (e) {
    fail("cli health", e.message)
  }
  try {
    const result = runCli(["model", "definitely-not-a-model"])
    const stderr = result.stderr || ""
    if (result.status === 1 && stderr.includes("model_not_found") && stderr.includes("hint:")) {
      pass("cli API error surfaces code + hint")
    } else {
      fail("cli API error", `exit ${result.status}, ${stderr.trim().slice(0, 80)}`)
    }
  } catch (e) {
    fail("cli API error", e.message)
  }

  // Payload + timing budget for the heaviest JSON endpoint
  try {
    const { res, ms } = await get("/api/v1/models")
    const body = await res.text()
    const kb = body.length / 1024
    console.log(`  info: /api/v1/models payload ${kb.toFixed(1)}KB in ${ms}ms`)
    if (kb < 1024) pass("api payload under 1MB budget", `${kb.toFixed(1)}KB`)
    else fail("api payload budget", `${kb.toFixed(1)}KB >= 1MB - add pagination`)
  } catch (e) {
    fail("api payload probe", e.message)
  }

  console.log(`\n${checked - failures.length}/${checked} route checks passed.`)
  if (failures.length > 0) {
    console.error(`❌ Route tests failed: ${failures.join(", ")}`)
    process.exit(1)
  }
  console.log("✔ All live route contracts verified.")
}

main()
