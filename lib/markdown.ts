import { companies } from "@/data/companies"
import { modelsData } from "@/data/models"
import { datasetRevision } from "@/data/revision"
import { SITE_NAME, SITE_URL } from "@/lib/site"
import { REPO_URL } from "@/lib/github"
import { formatPrice } from "@/lib/utils"
import {
  AGREEMENT_LABEL,
  CONTESTED_SPREAD,
  MIN_TESTS_FOR_STANDING,
  STANDING_VERSION,
  buildStanding,
} from "@/lib/standing"
import { LEADERBOARD_VERSION, MIN_COHORT_SIZE, leaderboardStats, positionsFor } from "@/lib/leaderboards"
import { splitLineup } from "@/lib/currency"
import { TIE_MARGIN_POINTS, buildBestAnswers } from "@/lib/best"
import { buildComparison, compareHref, resolveComparison } from "@/lib/seo"

/**
 * Markdown representations of the public site, served through
 * /api/markdown and reached by content negotiation (see middleware.ts).
 *
 * Rules:
 * - Every document is derived from the live dataset, never hand-copied, so a
 *   model added today appears in the Markdown view without a second edit.
 * - Unknown paths get a real 404 with a recovery block. The recovery block
 *   names the docs, sitemap and llms.txt so an agent can recover without
 *   guessing URLs.
 * - These documents mirror the HTML pages. They never carry facts the HTML
 *   page does not, and they keep the same honest verification language.
 */

export type MarkdownDocument = {
  status: number
  body: string
}

const REVISED_LABEL = formatLongDate(datasetRevision.revisedAt)

function formatLongDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

function pageUrl(path: string): string {
  return path === "/" ? SITE_URL : `${SITE_URL}${path}`
}

function cell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\s*\n\s*/g, " ").trim()
}

function table(headers: string[], rows: string[][]): string {
  const head = `| ${headers.map(cell).join(" | ")} |`
  const rule = `| ${headers.map(() => "---").join(" | ")} |`
  const body = rows.map((r) => `| ${r.map(cell).join(" | ")} |`).join("\n")
  return [head, rule, body].filter(Boolean).join("\n")
}

function pricingLabel(m: (typeof modelsData)[number]): string {
  return formatPrice(m)
}

const DATASET_FACTS = (() => {
  const oldestVerificationDate = modelsData.reduce(
    (acc, m) => (!acc || m.lastVerifiedAt < acc ? m.lastVerifiedAt : acc),
    ""
  )
  return { labs: Object.keys(companies).length, oldestVerificationDate }
})()

/** Shared tail for page documents: where to find the rest of the site. */
const RESOURCE_LINKS = `- Human page: {PAGE}
- API reference: ${SITE_URL}/docs
- OpenAPI description: ${SITE_URL}/openapi.json
- Sitemap: ${SITE_URL}/sitemap.xml
- llms.txt: ${SITE_URL}/llms.txt
- JSON API: ${SITE_URL}/api/v1/models`

function resourceLinks(path: string): string {
  return RESOURCE_LINKS.replace("{PAGE}", pageUrl(path))
}

function frontMatter(title: string, description: string): string {
  return `# ${title}

${description}`
}

function flagshipsTable(): string {
  const rows = modelsData
    .filter((m) => m.isCompanyFlagship)
    .sort((a, b) => Object.keys(companies).indexOf(a.companyId) - Object.keys(companies).indexOf(b.companyId))
    .map((m) => [
      m.companyName,
      `[${m.name}](${SITE_URL}/models/${m.id})`,
      m.releaseDate,
      m.contextWindowTokens > 0 ? m.contextWindow : "n/a (non-token)",
      pricingLabel(m),
    ])
  return table(["Laboratory", "Flagship", "Released", "Context", "Pricing"], rows)
}

function homeDocument(): MarkdownDocument {
  const { oldestVerificationDate } = DATASET_FACTS
  const newest = [...modelsData].sort((a, b) => b.releaseDate.localeCompare(a.releaseDate))[0]
  const body = `# ${SITE_NAME} - frontier AI model registry

${SITE_NAME} is an open, source-linked registry of frontier AI model specifications:
context window, parameters, pricing, modalities, license, release date, and the
benchmarks each laboratory reports. Every record carries its sources, per-field citations, and a last-verified date.

- Dataset revision: ${datasetRevision.datasetVersion} (data revised ${REVISED_LABEL})
- Coverage: ${modelsData.length} models across ${DATASET_FACTS.labs} laboratories
- Verification: all ${modelsData.length} models cite primary sources with per-field citations; oldest source check ${oldestVerificationDate}
- Newest record: ${newest ? `${newest.name} (${newest.companyName}), released ${newest.releaseDate}` : "none"}
- License: MIT (open data)
- Newest-first release feed: ${SITE_URL}/rss.xml

## When to use ModelRegistry

Use it when you need structured, source-linked facts about public frontier models:

- Compare context windows, prices, modalities, or licenses across laboratories.
- Resolve a laboratory's current primary flagship, or its newest checkpoint.
- Fetch one model record by stable id without downloading the full registry.
- Poll a changelog diff instead of re-reading every lab announcement page.

Do not use it for model weights, training runs, inference, or artifact
versioning. It is not an MLOps model registry.

## Primary flagship per laboratory

${flagshipsTable()}

## Machine-readable access

- \`GET ${SITE_URL}/api/v1/models\` - full registry as JSON (filters: company, category, openWeights, flagshipOnly, latestOnly)
- \`GET ${SITE_URL}/api/v1/models/{id}\` - one record, stable kebab-case id
- \`GET ${SITE_URL}/api/v1/models/{id}/providers\` - current OpenRouter listings for mapped models
- \`GET ${SITE_URL}/api/v1/changes?since=YYYY-MM-DD\` - changelog diff for incremental sync
- \`GET ${SITE_URL}/api/v1/snapshot\` - versioned full-dataset download
- \`GET ${SITE_URL}/llms.txt\` - compact per-lab summary
- \`GET ${SITE_URL}/llms-full.txt\` - exhaustive field matrix
- \`GET ${SITE_URL}/api/check-updates\` - dataset counts and verification snapshot
- \`POST ${SITE_URL}/api/mcp\` - MCP server endpoint (JSON-RPC 2.0, stateless; tools: list_models, get_model, list_labs, get_changes, get_health, read_page_markdown)

All of the above are free, unauthenticated, and read-only. Send
\`Accept: text/markdown\` to any HTML route for the Markdown version.

## Human pages

- Flagships: ${SITE_URL}/flagships
- Laboratories: ${SITE_URL}/companies
- Leaderboard: ${SITE_URL}/leaderboard
- Pricing comparison: ${SITE_URL}/pricing
- Context windows: ${SITE_URL}/context
- Open weights and licenses: ${SITE_URL}/licenses
- Modalities: ${SITE_URL}/modalities
- Release timeline: ${SITE_URL}/timeline
- Changelog: ${SITE_URL}/changelog
- Retired models: ${SITE_URL}/retired
- Methodology: ${SITE_URL}/methodology
- Editorial policy: ${SITE_URL}/editorial-policy
- About: ${SITE_URL}/about
- Contact: ${SITE_URL}/contact
- Privacy: ${SITE_URL}/privacy
- API reference: ${SITE_URL}/docs
- Sitemap: ${SITE_URL}/sitemap.xml
`
  return { status: 200, body }
}

