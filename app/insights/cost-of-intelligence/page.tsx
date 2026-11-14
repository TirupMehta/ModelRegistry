import type { Metadata } from "next"
import Link from "next/link"
import Header from "@/components/header"
import { datasetRevision } from "@/data/revision"
import { safeJsonLd } from "@/lib/utils"
import { SITE, breadcrumbList, faqPage } from "@/lib/seo"
import { costStory } from "@/lib/insights"
import { INDEPENDENT_EVALUATOR } from "@/lib/independent"
import { ArrowLeft } from "lucide-react"
import { Disclosure, PageHeader } from "@/components/ui"

const story = costStory()
const usd = (n: number) => `$${n.toFixed(2)}`
const cheap = story.cheapestAbove50
const TITLE = cheap
  ? `What does AI intelligence cost? ${cheap.model.name} scores ${cheap.index} for ${usd(cheap.costPerTask)} per task`
  : "What does AI intelligence cost per task?"
const DESCRIPTION = story.top && story.priciest
  ? `Cost per task against the independent Intelligence Index for ${story.rows.length} current models: from ${usd(story.rows.reduce((m, r) => Math.min(m, r.costPerTask), Infinity))} to ${usd(story.priciest.costPerTask)}. Data and CSV included.`
  : "Cost per task against the independent Intelligence Index."

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE}/insights/cost-of-intelligence` },
  openGraph: { title: TITLE, description: DESCRIPTION, url: `${SITE}/insights/cost-of-intelligence`, siteName: "ModelRegistry", type: "article", modifiedTime: `${datasetRevision.revisedAt}T00:00:00Z` },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
}

export default function CostPage() {
  const url = `${SITE}/insights/cost-of-intelligence`
  const lead =
    story.top && cheap && story.priciest
      ? `${story.top.model.name} has the highest independent Intelligence Index (${story.top.index}) at ${usd(story.top.costPerTask)} per task. ${cheap.model.name} reaches ${cheap.index} for ${usd(cheap.costPerTask)}, and ${story.priciest.model.name} costs the most at ${usd(story.priciest.costPerTask)} per task. ${story.frontier.length} models sit on the cost frontier: nothing scores higher for less.`
      : "Cost per task and independent scores for current models."
  const faq = [
    { q: "What is the cheapest good AI model?", a: lead },
    { q: "What is cost per task?", a: `${INDEPENDENT_EVALUATOR.name} reports the weighted cost of running one Intelligence Index task for each model, including the reasoning tokens it spends. It differs from the per-token list price because models use different numbers of tokens.` },
    { q: "Where is the data?", a: `A CSV is at ${SITE}/data/intelligence-per-dollar.csv.` },
  ]
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${url}#article`,
    headline: TITLE,
    description: DESCRIPTION,
    url,
    datePublished: `${datasetRevision.revisedAt}T00:00:00Z`,
    dateModified: `${datasetRevision.revisedAt}T00:00:00Z`,
    inLanguage: "en",
    author: { "@id": `${SITE}/#person` },
    publisher: { "@id": `${SITE}/#organization` },
    mainEntityOfPage: url,
    isPartOf: { "@id": `${SITE}/#website` },
    speakable: { "@type": "SpeakableSpecification", cssSelector: ["h1", "#answer"] },
  }
  const dataset = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Cost per task against independent Intelligence Index",
    description: DESCRIPTION,
    url,
    license: "https://opensource.org/licenses/MIT",
    creator: { "@id": `${SITE}/#organization` },
    dateModified: `${datasetRevision.revisedAt}T00:00:00Z`,
    isBasedOn: INDEPENDENT_EVALUATOR.url,
    distribution: [{ "@type": "DataDownload", encodingFormat: "text/csv", contentUrl: `${SITE}/data/intelligence-per-dollar.csv` }],
  }

  return (
    <main className="relative min-h-screen">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(dataset) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(faqPage(faq)) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(
            breadcrumbList([
              { name: "Ledger", path: "/" },
              { name: "Insights", path: "/insights" },
              { name: "Cost of intelligence", path: "/insights/cost-of-intelligence" },
            ]),
          ),
        }}
      />
      <section className="page">
        <nav aria-label="Breadcrumb" className="mb-7 flex items-center gap-2.5 text-small text-fg-muted">
          <Link href="/insights" className="inline-flex items-center gap-1 transition-colors hover:text-accent-ink">
            <ArrowLeft size={13} aria-hidden="true" />
            <span>Insights</span>
          </Link>
        </nav>

        <PageHeader
          title="What does AI intelligence cost?"
          meta={<>Updated <time dateTime={datasetRevision.revisedAt}>{datasetRevision.revisedAt}</time> · data read {INDEPENDENT_EVALUATOR.retrievedAt}</>}
          className="mb-6"
        />
        <p id="answer" className="mb-8 max-w-2xl text-title leading-7 text-fg-strong">{lead}</p>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <thead>
              <tr className="rule-b text-small text-fg-muted">
                <th scope="col" className="py-2 pr-3 font-medium">Model</th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">Index</th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">Cost per task</th>
                <th scope="col" className="py-2 text-right font-medium">Cost frontier</th>
              </tr>
            </thead>
            <tbody>
              {story.rows.map((row) => (
                <tr key={row.model.id} className="rule-b">
                  <th scope="row" className="py-3 pr-3 font-normal">
                    <Link href={`/models/${row.model.id}`} className="block text-body font-medium text-fg-strong hover:text-accent-ink">{row.model.name}</Link>
                    <span className="block text-small text-fg-muted">{row.model.companyName}</span>
                  </th>
                  <td className="py-3 pr-3 text-right text-body tabular-nums text-fg">{row.index}</td>
                  <td className="py-3 pr-3 text-right text-body tabular-nums text-fg">{usd(row.costPerTask)}</td>
                  <td className="py-3 text-right text-small text-fg">{row.onFrontier ? "yes" : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-6 mb-8 text-small leading-6 text-fg-muted">
          Index and cost are read from {INDEPENDENT_EVALUATOR.name} for the same tasks and settings across models. A model is on the
          frontier when no other model scores at least as high for less. <a href="/data/intelligence-per-dollar.csv" className="text-accent-ink underline-offset-4 hover:underline">Download the CSV</a>.
          Cite as: ModelRegistry, &ldquo;What does AI intelligence cost?&rdquo;, {datasetRevision.revisedAt}, {url}.
        </p>

        <Disclosure summary="Common questions">
          <div className="space-y-4">
            {faq.map((item) => (
              <div key={item.q}><h3 className="font-medium text-fg-strong">{item.q}</h3><p className="mt-1">{item.a}</p></div>
            ))}
          </div>
        </Disclosure>
      </section>
    </main>
  )
}
