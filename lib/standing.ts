import { type ModelItem } from "@/data/models"
import { buildLeaderboards, type Leaderboard } from "./leaderboards"

/**
 * Cross-test standing.
 *
 * Every ranking site publishes one number across several exams. That number is
 * usually a mean of raw percentages, which assumes four different exams are the
 * same difficulty on the same scale. Here they are not: cohort means differ by
 * twenty points and the within-cohort spreads differ again, so a raw mean is an
 * artefact of which tests a laboratory chose to publish.
 *
 * This module builds the only cross-test number the evidence can carry, and
 * publishes the arithmetic behind it:
 *
 *   1. EQUATE. A score becomes its midrank inside its own cohort (same test,
 *      same version). A percentile is scale free, so a hard exam and an easy exam
 *      contribute on the same footing and one outlier cannot drag a cohort's
 *      scale. This is the whole of the difficulty correction: a two-way
 *      difficulty fit on top of a rank transform is unidentified, because the
 *      rank transform has already absorbed it.
 *   2. WEIGHT. Every cohort counts equally. A weight taken from a cohort's raw
 *      score range would bring the raw scale back into a number built to remove
 *      it, and one outlier could set it. Cohort spread is published beside each
 *      cohort instead.
 *   3. REFUSE. A standing needs readings from at least two cohorts. One test is a
 *      position on that test, not a cross-test claim, and this module refuses to
 *      manufacture the difference.
 *   4. DISAGREE. The spread between a model's best and worst test percentile is
 *      published as a first-class number. A model at the 100th percentile on one
 *      exam and the 0th on another is not "strong", it is contested, and the
 *      record says so.
 *   5. MEASURE THE NOISE. The pooled between-test variance is published as a
 *      headline number. It is the honest size of the error bar, and it is why no
 *      fine-grained order is claimed between models that sit a few points apart.
 *   6. AUDIT. The ordering is recomputed with each cohort removed in turn. A
 *      standing that collapses when one test is dropped is flagged as test
 *      dependent, which is exactly the shape a gamed benchmark takes.
 *
 * The unit is an expected percentile, not a percentage correct: a standing of 71
 * means "about the 71st percentile of the ranked field, averaged across the tests
 * this model reports". It is a summary of published evidence, not a prediction of
 * quality, and it is never used to hide which tests produced it.
 */

/** Bumped when the equating, the weighting, the refusal rule or the audit changes. */
export const STANDING_VERSION = "1.0.0"

/** One reading is a position on one test, not a cross-test claim. */
export const MIN_TESTS_FOR_STANDING = 2

/** Percentage points of disagreement that still count as agreement. */
export const CORROBORATED_SPREAD = 20

/** Above this, the tests are telling different stories about the model. */
export const CONTESTED_SPREAD = 50

/** Places a model may move when one test is dropped before the row is flagged. */
export const STABILITY_TOLERANCE = 2

export type Agreement = "corroborated" | "mixed" | "contested"

export interface StandingRow {
  model: ModelItem
  /** Expected percentile on the equated scale, 0 to 100. */
  standing: number
  /** Sort order only. Not a claim: rows in the same tier are not separated. */
  place: number
  /**
   * 1 is the top tier. A row starts a new tier only when it sits more than the
   * pooled between-test disagreement below the top of the tier above it.
   */
  tier: number
  /** False when removing a test leaves this model below the two-test floor. */
  auditable: boolean
  /** Tests behind the standing, best first. */
  tests: string[]
  cohorts: number
  /** Percentage points between the best and worst test percentile. */
  spread: number
  agreement: Agreement
  /** True when a cohort behind this row is linked to the rest by a single model. */
  levelUncertain: boolean
  /** Places the model moves when any one of its cohorts is removed. */
  maxShift: number
  stable: boolean
  /** True when the model is top of every cohort it reports. */
  unanimous: boolean
}

export interface SingleTestRow {
  model: ModelItem
  test: string
  rank: number
  of: number
  score: string
  /** Top quartile of a single cohort. */
  leading: boolean
}

export interface StandingCohort {
  id: string
  test: string
  domain: string
  size: number
  /** Percentage points between the best and worst score in the cohort. */
  spread: number
  /** Models in this cohort that also report another cohort. */
  anchors: number
  /** True when the cohort cannot be placed against the rest of the evidence. */
  weaklyLinked: boolean
  /** True when the top scores sit within CORROBORATED_SPREAD / 2 of each other. */
  saturated: boolean
}

export interface StandingResult {
  rows: StandingRow[]
  /** Models with exactly one ranked cohort: a position, not a standing. */
  singleTest: SingleTestRow[]
  cohorts: StandingCohort[]
  observations: number
  rated: number
  ranked: number
  /** Pooled between-test variance, in percentile units. */
  betweenTest: number
  /** Standard deviation of the pooled between-test disagreement. */
  betweenTestSd: number
  /** Largest place change across all leave-one-test-out refits. */
  worstShift: number
  /** Mean number of cohorts per rated model. */
  meanCoverage: number
  version: string
}

