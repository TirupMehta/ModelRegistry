import type { Metadata } from "next"
import Link from "next/link"
import Header from "@/components/header"
import { datasetRevision } from "@/data/revision"
import { safeJsonLd } from "@/lib/utils"
import { SITE, breadcrumbList, faqPage } from "@/lib/seo"
import { labClaimStory } from "@/lib/insights"
import { INDEPENDENT_EVALUATOR } from "@/lib/independent"
import { ArrowLeft } from "lucide-react"
import { Disclosure, PageHeader } from "@/components/ui"

const story = labClaimStory()
const TITLE = `Do AI labs' benchmark claims hold up? ${story.lowerCount} of ${story.total} came in lower when run independently`
const DESCRIPTION = `Lab-reported Terminal-Bench scores against the same test run independently by ${INDEPENDENT_EVALUATOR.name}: ${story.lowerCount} of ${story.total} are lower, ${Math.abs(story.meanGap)} points on average. Data and CSV included.`

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE}/insights/lab-claims-vs-independent` },
  openGraph: { title: TITLE, description: DESCRIPTION, url: `${SITE}/insights/lab-claims-vs-independent`, siteName: "ModelRegistry", type: "article", modifiedTime: `${datasetRevision.revisedAt}T00:00:00Z` },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
}

export default function LabClaimsPage() {
  const url = `${SITE}/insights/lab-claims-vs-independent`
  const lead = `${story.lowerCount} of ${story.total} laboratory-reported Terminal-Bench scores are lower when ${INDEPENDENT_EVALUATOR.name} runs the test on the same tasks, by ${Math.abs(story.meanGap)} points on average${story.worst ? `; the largest gap is ${Math.abs(story.worst.gap)} points for ${story.worst.model.name}` : ""}. Counting only the ${story.sameVersion.total} labs that state the same version (4.0), ${story.sameVersion.lowerCount} of ${story.sameVersion.total} are lower. The sample is small, so treat it as a pattern to watch, not a verdict.`
  const faq = [
    { q: "Do AI labs overstate their benchmark scores?", a: lead },
    {
      q: "Why would a lab score differ from an independent score?",
      a: "Labs choose the harness, the reasoning effort, the number of attempts and which version of the test to report. An independent evaluator runs every model the same way. The difference is a reason to prefer independent results for ranking, not proof of bad faith.",
    },
    { q: "Where is the data?", a: `A CSV with every pair, its source and the read date is at ${SITE}/data/lab-vs-independent.csv.` },
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
    name: "Lab-reported vs independently run Terminal-Bench scores",
    description: DESCRIPTION,
    url,
    license: "https://opensource.org/licenses/MIT",
    creator: { "@id": `${SITE}/#organization` },
    dateModified: `${datasetRevision.revisedAt}T00:00:00Z`,
    isBasedOn: INDEPENDENT_EVALUATOR.url,
    distribution: [{ "@type": "DataDownload", encodingFormat: "text/csv", contentUrl: `${SITE}/data/lab-vs-independent.csv` }],
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
              { name: "Lab claims vs independent", path: "/insights/lab-claims-vs-independent" },
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
          title="Do AI labs' benchmark claims hold up?"
          meta={<>Updated <time dateTime={datasetRevision.revisedAt}>{datasetRevision.revisedAt}</time> · data read {INDEPENDENT_EVALUATOR.retrievedAt}</>}
          className="mb-6"
        />
        <p id="answer" className="mb-8 max-w-2xl text-title leading-7 text-fg-strong">{lead}</p>

        <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="tile p-4"><div className="text-small text-fg-muted">Lower when run independently</div><div className="mt-1 text-heading font-semibold tabular-nums text-fg-strong">{story.lowerCount} of {story.total}</div></div>
          <div className="tile p-4"><div className="text-small text-fg-muted">Average gap</div><div className="mt-1 text-heading font-semibold tabular-nums text-fg-strong">{story.meanGap} pts</div></div>
          {story.worst && <div className="tile p-4"><div className="text-small text-fg-muted">Largest gap</div><div className="mt-1 text-heading font-semibold tabular-nums text-fg-strong">{story.worst.gap} pts</div></div>}
        </div>

        <h2 className="mb-3 font-display text-heading font-semibold tracking-tight text-fg-strong">Every pair</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left">
            <thead>
              <tr className="rule-b text-small text-fg-muted">
                <th scope="col" className="py-2 pr-3 font-medium">Model</th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">Lab reported</th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">Independent</th>
                <th scope="col" className="py-2 text-right font-medium">Gap</th>
              </tr>
            </thead>
            <tbody>
              {story.rows.map((row) => (
                <tr key={row.model.id} className="rule-b">
                  <th scope="row" className="py-3 pr-3 font-normal">
                    <Link href={`/models/${row.model.id}`} className="block text-body font-medium text-fg-strong hover:text-accent-ink">{row.model.name}</Link>
                    <span className="block text-small text-fg-muted">{row.model.companyName}{row.likeForLike ? "" : " · version not stated by the lab"}</span>
                  </th>
                  <td className="py-3 pr-3 text-right text-body tabular-nums text-fg">{row.lab}%</td>
                  <td className="py-3 pr-3 text-right text-body tabular-nums text-fg">{row.independent}%</td>
                  <td className="py-3 text-right text-body font-semibold tabular-nums text-fg-strong">{row.gap > 0 ? "+" : ""}{row.gap}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-6 mb-8 text-small leading-6 text-fg-muted">
          Test: Terminal-Bench 4.0. Lab figures are copied as printed on the lab&apos;s own page; independent figures are read from{" "}
          {INDEPENDENT_EVALUATOR.name}. Pairs where the lab does not state a version are included and flagged.{" "}
          <a href="/data/lab-vs-independent.csv" className="text-accent-ink underline-offset-4 hover:underline">Download the CSV</a>. Cite as: ModelRegistry, &ldquo;Lab claims vs independent results&rdquo;, {datasetRevision.revisedAt}, {url}.
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
