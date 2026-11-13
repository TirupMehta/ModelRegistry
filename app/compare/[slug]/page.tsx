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

      <section className="page">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2.5 mb-7 text-small font-sans leading-relaxed text-fg-muted overflow-x-auto whitespace-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
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

        <h1 className="text-page font-display font-semibold tracking-tight text-black dark:text-white mb-3">
          {a.name} vs {b.name}
        </h1>
        <p className="mb-5 flex flex-wrap items-center gap-2 text-small font-sans text-fg-muted">
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
        <div className="tile mb-8 p-5 sm:p-6">
          <h2 className="sr-only">Answer</h2>
          <p className="text-title leading-7 text-fg-strong">{comparison.summary}</p>
          {comparison.identical.length > 0 && (
            <p className="mt-3 text-small leading-6 text-fg-muted">
              <span className="font-medium text-fg">Within 5% or equal:</span> {comparison.identical.join(" · ")}
            </p>
          )}
        </div>

        {/* Where they differ, with the size of each gap */}
        <h2 className="mb-1 font-display text-heading font-semibold tracking-tight text-fg-strong">
          Where they differ
        </h2>
        <p className="text-body font-sans text-fg-muted mb-3">
          {comparison.differences.length} axes with a real gap. The size of each gap is printed under
          the axis, because a five cent difference and a three times larger ceiling are not the same
          kind of fact.
        </p>
        <div className="overflow-x-auto mb-9 -mx-1 px-1">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-black/15 dark:border-white/[0.12]">
                <th scope="col" className="text-left py-2 pr-3 font-sans text-small font-medium text-fg-muted">
                  Axis
                </th>
                <th scope="col" className="text-left py-2 pr-3 font-sans text-body font-semibold text-black dark:text-white">
                  {a.name}
                </th>
                <th scope="col" className="text-left py-2 font-sans text-body font-semibold text-black dark:text-white">
                  {b.name}
                </th>
              </tr>
            </thead>
            <tbody>
              {comparison.differences.map((row) => (
                <tr key={row.label} className="rule-b align-top">
                  <th scope="row" className="text-left py-3 pr-3 font-normal">
                    <span className="block text-body font-sans text-fg">
                      {row.label}
                    </span>
                    <span className="mt-0.5 block text-small font-sans text-accent-ink">
                      {row.delta}
                    </span>
                  </th>
                  <td className="py-2 pr-3 align-middle">
                    <span
                      className={`-ml-2 inline-block rounded-md px-2 py-1 text-body font-sans tabular-nums ${
                        row.edge === "a" ? "bg-accent/10 font-semibold text-fg-strong" : "text-fg-muted"
                      }`}
                    >
                      {row.a}
                    </span>
                  </td>
                  <td className="py-2 align-middle">
                    <span
                      className={`-ml-2 inline-block rounded-md px-2 py-1 text-body font-sans tabular-nums ${
                        row.edge === "b" ? "bg-accent/10 font-semibold text-fg-strong" : "text-fg-muted"
                      }`}
                    >
                      {row.b}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* At a glance */}
        <div className="mb-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[a, b].map((model) => (
            <Link
              key={model.id}
              href={`/models/${model.id}`}
              className="tile-link group block p-5"
            >
              <div className="text-small text-fg-muted">{model.companyName}</div>
              <div className="mt-0.5 font-display text-heading font-semibold tracking-tight text-fg-strong transition-colors group-hover:text-accent-ink">
                {model.name}
              </div>
              <div className="mt-1 text-small text-fg-muted">
                {model.categoryLabel} · {formatDate(model.releaseDate)}
              </div>
              <p className="mt-3 line-clamp-3 text-body leading-6 text-fg">{model.highlight}</p>
            </Link>
          ))}
        </div>

        {/* Spec table */}
        <h2 className="mb-3 font-display text-heading font-semibold tracking-tight text-fg-strong">
          Specification
        </h2>
        <div className="overflow-x-auto mb-9 -mx-1 px-1">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-black/15 dark:border-white/[0.12]">
                <th scope="col" className="text-left py-2 pr-3 font-sans text-small font-medium text-fg-muted">
                  Field
                </th>
                <th scope="col" className="text-left py-2 pr-3 font-sans text-body font-semibold text-black dark:text-white">
                  {a.name}
                </th>
                <th scope="col" className="text-left py-2 font-sans text-body font-semibold text-black dark:text-white">
                  {b.name}
                </th>
              </tr>
            </thead>
            <tbody>
              {comparison.facts.map((fact) => (
                <tr key={fact.label} className="rule-b align-top">
                  <th
                    scope="row"
                    className="text-left py-2.5 pr-3 font-sans text-small font-normal text-fg-muted whitespace-nowrap"
                  >
                    {fact.label}
                  </th>
                  <td
                    className={`py-2.5 pr-3 text-body font-sans tabular-nums ${
                      fact.edge === "a"
                        ? "font-semibold text-black dark:text-white"
                        : "text-fg"
                    }`}
                  >
                    {fact.a}
                  </td>
                  <td
                    className={`py-2.5 text-body font-sans tabular-nums ${
                      fact.edge === "b"
                        ? "font-semibold text-black dark:text-white"
                        : "text-fg"
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
        <h2 className="mb-1 font-display text-heading font-semibold tracking-tight text-fg-strong">
          Benchmarks both laboratories published
        </h2>
        <p className="text-body font-sans text-fg-muted mb-3">
          Shown side by side only when both records name the same test and the same version.
        </p>
        {comparison.benchmarks.length > 0 ? (
          <div className="overflow-x-auto mb-4 -mx-1 px-1">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-black/15 dark:border-white/[0.12]">
                  <th scope="col" className="text-left py-2 pr-3 font-sans text-small font-medium text-fg-muted">
                    Test
                  </th>
                  <th scope="col" className="text-left py-2 pr-3 font-sans text-body font-semibold text-black dark:text-white">
                    {a.name}
                  </th>
                  <th scope="col" className="text-left py-2 font-sans text-body font-semibold text-black dark:text-white">
                    {b.name}
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparison.benchmarks.map((row) => (
                  <tr key={row.label} className="rule-b">
                    <th
                      scope="row"
                      className="text-left py-2.5 pr-3 font-sans text-small font-normal text-fg-muted whitespace-nowrap"
                    >
                      {row.label}
                    </th>
                    <td
                      className={`py-2.5 pr-3 text-body font-sans ${
                        row.edge === "a"
                          ? "font-semibold text-black dark:text-white"
                          : "text-fg"
                      }`}
                    >
                      {row.a}
                    </td>
                    <td
                      className={`py-2.5 text-body font-sans ${
                        row.edge === "b"
                          ? "font-semibold text-black dark:text-white"
                          : "text-fg"
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
          <p className="text-body font-sans text-fg-muted mb-4">
            No benchmark is reported by both laboratories at the same test and version, so no row is
            shown.
          </p>
        )}

        {comparison.withheld.length > 0 && (
          <details className="group mb-9 border-t rule-b">
            <summary className="flex cursor-pointer list-none items-center gap-2 py-3 [&::-webkit-details-marker]:hidden">
              <span className="text-body font-sans font-medium text-black dark:text-white">
                {comparison.withheld.length} benchmarks withheld
              </span>
              <span className="text-small font-sans text-fg-muted">
                reported at different tests or versions
              </span>
              <ChevronDown
                size={15}
                className="ml-auto shrink-0 text-fg-muted transition-transform duration-200 group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <ul className="pb-4 space-y-2.5">
              {comparison.withheld.map((row) => (
                <li key={row.label} className="text-body font-sans leading-6">
                  <span className="font-medium text-fg">{row.label}</span>
                  <span className="text-fg-muted">, {row.reason}</span>
                  <div className="mt-0.5 text-small text-fg-muted">
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
              className="tile p-4"
            >
              <h2 className="text-title font-display font-semibold tracking-tight text-black dark:text-white mb-2.5">
                Where {model.name} leads
              </h2>
              <ul className="space-y-2">
                {reasons.map((reason) => (
                  <li key={reason} className="flex gap-2 text-body font-sans text-fg-muted leading-6">
                    <Check size={13} className="shrink-0 mt-1 text-accent-ink" aria-hidden="true" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <h2 className="mb-3 font-display text-heading font-semibold tracking-tight text-fg-strong">
          Common questions
        </h2>
        <div className="rule-t mb-9">
          {comparison.faq.map((item) => (
            <div key={item.q} className="py-4 rule-b">
              <h3 className="text-body font-medium tracking-tight text-black dark:text-white mb-1.5">
                {item.q}
              </h3>
              <p className="text-body font-sans text-fg-muted leading-6">
                {item.a}
              </p>
            </div>
          ))}
        </div>

        {/* Related */}
        {related.length > 0 && (
          <>
            <h2 className="mb-3 font-display text-heading font-semibold tracking-tight text-fg-strong">
              Related comparisons
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0 rule-t mb-8">
              {related.map((candidate) => (
                <Link
                  key={`${candidate.a.id}-${candidate.b.id}`}
                  href={compareHref(candidate.a, candidate.b)}
                  className="group flex items-baseline gap-2 py-2.5 rule-b text-body font-sans"
                >
                  <span className="text-fg group-hover:text-accent-ink transition-colors truncate">
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

        <p className="text-small font-sans text-fg-muted leading-5 max-w-2xl">
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
