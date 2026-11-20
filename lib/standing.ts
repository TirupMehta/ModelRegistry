import { type ModelItem } from "@/data/models"
import { meridianCalibration } from "@/data/meridian-calibration"
import {
  MERIDIAN_VERSION,
  MeridianInputError,
  Z95,
  composite,
  separable,
  standardError,
  testZ,
  toMeridian,
  type Calibration,
} from "./meridian"

/**
 * Cross-test standing, published as the ModelRegistry Score (the method keeps its internal name, Meridian; the public name changed in 2026-11 because "Meridian score" collides with Google's Meridian marketing tool).
 *
 * Every ranking site publishes one number across several exams. That number is
 * usually a mean of raw percentages, which treats four exams as one scale, or a
 * percentile inside today's field, which moves every score whenever a model is
 * added. Meridian does neither. Each test is measured against a frozen reference
 * (see lib/meridian.ts for the arithmetic and data/meridian-calibration.ts for
 * the constants), so a published score never changes because another model
 * arrived, left or was superseded, and it never saturates.
 *
 * What this module adds on top of the arithmetic:
 *
 *   1. REFUSE. A standing needs readings on at least two calibrated tests. One
 *      test is a position on that test, not a cross-test claim.
 *   2. UNCERTAINTY. Every score carries a 95% band from the pooled disagreement
 *      between tests, and two models are placed in the same tier unless their
 *      gap exceeds the combined error. No finer order is claimed.
 *   3. DISAGREE. The distance between a model's best and worst test, in Meridian
 *      points, is published beside its score. A model that is extreme on one test
 *      and poor on another is contested, and the record says so.
 *   4. AUDIT. The order is recomputed with each test removed in turn. A standing
 *      that collapses when one test is dropped is flagged as test dependent,
 *      which is the shape a gamed benchmark takes.
 *   5. FAIL LOUD. A board with no calibration is not scored and is listed; a
 *      reading that is not a finite number, or a model listed twice on a board,
 *      throws. Nothing is guessed and nothing is dropped silently.
 *
 * A Meridian score summarises published evidence from one evaluator. It is not a
 * prediction of quality and it never hides which tests produced it.
 */

/** Bumped when the scale, the calibration, the weighting, the refusal rule or the audit changes. */
export const STANDING_VERSION = MERIDIAN_VERSION

/** One reading is a position on one test, not a cross-test claim. */
export const MIN_TESTS_FOR_STANDING = 2

/** Meridian points between a model's best and worst test that still count as agreement. */
export const CORROBORATED_SPREAD = 150

/** Above this, the tests are telling different stories about the model. */
export const CONTESTED_SPREAD = 300

/** Places a model may move when one test is dropped before the row is flagged. */
export const STABILITY_TOLERANCE = 2

/** A calibration built on fewer readings than this is flagged as thinly based. */
const WELL_CALIBRATED = 8

/** A test is saturated when its top three scores sit within this many raw points. */
const SATURATION_GAP = 10

/** Tests needed on each side (private and public) before a gap is computed at all. */
export const MIN_TESTS_PER_ACCESS = 2

export type Agreement = "corroborated" | "mixed" | "contested"

export type Access = "private" | "public"

/**
 * How a model's results on tests whose answers are kept private compare with
 * its results on tests whose answers are public. A model tuned to public
 * benchmarks does better on them than on tests it cannot have seen, so a gap
 * that is larger than the noise is worth a reader's attention. It is a
 * measurement of the pattern, not a finding about how the model was trained.
 */
export interface HeldOutGap {
  privateTests: number
  publicTests: number
  /** Private minus public, in Meridian points. Negative means stronger on public tests. */
  gap: number
  /** 95% half-width of the gap, in Meridian points. */
  halfWidth: number
  reading: "within-noise" | "public-stronger" | "private-stronger"
}

export const HELD_OUT_LABEL: Record<HeldOutGap["reading"], string> = {
  "within-noise": "No gap beyond noise",
  "public-stronger": "Stronger on public tests",
  "private-stronger": "Stronger on private tests",
}