function docsDocument(): MarkdownDocument {
  const labIds = Object.keys(companies).join(", ")
  const body = `# ModelRegistry API Reference

Free, unauthenticated, read-only REST API for the open frontier AI model
registry at ${SITE_URL}. No keys, no signup, no OAuth. Responses carry
\`Access-Control-Allow-Origin: *\`, so browser code can call the API directly.

Base URL: ${SITE_URL}
Machine description: ${SITE_URL}/openapi.json (OpenAPI 3.1)
OpenAPI operation ids map 1:1 to the endpoints below.

## Conventions

- GET and HEAD only. There are no write operations.
- Unknown filter values return HTTP 200 with an empty collection, not an error.
- Ids are stable kebab-case and matched case-insensitively.
- Cache responses: REST and feeds send \`public, s-maxage=3600, stale-while-revalidate=86400\`.
- Rate budget: 600 requests per minute per client, advertised on every API
  response through \`RateLimit\` and \`X-RateLimit-*\` headers. A 429 carries
  \`Retry-After\`; honour it.

## Errors

Errors are JSON, never HTML:

\`\`\`json
{
  "status": "error",
  "error": "Model 'xyz' not found.",
  "code": "model_not_found",
  "hint": "List known ids via GET /api/v1/models.",
  "docs": "${SITE_URL}/docs#errors"
}
\`\`\`

Machine-readable \`code\` values include \`bad_request\`, \`invalid_date\`,
\`invalid_limit\`, \`model_not_found\`, \`route_not_found\`,
\`method_not_allowed\`, \`rate_limited\`, and \`internal_error\`. Branch on
\`code\`; show \`error\` to people; follow \`hint\` to recover.

## GET /api/v1/models

Full registry plus a per-laboratory rollup.

| Parameter | Type | Meaning |
| --- | --- | --- |
| \`company\` | string | Laboratory id: ${labIds} |
| \`category\` | string | flagship, reasoning, open-weights, code, multimodal, audio, image, video |
| \`openWeights\` | "true" \\| "false" | Downloadable weights or proprietary API models |
| \`flagshipOnly\` | "true" \\| "false" | Exactly one primary flagship per laboratory |
| \`latestOnly\` | "true" \\| "false" | Each laboratory's newest shipped checkpoint |
| \`If-None-Match\` | header | ETag from a previous response; 304 when unchanged |

\`\`\`bash
curl -s "${SITE_URL}/api/v1/models?flagshipOnly=true"
\`\`\`

## GET /api/v1/models/{id}

One record without the full payload. Unknown ids return a JSON 404 with a
flagship \`suggestion\` when the slug resolves to one laboratory. Supports
\`If-None-Match\`.

## GET /api/v1/models/{id}/providers

Current OpenRouter endpoint listings, provider prices, and limits for an
explicitly mapped model. This live provider snapshot is separate from
lab-sourced registry facts and does not change their verification status.
\`status\` is \`listed\`, \`unmapped\`, \`no_endpoints\`, or \`lookup_failed\`.

## GET /api/v1/changes

Changelog entries across all records, newest first.

| Parameter | Type | Meaning |
| --- | --- | --- |
| \`since\` | date | Inclusive lower bound, YYYY-MM-DD |
| \`until\` | date | Inclusive upper bound, YYYY-MM-DD |
| \`model\` | string | One record id |
| \`company\` | string | One laboratory id |
| \`limit\` | integer | Default 100, capped at 500 |

Malformed dates or limits return 400 with code \`invalid_date\` or
\`invalid_limit\`.

## GET /api/v1/snapshot

Versioned full-dataset JSON download with a dated filename.

## GET /api/check-updates

Dataset revision, per-status counts, oldest verification date, and an unrelated
upstream reachability heartbeat. Poll no more than once every five minutes.

## GET /api/v1/cli

Fixed-width plain-text flagships table for terminals.

## Feeds and machine-readable files

- \`/rss.xml\` - RSS 2.0, newest first
- \`/feed.json\` - JSON Feed 1.1
- \`/llms.txt\` - compact per-lab summary
- \`/llms-full.txt\` - exhaustive field matrix
- \`/openapi.json\` - OpenAPI 3.1 description

## Agent access

- Send \`Accept: text/markdown\` to any HTML route, including \`/\`, for Markdown.
- Or call \`${SITE_URL}/api/markdown?path=/\` directly (substitute any path).
- Discovery index: \`/.well-known/agent-skills/index.json\`
- Skill file: \`/skills/query-modelregistry/SKILL.md\`
- 404 responses in Markdown include a recovery block with valid URLs.
`
  return { status: 200, body }
}

