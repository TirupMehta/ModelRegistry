import { modelsData } from "@/data/models"
import { companies } from "@/data/companies"
import { formatPrice } from "@/lib/utils"
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

  let text = `# ModelRegistry: Exhaustive Frontier AI Model & Checkpoint Matrix

Canonical Registry: ${siteUrl}
Repository: https://github.com/TirupMehta/ModelRegistry
Specification Standard: ModelRegistry Spec v1.0
Dataset version: ${datasetRevision.datasetVersion} (data revised ${datasetRevision.revisedAt})
Verification: per-model status, sources, and changelog on each /models/:id page; methodology at ${siteUrl}/methodology. Benchmark figures below are lab-reported, not independently reproduced.

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
    text += `  -> Lab Page: ${siteUrl}/companies/${company.id}\n`
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
    text += `  Pricing: ${formatPrice(model)}${model.pricingUnit ? "" : " per 1M tokens"}\n`
    text += `  Primary Flagship: ${model.isCompanyFlagship ? "YES" : "NO"}\n`
    text += `  Latest Checkpoint: ${model.isLatestCheckpoint ? "YES" : "NO"}\n`
    text += `  Verification: ${model.verificationStatus} (last checked ${model.lastVerifiedAt})\n`
    text += `  Sources: ${model.sources.map((s) => `${s.title} <${s.url}>`).join(" | ")}\n`
    text += `  Highlight: ${model.highlight}\n`
    if (Object.keys(model.benchmarks).length > 0) {
      text += `  Benchmarks (lab-reported): ${JSON.stringify(model.benchmarks)}\n`
    }
    if (model.links.announcement) text += `  Announcement: ${model.links.announcement}\n`
    if (model.links.weights) text += `  Weights: ${model.links.weights}\n`
    if (model.variants) {
      model.variants.forEach((v) => {
        text += `  Variant: ${v.name} [${v.role}] — ${v.detail} Pricing: ${v.pricingNote}.\n`
      })
    }
  })

  return new Response(text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  })
}