/** Difference between a model's private-test and public-test results, or null when either side is too thin. */
export function heldOutGap(
  zs: readonly number[],
  access: readonly (Access | null)[],
  calibration: Calibration,
): HeldOutGap | null {
  const priv: number[] = []
  const pub: number[] = []
  zs.forEach((z, index) => {
    if (access[index] === "private") priv.push(z)
    else if (access[index] === "public") pub.push(z)
  })
  if (priv.length < MIN_TESTS_PER_ACCESS || pub.length < MIN_TESTS_PER_ACCESS) return null
  const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length
  const sd = calibration.composite.sd
  const gap = (100 * (mean(priv) - mean(pub))) / sd
  const halfWidth = (Z95 * 100 * calibration.noise * Math.sqrt(1 / priv.length + 1 / pub.length)) / sd
  return {
    privateTests: priv.length,
    publicTests: pub.length,
    gap: Math.round(gap),
    halfWidth: Math.round(halfWidth),
    reading: Math.abs(gap) <= halfWidth ? "within-noise" : gap < 0 ? "public-stronger" : "private-stronger",
  }
}

export interface StandingTestPoint {
  test: string
  /** This test alone on the Meridian scale: what the model would score if this were its only evidence. */
  points: number
}

export interface StandingRow {
  model: ModelItem
  /** The Meridian score, a whole number. 500 is the reference average, 100 points is one reference standard deviation. */
  standing: number
  /** Standard error in Meridian points. */
  se: number
  /** 95% band, in Meridian points. */
  band: [number, number]
  /** Sort order only. Not a claim: rows in the same tier are not separated. */
  place: number
  /**
   * 1 is the top tier. A row joins the tier of the row above it unless the gap
   * to that tier's leader exceeds the combined 95% error of the two.
   */
  tier: number
  /** False when removing a test leaves this model below the two-test floor. */
  auditable: boolean
  /** Tests behind the standing, best first. */
  tests: string[]
  /** Each test on the Meridian scale, best first. */
  perTest: StandingTestPoint[]
  cohorts: number
  /** Meridian points between the best and worst test. */
  spread: number
  agreement: Agreement
  /** True when a test behind this row rests on a thin reference calibration. */
  levelUncertain: boolean
  /** Places the model moves when any one of its tests is removed. */
  maxShift: number
  stable: boolean
  /** True when the model is top of every cohort it reports. */
  unanimous: boolean
  /** Private-test versus public-test results, or null when either side has too few tests. */
  heldOut: HeldOutGap | null
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
  /** Raw score range between the best and worst model on the test. */
  spread: number
  /** Models in this cohort that also report another cohort. */
  anchors: number
  /** True when the test's reference calibration rests on fewer than WELL_CALIBRATED readings. */
  weaklyLinked: boolean
  /** True when the top three scores sit within SATURATION_GAP raw points of each other. */
  saturated: boolean
}

export interface StandingResult {
  rows: StandingRow[]
  /** Models with exactly one ranked cohort: a position, not a standing. */
  singleTest: SingleTestRow[]
  cohorts: StandingCohort[]
  /** Board ids that were not scored because the calibration does not cover them. */
  uncalibrated: string[]
  observations: number
  rated: number
  ranked: number
  /** Variance of one test's deviation from a model's own average, in Meridian points squared. */
  betweenTest: number
  /** Pooled disagreement between a model's own tests, in Meridian points. */
  betweenTestSd: number
  /** Largest place change across all leave-one-test-out refits. */
  worstShift: number
  /** Mean number of cohorts per rated model. */
  meanCoverage: number
  version: string
}

/** The minimum a board must expose to be scored: any evaluator, any test. */
export interface RankableBoard {
  id: string
  test: string
  domain: string
  /** Whether the evaluator keeps this test's answers private. Omitted or null: not classified. */
  access?: Access | null
  entries: {
    model: ModelItem
    reading: { value: number | null; score: string }
    rank: number
  }[]
}

interface Draft {
  model: ModelItem
  /** Limited z per test, same order as boardIds. */
  zs: number[]
  access: (Access | null)[]
  boardIds: string[]
  tests: string[]
  unanimous: boolean
}