function modelDocument(id: string): MarkdownDocument | null {
  const model = modelsData.find((m) => m.id.toLowerCase() === id.toLowerCase())
  if (!model) return null

  const benchEntries = Object.entries(model.benchmarks ?? {})
  const sourceLines =
    model.sources.length > 0
      ? model.sources
          .map((s) => `- [${s.title}](${s.url}) - ${s.publisher}, ${s.sourceType}, accessed ${s.accessedAt}`)
          .join("\n")
      : "- No source recorded yet."

  const body = `# ${model.name} - ${model.companyName}

${model.highlight}

| Field | Value |
| --- | --- |
| Record id | \`${model.id}\` |
| Laboratory | ${model.companyName} (\`${model.companyId}\`) |
| Released | ${model.releaseDate} |
| Category | ${model.categoryLabel} |
| Primary flagship | ${model.isCompanyFlagship ? "yes" : "no"} |
| Latest checkpoint | ${model.isLatestCheckpoint ? "yes" : "no"} |
| Context window | ${model.contextWindow} |
| Max output | ${model.maxOutputTokens} |
| Parameters | ${model.parameters} |
| Pricing | ${formatPrice(model)} |
| License | ${model.license} |
| Modalities | ${model.modalities.join(", ")} |
| Sources | ${model.sources.length} primary source${model.sources.length === 1 ? "" : "s"} (last checked ${model.lastVerifiedAt}) |

${benchEntries.length > 0 ? `## Lab-reported benchmarks\n\n${table(["Benchmark", "Score"], benchEntries.map(([k, v]) => [k, v]))}\n` : "## Benchmarks\n\nNo benchmark figures published for this record.\n"}
## Sources

${sourceLines}

## Links

- Human page: ${SITE_URL}/models/${model.id}
- JSON record: ${SITE_URL}/api/v1/models/${model.id}
- Provider listings: ${SITE_URL}/api/v1/models/${model.id}/providers
- Laboratory page: ${SITE_URL}/companies/${model.companyId}
- Changelog: ${SITE_URL}/changelog

Benchmark figures are lab-reported, not independently reproduced. Cite the
linked primary source for the number itself.
`
  return { status: 200, body }
}

function companyDocument(id: string): MarkdownDocument | null {
  const company = companies[id]
  if (!company) return null
  const owned = modelsData
    .filter((m) => m.companyId === company.id)
    .sort((a, b) => b.releaseDate.localeCompare(a.releaseDate))

  const rows = owned.map((m) => [
    `[${m.name}](${SITE_URL}/models/${m.id})`,
    m.releaseDate,
    m.categoryLabel,
    m.isCompanyFlagship ? "flagship" : m.isLatestCheckpoint ? "latest checkpoint" : "tracked",
    m.contextWindowTokens > 0 ? m.contextWindow : "n/a",
    pricingLabel(m),
  ])

  const body = `# ${company.name}

${company.description}

- Laboratory id: \`${company.id}\`
- Website: ${company.website}
- Headquarters: ${company.headquarters}
- Tracked records: ${owned.length}
- Human page: ${SITE_URL}/companies/${company.id}
- JSON filter: ${SITE_URL}/api/v1/models?company=${company.id}

## Tracked models

${table(["Model", "Released", "Category", "Role", "Context", "Pricing"], rows)}
`
  return { status: 200, body }
}

function listDocument(
  path: string,
  title: string,
  lead: string,
  headers: string[],
  rows: string[][],
  extra = ""
): MarkdownDocument {
  const body = `${frontMatter(title, lead)}

${table(headers, rows)}
${extra}
${resourceLinks(path)}
`
  return { status: 200, body }
}

