import { notFound, redirect } from "next/navigation"
import { Metadata } from "next"
import { modelsData } from "@/data/models"
import { resolveCompanyFallback } from "@/lib/model-fallback"
import { modelSiblings, modelFolio } from "@/lib/registry"
import { safeJsonLd } from "@/lib/utils"
import Header from "@/components/header"
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

  const title = `${model.name} (${model.companyName}) - Specs, Context & Benchmarks`
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
      title: `${model.name} - Technical Specs & Benchmarks`,
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

  // JSON-LD: this page is a registry datasheet about the model (a
  // TechArticle), not the model software itself - so no Software-Application
  // type is emitted. Citations point at the primary sources behind the record.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: `${model.name} - specs, context and benchmarks`,
    description: model.highlight,
    datePublished: model.releaseDate,
    dateModified: model.lastVerifiedAt,
    author: {
      "@type": "Organization",
      name: "ModelRegistry",
      url: "https://modelregistry.tirup.in",
    },
    about: {
      "@type": "Organization",
      name: model.companyName,
    },
    citation: model.sources.map((s) => s.url),
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

  // Sibling links and export folio are derived server-side so the client
  // view never bundles the dataset for them.
  const siblings = modelSiblings(model, 3, modelsData)
  const { folio, folioId } = modelFolio(model.id, modelsData)

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
      <Header />
      <ModelPageView model={model} siblings={siblings} folio={folio} folioId={folioId} />
    </>
  )
}
