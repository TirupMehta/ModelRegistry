import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import Header from "@/components/header"
import { companies } from "@/data/companies"
import { modelsData } from "@/data/models"
import { datasetRevision } from "@/data/revision"
import { formatDate, safeJsonLd } from "@/lib/utils"
import {
  SITE,
  breadcrumbList,
  buildComparison,
  compareHref,
  comparisonPairs,
  faqPage,
  resolveComparison,
} from "@/lib/seo"
import { ArrowLeft, ArrowUpRight, Check, ChevronDown } from "lucide-react"

interface Props {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return comparisonPairs(modelsData).map((pair) => ({
    slug: compareHref(pair.a, pair.b).replace("/compare/", ""),
  }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const pair = resolveComparison(slug, modelsData)

  if (!pair) {
    return {
      title: "Comparison not found",
      description: "This model comparison is not part of the registry.",
      robots: { index: false, follow: true },
    }
  }

  const { a, b } = pair
  const { summary } = buildComparison(a, b)
  const title = `${a.name} vs ${b.name}: context, price and benchmarks`
  const description = summary.slice(0, 300)

  return {
    title,
    description,
    alternates: { canonical: `${SITE}/compare/${slug}` },
    openGraph: {
      title: `${a.name} vs ${b.name}`,
      description,
      url: `${SITE}/compare/${slug}`,
      siteName: "ModelRegistry",
      type: "article",
      images: [
        {
          url: `${SITE}/api/og?model=${a.id}`,
          width: 1200,
          height: 630,
          alt: `${a.name} vs ${b.name}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${a.name} vs ${b.name}`,
      description,
      images: [`${SITE}/api/og?model=${a.id}`],
    },
  }
}

export default async function ComparePage({ params }: Props) {
  const { slug } = await params
  const pair = resolveComparison(slug, modelsData)
  if (!pair) notFound()

  const { a, b } = pair
  const comparison = buildComparison(a, b)
  const labA = companies[a.companyId]
  const labB = companies[b.companyId]
  const canonical = `${SITE}/compare/${slug}`

  // Related: other pairings of these two models, current one excluded.
  const related = comparisonPairs(modelsData)
    .filter(
      (candidate) =>
        (candidate.a.id === a.id || candidate.b.id === a.id || candidate.a.id === b.id || candidate.b.id === b.id) &&
        !(candidate.a.id === a.id && candidate.b.id === b.id) &&
        !(candidate.a.id === b.id && candidate.b.id === a.id),
    )
    .slice(0, 8)

  const jsonLdArticle = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "@id": `${canonical}#comparison`,
    headline: `${a.name} vs ${b.name}`,
    description: comparison.summary,
    datePublished: a.releaseDate < b.releaseDate ? b.releaseDate : a.releaseDate,
    dateModified: datasetRevision.revisedAt,
    author: { "@id": `${SITE}/#organization` },
    publisher: { "@id": `${SITE}/#organization` },
    isPartOf: { "@id": `${SITE}/#website` },
    mainEntityOfPage: canonical,
    url: canonical,
    inLanguage: "en",
    isAccessibleForFree: true,
    about: [
      {
        "@type": "Organization",
        name: a.companyName,
        ...(labA?.website ? { url: labA.website } : {}),
      },
      {
        "@type": "Organization",
        name: b.companyName,
        ...(labB?.website ? { url: labB.website } : {}),
      },
    ],
    mentions: [
      { "@type": "Thing", name: a.name, url: `${SITE}/models/${a.id}` },
      { "@type": "Thing", name: b.name, url: `${SITE}/models/${b.id}` },
    ],
    citation: [...new Set([...a.sources.map((s) => s.url), ...b.sources.map((s) => s.url)])].slice(0, 12),
    keywords: [
      `${a.name} vs ${b.name}`,
      `${b.name} vs ${a.name}`,
      `${a.name} comparison`,
      `${b.name} comparison`,
      `${a.name} pricing`,
      `${b.name} pricing`,
      `${a.name} context window`,
      `${b.name} context window`,
      "AI model comparison",
      "LLM comparison",
    ],
  }

  return (
    <main className="relative min-h-screen">
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLdArticle) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(faqPage(comparison.faq)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(
            breadcrumbList([
              { name: "Ledger", path: "/" },
              { name: "Comparisons", path: "/compare" },
              { name: `${a.name} vs ${b.name}`, path: `/compare/${slug}` },
            ]),
          ),
        }}
      />

      <section className="max-w-4xl mx-auto w-full px-4 sm:px-6 md:px-20 pb-20">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2.5 mb-7 text-xs font-sans leading-relaxed text-black/50 dark:text-zinc-400 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-1 hover:text-accent-ink transition-colors duration-150 shrink-0"
          >
            <ArrowLeft size={13} />
            <span>Ledger</span>
          </Link>
          <span className="shrink-0">/</span>
          <Link href="/compare" className="hover:text-accent-ink transition-colors duration-150 shrink-0">
            Comparisons
          </Link>
          <span className="shrink-0">/</span>
          <span className="truncate font-medium text-accent-ink">
            {a.name} vs {b.name}
          </span>
        </nav>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-semibold tracking-tight text-black dark:text-white mb-3">
          {a.name} vs {b.name}
        </h1>
        <p className="mb-5 flex flex-wrap items-center gap-2 text-xs font-sans text-black/50 dark:text-zinc-500">
          <span>
            {a.companyName} vs {b.companyName}
          </span>
          <span className="h-3 w-px bg-black/10 dark:bg-white/15" aria-hidden="true" />
          <span>Dataset revised</span>
          <time dateTime={datasetRevision.revisedAt} className="tabular-nums">
            {datasetRevision.revisedAt}
          </time>
        </p>

        {/* Answer - the passage an answer engine should quote, built from the
            differences rather than from the fact that both records exist. */}
        <div className="rounded-xl border border-black/10 dark:border-white/[0.08] bg-black/[0.015] dark:bg-white/[0.02] p-4 sm:p-5 mb-6">
          <h2 className="text-xs font-sans font-semibold uppercase tracking-wide text-black/45 dark:text-zinc-500 mb-2">
            Answer
          </h2>
          <p className="text-base text-black/70 dark:text-zinc-300 leading-7">
            {comparison.summary}
          </p>
          {comparison.identical.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-sans text-black/40 dark:text-zinc-500 mr-1">
                Within 5% or equal
              </span>
              {comparison.identical.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center text-xs font-sans px-1.5 py-0.5 rounded border border-black/10 dark:border-white/10 text-black/60 dark:text-white/60 bg-black/[0.02] dark:bg-white/[0.03]"
                >
                  {item}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Where they differ, with the size of each gap */}
        <h2 className="text-base font-display font-semibold tracking-tight text-black dark:text-white mb-1">
          Where they differ
        </h2>
        <p className="text-sm font-sans text-black/50 dark:text-zinc-500 mb-3">
          {comparison.differences.length} axes with a real gap. The size of each gap is printed under
          the axis, because a five cent difference and a three times larger ceiling are not the same
          kind of fact.
        </p>
        <div className="overflow-x-auto mb-9 -mx-1 px-1">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-black/15 dark:border-white/[0.12]">
                <th scope="col" className="text-left py-2 pr-3 font-sans text-xs font-medium uppercase tracking-wide text-black/40 dark:text-zinc-500">
                  Axis
                </th>
                <th scope="col" className="text-left py-2 pr-3 font-sans text-sm font-semibold text-black dark:text-white">
                  {a.name}
                </th>
                <th scope="col" className="text-left py-2 font-sans text-sm font-semibold text-black dark:text-white">
                  {b.name}
                </th>
              </tr>
            </thead>
            <tbody>
              {comparison.differences.map((row) => (
                <tr key={row.label} className="border-b border-black/10 dark:border-white/[0.08] align-top">
                  <th scope="row" className="text-left py-3 pr-3 font-normal">
                    <span className="block text-sm font-sans text-black/70 dark:text-zinc-300">
                      {row.label}
                    </span>
                    <span className="mt-0.5 block text-xs font-sans text-accent-ink">
                      {row.delta}
                    </span>
                  </th>
                  <td
                    className={`py-3 pr-3 text-sm font-sans tabular-nums ${
                      row.edge === "a"
                        ? "font-semibold text-black dark:text-white"
                        : "text-black/55 dark:text-zinc-500"
                    }`}
                  >
                    {row.a}
                  </td>
                  <td
                    className={`py-3 text-sm font-sans tabular-nums ${
                      row.edge === "b"
                        ? "font-semibold text-black dark:text-white"
                        : "text-black/55 dark:text-zinc-500"
                    }`}
                  >
                    {row.b}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* At a glance */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-9">
          {[
            { model: a, lab: labA },
            { model: b, lab: labB },
          ].map(({ model, lab }) => (
            <Link
              key={model.id}
              href={`/models/${model.id}`}
              className="group block p-4 rounded-xl border border-black/10 dark:border-white/[0.08] bg-white dark:bg-[var(--surface-raised)] hover:border-accent/40 transition-colors duration-150"
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="inline-block w-2 h-2 rounded-sm shrink-0"
                  style={{ backgroundColor: lab?.accentColor ?? "#888" }}
                  aria-hidden="true"
                />
                <span className="text-xs font-sans text-black/45 dark:text-zinc-500 truncate">
                  {model.companyName}
                </span>
                <span className="ml-auto text-xs font-sans px-1.5 py-0.5 rounded border border-black/10 dark:border-white/10 text-black/60 dark:text-white/60 bg-black/[0.02] dark:bg-white/[0.03] whitespace-nowrap shrink-0">
                  {model.statusBadge}
                </span>
              </div>
              <div className="text-lg font-medium tracking-tight text-black dark:text-white group-hover:text-accent-ink transition-colors duration-150">
                {model.name}
              </div>
              <div className="mt-1 text-xs font-sans text-black/45 dark:text-zinc-400">
                {model.categoryLabel}, {formatDate(model.releaseDate)}
              </div>
              <p className="mt-2 text-sm font-sans text-black/60 dark:text-zinc-400 leading-6 line-clamp-3">
                {model.highlight}
              </p>
            </Link>
          ))}
        </div>

        {/* Spec table */}
        <h2 className="text-base font-display font-semibold tracking-tight text-black dark:text-white mb-3">
          Specification
        </h2>
        <div className="overflow-x-auto mb-9 -mx-1 px-1">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-black/15 dark:border-white/[0.12]">
                <th scope="col" className="text-left py-2 pr-3 font-sans text-xs font-medium uppercase tracking-wide text-black/40 dark:text-zinc-500">
                  Field
                </th>
                <th scope="col" className="text-left py-2 pr-3 font-sans text-sm font-semibold text-black dark:text-white">
                  {a.name}
                </th>
                <th scope="col" className="text-left py-2 font-sans text-sm font-semibold text-black dark:text-white">
                  {b.name}
                </th>
              </tr>
            </thead>
            <tbody>
              {comparison.facts.map((fact) => (
                <tr key={fact.label} className="border-b border-black/10 dark:border-white/[0.08] align-top">
                  <th
                    scope="row"
                    className="text-left py-2.5 pr-3 font-sans text-xs font-normal text-black/45 dark:text-zinc-500 whitespace-nowrap"
                  >
                    {fact.label}
                  </th>
                  <td
                    className={`py-2.5 pr-3 text-sm font-sans tabular-nums ${
                      fact.edge === "a"
                        ? "font-semibold text-black dark:text-white"
                        : "text-black/70 dark:text-zinc-300"
                    }`}
                  >
                    {fact.a}
                  </td>
                  <td
                    className={`py-2.5 text-sm font-sans tabular-nums ${
                      fact.edge === "b"
                        ? "font-semibold text-black dark:text-white"
                        : "text-black/70 dark:text-zinc-300"
                    }`}
                  >
                    {fact.b}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Benchmarks */}
        <h2 className="text-base font-display font-semibold tracking-tight text-black dark:text-white mb-1">
          Benchmarks both laboratories published
        </h2>
        <p className="text-sm font-sans text-black/50 dark:text-zinc-500 mb-3">
          Shown side by side only when both records name the same test and the same version.
        </p>
        {comparison.benchmarks.length > 0 ? (
          <div className="overflow-x-auto mb-4 -mx-1 px-1">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-black/15 dark:border-white/[0.12]">
                  <th scope="col" className="text-left py-2 pr-3 font-sans text-xs font-medium uppercase tracking-wide text-black/40 dark:text-zinc-500">
                    Test
                  </th>
                  <th scope="col" className="text-left py-2 pr-3 font-sans text-sm font-semibold text-black dark:text-white">
                    {a.name}
                  </th>
                  <th scope="col" className="text-left py-2 font-sans text-sm font-semibold text-black dark:text-white">
                    {b.name}
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparison.benchmarks.map((row) => (
                  <tr key={row.label} className="border-b border-black/10 dark:border-white/[0.08]">
                    <th
                      scope="row"
                      className="text-left py-2.5 pr-3 font-sans text-xs font-normal text-black/45 dark:text-zinc-500 whitespace-nowrap"
                    >
                      {row.label}
                    </th>
                    <td
                      className={`py-2.5 pr-3 text-sm font-sans ${
                        row.edge === "a"
                          ? "font-semibold text-black dark:text-white"
                          : "text-black/70 dark:text-zinc-300"
                      }`}
                    >
                      {row.a}
                    </td>
                    <td
                      className={`py-2.5 text-sm font-sans ${
                        row.edge === "b"
                          ? "font-semibold text-black dark:text-white"
                          : "text-black/70 dark:text-zinc-300"
                      }`}
                    >
                      {row.b}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm font-sans text-black/60 dark:text-zinc-400 mb-4">
            No benchmark is reported by both laboratories at the same test and version, so no row is
            shown.
          </p>
        )}

        {comparison.withheld.length > 0 && (
          <details className="group mb-9 border-t border-b border-black/10 dark:border-white/[0.08]">
            <summary className="flex cursor-pointer list-none items-center gap-2 py-3 [&::-webkit-details-marker]:hidden">
              <span className="text-sm font-sans font-medium text-black dark:text-white">
                {comparison.withheld.length} benchmarks withheld
              </span>
              <span className="text-xs font-sans text-black/40 dark:text-zinc-500">
                reported at different tests or versions
              </span>
              <ChevronDown
                size={15}
                className="ml-auto shrink-0 text-black/30 dark:text-zinc-600 transition-transform duration-200 group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <ul className="pb-4 space-y-2.5">
              {comparison.withheld.map((row) => (
                <li key={row.label} className="text-sm font-sans leading-6">
                  <span className="font-medium text-black/80 dark:text-zinc-200">{row.label}</span>
                  <span className="text-black/50 dark:text-zinc-500">, {row.reason}</span>
                  <div className="mt-0.5 text-xs text-black/45 dark:text-zinc-500">
                    {a.name}: <span className="tabular-nums">{row.a}</span> · {b.name}:{" "}
                    <span className="tabular-nums">{row.b}</span>
                  </div>
                </li>
              ))}
            </ul>
          </details>
        )}

        {/* Reasons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-9">
          {[
            { model: a, reasons: comparison.pickA },
            { model: b, reasons: comparison.pickB },
          ].map(({ model, reasons }) => (
            <div
              key={model.id}
              className="p-4 rounded-xl border border-black/10 dark:border-white/[0.08] bg-black/[0.015] dark:bg-white/[0.02]"
            >
              <h2 className="text-base font-display font-semibold tracking-tight text-black dark:text-white mb-2.5">
                Where {model.name} leads
              </h2>
              <ul className="space-y-2">
                {reasons.map((reason) => (
                  <li key={reason} className="flex gap-2 text-sm font-sans text-black/65 dark:text-zinc-400 leading-6">
                    <Check size={13} className="shrink-0 mt-1 text-accent-ink" aria-hidden="true" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <h2 className="text-base font-display font-semibold tracking-tight text-black dark:text-white mb-3">
          Common questions
        </h2>
        <div className="border-t border-black/10 dark:border-white/[0.08] mb-9">
          {comparison.faq.map((item) => (
            <div key={item.q} className="py-4 border-b border-black/10 dark:border-white/[0.08]">
              <h3 className="text-sm font-medium tracking-tight text-black dark:text-white mb-1.5">
                {item.q}
              </h3>
              <p className="text-sm font-sans text-black/60 dark:text-zinc-400 leading-6">
                {item.a}
              </p>
            </div>
          ))}
        </div>

        {/* Related */}
        {related.length > 0 && (
          <>
            <h2 className="text-base font-display font-semibold tracking-tight text-black dark:text-white mb-3">
              Related comparisons
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0 border-t border-black/10 dark:border-white/[0.08] mb-8">
              {related.map((candidate) => (
                <Link
                  key={`${candidate.a.id}-${candidate.b.id}`}
                  href={compareHref(candidate.a, candidate.b)}
                  className="group flex items-baseline gap-2 py-2.5 border-b border-black/10 dark:border-white/[0.08] text-sm font-sans"
                >
                  <span className="text-black/70 dark:text-zinc-300 group-hover:text-accent-ink transition-colors truncate">
                    {candidate.a.name} vs {candidate.b.name}
                  </span>
                  <ArrowUpRight
                    size={12}
                    className="ml-auto shrink-0 opacity-40 group-hover:opacity-100 transition-opacity"
                    aria-hidden="true"
                  />
                </Link>
              ))}
            </div>
          </>
        )}

        <p className="text-xs font-sans text-black/45 dark:text-zinc-500 leading-5 max-w-2xl">
          Every figure above comes from the primary source on each model page (
          {a.sources.length} for {a.name}, {b.sources.length} for {b.name}). Prices are official list
          prices per 1M tokens and change without notice.{" "}
          <Link href="/methodology" className="text-accent-ink hover:underline underline-offset-2">
            Methodology
          </Link>
        </p>
      </section>
    </main>
  )
}