const STATIC_PAGES: Record<string, () => MarkdownDocument> = {
  "/": homeDocument,
  "/docs": docsDocument,
  "/score": scoreDocument,
  "/best": bestDocument,
  "/trust": trustDocument,
  "/about": () => ({
    status: 200,
    body: `${frontMatter(
      "About ModelRegistry",
      `${SITE_NAME} is an open registry of frontier AI model specifications: context
window, parameter count, release date, pricing, modalities, license, and the
benchmarks each laboratory reports, with links to the primary source behind
every field.

It exists so one question - what are the current flagship models, and what do
they actually do? - does not require reading a dozen announcement pages, a
pricing table, and three changelogs.

## What it is not

The phrase "model registry" also names MLOps tooling. MLflow, SageMaker and
Vertex AI registries store the artifacts a team trained itself, with versions,
stages and deployment hooks. ModelRegistry does not store weights, run training,
or host inference. It indexes what AI labs publish about public frontier models.

## Who maintains it

The project is maintained by Tirup Mehta. Source code, dataset and source audit
are public at https://github.com/TirupMehta/ModelRegistry. Corrections go through
the suggestion form and maintainer review; a generated issue never publishes a
record on its own. See ${SITE_URL}/contact for reachable channels.

## How current is it

Dataset ${datasetRevision.datasetVersion}, revised ${REVISED_LABEL}, covering
${modelsData.length} models across ${DATASET_FACTS.labs} laboratories. Each record
carries its own last-verified date, which is a source-review date, not a live
availability signal.`
    )}

${resourceLinks("/about")}
`,
  }),
  "/methodology": () => ({
    status: 200,
    body: `${frontMatter(
      "Methodology",
      `How records enter the registry, what each verification status means, and how
benchmark figures are attributed.

- **Inclusion**: a model is tracked when a laboratory publishes it and at least
  one primary source documents its release.
- **Sources**: every record cites the primary sources it was read from
  (announcement, model card, API docs, pricing page) with per-field citations
  showing which source supports which fact.
- **Last-verified date**: the date those sources were reviewed. It is a
  source-review date, not a live availability claim.
- **Retired**: the laboratory has withdrawn or superseded the model; the
  record stays for history.
- There is no public "partially verified" badge: a label that applies to
  almost every record says nothing, so sources and the last-checked date are
  shown directly instead.
- **Benchmarks** are lab-reported unless a model page says otherwise. Figures
  from different harness versions or test conditions are not directly
  comparable and are never used to crown a universal winner.`
    )}

${resourceLinks("/methodology")}
`,
  }),
  "/editorial-policy": () => ({
    status: 200,
    body: `${frontMatter(
      "Editorial policy",
      `${SITE_NAME} separates lab-published specifications from live provider offers.
Corrections are versioned in each record's changelog with the date and, where
available, the source that justified the change.

- Claims must trace to a primary source the reviewer could open.
- A price is attributed to the laboratory or provider that publishes it; a
  provider listing never silently overwrites a lab specification.
- A correction that removes a claim is recorded, not erased.
- Contributions are suggestions until a maintainer reviews them.`
    )}

${resourceLinks("/editorial-policy")}
`,
  }),
  "/open-source": () => ({
    status: 200,
    body: `${frontMatter(
      "Open source",
      `The registry is MIT licensed and developed in public. The dataset records,
the site source, the CLI, and the agent skills all live in one repository -
what the community sees is what runs in production.

- Repository: ${REPO_URL}
- License: MIT (see LICENSE in the repository)
- Commit history: ${REPO_URL}/commits/main
- Contributor graph: ${REPO_URL}/graphs/contributors
- Merged pull requests: ${REPO_URL}/pulls?q=is%3Apr+is%3Amerged
- Human page with live pushes, contributors, and merged PRs: ${SITE_URL}/open-source

## How to contribute

- **Add a model**: open an issue at ${REPO_URL}/issues or use the suggestion
  form at ${SITE_URL}/suggest. Every fact needs a primary source you actually
  opened (announcement, model card, API pricing page, or weights repository).
- **Correct a record**: use the data-correction template -
  ${REPO_URL}/issues/new?template=data-correction.yml
- **Code, docs, or feeds**: open an issue or pull request; run \`pnpm test\`
  first - it validates the schema and keeps every surface in sync.
- **Security reports**: never a public issue. Follow
  ${REPO_URL}/blob/main/SECURITY.md.

A generated issue never publishes a record: maintainer review and source
checks are required before anything appears in the dataset.`
    )}

${resourceLinks("/open-source")}
`,
  }),
  "/contact": () => ({
    status: 200,
    body: `${frontMatter(
      "Contact ModelRegistry",
      `Use these channels for the specific job you have. There is no phone line and
no sales team.

- **Data corrections and missing models**: open an issue at
  https://github.com/TirupMehta/ModelRegistry/issues, or use
  ${SITE_URL}/suggest. Include the model, the field, and the primary source.
- **Security reports**: follow the security policy at
  https://github.com/TirupMehta/ModelRegistry/blob/main/SECURITY.md. Do not file
  a public issue for a vulnerability.
- **Everything else** (collaboration, press, attribution): LinkedIn
  https://www.linkedin.com/in/TirupMehta or GitHub
  https://github.com/TirupMehta.
- **Privacy and data requests**: see ${SITE_URL}/privacy.

Typical response time is a few days. There is no guaranteed service level.`
    )}

${resourceLinks("/contact")}
`,
  }),
  "/privacy": () => ({
    status: 200,
    body: `${frontMatter(
      "Privacy policy",
      `This page describes what ${SITE_NAME} actually stores. It is short because the
site collects very little.

- **No accounts, no login, no payment data.** The registry and API are
  anonymous.
- **Local preferences** (theme, haptic and click-sound toggles) are stored in
  your browser's localStorage and never sent to a server.
- **Analytics**: Vercel Analytics and Speed Insights record aggregate page views
  and performance. They do not set advertising cookies or build a profile.
- **Waitlist**: if you submit the Model Alerts waitlist, the normalized email
  address, consent timestamp, and consent version are stored in the project's
  Postgres database. It is used only to contact you about Model Alerts. No other
  field is collected. To have a waitlist entry removed, open a GitHub issue and
  the maintainer will delete it.
- **Server logs**: requests pass through the hosting provider, which retains
  standard technical logs (IP, user agent, timestamp) for security and abuse
  prevention. A pseudonymous hash of the client IP is used to rate-limit the
  waitlist form; raw addresses are not stored in that table.
- **No third-party trackers, ad networks, or data sales.**

Questions or deletion requests: ${SITE_URL}/contact.`
    )}

${resourceLinks("/privacy")}
`,
  }),
  "/alerts": () => ({
    status: 200,
    body: `${frontMatter(
      "Model Alerts",
      `Model Alerts is not shipped yet. The page collects a launch waitlist and
states that plainly; it does not send model-change notifications today.

- Waitlist page: ${SITE_URL}/alerts
- The waitlist stores one email address plus consent timestamp and version.
- What it will cover when it ships: new registry entries and specification
  changes across the ${DATASET_FACTS.labs} tracked laboratories.`
    )}

${resourceLinks("/alerts")}
`,
  }),
  "/cli": () => ({
    status: 200,
    body: `${frontMatter(
      "ModelRegistry CLI",
      `The official command-line client for this registry. Zero dependencies, Node 18+,
reading the same public JSON API a browser or agent uses. Free, read-only, no key.

The CLI ships in the repository as \`cli/index.mjs\`; the npm package metadata is
prepared but the package is not published to npm yet.

## Run it from a checkout

\`\`\`bash
git clone https://github.com/TirupMehta/ModelRegistry.git
node ModelRegistry/cli/index.mjs models --flagship-only
node ModelRegistry/cli/index.mjs model <id>
node ModelRegistry/cli/index.mjs changes --since YYYY-MM-DD
node ModelRegistry/cli/index.mjs health
node ModelRegistry/cli/index.mjs markdown /docs
\`\`\`

## Commands

- \`models\` - list records (\`--company\`, \`--category\`, \`--open-weights\`,
  \`--flagship-only\`, \`--latest-only\`)
- \`model <id>\` - one record with specs, pricing, license, verification, sources
- \`changes\` - changelog entries (\`--since\`, \`--until\`, \`--model\`, \`--company\`, \`--limit\`)
- \`health\` - dataset revision, status counts, oldest source check
- \`markdown [path]\` - Markdown view of any page (default \`/\`)
- Global: \`--json\`, \`--base-url <url>\`, \`--timeout <ms>\`

## Nothing to install

\`\`\`bash
curl -s ${SITE_URL}            # flagships table (curl is auto-detected)
curl -s ${SITE_URL}/api/v1/cli   # the same table, explicitly
curl -s ${SITE_URL}/latest       # newest releases
\`\`\`

Benchmark figures are lab-reported. \`lastVerifiedAt\` is a source-review date,
not a live availability signal.`
    )}

${resourceLinks("/cli")}
`,
  }),
  "/suggest": () => ({
    status: 200,
    body: `${frontMatter(
      "Suggest a model",
      `The suggestion form prepares a GitHub issue. It does not publish anything:
every record still goes through maintainer review and source checks.

- Form: ${SITE_URL}/suggest
- Issue tracker: https://github.com/TirupMehta/ModelRegistry/issues
- Contribution rules: https://github.com/TirupMehta/ModelRegistry/blob/main/CONTRIBUTING.md`
    )}

${resourceLinks("/suggest")}
`,
  }),
  "/changelog": () => {
    const entries = modelsData
      .flatMap((m) =>
        m.changeLog.map((e) => ({ ...e, modelId: m.id, modelName: m.name, companyName: m.companyName }))
      )
      .sort((a, b) => b.date.localeCompare(a.date) || a.modelName.localeCompare(b.modelName))
      .slice(0, 60)
    return listDocument(
      "/changelog",
      "Changelog",
      `Every dated change across the registry, newest first. The JSON equivalent is
\`/api/v1/changes?since=YYYY-MM-DD\`. Showing the ${entries.length} most recent
entries of ${modelsData.reduce((n, m) => n + m.changeLog.length, 0)}.`,
      ["Date", "Model", "Change"],
      entries.map((e) => [
        e.date,
        `[${e.modelName}](${SITE_URL}/models/${e.modelId})`,
        e.summary,
      ])
    )
  },
  "/flagships": () =>
    listDocument(
      "/flagships",
      "Current flagship by laboratory",
      "Exactly one primary general-purpose model per laboratory, as recorded in the registry.",
      ["Laboratory", "Flagship", "Released", "Context", "Pricing"],
      modelsData
        .filter((m) => m.isCompanyFlagship)
        .sort((a, b) => Object.keys(companies).indexOf(a.companyId) - Object.keys(companies).indexOf(b.companyId))
        .map((m) => [
          m.companyName,
          `[${m.name}](${SITE_URL}/models/${m.id})`,
          m.releaseDate,
          m.contextWindowTokens > 0 ? m.contextWindow : "n/a",
          pricingLabel(m),
        ])
    ),
  "/pricing": () =>
    listDocument(
      "/pricing",
      "Pricing comparison",
      `Pricing as the laboratory publishes it. Default unit is USD per 1M tokens;
records marked per second use that billing unit. Provider listings can differ
and are not substituted here.`,
      ["Laboratory", "Model", "Input", "Output", "Unit"],
      [...modelsData]
        .sort((a, b) => a.pricing.input - b.pricing.input)
        .map((m) => [
          m.companyName,
          `[${m.name}](${SITE_URL}/models/${m.id})`,
          `$${m.pricing.input}`,
          `$${m.pricing.output}`,
          m.pricingUnit ? m.pricingUnit : "per 1M tokens",
        ])
    ),
  "/context": () =>
    listDocument(
      "/context",
      "Context window comparison",
      `Context limits as published by each laboratory. Records with a descriptive
(non-token) window report 0 tokens and are listed last.`,
      ["Model", "Laboratory", "Context window", "Max output"],
      [...modelsData]
        .sort((a, b) => b.contextWindowTokens - a.contextWindowTokens)
        .map((m) => [
          `[${m.name}](${SITE_URL}/models/${m.id})`,
          m.companyName,
          m.contextWindow,
          m.maxOutputTokens,
        ])
    ),
  "/licenses": () =>
    listDocument(
      "/licenses",
      "Open weights and licenses",
      `Models whose weights can be downloaded, with the license the laboratory
states. Open weights do not imply OSI approval or unrestricted commercial use;
read the linked license.`,
      ["Model", "Laboratory", "License", "Pricing"],
      modelsData
        .filter((m) => m.openWeights)
        .map((m) => [
          `[${m.name}](${SITE_URL}/models/${m.id})`,
          m.companyName,
          m.license,
          pricingLabel(m),
        ])
    ),
  "/modalities": () =>
    listDocument(
      "/modalities",
      "Capability and modality matrix",
      "Which input and output modalities each tracked record supports.",
      ["Model", "Laboratory", "Modalities", "Category"],
      modelsData.map((m) => [
        `[${m.name}](${SITE_URL}/models/${m.id})`,
        m.companyName,
        m.modalities.join(", "),
        m.categoryLabel,
      ])
    ),
  "/timeline": () =>
    listDocument(
      "/timeline",
      "Release timeline",
      "Every tracked release, newest first, with the laboratory and verification status.",
      ["Released", "Model", "Laboratory", "Sources"],
      [...modelsData]
        .sort((a, b) => b.releaseDate.localeCompare(a.releaseDate))
        .map((m) => [
          m.releaseDate,
          `[${m.name}](${SITE_URL}/models/${m.id})`,
          m.companyName,
          `${(m.sources || []).length} source${(m.sources || []).length === 1 ? "" : "s"}`,
        ])
    ),
  "/retired": () =>
    listDocument(
      "/retired",
      "Retired and archived models",
      `Records the laboratories have withdrawn or superseded. They stay in the
registry so old citations still resolve; unknown slugs redirect to the owning
laboratory's current flagship.`,
      ["Model", "Laboratory", "Released", "Superseded by"],
      modelsData
        .filter((m) => m.verificationStatus === "retired")
        .map((m) => [
          `[${m.name}](${SITE_URL}/models/${m.id})`,
          m.companyName,
          m.releaseDate,
          m.supersededBy ? `[${m.supersededBy}](${SITE_URL}/models/${m.supersededBy})` : "n/a",
        ])
    ),
  "/leaderboard": () => {
    const withBench = modelsData.filter((m) => Object.keys(m.benchmarks ?? {}).length > 0)
    return listDocument(
      "/leaderboard",
      "Benchmark leaderboard",
      `Lab-reported scores, grouped by benchmark. Figures come from different
harnesses and dates, so this is a reading aid, not a universal ranking. Check
each model page for the source and test conditions before comparing.`,
      ["Model", "Laboratory", "Benchmarks"],
      [...withBench]
        .sort((a, b) => b.releaseDate.localeCompare(a.releaseDate))
        .map((m) => [
          `[${m.name}](${SITE_URL}/models/${m.id})`,
          m.companyName,
          Object.entries(m.benchmarks)
            .map(([k, v]) => `${k} ${v}`)
            .join("; "),
        ])
    )
  },
  "/companies": () =>
    listDocument(
      "/companies",
      "Laboratories",
      `The ${DATASET_FACTS.labs} laboratories tracked by the registry, with the number of
records and each laboratory's current flagship.`,
      ["Laboratory", "Records", "Flagship", "Page"],
      Object.values(companies)
        .map((c) => {
          const owned = modelsData.filter((m) => m.companyId === c.id)
          const flagship = owned.find((m) => m.isCompanyFlagship)
          return [
            c.name,
            String(owned.length),
            flagship ? `[${flagship.name}](${SITE_URL}/models/${flagship.id})` : "n/a",
            `[${SITE_URL}/companies/${c.id}](${SITE_URL}/companies/${c.id})`,
          ]
        })
        .sort((a, b) => a[0].localeCompare(b[0]))
    ),
}

