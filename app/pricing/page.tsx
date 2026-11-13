import type { Metadata } from "next"
import Link from "next/link"
import Header from "@/components/header"
import { modelsData } from "@/data/models"
import { datasetRevision } from "@/data/revision"
import { safeJsonLd } from "@/lib/utils"
import { ArrowUpRight } from "lucide-react"
import { Disclosure, PageHeader } from "@/components/ui"

export const metadata: Metadata = {
  title: "AI model pricing comparison with sources",
  description:
    "Official hosted API pricing per lab flagship and checkpoint, with billing units, source links, and the dataset revision they were checked against.",
  alternates: { canonical: "https://modelregistry.tirup.in/pricing" },
}

/** List price per 1M tokens: two decimals, more only when the price is under a dime. */
const usd = (n: number) => (n === 0 ? "Free" : n < 0.1 ? `$${n}` : `$${n.toFixed(2)}`)

export default function PricingPage() {
  const tokenModels = [...modelsData]
    .filter((m) => !m.pricingUnit)
    .sort((a, b) => a.pricing.input - b.pricing.input)
  const unitModels = modelsData.filter((m) => m.pricingUnit)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "AI model pricing comparison",
    url: "https://modelregistry.tirup.in/pricing",
    dateModified: datasetRevision.revisedAt,
  }

  return (
    <main className="relative min-h-screen">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <section className="page">
        <PageHeader
          title="Pricing comparison"
          lead="Official list prices for each model, per 1M tokens. Check the linked source before budgeting: providers change prices."
          className="mb-6"
        />
        <Disclosure summary="What is and is not included" className="mb-10">
          <p>
            Hosted list prices only, with no reseller or volume-tier figures. Token-billed and per-second-billed models are never
            mixed in one ranking. Per-record citations live on each{" "}
            <Link href="/methodology" className="text-accent-ink underline-offset-4 hover:underline">model page</Link>. Dataset
            revised <time dateTime={datasetRevision.revisedAt} className="tabular-nums">{datasetRevision.revisedAt}</time>.
          </p>
        </Disclosure>

        <h2 className="mb-1 font-display text-heading font-semibold tracking-tight text-fg-strong">Billed per token</h2>
        <p className="mb-3 text-small text-fg-muted">Cheapest input first.</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[460px] border-collapse text-left">
            <thead>
              <tr className="border-b border-black/10 text-small text-fg-muted dark:border-white/[0.08]">
                <th scope="col" className="py-2 pr-3 font-medium">Model</th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">Input</th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">Output</th>
                <th scope="col" className="py-2 text-right font-medium">Source</th>
              </tr>
            </thead>
            <tbody>
              {tokenModels.map((m) => {
                const source = (m.fieldSources.pricing?.[0] || m.sources[0])?.url
                return (
                  <tr key={m.id} className="rule-b">
                    <th scope="row" className="py-3 pr-3 font-normal">
                      <Link href={`/models/${m.id}`} className="block truncate text-body font-medium text-fg-strong hover:text-accent-ink">
                        {m.name}
                      </Link>
                      <span className="block text-small text-fg-muted">{m.companyName}</span>
                    </th>
                    <td className="py-3 pr-3 text-right text-body tabular-nums text-fg">{usd(m.pricing.input)}</td>
                    <td className="py-3 pr-3 text-right text-body tabular-nums text-fg">{usd(m.pricing.output)}</td>
                    <td className="py-3 text-right">
                      {source && (
                        <a
                          href={source}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Pricing source for ${m.name}`}
                          className="inline-flex items-center text-fg-muted transition-colors hover:text-accent-ink"
                        >
                          <ArrowUpRight size={15} aria-hidden="true" />
                        </a>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {unitModels.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-1 font-display text-heading font-semibold tracking-tight text-fg-strong">Billed by another unit</h2>
            <p className="mb-3 text-small text-fg-muted">Separate units, so these are not comparable with the table above.</p>
            <ul className="rule-t">
              {unitModels.map((m) => (
                <li key={m.id} className="flex items-baseline gap-3 border-b border-black/10 py-3 dark:border-white/[0.08]">
                  <span className="min-w-0">
                    <Link href={`/models/${m.id}`} className="block truncate text-body font-medium text-fg-strong hover:text-accent-ink">
                      {m.name}
                    </Link>
                    <span className="block text-small text-fg-muted">{m.companyName}</span>
                  </span>
                  <span className="ml-auto shrink-0 text-body tabular-nums text-fg">
                    {usd(m.pricing.input)} in / {usd(m.pricing.output)} out {m.pricingUnit}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </main>
  )
}
