import { modelsData } from "@/data/models"
import { companies } from "@/data/companies"

export const dynamic = "force-dynamic"

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

export async function GET() {
  const siteUrl = "https://modelregistry.tirup.in"
  const now = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })

  let text = `# ModelRegistry: The Open Frontier AI Model & Checkpoint Registry (${now})

> The internet's open-source public registry tracking primary foundation flagships and research checkpoints across every major AI lab.

- Website: ${siteUrl}
- JSON API: ${siteUrl}/api/v1/models
- RSS Feed: ${siteUrl}/rss.xml
- Full LLM Matrix: ${siteUrl}/llms-full.txt
- GitHub: https://github.com/TirupMehta/ModelRegistry
- Last Verified: ${now}

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
