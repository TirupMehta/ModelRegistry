/**
 * ModelRegistry MCP tool implementations (transport-independent logic).
 *
 * The JSON-RPC endpoint at /api/mcp dispatches `tools/call` onto the handlers
 * in this module. Every handler reads the same dataset modules the REST API
 * routes read, so the MCP tools and the OpenAPI contract cannot drift: one
 * dataset revision feeds both. Output shaping only trims the fat
 * `list_models` response - nothing factual is invented on this layer.
 */

import { companies, type Company } from "@/data/companies"
import { modelsData, type ModelItem } from "@/data/models"
import { datasetRevision } from "@/data/revision"
import { renderMarkdown } from "@/lib/markdown"

export type McpToolResult = { text: string; isError: boolean }

type JsonSchema = {
  type: "object"
  properties: Record<string, { type: "string" | "number" | "boolean"; description: string }>
  required: string[]
  additionalProperties: false
}

export const PROTOCOL_VERSIONS = ["2025-06-18", "2025-03-26", "2024-11-05"] as const

export const SERVER_INFO = {
  name: "modelregistry",
  title: "ModelRegistry",
  version: "1.0.0",
} as const

export const SERVER_INSTRUCTIONS = `Open, source-linked registry of frontier AI model specifications.

You have 6 tools and read-only access to every page as Markdown resources.

TOOLS
- list_models(company?, category?, openWeights?, flagshipOnly?, latestOnly?): filtered records. Trimmed output (id, name, version, lab, release date, flagship/latest flags, category, context, output limit, parameters, openWeights, license, pricing, modalities, benchmarks, highlight, sources, lastVerifiedAt). Use get_model for the full record.
- get_model(id): one full record including per-field source citations and the dated changelog. Prefer this when you have an id.
- list_labs(): every tracked laboratory with record count, flagship, and latest checkpoint.
- get_changes(since, until?, company?, model?, limit?): dated changelog entries, newest first, for incremental sync. Fetch only changed records via get_model afterward.
- get_health(): dataset version, coverage, oldest source-review date. Data facts only.
- read_page_markdown(path): any page as Markdown ('/', '/docs', '/about', '/methodology', '/open-source', '/cli', '/models/{id}', ...).

RESOURCES
- Fixed: modelregistry://home, /docs, /about, /methodology, /open-source, /cli, /contact, /privacy
- Template: modelregistry://page/{+path} reads any page (e.g. modelregistry://page/models/gpt-6-1-sol).

HOW TO ANSWER
- Cite the model page URL and datasetVersion. Record ids are stable kebab-case.
- Specification figures are lab-reported unless a cited source states otherwise; benchmarks are never independently reproduced.
- lastVerifiedAt is the date a source was reviewed, not a live availability signal. Dataset revision dates never substitute for field verification.
- There is no "partially verified" badge: sources and the last-checked date are shown directly.
- Retired records stay for history; provider availability may have changed.
- Unverified records can never carry flagship or latest labels.
- An unmapped model is not unavailable: provider coverage is OpenRouter-only and explicit.

DISCOVERY
- Human reference: https://modelregistry.tirup.in/docs
- OpenAPI 3.1: https://modelregistry.tirup.in/openapi.json
- Compact agent guide: https://modelregistry.tirup.in/llms.txt
- Exhaustive matrix: https://modelregistry.tirup.in/llms-full.txt
- Open source activity: https://modelregistry.tirup.in/open-source
- JSON API: https://modelregistry.tirup.in/api/v1/models
- Health: https://modelregistry.tirup.in/api/check-updates`

