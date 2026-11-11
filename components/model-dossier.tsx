import Link from "next/link"
import { companies } from "@/data/companies"
import { modelsData, type ModelItem } from "@/data/models"
import { datasetRevision } from "@/data/revision"
import { badgeInfo } from "@/lib/badges"
import { buildLeaderboards, excludedReadings, positionsFor } from "@/lib/leaderboards"
import { AGREEMENT_LABEL, standingFor } from "@/lib/standing"
import {
  INDEPENDENT_EVALUATOR,
  buildIndependentBoards,
  buildIndependentStanding,
  independentFor,
  independentPositionsFor,
} from "@/lib/independent"
import { currentSuccessor } from "@/lib/currency"
import { EVIDENCE_KIND_LABEL, evidenceSummary, gradeLabel } from "@/lib/evidence"
import { SITE, compareHref, comparisonPairs, faqPage } from "@/lib/seo"
import { formatDate, safeJsonLd } from "@/lib/utils"
import { ArrowUpRight, Check, ExternalLink, ShieldAlert } from "lucide-react"

/**
 * Server-rendered dossier sections.
 *
 * These are passed into the client datasheet view as children, so the copy
 * ships in the initial HTML and costs no client JavaScript. That matters for
 * both Core Web Vitals and for answer engines: a claim that only appears after
 * hydration is a claim a crawler may never read.
 */

const VERIFICATION_COPY: Record<string, string> = {
  verified: "Every displayed field is traced to a primary source.",
  partially_verified:
    "Some fields rest on a single secondary mention; nothing displayed is contradicted.",
  unverified: "Figures are tracked but not yet confirmed against a primary document.",
  retired: "Superseded. Kept for history and linked to its replacement.",
}

/** A source check older than this, at the time of the latest revision, is shown as stale. */
export const STALE_AFTER_DAYS = 30

function daysSince(iso: string): number {
  const then = new Date(`${iso}T00:00:00Z`).getTime()
  if (Number.isNaN(then)) return 0
  // Measured against the dataset revision date, not the wall clock: a static page
  // must say the same thing every time it is rendered.
  const revised = new Date(`${datasetRevision.revisedAt}T00:00:00Z`).getTime()
  return Math.max(0, Math.floor((revised - then) / 86_400_000))
}

export function ModelProvenance({ model }: { model: ModelItem }) {
  const badge = badgeInfo(model.statusBadge)
  const age = daysSince(model.lastVerifiedAt)
  const stale = age > STALE_AFTER_DAYS
  const citation = `ModelRegistry, "${model.name}" datasheet, dataset revision ${datasetRevision.datasetVersion}, revised ${datasetRevision.revisedAt}, ${SITE}/models/${model.id}`

  return (
    <section aria-labelledby="provenance-heading" className="mb-6 sm:mb-8">
      <h2
        id="provenance-heading"
        className="text-xs font-sans font-medium text-black/60 dark:text-zinc-400 leading-relaxed mb-3"
      >
        Data provenance
      </h2>
      <div className="rounded-xl border border-black/10 dark:border-white/[0.08] bg-black/[0.015] dark:bg-white/[0.02] p-4">
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3 mb-3.5">
          <div>
            <dt className="text-[11px] font-sans text-black/40 dark:text-zinc-500">Verification</dt>
            <dd className="mt-0.5 text-xs font-sans font-medium text-black dark:text-white">
              {model.verificationStatus.replace("_", " ")}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-sans text-black/40 dark:text-zinc-500">Sources cited</dt>
            <dd className="mt-0.5 text-xs font-sans font-medium text-black dark:text-white tabular-nums">
              {model.sources.length}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-sans text-black/40 dark:text-zinc-500">Last checked</dt>
            <dd className="mt-0.5 text-xs font-sans font-medium text-black dark:text-white tabular-nums">
              <time dateTime={model.lastVerifiedAt}>{model.lastVerifiedAt}</time>
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-sans text-black/40 dark:text-zinc-500">Released</dt>
            <dd className="mt-0.5 text-xs font-sans font-medium text-black dark:text-white tabular-nums">
              <time dateTime={model.releaseDate}>{formatDate(model.releaseDate)}</time>
            </dd>
          </div>
        </dl>

        <p className="text-[11px] font-sans text-black/50 dark:text-zinc-500 leading-relaxed border-t border-black/5 dark:border-white/[0.06] pt-3">
          {VERIFICATION_COPY[model.verificationStatus] ?? ""}{" "}
          {stale && (
            <span className="inline-flex items-start gap-1 text-amber-700 dark:text-amber-500">
              <ShieldAlert size={11} className="shrink-0 mt-0.5" aria-hidden="true" />
              <span>The sources were last checked {age} days before the latest dataset revision. Prices and benchmark figures may have changed since: confirm on the laboratory page before relying on them.</span>
            </span>
          )}{" "}
          <Link href="/trust" className="text-accent-ink hover:underline underline-offset-2">
            What verification does and does not mean
          </Link>
          .
        </p>

        <p className="text-[11px] font-sans text-black/50 dark:text-zinc-500 leading-relaxed mt-2.5">
          Badge <span className="font-medium text-black/70 dark:text-zinc-300">{model.statusBadge}</span> is a{" "}
          <Link href="/trust#badges" className="text-accent-ink hover:underline underline-offset-2">
            {badge.label.toLowerCase()}
          </Link>
          . {badge.basis}
        </p>

        <div className="mt-3.5 border-t border-black/5 dark:border-white/[0.06] pt-3">
          <p className="text-[11px] font-sans text-black/40 dark:text-zinc-500 mb-1">Cite this record</p>
          <code className="block text-[11px] font-mono text-black/65 dark:text-zinc-400 leading-relaxed break-words">
            {citation}
          </code>
        </div>
      </div>
    </section>
  )
}