interface Draft {
  model: ModelItem
  /** Weighted mean percentile, 0 to 1. */
  mean: number
  tests: string[]
  cohortIds: string[]
  /** Percentiles for each cohort, same order as cohortIds. */
  percentiles: number[]
  levelUncertain: boolean
  unanimous: boolean
}

function midrank(values: number[], value: number): number {
  const n = values.length
  if (n <= 1) return 0.5
  const below = values.filter((other) => other < value).length
  const equal = values.filter((other) => other === value).length
  // Hazen plotting position. The best and worst members sit half a step inside
  // the cohort rather than at exactly 0 and 1, so a cohort of four does not turn
  // its last member into a zero that then dominates a cross-test average.
  return (below + (equal - 1) / 2 + 0.5) / n
}

function cohortWeight(): number {
  return 1
}

function agreementOf(spread: number): Agreement {
  if (spread <= CORROBORATED_SPREAD) return "corroborated"
  if (spread <= CONTESTED_SPREAD) return "mixed"
  return "contested"
}

function weightedMean(values: number[], weights: number[]): number {
  const total = weights.reduce((sum, weight) => sum + weight, 0)
  if (total === 0) return 0.5
  return values.reduce((sum, value, index) => sum + value * weights[index], 0) / total
}

/** Weighted variance, used for the between-test disagreement. */
function weightedVariance(values: number[], weights: number[]): number {
  const mean = weightedMean(values, weights)
  const total = weights.reduce((sum, weight) => sum + weight, 0)
  if (total === 0) return 0
  return values.reduce((sum, value, index) => sum + weights[index] * (value - mean) ** 2, 0) / total
}

function toPercent(fraction: number): number {
  return Math.max(1, Math.min(99, Math.round(fraction * 1000) / 10))
}

