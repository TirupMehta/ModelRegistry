import type { Metadata } from "next"
import Link from "next/link"
import Header from "@/components/header"
import { companies } from "@/data/companies"
import { modelsData } from "@/data/models"
import { datasetRevision } from "@/data/revision"
import { safeJsonLd } from "@/lib/utils"
import { breadcrumbList, comparisonPairs, compareHref, SITE } from "@/lib/seo"
import { ArrowLeft, ArrowUpRight } from "lucide-react"

export const metadata: Metadata = {
  title: "AI model comparisons: head-to-head specs, price and context",
  description:
    "Side-by-side comparisons of frontier AI models from different laboratories: context window, list price per 1M tokens, max output, open-weight access, release date and lab-published benchmarks.",
  alternates: { canonical: `${SITE}/compare` },
  openGraph: {
    title: "AI model comparisons - ModelRegistry",
    description:
      "Head-to-head specs, price per 1M tokens, context window and benchmark comparisons for frontier AI models.",
    url: `${SITE}/compare`,
    siteName: "ModelRegistry",
    type: "website",
  },
}

export default function CompareIndexPage() {
  const pairs = comparisonPairs(modelsData)

  // Group by the alphabetically-first model's laboratory so each pair is
  // listed exactly once and the page reads as a directory, not a matrix.
  const grouped = new Map<string, { a: (typeof modelsData)[number]; b: (typeof modelsData)[number] }[]>()
  for (const pair of pairs) {
    const key = pair.a.companyId
    const bucket = grouped.get(key)
    if (bucket) bucket.push(pair)
    else grouped.set(key, [pair])
  }

  const sections = [...grouped.entries()].sort((x, y) => {
    const xName = companies[x[0]]?.name ?? x[0]
    const yName = companies[y[0]]?.name ?? y[0]
    return xName.localeCompare(yName)
  })

  const jsonLdCollection = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${SITE}/compare#collection`,
    name: "AI model comparisons",
    description:
      "Head-to-head comparisons of frontier AI models across laboratories, covering context window, pricing, output limits, licence and published benchmarks.",
    url: `${SITE}/compare`,
    isPartOf: { "@id": `${SITE}/#website` },
    dateModified: datasetRevision.revisedAt,
    numberOfItems: pairs.length,
  }

  const jsonLdItemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Frontier AI model head-to-head comparisons",
    url: `${SITE}/compare`,
    numberOfItems: pairs.length,
    itemListElement: pairs.map((pair, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: `${pair.a.name} vs ${pair.b.name}`,
      url: `${SITE}${compareHref(pair.a, pair.b)}`,
    })),
  }

  return (
    <main className="relative min-h-screen">
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLdCollection) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLdItemList) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(
            breadcrumbList([
              { name: "Ledger", path: "/" },
              { name: "Comparisons", path: "/compare" },
            ]),
          ),
        }}
      />

      <section className="max-w-4xl mx-auto w-full px-4 sm:px-6 md:px-20 pb-20">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2.5 mb-7 text-xs font-sans leading-relaxed text-black/50 dark:text-zinc-400"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-1 hover:text-accent-ink transition-colors duration-150"
          >
            <ArrowLeft size={13} />
            <span>Ledger</span>
          </Link>
          <span>/</span>
          <span className="font-medium text-accent-ink">Comparisons</span>
        </nav>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-semibold tracking-tight text-black dark:text-white mb-3">
          AI model comparisons
        </h1>
        <p className="mb-5 flex items-center gap-2 text-xs font-sans text-black/50 dark:text-zinc-500">
          <span>{pairs.length} cross-lab pairs</span>
          <span className="h-3 w-px bg-black/10 dark:bg-white/15" aria-hidden="true" />
          <span>Dataset revised</span>
          <time dateTime={datasetRevision.revisedAt} className="tabular-nums">
            {datasetRevision.revisedAt}
          </time>
        </p>
        <p className="text-base text-black/70 dark:text-zinc-300 leading-7 mb-8 max-w-2xl">
          Two models from different laboratories on the same axes: context window, output limit, list
          price, licence, release date and benchmarks both laboratories published for the same test.
          Nothing is ranked. Where the evidence cannot support a comparison, the page says so.
        </p>

        <div className="space-y-9">
          {sections.map(([companyId, group]) => {
            const lab = companies[companyId]
            return (
              <div key={companyId}>
                <h2 className="text-base font-sans font-semibold text-black dark:text-white mb-3 flex items-baseline gap-2">
                  <span
                    className="inline-block w-2 h-2 rounded-sm shrink-0 translate-y-[-1px]"
                    style={{ backgroundColor: lab?.accentColor ?? "#888" }}
                    aria-hidden="true"
                  />
                  <span>{lab?.name ?? companyId}</span>
                  <span className="text-xs font-normal text-black/35 dark:text-zinc-500 tabular-nums">
                    {group.length}
                  </span>
                </h2>
                <ul className="border-t border-black/10 dark:border-white/[0.08]">
                  {group.map((pair) => (
                    <li
                      key={`${pair.a.id}-${pair.b.id}`}
                      className="border-b border-black/10 dark:border-white/[0.08]"
                    >
                      <Link
                        href={compareHref(pair.a, pair.b)}
                        className="group flex flex-wrap items-baseline gap-x-2 gap-y-1 py-3 text-sm transition-colors duration-150"
                      >
                        <span className="font-medium tracking-tight text-black dark:text-white group-hover:text-accent-ink">
                          {pair.a.name}
                        </span>
                        <span className="text-xs font-sans text-black/35 dark:text-zinc-500">
                          vs
                        </span>
                        <span className="font-medium tracking-tight text-black dark:text-white group-hover:text-accent-ink">
                          {pair.b.name}
                        </span>
                        <span className="ml-auto text-xs font-sans text-black/40 dark:text-zinc-500">
                          {pair.b.companyName}
                        </span>
                        <ArrowUpRight
                          size={12}
                          className="opacity-40 group-hover:opacity-100 transition-opacity shrink-0"
                          aria-hidden="true"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </section>
    </main>
  )
}
