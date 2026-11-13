import type { Metadata } from "next"
import Link from "next/link"
import Header from "@/components/header"
import { modelsData } from "@/data/models"
import { safeJsonLd } from "@/lib/utils"
import ChangelogClient from "@/components/changelog-client"

export const metadata: Metadata = {
  title: "Changelog - ModelRegistry record history",
  description:
    "Dated history of additions, corrections, and re-sourcing across ModelRegistry model records.",
  alternates: { canonical: "https://modelregistry.tirup.in/changelog" },
}

export default function ChangelogPage() {
  const entries = modelsData
    .flatMap((m) =>
      m.changeLog.map((e) => ({ ...e, modelId: m.id, modelName: m.name, companyId: m.companyId, companyName: m.companyName }))
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
      <section className="page">
        <h1 className="text-page font-display font-semibold tracking-tight text-black dark:text-white mb-2">
          Changelog
        </h1>
        <p className="mb-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-small font-sans text-fg-muted">
          <span>Every record change, newest first.</span>
          <span className="h-3 w-px bg-black/10 dark:bg-white/15" aria-hidden="true" />
          <span className="tabular-nums">{entries.length} entries</span>
          <span className="h-3 w-px bg-black/10 dark:bg-white/15" aria-hidden="true" />
          <span>
            Policy:{" "}
            <Link href="/methodology" className="text-accent-ink hover:underline underline-offset-2">
              /methodology
            </Link>
          </span>
        </p>
        <ChangelogClient entries={entries} />
      </section>
    </main>
  )
}
