import Link from "next/link"
import { notFound } from "next/navigation"
import { Metadata } from "next"
import Header from "@/components/header"
import TextWithBlur from "@/components/text-with-blur"
import { companies } from "@/data/companies"
import { modelsData } from "@/data/models"
import { formatDate, getRelativeTimeString, parseLocalDate, safeJsonLd } from "@/lib/utils"
import { ArrowLeft, ArrowUpRight, Globe, Layers, Boxes, Sparkles, Calendar } from "lucide-react"

interface Props {
  params: Promise<{ id: string }>
}

const SITE_URL = "https://modelregistry.tirup.in"

export async function generateStaticParams() {
  return Object.keys(companies).map((id) => ({ id }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const lab = companies[id.toLowerCase()]

  if (!lab) {
    return {
      title: "Laboratory Not Found",
      description: "The requested AI laboratory could not be located in the registry.",
    }
  }

  const labModels = modelsData.filter((m) => m.companyId === lab.id)
  const flagship = labModels.find((m) => m.isCompanyFlagship)
  const title = `${lab.name} Models - ${flagship ? flagship.name : "Flagship"} & All Checkpoints`
  const description = `${lab.description} Track every verified ${lab.name} release: ${labModels
    .slice(0, 4)
    .map((m) => m.name)
    .join(", ")}${labModels.length > 4 ? ", and more" : ""}.`

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/companies/${lab.id}`,
    },
    openGraph: {
      title: `${lab.name} on ModelRegistry`,
      description,
      url: `${SITE_URL}/companies/${lab.id}`,
      siteName: "ModelRegistry",
      type: "article",
      images: [
        {
          url: `${SITE_URL}/api/og?lab=${lab.id}`,
          width: 1200,
          height: 630,
          alt: `${lab.name} Laboratory Profile`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${lab.name} - Models & Checkpoints`,
      description,
      images: [`${SITE_URL}/api/og?lab=${lab.id}`],
    },
  }
}

