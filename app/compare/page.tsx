import type { Metadata } from "next"
import Link from "next/link"
import Header from "@/components/header"
import { companies } from "@/data/companies"
import { modelsData } from "@/data/models"
import { datasetRevision } from "@/data/revision"
import { safeJsonLd } from "@/lib/utils"
import { breadcrumbList, comparisonPairs, compareHref, SITE } from "@/lib/seo"
import { independentFor } from "@/lib/independent"
import ComparePicker, { type PickerModel } from "@/components/compare-picker"
import { ArrowLeft, ArrowUpRight, ChevronDown } from "lucide-react"

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

  // Data for the picker: who can be compared with whom. Only real pair pages are offered.
  const pickerModels = new Map<string, PickerModel>()
  const partners: Record<string, string[]> = {}
  for (const { a, b } of pairs) {
    for (const m of [a, b]) pickerModels.set(m.id, { id: m.id, name: m.name, lab: m.companyName })
    ;(partners[a.id] ??= []).push(b.id)
    ;(partners[b.id] ??= []).push(a.id)
  }
  const pickerList = [...pickerModels.values()].sort((x, y) => x.name.localeCompare(y.name))
  // The strongest independently measured models first: a pair is as notable as its weaker member.
  const index = (id: string) => independentFor(id)?.values.intelligenceIndex ?? 0
  const popular = pairs
    .filter((p) => index(p.a.id) > 0 && index(p.b.id) > 0)
    .sort((x, y) => Math.min(index(y.a.id), index(y.b.id)) - Math.min(index(x.a.id), index(x.b.id)) || (index(y.a.id) + index(y.b.id)) - (index(x.a.id) + index(x.b.id)))
    .slice(0, 6)

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

      <section className="page">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2.5 mb-7 text-small font-sans leading-relaxed text-fg-muted"
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

        <h1 className="text-page font-display font-semibold tracking-tight text-black dark:text-white mb-3">
          AI model comparisons
        </h1>
        <p className="mb-5 flex items-center gap-2 text-small font-sans text-fg-muted">
          <span>{pairs.length} cross-lab pairs</span>
          <span className="h-3 w-px bg-black/10 dark:bg-white/15" aria-hidden="true" />
          <span>Dataset revised</span>
          <time dateTime={datasetRevision.revisedAt} className="tabular-nums">
            {datasetRevision.revisedAt}
          </time>
        </p>
        <p className="mb-5 max-w-2xl text-body leading-6 text-fg-muted">
          Pick two models to see them side by side.
        </p>

        <ComparePicker models={pickerList} partners={partners} />

        {popular.length > 0 && (
          <div className="mt-7">
            <h2 className="mb-2.5 text-body font-semibold text-black dark:text-white">Popular comparisons</h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {popular.map((pair) => (
                <li key={`${pair.a.id}-${pair.b.id}`}>
                  <Link
                    href={compareHref(pair.a, pair.b)}
                    className="tile-link group flex items-center justify-between gap-3 px-3.5 py-2.5 text-body"
                  >
                    <span className="min-w-0 truncate text-black dark:text-white">
                      {pair.a.name} <span className="text-fg-muted">vs</span> {pair.b.name}
                    </span>
                    <ArrowUpRight size={14} className="shrink-0 opacity-40 transition-opacity group-hover:opacity-100" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <details className="group mt-7 rounded-lg border border-black/10 dark:border-white/[0.08]">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-3.5 py-2.5 text-body [&::-webkit-details-marker]:hidden">
            <span className="font-medium text-black dark:text-white">All {pairs.length} comparisons</span>
            <ChevronDown size={14} className="ml-auto text-fg-muted transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div className="border-t border-black/10 px-4 py-5 dark:border-white/[0.08]">
        <div className="space-y-9">
          {sections.map(([companyId, group]) => {
            const lab = companies[companyId]
            return (
              <div key={companyId}>
                <h2 className="text-title font-sans font-semibold text-black dark:text-white mb-3 flex items-baseline gap-2">
                  <span
                    className="inline-block w-2 h-2 rounded-sm shrink-0 translate-y-[-1px]"
                    style={{ backgroundColor: lab?.accentColor ?? "#888" }}
                    aria-hidden="true"
                  />
                  <span>{lab?.name ?? companyId}</span>
                  <span className="text-small font-normal text-fg-muted tabular-nums">
                    {group.length}
                  </span>
                </h2>
                <ul className="rule-t">
                  {group.map((pair) => (
                    <li
                      key={`${pair.a.id}-${pair.b.id}`}
                      className="rule-b"
                    >
                      <Link
                        href={compareHref(pair.a, pair.b)}
                        className="group flex flex-wrap items-baseline gap-x-2 gap-y-1 py-3 text-body transition-colors duration-150"
                      >
                        <span className="font-medium tracking-tight text-black dark:text-white group-hover:text-accent-ink">
                          {pair.a.name}
                        </span>
                        <span className="text-small font-sans text-fg-muted">
                          vs
                        </span>
                        <span className="font-medium tracking-tight text-black dark:text-white group-hover:text-accent-ink">
                          {pair.b.name}
                        </span>
                        <span className="ml-auto text-small font-sans text-fg-muted">
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
          </div>
        </details>
      </section>
    </main>
  )
}
