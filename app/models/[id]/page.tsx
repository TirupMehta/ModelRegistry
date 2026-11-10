import { notFound, redirect } from "next/navigation"
import { Metadata } from "next"
import { modelsData } from "@/data/models"
import { companies } from "@/data/companies"
import { resolveCompanyFallback } from "@/lib/model-fallback"
import { modelSiblings, modelFolio } from "@/lib/registry"
import { ORGANIZATION_ID, PERSON_ID, WEBSITE_ID } from "@/lib/entities"
import { measuredProperties } from "@/lib/seo"
import { safeJsonLd } from "@/lib/utils"
import Header from "@/components/header"
import ModelPageView from "@/components/model-page-view"
import { ModelComparisons, ModelEvidence, ModelFaq, ModelPositions, ModelProvenance } from "@/components/model-dossier"

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
  // The publisher/maintainer refs connect the datasheet to the site and to the
  // person who keeps it, so "who says this" resolves to a real entity instead
  // of an anonymous page.
  const company = companies[model.companyId]
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "@id": `https://modelregistry.tirup.in/models/${model.id}#datasheet`,
    headline: `${model.name} - specs, context and benchmarks`,
    description: model.highlight,
    datePublished: model.releaseDate,
    dateModified: model.lastVerifiedAt,
    author: { "@id": ORGANIZATION_ID },
    publisher: { "@id": ORGANIZATION_ID },
    maintainer: { "@id": PERSON_ID },
    isPartOf: { "@id": WEBSITE_ID },
    mainEntityOfPage: `https://modelregistry.tirup.in/models/${model.id}`,
    about: {
      "@type": "Organization",
      name: model.companyName,
      ...(company?.website ? { url: company.website } : {}),
    },
    citation: model.sources.map((s) => s.url),
    keywords: [
      model.name,
      `${model.name} specs`,
      `${model.name} context window`,
      `${model.name} pricing`,
      model.companyName,
      model.categoryLabel,
      "AI model specifications",
      "model datasheet",
    ],
    inLanguage: "en",
    isAccessibleForFree: true,
    url: `https://modelregistry.tirup.in/models/${model.id}`,
    // Numeric facts as machine data rather than prose, so an answer engine can
    // read the context window and the price without parsing a sentence.
    variableMeasured: measuredProperties(model),
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["h1", "#model-faq"],
    },
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
      <ModelPageView model={model} siblings={siblings} folio={folio} folioId={folioId}>
        <ModelProvenance model={model} />
        <ModelPositions model={model} />
        <ModelEvidence model={model} />
        <ModelFaq model={model} />
        <ModelComparisons model={model} />
      </ModelPageView>
    </>
  )
}
