import type { Metadata } from "next"
import Link from "next/link"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { modelsData } from "@/data/models"
import { datasetRevision } from "@/data/revision"
import { safeJsonLd } from "@/lib/utils"

export const metadata: Metadata = {
  title: "AI model context window comparison - ModelRegistry",
  description:
    "Maximum input context per frontier AI model, sorted largest first, with primary sources and the dataset revision they were checked against.",
  alternates: { canonical: "https://modelregistry.tirup.in/context" },
}

function fmt(tokens: number) {
  if (tokens <= 0) return "-"
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(tokens % 1_000_000 === 0 ? 0 : 2)}M`
  return `${Math.round(tokens / 1000)}K`
}

export default function ContextPage() {
  const ranked = [...modelsData].sort((a, b) => b.contextWindowTokens - a.contextWindowTokens)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "AI model context window comparison",
    url: "https://modelregistry.tirup.in/context",
    dateModified: datasetRevision.revisedAt,
  }

  return (
    <main className="relative min-h-screen">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <section className="max-w-4xl mx-auto w-full px-4 sm:px-6 md:px-20 pb-20">
        <p className="text-[11px] font-sans uppercase tracking-[0.14em] text-black/50 dark:text-zinc-400 font-semibold mb-2">
          Reference · updated {datasetRevision.revisedAt} (dataset {datasetRevision.datasetVersion})
        </p>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-semibold tracking-tight text-black dark:text-white mb-3">
          Context window comparison
        </h1>
        <p className="text-sm sm:text-[15px] text-black/70 dark:text-zinc-300 leading-6 sm:leading-7 mb-8 max-w-3xl">
          Maximum input tokens per model, largest first. A dash means undisclosed or non-token
          (audio/video billing) - never zero. Long context alone says nothing about retrieval
          quality; per-record citations are on each{" "}
          <Link href="/methodology" className="text-[#ff5d2e] hover:underline underline-offset-2">model page</Link>.
        </p>
        <div className="border-t border-black/10 dark:border-white/[0.08]">
          {ranked.map((m, i) => (
            <div key={m.id} className="flex items-baseline gap-2 sm:gap-3 py-2.5 border-b border-black/10 dark:border-white/[0.08] text-sm">
              <span className="font-mono tabular-nums text-[11px] text-black/30 dark:text-zinc-600 w-6 shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              <Link href={`/models/${m.id}`} className="font-medium tracking-tight text-black dark:text-white hover:text-[#ff5d2e] truncate min-w-0">
                {m.name}
              </Link>
              <span className="text-[11px] font-sans text-black/45 dark:text-zinc-500 shrink-0 hidden sm:inline">{m.companyName}</span>
              <span className="ml-auto tabular-nums text-xs font-sans font-medium text-black dark:text-white shrink-0">
                {fmt(m.contextWindowTokens)}
              </span>
              {(m.fieldSources.contextWindow?.[0] || m.sources[0]) && (
                <a
                  href={(m.fieldSources.contextWindow?.[0] || m.sources[0]).url}
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
      </section>
      <Footer />
    </main>
  )
}
