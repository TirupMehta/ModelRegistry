import type { Metadata } from "next"
import Link from "next/link"
import Header from "@/components/header"
import { companies } from "@/data/companies"
import { modelsData } from "@/data/models"
import { datasetRevision } from "@/data/revision"
import { safeJsonLd } from "@/lib/utils"
import { SITE, breadcrumbList, faqPage } from "@/lib/seo"
import {
  LEADERBOARD_VERSION,
  MIN_COHORT_SIZE,
  leaderboardStats,
  positionsFor,
} from "@/lib/leaderboards"
import { AGREEMENT_LABEL, CORROBORATED_SPREAD, CONTESTED_SPREAD, MIN_TESTS_FOR_STANDING, STANDING_VERSION } from "@/lib/standing"
import {
  INDEPENDENT_EVALUATOR,
  buildIndependentBoards,
  buildIndependentStanding,
  discrepancies,
  toLeaderboards,
  valueRows,
} from "@/lib/independent"
import { splitLineup } from "@/lib/currency"
import RankingsSwitcher from "@/components/rankings-switcher"
import { ArrowLeft, ChevronDown } from "lucide-react"

export const metadata: Metadata = {
  title: "AI model standing across benchmarks, and why it is not one number",
  description:
    "A cross-test standing built from per-test percentiles, with the disagreement between tests published next to it. Models measured on one test are ranked on that test only.",
  alternates: { canonical: `${SITE}/score` },
  openGraph: {
    title: "AI model standing across benchmarks",
    description:
      "Rank equating, coverage refusal, and the spread between tests published as a first-class number.",
    url: `${SITE}/score`,
    siteName: "ModelRegistry",
    type: "article",
  },
}

const summaryClass =
  "flex cursor-pointer list-none items-center gap-3 py-3.5 [&::-webkit-details-marker]:hidden"

const chevronClass =
  "ml-auto shrink-0 text-fg-muted transition-transform duration-200 group-open:rotate-180"

const AGREEMENT_CLASS: Record<string, string> = {
  corroborated:
    "border-emerald-600/35 text-emerald-700 dark:text-emerald-400 dark:border-emerald-400/30",
  mixed: "border-black/15 text-fg-muted dark:border-white/15",
  contested: "border-amber-600/40 text-amber-700 dark:text-amber-400 dark:border-amber-400/30",
}

