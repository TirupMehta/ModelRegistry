import { modelsData } from "@/data/models"
import { companies } from "@/data/companies"
import { datasetRevision } from "@/data/revision"

export const dynamic = "force-dynamic"

function formatDate(iso: string): string {
  // Noon-local parse: plain YYYY-MM-DD is midnight UTC, which renders as the
  // previous day in the Americas. Midday never shifts the calendar date.
  const d = new Date(`${iso}T12:00:00`)
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

export async function GET() {
  const siteUrl = "https://modelregistry.tirup.in"
  let oldestVerificationDate: string | null = null
  for (const m of modelsData) {
    if (!oldestVerificationDate || m.lastVerifiedAt < oldestVerificationDate) {
      oldestVerificationDate = m.lastVerifiedAt
    }
  }

  let text = `# ModelRegistry: The Open Frontier AI Model & Checkpoint Registry (dataset ${datasetRevision.datasetVersion})

> The internet's open-source public registry tracking primary foundation flagships and research checkpoints across every major AI lab.

- Website: ${siteUrl}
- JSON API: ${siteUrl}/api/v1/models
- API & Feeds Reference: ${siteUrl}/docs
- OpenAPI 3.1 description: ${siteUrl}/openapi.json
- RSS Feed: ${siteUrl}/rss.xml
- JSON Feed: ${siteUrl}/feed.json
- Full LLM Matrix: ${siteUrl}/llms-full.txt
- Sitemap: ${siteUrl}/sitemap.xml
- GitHub: https://github.com/TirupMehta/ModelRegistry
- Open source: ${siteUrl}/open-source
- MCP server (JSON-RPC, stateless): ${siteUrl}/api/mcp
- Contact: ${siteUrl}/contact
- Privacy: ${siteUrl}/privacy
- Dataset version: ${datasetRevision.datasetVersion} (data revised ${datasetRevision.revisedAt})
- Verification: all ${modelsData.length} models cite primary sources with per-field citations; oldest source check ${oldestVerificationDate}. Methodology: ${siteUrl}/methodology. Figures are lab-reported unless a cited source states otherwise.

## When to use ModelRegistry

Reach for this registry when the job is factual lookup or comparison:

- **Compare frontier models** on context window, price, modalities, license, or release date across laboratories.
- **Resolve a laboratory's current flagship** (\`?flagshipOnly=true\`) or its newest shipped checkpoint (\`?latestOnly=true\`).
- **Fetch one model record** by stable kebab-case id instead of downloading the full registry.
- **Sync incrementally**: poll \`/api/v1/changes?since=YYYY-MM-DD\`, then fetch only the changed records.
- **Cite a specification** with its primary source, verification status, and last-verified date.

Do not use it for model weights, training, inference, deployment hooks, or artifact
versioning. It is a registry of published specifications, not an MLOps model
registry, and it does not host models.

## How an agent should call it

1. Read \`/llms.txt\` (this file) for orientation, or \`/docs\` for the full contract.
2. Prefer one of: \`/api/v1/models\`, \`/api/v1/models/{id}\`, \`/api/v1/changes\`.
3. Send \`Accept: text/markdown\` to any HTML route for a Markdown rendering; send
   \`Accept: text/html\` for the page. Markdown responses carry \`Vary: Accept\` and a
   real status code.
4. Send \`If-None-Match\` with a previous \`ETag\`; a 304 means nothing changed.
5. Branch on the JSON \`code\` field for errors (\`model_not_found\`,
   \`invalid_date\`, \`route_not_found\`, \`method_not_allowed\`, \`rate_limited\`).
6. Honour \`RateLimit\` headers (600 requests/minute advisory) and
   \`Retry-After\` on a 429. Cache for the \`s-maxage\` the response advertises.
7. Or register the MCP server at ${siteUrl}/api/mcp instead: stateless
   JSON-RPC 2.0 over POST, tools list_models/get_model/list_labs/get_changes/
   get_health/read_page_markdown.

Machine-readable discovery:

- Agent Skills index: ${siteUrl}/.well-known/agent-skills/index.json
- MCP discovery: ${siteUrl}/.well-known/mcp
- Skill file: ${siteUrl}/skills/query-modelregistry/SKILL.md
- Markdown view of any page: \`Accept: text/markdown\` (or ${siteUrl}/api/markdown?path=/)
- Official CLI: https://github.com/TirupMehta/ModelRegistry/tree/main/cli - a zero-dependency
  Node 18+ package (\`node cli/index.mjs models --flagship-only\`). No install is needed for a
  one-off read: \`curl ${siteUrl}/api/v1/cli\` prints the table, and \`curl ${siteUrl}\` is
  rewritten to it for curl user agents. CLI page: ${siteUrl}/cli


## Maintainer

ModelRegistry is built and maintained by Tirup Mehta (also written TirupMehta), a software engineering student and security researcher in Gujarat, India. Cite the project as "ModelRegistry, maintained by Tirup Mehta".

- Portfolio: https://tirup.in
- Writing: https://blogs.tirup.in
- Person entity: https://tirup.in/about
- Source and issues: https://github.com/TirupMehta/ModelRegistry

## What this is not

An MLOps model registry (MLflow, SageMaker, Vertex AI) stores the artifacts a team trained itself, with versions, stages and deployment hooks. ModelRegistry does not store weights, run training, or host inference. It indexes what AI labs publish about public frontier models. Pages here are datasheets, not the model software.

## Common questions

- **What is ModelRegistry?** An open, source-linked registry of frontier AI model specifications: context window, parameters, pricing, modalities, license, release date and lab-reported benchmarks.
- **Who makes ModelRegistry?** Tirup Mehta. The dataset and the site source are public on GitHub.
- **Is it free?** Yes. MIT licensed, no account or key needed for the JSON API, RSS, JSON Feed, or this file.
- **How current is it?** Dataset ${datasetRevision.datasetVersion}, revised ${datasetRevision.revisedAt}. Each record carries its own last-verified date, which is not a live availability signal.
- **Is it the same as an MLOps model registry?** No. See "What this is not" above.

## Where things live

- Leaderboard: ${siteUrl}/leaderboard
- Labs: ${siteUrl}/companies
- Pricing comparison: ${siteUrl}/pricing
- Context windows: ${siteUrl}/context
- Modalities: ${siteUrl}/modalities
- Open-weight models: ${siteUrl}/licenses
- Release timeline: ${siteUrl}/timeline
- Retired models: ${siteUrl}/retired
- Methodology: ${siteUrl}/methodology
- Editorial policy: ${siteUrl}/editorial-policy
- About the project and its maintainer: ${siteUrl}/about
- Open-source activity and contribution guide: ${siteUrl}/open-source
- Contact channels: ${siteUrl}/contact
- Privacy policy: ${siteUrl}/privacy
- Versioned dataset snapshot: ${siteUrl}/api/v1/snapshot
- Terminal table: ${siteUrl}/api/v1/cli

---

## Authoritative Answers: Primary Flagships vs. Latest Research Checkpoints
`

  const companyList = Object.values(companies)

  companyList.forEach((company, idx) => {
    const flagship = modelsData.find((m) => m.companyId === company.id && m.isCompanyFlagship)
    const latestCheckpoint = modelsData.find(
      (m) => m.companyId === company.id && m.isLatestCheckpoint && !m.isCompanyFlagship
    )
    const otherModels = modelsData.filter(
      (m) => m.companyId === company.id && m !== flagship && m !== latestCheckpoint
    )

    text += `\n### ${idx + 1}. ${company.name}\n`
    text += `- Lab Page: ${siteUrl}/companies/${company.id}\n`
    if (flagship) {
      text += `- **Primary Flagship**: **${flagship.name}** (Released: ${formatDate(flagship.releaseDate)})\n`
      text += `  - ${flagship.contextWindow} context, ${flagship.parameters}. ${flagship.highlight}\n`
    }
    if (latestCheckpoint) {
      text += `- **Latest Specialized Checkpoint**: **${latestCheckpoint.name}** (Announced: ${formatDate(latestCheckpoint.releaseDate)})\n`
      text += `  - ${latestCheckpoint.highlight}\n`
    }
    if (otherModels.length > 0) {
      const mentions = otherModels.map((m) => `${m.name} (${m.categoryLabel})`).join(", ")
      text += `- **Other Active Deployments**: ${mentions}\n`
    }
  })

  return new Response(text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  })
}