function bestDocument(): MarkdownDocument {
  const answers = buildBestAnswers()
  const sections = answers
    .map((answer) => {
      const list = answer.entries
        .map((entry) => `${entry.rank}. [${entry.model.name}](${SITE_URL}/models/${entry.model.id}) - ${entry.value}`)
        .join("\n")
      const open = answer.openLeader
        ? `\nBest open-weights result: [${answer.openLeader.model.name}](${SITE_URL}/models/${answer.openLeader.model.id}) (${answer.openLeader.value}, rank ${answer.openLeader.rank} of ${answer.field}).\n`
        : ""
      return `## ${answer.question}

${answer.answer}

${list}
${open}
${answer.caveat}`
    })
    .join("\n\n")
  const body = `${frontMatter(
    "Which AI model is best for what?",
    `Each answer is the highest score reported on one named test among current models that report the same test at the same version. Nothing is blended across tests. A lead under ${TIE_MARGIN_POINTS} points is shown as a tie. Dataset revision ${datasetRevision.datasetVersion}.`,
  )}

${sections}

## What is the best AI model overall?

No model leads every test, so none is called best overall. Use the task closest to your work.

${resourceLinks("/best")}
`
  return { status: 200, body }
}

function scoreDocument(): MarkdownDocument {
  const standing = buildStanding(modelsData)
  const lineup = splitLineup(modelsData)
  const { boards, tests } = leaderboardStats(modelsData, { currentOnly: true })
  const disagreement = Math.round(standing.betweenTestSd * 100)
  const contested = standing.rows.filter((row) => row.agreement === "contested").length

  const rated = table(
    ["Tier", "Model", "Laboratory", "Standing", "Tests", "Spread", "Tests measured"],
    standing.rows.map((row) => [
      `Tier ${row.tier}`,
      `[${row.model.name}](${SITE_URL}/models/${row.model.id})`,
      row.model.companyName,
      row.standing.toFixed(1),
      String(row.cohorts),
      `${Math.round(row.spread)} pp`,
      row.tests.join("; "),
    ])
  )

  const single = table(
    ["Model", "Laboratory", "Test", "Position", "Score"],
    standing.singleTest.map((row) => [
      `[${row.model.name}](${SITE_URL}/models/${row.model.id})`,
      row.model.companyName,
      row.test,
      `${row.rank} of ${row.of}`,
      row.score,
    ])
  )

  const superseded = table(
    ["Model", "Laboratory", "Released", "Replaced by"],
    lineup.superseded.map(({ model, successor }) => [
      `[${model.name}](${SITE_URL}/models/${model.id})`,
      model.companyName,
      model.releaseDate,
      successor ? `[${successor.name}](${SITE_URL}/models/${successor.id})` : "a later release",
    ])
  )

  const perTest = boards
    .map((board) =>
      [
        `### ${board.test} (${board.entries.length} models)`,
        "",
        table(
          ["Place", "Model", "Score", "Percentile"],
          board.entries.map((entry) => [
            String(entry.rank),
            `[${entry.model.name}](${SITE_URL}/models/${entry.model.id})`,
            entry.reading.score,
            entry.percentile.toFixed(0),
          ])
        ),
      ].join("\n")
    )
    .join("\n\n")

  const body = `# Cross-test standing, ${SITE_NAME}

A standing is an expected percentile across the tests a model reports, not a
percentage correct and not a prediction of quality. Only current models are
ranked: ${lineup.superseded.length} records have been replaced in their role by a
later release from the same laboratory and are listed separately with their
successors.

- Standing version: ${STANDING_VERSION}
- Models rated across tests: ${standing.rated} of ${standing.ranked} ranked
- Tests disagree by: ${disagreement} percentile points (pooled between-test standard deviation)
- Contested rows: ${contested} of ${standing.rated} have tests that disagree by more than ${CONTESTED_SPREAD} points
- Cohorts behind the standings: ${tests}
- Dataset revision: ${datasetRevision.datasetVersion} (data revised ${REVISED_LABEL})

A gap between two rows smaller than ${disagreement} points is not a difference this
page can defend.

## Current standings

${rated}

A model needs at least ${MIN_TESTS_FOR_STANDING} tests to receive a standing. Spread is the
distance between the model's best and worst test percentile, so a large spread
means the tests tell different stories about the same model.

## Models measured on one test

These records have a position, not a standing. One test cannot corroborate
itself, so no cross-test number is published for them.

${single}

## Superseded, kept for the record

A superseded record keeps its dates, sources and readings. It is not ranked
against the current lineup because a reader choosing a model today cannot pick
it. Superseded is not retired: no laboratory has withdrawn these.

${superseded}

## Per-test tables

Each table is one test at one version, published only when at least
${MIN_COHORT_SIZE} current models share it. Percentile is the position inside that
cohort on a 0 to 100 scale.

${perTest}

## How the standing is computed

1. Every reading is placed on its own test's cohort. Scores from different tests
   are never compared directly.
2. Each reading becomes a midrank percentile inside its cohort, using the Hazen
   plotting position so the best and worst member sit half a step inside the
   interval rather than at exactly 0 and 100.
3. A test contributes in proportion to how far it separates its own members. A
   cohort where every score is within a couple of points carries little signal.
4. The standing is the equal-weight mean of those percentiles. It is not a fit, an
   average of raw percentages, or a coverage-tiered composite.
5. A model is rated only with at least ${MIN_TESTS_FOR_STANDING} tests. With one test it keeps a
   position on that test and no standing.
6. Each row is refitted with one test removed at a time. A row that moves more
   than two places is labelled test dependent, and only where three or more
   tests exist, because a two-test row cannot be audited this way. Coverage is
   published instead.

Ranking rule v${LEADERBOARD_VERSION}: same test, same version, at least ${MIN_COHORT_SIZE} models, or no
rank. Standing rule v${STANDING_VERSION}: at least ${MIN_TESTS_FOR_STANDING} tests, or no standing.

${resourceLinks("/score")}
`
  return { status: 200, body }
}

