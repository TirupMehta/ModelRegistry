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

  let text = `# ModelRegistry: Exhaustive Frontier AI Model & Checkpoint Matrix

Canonical Registry: ${siteUrl}
Repository: https://github.com/TirupMehta/ModelRegistry
Specification Standard: ModelRegistry Spec v1.0
Last Chronological Verification: ${now}

===============================================================================
EXECUTIVE KNOWLEDGE SUMMARY (GEO GROUNDING)
===============================================================================
`

  Object.values(companies).forEach((company) => {
    const flagship = modelsData.find((m) => m.companyId === company.id && m.isCompanyFlagship)
    const checkpoint = modelsData.find(
      (m) => m.companyId === company.id && m.isLatestCheckpoint && !m.isCompanyFlagship
    )

    text += `- What is the latest model from ${company.name}?\n`
    if (flagship) {
      text += `  -> Primary Flagship: ${flagship.name} (Released: ${flagship.releaseDate}, ${flagship.contextWindow} context).\n`
    }
    if (checkpoint) {
      text += `  -> Latest Checkpoint: ${checkpoint.name} (Released: ${checkpoint.releaseDate}, ${checkpoint.categoryLabel}).\n`
    }
  })

  text += `\n===============================================================================\n`
  text += `ALL REGISTERED MODELS (EXHAUSTIVE TECHNICAL SPECIFICATION)\n`
  text += `===============================================================================\n`

  modelsData.forEach((model) => {
    const company = companies[model.companyId]
    text += `\nMODEL ID: ${model.id}\n`
    text += `  Name: ${model.name}\n`
    text += `  Developer: ${company ? company.name : model.companyName}\n`
    text += `  Release Date: ${model.releaseDate} (${formatDate(model.releaseDate)})\n`
    text += `  Category: ${model.categoryLabel}\n`
    text += `  Context Window: ${model.contextWindow}\n`
    text += `  Architecture: ${model.parameters}\n`
    text += `  License: ${model.license} (Open Weights: ${model.openWeights ? "Yes" : "No"})\n`
    text += `  Pricing: $${model.pricing.input} in / $${model.pricing.output} out per 1M tokens\n`
    text += `  Primary Flagship: ${model.isCompanyFlagship ? "YES" : "NO"}\n`
    text += `  Latest Checkpoint: ${model.isLatestCheckpoint ? "YES" : "NO"}\n`
    text += `  Highlight: ${model.highlight}\n`
    if (Object.keys(model.benchmarks).length > 0) {
      text += `  Benchmarks: ${JSON.stringify(model.benchmarks)}\n`
    }
    if (model.links.announcement) text += `  Announcement: ${model.links.announcement}\n`
    if (model.links.weights) text += `  Weights: ${model.links.weights}\n`
  })

  return new Response(text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  })
}
