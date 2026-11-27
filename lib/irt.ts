/**
 * Regularized 2-parameter IRT scoring, in TypeScript, with no dependencies.
 *
 * WHY A SEPARATE RULER
 * The published ModelRegistry Score is a frozen-calibration composite of one
 * evaluator's tests. This module is a different instrument: it estimates a
 * latent ability theta from the pattern of right and wrong answers across tests,
 * so a model is not credited for choosing easy tests and is not punished for
 * sitting out hard ones. The two are published side by side and never merged.
 * This module does not read or alter the published Score.
 *
 * THE MODEL
 *     p(correct | model m, test j) = sigmoid(a_j * (theta_m - b_j))
 * a_j is discrimination, b_j is difficulty. Fit on OBSERVED pairs only: a missing
 * evaluation contributes nothing, which is the whole point. Filling a missing
 * cell with zero (or with the mean) would punish a model for not taking a test.
 *
 * REGULARIZATION (MAP)
 *     theta_m ~ N(0, 1),  log(a_j) ~ N(0, 0.5^2),  b_j ~ N(0, 2^2)
 * Without these priors a sparse matrix drives slopes to infinity and ranks a
 * model on two lucky answers. The priors shrink instead, and the test suite
 * asserts that a two-easy-test model cannot beat a fifteen-hard-test model.
 *
 * HYGIENE
 * A cohort enters the fit only if it clears all four rules: at least 4 distinct
 * models, at least one evaluation inside the staleness window, not saturated at
 * the ceiling, and not a tier3 legacy test. Every rejected cohort is reported
 * with its reason, never silently dropped.
 *
 * DETERMINISM
 * No randomness, no clock: the caller passes `asOf` and the anchors. The same
 * inputs produce the same bytes, which the snapshot manifest depends on.
 */

export const IRT_VERSION = "1.0.0"

/** Fixed reference window for staleness, in days. */
export const STALE_AFTER_DAYS = 365
/** A cohort is saturated when this share of its models is at or above CEILING_CUT. */
export const SATURATION_SHARE = 0.25
export const CEILING_CUT = 0.95
/** Fewer distinct models than this and the cohort is displayed, never fitted. */
export const MIN_COHORT = 4
/** A model needs this many fitted observations before it is scored. */
export const MIN_OBSERVATIONS = 2
/** Weights by provenance tier. */
export const TIER_WEIGHT = { tier1_independent: 1, tier2_provider: 0.7, tier3_legacy: 0 } as const
/** A single evaluator may not carry more than this share of a domain's weight. */
export const EVALUATOR_CAP = 0.4
/** 90% interval. */
export const Z90 = 1.6448536269514722

export type IrtDomain = "agentic" | "coding" | "reasoning" | "knowledge" | "math" | "instruction_following"
export type IrtTier = keyof typeof TIER_WEIGHT

export interface IrtObservation {
  modelSlug: string
  benchmarkId: string
  domain: IrtDomain
  rawScore: number
  floorScore: number
  ceilingScore: number
  toolMode: "none" | "tools"
  sourceTier: IrtTier
  evaluatorName: string
  evaluatedAt: string
  sourceUrl: string
}

export type CohortStatus = "kept" | "insufficient_overlap" | "stale" | "saturated" | "legacy"

export interface IrtCohort {
  /** benchmarkId plus tool mode: a tool-assisted run and a bare run are different tests. */
  id: string
  benchmarkId: string
  domain: IrtDomain
  toolMode: "none" | "tools"
  models: number
  status: CohortStatus
  /** Share of the cohort at or above the ceiling cut, before any filtering. */
  ceilingShare: number
}

