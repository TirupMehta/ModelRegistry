import type { Metadata } from "next"
import Link from "next/link"
import Header from "@/components/header"
import { modelsData } from "@/data/models"
import { datasetRevision } from "@/data/revision"
import { safeJsonLd } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Retired & archived AI models",
  description:
    "Historical model records explicitly marked retired by the registry. A newer release alone does not mean an older model is discontinued.",
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
        <h1 className="text-page font-display font-semibold tracking-tight text-black dark:text-white mb-3">
          Retired &amp; archived
        </h1>
        <p className="mb-5 flex items-center gap-2 text-small font-sans text-fg-muted">
          <span>Dataset revised</span>
          <time dateTime={datasetRevision.revisedAt} className="tabular-nums">{datasetRevision.revisedAt}</time>
        </p>
        <p className="text-body text-fg leading-6 sm:leading-7 mb-8 max-w-3xl">
          Models explicitly marked retired stay available here as historical records. A replacement
          is linked when known; a newer release alone does not mean an older model was discontinued.
          Records are removed only for duplicates, hoaxes, or claims that never had a verifiable
          official source (see{" "}
          <Link href="/methodology" className="text-accent-ink hover:underline underline-offset-2">methodology</Link>).
        </p>
        {retired.length === 0 ? (
          <div className="rounded-xl border border-black/10 dark:border-white/[0.08] p-6 text-body font-sans text-fg-muted">
            <p>
              No models are currently marked retired in the registry. Older releases remain in the
              main index; this page does not report provider availability.
            </p>
            <p className="mt-3">
              Records replaced in their role by a later release are marked superseded rather than
              retired. They are listed with their replacements on{" "}
              <Link href="/score#superseded" className="text-accent-ink hover:underline underline-offset-2">
                the standings page
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="border-t border-black/10 dark:border-white/[0.08]">
            {retired.map((m) => (
              <div key={m.id} className="py-3 border-b border-black/10 dark:border-white/[0.08] text-body">
                <Link href={`/models/${m.id}`} className="font-medium tracking-tight text-black dark:text-white hover:text-accent-ink">
                  {m.name}
                </Link>
                {m.supersededBy && (
                  <span className="text-small font-sans text-fg-muted">
                    {" "}→ superseded by{" "}
                    <Link href={`/models/${m.supersededBy}`} className="text-accent-ink hover:underline underline-offset-2">
                      {m.supersededBy}
                    </Link>
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
