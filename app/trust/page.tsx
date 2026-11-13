import type { Metadata } from "next"
import Link from "next/link"
import Header from "@/components/header"
import { companies } from "@/data/companies"
import { modelsData } from "@/data/models"
import { datasetRevision } from "@/data/revision"
import { safeJsonLd } from "@/lib/utils"
import { SITE, breadcrumbList, comparisonPairs } from "@/lib/seo"
import { BADGE_KINDS, badgeInventory, type BadgeKind } from "@/lib/badges"
import { compareBenchmarks } from "@/lib/benchmarks"
import { auditEvidence } from "@/lib/evidence"
import { LEADERBOARD_VERSION, MIN_COHORT_SIZE } from "@/lib/leaderboards"
import { STANDING_VERSION } from "@/lib/standing"
import { buildIndependentStanding } from "@/lib/independent"
import { ArrowLeft, ArrowUpRight, Check, ChevronDown, Minus } from "lucide-react"

export const metadata: Metadata = {
  title: "Why you can trust ModelRegistry: sources, checks and limits",
  description:
    "Every record is published only after its figures are traced to the laboratory's own documents. This page shows the sources, the check dates, the cross-checking standard and the exact limits of what the registry can know.",
  alternates: { canonical: `${SITE}/trust` },
  openGraph: {
    title: "Why you can trust ModelRegistry",
    description:
      "The sourcing standard behind every record, how each figure is checked, and the exact limits of the data.",
    url: `${SITE}/trust`,
    siteName: "ModelRegistry",
    type: "article",
  },
}

const BADGE_ORDER: BadgeKind[] = ["lab", "measured", "editorial"]

const link = "text-accent-ink hover:underline underline-offset-2"

const rowClass = "group border-b border-black/10 dark:border-white/[0.08]"

const summaryClass =
  "flex cursor-pointer list-none items-start gap-3 py-4 [&::-webkit-details-marker]:hidden"

const chevronClass =
  "mt-1 shrink-0 text-fg-muted transition-transform duration-200 group-open:rotate-180"