export interface IrtModelScore {
  slug: string
  /** Latent ability on the anchored scale. */
  theta: number
  /** 0 to 100 index: 50 + 15 * theta, clamped. */
  index: number
  se: number
  ci90: [number, number]
  /** Fitted observations behind the estimate. */
  observations: number
  domains: IrtDomain[]
  confidenceStatus: "Supported" | "Estimated"
  /** True when every fitted observation is tier2 or lower. */
  providerOnly: boolean
  /** Lowest price per blended 1M tokens among USD token-priced models, or null. */
  blendedCostUsd: number | null
  isParetoOptimal: boolean
  /** Share of the top model's blended cost saved, 0 to 1, or null when unpriced. */
  savingsVsTop: number | null
}

export interface IrtResult {
  version: string
  asOf: string
  scale: { mean: number; sd: number }
  anchors: Record<string, number>
  models: IrtModelScore[]
  cohorts: IrtCohort[]
  counts: {
    observations: number
    duplicatesRemoved: number
    fittedObservations: number
    cohorts: number
    keptCohorts: number
    scoredModels: number
  }
}

export interface IrtOptions {
  /** Dataset revision date: the reference for staleness. Never the clock. */
  asOf: string
  /** theta values pinned so a published score does not move when a model arrives. */
  anchors?: Record<string, number>
  /** USD per blended 1M tokens, for the Pareto frontier. null excludes the model. */
  blendedCostUsd?: Record<string, number | null>
}