function trustDocument(): MarkdownDocument {
  const standing = buildStanding(modelsData)
  const lineup = splitLineup(modelsData)
  const disagreement = Math.round(standing.betweenTestSd * 100)

  const body = `# Can you trust ${SITE_NAME}?

${SITE_NAME} publishes a record only after it has been read from a primary
source. There is no draft tier and no partially published state: a model page
exists because its release date, context window, output limit, pricing, licence
and modalities were each read from a laboratory document and cited.

## How a record is published

1. A laboratory announcement or model card is read directly, not summarised from
   press coverage.
2. Every core field is cited to the document that supports it. A field with no
   source is left out rather than filled from another model in the same family.
3. The source and the date it was checked are attached to the record, and the
   dataset revision advances only when the data changes.

## What is deliberately not claimed

- No score is presented as independent. Every benchmark figure is published by
  the laboratory that built the model, and the record says so next to the number.
- No overall score exists to game upward. Rankings are one test at one version,
  and a cross-test standing is published only for models with at least
  ${MIN_TESTS_FOR_STANDING} tests, together with the spread between them.
- No availability claim is made from a specification. A model being listed does
  not mean a provider is serving it.
- Nothing is ranked against a superseded record. ${lineup.superseded.length} records have been
  replaced in their role and are listed with their successors instead.

## The numbers a reader can check

- Tests disagree by about ${disagreement} percentile points across the rated models.
  That figure is printed next to the standings rather than hidden, and rows whose
  tests disagree by more than ${CONTESTED_SPREAD} points are labelled contested.
- ${standing.rated} of ${standing.ranked} ranked models have readings from more than one test.
  The rest keep a position on the one test they reported.
- Every table prints its cohort size. A table with fewer than ${MIN_COHORT_SIZE} models is not
  published.
- Every record carries its sources, per-field citations and a report-an-error link.

## What this site will not do

- Publish a figure with no source behind it.
- Compare two scores from different tests or versions.
- Give a standing to a model measured on one test.
- Rank a superseded record against the current lineup.
- Take payment, sponsorship or editorial input.

## Corrections

A field is corrected when a primary source contradicts it, and the change is
recorded in the model's changelog and the public changelog. A record is removed
only for duplicates, hoaxes, or records that never had a verifiable official
source.

${resourceLinks("/trust")}
`
  return { status: 200, body }
}

