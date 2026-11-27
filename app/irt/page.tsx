import type { Metadata } from "next"
import Link from "next/link"
import Header from "@/components/header"
import { modelsData } from "@/data/models"
import { IRT_COHORTS, IRT_COUNTS, IRT_METHOD, IRT_SCORES } from "@/data/irt-scores"
import { datasetRevision } from "@/data/revision"
import { SITE, breadcrumbList } from "@/lib/seo"
import { safeJsonLd } from "@/lib/utils"
import { withShare } from "@/lib/share"

export const metadata: Metadata = withShare(
  {
    title: "IRT ability board: a second, independent ranking",
    description:
      "A regularized 2-parameter IRT estimate of model ability with 90% intervals, fitted on observed results only. Published beside the ModelRegistry Score, never merged with it.",
    alternates: { canonical: `${SITE}/irt` },
    openGraph: {
      title: "IRT ability board",
      description:
        "Latent ability from observed test results, with 90% intervals, cohort hygiene and a frozen scale. A separate instrument from the ModelRegistry Score.",
      url: `${SITE}/irt`,
      siteName: "ModelRegistry",
      type: "article",
    },
  },
  { page: "/irt" },
  "/irt",
)

const bySlug = new Map(modelsData.map((model) => [model.id, model]))

const DOMAIN_LABEL: Record<string, string> = {
  agentic: "Agentic",
  coding: "Coding",
  reasoning: "Reasoning",
  knowledge: "Knowledge",
  math: "Math",
  instruction_following: "Instruction following",
}

const STATUS_TONE: Record<string, string> = {
  kept: "border-emerald-600/35 text-emerald-700 dark:border-emerald-400/30 dark:text-emerald-400",
  insufficient_overlap: "border-black/15 text-fg-muted dark:border-white/15",
  stale: "border-amber-600/40 text-amber-700 dark:border-amber-400/30 dark:text-amber-400",
  saturated: "border-amber-600/40 text-amber-700 dark:border-amber-400/30 dark:text-amber-400",
  legacy: "border-black/15 text-fg-muted dark:border-white/15",
}

const STATUS_LABEL: Record<string, string> = {
  kept: "Fitted",
  insufficient_overlap: "Not enough overlap",
  stale: "Stale",
  saturated: "Saturated",
  legacy: "Legacy",
}

const TOOL_LABEL: Record<string, string> = { none: "No tools", tools: "Tool-assisted" }

const nf = (value: number) => value.toLocaleString("en-US")
const fixed = (value: number) => value.toFixed(1)

