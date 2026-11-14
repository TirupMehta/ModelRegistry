import type { Metadata } from "next"
import Link from "next/link"
import Header from "@/components/header"
import { datasetRevision } from "@/data/revision"
import { safeJsonLd } from "@/lib/utils"
import { SITE, breadcrumbList } from "@/lib/seo"
import { costStory, labClaimStory } from "@/lib/insights"
import { PageHeader } from "@/components/ui"

export const metadata: Metadata = {
  title: "AI model insights: data stories from independent results",
  description: "Short, sourced data stories about AI models: how lab claims compare with independent runs, and what intelligence costs per task. Each comes with a CSV.",
  alternates: { canonical: `${SITE}/insights` },
  openGraph: { title: "AI model insights", description: "Data stories from independent results, with the CSV for each.", url: `${SITE}/insights`, siteName: "ModelRegistry", type: "website" },
}

export default function InsightsPage() {
  const claims = labClaimStory()
  const cost = costStory()
  const stories = [
    {
      href: "/insights/lab-claims-vs-independent",
      title: "Do AI labs' benchmark claims hold up?",
      line: `${claims.lowerCount} of ${claims.total} lab-reported Terminal-Bench scores are lower when run independently, by ${Math.abs(claims.meanGap)} points on average.`,
    },
    {
      href: "/insights/cost-of-intelligence",
      title: "What does AI intelligence cost?",
      line: cost.cheapestAbove50 && cost.priciest
        ? `${cost.cheapestAbove50.model.name} reaches an index of ${cost.cheapestAbove50.index} for $${cost.cheapestAbove50.costPerTask.toFixed(2)} per task; the most expensive model costs $${cost.priciest.costPerTask.toFixed(2)}.`
        : "Cost per task against the independent index.",
    },
  ]
  return (
    <main className="relative min-h-screen">
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbList([{ name: "Ledger", path: "/" }, { name: "Insights", path: "/insights" }])) }}
      />
      <section className="page">
        <PageHeader
          title="Insights"
          lead="Short data stories built from independent results, each with its CSV and its sources."
          meta={<>Updated <time dateTime={datasetRevision.revisedAt}>{datasetRevision.revisedAt}</time></>}
        />
        <ul className="space-y-3">
          {stories.map((story) => (
            <li key={story.href}>
              <Link href={story.href} className="tile-link group block p-5">
                <span className="block font-display text-heading font-semibold tracking-tight text-fg-strong transition-colors group-hover:text-accent-ink">{story.title}</span>
                <span className="mt-1 block text-body leading-6 text-fg">{story.line}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
