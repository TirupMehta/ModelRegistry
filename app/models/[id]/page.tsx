import { notFound, redirect } from "next/navigation"
import { Metadata } from "next"
import { modelsData } from "@/data/models"
import ModelPageView from "@/components/model-page-view"

interface Props {
  params: Promise<{ id: string }>
}

/**
 * Generic fallback for unknown model slugs (e.g. ids retired by a merge).
 * Scores every model by token overlap between the slug and the model's
 * id / name / version / company, then serves the winning company's newest
 * model — e.g. /models/gpt-5-6-sol lands on GPT-6 Astra. Requires a unique
 * winning company, so unrelated slugs still 404 instead of redirecting
 * somewhere arbitrary. Zero per-link maintenance for future merges.
 */
function resolveCompanyFallback(slug: string) {
  const slugTokens = slug
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
  if (slugTokens.length === 0) return null

  const companyScores = new Map<string, number>()
  for (const m of modelsData) {
    const corpus = new Set(
      `${m.id} ${m.name} ${m.version} ${m.companyId} ${m.companyName}`
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter(Boolean)
    )
    let score = 0
    for (const t of slugTokens) {
      if (corpus.has(t)) score += 1
    }
    if (score > 0) {
      companyScores.set(m.companyId, Math.max(companyScores.get(m.companyId) ?? 0, score))
    }
  }
  if (companyScores.size === 0) return null

  const ranked = [...companyScores.entries()].sort((a, b) => b[1] - a[1])
  if (ranked.length > 1 && ranked[0][1] === ranked[1][1]) return null

  const winner = ranked[0][0]
  const newest = modelsData
    .filter((m) => m.companyId === winner)
    .sort((a, b) => b.releaseDate.localeCompare(a.releaseDate))[0]
  return newest ?? null
}

export async function generateStaticParams() {
  return modelsData.map((m) => ({ id: m.id }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const model = modelsData.find((m) => m.id === id) ?? resolveCompanyFallback(id)

  if (!model) {
    return {
      title: "Model Not Found | ModelRegistry",
      description: "The requested model specification could not be located in the registry.",
    }
  }

  const title = `${model.name} (${model.companyName}) — Specs, Context & Benchmarks | ModelRegistry`
  const description = `${model.highlight} Context: ${model.contextWindow}. Architecture: ${model.parameters}. Release: ${model.releaseDate}.`

  return {
    title,
    description,
    alternates: {
      canonical: `https://modelregistry.tirup.in/models/${model.id}`,
    },
    openGraph: {
      title: `${model.name} (${model.companyName}) Datasheet`,
      description,
      url: `https://modelregistry.tirup.in/models/${model.id}`,
      siteName: "ModelRegistry",
      type: "article",
      images: [
        {
          url: `https://modelregistry.tirup.in/api/og?model=${model.id}`,
          width: 1200,
          height: 630,
          alt: `${model.name} Datasheet`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${model.name} — Technical Specs & Benchmarks`,
      description,
      images: [`https://modelregistry.tirup.in/api/og?model=${model.id}`],
    },
  }
}

export default async function ModelPage({ params }: Props) {
  const { id } = await params
  const model = modelsData.find((m) => m.id === id)

  if (!model) {
    const fallback = resolveCompanyFallback(id)
    if (!fallback) {
      notFound()
    }
    redirect(`/models/${fallback.id}`)
  }

  // JSON-LD Structured Data for Google Rich Snippets
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: model.name,
    operatingSystem: "Cloud / Local GPU",
    applicationCategory: "Artificial Intelligence Foundation Model",
    author: {
      "@type": "Organization",
      name: model.companyName,
    },
    offers: {
      "@type": "Offer",
      price: model.openWeights ? "0" : String(model.pricing.input),
      priceCurrency: "USD",
    },
    description: model.highlight,
    url: `https://modelregistry.tirup.in/models/${model.id}`,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ModelPageView model={model} />
    </>
  )
}