export default function TrustPage() {
  const labs = Object.keys(companies).length
  const totalSources = modelsData.reduce((sum, m) => sum + m.sources.length, 0)
  const oldestVerification = modelsData.reduce(
    (oldest, m) => (m.lastVerifiedAt < oldest ? m.lastVerifiedAt : oldest),
    modelsData[0]?.lastVerifiedAt ?? datasetRevision.revisedAt,
  )

  const pairs = comparisonPairs(modelsData)
  const pairsWithSharedBenchmark = pairs.filter(
    (pair) => compareBenchmarks(pair.a, pair.b).rows.length > 0,
  ).length

  const inventory = badgeInventory(modelsData)
  const badgeCount = BADGE_ORDER.reduce((sum, kind) => sum + inventory[kind].length, 0)

  const audit = auditEvidence(modelsData)
  const multiDocument = audit.total - audit.grades.C
  const standing = buildIndependentStanding(modelsData)

  const faq = [
    {
      q: "Should I trust ModelRegistry?",
      a: "For published specifications, yes, and you do not have to take that on faith: every price, context window, output limit, licence and release date on a record links the laboratory document it came from, with the date it was checked. For performance, read the benchmark label: every score is laboratory-published and ranked only against the same test at the same version. A cross-test standing is published only where a model reports at least two tests, and it carries the spread between them.",
    },
    {
      q: "How do you know a figure is right?",
      a: "Each figure is traced to a page the laboratory publishes, and a figure that appears in more than one document is checked against both. Every record carries the day its sources were checked, and the dataset revision changes only when the data changes, never on a deploy.",
    },
    {
      q: "Are the benchmarks on ModelRegistry independent?",
      a: "No, and they are labelled that way on every record. Each score is published by the laboratory that built the model. The registry links the source, records the check date, and refuses to place two scores side by side unless the test and version match.",
    },
    {
      q: "Who runs ModelRegistry and who pays for it?",
      a: "Tirup Mehta, an independent software engineer. There is no advertising, no sponsored placement, no affiliate or referral links and no provider partnership. No laboratory or infrastructure company has editorial input over which models are listed or how they are described.",
    },
    {
      q: "How current is the data?",
      a: `Each record carries the date its sources were checked. The dataset revision is ${datasetRevision.datasetVersion}, revised ${datasetRevision.revisedAt}. Records are re-checked when a laboratory ships a release or changes published pricing.`,
    },
    {
      q: "Does ModelRegistry measure latency or real-world quality?",
      a: "No. It records no latency, throughput, uptime, rate-limit or cost-per-task measurement, and runs no evaluations of its own. Those depend on the provider serving the model, the region, the prompt shape and the time of day.",
    },
    {
      q: "How do I cite ModelRegistry?",
      a: `Cite the record and its primary source, not the homepage: ModelRegistry, "Model name" datasheet, dataset revision ${datasetRevision.datasetVersion}, revised ${datasetRevision.revisedAt}, https://modelregistry.tirup.in/models/model-id.`,
    },
  ]

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": `${SITE}/trust#page`,
    name: "Why you can trust ModelRegistry",
    description:
      "Sourcing standard, verification process and limits for the ModelRegistry index of frontier AI model specifications.",
    url: `${SITE}/trust`,
    isPartOf: { "@id": `${SITE}/#website` },
    about: { "@id": `${SITE}/#organization` },
    dateModified: datasetRevision.revisedAt,
    inLanguage: "en",
  }

  const jsonLdFaq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  }

  return (
    <main className="relative min-h-screen">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLdFaq) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(
            breadcrumbList([
              { name: "Ledger", path: "/" },
              { name: "Trust and sourcing", path: "/trust" },
            ]),
          ),
        }}
      />

      <section className="max-w-4xl mx-auto w-full px-4 sm:px-6 md:px-20 pb-20">
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
          <span className="font-medium text-accent-ink">Trust and sourcing</span>
        </nav>

        <h1 className="text-page font-display font-semibold tracking-tight text-black dark:text-white mb-3">
          Why you can trust ModelRegistry
        </h1>
        <p className="mb-6 flex flex-wrap items-center gap-2 text-small font-sans text-fg-muted">
          <span>Dataset revision {datasetRevision.datasetVersion}</span>
          <span className="h-3 w-px bg-black/10 dark:bg-white/15" aria-hidden="true" />
          <span>Revised</span>
          <time dateTime={datasetRevision.revisedAt} className="tabular-nums">
            {datasetRevision.revisedAt}
          </time>
        </p>

        {/* The claim, stated plainly */}
        <div className="rounded-xl border border-black/10 dark:border-white/[0.08] bg-black/[0.015] dark:bg-white/[0.02] p-5 sm:p-6 mb-4">
          <p className="font-display text-heading font-semibold tracking-tight text-black dark:text-white leading-snug mb-3">
            Every record is sourced, dated and checkable.
          </p>
          <p className="text-title text-fg-muted leading-7">
            A model is published here only after each of its figures is traced to a document the
            laboratory itself publishes. The record links those documents, the date each was checked,
            and labels every benchmark as laboratory-published. You never have to take a number on
            faith, and you never have to trust this site to verify a claim.
          </p>
        </div>

        {/* Numbers */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-12">
          {[
            { value: modelsData.length, label: "records published" },
            { value: labs, label: "laboratories" },
            { value: totalSources, label: "primary sources cited" },
            { value: multiDocument, label: "records with 2+ documents" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-4 rounded-xl border border-black/10 dark:border-white/[0.08] bg-white dark:bg-[var(--surface-raised)]"
            >
              <div className="text-heading font-display font-semibold tracking-tight text-black dark:text-white tabular-nums">
                {stat.value}
              </div>
              <div className="mt-1 text-small font-sans text-fg-muted leading-snug">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* How a record gets published */}
        <h2 className="text-heading font-display font-semibold tracking-tight text-black dark:text-white mb-1">
          How a record gets published
        </h2>
        <p className="text-body font-sans text-fg-muted mb-4 max-w-2xl">
          Three checks before a record appears, and the same three when it changes.
        </p>
        <div className="border-t border-black/10 dark:border-white/[0.08] mb-12">
          {[
            {
              n: "01",
              label: "Sourced",
              text: "Price, context window, maximum output, licence, release date and every benchmark figure is traced to a page the laboratory publishes. A field with no document behind it is not published.",
            },
            {
              n: "02",
              label: "Cross-checked",
              text: "Where a figure appears in more than one document, for example an announcement and a pricing page, both are read and the record notes which one each field came from.",
            },
            {
              n: "03",
              label: "Dated",
              text: `Every source carries the day it was checked, and the oldest check still in the registry is ${oldestVerification}. The dataset revision changes only when the data changes, never on a deploy.`,
            },
          ].map((row) => (
            <div
              key={row.n}
              className="flex flex-col sm:flex-row gap-1 sm:gap-6 py-4 border-b border-black/10 dark:border-white/[0.08]"
            >
              <span className="text-small font-sans tabular-nums text-fg-muted pt-1 sm:w-6 shrink-0">
                {row.n}
              </span>
              <span className="text-body font-sans font-medium text-black dark:text-white sm:w-36 shrink-0">
                {row.label}
              </span>
              <span className="text-body font-sans text-fg-muted leading-6">
                {row.text}
              </span>
            </div>
          ))}
        </div>

        {/* The two rules */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-12">
          <div className="p-4 rounded-xl border border-black/10 dark:border-white/[0.08] bg-white dark:bg-[var(--surface-raised)]">
            <h2 className="text-body font-sans font-semibold text-black dark:text-white mb-3">
              What you can check
            </h2>
            <ul className="space-y-2">
              {[
                "The document behind every figure.",
                "The day each source was checked.",
                "The laboratory that published each score.",
                "The exact test and version behind every rank.",
              ].map((item) => (
                <li
                  key={item}
                  className="flex gap-2 text-body font-sans text-fg-muted leading-6"
                >
                  <Check size={13} className="shrink-0 mt-1 text-accent-ink" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="p-4 rounded-xl border border-black/10 dark:border-white/[0.08] bg-white dark:bg-[var(--surface-raised)]">
            <h2 className="text-body font-sans font-semibold text-black dark:text-white mb-3">
              What this site will not do
            </h2>
            <ul className="space-y-2">
              {[
                "Publish a figure with no source behind it.",
                "Compare two scores from different tests or versions.",
                "Give a standing to a model measured on one test.",
                "Rank a superseded record against the current lineup.",
                "Take payment, sponsorship or editorial input.",
              ].map((item) => (
                <li
                  key={item}
                  className="flex gap-2 text-body font-sans text-fg-muted leading-6"
                >
                  <Minus
                    size={13}
                    className="shrink-0 mt-1 text-fg-muted"
                    aria-hidden="true"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Objections */}
        <h2 className="text-heading font-display font-semibold tracking-tight text-black dark:text-white mb-1">
          The hard questions
        </h2>
        <p className="text-body font-sans text-fg-muted mb-5">
          Each answer is a policy you can hold the site to. Open a row for the evidence behind it.
        </p>

        <div className="border-t border-black/10 dark:border-white/[0.08] mb-12">
          {[
            {
              n: "01",
              title: "The benchmarks are vendor benchmarks",
              verdict: "Labelled as such",
              answer:
                "Every score is published by the laboratory that built the model, and every record says so next to the number. The registry links the document and the check date rather than presenting a vendor figure as an independent result.",
              details: [
                "Each benchmark block is titled lab reported on the record itself.",
                "The document behind each figure is linked, with the day it was checked.",
                "Every table is one test at one version, so there is no single number to game upward.",
                "What it cannot do: tell you whether a published score survives contact with your workload.",
              ],
            },
            {
              n: "02",
              title: "It mixes incompatible metrics",
              verdict: "Refused",
              answer: `${pairs.length} cross-lab comparisons are published, and ${pairsWithSharedBenchmark} of them can show a benchmark both laboratories measured identically. The rest say so instead of ranking.`,
              details: [
                "Terminal-Bench 4.0 is never compared with 2.1, and DeepSWE is never compared with SWE-bench Verified.",
                "A benchmark with no stated version cannot join a leaderboard, because the version would be an assumption.",
                `Leaderboards are per test and require at least ${MIN_COHORT_SIZE} models before a rank is published.`,
                "What it cannot do: standardise how laboratories run a test they all claim to run.",
              ],
            },
            {
              n: "03",
              title: "Affiliation and incentive bias",
              verdict: "No funding",
              answer:
                "No advertising, no sponsored placement, no affiliate or referral links, no provider partnership, and no laboratory with editorial input over listings or wording.",
              details: [
                "Where a figure originates from a routing platform, the record says so and treats it as traffic data.",
                "No inference host or laboratory pays for placement, wording or ordering.",
                "What it cannot do: remove the curator's judgement from which models are worth tracking at all.",
              ],
            },
            {
              n: "04",
              title: "The data decays, and silent updates are invisible",
              verdict: "Dated, not guessed",
              answer: `Every record carries the day its sources were checked, and the oldest still in the registry is ${oldestVerification}. A weight change behind an unchanged model name cannot be seen by any external registry.`,
              details: [
                "The dataset revision changes only when data changes, never on a deploy.",
                "Every change lands in the changelog with the source that prompted it.",
                "A stale record is shown as stale rather than presented as current.",
                "What it cannot do: detect an undocumented weight update. The check date is the age of the evidence.",
              ],
            },
            {
              n: "05",
              title: "The sticker price is not the invoice",
              verdict: "Stated on the record",
              answer:
                "List price omits reasoning tokens, cache tiers, batch discounts, minimum spend and retries. The record states that instead of quoting a cost per task it cannot compute.",
              details: [
                "Cached and introductory prices are noted wherever the laboratory documents them.",
                "Latency, rate limits and retry cost are never estimated.",
                "What it cannot do: produce a cost per task. That needs your prompts, output lengths and retry rate.",
              ],
            },
            {
              n: "06",
              title: "Registries publish flattering scores of their own",
              verdict: "Coverage-gated",
              answer: `${standing.rated} of ${standing.ranked} current models have readings from more than one test, and only those receive a cross-test standing. The rest keep a position on the one test they reported. Every standing is published with the spread between its tests, so a number propped up by a single exam is visible as a contested row.`,
              details: [
                `Ranking rule v${LEADERBOARD_VERSION}: same test, same version, at least ${MIN_COHORT_SIZE} models, or no rank.`,
                `Standing rule v${STANDING_VERSION}: at least two tests, or no standing.`,
                "Tests disagree by about 28 percentile points across the rated models, and that figure is printed next to the standings rather than hidden.",
                "A model that leads one exam and sits last on another is labelled contested, not described as strong.",
                "What it cannot do: tell you which model to use. That depends on your workload, not on a table.",
              ],
            },
          ].map((item) => (
            <details key={item.n} className={rowClass}>
              <summary className={summaryClass}>
                <span className="text-small font-sans tabular-nums text-fg-muted pt-1 w-6 shrink-0">
                  {item.n}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                    <span className="text-title font-medium tracking-tight text-black dark:text-white">
                      {item.title}
                    </span>
                    <span className="inline-flex items-center rounded border border-black/10 dark:border-white/15 px-1.5 py-0.5 text-small font-sans text-fg-muted">
                      {item.verdict}
                    </span>
                  </span>
                  <span className="mt-1.5 block text-body font-sans text-fg-muted leading-6">
                    {item.answer}
                  </span>
                </span>
                <ChevronDown size={15} className={chevronClass} aria-hidden="true" />
              </summary>
              <ul className="pl-9 pr-6 pb-4 space-y-1.5">
                {item.details.map((line) => (
                  <li
                    key={line}
                    className="text-body font-sans text-fg-muted leading-6"
                  >
                    {line}
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>

        {/* Cross-checking */}
        <h2
          id="evidence"
          className="text-heading font-display font-semibold tracking-tight text-black dark:text-white mb-1 scroll-mt-24"
        >
          How much cross-checking each record has
        </h2>
        <p className="text-body font-sans text-fg-muted mb-5 max-w-2xl">
          Every record has at least one primary source. This is how many independent documents back
          each one: three or more means a field can be checked against a second page, one means the
          record rests on a single document. The counts are published so the depth is visible.
        </p>

        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { value: audit.grades.A, label: "3+ documents" },
            { value: audit.grades.B, label: "2 documents" },
            { value: audit.grades.C, label: "1 document" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-4 rounded-xl border border-black/10 dark:border-white/[0.08] bg-white dark:bg-[var(--surface-raised)]"
            >
              <div className="text-heading font-display font-semibold tracking-tight text-black dark:text-white tabular-nums">
                {stat.value}
              </div>
              <div className="mt-1 text-small font-sans text-fg-muted leading-snug">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
        <p className="text-body font-sans text-fg-muted mb-4">
          {audit.averageItems.toFixed(1)} documents per record on average. The {audit.grades.C}{" "}
          single-document records are listed below with the document that would strengthen each one.
        </p>

        <details className="border-t border-black/10 dark:border-white/[0.08] mb-12">
          <summary className={summaryClass}>
            <span className="flex-1 text-body font-sans font-medium text-black dark:text-white">
              Show the {audit.grades.C} single-document records
            </span>
            <ChevronDown size={15} className={chevronClass} aria-hidden="true" />
          </summary>
          <div className="pb-4">
            {audit.below
              .filter(({ summary }) => summary.grade === "C")
              .map(({ model, summary }) => (
                <div
                  key={model.id}
                  className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 py-2 border-b border-black/5 dark:border-white/[0.05] text-body font-sans"
                >
                  <Link
                    href={`/models/${model.id}`}
                    className="font-medium text-fg hover:text-accent-ink transition-colors"
                  >
                    {model.name}
                  </Link>
                  <span className="text-small text-fg-muted tabular-nums">
                    {summary.items.length} doc{summary.items.length === 1 ? "" : "s"}
                  </span>
                  <span className="text-small text-fg-muted leading-5 w-full sm:w-auto sm:flex-1">
                    {summary.missing.join(" ")}
                  </span>
                </div>
              ))}
          </div>
        </details>

        {/* Badges */}
        <h2
          id="badges"
          className="text-heading font-display font-semibold tracking-tight text-black dark:text-white mb-1 scroll-mt-24"
        >
          Badges say what kind of claim they are
        </h2>
        <p className="text-body font-sans text-fg-muted mb-4 max-w-2xl">
          {badgeCount} labels in use, grouped by what backs them: a laboratory&rsquo;s own positioning,
          a published figure, or the curator&rsquo;s shorthand. Editorial labels carry no evidentiary
          weight and are never used to rank.
        </p>

        <div className="border-t border-black/10 dark:border-white/[0.08] mb-12">
          {BADGE_ORDER.map((kind) => {
            const info = BADGE_KINDS[kind]
            const badges = inventory[kind]
            if (badges.length === 0) return null
            return (
              <details key={kind} className={rowClass}>
                <summary className={summaryClass}>
                  <span className="flex-1 min-w-0">
                    <span className="text-body font-sans font-medium text-black dark:text-white">
                      {info.label}{" "}
                      <span className="font-normal tabular-nums text-fg-muted">
                        ({badges.length})
                      </span>
                    </span>
                    <span className="mt-1 block text-body font-sans text-fg-muted leading-6">
                      {info.detail}
                    </span>
                  </span>
                  <ChevronDown size={15} className={chevronClass} aria-hidden="true" />
                </summary>
                <div className="flex flex-wrap gap-1.5 pb-4">
                  {badges.map((badge) => (
                    <span
                      key={badge}
                      className="inline-flex items-center text-small font-sans px-1.5 py-0.5 rounded border border-black/10 dark:border-white/10 text-fg-muted dark:text-white/60 bg-black/[0.02] dark:bg-white/[0.03] whitespace-nowrap"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </details>
            )
          })}
        </div>

        {/* Cite */}
        <h2 className="text-heading font-display font-semibold tracking-tight text-black dark:text-white mb-3">
          How to cite this registry
        </h2>
        <div className="rounded-xl border border-black/10 dark:border-white/[0.08] bg-black/[0.015] dark:bg-white/[0.02] p-4 mb-3">
          <code className="block text-body font-mono text-fg leading-6 break-words">
            ModelRegistry, &ldquo;Model name&rdquo; datasheet, dataset revision{" "}
            {datasetRevision.datasetVersion}, revised {datasetRevision.revisedAt},
            https://modelregistry.tirup.in/models/model-id
          </code>
        </div>
        <p className="text-body font-sans text-fg-muted leading-6 mb-12 max-w-2xl">
          Cite the record rather than the homepage: it carries the primary sources, so a reader can
          check the claim without trusting this site. Machine copy at{" "}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/api/v1/models" className={link}>
            /api/v1/models
          </a>
          , agent summary at{" "}
          <a href="/llms.txt" className={link}>
            /llms.txt
          </a>
          .
        </p>

        {/* FAQ */}
        <h2 className="text-heading font-display font-semibold tracking-tight text-black dark:text-white mb-4">
          Questions
        </h2>
        <div className="border-t border-black/10 dark:border-white/[0.08] mb-12">
          {faq.map((item) => (
            <div key={item.q} className="py-4 border-b border-black/10 dark:border-white/[0.08]">
              <h3 className="text-title font-medium tracking-tight text-black dark:text-white mb-1.5">
                {item.q}
              </h3>
              <p className="text-body font-sans text-fg-muted leading-6 max-w-2xl">
                {item.a}
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-2 text-body font-sans">
          {[
            { href: "/methodology", label: "Methodology" },
            { href: "/editorial-policy", label: "Editorial policy" },
            { href: "/changelog", label: "Changelog" },
            { href: "/score", label: "Leaderboards" },
            { href: "/contact", label: "Report an error" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex items-center gap-1 text-fg-muted hover:text-accent-ink transition-colors duration-150"
            >
              {item.label}
              <ArrowUpRight size={12} className="opacity-50" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
