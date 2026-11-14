import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import Header from "@/components/header"
import { modelsData } from "@/data/models"
import { datasetRevision } from "@/data/revision"
import { safeJsonLd } from "@/lib/utils"
import { SITE, breadcrumbList, compareHref, faqPage, isComparablePair } from "@/lib/seo"
import { buildAlternatives, hasAlternatives, type AlternativeRow } from "@/lib/alternatives"
import { ArrowLeft } from "lucide-react"
import { Disclosure, PageHeader } from "@/components/ui"

export const dynamicParams = false

export function generateStaticParams() {
  return modelsData
    .filter((m) => hasAlternatives(m))
    .filter((m) => (buildAlternatives(m)?.total ?? 0) >= 3)
    .map((m) => ({ id: m.id }))
}

const usd = (n: number) => (n < 0.1 ? `$${n}` : `$${n.toFixed(2)}`)
const monthYear = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const model = modelsData.find((m) => m.id === id)
  const view = model && buildAlternatives(model)
  if (!model || !view) return {}
  const full = `${model.name} alternatives (${monthYear(datasetRevision.revisedAt)}): cheaper, stronger and open-weight options`
  // Search results cut titles near 60 characters; long model names keep the part that matters.
  const title = full.length <= 90 ? full : `${model.name} alternatives (${monthYear(datasetRevision.revisedAt)})`
  const swap = view.bestSwap
  const description = swap
    ? `${swap.model.name} scores within 3 points of ${model.name} on the independent Intelligence Index at ${usd(swap.blended)} vs ${usd(view.self.blended)} per 1M tokens. ${view.total} alternatives compared. Updated ${datasetRevision.revisedAt}.`
    : `${view.total} alternatives to ${model.name} compared on price per 1M tokens and independent scores. Updated ${datasetRevision.revisedAt}.`
  const url = `${SITE}/alternatives/${id}`
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: "ModelRegistry", type: "article", modifiedTime: `${datasetRevision.revisedAt}T00:00:00Z` },
    twitter: { card: "summary_large_image", title, description },
  }
}