function agreementOf(spread: number): Agreement {
  if (spread <= CORROBORATED_SPREAD) return "corroborated"
  if (spread <= CONTESTED_SPREAD) return "mixed"
  return "contested"
}

const byScoreThenName = (a: { standing: number; model: ModelItem }, b: { standing: number; model: ModelItem }) =>
  b.standing - a.standing || a.model.name.localeCompare(b.model.name) || a.model.id.localeCompare(b.model.id)

/**
 * Builds the standings from boards of one evaluator's results.
 *
 * Pure and order independent: the output depends only on the readings and the
 * calibration, never on the order of `models` or of the boards.
 */
export function buildStanding(
  models: ModelItem[],
  rankable: RankableBoard[],
  calibration: Calibration = meridianCalibration,
): StandingResult {
  const uncalibrated = rankable.filter((board) => !calibration.tests[board.id]).map((board) => board.id)
  const boards = rankable.filter((board) => calibration.tests[board.id])

  // ---- validate: loud, never silent -----------------------------------
  for (const board of boards) {
    const seen = new Set<string>()
    for (const entry of board.entries) {
      if (seen.has(entry.model.id)) {
        throw new MeridianInputError(`${board.test}: ${entry.model.id} is listed twice on one board.`)
      }
      seen.add(entry.model.id)
      if (typeof entry.reading.value !== "number" || !Number.isFinite(entry.reading.value)) {
        throw new MeridianInputError(`${board.test}: ${entry.model.id} has no finite reading (got ${String(entry.reading.value)}).`)
      }
    }
  }

  const rankedIds = new Set(rankable.flatMap((board) => board.entries.map((entry) => entry.model.id)))

  // ---- cohort audit ----------------------------------------------------
  const perModelCohorts = new Map<string, number>()
  for (const board of boards) {
    for (const entry of board.entries) perModelCohorts.set(entry.model.id, (perModelCohorts.get(entry.model.id) ?? 0) + 1)
  }
  const cohorts: StandingCohort[] = boards.map((board) => {
    const scores = board.entries.map((entry) => entry.reading.value as number)
    const top = [...scores].sort((a, b) => b - a).slice(0, 3)
    return {
      id: board.id,
      test: board.test,
      domain: board.domain,
      size: board.entries.length,
      spread: scores.length ? Math.max(...scores) - Math.min(...scores) : 0,
      anchors: board.entries.filter((entry) => (perModelCohorts.get(entry.model.id) ?? 0) > 1).length,
      weaklyLinked: calibration.tests[board.id].n < WELL_CALIBRATED,
      saturated: top.length >= 3 && top[0] - top[top.length - 1] < SATURATION_GAP,
    }
  })

  // ---- one draft per model --------------------------------------------
  const drafts: Draft[] = []
  for (const model of models) {
    const zs: number[] = []
    const access: (Access | null)[] = []
    const boardIds: string[] = []
    const tests: string[] = []
    let unanimous = true
    for (const board of boards) {
      const entry = board.entries.find((candidate) => candidate.model.id === model.id)
      if (!entry) continue
      zs.push(testZ(board.test, entry.reading.value as number, calibration.tests[board.id]))
      access.push(board.access ?? null)
      boardIds.push(board.id)
      tests.push(board.test)
      const best = Math.max(...board.entries.map((candidate) => candidate.reading.value as number))
      if (entry.reading.value !== best) unanimous = false
    }
    if (zs.length > 0) drafts.push({ model, zs, access, boardIds, tests, unanimous: unanimous && zs.length > 1 })
  }

  // ---- rated rows ------------------------------------------------------
  const sd = calibration.composite.sd
  const pointsOf = (z: number) => toMeridian(z, { ...calibration, composite: { mean: 0, sd } })
  const eligible = drafts
    .filter((draft) => draft.zs.length >= MIN_TESTS_FOR_STANDING)
    .map((draft) => {
      const meridian = toMeridian(composite(draft.zs), calibration)
      const se = standardError(draft.zs.length, calibration)
      const order = draft.zs.map((z, index) => ({ z, test: draft.tests[index] })).sort((a, b) => b.z - a.z || a.test.localeCompare(b.test))
      const spread = ((order[0].z - order[order.length - 1].z) / sd) * 100
      return {
        model: draft.model,
        meridian,
        standing: Math.round(meridian),
        se: Math.round(se * 10) / 10,
        band: [Math.round(meridian - 1.959964 * se), Math.round(meridian + 1.959964 * se)] as [number, number],
        place: 0,
        tier: 1,
        auditable: draft.zs.length > MIN_TESTS_FOR_STANDING,
        tests: order.map((item) => item.test),
        perTest: order.map((item) => ({ test: item.test, points: Math.round(pointsOf(item.z)) })),
        cohorts: draft.zs.length,
        spread: Math.round(spread),
        agreement: agreementOf(spread),
        levelUncertain: draft.boardIds.some((id) => calibration.tests[id].n < WELL_CALIBRATED),
        maxShift: 0,
        stable: true,
        unanimous: draft.unanimous,
        heldOut: heldOutGap(draft.zs, draft.access, calibration),
        draft,
      }
    })
    .sort((a, b) => b.meridian - a.meridian || byScoreThenName(a, b))

  eligible.forEach((row, index) => {
    row.place = index + 1
  })

  // Tiers: a gap inside the combined 95% error is not a difference.
  let leader = eligible[0]
  let tier = 1
  for (const row of eligible) {
    if (leader && row !== leader && separable({ meridian: leader.meridian, se: leader.se }, { meridian: row.meridian, se: row.se })) {
      tier += 1
      leader = row
    }
    row.tier = tier
  }

  // ---- leave one test out ---------------------------------------------
  const baseline = new Map(eligible.map((row) => [row.model.id, row.place]))
  for (const board of boards) {
    const refit = eligible
      .map((row) => {
        const kept = row.draft.zs.filter((_, index) => row.draft.boardIds[index] !== board.id)
        if (kept.length < MIN_TESTS_FOR_STANDING) return null
        return { id: row.model.id, name: row.model.name, meridian: toMeridian(composite(kept), calibration) }
      })
      .filter((item): item is { id: string; name: string; meridian: number } => item !== null)
      .sort((a, b) => b.meridian - a.meridian || a.name.localeCompare(b.name) || a.id.localeCompare(b.id))
    refit.forEach((item, index) => {
      const row = eligible.find((candidate) => candidate.model.id === item.id)
      const was = baseline.get(item.id)
      if (!row || was === undefined) return
      row.maxShift = Math.max(row.maxShift, Math.abs(index + 1 - was))
    })
  }
  for (const row of eligible) row.stable = row.auditable && row.maxShift <= STABILITY_TOLERANCE

  // ---- single test -----------------------------------------------------
  const singleTest: SingleTestRow[] = drafts
    .filter((draft) => draft.zs.length < MIN_TESTS_FOR_STANDING)
    .flatMap((draft) => {
      const board = boards.find((candidate) => candidate.id === draft.boardIds[0])
      const entry = board?.entries.find((candidate) => candidate.model.id === draft.model.id)
      if (!board || !entry) return []
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
    .sort((a, b) => a.rank / a.of - b.rank / b.of || a.model.name.localeCompare(b.model.name) || a.model.id.localeCompare(b.model.id))

  // The working fields (exact score, per-test z) are for ordering and auditing only.
  const rows: StandingRow[] = eligible.map((entry) => {
    const row: Partial<typeof entry> = { ...entry }
    delete row.meridian
    delete row.draft
    return row as StandingRow
  })
  const betweenTestSd = (calibration.noise / sd) * 100

  return {
    rows,
    singleTest,
    cohorts,
    uncalibrated,
    observations: boards.reduce((sum, board) => sum + board.entries.length, 0),
    rated: rows.length,
    ranked: rankedIds.size,
    betweenTest: betweenTestSd * betweenTestSd,
    betweenTestSd,
    worstShift: Math.max(0, ...rows.map((row) => row.maxShift)),
    meanCoverage: rows.length > 0 ? rows.reduce((sum, row) => sum + row.cohorts, 0) / rows.length : 0,
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