export const TOOL_LIST: Array<{ name: string; description: string; inputSchema: JsonSchema }> = [
  {
    name: "list_models",
    description: `List frontier AI model records with lab-reported specifications.
Filters mirror GET ${"https://modelregistry.tirup.in"}/api/v1/models. Output is trimmed;
call get_model for the full record including per-field source citations.`,
    inputSchema: {
      type: "object",
      properties: {
        company: { type: "string", description: "Lab id filter, e.g. 'openai'; case-insensitive." },
        category: {
          type: "string",
          description: "One of: flagship, reasoning, audio, open-weights, multimodal, code, image, video.",
        },
        openWeights: { type: "boolean", description: "Keep only open-weight records when true." },
        flagshipOnly: { type: "boolean", description: "Keep only primary flagships (at most one per lab) when true." },
        latestOnly: { type: "boolean", description: "Keep only newest released checkpoints when true." },
      },
      required: [],
      additionalProperties: false,
    },
  },
  {
    name: "get_model",
    description:
      "Fetch ONE full model record by its stable kebab-case id: specifications, pricing, modalities, lab-reported benchmarks, primary sources with per-field citations, and the dated changelog. Prefer this over list_models when the id is known.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Stable kebab-case record id, e.g. 'gpt-6-1-sol'." },
      },
      required: ["id"],
      additionalProperties: false,
    },
  },
  {
    name: "list_labs",
    description: "List every tracked laboratory with its record count and current flagship and latest checkpoint.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
      additionalProperties: false,
    },
  },
  {
    name: "get_changes",
    description: `Registry changelog entries (dated revision history, newest first) for incremental sync.
Mirrors GET ${"https://modelregistry.tirup.in"}/api/v1/changes. Then use get_model to fetch only the changed records.`,
    inputSchema: {
      type: "object",
      properties: {
        since: { type: "string", description: "Inclusive lower bound, YYYY-MM-DD." },
        until: { type: "string", description: "Inclusive upper bound, YYYY-MM-DD." },
        company: { type: "string", description: "Lab id filter." },
        model: { type: "string", description: "Model id filter." },
        limit: { type: "number", description: "Max entries, 1-500, default 100." },
      },
      required: ["since"],
      additionalProperties: false,
    },
  },
  {
    name: "get_health",
    description:
      "Dataset heartbeat: dataset version, revision date, coverage counts, and the oldest per-record source review date. Reports data facts only - never availability or correctness guarantees.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
      additionalProperties: false,
    },
  },
  {
    name: "read_page_markdown",
    description:
      "Read a ModelRegistry page as Markdown: '/' (guide), '/docs' (API reference), '/about', '/methodology', '/cli', or any page path such as '/models/<id>'.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: 'Route path beginning with "/", e.g. "/docs".' },
      },
      required: ["path"],
      additionalProperties: false,
    },
  },
]

/** The 2025-06-18 MCP revision removed batching. */
export type JsonRpcRequest = {
  jsonrpc: "2.0"
  id?: number | string | null
  method: string
  params?: Record<string, unknown>
}

function json(value: unknown): string {
  return JSON.stringify(value, null, 2)
}

/* --------------------------------------------------------------- helpers */

type ModelArgs = {
  company?: unknown
  category?: unknown
  openWeights?: unknown
  flagshipOnly?: unknown
  latestOnly?: unknown
}

/** Mirrors GET /api/v1/models filter params - keep in sync with that route. */
function applyModelFilters(args: ModelArgs, source: readonly ModelItem[]): ModelItem[] {
  let filtered = [...source]
  if (typeof args.company === "string" && args.company.length > 0) {
    const needle = args.company.toLowerCase()
    filtered = filtered.filter((m) => m.companyId.toLowerCase() === needle)
  }
  if (typeof args.category === "string" && args.category.length > 0) {
    const needle = args.category.toLowerCase()
    filtered = filtered.filter((m) => m.category.toLowerCase() === needle)
  }
  if (args.openWeights === true) filtered = filtered.filter((m) => m.openWeights)
  else if (args.openWeights === false) filtered = filtered.filter((m) => !m.openWeights)
  if (args.flagshipOnly === true) filtered = filtered.filter((m) => m.isCompanyFlagship)
  if (args.latestOnly === true) filtered = filtered.filter((m) => m.isLatestCheckpoint)
  return filtered
}

