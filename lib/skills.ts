/**
 * Agent skill sources - single source of truth for skill artifacts.
 *
 * The SKILL.md text below is served verbatim at its public URL, and the
 * agent-skills discovery index hashes this exact string at request time.
 * Because artifact and digest derive from the same constant, the published
 * digest can never drift from the published file. Edit here, redeploy,
 * done - never hand-maintain a hash.
 */

export const QUERY_MODELREGISTRY_SKILL_MD = `---
name: query-modelregistry
description: Query ModelRegistry by Tirup Mehta. Use when you need source-linked facts about public frontier AI models - compare context windows, prices, modalities, or licenses, find a lab's flagship or newest checkpoint, fetch one record by id, diff the changelog, or poll for updates. Free, unauthenticated, read-only REST API plus feeds.
---

# Query ModelRegistry

ModelRegistry (https://modelregistry.tirup.in) is an open registry tracking
primary flagship models and research checkpoints across all premier AI labs.
It is built and maintained by Tirup Mehta (https://tirup.in).
Everything below is public, free, and requires no account, API key, or token.

## When to use this skill

Use it when the task is factual lookup or comparison about public models:

- "What is <lab>'s current flagship model?" -> \`?flagshipOnly=true\`
- "Compare context windows or prices for these models" -> fetch and compare
  \`contextWindowTokens\` and \`pricing\`
- "When was <model> released, and what does its source say?" -> fetch one record
- "What changed since <date>?" -> \`/api/v1/changes?since=YYYY-MM-DD\`
- "Which models allow downloadable weights?" -> \`?openWeights=true\`

Do not use it for model weights, training, inference, deployment, or artifact
versioning. It is not an MLOps model registry and does not host models.
If the task needs private or live provider availability, treat
\`/api/v1/models/{id}/providers\` as a separate, non-authoritative snapshot.

## Base URL

\`https://modelregistry.tirup.in\`

Conventions: GET only - the registry is read-only. Responses include
\`Access-Control-Allow-Origin: *\`, so browser-side code can call the API
directly without a proxy. Unknown filter values return HTTP 200 with an
empty collection (\`status\` stays "success", \`total\` is 0) - never an error.

## Primary endpoint: list models

\`GET /api/v1/models\`

Returns the full registry: every model with specifications, plus a
per-laboratory rollup. All parameters are optional and combinable.

| Parameter    | Meaning |
|--------------|---------|
| \`company\`      | Lab id, e.g. \`openai\`, \`anthropic\`, \`google\`, \`deepseek\` |
| \`category\`     | \`flagship\`, \`reasoning\`, \`open-weights\`, \`code\`, \`multimodal\`, \`audio\`, \`image\`, \`video\` |
| \`openWeights\`  | \`"true"\` for downloadable weights, \`"false"\` for proprietary API models |
| \`flagshipOnly\` | \`"true"\` returns exactly one primary flagship per lab |
| \`latestOnly\`   | \`"true"\` returns each lab's newest shipped checkpoint(s) |

Response shape: \`{ status, total, updatedAt, metadata, companies[], models[] }\`.
Each \`models[]\` entry carries stable append-only \`id\`, \`companyId\`,
\`name\`, \`releaseDate\` (YYYY-MM-DD, the canonical ordering key),
\`isCompanyFlagship\`, \`isLatestCheckpoint\`, context window, parameters,
pricing, modalities, lab-published benchmarks, and official links.

## Single model: fetch one record

\`GET /api/v1/models/{id}\`

Poll one model without pulling the full registry. IDs are stable
kebab-case, matched case-insensitively. Returns
\`{ status, updatedAt, datasetVersion, page, model }\`. Unknown ids return
HTTP 404 JSON \`{ status: "error", suggestion }\` - never a redirect.
Supports \`If-None-Match\` / 304.

\`\`\`bash
curl -s "https://modelregistry.tirup.in/api/v1/models/gpt-6-astra" | head -c 300
\`\`\`

## Incremental sync: changelog diffs

\`GET /api/v1/changes?since=YYYY-MM-DD\`

Changelog history across all records, newest first (same source as
\`/changelog\`). \`since\` is inclusive; also accepts \`until\`, \`model\`,
\`company\`, and \`limit\` (default 100, max 500). Returns
\`{ status, total, returned, changes[{date,summary,modelId,modelName,companyId,page}] }\`.
Poll this, then fetch each changed record via \`/api/v1/models/{id}\`.

\`\`\`bash
curl -s "https://modelregistry.tirup.in/api/v1/changes?since=2026-10-01" | head -c 300
\`\`\`

Examples:

\`\`\`bash
# One flagship per lab
curl -s "https://modelregistry.tirup.in/api/v1/models?flagshipOnly=true" | head -c 400
\`\`\`

\`\`\`python
import requests
res = requests.get("https://modelregistry.tirup.in/api/v1/models",
    params={"category": "video", "latestOnly": "true"}).json()
for m in res["models"]:
    print(m["name"], "-", m["releaseDate"])
\`\`\`

\`\`\`javascript
// No proxy needed - the API sends Access-Control-Allow-Origin: *
const { total, models } = await (
  await fetch("https://modelregistry.tirup.in/api/v1/models?company=deepseek")
).json();
\`\`\`

## Polling for updates: health heartbeat

\`GET /api/check-updates\`

Returns \`{ status, verifiedAt, trackedLabsCount, trackedModelsCount, ... }\`.
Poll no more than once every 5 minutes. Treat a change in
\`trackedModelsCount\` as the signal to re-fetch \`/api/v1/models\`.
The dataset changes when labs ship - typically a few times per week - so
aggressive polling gains nothing. Honor cache directives instead of
re-requesting (REST/feeds: \`public, s-maxage=3600\`).

## Terminal and plain-text routes

- \`GET /api/v1/cli\` - flagships table plus recent checkpoints, plain text.
- \`GET /latest\` - short alias for the feed.

## Feeds and ground truth

- \`GET /rss.xml\` - RSS 2.0, one item per model, newest first.
- \`GET /llms.txt\` - per-lab ground truth for answer engines and crawlers.
- \`GET /llms-full.txt\` - exhaustive dump of every field of every model.

## Badges

- \`/api/badge/[company]\` - live SVG shield for a lab's flagship.
- \`/api/badge?model=<id>&type=spec|context|pricing|status\` - per-model spec badges.

## Errors

Errors are JSON with a machine-readable code, never HTML:

\`\`\`json
{
  "status": "error",
  "error": "Model 'xyz' not found.",
  "code": "model_not_found",
  "hint": "List known ids via GET /api/v1/models.",
  "docs": "https://modelregistry.tirup.in/docs#errors"
}
\`\`\`

Branch on \`code\` (\`bad_request\`, \`invalid_date\`, \`invalid_limit\`,
\`model_not_found\`, \`route_not_found\`, \`method_not_allowed\`,
\`rate_limited\`). Read-only means GET and HEAD only; anything else returns 405.

## Rate limits and content negotiation

- Every API response advertises \`RateLimit\` and \`X-RateLimit-*\` headers
  (600 requests/minute advisory). A 429 carries \`Retry-After\`; honour it.
- Send \`Accept: text/markdown\` to any HTML route for a Markdown rendering.
  Markdown responses carry \`Vary: Accept\` and keep the real status code.
- Prefer conditional requests: send \`If-None-Match\` with the previous \`ETag\`
  and treat 304 as "unchanged".

## Human reference and versioning

Human-readable API reference: https://modelregistry.tirup.in/docs

OpenAPI 3.1 description: https://modelregistry.tirup.in/openapi.json
MCP server: https://modelregistry.tirup.in/api/mcp (stateless JSON-RPC 2.0 over
POST; tools: list_models, get_model, list_labs, get_changes, get_health,
read_page_markdown)
Trust pages: https://modelregistry.tirup.in/contact and
https://modelregistry.tirup.in/privacy
Project open-source activity: https://modelregistry.tirup.in/open-source

The \`/v1/\` prefix is a stability contract: breaking renames ship under a
new version, never silently. Additive changes (new fields, labs, models)
land in v1 without notice. Model \`id\` values are append-only - entries are
never deleted or recycled.

## Support

Data or endpoint issues: https://github.com/TirupMehta/ModelRegistry/issues
`
