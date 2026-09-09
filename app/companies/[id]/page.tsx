import Link from "next/link"
import { notFound } from "next/navigation"
import { Metadata } from "next"
import Header from "@/components/header"
import TextWithBlur from "@/components/text-with-blur"
import { companies } from "@/data/companies"
import { modelsData } from "@/data/models"
import { formatDate, getRelativeTimeString } from "@/lib/utils"
import { ArrowLeft, ArrowUpRight, Globe, Layers, Boxes, Sparkles } from "lucide-react"

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
      title: "Laboratory Not Found | ModelRegistry",
      description: "The requested AI laboratory could not be located in the registry.",
    }
  }

  const labModels = modelsData.filter((m) => m.companyId === lab.id)
  const flagship = labModels.find((m) => m.isCompanyFlagship)
  const title = `${lab.name} Models — ${flagship ? flagship.name : "Flagship"} & All Checkpoints | ModelRegistry`
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
    },
    twitter: {
      card: "summary_large_image",
      title: `${lab.name} — Models & Checkpoints`,
      description,
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
    name: `${lab.name} Models — ModelRegistry`,
    description: `Complete verified release history for ${lab.name}.`,
    url: `${SITE_URL}/companies/${lab.id}`,
  }

  return (
    <main className="relative min-h-screen">
      <Header />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrganization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFAQ) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdCollection) }}
      />

      <section className="section max-w-4xl mx-auto w-full px-4 sm:px-6 md:px-20 pb-20">
        {/* Breadcrumb */}
        <TextWithBlur>
          <div className="flex items-center gap-2.5 mb-7 text-xs font-sans tracking-wider leading-relaxed text-black/50 dark:text-zinc-400 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <Link
              href="/"
              className="inline-flex items-center gap-1 hover:text-[#ff5d2e] dark:hover:text-[#ff5d2e] transition-colors duration-150 shrink-0"
            >
              <ArrowLeft size={13} />
              <span>LEDGER</span>
            </Link>
            <span className="shrink-0">/</span>
            <Link
              href="/companies"
              className="hover:text-[#ff5d2e] dark:hover:text-[#ff5d2e] transition-colors duration-150 shrink-0"
            >
              <span>LABORATORIES</span>
            </Link>
            <span className="shrink-0">/</span>
            <span className="text-[#ff5d2e] font-medium truncate">{lab.shortName.toUpperCase()}</span>
          </div>
        </TextWithBlur>

        {/* Lab Hero */}
        <TextWithBlur delay={80}>
          <div className="p-5 sm:p-6 rounded-lg border border-black/10 dark:border-white/[0.08] bg-black/[0.015] dark:bg-[#111317] mb-6">
            <div className="flex items-start justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-4 h-4 rounded-sm shrink-0 shadow-sm"
                  style={{ backgroundColor: lab.accentColor }}
                />
                <div>
                  <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-black dark:text-white leading-none">
                    {lab.name}
                  </h1>
                  <p className="text-xs font-sans text-black/40 dark:text-zinc-400 mt-1.5">
                    ({lab.headquarters})
                  </p>
                </div>
              </div>

              <a
                href={lab.website}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-1 text-xs font-sans text-black/50 dark:text-zinc-400 hover:text-[#ff5d2e] dark:hover:text-[#ff7347] transition-colors duration-150 shrink-0 whitespace-nowrap pt-1"
              >
                <Globe size={12} />
                <span>{new URL(lab.website).hostname}</span>
                <ArrowUpRight size={11} className="opacity-60" />
              </a>
            </div>

            <p className="text-sm sm:text-[15px] font-normal text-black/65 dark:text-zinc-300 mt-3 leading-relaxed max-w-2xl">
              {lab.description}
            </p>

            {/* Lab Stats Strip */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-4 pt-4 border-t border-black/5 dark:border-white/[0.06] text-[11px] font-sans tracking-wider text-black/45 dark:text-zinc-400 tabular-nums">
              <span className="inline-flex items-center gap-1.5">
                <Layers size={11} className="text-[#ff5d2e]" />
                {labModels.length} MODEL{labModels.length === 1 ? "" : "S"} TRACKED
              </span>
              {openCount > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Boxes size={11} className="text-[#ff5d2e]" />
                  {openCount} OPEN WEIGHTS
                </span>
              )}
              {newest && (
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles size={11} className="text-[#1a73e8] dark:text-[#8ab4f8]" />
                  NEWEST: {newest.name.toUpperCase()} · {getRelativeTimeString(newest.releaseDate).toUpperCase()}
                </span>
              )}
            </div>
          </div>
        </TextWithBlur>

        {/* Complete History */}
        <TextWithBlur delay={140}>
          <div className="flex items-baseline justify-between gap-3 mb-2">
            <h2 className="text-sm font-sans font-medium tracking-wider text-black/60 dark:text-zinc-300 uppercase">
              Complete Release History
            </h2>
            <span className="text-[11px] font-sans text-black/35 dark:text-zinc-500 tabular-nums">
              NEWEST FIRST
            </span>
          </div>
        </TextWithBlur>

        <div className="flex flex-col">
          {labModels.map((model, index) => (
            <TextWithBlur key={model.id} delay={Math.min(index * 30, 180)}>
              <Link
                href={`/models/${model.id}`}
                className="group cursor-pointer block py-4 md:py-5 -mx-3 px-3 rounded-lg border-t border-black/10 dark:border-white/10 [transition:background-color_120ms_ease-out,transform_100ms_cubic-bezier(0.16,1,0.3,1)] hover:bg-black/[0.025] dark:hover:bg-white/[0.025] active:scale-[0.99]"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <div className="flex items-baseline gap-3 sm:gap-5 min-w-0">
                    <span className="font-sans tabular-nums text-xs md:text-sm text-black/35 dark:text-white/35 select-none w-5 sm:w-6 shrink-0 group-hover:text-black/60 dark:group-hover:text-white/60 [transition:color_80ms_ease-out]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-medium text-sm md:text-base text-black dark:text-white group-hover:text-[#ff5d2e] dark:group-hover:text-[#ff7347] [transition:color_80ms_ease-out]">
                          {model.name}
                        </span>
                        <span className="text-[11px] font-sans uppercase tracking-wider px-1.5 py-0.5 rounded border border-black/10 dark:border-white/10 text-black/60 dark:text-white/60 bg-black/[0.02] dark:bg-white/[0.03]">
                          {model.statusBadge}
                        </span>
                        {model.isCompanyFlagship && (
                          <span className="text-[11px] font-sans tracking-tight text-[#ff5d2e] dark:text-[#ff7347] font-medium">
                            • Flagship
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs sm:text-sm font-normal text-black/55 dark:text-white/55 leading-relaxed line-clamp-1 group-hover:text-black/75 dark:group-hover:text-white/75 [transition:color_80ms_ease-out]">
                        {model.highlight}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-5 shrink-0 text-right">
                    <div className="hidden sm:flex flex-col items-end">
                      <span className="font-sans text-xs text-black/60 dark:text-white/60 tabular-nums">
                        {model.categoryLabel}
                      </span>
                      <span className="text-[11px] font-sans text-black/35 dark:text-white/35">
                        {formatDate(model.releaseDate)}
                      </span>
                    </div>
                    <ArrowUpRight
                      size={14}
                      className="opacity-40 group-hover:opacity-100 group-hover:text-[#ff5d2e] shrink-0"
                    />
                  </div>
                </div>
              </Link>
            </TextWithBlur>
          ))}
        </div>

        <footer className="py-6 text-center border-t border-black/10 dark:border-white/[0.08] mt-8">
          <p className="text-[11px] font-sans text-black/50 dark:text-zinc-400">
            VERIFIED SPECIFICATIONS · SOURCED FROM OFFICIAL LAB RELEASES ·{" "}
            <Link href="/companies" className="hover:text-[#ff5d2e] transition-colors">
              ALL LABORATORIES
            </Link>
          </p>
        </footer>
      </section>
    </main>
  )
}
