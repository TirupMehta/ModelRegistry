import type { Metadata } from "next"
import Link from "next/link"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { modelsData } from "@/data/models"
import { datasetRevision } from "@/data/revision"
import { safeJsonLd } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Current flagship AI model by lab — ModelRegistry",
  description:
    "The current primary flagship foundation model for every tracked AI lab, with release dates, context windows, pricing, verification status, and primary sources.",
  alternates: { canonical: "https://modelregistry.tirup.in/flagships" },
}

const STATUS_DOT: Record<string, string> = {
  verified: "bg-emerald-500",
  partially_verified: "bg-amber-500",
  unverified: "bg-zinc-400",
  retired: "bg-black/30",
}

export default function FlagshipsPage() {
  const flagships = modelsData.filter((m) => m.isCompanyFlagship)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Current flagship AI model by lab",
    url: "https://modelregistry.tirup.in/flagships",
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
          Current flagship by lab
        </h1>
        <p className="text-sm sm:text-[15px] text-black/70 dark:text-zinc-300 leading-6 sm:leading-7 mb-8 max-w-3xl">
          One row per lab: its primary general-purpose model. “Flagship” never means “best” —
          it means the lab&apos;s main model. Every label requires fresh, live evidence (see{" "}
          <Link href="/methodology" className="text-[#ff5d2e] hover:underline underline-offset-2">methodology</Link>).
          Chronological view: <Link href="/timeline" className="text-[#ff5d2e] hover:underline underline-offset-2">release timeline</Link>.
        </p>
        <div className="border-t border-black/10 dark:border-white/[0.08]">
          {flagships.map((m) => (
            <div key={m.id} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 py-3 border-b border-black/10 dark:border-white/[0.08] text-sm">
              <span className="flex items-center gap-2 min-w-0 sm:w-64 shrink-0">
                <span title={m.verificationStatus.replace(/_/g, " ")} className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[m.verificationStatus]}`} />
                <Link href={`/models/${m.id}`} className="font-medium tracking-tight text-black dark:text-white hover:text-[#ff5d2e] truncate">
                  {m.name}
                </Link>
              </span>
              <Link href={`/companies/${m.companyId}`} className="text-xs font-sans text-black/50 dark:text-zinc-400 hover:text-[#ff5d2e] shrink-0">
                {m.companyName}
              </Link>
              <span className="text-xs font-sans tabular-nums text-black/45 dark:text-zinc-500 sm:ml-auto shrink-0">
                {m.releaseDate} · {m.contextWindow.replace(" tokens", "")} · ${m.pricing.input}/${m.pricing.output}
              </span>
              {m.sources[0] && (
                <a href={m.sources[0].url} target="_blank" rel="noopener noreferrer" className="text-[11px] font-sans text-[#ff5d2e] hover:underline underline-offset-2 shrink-0">
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