/** Trimmed projection for list output; no field is dropped from its meaning. */
function trimModel(model: ModelItem) {
  return {
    id: model.id,
    name: model.name,
    version: model.version,
    companyId: model.companyId,
    companyName: model.companyName,
    releaseDate: model.releaseDate,
    isCompanyFlagship: model.isCompanyFlagship,
    isLatestCheckpoint: model.isLatestCheckpoint,
    category: model.category,
    categoryLabel: model.categoryLabel,
    contextWindow: model.contextWindow,
    maxOutputTokens: model.maxOutputTokens,
    parameters: model.parameters,
    openWeights: model.openWeights,
    license: model.license,
    pricing: model.pricing,
    pricingUnit: model.pricingUnit,
    modalities: model.modalities,
    benchmarks: model.benchmarks,
    highlight: model.highlight,
    sources: model.sources.map((s) => ({ title: s.title, publisher: s.publisher, url: s.url, accessedAt: s.accessedAt })),
    lastVerifiedAt: model.lastVerifiedAt,
    page: `https://modelregistry.tirup.in/models/${model.id}`,
  }
}

function labSummary(company: Company) {
  const owned = modelsData.filter((m) => m.companyId === company.id)
  const flagship = owned.find((m) => m.isCompanyFlagship)
  const checkpoint = owned.find((m) => m.isLatestCheckpoint && !m.isCompanyFlagship)
  return {
    id: company.id,
    name: company.name,
    records: owned.length,
    flagship: flagship ? { id: flagship.id, name: flagship.name, releaseDate: flagship.releaseDate, page: `https://modelregistry.tirup.in/models/${flagship.id}` } : null,
    latestCheckpoint: checkpoint ? { id: checkpoint.id, name: checkpoint.name, releaseDate: checkpoint.releaseDate } : null,
    page: `https://modelregistry.tirup.in/companies/${company.id}`,
  }
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function isValidDate(value: string): boolean {
  return DATE_RE.test(value) && !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime())
}

/* --------------------------------------------------------------- tool run */

function toolErrorResult(code: string, message: string, hint: string): McpToolResult {
  // A missing record is a tool-level outcome, not a protocol error: the client
  // gets machine-readable code + hint inside isError content, identical to
  // the REST error contract (4xx + code).
  return { isError: true, text: json({ code, message, hint }) }
}

/**
 * Dispatch a tools/call. `args` is the raw JSON name/args pair - argument
 * validation happens here so unknown names fail with a protocol-grade -32602.
 */
