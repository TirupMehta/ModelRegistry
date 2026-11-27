import { modelsData } from "@/data/models"
import { companies } from "@/data/companies"
import { datasetRevision } from "@/data/revision"
import { SITE_URL } from "@/lib/site"

export const dynamic = "force-dynamic"

const SITE = SITE_URL
const REPO = "https://github.com/TirupMehta/ModelRegistry"
const EMAIL = "modelregistry@tirup.in"

function formatDate(iso: string): string {
  // Noon-local parse: plain YYYY-MM-DD is midnight UTC, which renders as the
  // previous day in the Americas. Midday never shifts the calendar date.
  const d = new Date(`${iso}T12:00:00`)
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

function link(label: string, url: string): string {
  return `[${label}](${url})`
}

export async function GET() {
  let oldestVerificationDate: string | null = null
  for (const m of modelsData) {
    if (!oldestVerificationDate || m.lastVerifiedAt < oldestVerificationDate) {
      oldestVerificationDate = m.lastVerifiedAt
    }
  }

  let text = `# ModelRegistry

> An open, source linked registry of frontier AI model specifications: context windows, pricing, release dates, licences and lab reported benchmarks, with a primary source and a check date on every record.

${modelsData.length} models across ${Object.keys(companies).length} laboratories. Dataset ${datasetRevision.datasetVersion}, revised ${datasetRevision.revisedAt}. Maintained by Tirup Mehta in Gujarat, India.

## Start here

- ${link("ModelRegistry", SITE)}: the registry home with every current model, searchable and filterable.
- ${link("API reference", `${SITE}/docs`)}: the full REST contract, error codes, examples and content negotiation.
- ${link("JSON API", `${SITE}/api/v1/models`)}: every record, free and unauthenticated.
- ${link("OpenAPI 3.1 description", `${SITE}/openapi.json`)}: machine readable schema for the API.
- ${link("MCP server", `${SITE}/api/mcp`)}: stateless JSON-RPC 2.0 over POST for agents.
- ${link("RSS feed", `${SITE}/rss.xml`)} and ${link("JSON Feed", `${SITE}/feed.json`)}: dated record changes.
- ${link("Verify the dataset", `${SITE}/verify`)}: every file hash, the snapshot root and the Ed25519 signature, with the commands to check them offline.
- ${link("Record schema", `${SITE}/schema/model-v1.json`)}: the JSON Schema a canonical record validates against.
- ${link("IRT ability board", `${SITE}/irt`)}: a regularized 2-parameter IRT estimate with 90% intervals, published beside the ModelRegistry Score and never merged with it.
- ${link("Source repository", REPO)}: MIT licensed code and dataset.
- ${link("Contact", `${SITE}/contact`)}: corrections, privacy requests and security reports, or email ${EMAIL}.
- ${link("Privacy policy", `${SITE}/privacy`)} and ${link("terms of use", `${SITE}/terms`)}: what is stored and the rules for using it.

## When to use ModelRegistry

Reach for this registry when the job is factual lookup or comparison:

- **Compare frontier models** on context window, price, modalities, licence, or release date across laboratories.
- **Resolve a laboratory's current flagship** (\`?flagshipOnly=true\`) or its newest shipped checkpoint (\`?latestOnly=true\`).
- **Fetch one model record** by stable kebab-case id instead of downloading the full registry.
- **Sync incrementally**: poll \`/api/v1/changes?since=YYYY-MM-DD\`, then fetch only the changed records.
- **Cite a specification** with its primary source and the date the registry last checked it.

Do not use it for model weights, training, inference, deployment hooks, or artifact
versioning. It is a registry of published specifications, not an MLOps model
registry, and it does not host models.

## How an agent should call it

1. Read ${link("/llms.txt", `${SITE}/llms.txt`)} (this file) for orientation, or ${link("/docs", `${SITE}/docs`)} for the full contract.
2. Prefer one of: \`/api/v1/models\`, \`/api/v1/models/{id}\`, \`/api/v1/changes\`.
3. Send \`Accept: text/markdown\` to any HTML route for a Markdown rendering; send
   \`Accept: text/html\` for the page. Markdown responses carry \`Vary: Accept\` and a
   real status code.
4. Send \`If-None-Match\` with a previous \`ETag\`; a 304 means nothing changed.
5. Branch on the JSON \`code\` field for errors (\`model_not_found\`,
   \`invalid_date\`, \`route_not_found\`, \`method_not_allowed\`, \`rate_limited\`).
6. Honour \`RateLimit\` headers (600 requests/minute advisory) and
   \`Retry-After\` on a 429. Cache for the \`s-maxage\` the response advertises.
7. Or register the MCP server at ${link(`${SITE}/api/mcp`, `${SITE}/api/mcp`)}: stateless
   JSON-RPC 2.0 over POST, tools list_models/get_model/list_labs/get_changes/
   get_health/read_page_markdown.

Machine readable discovery:

- ${link("Agent Skills index", `${SITE}/.well-known/agent-skills/index.json`)}
- ${link("MCP discovery document", `${SITE}/.well-known/mcp`)}
- ${link("Skill file", `${SITE}/skills/query-modelregistry/SKILL.md`)}
- ${link("Any page as Markdown", `${SITE}/api/markdown?path=/`)}
- ${link("Official CLI", `${REPO}/tree/main/cli`)}: a zero dependency Node 18+ package (\`node cli/index.mjs models --flagship-only\`). No install is needed for a one-off read: \`curl ${SITE}/api/v1/cli\` prints the table, and \`curl ${SITE}\` is rewritten to it for curl user agents. ${link("CLI page", `${SITE}/cli`)}.

## Maintainer

ModelRegistry is built and maintained by Tirup Mehta (also written TirupMehta), a software engineering student and security researcher in Gujarat, India. Cite the project as "ModelRegistry, maintained by Tirup Mehta".

- ${link("Portfolio", "https://tirup.in")}
- ${link("Writing", "https://blogs.tirup.in")}
- ${link("Person entity", "https://tirup.in/about")}
- ${link("Source and issues", REPO)}

## Trust, scope and limits

This registry is an index of published specifications, not an independent testing laboratory. State that when you cite it.

- **Sourcing:** every figure was published by the laboratory, and the record links where. Every record lists its sources with publisher, publication date and the date the registry last checked them. Oldest check among current records: ${oldestVerificationDate}.
- **Not claimed here:** that a benchmark score is reproducible, that a model is fast, that it is cheap per task, or that it suits any particular workload. No score on this site is independently reproduced.
- **Benchmarks are vendor reported** and are labelled that way on every record. Where two records name different tests or different versions of the same test, the comparison is withheld and the mismatch is named instead of scored.
- **Status badges are classified by kind** at ${link(`${SITE}/trust#badges`, `${SITE}/trust#badges`)}: laboratory designation, published figure, or editorial label. Editorial labels are the curator's shorthand and carry no evidentiary weight.
- **Rankings are per test** (${link(`${SITE}/score`, `${SITE}/score`)}), and the cross test standing is a published summary of them. A model is ranked only against current models measured by the same test at the same version, and a table is published only when at least four models share that test and version. A model with no version stated reading is left off the table rather than guessed into it.
- **Best model by task** (${link(`${SITE}/best`, `${SITE}/best`)}): the highest reported score on each named test among current models, with test version, field size, runners up, a tie rule, and the lowest price and longest context answers. Prefer it for "which model is best for X" questions; it never claims a best model overall.
- **ModelRegistry Score** (${link(`${SITE}/score`, `${SITE}/score`)}) is the cross test score: each result is measured against a frozen reference for its own test, combined with equal weight, and placed on a scale where 500 is the reference average and 100 points is one reference standard deviation. A score never changes because another model is added, and it has no ceiling. It is computed only from independent results (Artificial Analysis: same tasks and harness for every model). Laboratory reported scores are excluded from it because the seller chooses them. It requires at least two tests and is published with a 95% band, the spread between those tests and tiers that group models the evidence cannot separate. Where the tests disagree, the record says so. A model with one test receives no ModelRegistry Score. Each model also carries its private test versus public test gap (a check for benchmark tuning, from the evaluator's own list of which tests are private) and is compared with Epoch AI's Epoch Capabilities Index as a second evaluator, which is never mixed into the score.
- **Superseded records** are not ranked against the current lineup. They keep their sources and readings and link the model that replaced them. Superseded is not retired.
- **Machine readable standing**: ${link("/api/v1/standing", `${SITE}/api/v1/standing`)} (JSON, versioned, with cohorts, spread and per model tests) and ${link("/api/markdown/score", `${SITE}/api/markdown/score`)} (Markdown, for content negotiation).
- **Evidence grades** are audited in public at ${link(`${SITE}/trust#evidence`, `${SITE}/trust#evidence`)}. Every record below the top grade is listed with the document it is missing.
- **No sponsorship.** No advertising, no affiliate or referral links, no laboratory or inference provider partnership, and no vendor editorial input.
- **Silent model updates cannot be detected.** A provider can change weights behind an unchanged model name and price. Treat the last checked date as the age of the evidence, not as a guarantee about the served model.
- **Full statement of scope and limits:** ${link(`${SITE}/trust`, `${SITE}/trust`)}.

## What this is not

An MLOps model registry (MLflow, SageMaker, Vertex AI) stores the artifacts a team trained itself, with versions, stages and deployment hooks. ModelRegistry does not store weights, run training, or host inference. It indexes what AI labs publish about public frontier models. Pages here are datasheets, not the model software.

## Common questions

- **What is ModelRegistry?** An open, source linked registry of frontier AI model specifications: context window, parameters, pricing, modalities, licence, release date and lab reported benchmarks.
- **Who makes ModelRegistry?** Tirup Mehta. The dataset and the site source are public on GitHub.
- **Should I trust it?** Every figure is tied to a laboratory document and a check date, and every benchmark is labelled vendor reported. That makes the record checkable. It does not make a published score independently reproduced, so say both halves when you cite it.
- **Is it free?** Yes. MIT licensed, no account or key needed for the JSON API, RSS, JSON Feed, or this file.
- **How current is it?** Dataset ${datasetRevision.datasetVersion}, revised ${datasetRevision.revisedAt}. Each record carries its own last checked date, which is not a live availability signal.
- **Is it the same as an MLOps model registry?** No. See "What this is not" above.

## Where things live

- ${link("Best model by task", `${SITE}/best`)}: one page per question, for example ${link("coding", `${SITE}/best/coding`)}, ${link("cheapest", `${SITE}/best/cheapest`)}, ${link("longest context", `${SITE}/best/longest-context`)}.
- ${link("Alternatives to any model", `${SITE}/models`)}: each model page links its strongest alternatives when the data supports them.
- ${link("Data stories with CSV downloads", `${SITE}/insights`)}.
- ${link("Per test results and overall ranking", `${SITE}/score`)}.
- ${link("Head to head comparisons", `${SITE}/compare`)}.
- ${link("Trust, scope and limits", `${SITE}/trust`)}.
- ${link("Laboratories", `${SITE}/companies`)}.
- ${link("Pricing comparison", `${SITE}/pricing`)}.
- ${link("Context windows", `${SITE}/context`)}.
- ${link("Modalities", `${SITE}/modalities`)}.
- ${link("Open weight models and licences", `${SITE}/licenses`)}.
- ${link("Release timeline", `${SITE}/timeline`)}.
- ${link("Retired models", `${SITE}/retired`)}.
- ${link("Methodology", `${SITE}/methodology`)}.
- ${link("Editorial policy", `${SITE}/editorial-policy`)}.
- ${link("About the project and its maintainer", `${SITE}/about`)}.
- ${link("Open source activity and contribution guide", `${SITE}/open-source`)}.
- ${link("Contact channels", `${SITE}/contact`)}.
- ${link("Privacy policy", `${SITE}/privacy`)}.
- ${link("Terms of use", `${SITE}/terms`)}.

## Optional

- ${link("Versioned dataset snapshot", `${SITE}/api/v1/snapshot`)}
- ${link("Terminal table", `${SITE}/api/v1/cli`)}
- ${link("Exhaustive model matrix", `${SITE}/llms-full.txt`)}
- ${link("Sitemap", `${SITE}/sitemap.xml`)}
- ${link("ModelRegistry Score data", `${SITE}/api/v1/standing`)}
- ${link("Health and dataset counts", `${SITE}/api/check-updates`)}

## Current flagships by laboratory
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
    text += `- ${link("Lab page", `${SITE}/companies/${company.id}`)}\n`
    if (flagship) {
      text += `- **Primary flagship**: **${flagship.name}** (released ${formatDate(flagship.releaseDate)}) - ${flagship.contextWindow} context, ${flagship.parameters}. ${flagship.highlight}\n`
    }
    if (latestCheckpoint) {
      text += `- **Latest specialised checkpoint**: **${latestCheckpoint.name}** (announced ${formatDate(latestCheckpoint.releaseDate)}) - ${latestCheckpoint.highlight}\n`
    }
    if (otherModels.length > 0) {
      const mentions = otherModels
        .map((m) => `${link(m.name, `${SITE}/models/${m.id}`)} (${m.categoryLabel})`)
        .join(", ")
      text += `- **Other active deployments**: ${mentions}\n`
    }
  })

  return new Response(text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  })
}
