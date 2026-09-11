/**
 * Agent skill sources — single source of truth for skill artifacts.
 *
 * The SKILL.md text below is served verbatim at its public URL, and the
 * agent-skills discovery index hashes this exact string at request time.
 * Because artifact and digest derive from the same constant, the published
 * digest can never drift from the published file. Edit here, redeploy,
 * done — never hand-maintain a hash.
 */

export const QUERY_MODELREGISTRY_SKILL_MD = `---
name: query-modelregistry
description: Query the ModelRegistry open frontier AI model registry. List flagship models and research checkpoints across all premier labs, filter by lab or category, and poll for updates. Free, unauthenticated, read-only REST API plus feeds.
---

# Query ModelRegistry

ModelRegistry (https://modelregistry.tirup.in) is an open registry tracking
primary flagship models and research checkpoints across all premier AI labs.
Everything below is public, free, and requires no account, API key, or token.

## Base URL

\`https://modelregistry.tirup.in\`

Conventions: GET only — the registry is read-only. Responses include
\`Access-Control-Allow-Origin: *\`, so browser-side code can call the API
directly without a proxy. Unknown filter values return HTTP 200 with an
empty collection (\`status\` stays "success", \`total\` is 0) — never an error.

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
// No proxy needed — the API sends Access-Control-Allow-Origin: *
const { total, models } = await (
  await fetch("https://modelregistry.tirup.in/api/v1/models?company=deepseek")
).json();
\`\`\`

## Polling for updates: health heartbeat

\`GET /api/check-updates\`

Returns \`{ status, verifiedAt, trackedLabsCount, trackedModelsCount, ... }\`.
Poll no more than once every 5 minutes. Treat a change in
\`trackedModelsCount\` as the signal to re-fetch \`/api/v1/models\`.
The dataset changes when labs ship — typically a few times per week — so
aggressive polling gains nothing. Honor cache directives instead of
re-requesting (REST/feeds: \`public, s-maxage=3600\`).

## Terminal and plain-text routes

- \`GET /api/v1/cli\` — flagships table plus recent checkpoints, plain text.
- \`GET /latest\` — short alias for the feed.

## Feeds and ground truth

- \`GET /rss.xml\` — RSS 2.0, one item per model, newest first.
- \`GET /llms.txt\` — per-lab ground truth for answer engines and crawlers.
- \`GET /llms-full.txt\` — exhaustive dump of every field of every model.

## Badges

- \`/api/badge/[company]\` — live SVG shield for a lab's flagship.
- \`/api/badge?model=<id>&type=spec|context|pricing|status\` — per-model spec badges.

## Human reference and versioning

Human-readable API reference: https://modelregistry.tirup.in/docs

The \`/v1/\` prefix is a stability contract: breaking renames ship under a
new version, never silently. Additive changes (new fields, labs, models)
land in v1 without notice. Model \`id\` values are append-only — entries are
never deleted or recycled.

## Support

Data or endpoint issues: https://github.com/TirupMehta/ModelRegistry/issues
`