function compareDocument(slug: string): MarkdownDocument | null {
  const pair = resolveComparison(slug, modelsData)
  if (!pair) return null

  const { a, b } = pair
  const comparison = buildComparison(a, b)
  const path = compareHref(a, b)

  const facts = table(
    ["Fact", a.name, b.name],
    comparison.facts.map((fact) => [fact.label, fact.a, fact.b])
  )

  const differences = comparison.differences.length
    ? table(
        ["Difference", a.name, b.name, "Gap"],
        comparison.differences.map((row) => [row.label, row.a, row.b, row.delta])
      )
    : "No material difference was found on the axes this registry tracks."

  const benchmarks = comparison.benchmarks.length
    ? table(
        ["Test", a.name, b.name, "Lead"],
        comparison.benchmarks.map((row) => [
          row.label,
          row.a,
          row.b,
          row.edge === "tie" ? "tie" : row.edge === "a" ? a.name : b.name,
        ])
      )
    : "No shared benchmark at the same version, so no performance comparison is published."

  const body = `# ${a.name} vs ${b.name}

${comparison.summary}

## Material differences

${differences}

## Specifications

${facts}

## Benchmarks

${benchmarks}

${comparison.evidenceNote}

## Choose ${a.name} when

${comparison.pickA.map((item) => `- ${item}`).join("\n")}

## Choose ${b.name} when

${comparison.pickB.map((item) => `- ${item}`).join("\n")}

## Sources

- [${a.name}](${SITE_URL}/models/${a.id}), ${a.companyName}, released ${a.releaseDate}
- [${b.name}](${SITE_URL}/models/${b.id}), ${b.companyName}, released ${b.releaseDate}

Both records are current. This page compares one output class only: a model is
never paired with a product that produces something else.

${resourceLinks(path)}
`
  return { status: 200, body }
}