export function ModelFaq({ model }: { model: ModelItem }) {
  const priced = !model.pricingUnit
  const priceAnswer = priced
    ? `${model.name} lists at $${model.pricing.input.toFixed(2)} per 1M input tokens and $${model.pricing.output.toFixed(2)} per 1M output tokens, according to the price published by ${model.companyName}. Cached, batch and committed-throughput tiers are billed differently and are not included in that figure.`
    : `${model.name} is billed ${model.pricingUnit}, not per token, so it has no per-1M-token list price in this registry.`

  const faq = [
    { q: `How much does ${model.name} cost?`, a: priceAnswer },
    {
      q: `What is the context window of ${model.name}?`,
      a:
        model.contextWindowTokens > 0
          ? `${model.name} accepts ${model.contextWindow} of context, with a maximum output of ${model.maxOutputTokens}. Both figures are as published by ${model.companyName}.`
          : `${model.companyName} has not published a numeric context window for ${model.name}; the record states "${model.contextWindow}" rather than estimating one.`,
    },
    {
      q: `Is ${model.name} open source or open weights?`,
      a: model.openWeights
        ? `Yes. ${model.name} publishes open weights under ${model.license}, so the weights can be downloaded and self-hosted. Open weights are not the same as an OSI-approved open-source licence, and the licence terms govern commercial use.`
        : `No. ${model.name} is a closed model available through ${model.companyName}'s API under ${model.license}; the weights are not published.`,
    },
    {
      q: `When was ${model.name} released?`,
      a: `${model.name} was released on ${formatDate(model.releaseDate)} (${model.releaseDate}) and the record's sources were last checked on ${model.lastVerifiedAt}.`,
    },
  ]

  return (
    <section aria-labelledby="model-faq-heading" className="mb-6 sm:mb-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(faqPage(faq)) }} />
      <h2
        id="model-faq-heading"
        className="text-xs font-sans font-medium text-black/60 dark:text-zinc-400 leading-relaxed mb-3"
      >
        Common questions
      </h2>
      <div id="model-faq" className="border-t border-black/10 dark:border-white/[0.08]">
        {faq.map((item) => (
          <div key={item.q} className="py-3.5 border-b border-black/10 dark:border-white/[0.08]">
            <h3 className="text-[13px] font-medium tracking-tight text-black dark:text-white mb-1">
              {item.q}
            </h3>
            <p className="text-xs font-sans text-black/60 dark:text-zinc-400 leading-relaxed">
              {item.a}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

const LAB_ORDER = Object.keys(companies)
function labRank(id: string): number {
  const index = LAB_ORDER.indexOf(id)
  return index === -1 ? LAB_ORDER.length : index
}

export function ModelComparisons({ model }: { model: ModelItem }) {
  const direct = comparisonPairs(modelsData).filter(
    (pair) => pair.a.id === model.id || pair.b.id === model.id,
  )

  const rivals = direct
    .map((pair) => ({ opponent: pair.a.id === model.id ? pair.b : pair.a, pair }))
    .sort((x, y) => {
      const flagshipDelta = Number(y.opponent.isCompanyFlagship) - Number(x.opponent.isCompanyFlagship)
      if (flagshipDelta !== 0) return flagshipDelta
      // Rivals a reader would actually weigh first: the registry lists labs in
      // order of how widely their models are used, so earlier labs come first.
      // Sorting by release date alone surfaced the newest obscure model instead
      // of the model people are comparing against.
      const labDelta = labRank(x.opponent.companyId) - labRank(y.opponent.companyId)
      if (labDelta !== 0) return labDelta
      return y.opponent.releaseDate.localeCompare(x.opponent.releaseDate)
    })
    .slice(0, 6)

  if (rivals.length === 0) return null

  return (
    <section aria-labelledby="model-compare-heading" className="mb-6 sm:mb-8">
      <h2
        id="model-compare-heading"
        className="text-xs font-sans font-medium text-black/60 dark:text-zinc-400 leading-relaxed mb-3"
      >
        Head-to-head comparisons
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 border-t border-black/10 dark:border-white/[0.08]">
        {rivals.map(({ opponent, pair }) => (
          <Link
            key={opponent.id}
            href={compareHref(pair.a, pair.b)}
            className="group flex items-baseline gap-2 py-2.5 border-b border-black/10 dark:border-white/[0.08] text-xs font-sans"
          >
            <span className="text-black/70 dark:text-zinc-300 group-hover:text-accent-ink transition-colors truncate">
              {model.name} vs {opponent.name}
            </span>
            <ArrowUpRight
              size={11}
              className="ml-auto shrink-0 opacity-40 group-hover:opacity-100 transition-opacity"
              aria-hidden="true"
            />
          </Link>
        ))}
      </div>
      <Link
        href="/compare"
        className="mt-3 inline-flex items-center gap-1 text-[11px] font-sans text-black/50 dark:text-zinc-400 hover:text-accent-ink transition-colors duration-150"
      >
        <Check size={11} aria-hidden="true" />
        <span>All model comparisons</span>
      </Link>
    </section>
  )
}

// The dataset is imported directly: this module is rendered only from the
// server component in app/models/[id]/page.tsx and is never part of a client
// bundle.

export function ModelEvidence({ model }: { model: ModelItem }) {
  const summary = evidenceSummary(model)
  const grouped = new Map<string, typeof summary.items>()
  for (const item of summary.items) {
    const bucket = grouped.get(item.kind)
    if (bucket) bucket.push(item)
    else grouped.set(item.kind, [item])
  }

  const gradeTone =
    summary.grade === "A"
      ? "border-emerald-600/30 text-emerald-700 dark:text-emerald-500"
      : summary.grade === "B"
        ? "border-amber-600/30 text-amber-700 dark:text-amber-500"
        : "border-rose-600/30 text-rose-700 dark:text-rose-500"

  return (
    <section aria-labelledby="evidence-heading" className="mb-6 sm:mb-8">
      <div className="flex flex-wrap items-baseline gap-2 mb-3">
        <h2
          id="evidence-heading"
          className="text-xs font-sans font-medium text-black/60 dark:text-zinc-400 leading-relaxed"
        >
          Evidence
        </h2>
        <span className="text-[11px] font-sans text-black/40 dark:text-zinc-500 tabular-nums">
          {summary.items.length} document{summary.items.length === 1 ? "" : "s"} ·{" "}
          {summary.kinds.length} kind{summary.kinds.length === 1 ? "" : "s"} · {summary.citedCount} cited
        </span>
        <span
          className={`ml-auto inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-sans font-medium ${gradeTone}`}
        >
          Evidence grade {summary.grade}
        </span>
      </div>

      <div className="rounded-xl border border-black/10 dark:border-white/[0.08] bg-black/[0.015] dark:bg-white/[0.02] p-4">
        <p className="text-[11px] font-sans text-black/50 dark:text-zinc-500 leading-relaxed mb-3">
          {gradeLabel(summary.grade)}{" "}
          <Link href="/trust#evidence" className="text-accent-ink hover:underline underline-offset-2">
            How evidence is graded
          </Link>
          .
        </p>

        {summary.missing.length > 0 && (
          <ul className="mb-3 space-y-1">
            {summary.missing.map((gap) => (
              <li
                key={gap}
                className="flex gap-2 text-[11px] font-sans text-black/55 dark:text-zinc-500 leading-relaxed"
              >
                <ShieldAlert size={11} className="shrink-0 mt-0.5" aria-hidden="true" />
                <span>{gap}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="border-t border-black/5 dark:border-white/[0.06] pt-3 space-y-2.5">
          {[...grouped.entries()].map(([kind, items]) => (
            <div key={kind}>
              <h3 className="text-[11px] font-sans font-medium text-black/45 dark:text-zinc-500 mb-1">
                {EVIDENCE_KIND_LABEL[kind as keyof typeof EVIDENCE_KIND_LABEL] ?? kind}
              </h3>
              <ul className="space-y-1">
                {items.map((item) => (
                  <li key={item.url} className="text-[11px] font-sans leading-relaxed">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-baseline gap-1 text-black/65 dark:text-zinc-400 hover:text-accent-ink transition-colors duration-150 break-all"
                    >
                      <span>{item.title}</span>
                      <ExternalLink
                        size={10}
                        className="shrink-0 opacity-50 group-hover:opacity-100"
                        aria-hidden="true"
                      />
                    </a>
                    <span className="text-black/35 dark:text-zinc-600">
                      {" "}
                      · {item.publisher}
                      {item.publishedAt ? ` · ${item.publishedAt}` : ""}
                      {item.accessedAt ? ` · checked ${item.accessedAt}` : ""}
                      {item.cited ? "" : " · official link"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function ModelPositions({ model }: { model: ModelItem }) {
  if (model.supersededBy) {
    const successor = currentSuccessor(model, modelsData)
    return (
      <section aria-labelledby="score-heading" className="mb-6 sm:mb-8">
        <h2
          id="score-heading"
          className="text-xs font-sans font-medium text-black/60 dark:text-zinc-400 leading-relaxed mb-3"
        >
          Availability
        </h2>
        <div className="rounded-xl border border-black/10 dark:border-white/[0.08] bg-black/[0.015] dark:bg-white/[0.02] p-4">
          <p className="text-sm font-sans text-black/70 dark:text-zinc-300 leading-6">
            Superseded by{" "}
            {successor ? (
              <Link
                href={`/models/${successor.id}`}
                className="font-medium text-accent-ink hover:underline underline-offset-2"
              >
                {successor.name}
              </Link>
            ) : (
              "a later release from the same laboratory"
            )}
            .
          </p>
          <p className="mt-2 text-xs font-sans text-black/45 dark:text-zinc-500 leading-5 border-t border-black/5 dark:border-white/[0.06] pt-2.5">
            This record keeps its dates, sources and readings, and is not ranked against the current
            lineup: it is not something a reader can choose today. Superseded is not retired, and no
            laboratory has withdrawn it.{" "}
            <Link href="/score" className="text-accent-ink hover:underline underline-offset-2">
              Current standings
            </Link>
            .
          </p>
        </div>
      </section>
    )
  }

  const independentPositions = independentPositionsFor(model, buildIndependentBoards(modelsData))
  const independentRecord = independentFor(model.id)
  if ((independentPositions.length > 0 || (independentRecord?.extras?.length ?? 0) > 0) && independentRecord) {
    const rated = standingFor(model, buildIndependentStanding(modelsData))
    return (
      <section aria-labelledby="score-heading" className="mb-6 sm:mb-8">
        <h2
          id="score-heading"
          className="text-xs font-sans font-medium text-black/60 dark:text-zinc-400 leading-relaxed mb-3"
        >
          Independent results
        </h2>
        <div className="rounded-xl border border-black/10 dark:border-white/[0.08] bg-black/[0.015] dark:bg-white/[0.02] p-4">
          {rated && (
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 pb-3 mb-3 border-b border-black/5 dark:border-white/[0.06]">
              <span className="text-xs font-sans text-black/45 dark:text-zinc-500">Cross-test standing</span>
              <span className="text-lg font-display font-semibold tracking-tight text-black dark:text-white tabular-nums leading-none">
                {rated.standing.toFixed(1)}
              </span>
              <span className="text-xs font-sans text-black/45 dark:text-zinc-500">Tier {rated.tier}</span>
              <span className="text-xs font-sans tabular-nums text-black/45 dark:text-zinc-500">
                {rated.cohorts} tests, spread {rated.spread.toFixed(0)}
              </span>
              <span className="ml-auto text-xs font-sans text-black/45 dark:text-zinc-500">
                {AGREEMENT_LABEL[rated.agreement]}
              </span>
            </div>
          )}
          <div className="space-y-2">
            {independentPositions.map((position) => (
              <div key={position.test} className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                <span className="text-sm font-sans text-black/70 dark:text-zinc-300">{position.test}</span>
                <span className="hidden sm:inline text-xs font-sans text-black/35 dark:text-zinc-600">
                  {position.domain}
                </span>
                {position.tiedWithLeader && position.rank > 1 && (
                  <span className="text-[11px] font-sans text-black/45 dark:text-zinc-500">
                    not separable from the leader
                  </span>
                )}
                <span className="ml-auto text-sm font-sans tabular-nums text-black/70 dark:text-zinc-300">
                  <strong className="font-semibold text-black dark:text-white">{position.rank}</strong> of{" "}
                  {position.of}
                </span>
                <span className="text-xs font-sans tabular-nums text-black/45 dark:text-zinc-500 w-14 text-right shrink-0">
                  {position.score}
                </span>
              </div>
            ))}
          </div>
          {independentRecord.extras && independentRecord.extras.length > 0 && (
            <ul className="space-y-2 text-sm font-sans text-black/70 dark:text-zinc-300">
              {independentRecord.extras.map((extra) => (
                <li key={extra.label}>
                  <span className="font-medium text-black dark:text-white">{extra.label}:</span> {extra.value}
                  <span className="block text-xs text-black/45 dark:text-zinc-500">
                    {extra.note}{" "}
                    <a href={extra.sourceUrl} rel="noopener noreferrer" className="text-accent-ink hover:underline underline-offset-2">
                      Source
                    </a>
                  </span>
                </li>
              ))}
              <li className="text-xs text-black/45 dark:text-zinc-500">
                Too few registry models have this kind of result to rank them against each other, so no position is claimed.
              </li>
            </ul>
          )}
          {typeof independentRecord.costPerTask === "number" && (
            <p className="mt-3 text-xs font-sans text-black/55 dark:text-zinc-400 leading-5">
              Evaluator cost per task ${independentRecord.costPerTask.toFixed(2)}
              {typeof independentRecord.minutesPerTask === "number"
                ? `, ${independentRecord.minutesPerTask.toFixed(1)} minutes per task`
                : ""}
              .
            </p>
          )}
          <p className="mt-3 text-xs font-sans text-black/45 dark:text-zinc-500 leading-5 border-t border-black/5 dark:border-white/[0.06] pt-2.5">
            Run by {INDEPENDENT_EVALUATOR.name} as {independentRecord.evaluatedAs}: same tasks and harness
            for every model, read {INDEPENDENT_EVALUATOR.retrievedAt} from{" "}
            <a
              href={independentRecord.sourceUrl}
              rel="noopener noreferrer"
              className="text-accent-ink hover:underline underline-offset-2"
            >
              the evaluator&rsquo;s page
            </a>
            . Laboratory-reported figures are listed separately above and are not part of this ranking.{" "}
            <Link href="/score" className="text-accent-ink hover:underline underline-offset-2">
              How it is computed
            </Link>
            .
          </p>
        </div>
      </section>
    )
  }

  const boards = buildLeaderboards(modelsData, { currentOnly: true })
  const positions = positionsFor(model, boards)
  const standing = standingFor(model, buildIndependentStanding(modelsData))
  if (positions.length === 0) {
    const reasons = excludedReadings(modelsData, boards, { currentOnly: true }).filter(
      (item) => item.model.id === model.id,
    )
    return (
      <section aria-labelledby="score-heading" className="mb-6 sm:mb-8">
        <h2
          id="score-heading"
          className="text-xs font-sans font-medium text-black/60 dark:text-zinc-400 leading-relaxed mb-3"
        >
          Where it ranks
        </h2>
        <div className="rounded-xl border border-black/10 dark:border-white/[0.08] bg-black/[0.015] dark:bg-white/[0.02] p-4">
          <p className="text-sm font-sans text-black/70 dark:text-zinc-300 leading-6">
            Not ranked yet.{" "}
            {reasons.length === 0
              ? "No benchmark with a comparable test and version is recorded for this model, so any position would be invented."
              : "Its published scores cannot join a comparison table:"}
          </p>
          {reasons.length > 0 && (
            <ul className="mt-2 space-y-1.5 text-xs font-sans text-black/55 dark:text-zinc-400 leading-5">
              {reasons.map((item) => (
                <li key={`${item.test}-${item.raw}`}>
                  <span className="font-medium text-black/75 dark:text-zinc-300">
                    {item.test} {item.raw}
                  </span>
                  : {item.reason}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-xs font-sans text-black/45 dark:text-zinc-500 leading-5 border-t border-black/5 dark:border-white/[0.06] pt-2.5">
            A missing rank means the evidence is missing, not that the model is weak.{" "}
            <Link href="/best" className="text-accent-ink hover:underline underline-offset-2">
              Leaders by task
            </Link>
            .
          </p>
        </div>
      </section>
    )
  }

  return (
    <section aria-labelledby="score-heading" className="mb-6 sm:mb-8">
      <h2
        id="score-heading"
        className="text-xs font-sans font-medium text-black/60 dark:text-zinc-400 leading-relaxed mb-3"
      >
        Where it ranks
      </h2>
      <div className="rounded-xl border border-black/10 dark:border-white/[0.08] bg-black/[0.015] dark:bg-white/[0.02] p-4">
        {standing && (
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 pb-3 mb-3 border-b border-black/5 dark:border-white/[0.06]">
            <span className="text-xs font-sans text-black/45 dark:text-zinc-500">
              Cross-test standing
            </span>
            <span className="text-lg font-display font-semibold tracking-tight text-black dark:text-white tabular-nums leading-none">
              {standing.standing.toFixed(1)}
            </span>
            <span className="text-xs font-sans tabular-nums text-black/45 dark:text-zinc-500">
              {standing.cohorts} tests
            </span>
            <span className="text-xs font-sans tabular-nums text-black/45 dark:text-zinc-500">
              spread {standing.spread.toFixed(0)}
            </span>
            <span className="ml-auto text-xs font-sans text-black/45 dark:text-zinc-500">
              {AGREEMENT_LABEL[standing.agreement]}
            </span>
          </div>
        )}
        <div className="space-y-2">
          {positions.map((position) => (
            <div key={position.test} className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
              <span className="text-sm font-sans text-black/70 dark:text-zinc-300">
                {position.test}
              </span>
              <span className="text-xs font-sans text-black/35 dark:text-zinc-600">
                {position.domain}
              </span>
              <span className="ml-auto text-sm font-sans tabular-nums text-black/70 dark:text-zinc-300">
                <strong className="font-semibold text-black dark:text-white">
                  {position.rank}
                </strong>{" "}
                of {position.of}
              </span>
              <span className="text-xs font-sans tabular-nums text-black/45 dark:text-zinc-500 w-14 text-right shrink-0">
                {position.score}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs font-sans text-black/45 dark:text-zinc-500 leading-5 border-t border-black/5 dark:border-white/[0.06] pt-2.5">
          Ranked only against current models measured by the same test at the same version. The
          standing is the mean of the percentiles above, and its spread is the disagreement between
          them.{" "}
          <Link href="/score" className="text-accent-ink hover:underline underline-offset-2">
            How it is computed
          </Link>
          .
        </p>
      </div>
    </section>
  )
}