export function buildStanding(models: ModelItem[]): StandingResult {
  // Only records a reader can choose today: a superseded checkpoint is not an
  // option, so ranking it against a current release would be ranking history.
  const boards = buildLeaderboards(models, { currentOnly: true })

  const rankedIds = new Set(boards.flatMap((board) => board.entries.map((entry) => entry.model.id)))
  const ranked = rankedIds.size

  // ---- cohort audit ----------------------------------------------------
  const perModelCohorts = new Map<string, Set<string>>()
  for (const board of boards) {
    for (const entry of board.entries) {
      const set = perModelCohorts.get(entry.model.id) ?? new Set<string>()
      set.add(board.id)
      perModelCohorts.set(entry.model.id, set)
    }
  }

  const cohortSpread = new Map<string, number>()
  const cohorts: StandingCohort[] = boards.map((board) => {
    const scores = board.entries.map((entry) => entry.reading.value as number)
    const spread = Math.max(...scores) - Math.min(...scores)
    cohortSpread.set(board.id, spread)
    const anchors = board.entries.filter(
      (entry) => (perModelCohorts.get(entry.model.id)?.size ?? 0) > 1,
    ).length
    const top = [...scores].sort((a, b) => b - a).slice(0, 3)
    return {
      id: board.id,
      test: board.test,
      domain: board.domain,
      size: board.entries.length,
      spread,
      anchors,
      weaklyLinked: anchors < 2,
      saturated: top.length >= 3 && top[0] - top[top.length - 1] < CORROBORATED_SPREAD / 2,
    }
  })

  const cohortWeights = new Map(
    cohorts.map((cohort) => [cohort.id, cohortWeight()]),
  )

  // ---- one draft per model --------------------------------------------
  const drafts: Draft[] = []
  for (const model of models) {
    const mine = boards.filter((board) => board.entries.some((entry) => entry.model.id === model.id))
    if (mine.length === 0) continue

    const percentiles: number[] = []
    const weights: number[] = []
    const tests: string[] = []
    const cohortIds: string[] = []
    let unanimous = true

    for (const board of mine) {
      const entry = board.entries.find((candidate) => candidate.model.id === model.id)
      if (!entry) continue
      const scores = board.entries.map((candidate) => candidate.reading.value as number)
      percentiles.push(midrank(scores, entry.reading.value as number))
      weights.push(cohortWeights.get(board.id) as number)
      tests.push(board.test)
      cohortIds.push(board.id)
      const best = Math.max(...scores)
      if (entry.reading.value !== best) unanimous = false
    }

    drafts.push({
      model,
      mean: weightedMean(percentiles, weights),
      tests,
      cohortIds,
      percentiles,
      levelUncertain: cohortIds.some(
        (id) => cohorts.find((cohort) => cohort.id === id)?.weaklyLinked ?? false,
      ),
      unanimous: unanimous && mine.length > 1,
    })
  }

  // ---- pooled between-test disagreement -------------------------------
  // Only models with two or more cohorts carry information about how far apart
  // the tests sit; single-test models contribute nothing to this variance.
  let numerator = 0
  let degrees = 0
  for (const draft of drafts) {
    if (draft.percentiles.length < 2) continue
    const weights = draft.cohortIds.map((id) => cohortWeights.get(id) as number)
    numerator += weightedVariance(draft.percentiles, weights) * (draft.percentiles.length - 1)
    degrees += draft.percentiles.length - 1
  }
  const betweenTest = degrees > 0 ? numerator / degrees : 0
  const betweenTestSd = Math.sqrt(betweenTest)

  // ---- rated rows ------------------------------------------------------
  const eligible = drafts
    .filter((draft) => draft.percentiles.length >= MIN_TESTS_FOR_STANDING)
    .map((draft) => {
      const weights = draft.cohortIds.map((id) => cohortWeights.get(id) as number)
      const spread = (Math.max(...draft.percentiles) - Math.min(...draft.percentiles)) * 100
      const mean = draft.mean
      const order = draft.percentiles
        .map((percentile, index) => ({ percentile, test: draft.tests[index] }))
        .sort((a, b) => b.percentile - a.percentile)
      return {
        model: draft.model,
        standing: toPercent(mean),
        place: 0,
        tier: 1,
        auditable: draft.percentiles.length > MIN_TESTS_FOR_STANDING,
        tests: order.map((item) => item.test),
        cohorts: draft.percentiles.length,
        spread: Math.round(spread * 10) / 10,
        agreement: agreementOf(spread),
        levelUncertain: draft.levelUncertain,
        maxShift: 0,
        stable: true,
        unanimous: draft.unanimous,
        weights,
      }
    })
    .sort((a, b) => b.standing - a.standing || a.model.name.localeCompare(b.model.name))

  eligible.forEach((row, index) => {
    row.place = index + 1
  })

  // Tiers: a gap smaller than the pooled disagreement is not a difference.
  const tierGap = betweenTestSd * 100
  let tier = 1
  let tierTop = eligible.length > 0 ? eligible[0].standing : 0
  for (const row of eligible) {
    if (tierTop - row.standing > tierGap) {
      tier += 1
      tierTop = row.standing
    }
    row.tier = tier
  }

  // ---- leave one test out ---------------------------------------------
  // Removing a cohort can drop a model below the two-cohort floor, which is the
  // strongest possible signal that its standing rested on one exam.
  const baselinePlaces = new Map(eligible.map((row) => [row.model.id, row.place]))

  for (const board of boards) {
    const remaining = drafts
      .map((draft) => {
        const kept = draft.cohortIds
          .map((id, index) => ({ id, percentile: draft.percentiles[index] }))
          .filter((item) => item.id !== board.id)
        if (kept.length < MIN_TESTS_FOR_STANDING) return null
        return {
          id: draft.model.id,
          mean: weightedMean(
            kept.map((item) => item.percentile),
            kept.map((item) => cohortWeights.get(item.id) as number),
          ),
        }
      })
      .filter((item): item is { id: string; mean: number } => item !== null)
      .sort((a, b) => b.mean - a.mean)

    remaining.forEach((item, index) => {
      const baseline = baselinePlaces.get(item.id)
      if (baseline === undefined) return
      const shift = Math.abs(index + 1 - baseline)
      const row = eligible.find((candidate) => candidate.model.id === item.id)
      if (row && shift > row.maxShift) row.maxShift = shift
    })
  }

  // A model with two cohorts cannot be audited this way: removing either one
  // leaves a single test, which is not a standing at all. Coverage is published
  // instead, and the audit only speaks where there is something to audit.
  for (const row of eligible) {
    // Without an audit there is nothing to call stable, so it is not claimed.
    row.stable = row.auditable && row.maxShift <= STABILITY_TOLERANCE  }

  // ---- single test -----------------------------------------------------
  const singleTest: SingleTestRow[] = drafts
    .filter((draft) => draft.percentiles.length < MIN_TESTS_FOR_STANDING)
    .flatMap((draft) => {
      const board = boards.find((candidate) => candidate.id === draft.cohortIds[0])
      if (!board) return []
      const entry = board.entries.find((candidate) => candidate.model.id === draft.model.id)
      if (!entry) return []
      return [
        {
          model: draft.model,
          test: board.test,
          rank: entry.rank,
          of: board.entries.length,
          score: entry.reading.score,
          leading: entry.rank / board.entries.length <= 0.25,
        },
      ]
    })
    .sort((a, b) => a.rank / a.of - b.rank / b.of || a.model.name.localeCompare(b.model.name))

  const rows: StandingRow[] = eligible.map(({ weights: _weights, ...row }) => row)

  return {
    rows,
    singleTest,
    cohorts,
    observations: boards.reduce((sum, board) => sum + board.entries.length, 0),
    rated: rows.length,
    ranked,
    betweenTest,
    betweenTestSd,
    worstShift: Math.max(0, ...rows.map((row) => row.maxShift)),
    meanCoverage:
      rows.length > 0 ? rows.reduce((sum, row) => sum + row.cohorts, 0) / rows.length : 0,
    version: STANDING_VERSION,
  }
}

/** One model's standing, or null when it has too little linked evidence. */
export function standingFor(model: ModelItem, result: StandingResult): StandingRow | null {
  return result.rows.find((row) => row.model.id === model.id) ?? null
}

export const AGREEMENT_LABEL: Record<Agreement, string> = {
  corroborated: "Tests agree",
  mixed: "Tests partly agree",
  contested: "Tests disagree",
}
