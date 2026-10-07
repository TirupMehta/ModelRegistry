import type { Metadata } from "next"
import Link from "next/link"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { modelsData } from "@/data/models"
import { datasetRevision } from "@/data/revision"
import { safeJsonLd } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Retired & archived AI models - ModelRegistry",
  description:
    "Superseded registry records kept for reference, with their replacements. Nothing is currently retired.",
  alternates: { canonical: "https://modelregistry.tirup.in/retired" },
}

export default function RetiredPage() {
  const retired = modelsData.filter((m) => m.verificationStatus === "retired")
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Retired and archived AI models",
    url: "https://modelregistry.tirup.in/retired",
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
          Retired &amp; archived
        </h1>
        <p className="text-sm sm:text-[15px] text-black/70 dark:text-zinc-300 leading-6 sm:leading-7 mb-8 max-w-3xl">
          Superseded records are kept here for reference - never silently deleted - with a pointer
          to their replacement. Removal happens only for duplicates, hoaxes, or records that never
          had a verifiable official source (see{" "}
          <Link href="/methodology" className="text-[#ff5d2e] hover:underline underline-offset-2">methodology</Link>).
        </p>
        {retired.length === 0 ? (
          <div className="rounded-xl border border-black/10 dark:border-white/[0.08] p-6 text-sm font-sans text-black/60 dark:text-zinc-400">
            No retired records. Every tracked model currently has a live official source.
          </div>
        ) : (
          <div className="border-t border-black/10 dark:border-white/[0.08]">
            {retired.map((m) => (
              <div key={m.id} className="py-3 border-b border-black/10 dark:border-white/[0.08] text-sm">
                <Link href={`/models/${m.id}`} className="font-medium tracking-tight text-black dark:text-white hover:text-[#ff5d2e]">
                  {m.name}
                </Link>
                {m.supersededBy && (
                  <span className="text-xs font-sans text-black/55 dark:text-zinc-400">
                    {" "}→ superseded by{" "}
                    <Link href={`/models/${m.supersededBy}`} className="text-[#ff5d2e] hover:underline underline-offset-2">
                      {m.supersededBy}
                    </Link>
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
      <Footer />
    </main>
  )
}