const scaleIndex = (theta: number) => {
  const value = 50 + 15 * theta
  return Math.round(Math.min(100, Math.max(0, value)) * 10) / 10
}
const sigmoid = (z: number) => {
  if (z >= 0) return 1 / (1 + Math.exp(-z))
  const e = Math.exp(z)
  return e / (1 + e)
}
const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value))
const daysBetween = (from: string, to: string) =>
  (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000

const PRIOR = { theta: 1, logA: 0.5, b: 2 }

/** Lower is better provenance. Used only to choose between duplicate rows. */
const TIER_RANK: Record<IrtTier, number> = { tier1_independent: 0, tier2_provider: 1, tier3_legacy: 2 }

/**
 * One observation per (model, test, tool mode).
 *
 * A model can appear twice on the same cohort when an independent run and a
 * laboratory figure share an id. Fitting both would count the same evidence
 * twice and inflate the information behind the interval. The independent row
 * wins; on equal provenance the later reading wins; anything still tied is
 * broken by source URL so the result cannot depend on input order.
 */
export function dedupeObservations(observations: readonly IrtObservation[]): IrtObservation[] {
  const best = new Map<string, IrtObservation>()
  for (const observation of observations) {
    const key = `${observation.modelSlug}__${observation.benchmarkId}__${observation.toolMode}`
    const current = best.get(key)
    const better =
      !current ||
      TIER_RANK[observation.sourceTier] < TIER_RANK[current.sourceTier] ||
      (TIER_RANK[observation.sourceTier] === TIER_RANK[current.sourceTier] &&
        (observation.evaluatedAt > current.evaluatedAt ||
          (observation.evaluatedAt === current.evaluatedAt && observation.sourceUrl < current.sourceUrl)))
    if (better) best.set(key, observation)
  }
  return [...best.values()]
}

/**
 * Ranks by exact ability, ties broken by slug.
 *
 * Sorting on the rounded 0-100 index would let two models a thousandth of a
 * point apart swap places, and the index ties at one decimal often. The index is
 * presentation; theta is the estimate.
 */
export function orderByAbility<T extends { theta: number; slug: string }>(rows: readonly T[]): T[] {
  return [...rows].sort((a, b) => b.theta - a.theta || a.slug.localeCompare(b.slug))
}

/**
 * Runs the whole pipeline: hygiene, weighted MAP fit, intervals, frontier.
 * Pure: identical inputs produce identical output, in the same order.
 */
export function fitIrt(rawObservations: readonly IrtObservation[], options: IrtOptions): IrtResult {
  const asOf = options.asOf
  const anchors = options.anchors ?? {}
  const observations = dedupeObservations(rawObservations)
  const duplicatesRemoved = rawObservations.length - observations.length

  // ---- cohorts, keyed by test AND tool mode -----------------------------
  const cohorts = new Map<string, { obs: IrtObservation[]; models: Set<string> }>()
  for (const observation of observations) {
    const id = `${observation.benchmarkId}__${observation.toolMode}`
    const bucket = cohorts.get(id) ?? { obs: [], models: new Set<string>() }
    // A model listed twice on one test would be double-counted.
    if (!bucket.models.has(observation.modelSlug)) bucket.models.add(observation.modelSlug)
    bucket.obs.push(observation)
    cohorts.set(id, bucket)
  }

  const cohortReport: IrtCohort[] = []
  const kept = new Map<string, IrtObservation[]>()
  for (const [id, bucket] of [...cohorts.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const first = bucket.obs[0]
    const normalized = bucket.obs.map((observation) =>
      clamp(
        (observation.rawScore - observation.floorScore) / (observation.ceilingScore - observation.floorScore),
        0.005,
        0.995,
      ),
    )
    const atCeiling = normalized.filter((value) => value >= CEILING_CUT).length
    const ceilingShare = normalized.length > 0 ? atCeiling / normalized.length : 0
    const newest = bucket.obs.map((observation) => observation.evaluatedAt).sort().at(-1) ?? asOf
    const stale = daysBetween(newest, asOf) > STALE_AFTER_DAYS

    let status: CohortStatus = "kept"
    if (bucket.obs.every((observation) => observation.sourceTier === "tier3_legacy")) status = "legacy"
    else if (bucket.models.size < MIN_COHORT) status = "insufficient_overlap"
    else if (stale) status = "stale"
    else if (ceilingShare > SATURATION_SHARE) status = "saturated"

    cohortReport.push({
      id,
      benchmarkId: first.benchmarkId,
      domain: first.domain,
      toolMode: first.toolMode,
      models: bucket.models.size,
      status,
      ceilingShare: Math.round(ceilingShare * 1000) / 1000,
    })
    if (status === "kept") kept.set(id, bucket.obs)
  }

  // ---- weights, with the per-domain evaluator cap ------------------------
  const weighted: { observation: IrtObservation; cohortId: string; y: number; weight: number }[] = []
  for (const [id, rows] of kept) {
    for (const observation of rows) {
      weighted.push({
        observation,
        cohortId: id,
        y: clamp(
          (observation.rawScore - observation.floorScore) / (observation.ceilingScore - observation.floorScore),
          0.005,
          0.995,
        ),
        weight: TIER_WEIGHT[observation.sourceTier],
      })
    }
  }

  const byDomain = new Map<string, typeof weighted>()
  for (const row of weighted) {
    if (row.weight <= 0) continue
    const bucket = byDomain.get(row.observation.domain) ?? []
    bucket.push(row)
    byDomain.set(row.observation.domain, bucket)
  }
  for (const rows of byDomain.values()) {
    const totals = new Map<string, number>()
    for (const row of rows) {
      totals.set(row.observation.evaluatorName, (totals.get(row.observation.evaluatorName) ?? 0) + row.weight)
    }
    const total = [...totals.values()].reduce((sum, value) => sum + value, 0)
    if (totals.size < 2 || total <= 0) continue
    for (const row of rows) {
      const share = (totals.get(row.observation.evaluatorName) ?? 0) / total
      if (share > EVALUATOR_CAP) row.weight *= EVALUATOR_CAP / share
    }
  }

  const rows = weighted.filter((row) => row.weight > 0)

  // ---- indices ----------------------------------------------------------
  const modelSlugs = [...new Set(rows.map((row) => row.observation.modelSlug))].sort()
  const cohortIds = [...new Set(rows.map((row) => row.cohortId))].sort()
  const modelIndex = new Map(modelSlugs.map((slug, index) => [slug, index]))
  const cohortIndex = new Map(cohortIds.map((id, index) => [id, index]))

  const byModel: number[][] = modelSlugs.map(() => [])
  const byCohort: number[][] = cohortIds.map(() => [])
  const obsByRow = rows.map((row, rowIndex) => {
    const m = modelIndex.get(row.observation.modelSlug) as number
    const j = cohortIndex.get(row.cohortId) as number
    byModel[m].push(rowIndex)
    byCohort[j].push(rowIndex)
    return { ...row, m, j }
  })

  const theta = modelSlugs.map((slug) => anchors[slug] ?? 0)
  const gamma = cohortIds.map(() => 0)
  const difficulty = cohortIds.map(() => 0)

  const isAnchor = (m: number) => Object.hasOwn(anchors, modelSlugs[m])

  const thetaStep = (m: number) => {
    let gradient = -theta[m] / PRIOR.theta ** 2
    let information = 1 / PRIOR.theta ** 2
    for (const rowIndex of byModel[m]) {
      const row = obsByRow[rowIndex]
      const a = Math.exp(gamma[row.j])
      const p = sigmoid(a * (theta[m] - difficulty[row.j]))
      gradient += row.weight * a * (row.y - p)
      information += row.weight * a * a * p * (1 - p)
    }
    if (!Number.isFinite(information) || information <= 1e-9) return
    theta[m] = clamp(theta[m] + clamp(gradient / information, -0.5, 0.5), -6, 6)
  }

  const itemStep = (j: number) => {
    // log(a): keep the slope finite even on a two-observation cohort.
    let gGrad = -gamma[j] / PRIOR.logA ** 2
    let gInfo = 1 / PRIOR.logA ** 2
    for (const rowIndex of byCohort[j]) {
      const row = obsByRow[rowIndex]
      const a = Math.exp(gamma[j])
      const delta = theta[row.m] - difficulty[j]
      const p = sigmoid(a * delta)
      gGrad += row.weight * (row.y - p) * a * delta
      gInfo += row.weight * p * (1 - p) * a * a * delta * delta
    }
    if (Number.isFinite(gInfo) && gInfo > 1e-9) gamma[j] = clamp(gamma[j] + clamp(gGrad / gInfo, -0.25, 0.25), -2, 2)

    // b
    let bGrad = -difficulty[j] / PRIOR.b ** 2
    let bInfo = 1 / PRIOR.b ** 2
    for (const rowIndex of byCohort[j]) {
      const row = obsByRow[rowIndex]
      const a = Math.exp(gamma[j])
      const p = sigmoid(a * (theta[row.m] - difficulty[j]))
      bGrad += row.weight * (row.y - p) * -a
      bInfo += row.weight * a * a * p * (1 - p)
    }
    if (Number.isFinite(bInfo) && bInfo > 1e-9) {
      difficulty[j] = clamp(difficulty[j] + clamp(bGrad / bInfo, -0.5, 0.5), -6, 6)
    }
  }

  const SWEEPS = 80
  for (let sweep = 0; sweep < SWEEPS; sweep += 1) {
    for (let m = 0; m < modelSlugs.length; m += 1) if (!isAnchor(m)) thetaStep(m)
    for (let j = 0; j < cohortIds.length; j += 1) itemStep(j)
  }

  // ---- intervals and per-model report -----------------------------------
  const scored: Omit<IrtModelScore, "isParetoOptimal" | "savingsVsTop">[] = []
  for (let m = 0; m < modelSlugs.length; m += 1) {
    const fitted = byModel[m]
    if (fitted.length < MIN_OBSERVATIONS) continue
    let information = 1 / PRIOR.theta ** 2
    const domains = new Set<IrtDomain>()
    let providerOnly = true
    for (const rowIndex of fitted) {
      const row = obsByRow[rowIndex]
      const a = Math.exp(gamma[row.j])
      const p = sigmoid(a * (theta[m] - difficulty[row.j]))
      information += row.weight * a * a * p * (1 - p)
      domains.add(row.observation.domain)
      if (row.observation.sourceTier === "tier1_independent") providerOnly = false
    }
    const se = 1 / Math.sqrt(information)
    scored.push({
      slug: modelSlugs[m],
      theta: Math.round(theta[m] * 10000) / 10000,
      index: scaleIndex(theta[m]),
      se: Math.round(se * 10000) / 10000,
      ci90: [scaleIndex(theta[m] - Z90 * se), scaleIndex(theta[m] + Z90 * se)],
      observations: fitted.length,
      domains: [...domains].sort(),
      confidenceStatus: providerOnly ? "Estimated" : "Supported",
      providerOnly,
      blendedCostUsd: options.blendedCostUsd?.[modelSlugs[m]] ?? null,
    })
  }

  // ---- Pareto frontier on index against blended cost --------------------
  const priced = scored.filter((row) => row.blendedCostUsd !== null && row.blendedCostUsd! > 0)
  const best = [...priced].sort((a, b) => b.index - a.index || a.blendedCostUsd! - b.blendedCostUsd!)[0]
  const withFrontier: IrtModelScore[] = scored.map((row) => {
    const cost = row.blendedCostUsd
    const dominated = priced.some(
      (other) =>
        other !== row &&
        other.index >= row.index &&
        other.blendedCostUsd! <= (cost ?? Number.POSITIVE_INFINITY) &&
        (other.index > row.index || other.blendedCostUsd! < (cost ?? Number.POSITIVE_INFINITY)),
    )
    return {
      ...row,
      isParetoOptimal: cost !== null && !dominated,
      savingsVsTop: cost !== null && best && best.blendedCostUsd! > 0 ? Math.round((1 - cost / best.blendedCostUsd!) * 1000) / 1000 : null,
    }
  })

  const ordered = orderByAbility(withFrontier)

  return {
    version: IRT_VERSION,
    asOf,
    scale: { mean: 50, sd: 15 },
    anchors,
    models: ordered,
    cohorts: cohortReport,
    counts: {
      observations: rawObservations.length,
      duplicatesRemoved,
      fittedObservations: rows.length,
      cohorts: cohortReport.length,
      keptCohorts: kept.size,
      scoredModels: withFrontier.length,
    },
  }
}

/* ------------------------------------------------------------------ */
/* Shared-benchmark head-to-head                                      */
/* ------------------------------------------------------------------ */

export interface HeadToHead {
  benchmarkId: string
  toolMode: "none" | "tools"
  label: string
  a: number
  b: number
  delta: number
}

export interface HeadToHeadResult {
  sharedCount: number
  winsA: number
  winsB: number
  ties: number
  perBenchmark: HeadToHead[]
}

/**
 * Compares two models only on tests both took, under the same tool mode. A
 * benchmark one model skipped is not a win for the other: it is absent.
 */
export function sharedHeadToHead(
  aSlug: string,
  bSlug: string,
  observations: readonly IrtObservation[],
): HeadToHeadResult {
  const pick = (slug: string) => {
    const map = new Map<string, IrtObservation>()
    for (const observation of observations) {
      if (observation.modelSlug !== slug) continue
      map.set(`${observation.benchmarkId}__${observation.toolMode}`, observation)
    }
    return map
  }
  const a = pick(aSlug)
  const b = pick(bSlug)
  const perBenchmark: HeadToHead[] = []
  for (const [id, left] of [...a.entries()].sort((x, y) => x[0].localeCompare(y[0]))) {
    const right = b.get(id)
    if (!right) continue
    perBenchmark.push({
      benchmarkId: left.benchmarkId,
      toolMode: left.toolMode,
      label: left.benchmarkId,
      a: left.rawScore,
      b: right.rawScore,
      delta: Math.round((left.rawScore - right.rawScore) * 100) / 100,
    })
  }
  const ties = perBenchmark.filter((row) => row.delta === 0).length
  const winsA = perBenchmark.filter((row) => row.delta > 0).length
  const winsB = perBenchmark.filter((row) => row.delta < 0).length
  return { sharedCount: perBenchmark.length, winsA, winsB, ties, perBenchmark }
}
