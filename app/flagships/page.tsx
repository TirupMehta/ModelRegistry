import type { Metadata } from "next"
import Link from "next/link"
import Header from "@/components/header"
import { datasetRevision } from "@/data/revision"
import { safeJsonLd } from "@/lib/utils"
import FlagshipsClient from "@/components/flagships-client"

export const metadata: Metadata = {
  title: "Current flagship AI model by lab",
  description:
    "The current primary flagship foundation model for every tracked AI lab, with release dates, context windows, pricing, verification status, and primary sources.",
  alternates: { canonical: "https://modelregistry.tirup.in/flagships" },
}

export default function FlagshipsPage() {
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
        <h1 className="text-page font-display font-semibold tracking-tight text-black dark:text-white mb-3">
          Current flagship by lab
        </h1>
        <p className="mb-5 flex items-center gap-2 text-small font-sans text-fg-muted">
          <span>Dataset revised</span>
          <time dateTime={datasetRevision.revisedAt} className="tabular-nums">{datasetRevision.revisedAt}</time>
        </p>
        <p className="text-body text-fg leading-6 sm:leading-7 mb-8 max-w-3xl">
          One row per lab: its primary general-purpose model. “Flagship” never means “best” -
          it means the lab&apos;s main model. Every label requires fresh, live evidence (see{" "}
          <Link href="/methodology" className="text-accent-ink hover:underline underline-offset-2">methodology</Link>).
          Chronological view: <Link href="/timeline" className="text-accent-ink hover:underline underline-offset-2">release timeline</Link>.
        </p>
        <FlagshipsClient />
      </section>
    </main>
  )
}
