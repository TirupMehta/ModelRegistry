import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import Header from "@/components/header"
import { datasetRevision } from "@/data/revision"
import { safeJsonLd } from "@/lib/utils"
import { SITE, breadcrumbList, compareHref, faqPage, itemList } from "@/lib/seo"
import { bestPageTitle, bestSlug, buildBestAnswers, type BestAnswer } from "@/lib/best"
import { INDEPENDENT_EVALUATOR } from "@/lib/independent"
import RankingsSwitcher from "@/components/rankings-switcher"
import { ArrowLeft } from "lucide-react"
import { Disclosure, PageHeader } from "@/components/ui"

export const dynamicParams = false

export function generateStaticParams() {
  return buildBestAnswers().map((answer) => ({ task: bestSlug(answer.id) }))
}

function findAnswer(task: string): BestAnswer | undefined {
  return buildBestAnswers().find((answer) => bestSlug(answer.id) === task)
}

const monthYear = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })

export async function generateMetadata({ params }: { params: Promise<{ task: string }> }): Promise<Metadata> {
  const { task } = await params
  const answer = findAnswer(task)
  if (!answer) return {}
  const leader = answer.entries[0]
  const title = `${bestPageTitle(answer)} (${monthYear(datasetRevision.revisedAt)}): ${leader.model.name} leads`
  const description = `${leader.model.name} leads on ${answer.measure} (${leader.value}) among ${answer.field} current models. Independent results, not lab claims. Updated ${datasetRevision.revisedAt}.`
  const url = `${SITE}/best/${task}`
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: "ModelRegistry", type: "article", modifiedTime: `${datasetRevision.revisedAt}T00:00:00Z` },
    twitter: { card: "summary_large_image", title, description },
  }
}

export default async function BestTaskPage({ params }: { params: Promise<{ task: string }> }) {
  const { task } = await params
  const answer = findAnswer(task)
  if (!answer) notFound()
  const leader = answer.entries[0]
  const runnerUp = answer.entries[1]
  const others = buildBestAnswers().filter((a) => a.id !== answer.id)
  const pageTitle = bestPageTitle(answer)
  const url = `${SITE}/best/${task}`

  const faq = [
    { q: `${pageTitle}?`, a: answer.answer },
    {
      q: `How is "${pageTitle.toLowerCase()}" decided?`,
      a: `${answer.measure}, run by ${INDEPENDENT_EVALUATOR.name} with the same tasks and settings for every model, not chosen or reported by the labs. ${answer.caveat}`,
    },
    {
      q: `Is ${leader.model.name} the best model for everything?`,
      a: `No. ${leader.model.name} leads this one test. Other tests have other leaders, so check the task closest to your work${runnerUp ? `, and the ${leader.model.name} vs ${runnerUp.model.name} comparison` : ""}.`,
    },
  ]

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}#page`,
    url,
    name: pageTitle,
    description: answer.answer,
    dateModified: `${datasetRevision.revisedAt}T00:00:00Z`,
    inLanguage: "en",
    isPartOf: { "@id": `${SITE}/#website` },
    mainEntity: itemList({
      name: `${pageTitle}: ranked by ${answer.measure}`,
      path: `/best/${task}`,
      description: answer.answer,
      models: answer.entries.map((entry) => entry.model),
      order: "https://schema.org/ItemListOrderDescending",
    }),
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
              { name: "Best by task", path: "/best" },
              { name: pageTitle, path: `/best/${task}` },
            ]),
          ),
        }}
      />

      <section className="page">
        <nav aria-label="Breadcrumb" className="mb-7 flex items-center gap-2.5 text-small leading-relaxed text-fg-muted">
          <Link href="/best" className="inline-flex items-center gap-1 transition-colors duration-150 hover:text-accent-ink">
            <ArrowLeft size={13} aria-hidden="true" />
            <span>Best by task</span>
          </Link>
          <span>/</span>
          <span className="font-medium text-accent-ink">{pageTitle}</span>
        </nav>

        <RankingsSwitcher current="/best" />

        <PageHeader
          title={`${pageTitle}: ${leader.model.name}`}
          meta={
            <>
              Updated <time dateTime={datasetRevision.revisedAt}>{datasetRevision.revisedAt}</time> · {answer.field} current models tested
            </>
          }
          className="mb-6"
        />

        <p id="answer" className="mb-8 max-w-2xl text-title leading-7 text-fg-strong">
          {answer.answer}
        </p>

        <ol className="rule-t mb-3">
          {answer.entries.map((entry) => (
            <li key={entry.model.id} className="rule-b">
              <Link href={`/models/${entry.model.id}`} className="group flex items-baseline gap-3 py-3">
                <span className="w-5 shrink-0 text-small tabular-nums text-fg-muted">{entry.rank}</span>
                <span className="text-body font-medium text-fg-strong transition-colors group-hover:text-accent-ink">{entry.model.name}</span>
                <span className="hidden text-small text-fg-muted sm:inline">{entry.model.companyName}</span>
                <span className="ml-auto text-body font-semibold tabular-nums text-fg-strong">{entry.value}</span>
              </Link>
            </li>
          ))}
        </ol>
        <p className="mb-8 text-small leading-6 text-fg-muted">
          {answer.caveat}
        </p>

        {answer.openLeader && (
          <p className="mb-8 max-w-2xl text-body leading-6 text-fg">
            Best open-weights result:{" "}
            <Link href={`/models/${answer.openLeader.model.id}`} className="text-accent-ink underline-offset-4 hover:underline">
              {answer.openLeader.model.name}
            </Link>{" "}
            ({answer.openLeader.value}, rank {answer.openLeader.rank} of {answer.field}).
          </p>
        )}

        {runnerUp && (
          <p className="mb-10 max-w-2xl text-body leading-6 text-fg">
            Weighing the top two?{" "}
            <Link href={compareHref(leader.model, runnerUp.model)} className="text-accent-ink underline-offset-4 hover:underline">
              Compare {leader.model.name} and {runnerUp.model.name}
            </Link>
            .
          </p>
        )}

        <h2 className="mb-3 font-display text-heading font-semibold tracking-tight text-fg-strong">Other questions</h2>
        <ul className="mb-10 grid gap-2 sm:grid-cols-2">
          {others.map((other) => (
            <li key={other.id}>
              <Link href={`/best/${bestSlug(other.id)}`} className="tile-link flex items-baseline justify-between gap-3 px-3.5 py-2.5 text-body">
                <span className="min-w-0 truncate text-fg-strong">{bestPageTitle(other)}</span>
                <span className="shrink-0 text-small text-fg-muted">{other.entries[0].model.name}</span>
              </Link>
            </li>
          ))}
        </ul>

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
