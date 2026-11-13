import Link from "next/link"
import { notFound } from "next/navigation"
import { Metadata } from "next"
import Header from "@/components/header"
import TextWithBlur from "@/components/text-with-blur"
import { companies } from "@/data/companies"
import { modelsData } from "@/data/models"
import { formatDate, getRelativeTimeString, parseLocalDate, safeJsonLd } from "@/lib/utils"
import { ArrowLeft, ArrowUpRight, ChevronDown } from "lucide-react"

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
    ? `${lab.name}'s primary flagship model is ${flagship.name}. ${flagship.highlight}${
        newest && newest.id !== flagship.id
          ? ` Its latest release is ${newest.name} (${newest.categoryLabel}, released ${newest.releaseDate}).`
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

        {/* Lab header: name, where, link, one line of counts, then the description. */}
        <TextWithBlur delay={80}>
          <header className="mb-10">
            <h1 className="font-display text-page font-semibold tracking-tight text-fg-strong">{lab.name}</h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-small text-fg-muted">
              <span>{lab.headquarters}</span>
              <a
                href={lab.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 transition-colors hover:text-accent-ink"
              >
                {new URL(lab.website).hostname}
                <ArrowUpRight size={12} aria-hidden="true" />
              </a>
            </p>
            <p className="mt-4 max-w-2xl text-body leading-7 text-fg">{lab.description}</p>
            <p className="mt-4 text-small tabular-nums text-fg-muted">
              {labModels.length} model{labModels.length === 1 ? "" : "s"} tracked
              {openCount > 0 ? ` · ${openCount} open weights` : ""}
              {newest ? ` · newest: ${newest.name}, ${getRelativeTimeString(newest.releaseDate).toLowerCase()}` : ""}
            </p>
          </header>
        </TextWithBlur>

        {/* Visible answer matching the FAQPage schema; folded so it does not repeat the description. */}
        <TextWithBlur delay={110}>
          <details className="group mb-10 rounded-lg bg-black/[0.025] px-4 py-3 dark:bg-white/[0.03]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-small font-medium text-fg-strong [&::-webkit-details-marker]:hidden">
              <h2 className="text-small font-medium">What is the latest AI model from {lab.name}?</h2>
              <ChevronDown size={14} aria-hidden="true" className="shrink-0 text-fg-muted transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-3 text-small leading-6 text-fg">
              {faqAnswer}{" "}
              <Link href="/methodology" className="whitespace-nowrap text-accent-ink underline-offset-4 hover:underline">
                How we define &ldquo;latest&rdquo;
              </Link>
            </p>
          </details>
        </TextWithBlur>

        <TextWithBlur delay={140}>
          <h2 className="mb-5 font-display text-heading font-semibold tracking-tight text-fg-strong">Releases</h2>
        </TextWithBlur>

        <div className="space-y-8">
          {Object.entries(groupedTimeline).map(([monthYear, group], gIndex) => (
            <TextWithBlur key={monthYear} delay={Math.min(gIndex * 40, 160)}>
              <section aria-label={monthYear}>
                <h3 className="mb-3 text-small font-medium text-fg-muted">
                  {monthYear} <span className="font-normal">· {group.length} {group.length === 1 ? "release" : "releases"}</span>
                </h3>
                <ul className="space-y-2.5">
                  {group.map((model) => (
                    <li key={model.id}>
                      <Link
                        href={`/models/${model.id}`}
                        className="group block rounded-xl bg-black/[0.025] p-4 transition-colors hover:bg-black/[0.05] dark:bg-white/[0.03] dark:hover:bg-white/[0.06] sm:p-5"
                      >
                        <div className="flex items-baseline gap-3">
                          <span className="min-w-0 truncate font-display text-title font-semibold tracking-tight text-fg-strong transition-colors group-hover:text-accent-ink">
                            {model.name}
                          </span>
                          {model.isCompanyFlagship && <span className="shrink-0 text-small font-medium text-accent-ink">Flagship</span>}
                          <time dateTime={model.releaseDate} className="ml-auto shrink-0 text-small tabular-nums text-fg-muted">
                            {formatDate(model.releaseDate)}
                          </time>
                        </div>
                        <p className="mt-0.5 text-small text-fg-muted">
                          {model.categoryLabel} · {model.statusBadge}
                        </p>
                        <p className="mt-2 line-clamp-2 text-body leading-6 text-fg">{model.highlight}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            </TextWithBlur>
          ))}
        </div>

      </section>
    </main>
  )
}