export default async function CompanyPage({ params }: Props) {
  const { id } = await params
  const lab = companies[id.toLowerCase()]

  if (!lab) {
    notFound()
  }

  const labModels = modelsData
    .filter((m) => m.companyId === lab.id)
    .sort((a, b) => b.releaseDate.localeCompare(a.releaseDate))
  const flagship = labModels.find((m) => m.isCompanyFlagship)
  const newest = labModels[0]
  const openCount = labModels.filter((m) => m.openWeights).length

  // Month-grouped release rail (same grouping as /timeline)
  const groupedTimeline: { [key: string]: typeof labModels } = {}
  labModels.forEach((model) => {
    const d = parseLocalDate(model.releaseDate)
    const monthYear = d.toLocaleDateString("en-US", { month: "long", year: "numeric" })
    if (!groupedTimeline[monthYear]) {
      groupedTimeline[monthYear] = []
    }
    groupedTimeline[monthYear].push(model)
  })

  const faqAnswer = flagship
    ? `${lab.name}'s primary flagship model is ${flagship.name} (${flagship.parameters}, ${flagship.contextWindow} context). ${flagship.highlight}${
        newest && newest.id !== flagship.id
          ? ` Their latest release is ${newest.name} (${newest.categoryLabel}, released ${newest.releaseDate}).`
          : ""
      }`
    : `ModelRegistry tracks verified releases from ${lab.name} in its open technical index.`

  const jsonLdOrganization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: lab.name,
    url: lab.website,
    description: lab.description,
    location: lab.headquarters,
  }

  const jsonLdFAQ = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `What is the latest AI model from ${lab.name}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: faqAnswer,
        },
      },
    ],
  }

  const jsonLdCollection = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${lab.name} Models - ModelRegistry`,
    description: `Complete verified release history for ${lab.name}.`,
    url: `${SITE_URL}/companies/${lab.id}`,
  }

  // Mirrors the visible LEDGER / LABORATORIES / {LAB} breadcrumb trail.
  const jsonLdBreadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Ledger", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Laboratories", item: `${SITE_URL}/companies` },
      { "@type": "ListItem", position: 3, name: lab.name, item: `${SITE_URL}/companies/${lab.id}` },
    ],
  }

  return (
    <main className="relative min-h-screen">
      <Header />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLdOrganization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLdFAQ) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLdCollection) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLdBreadcrumb) }}
      />

      <section className="section max-w-4xl mx-auto w-full px-4 sm:px-6 md:px-20 pb-20">
        {/* Breadcrumb */}
        <TextWithBlur>
          <div className="flex items-center gap-2.5 mb-7 text-small font-sans leading-relaxed text-fg-muted overflow-x-auto whitespace-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <Link
              href="/"
              className="inline-flex items-center gap-1 hover:text-accent-ink transition-colors duration-150 shrink-0"
            >
              <ArrowLeft size={13} />
              <span>Ledger</span>
            </Link>
            <span className="shrink-0">/</span>
            <Link
              href="/companies"
              className="hover:text-accent-ink transition-colors duration-150 shrink-0"
            >
              <span>Laboratories</span>
            </Link>
            <span className="shrink-0">/</span>
            <span className="truncate font-medium text-accent-ink">{lab.shortName}</span>
          </div>
        </TextWithBlur>

        {/* Lab Hero */}
        <TextWithBlur delay={80}>
          <div className="p-4 sm:p-6 rounded-lg border border-black/10 dark:border-white/[0.08] bg-black/[0.015] dark:bg-[var(--surface-raised)] mb-6">
            <div className="flex items-start justify-between gap-3 sm:gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className="w-4 h-4 rounded-sm shrink-0 shadow-sm mt-1 sm:mt-2"
                  style={{ backgroundColor: lab.accentColor }}
                />
                <div>
                  <h1 className="font-display text-heading font-semibold tracking-tight text-black sm:text-page dark:text-white">
                    {lab.name}
                  </h1>
                  <p className="text-small font-sans text-fg-muted mt-1.5">
                    ({lab.headquarters})
                  </p>
                </div>
              </div>

              <a
                href={lab.website}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-1 text-small font-sans text-fg-muted hover:text-accent-ink transition-colors duration-150 shrink-0 whitespace-nowrap pt-1"
              >
                <Globe size={12} />
                <span>{new URL(lab.website).hostname}</span>
                <ArrowUpRight size={11} className="opacity-60" />
              </a>
            </div>

            <p className="text-body font-normal text-fg-muted mt-3 leading-relaxed max-w-2xl">
              {lab.description}
            </p>

            {/* Lab Stats Strip */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-4 pt-4 border-t border-black/5 dark:border-white/[0.06] text-small font-sans text-fg-muted tabular-nums">
              <span className="inline-flex items-center gap-1.5">
                <Layers size={11} className="text-accent-ink" />
                {labModels.length} model{labModels.length === 1 ? "" : "s"} tracked
              </span>
              {openCount > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Boxes size={11} className="text-accent-ink" />
                  {openCount} open weights
                </span>
              )}
              {newest && (
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles size={11} className="text-accent-ink" />
                  Newest: {newest.name}, {getRelativeTimeString(newest.releaseDate)}
                </span>
              )}
            </div>
          </div>
        </TextWithBlur>

        {/* Visible answer matching the FAQPage schema below */}
        <TextWithBlur delay={110}>
          <div className="mb-6 rounded-xl border border-black/10 dark:border-white/[0.08] bg-black/[0.015] dark:bg-white/[0.02] p-4 sm:p-5">
            <h2 className="text-body font-medium tracking-tight text-black dark:text-white mb-1.5">
              What is the latest AI model from {lab.name}?
            </h2>
            <p className="text-small font-sans text-fg-muted leading-relaxed">
              {faqAnswer}{" "}
              <Link
                href="/methodology"
                className="text-accent-ink hover:underline underline-offset-2 whitespace-nowrap"
              >
                How we define “latest”
              </Link>
            </p>
          </div>
        </TextWithBlur>

        {/* Release Timeline (month-grouped rail, mirrors /timeline) */}
        <TextWithBlur delay={140}>
          <div className="flex items-baseline justify-between gap-3 mb-5">
            <h2 className="text-body font-sans font-medium text-fg-muted">
              Release Timeline
            </h2>
            <span className="text-small font-sans text-fg-muted tabular-nums">
              NEWEST FIRST
            </span>
          </div>
        </TextWithBlur>

        <div className="flex flex-col space-y-7">
          {Object.entries(groupedTimeline).map(([monthYear, group], gIndex) => (
            <TextWithBlur key={monthYear} delay={Math.min(gIndex * 40, 160)}>
              <div className="border-l-2 border-black/10 dark:border-white/[0.08] pl-3.5 sm:pl-6 ml-1.5 sm:ml-2 relative">
                <div
                  className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-sm"
                  style={{ backgroundColor: lab.accentColor }}
                />

                <h3 className="text-title font-medium text-black dark:text-white mb-3.5 flex items-center gap-2 font-sans">
                  <Calendar size={14} style={{ color: lab.accentColor }} />
                  <span>{monthYear}</span>
                  <span className="text-small text-fg-muted font-normal">
                    [{group.length} {group.length === 1 ? "release" : "releases"}]
                  </span>
                </h3>

                <div className="space-y-3">
                  {group.map((model) => (
                    <Link
                      key={model.id}
                      href={`/models/${model.id}`}
                      className="group cursor-pointer block p-3.5 sm:p-4 rounded-md border border-black/10 dark:border-white/[0.08] bg-black/[0.015] dark:bg-[var(--surface-field)] hover:border-accent/40 transition-colors duration-150 select-none"
                    >
                      <div className="mb-1.5">
                        <div className="font-sans text-body sm:text-title font-medium tracking-tight leading-snug text-black dark:text-white group-hover:text-accent-ink transition-colors duration-150">
                          {model.name}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 mt-1.5 font-sans">
                          <span className="text-small px-1.5 py-0.5 rounded border border-black/10 dark:border-white/10 text-fg-muted dark:text-white/60 bg-black/[0.02] dark:bg-white/[0.03] whitespace-nowrap">
                            {model.statusBadge}
                          </span>
                          {model.isCompanyFlagship && (
                            <span className="text-small tracking-tight text-accent-ink font-medium whitespace-nowrap">
                              • Flagship
                            </span>
                          )}
                          <span className="ml-auto text-small text-fg-muted tabular-nums whitespace-nowrap">
                            {formatDate(model.releaseDate)}
                          </span>
                        </div>
                      </div>

                      <p className="text-small sm:text-body font-normal text-fg-muted leading-relaxed mb-2 line-clamp-2">
                        {model.highlight}
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-y-1.5 gap-x-3 text-small pt-2 border-t border-black/5 dark:border-white/[0.06] font-sans">
                        <span className="text-small text-fg-muted">
                          {model.categoryLabel}
                        </span>
                        <span className="inline-flex items-center gap-1 text-small text-fg-muted group-hover:text-accent-ink transition-colors shrink-0">
                          OPEN DATASHEET <ArrowUpRight size={10} className="opacity-60" />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </TextWithBlur>
          ))}
        </div>

      </section>
    </main>
  )
}