export async function callTool(name: string, args: Record<string, unknown> | undefined): Promise<McpToolResult> {
  const params = args ?? {}

  switch (name) {
    case "list_models": {
      const filtered = applyModelFilters(params as ModelArgs, modelsData)
      return {
        isError: false,
        text: json({
          status: "success",
          total: filtered.length,
          updatedAt: datasetRevision.revisedAt,
          datasetVersion: datasetRevision.datasetVersion,
          note: "Trimmed records - call get_model with an id for the full record with per-field citations.",
          models: filtered.map(trimModel),
        }),
      }
    }

    case "get_model": {
      const id = params.id
      if (typeof id !== "string" || id.length === 0) {
        return toolErrorResult(
          "invalid_params",
          "'id' must be a non-empty string.",
          "Try list_models first, or pass a stable kebab-case id such as 'gpt-6-1-sol'."
        )
      }
      const model = modelsData.find((m) => m.id === id)
      if (!model) {
        return toolErrorResult(
          "model_not_found",
          `No record with id '${id}'.`,
          "Ids are stable kebab-case; list them with list_models (e.g. company='anthropic'). Unknown ids do not fuzz here."
        )
      }
      return {
        isError: false,
        text: json({
          status: "success",
          datasetVersion: datasetRevision.datasetVersion,
          updatedAt: datasetRevision.revisedAt,
          model: {
            ...model,
            page: `https://modelregistry.tirup.in/models/${model.id}`,
            methodology: "https://modelregistry.tirup.in/methodology",
          },
        }),
      }
    }

    case "list_labs": {
      const labs = Object.values(companies).map(labSummary)
      return {
        isError: false,
        text: json({
          status: "success",
          total: labs.length,
          updatedAt: datasetRevision.revisedAt,
          datasetVersion: datasetRevision.datasetVersion,
          labs,
        }),
      }
    }

    case "get_changes": {
      const since = params.since
      if (typeof since !== "string" || !isValidDate(since)) {
        return toolErrorResult(
          "invalid_params",
          `'since' must be a valid YYYY-MM-DD date (got ${JSON.stringify(since) ?? "undefined"}).`,
          "Inclusive lower bound, e.g. '2026-11-01'."
        )
      }
      const untilRaw = params.until
      if (untilRaw !== undefined && (typeof untilRaw !== "string" || !isValidDate(untilRaw))) {
        return toolErrorResult("invalid_params", `'until' must be a valid YYYY-MM-DD date (got ${JSON.stringify(untilRaw)}).`, "Optional inclusive upper bound.")
      }
      const until = typeof untilRaw === "string" ? untilRaw : null
      if (until !== null && since > until) {
        return toolErrorResult("invalid_params", `'since' (${since}) must not be after 'until' (${until}).`, "Lower the 'until' value or drop it.")
      }
      const MAX_LIMIT = 500
      const DEFAULT_LIMIT = 100
      let limit = DEFAULT_LIMIT
      if (params.limit !== undefined) {
        const parsed =
          typeof params.limit === "number" ? params.limit : Number.parseInt(String(params.limit), 10)
        if (!Number.isInteger(parsed) || parsed < 1) {
          return toolErrorResult("invalid_params", "'limit' must be an integer >= 1.", "1-500; the default is 100.")
        }
        limit = Math.min(parsed, MAX_LIMIT)
      }
      const entries = modelsData.flatMap((m) =>
        m.changeLog.map((e) => ({
          date: e.date,
          summary: e.summary,
          sources: e.sources,
          modelId: m.id,
          modelName: m.name,
          companyId: m.companyId,
          companyName: m.companyName,
          page: `https://modelregistry.tirup.in/models/${m.id}`,
        }))
      )
      let filtered = entries
      filtered = filtered.filter((e) => e.date >= since)
      if (until !== null) filtered = filtered.filter((e) => e.date <= until)
      if (typeof params.company === "string" && params.company.length > 0) {
        const needle = params.company.toLowerCase()
        filtered = filtered.filter((e) => e.companyId.toLowerCase() === needle)
      }
      if (typeof params.model === "string" && params.model.length > 0) {
        const needle = params.model.toLowerCase()
        filtered = filtered.filter((e) => e.modelId.toLowerCase() === needle)
      }
      filtered.sort((a, b) => b.date.localeCompare(a.date) || a.modelName.localeCompare(b.modelName))
      const changes = filtered.slice(0, limit)
      return {
        isError: false,
        text: json({
          status: "success",
          total: filtered.length,
          returned: changes.length,
          limit,
          since,
          until,
          updatedAt: datasetRevision.revisedAt,
          datasetVersion: datasetRevision.datasetVersion,
          changes,
        }),
      }
    }

    case "get_health": {
      const oldest = modelsData.reduce(
        (acc, m) => (!acc || m.lastVerifiedAt < acc ? m.lastVerifiedAt : acc),
        ""
      )
      const retired = modelsData.filter((m) => m.verificationStatus === "retired").length
      return {
        isError: false,
        text: json({
          status: "success",
          generatedAt: new Date().toISOString(),
          datasetVersion: datasetRevision.datasetVersion,
          datasetLastChangedAt: datasetRevision.revisedAt,
          trackedModelsCount: modelsData.length,
          trackedLabsCount: Object.keys(companies).length,
          retiredModelCount: retired,
          oldestVerificationDate: oldest,
          note: "Dates are source-review dates. This heartbeat says nothing about live provider availability - check /api/check-updates for that probe.",
        }),
      }
    }

    case "read_page_markdown": {
      const path = params.path
      if (typeof path !== "string" || !path.startsWith("/")) {
        return toolErrorResult(
          "invalid_params",
          `'path' must be a route path beginning with "/" (got ${JSON.stringify(path) ?? "undefined"}).`,
          "Examples: '/', '/docs', '/models/gpt-6-1-sol'."
        )
      }
      // Only widths that exist in the registry render: a bogus path is a
      // route_not_found - honest tool outcome, not an HTML page dump.
      const doc = renderMarkdown(path)
      if (doc.status === 404) {
        return toolErrorResult(
          "route_not_found",
          `No page at '${path}'.`,
          "Model pages live at /models/{id}; see https://modelregistry.tirup.in/llms.txt for the route list."
        )
      }
      return {
        isError: false,
        text: doc.body,
      }
    }

    default:
      // Unknown tool names surface as -32602 from the endpoint wrapper.
      throw new Error(`Unknown tool '${name}'.`)
  }
}

