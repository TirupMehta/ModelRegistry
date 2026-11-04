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
  const counts = { verified: 0, partially_verified: 0, unverified: 0, retired: 0 }
  let oldestVerificationDate: string | null = null
  for (const m of modelsData) {
    counts[m.verificationStatus] = (counts[m.verificationStatus] || 0) + 1
    if (!oldestVerificationDate || m.lastVerifiedAt < oldestVerificationDate) {
      oldestVerificationDate = m.lastVerifiedAt
    }
  }

  let text = `# ModelRegistry: The Open Frontier AI Model & Checkpoint Registry (dataset ${datasetRevision.datasetVersion})

> The internet's open-source public registry tracking primary foundation flagships and research checkpoints across every major AI lab.

- Website: ${siteUrl}
- JSON API: ${siteUrl}/api/v1/models
- API & Feeds Reference: ${siteUrl}/docs
- RSS Feed: ${siteUrl}/rss.xml
- Full LLM Matrix: ${siteUrl}/llms-full.txt
- GitHub: https://github.com/TirupMehta/ModelRegistry
- Dataset version: ${datasetRevision.datasetVersion} (data revised ${datasetRevision.revisedAt})
- Verification: ${counts.verified} verified, ${counts.partially_verified} partially verified, ${counts.unverified} unverified of ${modelsData.length} models; oldest source check ${oldestVerificationDate}. Methodology: ${siteUrl}/methodology. Figures below are lab-reported unless a model page shows otherwise.

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
