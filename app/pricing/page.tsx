import type { Metadata } from "next"
import Link from "next/link"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { modelsData } from "@/data/models"
import { datasetRevision } from "@/data/revision"
import { safeJsonLd } from "@/lib/utils"

export const metadata: Metadata = {
  title: "AI model pricing comparison with sources - ModelRegistry",
  description:
    "Official hosted API pricing per lab flagship and checkpoint, with billing units, source links, and the dataset revision they were checked against.",
  alternates: { canonical: "https://modelregistry.tirup.in/pricing" },
}

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
      <section className="max-w-4xl mx-auto w-full px-4 sm:px-6 md:px-20 pb-20">
        <p className="text-[11px] font-sans uppercase tracking-[0.14em] text-black/50 dark:text-zinc-400 font-semibold mb-2">
          Reference · prices as of dataset {datasetRevision.datasetVersion} ({datasetRevision.revisedAt})
        </p>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-semibold tracking-tight text-black dark:text-white mb-3">
          Pricing comparison
        </h1>
        <p className="text-sm sm:text-[15px] text-black/70 dark:text-zinc-300 leading-6 sm:leading-7 mb-8 max-w-3xl">
          Official hosted list prices only - no reseller or volume-tier figures. Token-billed and
          per-second-billed models are never mixed in one ranking. Per-record citations live on
          each <Link href="/methodology" className="text-[#ff5d2e] hover:underline underline-offset-2">model page</Link>;
          providers change prices, so check the linked source before budgeting.
        </p>
        <h2 className="text-sm font-sans font-semibold uppercase tracking-wider text-black/60 dark:text-zinc-300 mb-2">
          Per 1M tokens, cheapest input first
        </h2>
        <div className="border-t border-black/10 dark:border-white/[0.08] mb-10">
          {tokenModels.map((m) => (
            <div key={m.id} className="flex items-baseline gap-2 sm:gap-3 py-2.5 border-b border-black/10 dark:border-white/[0.08] text-sm">
              <Link href={`/models/${m.id}`} className="font-medium tracking-tight text-black dark:text-white hover:text-[#ff5d2e] truncate min-w-0">
                {m.name}
              </Link>
              <span className="text-[11px] font-sans text-black/45 dark:text-zinc-500 shrink-0 hidden sm:inline">{m.companyName}</span>
              <span className="ml-auto tabular-nums text-xs font-sans text-black/70 dark:text-zinc-300 shrink-0">
                ${m.pricing.input} in / ${m.pricing.output} out
              </span>
              {(m.fieldSources.pricing?.[0] || m.sources[0]) && (
                <a
                  href={(m.fieldSources.pricing?.[0] || m.sources[0]).url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-sans text-[#ff5d2e] hover:underline underline-offset-2 shrink-0"
                >
                  Source
                </a>
              )}
            </div>
          ))}
        </div>
        {unitModels.length > 0 && (
          <>
            <h2 className="text-sm font-sans font-semibold uppercase tracking-wider text-black/60 dark:text-zinc-300 mb-2">
              Non-token billing (separate units - not comparable above)
            </h2>
            <div className="border-t border-black/10 dark:border-white/[0.08]">
              {unitModels.map((m) => (
                <div key={m.id} className="flex items-baseline gap-2 sm:gap-3 py-2.5 border-b border-black/10 dark:border-white/[0.08] text-sm">
                  <Link href={`/models/${m.id}`} className="font-medium tracking-tight text-black dark:text-white hover:text-[#ff5d2e] truncate min-w-0">
                    {m.name}
                  </Link>
                  <span className="ml-auto tabular-nums text-xs font-sans text-black/70 dark:text-zinc-300 shrink-0">
                    ${m.pricing.input} in / ${m.pricing.output} out {m.pricingUnit}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
      <Footer />
    </main>
  )
}