/* --------------------------------------------------------------- resources */

const FIXED_RESOURCES: Array<{ uri: string; path: string; name: string; description: string }> = [
  { uri: "modelregistry://home", path: "/", name: "Home", description: "Registry guide, when to use it, and call conventions." },
  { uri: "modelregistry://docs", path: "/docs", name: "API reference", description: "Full REST contract, endpoints, errors, versioning." },
  { uri: "modelregistry://about", path: "/about", name: "About", description: "What ModelRegistry is, who maintains it, how records are verified." },
  { uri: "modelregistry://methodology", path: "/methodology", name: "Methodology", description: "Inclusion rules, source standards, verification levels." },
  { uri: "modelregistry://open-source", path: "/open-source", name: "Open source", description: "Latest pushes, contributors, merged PRs, how to contribute." },
  { uri: "modelregistry://cli", path: "/cli", name: "CLI", description: "Terminal client commands and plain-text routes." },
  { uri: "modelregistry://contact", path: "/contact", name: "Contact", description: "Channels for corrections, security reports, enquiries." },
  { uri: "modelregistry://privacy", path: "/privacy", name: "Privacy", description: "What the site stores (very little)." },
]

export const RESOURCE_LIST = FIXED_RESOURCES.map((r) => ({
  uri: r.uri,
  name: r.name,
  description: r.description,
  mimeType: "text/markdown" as const,
}))

export const RESOURCE_TEMPLATES = [
  {
    uriTemplate: "modelregistry://page/{+path}",
    name: "Any page as Markdown",
    description: "Read any ModelRegistry page by route path, e.g. modelregistry://page/models/gpt-6-1-sol.",
    mimeType: "text/markdown" as const,
  },
]

export function readResource(uri: string): { contents: Array<{ uri: string; mimeType: string; text: string }> } | null {
  const fixed = FIXED_RESOURCES.find((r) => r.uri === uri)
  if (fixed) {
    const doc = renderMarkdown(fixed.path)
    if (doc.status !== 200) return null
    return { contents: [{ uri, mimeType: "text/markdown", text: doc.body }] }
  }
  const prefix = "modelregistry://page/"
  if (uri.startsWith(prefix)) {
    const rest = uri.slice(prefix.length)
    if (rest.length === 0) return null
    const path = rest.startsWith("/") ? rest : `/${rest}`
    const doc = renderMarkdown(path)
    if (doc.status !== 200) return null
    return { contents: [{ uri, mimeType: "text/markdown", text: doc.body }] }
  }
  return null
}