export default function ScorePage() {
  const lineup = splitLineup(modelsData)
  const independentBoards = buildIndependentBoards(modelsData)
  const boards = toLeaderboards(independentBoards)
  const stats = { boards, tests: independentBoards.filter((b) => b.info.key !== "intelligenceIndex").length }
  const gaps = discrepancies(modelsData)
  const value = valueRows(modelsData)
  const meanGap = gaps.length > 0 ? gaps.reduce((sum, g) => sum + g.gap, 0) / gaps.length : 0
  const lowerCount = gaps.filter((g) => g.gap < 0).length
  const standing = buildIndependentStanding(modelsData)

  // Raw evidence behind each standing: where a model sits on every test it reports.
  const multi = lineup.current
    .map((model) => ({ model, positions: positionsFor(model, boards) }))
    .filter((row) => row.positions.length > 1)
    .sort(
      (a, b) =>
        b.positions.length - a.positions.length ||
        Math.min(...a.positions.map((p) => p.rank)) - Math.min(...b.positions.map((p) => p.rank)),
    )

  const disagreementPoints = Math.round(standing.betweenTestSd * 100)
  const contested = standing.rows.filter((row) => row.agreement === "contested").length
  const unstable = standing.rows.filter((row) => row.auditable && !row.stable).length
  const unaudited = standing.rows.filter((row) => !row.auditable).length

  const faq = [
    {
      q: "What is the best AI model right now?",
      a: `No model leads every test, so none is called best overall; the leader on each test is on the best-by-task page (${SITE}/best). On this page, ${standing.rated} of ${standing.ranked} ranked models report more than one test, and those ${standing.rated} are ordered by the mean of their per-test percentiles. Where two models sit a few points apart, the gap is smaller than the ${disagreementPoints} point spread between tests, and the page does not pretend otherwise.`,
    },
    {
      q: "How is the cross-test standing calculated?",
      a: "Each score is turned into its percentile inside its own cohort, so a hard exam and an easy exam count on the same footing. Those percentiles are averaged with equal weight per test. A model needs at least two cohorts to receive a standing. The spread between its best and worst percentile is published next to the result.",
    },
    {
      q: "Why are most models ranked on one test only?",
      a: `${standing.singleTest.length} of ${standing.ranked} ranked models report a single test. A standing needs two, because one exam cannot corroborate itself. Those models keep their position on the test they did report, which is a real measurement, and they are listed separately rather than being averaged into a claim the evidence does not support.`,
    },
    {
      q: "Can a laboratory game this by publishing only the tests it wins?",
      a: "Only partly, and the page shows where. A model that reports one exam can hold a high position on that exam but cannot receive a cross-test standing. A model that reports several exams and only wins one gets its standing pulled toward the middle by the exams it did not win, and is labelled contested when the spread exceeds fifty percentile points.",
    },
    {
      q: "Why are older models not on the board?",
      a: `Because a ranking is a claim about what you can choose, and a superseded checkpoint is not a choice. ${lineup.superseded.length} records have been replaced in their role by a later release from the same laboratory. They stay in the registry with their sources, readings and dates, listed below the current lineup with the model that replaced them. None of them is marked retired, because no laboratory has withdrawn them.`,
    },
    {
      q: "Are these scores independent?",
      a: "No. Every score is published by the laboratory that built the model, and each record links the document it came from. The ranking says where a laboratory's own figure sits against other laboratories' own figures on the same test.",
    },
  ]

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "@id": `${SITE}/score#article`,
    headline: `AI model standing v${STANDING_VERSION}`,
    description:
      "Cross-test standing computed from per-test percentiles, with the disagreement between tests published alongside it.",
    url: `${SITE}/score`,
    dateModified: datasetRevision.revisedAt,
    author: { "@id": `${SITE}/#organization` },
    publisher: { "@id": `${SITE}/#organization` },
    isPartOf: { "@id": `${SITE}/#website` },
    inLanguage: "en",
    isAccessibleForFree: true,
    about: { "@id": `${SITE}/#organization` },
    keywords: [
      "AI benchmark leaderboard",
      "LLM benchmark comparison",
      "GPQA ranking",
      "MMLU-Pro ranking",
      "SWE-bench ranking",
      "Terminal-Bench ranking",
    ],
  }

  const jsonLdList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "AI model cross-test standing",
    url: `${SITE}/score`,
    numberOfItems: standing.rows.length,
    itemListOrder: "https://schema.org/ItemListUnordered",
    itemListElement: standing.rows.map((row) => ({
      "@type": "ListItem",
      name: `${row.model.name}: standing ${row.standing.toFixed(1)}, ${row.cohorts} tests, spread ${row.spread.toFixed(0)} points`,
      url: `${SITE}/models/${row.model.id}`,
    })),
  }

  return (
    <main className="relative min-h-screen">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLdList) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(faqPage(faq)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(
            breadcrumbList([
              { name: "Ledger", path: "/" },
              { name: "Standing", path: "/score" },
            ]),
          ),
        }}
      />

      <section className="page">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2.5 mb-7 text-small font-sans leading-relaxed text-fg-muted"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-1 hover:text-accent-ink transition-colors duration-150"
          >
            <ArrowLeft size={13} />
            <span>Ledger</span>
          </Link>
          <span>/</span>
          <span className="font-medium text-accent-ink">Standing</span>
        </nav>

        <RankingsSwitcher current="/score" />

        <h1 className="text-page font-display font-semibold tracking-tight text-fg-strong mb-3">
          How the models compare
        </h1>
        <p className="text-title text-fg-muted leading-7 max-w-2xl mb-5">
          A standing across tests, an honest measure of how much those tests disagree, and a refusal
          to rate a model on evidence that cannot corroborate itself. Only the current lineup is
          ranked: a superseded checkpoint is not something a reader can choose today, so it is kept
          below with its replacement instead of being placed against current models.
        </p>
        <p className="mb-8 flex flex-wrap items-center gap-2 text-small font-sans text-fg-muted">
          <span>Standing v{STANDING_VERSION}</span>
          <span className="h-3 w-px bg-black/10 dark:bg-white/15" aria-hidden="true" />
          <span>{standing.rated} rated</span>
          <span className="h-3 w-px bg-black/10 dark:bg-white/15" aria-hidden="true" />
          <span>{standing.singleTest.length} single-test</span>
          <span className="h-3 w-px bg-black/10 dark:bg-white/15" aria-hidden="true" />
          <span>{stats.tests} tests</span>
          <span className="h-3 w-px bg-black/10 dark:bg-white/15" aria-hidden="true" />
          <span>{lineup.superseded.length} superseded, ranked separately</span>
        </p>

        {/* The four numbers that matter */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { value: `${standing.rated}`, label: "models rated across tests" },
            { value: `${disagreementPoints}`, label: "percentile points between tests" },
            { value: `${standing.singleTest.length}`, label: "models on one test only" },
            { value: `${lineup.superseded.length}`, label: "superseded, not ranked here" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="tile p-4"
            >
              <div className="text-heading font-display font-semibold tracking-tight text-fg-strong tabular-nums">
                {stat.value}
              </div>
              <div className="mt-1 text-small font-sans text-fg-muted leading-snug">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Standing table */}
        <h2 className="text-heading font-display font-semibold tracking-tight text-fg-strong mb-1">
          Cross-test standing
        </h2>
        <p className="text-body font-sans text-fg-muted mb-4 max-w-2xl">
          The equal-weight mean of a model&rsquo;s per-test percentiles. The spread column is the disagreement behind that mean, in percentile
          points. Read them together: a high standing with a wide spread is a compromise between
          tests, not a result.
        </p>

        <div className="rule-t mb-3">
          {standing.rows.map((row) => {
            const lab = companies[row.model.companyId]
            return (
              <Link
                key={row.model.id}
                href={`/models/${row.model.id}`}
                className="group flex flex-wrap items-baseline gap-x-3 gap-y-1.5 py-3 rule-b"
              >
                <span className="text-small font-sans tabular-nums text-fg-muted w-7 shrink-0">
                  T{row.tier}
                </span>
                <span className="text-body sm:text-title font-medium tracking-tight text-fg-strong group-hover:text-accent-ink transition-colors">
                  {row.model.name}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1.5 text-small font-sans text-fg-muted">
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-sm shrink-0"
                    style={{ backgroundColor: lab?.accentColor ?? "#888" }}
                    aria-hidden="true"
                  />
                  {row.model.companyName}
                </span>
                <span className="inline-flex items-center rounded border border-black/10 dark:border-white/15 px-1.5 py-0.5 text-small font-sans text-fg-muted">
                  {row.cohorts} tests
                </span>
                <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-small font-sans ${AGREEMENT_CLASS[row.agreement]}`}>
                  {AGREEMENT_LABEL[row.agreement]}
                </span>
                {row.auditable && !row.stable && (
                  <span className="inline-flex items-center rounded border border-amber-600/40 px-1.5 py-0.5 text-small font-sans text-amber-700 dark:text-amber-400 dark:border-amber-400/30">
                    Test dependent
                  </span>
                )}
                {!row.auditable && (
                  <span className="inline-flex items-center rounded border border-black/10 dark:border-white/15 px-1.5 py-0.5 text-small font-sans text-fg-muted">
                    Not auditable
                  </span>
                )}
                <span className="ml-auto flex items-baseline gap-2 shrink-0">
                  <span className="text-small font-sans tabular-nums text-fg-muted">
                    spread {row.spread.toFixed(0)}
                  </span>
                  <span className="text-title font-sans font-semibold tabular-nums text-fg-strong">
                    {row.standing.toFixed(1)}
                  </span>
                </span>
              </Link>
            )
          })}
        </div>

        <p className="text-body font-sans text-fg-muted leading-6 max-w-2xl mb-12">
          Standing runs 1 to 99 and is an expected percentile, not a percentage correct. The
          disagreement figure of {disagreementPoints} points is the pooled spread between tests across
          the rated models. Rows are grouped into tiers: a row starts a new tier only when it sits more
          than that figure below the top of the tier above, so models in the same tier (T1, T2) are not
          ranked against each other. Rows inside a tier are listed by standing, which is not a claim that one is ahead. {contested} of {standing.rated} rated models have tests that disagree by more
          than {CONTESTED_SPREAD} points, and each is labelled contested rather than described as
          strong.{unstable > 0 ? ` ${unstable} rows move more than two places when a single test is removed and are labelled test dependent.` : ""}{unaudited > 0 ? ` ${unaudited} rows report exactly two tests; removing either leaves no standing, so the leave-one-test-out audit cannot run on them and they are labelled not auditable rather than stable.` : ""}
        </p>

        {/* Independent evidence: where laboratory figures and independent runs part ways */}
        <h2 className="text-heading font-display font-semibold tracking-tight text-fg-strong mb-1">
          Laboratory claims against independent runs
        </h2>
        <p className="text-body font-sans text-fg-muted mb-4 max-w-2xl">
          Nine of the ten tests in the standing were run by {INDEPENDENT_EVALUATOR.name} on the same
          tasks with the same harness for every model; the tenth is arena.ai&rsquo;s blind human-preference
          Elo, a second evaluator and a different kind of measurement. Where a laboratory also published its own Terminal-Bench
          figure, the gap is below. {lowerCount} of {gaps.length} independent results are lower than
          the laboratory figure, by {Math.abs(Math.round(meanGap * 10) / 10)} points on average.
          Rows marked &ldquo;version not stated&rdquo; are shown but are not like-for-like, because the
          laboratory did not say which version it ran.
        </p>
        <div className="mb-12 overflow-x-auto">
          <table className="w-full text-left text-body font-sans">
            <thead>
              <tr className="border-b border-black/10 text-small text-fg-muted dark:border-white/[0.08]">
                <th className="py-2 pr-4 font-medium">Model</th>
                <th className="py-2 pr-4 font-medium">Laboratory</th>
                <th className="py-2 pr-4 font-medium">Independent</th>
                <th className="py-2 font-medium">Gap</th>
              </tr>
            </thead>
            <tbody>
              {gaps.map((gap) => (
                <tr key={gap.model.id} className="rule-b">
                  <td className="py-2.5 pr-4">
                    <Link href={`/models/${gap.model.id}`} className="font-medium text-black hover:text-accent-ink dark:text-white">
                      {gap.model.name}
                    </Link>
                    {!gap.likeForLike && (
                      <span className="ml-2 text-small text-fg-muted">version not stated</span>
                    )}
                  </td>
                  <td className="py-2.5 pr-4 tabular-nums text-fg">{gap.lab.toFixed(1)}%</td>
                  <td className="py-2.5 pr-4 tabular-nums text-fg">{gap.independent.toFixed(1)}%</td>
                  <td className="py-2.5 tabular-nums font-medium text-fg-strong">
                    {gap.gap > 0 ? "+" : ""}
                    {gap.gap.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cost of a point */}
        <h2 className="text-heading font-display font-semibold tracking-tight text-fg-strong mb-1">
          What a point costs
        </h2>
        <p className="text-body font-sans text-fg-muted mb-4 max-w-2xl">
          The evaluator&rsquo;s Intelligence Index with the cost and time it took to run one task. A
          model is on the frontier when no other model scores higher for less money. Cost per task
          includes the reasoning tokens a model chooses to spend, so a cheap price per token does not
          always mean a cheap answer.
        </p>
        <div className="mb-12 overflow-x-auto">
          <table className="w-full text-left text-body font-sans">
            <thead>
              <tr className="border-b border-black/10 text-small text-fg-muted dark:border-white/[0.08]">
                <th className="py-2 pr-4 font-medium">Model</th>
                <th className="py-2 pr-4 font-medium">Index</th>
                <th className="py-2 pr-4 font-medium">Cost / task</th>
                <th className="py-2 pr-4 font-medium">Minutes / task</th>
                <th className="py-2 font-medium">Frontier</th>
              </tr>
            </thead>
            <tbody>
              {value.map((row) => (
                <tr key={row.model.id} className="rule-b">
                  <td className="py-2.5 pr-4">
                    <Link href={`/models/${row.model.id}`} className="font-medium text-black hover:text-accent-ink dark:text-white">
                      {row.model.name}
                    </Link>
                  </td>
                  <td className="py-2.5 pr-4 tabular-nums text-fg">{row.index}</td>
                  <td className="py-2.5 pr-4 tabular-nums text-fg">${row.costPerTask.toFixed(2)}</td>
                  <td className="py-2.5 pr-4 tabular-nums text-fg">
                    {row.minutesPerTask === null ? "-" : row.minutesPerTask.toFixed(1)}
                  </td>
                  <td className="py-2.5 text-small text-fg-muted">{row.onFrontier ? "Yes" : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {standing.singleTest.length > 0 && (
          <>
        {/* Single-test models */}
        <h2 className="text-heading font-display font-semibold tracking-tight text-fg-strong mb-1">
          Ranked on one test only
        </h2>
        <p className="text-body font-sans text-fg-muted mb-4 max-w-2xl">
          These models report a single benchmark. Their position on it is a real measurement and is
          shown as rank out of cohort size. They receive no cross-test standing, because one exam
          cannot corroborate itself and averaging it with nothing would be an invention.
        </p>
        <div className="overflow-x-auto -mx-1 px-1 mb-12">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-black/15 dark:border-white/[0.12]">
                <th
                  scope="col"
                  className="text-left py-2 pr-3 font-sans text-small font-medium uppercase tracking-wide text-fg-muted"
                >
                  Model
                </th>
                <th
                  scope="col"
                  className="text-left py-2 px-3 font-sans text-small font-medium uppercase tracking-wide text-fg-muted"
                >
                  Test
                </th>
                <th
                  scope="col"
                  className="text-right py-2 px-3 font-sans text-small font-medium uppercase tracking-wide text-fg-muted"
                >
                  Position
                </th>
                <th
                  scope="col"
                  className="text-right py-2 pl-3 font-sans text-small font-medium uppercase tracking-wide text-fg-muted"
                >
                  Score
                </th>
              </tr>
            </thead>
            <tbody>
              {standing.singleTest.map((row) => (
                <tr key={row.model.id} className="rule-b">
                  <th scope="row" className="text-left py-2.5 pr-3 font-normal">
                    <Link
                      href={`/models/${row.model.id}`}
                      className="text-body font-sans font-medium text-fg-strong hover:text-accent-ink transition-colors"
                    >
                      {row.model.name}
                    </Link>
                  </th>
                  <td className="py-2.5 px-3 text-body font-sans text-fg-muted whitespace-nowrap">
                    {row.test}
                  </td>
                  <td
                    className={`py-2.5 px-3 text-right text-body font-sans tabular-nums ${
                      row.rank === 1
                        ? "font-semibold text-fg-strong"
                        : "text-fg-muted"
                    }`}
                  >
                    {row.rank}/{row.of}
                  </td>
                  <td className="py-2.5 pl-3 text-right text-body font-sans tabular-nums text-fg-muted">
                    {row.score}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

          </>
        )}

        {/* Superseded */}
        <h2
          id="superseded"
          className="text-heading font-display font-semibold tracking-tight text-fg-strong mb-1 scroll-mt-24"
        >
          Superseded, kept for the record
        </h2>
        <p className="text-body font-sans text-fg-muted mb-4 max-w-2xl">
          These records were replaced in their role by a later release from the same laboratory. They
          keep their dates, sources and readings, and they are not ranked against the current lineup:
          a reader choosing a model today cannot pick them, so a position among current models would
          be a claim about a product nobody can buy. Superseded is not retired. No laboratory has
          withdrawn these.
        </p>
        <div className="rule-t mb-12">
          {lineup.superseded.map(({ model, successor }) => (
            <div
              key={model.id}
              className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2.5 rule-b"
            >
              <Link
                href={`/models/${model.id}`}
                className="text-body font-sans font-medium text-fg hover:text-accent-ink transition-colors"
              >
                {model.name}
              </Link>
              <span className="text-small font-sans tabular-nums text-fg-muted">
                {model.releaseDate}
              </span>
              <span className="text-small font-sans text-fg-muted">superseded by</span>
              {successor ? (
                <Link
                  href={`/models/${successor.id}`}
                  className="text-body font-sans text-accent-ink hover:underline underline-offset-2"
                >
                  {successor.name}
                </Link>
              ) : (
                <span className="text-body font-sans text-fg-muted">
                  a later release
                </span>
              )}
            </div>
          ))}
        </div>

        {/* The raw tables are long: collapsed by default so the answer is not buried. */}
        <details className="mb-12 rounded-xl border border-black/10 dark:border-white/[0.08] p-4 sm:p-5">
          <summary className="cursor-pointer list-none text-body font-sans font-medium text-fg-strong">
            Show the raw evidence: every test ranked on its own, and each model&rsquo;s position on every test
          </summary>
          <div className="mt-6">
        {/* Per-test tables */}
        <h2 className="text-heading font-display font-semibold tracking-tight text-fg-strong mb-1">
          Every test, ranked on its own
        </h2>
        <p className="text-body font-sans text-fg-muted mb-5 max-w-2xl">
          One test, one version, one table. This is the raw evidence the standing is computed from,
          and it is published so the standing can be checked rather than believed.
        </p>

        <div className="space-y-10 mb-12">
          {boards.map((board) => (
            <div key={board.id}>
              <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 mb-1">
                <h3 className="text-title font-display font-semibold tracking-tight text-fg-strong">
                  {board.test}
                </h3>
                <span className="text-small font-sans text-fg-muted">
                  {board.domain}
                </span>
                <span className="ml-auto text-small font-sans tabular-nums text-fg-muted">
                  {board.entries.length} models
                </span>
              </div>
              <p className="text-small font-sans text-fg-muted mb-2.5">
                {board.versionStated
                  ? "Every record in this cohort states the version it was measured on."
                  : "This benchmark is not versioned by the laboratories that report it."}
              </p>
              <div className="rule-t">
                {board.entries.map((entry) => {
                  const lab = companies[entry.model.companyId]
                  return (
                    <Link
                      key={entry.model.id}
                      href={`/models/${entry.model.id}`}
                      className="group flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 rule-b"
                    >
                      <span className="text-small font-sans tabular-nums text-fg-muted w-5 shrink-0">
                        {entry.rank}
                      </span>
                      <span className="text-body sm:text-title font-medium tracking-tight text-fg-strong group-hover:text-accent-ink transition-colors">
                        {entry.model.name}
                      </span>
                      <span className="hidden sm:inline-flex items-center gap-1.5 text-small font-sans text-fg-muted">
                        <span
                          className="inline-block w-1.5 h-1.5 rounded-sm shrink-0"
                          style={{ backgroundColor: lab?.accentColor ?? "#888" }}
                          aria-hidden="true"
                        />
                        {entry.model.companyName}
                      </span>
                      <span className="ml-auto text-title font-sans font-semibold tabular-nums text-fg-strong shrink-0">
                        {entry.reading.score}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Cross-test matrix */}
        {multi.length > 0 && (
          <>
            <h2 className="text-heading font-display font-semibold tracking-tight text-fg-strong mb-1">
              Position on each test
            </h2>
            <p className="text-body font-sans text-fg-muted mb-4 max-w-2xl">
              The evidence behind every standing, written as rank out of cohort size. A model that is
              strong everywhere looks different from one that leads a single exam, and this is where
              that difference is visible.
            </p>
            <div className="overflow-x-auto -mx-1 px-1 mb-12">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-black/15 dark:border-white/[0.12]">
                    <th
                      scope="col"
                      className="text-left py-2 pr-3 font-sans text-small font-medium uppercase tracking-wide text-fg-muted"
                    >
                      Model
                    </th>
                    {boards.map((board) => (
                      <th
                        key={board.id}
                        scope="col"
                        className="text-right py-2 pl-3 font-sans text-small font-medium text-fg-muted whitespace-nowrap"
                      >
                        {board.test}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {multi.map(({ model, positions }) => (
                    <tr key={model.id} className="rule-b">
                      <th scope="row" className="text-left py-2.5 pr-3 font-normal">
                        <Link
                          href={`/models/${model.id}`}
                          className="text-body font-sans font-medium text-fg-strong hover:text-accent-ink transition-colors"
                        >
                          {model.name}
                        </Link>
                      </th>
                      {boards.map((board) => {
                        const position = positions.find((candidate) => candidate.test === board.test)
                        return (
                          <td
                            key={board.id}
                            className={`py-2.5 pl-3 text-right text-body font-sans tabular-nums ${
                              position
                                ? position.rank === 1
                                  ? "font-semibold text-fg-strong"
                                  : "text-fg-muted"
                                : "text-fg-muted"
                            }`}
                          >
                            {position ? `${position.rank}/${position.of}` : "·"}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <p className="text-body font-sans text-fg-muted leading-6 max-w-2xl mb-12">
          {lineup.current.length - standing.ranked} of {lineup.current.length} current models have no independent
          result yet, because {INDEPENDENT_EVALUATOR.name} has not published one. Their laboratory-reported
          figures stay on each model page and are never mixed into this standing.
          {" "}
          <Link href="/trust" className="text-accent-ink hover:underline underline-offset-2">
            Scope and limits
          </Link>
          .
        </p>

          </div>
        </details>

        {/* Rules */}
        <h2 className="text-heading font-display font-semibold tracking-tight text-fg-strong mb-4">
          How the numbers are made
        </h2>
        <div className="rule-t mb-12">
          <details className="group rule-b">
            <summary className={summaryClass}>
              <span className="text-body font-sans font-medium text-fg-strong">
                Per-test rank: cohort, version gate, ties
              </span>
              <ChevronDown size={15} className={chevronClass} aria-hidden="true" />
            </summary>
            <ol className="pb-5 space-y-4">
              {[
                {
                  n: "1",
                  title: "Cohort",
                  body: `Readings are grouped by benchmark and normalised test identity. A cohort is the set of models whose scores came from the same test at the same version. Cohorts under ${MIN_COHORT_SIZE} members are discarded, because a rank among three values is noise dressed as a result.`,
                },
                {
                  n: "2",
                  title: "Version gate",
                  body: "Terminal-Bench and SWE-bench exist in several versions. A reading that states no version cannot join a cohort, because the cohort would then be an assumption about which exam was taken. Those readings are reported as unranked instead of pooled.",
                },
                {
                  n: "3",
                  title: "Rank",
                  body: "Inside a cohort, models are ordered by score, with ties sharing the best position they would occupy. Rank, cohort size and the published score are shown together, always.",
                },
              ].map((step) => (
                <li key={step.n} className="flex gap-3">
                  <span className="text-small font-sans tabular-nums text-fg-muted pt-1">
                    {step.n}
                  </span>
                  <div>
                    <h3 className="text-body font-sans font-medium text-fg-strong mb-1">
                      {step.title}
                    </h3>
                    <p className="text-body font-sans text-fg-muted leading-6">
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </details>

          <details className="group rule-b">
            <summary className={summaryClass}>
              <span className="text-body font-sans font-medium text-fg-strong">
                Cross-test standing: equate, average, refuse, audit
              </span>
              <ChevronDown size={15} className={chevronClass} aria-hidden="true" />
            </summary>
            <ol className="pb-5 space-y-4">
              {[
                {
                  n: "1",
                  title: "Equate",
                  body: "A score becomes its percentile inside its own cohort. A percentile is scale free, so a hard exam and an easy exam contribute on the same footing and one outlier cannot move a cohort's scale. This is the whole of the difficulty correction: a two-way difficulty fit on top of a rank transform is unidentified, because the rank transform has already absorbed it.",
                },
                {
                  n: "2",
                  title: "Average",
                  body: "Every test counts equally. Weighting a test by the spread of its raw scores would bring the raw scale back into a number built to remove it, and one outlier could set that weight. The spread of each test is published beside it instead.",
                },
                {
                  n: "3",
                  title: "Refuse",
                  body: `A standing needs readings from at least ${MIN_TESTS_FOR_STANDING} cohorts. One test is a position on that test, not a cross-test claim, so it is published as a position and no standing is invented for it.`,
                },
                {
                  n: "4",
                  title: "Publish the disagreement",
                  body: `The spread between a model's best and worst percentile is printed next to its standing. Up to ${CORROBORATED_SPREAD} points the tests agree, up to ${CONTESTED_SPREAD} they partly agree, beyond that they disagree and the row is labelled contested.`,
                },
                {
                  n: "5",
                  title: "Audit",
                  body: "The whole ordering is recomputed with each cohort removed in turn. A model that moves more than two places when one test is dropped is labelled test dependent, which is the shape a gamed benchmark takes.",
                },
                {
                  n: "6",
                  title: "Check the link",
                  body: "Each cohort records how many of its models also report another test. A cohort linked to the rest of the evidence by a single model cannot fix its own level, and every row resting on it is marked.",
                },
              ].map((step) => (
                <li key={step.n} className="flex gap-3">
                  <span className="text-small font-sans tabular-nums text-fg-muted pt-1">
                    {step.n}
                  </span>
                  <div>
                    <h3 className="text-body font-sans font-medium text-fg-strong mb-1">
                      {step.title}
                    </h3>
                    <p className="text-body font-sans text-fg-muted leading-6">
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </details>

          <details className="group rule-b">
            <summary className={summaryClass}>
              <span className="text-body font-sans font-medium text-fg-strong">
                What the standing cannot do
              </span>
              <ChevronDown size={15} className={chevronClass} aria-hidden="true" />
            </summary>
            <ul className="pb-5 space-y-1.5">
              {[
                "It cannot order two models whose gap is smaller than the disagreement between tests.",
                "It cannot rate a model that published one exam, and it does not try.",
                "It cannot correct for laboratories testing on their own scaffolds with their own retry budgets.",
                "It cannot tell which exam you should trust for your workload. That is a question about your prompts.",
                "It cannot reproduce a single score. Every number is laboratory-published.",
              ].map((line) => (
                <li key={line} className="text-body font-sans text-fg-muted leading-6">
                  {line}
                </li>
              ))}
            </ul>
          </details>

          <details className="group rule-b">
            <summary className={summaryClass}>
              <span className="text-body font-sans font-medium text-fg-strong">
                Cohort audit: which tests link to which
              </span>
              <ChevronDown size={15} className={chevronClass} aria-hidden="true" />
            </summary>
            <div className="pb-5">
              <div className="overflow-x-auto -mx-1 px-1">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="rule-b">
                      <th
                        scope="col"
                        className="text-left py-2 pr-3 font-sans text-small font-medium text-fg-muted"
                      >
                        Cohort
                      </th>
                      <th
                        scope="col"
                        className="text-right py-2 px-3 font-sans text-small font-medium text-fg-muted"
                      >
                        Models
                      </th>
                      <th
                        scope="col"
                        className="text-right py-2 px-3 font-sans text-small font-medium text-fg-muted"
                      >
                        Spread
                      </th>
                      <th
                        scope="col"
                        className="text-right py-2 pl-3 font-sans text-small font-medium text-fg-muted"
                      >
                        Anchors
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {standing.cohorts.map((cohort) => (
                      <tr
                        key={cohort.id}
                        className="border-b border-black/5 dark:border-white/[0.05]"
                      >
                        <th scope="row" className="text-left py-2 pr-3 font-normal">
                          <span className="text-body font-sans text-fg">
                            {cohort.test}
                          </span>
                          {cohort.weaklyLinked && (
                            <span className="ml-2 inline-flex items-center rounded border border-amber-600/40 px-1.5 py-0.5 text-small font-sans text-amber-700 dark:text-amber-400 dark:border-amber-400/30">
                              Single anchor
                            </span>
                          )}
                        </th>
                        <td className="py-2 px-3 text-right text-body font-sans tabular-nums text-fg-muted">
                          {cohort.size}
                        </td>
                        <td className="py-2 px-3 text-right text-body font-sans tabular-nums text-fg-muted">
                          {cohort.spread.toFixed(1)}pp
                        </td>
                        <td className="py-2 pl-3 text-right text-body font-sans tabular-nums text-fg-muted">
                          {cohort.anchors}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-body font-sans text-fg-muted leading-6 max-w-2xl">
                An anchor is a model in this cohort that also reports another test, which is what ties
                the cohort&rsquo;s scale to the rest of the evidence. A cohort with one anchor cannot
                fix its own level, and every row resting on it is marked. This is published because a
                single-anchor link is the weakest point in any cross-test average.
              </p>
            </div>
          </details>
        </div>

        {/* FAQ */}
        <h2 className="text-heading font-display font-semibold tracking-tight text-fg-strong mb-4">
          Questions
        </h2>
        <div className="rule-t mb-12">
          {faq.map((item) => (
            <div key={item.q} className="py-4 rule-b">
              <h3 className="text-title font-medium tracking-tight text-fg-strong mb-1.5">
                {item.q}
              </h3>
              <p className="text-body font-sans text-fg-muted leading-6 max-w-2xl">
                {item.a}
              </p>
            </div>
          ))}
        </div>

        <p className="text-body font-sans text-fg-muted leading-6">
          Standing v{STANDING_VERSION}, rank rule v{LEADERBOARD_VERSION}, minimum cohort{" "}
          {MIN_COHORT_SIZE}, data revised {datasetRevision.revisedAt}. Recompute every table from{" "}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/api/v1/models" className="text-accent-ink hover:underline underline-offset-2">
            /api/v1/models
          </a>
          .
        </p>
      </section>
    </main>
  )
}