export default function IrtPage() {
  const scored = IRT_SCORES
  const domains = [...new Set(scored.flatMap((row) => row.domains))].sort((a, b) => a.localeCompare(b))
  const suited = scored.filter((row) => row.isParetoOptimal).length
  const displayed = IRT_COHORTS.filter((cohort) => cohort.status !== "kept")

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "@id": `${SITE}/irt#article`,
    headline: "IRT ability board",
    description:
      "A regularized 2-parameter item response theory estimate of frontier model ability, fitted on observed benchmark results only, with 90% intervals and a frozen scale.",
    url: `${SITE}/irt`,
    isPartOf: { "@id": `${SITE}/#website` },
    about: { "@id": `${SITE}/api/v1/models` },
    inLanguage: "en",
    dateModified: datasetRevision.revisedAt,
    isBasedOn: IRT_METHOD.independent,
  }

  return (
    <main id="content" tabIndex={-1} className="relative min-h-screen focus:outline-none">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(
            breadcrumbList([
              { name: "Registry", path: "/" },
              { name: "IRT ability board", path: "/irt" },
            ]),
          ),
        }}
      />
      <section className="page">
        <h1 className="text-page font-display font-semibold tracking-tight text-fg-strong mb-2">
          IRT ability board
        </h1>
        <p className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-small font-sans text-fg-muted">
          <span>Method v{IRT_METHOD.version}</span>
          <span className="h-3 w-px bg-black/10 dark:bg-white/15" aria-hidden="true" />
          <span>As of {IRT_METHOD.asOf}</span>
          <span className="h-3 w-px bg-black/10 dark:bg-white/15" aria-hidden="true" />
          <Link href="/score" className="text-accent-ink hover:underline underline-offset-2">
            ModelRegistry Score
          </Link>
          <span className="h-3 w-px bg-black/10 dark:bg-white/15" aria-hidden="true" />
          <Link href="/methodology" className="text-accent-ink hover:underline underline-offset-2">
            Methodology
          </Link>
          <span className="h-3 w-px bg-black/10 dark:bg-white/15" aria-hidden="true" />
          <Link href="/trust" className="text-accent-ink hover:underline underline-offset-2">
            Trust and scope
          </Link>
        </p>

        <p className="mb-3 max-w-[68ch] text-body text-fg leading-6 sm:leading-7">
          This board is a second opinion, not a replacement. It fits a regularized 2-parameter item response
          theory model to the benchmark results the registry already holds, so each model gets a latent
          ability estimate instead of an average of percentages. The{" "}
          <Link href="/score" className="text-accent-ink hover:underline underline-offset-2">
            ModelRegistry Score
          </Link>{" "}
          is unchanged and unaffected: the two are published side by side and neither is an input to the other.
        </p>
        <p className="mb-3 max-w-[68ch] text-body text-fg leading-6 sm:leading-7">
          The index is a fixed linear map of the estimate: {IRT_METHOD.scale.mean} plus {IRT_METHOD.scale.sd} times
          ability, on a 0 to 100 scale, with a 90% interval from the observed information. Five reference models
          are pinned, so a published score does not move when a new model arrives.
        </p>

        <div className="mb-8 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
          {[
            ["Models scored", nf(IRT_COUNTS.scoredModels)],
            ["Fitted cohorts", nf(IRT_COUNTS.keptCohorts)],
            ["Observations", nf(IRT_COUNTS.fittedObservations)],
            ["Value frontier", nf(suited)],
          ].map(([label, value]) => (
            <div key={label} className="tile px-4 py-3">
              <p className="text-caption font-sans uppercase tracking-wide text-fg-muted">{label}</p>
              <p className="mt-1 text-title font-display font-semibold tabular-nums text-fg-strong">{value}</p>
            </div>
          ))}
        </div>

        <h2 className="text-heading font-display font-semibold tracking-tight text-fg-strong mt-10 mb-3">
          Ability and interval
        </h2>
        <p className="mb-4 max-w-[68ch] text-body text-fg leading-6 sm:leading-7">
          Rows are ordered by the index. Two models whose intervals overlap are not separated by this evidence, and
          the interval is printed rather than hidden. &quot;Tests&quot; is the number of benchmark results the fit
          used, not everything the model has ever published.
        </p>

        <div className="mb-6 overflow-x-auto">
          <table className="w-full text-left text-body font-sans">
            <caption className="sr-only">IRT ability index with 90% intervals for each scored model</caption>
            <thead>
              <tr className="border-b border-black/10 text-small text-fg-muted dark:border-white/[0.08]">
                <th className="py-2 pr-4 font-medium">#</th>
                <th className="py-2 pr-4 font-medium">Model</th>
                <th className="py-2 pr-4 font-medium">IRT index</th>
                <th className="py-2 pr-4 font-medium">90% interval</th>
                <th className="py-2 pr-4 font-medium">Tests</th>
                <th className="py-2 pr-4 font-medium">Evidence</th>
                <th className="py-2 font-medium">Value</th>
              </tr>
            </thead>
            <tbody>
              {scored.map((row, index) => {
                const model = bySlug.get(row.slug)
                return (
                  <tr key={row.slug} className="rule-b align-top">
                    <td className="py-2.5 pr-4 tabular-nums text-fg-muted">{index + 1}</td>
                    <td className="py-2.5 pr-4">
                      <Link
                        href={`/models/${row.slug}`}
                        className="font-medium text-fg-strong hover:text-accent-ink underline-offset-2 hover:underline"
                      >
                        {model?.name ?? row.slug}
                      </Link>
                      <p className="mt-0.5 text-caption text-fg-muted">{model?.companyName ?? ""}</p>
                    </td>
                    <td className="py-2.5 pr-4 tabular-nums font-medium text-fg-strong">{fixed(row.index)}</td>
                    <td className="py-2.5 pr-4 tabular-nums text-fg-muted">
                      {fixed(row.ci90[0])} to {fixed(row.ci90[1])}
                    </td>
                    <td className="py-2.5 pr-4 tabular-nums text-fg-muted">{row.observations}</td>
                    <td className="py-2.5 pr-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-caption font-medium ${
                          row.confidenceStatus === "Supported"
                            ? "border-emerald-600/35 text-emerald-700 dark:border-emerald-400/30 dark:text-emerald-400"
                            : "border-black/15 text-fg-muted dark:border-white/15"
                        }`}
                      >
                        {row.confidenceStatus}
                      </span>
                    </td>
                    <td className="py-2.5">
                      {row.isParetoOptimal ? (
                        <span className="inline-flex items-center rounded-full border border-accent/40 px-2 py-0.5 text-caption font-medium text-accent-ink">
                          Frontier
                        </span>
                      ) : (
                        <span className="text-caption text-fg-muted">
                          {row.savingsVsTop !== null && row.savingsVsTop > 0
                            ? `${Math.round(row.savingsVsTop * 100)}% below top cost`
                            : ""}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <h2 className="text-heading font-display font-semibold tracking-tight text-fg-strong mt-10 mb-3">
          How the fit decides
        </h2>
        <p className="mb-3 max-w-[68ch] text-body text-fg leading-6 sm:leading-7">
          Each result is normalized to its own test&apos;s floor and ceiling. The model estimates, for every
          model, the ability that best explains the pattern of results it actually has, and for every test how
          hard it is and how sharply it separates abilities. A result a model never produced contributes
          nothing; nothing is filled in.
        </p>
        <p className="mb-3 max-w-[68ch] text-body text-fg leading-6 sm:leading-7">
          Weakly informative priors keep the estimate finite: ability near zero, log discrimination near zero,
          difficulty near zero. On a thin matrix this shrinks toward the average instead of inventing a
          confident outlier. A model with two easy results cannot outrank a model with fifteen hard ones, and
          the test suite asserts exactly that.
        </p>

        <h2 className="text-heading font-display font-semibold tracking-tight text-fg-strong mt-10 mb-3">
          Cohorts and hygiene
        </h2>
        <p className="mb-4 max-w-[68ch] text-body text-fg leading-6 sm:leading-7">
          A test enters the fit only if at least four models took it, it has been touched within a year, fewer
          than a quarter of its results sit at the ceiling, and it is not a legacy test. Every test that did not
          clear those rules is listed below with the reason, rather than quietly dropped.
        </p>
        {displayed.length > 0 ? (
          <div className="mb-6 overflow-x-auto">
            <table className="w-full text-left text-body font-sans">
              <caption className="sr-only">Benchmark cohorts excluded from the IRT fit, with the reason</caption>
              <thead>
                <tr className="border-b border-black/10 text-small text-fg-muted dark:border-white/[0.08]">
                  <th className="py-2 pr-4 font-medium">Test</th>
                  <th className="py-2 pr-4 font-medium">Domain</th>
                  <th className="py-2 pr-4 font-medium">Mode</th>
                  <th className="py-2 pr-4 font-medium">Models</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((cohort) => (
                  <tr key={cohort.id} className="rule-b">
                    <td className="py-2 pr-4 font-mono text-small text-fg-strong">{cohort.benchmarkId}</td>
                    <td className="py-2 pr-4 text-fg-muted">{DOMAIN_LABEL[cohort.domain] ?? cohort.domain}</td>
                    <td className="py-2 pr-4 text-fg-muted">{TOOL_LABEL[cohort.toolMode]}</td>
                    <td className="py-2 pr-4 tabular-nums text-fg-muted">{cohort.models}</td>
                    <td className="py-2">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-caption font-medium ${
                          STATUS_TONE[cohort.status] ?? STATUS_TONE.legacy
                        }`}
                      >
                        {STATUS_LABEL[cohort.status] ?? cohort.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        <h2 className="text-heading font-display font-semibold tracking-tight text-fg-strong mt-10 mb-3">
          What this board does not claim
        </h2>
        <ul className="mb-3 max-w-[68ch] list-disc space-y-2 pl-5 text-body text-fg leading-6 sm:leading-7">
          <li>It does not replace the ModelRegistry Score, and it does not change it.</li>
          <li>It does not turn one test into an ability estimate: a model needs at least two fitted results.</li>
          <li>It does not rank two models whose intervals overlap as if the order were known.</li>
          <li>It does not treat a tool-assisted run and a bare run as the same test.</li>
          {domains.length > 0 ? <li>It covers {domains.map((domain) => DOMAIN_LABEL[domain] ?? domain).join(", ")}; a domain with no fitted evidence is not shown.</li> : null}
        </ul>

        <p className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-small font-sans text-fg-muted">
          <Link href="/score" className="text-accent-ink hover:underline underline-offset-2">
            ModelRegistry Score
          </Link>
          <span className="h-3 w-px bg-black/10 dark:bg-white/15" aria-hidden="true" />
          <Link href="/methodology" className="text-accent-ink hover:underline underline-offset-2">
            Methodology
          </Link>
          <span className="h-3 w-px bg-black/10 dark:bg-white/15" aria-hidden="true" />
          <Link href="/trust" className="text-accent-ink hover:underline underline-offset-2">
            Trust and scope
          </Link>
          <span className="h-3 w-px bg-black/10 dark:bg-white/15" aria-hidden="true" />
          <Link href="/verify" className="text-accent-ink hover:underline underline-offset-2">
            Verify the snapshot
          </Link>
        </p>
      </section>
    </main>
  )
}
