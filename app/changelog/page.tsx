import type { Metadata } from "next"
import Link from "next/link"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { modelsData } from "@/data/models"
import { safeJsonLd } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Changelog - ModelRegistry record history",
  description:
    "Dated history of additions, corrections, and re-sourcing across ModelRegistry model records.",
  alternates: { canonical: "https://modelregistry.tirup.in/changelog" },
}

export default function ChangelogPage() {
  const entries = modelsData
    .flatMap((m) =>
      m.changeLog.map((e) => ({ ...e, modelId: m.id, modelName: m.name }))
    )
    .sort((a, b) => b.date.localeCompare(a.date) || a.modelName.localeCompare(b.modelName))

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "ModelRegistry changelog",
    url: "https://modelregistry.tirup.in/changelog",
    dateModified: entries[0]?.date ?? "2026-10-07",
  }

  return (
    <main className="relative min-h-screen">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <section className="max-w-4xl mx-auto w-full px-4 sm:px-6 md:px-20 pb-20">
        <p className="text-[11px] font-sans uppercase tracking-[0.14em] text-black/50 dark:text-zinc-400 font-semibold mb-2">
          Trust &amp; provenance
        </p>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-semibold tracking-tight text-black dark:text-white mb-2">
          Changelog
        </h1>
        <p className="text-xs font-sans text-black/45 dark:text-zinc-500 mb-8">
          Every record change, newest first · {entries.length} entries · Policy:{" "}
          <Link href="/methodology" className="text-[#ff5d2e] hover:underline underline-offset-2">
            /methodology
          </Link>
        </p>
        <ol className="border-t border-black/10 dark:border-white/[0.08]">
          {entries.map((e, i) => (
            <li
              key={`${e.date}-${e.modelId}-${i}`}
              className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 py-3 border-b border-black/10 dark:border-white/[0.08] text-sm"
            >
              <span className="tabular-nums text-xs font-sans text-black/45 dark:text-zinc-500 shrink-0 sm:w-24">
                {e.date}
              </span>
              <div className="min-w-0">
                <Link
                  href={`/models/${e.modelId}`}
                  className="font-medium tracking-tight text-black dark:text-white hover:text-[#ff5d2e] dark:hover:text-[#ff7347] transition-colors"
                >
                  {e.modelName}
                </Link>
                <p className="text-[13px] font-sans text-black/60 dark:text-zinc-400 leading-relaxed">
                  {e.summary}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>
      <Footer />
    </main>
  )
}