function Table({ caption, rows, self }: { caption: string; rows: AlternativeRow[]; self: AlternativeRow }) {
  if (rows.length === 0) return null
  return (
    <section className="mb-10">
      <h2 className="mb-3 font-display text-heading font-semibold tracking-tight text-fg-strong">{caption}</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse text-left">
          <thead>
            <tr className="rule-b text-small text-fg-muted">
              <th scope="col" className="py-2 pr-3 font-medium">Model</th>
              <th scope="col" className="py-2 pr-3 text-right font-medium">In / out per 1M</th>
              <th scope="col" className="py-2 pr-3 text-right font-medium">Intelligence Index</th>
              <th scope="col" className="py-2 text-right font-medium">Compare</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.model.id} className="rule-b">
                <th scope="row" className="py-3 pr-3 font-normal">
                  <Link href={`/models/${r.model.id}`} className="block text-body font-medium text-fg-strong hover:text-accent-ink">
                    {r.model.name}
                  </Link>
                  <span className="block text-small text-fg-muted">{r.model.companyName}{r.model.openWeights ? " · open weights" : ""}</span>
                </th>
                <td className="py-3 pr-3 text-right text-body tabular-nums text-fg">
                  {usd(r.model.pricing.input)} / {usd(r.model.pricing.output)}
                </td>
                <td className="py-3 pr-3 text-right text-body tabular-nums text-fg">{r.index ?? "not measured"}</td>
                <td className="py-3 text-right text-small">
                  {isComparablePair(self.model, r.model) ? (
                    <Link href={compareHref(self.model, r.model)} className="text-accent-ink underline-offset-4 hover:underline">
                      vs {self.model.name}
                    </Link>
                  ) : (
                    <span className="text-fg-muted">same lab</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default async function AlternativesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const model = modelsData.find((m) => m.id === id)
  const view = model && buildAlternatives(model)
  if (!model || !view || view.total < 3) notFound()
  const url = `${SITE}/alternatives/${id}`
  const { self } = view

  const lead = view.bestSwap
    ? `${view.bestSwap.model.name} is the closest swap for ${model.name}: it scores ${view.bestSwap.index} against ${self.index} on the independent Intelligence Index and costs ${usd(view.bestSwap.blended)} against ${usd(self.blended)} per 1M tokens (3:1 input to output blend).`
    : view.cheaper[0]
      ? `${view.cheaper[0].model.name} is the strongest cheaper option to ${model.name}: ${usd(view.cheaper[0].model.pricing.input)} in and ${usd(view.cheaper[0].model.pricing.output)} out per 1M tokens, against ${usd(model.pricing.input)} and ${usd(model.pricing.output)}${view.cheaper[0].index !== null ? `, with an Intelligence Index of ${view.cheaper[0].index}${self.index !== null ? ` against ${self.index}` : ""}` : ""}.`
      : `${view.total} alternatives to ${model.name} are compared below on price and independent scores.`

  const faq = [
    { q: `What is the best alternative to ${model.name}?`, a: lead },
    view.cheaper[0] && {
      q: `What is a cheaper alternative to ${model.name}?`,
      a: `${view.cheaper[0].model.name} lists at ${usd(view.cheaper[0].model.pricing.input)} in and ${usd(view.cheaper[0].model.pricing.output)} out per 1M tokens, against ${usd(model.pricing.input)} and ${usd(model.pricing.output)} for ${model.name}.`,
    },
    view.open[0] && {
      q: `Is there an open-weights alternative to ${model.name}?`,
      a: `Yes. ${view.open[0].model.name} from ${view.open[0].model.companyName} publishes open weights${view.open[0].index !== null ? ` and scores ${view.open[0].index} on the independent Intelligence Index` : ""}.`,
    },
    view.stronger[0] && {
      q: `What scores higher than ${model.name}?`,
      a: `${view.stronger[0].model.name} scores ${view.stronger[0].index} against ${self.index} on the independent Intelligence Index, measured by the same evaluator with the same tasks.`,
    },
  ].filter((x): x is { q: string; a: string } => Boolean(x))

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}#page`,
    url,
    name: `${model.name} alternatives`,
    description: lead,
    about: { "@type": "Thing", name: model.name, url: `${SITE}/models/${model.id}` },
    dateModified: `${datasetRevision.revisedAt}T00:00:00Z`,
    inLanguage: "en",
    isPartOf: { "@id": `${SITE}/#website` },
    speakable: { "@type": "SpeakableSpecification", cssSelector: ["h1", "#answer"] },
  }

  return (
    <main className="relative min-h-screen">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(faqPage(faq)) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(
            breadcrumbList([
              { name: "Ledger", path: "/" },
              { name: model.name, path: `/models/${model.id}` },
              { name: "Alternatives", path: `/alternatives/${model.id}` },
            ]),
          ),
        }}
      />

      <section className="page">
        <nav aria-label="Breadcrumb" className="mb-7 flex items-center gap-2.5 text-small leading-relaxed text-fg-muted">
          <Link href={`/models/${model.id}`} className="inline-flex items-center gap-1 transition-colors duration-150 hover:text-accent-ink">
            <ArrowLeft size={13} aria-hidden="true" />
            <span>{model.name}</span>
          </Link>
          <span>/</span>
          <span className="font-medium text-accent-ink">Alternatives</span>
        </nav>

        <PageHeader
          title={`Alternatives to ${model.name}`}
          meta={
            <>
              Updated <time dateTime={datasetRevision.revisedAt}>{datasetRevision.revisedAt}</time> · {view.total} options compared
            </>
          }
          className="mb-6"
        />

        {view.successor && (
          <p className="mb-4 max-w-2xl text-body leading-6 text-fg">
            {model.name} has been superseded. Its replacement from the same lab is{" "}
            <Link href={`/models/${view.successor.id}`} className="text-accent-ink underline-offset-4 hover:underline">
              {view.successor.name}
            </Link>
            .
          </p>
        )}

        <p id="answer" className="mb-8 max-w-2xl text-title leading-7 text-fg-strong">{lead}</p>

        <Table caption="Cheaper options" rows={view.cheaper} self={self} />
        <Table caption="Options that score higher" rows={view.stronger} self={self} />
        <Table caption="Open-weights options" rows={view.open} self={self} />

        <p className="mb-8 text-small leading-6 text-fg-muted">
          Prices are lab list prices. The Intelligence Index is run by one independent evaluator with the same tasks for every
          model; a model with no figure has not been independently measured. See{" "}
          <Link href={`/models/${model.id}`} className="text-accent-ink underline-offset-4 hover:underline">{model.name}</Link>{" "}
          for its sources, or <Link href="/best" className="text-accent-ink underline-offset-4 hover:underline">best by task</Link>.
        </p>

        <Disclosure summary="Common questions">
          <div className="space-y-4">
            {faq.map((item) => (
              <div key={item.q}>
                <h3 className="font-medium text-fg-strong">{item.q}</h3>
                <p className="mt-1">{item.a}</p>
              </div>
            ))}
          </div>
        </Disclosure>
      </section>
    </main>
  )
}
