import type { Metadata } from "next"
import Link from "next/link"
import Header from "@/components/header"
import { modelsData } from "@/data/models"
import { datasetRevision } from "@/data/revision"
import { safeJsonLd } from "@/lib/utils"
import { withShare } from "@/lib/share"
import { faqPage, itemList } from "@/lib/seo"

export const metadata: Metadata = withShare({
  title: "Open weight AI models and licenses",
  description:
    "The open weight AI models list: which frontier models publish weights, under which licence, with primary sources and the dataset revision they were checked against.",
  alternates: { canonical: "https://modelregistry.tirup.in/licenses" },
}, { page: "/licenses" }, "/licenses")

export default function LicensesPage() {
  const groups = new Map<string, typeof modelsData>()
  for (const m of modelsData) {
    const list = groups.get(m.license) || []
    list.push(m)
    groups.set(m.license, list)
  }
  const open = modelsData.filter((m) => m.openWeights)
  const revised = datasetRevision.revisedAt
  const faqs = [
    {
      q: "How many AI models publish open weights?",
      a: `${open.length} of ${modelsData.length} tracked records publish downloadable weights as of ${revised}. The rest are proprietary or do not publish weights; a missing weights link is not a claim that no weights exist.`,
    },
    {
      q: "Is open weight the same as open source?",
      a: "No. Open weight means the parameters can be downloaded. The licence can still restrict commercial use, modification, or redistribution. Some records use community or research licences that are not OSI approved, so read the licence source before deploying.",
    },
    {
      q: "Can I self host an open weight model?",
      a: "Only if its licence permits it. Check the linked licence for the model you plan to use; the registry reports the publisher's stated terms and does not decide what your use requires.",
    },
    {
      q: "Why are licence names grouped exactly as written?",
      a: "They are the publisher's stated terms, not the registry's interpretation. Keeping the string unchanged, with a source link, is what makes the list checkable.",
    },
  ]
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Open weight AI models and licenses",
    url: "https://modelregistry.tirup.in/licenses",
    dateModified: revised,
  }

  return (
    <main id="content" tabIndex={-1} className="relative min-h-screen focus:outline-none">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(faqPage(faqs)) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(
            itemList({
              name: "Open weight AI models",
              path: "/licenses",
              description: "Frontier AI models that publish downloadable weights, with their stated licence.",
              models: open,
              order: "https://schema.org/ItemListUnordered",
            }),
          ),
        }}
      />
      <section className="page">
        <h1 className="text-page font-display font-semibold tracking-tight text-fg-strong mb-3">
          Open weight AI models and licenses
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
              <h2 className="text-body sm:text-title font-medium tracking-tight text-fg-strong mb-1 break-words">
                {license}
              </h2>
              <p className="text-caption font-sans text-fg-muted mb-3">
                {list.length} model{list.length === 1 ? "" : "s"} · {list.filter((m) => m.openWeights).length} with published weights
              </p>
              <ul className="space-y-1.5">
                {list.map((m) => (
                  <li key={m.id} className="flex items-center gap-2 text-body min-w-0">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${m.openWeights ? "bg-good" : "bg-black/20 dark:bg-white/20"}`} title={m.openWeights ? "Weights published" : "No published weights"} />
                    <Link href={`/models/${m.id}`} className="font-medium tracking-tight text-fg-strong hover:text-accent-ink truncate">
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

        <h2 className="mt-10 mb-3 font-display text-heading font-semibold tracking-tight text-fg-strong">
          Open weight questions
        </h2>
        <div className="rule-t">
          {faqs.map((item) => (
            <div key={item.q} className="py-4 rule-b">
              <h3 className="mb-1.5 text-body font-medium tracking-tight text-fg-strong">{item.q}</h3>
              <p className="max-w-[68ch] text-body font-sans leading-6 text-fg-muted">{item.a}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