function notFoundDocument(path: string, reason?: string): MarkdownDocument {
  const safePath = path.replace(/[\r\n]/g, "").slice(0, 200)
  const body = `# 404 - Page not found

\`${safePath}\` is not a route on ${SITE_NAME}. ${reason ?? "Nothing is published at this path."}

## Where to go next

- Homepage: ${SITE_URL}/
- API reference and endpoint list: ${SITE_URL}/docs
- Sitemap (every indexable URL): ${SITE_URL}/sitemap.xml
- llms.txt (compact site guide for agents): ${SITE_URL}/llms.txt
- Full model matrix: ${SITE_URL}/llms-full.txt
- JSON API, all records: ${SITE_URL}/api/v1/models
- OpenAPI description: ${SITE_URL}/openapi.json

## If you expected a page here

- Model pages use \`/models/{id}\` and ids are stable kebab-case. List valid ids
  from \`${SITE_URL}/api/v1/models\` (or \`?company=<lab>\` to narrow).
- Laboratory pages use \`/companies/{id}\`; ids are listed at
  \`${SITE_URL}/api/v1/models\` under \`companies[]\`.
- API paths that do not exist return a JSON 404 with a machine-readable
  \`code\`, a \`hint\`, and the endpoint list - never an HTML error page.
`
  return { status: 404, body }
}

/**
 * Resolve a pathname to a Markdown document.
 *
 * Unknown paths deliberately return a 404 status so an agent sees the same
 * truth a browser sees, with a body it can parse instead of an HTML shell.
 */
export function renderMarkdown(pathname: string): MarkdownDocument {
  const raw = (pathname || "/").split("?")[0].split("#")[0]
  const normalized = raw.length > 1 && raw.endsWith("/") ? raw.slice(0, -1) : raw
  const path = normalized === "" ? "/" : normalized

  const staticPage = STATIC_PAGES[path]
  if (staticPage) return staticPage()

  const modelMatch = /^\/models\/([^/]+)$/.exec(path)
  if (modelMatch) {
    const doc = modelDocument(decodeURIComponent(modelMatch[1]))
    return doc ?? notFoundDocument(path, "No tracked model has that id.")
  }

  const companyMatch = /^\/companies\/([^/]+)$/.exec(path)
  if (companyMatch) {
    const doc = companyDocument(decodeURIComponent(companyMatch[1]))
    return doc ?? notFoundDocument(path, "No tracked laboratory has that id.")
  }

  const compareMatch = /^\/compare\/([^/]+)$/.exec(path)
  if (compareMatch) {
    const doc = compareDocument(decodeURIComponent(compareMatch[1]))
    return doc ?? notFoundDocument(path, "That comparison is not published, or the pair is no longer comparable.")
  }

  return notFoundDocument(path)
}
