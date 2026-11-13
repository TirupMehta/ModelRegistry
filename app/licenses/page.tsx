import type { Metadata } from "next"
import Link from "next/link"
import Header from "@/components/header"
import { modelsData } from "@/data/models"
import { datasetRevision } from "@/data/revision"
import { safeJsonLd } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Open-weight AI license comparison",
  description:
    "Which frontier models publish weights, under which license, grouped for enterprise review - with primary sources and verification status.",
  alternates: { canonical: "https://modelregistry.tirup.in/licenses" },
}

export default function LicensesPage() {
  const groups = new Map<string, typeof modelsData>()
  for (const m of modelsData) {
    const list = groups.get(m.license) || []
    list.push(m)
    groups.set(m.license, list)
  }
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Open-weight AI license comparison",
    url: "https://modelregistry.tirup.in/licenses",
    dateModified: datasetRevision.revisedAt,
  }

  return (
    <main className="relative min-h-screen">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <section className="max-w-4xl mx-auto w-full px-4 sm:px-6 md:px-20 pb-20">
        <h1 className="text-page font-display font-semibold tracking-tight text-black dark:text-white mb-3">
          Open weights &amp; licenses
        </h1>
        <p className="mb-5 flex items-center gap-2 text-small font-sans text-fg-muted">
          <span>Dataset revised</span>
          <time dateTime={datasetRevision.revisedAt} className="tabular-nums">{datasetRevision.revisedAt}</time>
        </p>
        <p className="text-body text-fg leading-6 sm:leading-7 mb-8 max-w-3xl">
          License strings are the vendor&apos;s stated terms, grouped verbatim - read the linked
          source before deploying, especially “community” and “research” licenses with use
          restrictions. A missing weights link means no downloadable weights were found, and the
          record says so (see{" "}
          <Link href="/methodology" className="text-accent-ink hover:underline underline-offset-2">methodology</Link>).
        </p>
        <div className="space-y-6">
          {[...groups.entries()].map(([license, list]) => (
            <div key={license} className="border border-black/10 dark:border-white/[0.08] rounded-xl p-4 sm:p-5">
              <h2 className="text-body sm:text-title font-medium tracking-tight text-black dark:text-white mb-1 break-words">
                {license}
              </h2>
              <p className="text-caption font-sans text-fg-muted mb-3">
                {list.length} model{list.length === 1 ? "" : "s"} · {list.filter((m) => m.openWeights).length} with published weights
              </p>
              <ul className="space-y-1.5">
                {list.map((m) => (
                  <li key={m.id} className="flex items-center gap-2 text-body min-w-0">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${m.openWeights ? "bg-good" : "bg-black/20 dark:bg-white/20"}`} title={m.openWeights ? "Weights published" : "No published weights"} />
                    <Link href={`/models/${m.id}`} className="font-medium tracking-tight text-black dark:text-white hover:text-accent-ink truncate">
                      {m.name}
                    </Link>
                    <span className="text-caption font-sans text-fg-muted shrink-0 hidden sm:inline">{m.companyName}</span>
                    {(m.fieldSources.license?.[0] || m.sources[0]) && (
                      <a
                        href={(m.fieldSources.license?.[0] || m.sources[0]).url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto text-caption font-sans text-accent-ink hover:underline underline-offset-2 shrink-0"
                      >
                        Source
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
