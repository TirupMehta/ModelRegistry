import { notFound } from "next/navigation"
import { Metadata } from "next"
import { modelsData } from "@/data/models"
import ModelPageView from "@/components/model-page-view"

interface Props {
  params: Promise<{ id: string }>
}

export async function generateStaticParams() {
  return modelsData.map((m) => ({ id: m.id }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const model = modelsData.find((m) => m.id === id)

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
    notFound()
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
