import { notFound, redirect } from "next/navigation"
import { Metadata } from "next"
import { modelsData } from "@/data/models"
import { resolveCompanyFallback } from "@/lib/model-fallback"
import { formatPrice, safeJsonLd } from "@/lib/utils"
import ModelPageView from "@/components/model-page-view"

interface Props {
  params: Promise<{ id: string }>
}

export async function generateStaticParams() {
  return modelsData.map((m) => ({ id: m.id }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const model = modelsData.find((m) => m.id === id) ?? resolveCompanyFallback(id, modelsData)

  if (!model) {
    return {
      title: "Model Not Found",
      description: "The requested model specification could not be located in the registry.",
    }
  }

  const title = `${model.name} (${model.companyName}) — Specs, Context & Benchmarks`
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
    const fallback = resolveCompanyFallback(id, modelsData)
    if (!fallback) {
      notFound()
    }
    redirect(`/models/${fallback.id}`)
  }

  // JSON-LD Structured Data for Google Rich Snippets.
  // Pricing is the official hosted API rate per billing unit (1M tokens,
  // or per second for visual models) — expressed as a UnitPriceSpecification
  // so the figure is never mistaken for a one-time purchase price.
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
      price: String(model.pricing.input),
      priceCurrency: "USD",
      description: `Official hosted API rate: ${formatPrice(model)}${
        model.pricingUnit ? "" : " per 1M tokens"
      }${model.openWeights ? "; weights free to self-host" : ""}`,
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: String(model.pricing.input),
        priceCurrency: "USD",
        unitText: model.pricingUnit ?? "per 1M input tokens",
        referenceQuantity: model.pricingUnit
          ? { "@type": "QuantitativeValue", value: 1, unitText: "second" }
          : { "@type": "QuantitativeValue", value: 1000000, unitText: "tokens" },
      },
    },
    description: model.highlight,
    url: `https://modelregistry.tirup.in/models/${model.id}`,
  }

  // Mirrors the visible LEDGER / {LAB} / {id} breadcrumb trail.
  const jsonLdBreadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Ledger", item: "https://modelregistry.tirup.in/" },
      {
        "@type": "ListItem",
        position: 2,
        name: model.companyName,
        item: `https://modelregistry.tirup.in/companies/${model.companyId}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: model.name,
        item: `https://modelregistry.tirup.in/models/${model.id}`,
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLdBreadcrumb) }}
      />
      <ModelPageView model={model} />
    </>
  )
}
