import { type ModelItem, modelsData } from "@/data/models"
import {
  INDEPENDENT_BENCHMARKS,
  INDEPENDENT_EVALUATOR,
  independentRecords,
  type IndependentBenchmarkInfo,
  type IndependentBenchmarkKey,
  type IndependentRecord,
} from "@/data/independent-benchmarks"
import { isCurrent } from "./currency"
import { readBenchmark } from "./benchmarks"
import { MIN_COHORT_SIZE, type Leaderboard } from "./leaderboards"
import { buildStanding, type RankableBoard, type StandingResult } from "./standing"

/**
 * Independent scores: what one evaluator measured, the same way, on everyone.
 *
 * Laboratory-reported scores are marketing until reproduced: the laboratory
 * picks the benchmark, the harness, the effort setting and the date. Results
 * from one independent evaluator are different in kind. Every model faced the
 * same tasks under the same harness, so a rank among them is a comparison, and
 * a laboratory cannot improve its position by choosing which tests to show.
 *
 * This module does four things the laboratory-reported tables cannot:
 *
 *   1. COHORTS. One table per evaluation, with every covered model in it.
 *   2. SAMPLING ERROR. Where the task count is known, a 95% band is computed
 *      from it, and models the evidence cannot separate from the leader are
 *      reported as tied rather than ranked by a fraction of a point.
 *   3. DISAGREEMENT. Where a laboratory's own figure for the same test is on
 *      the record, the gap to the independent run is published.
 *   4. COST. The evaluator's cost and time per task sit beside the score, so a
 *      reader can see what a point costs.
 *
 * Sampling error is only the error from having run a finite number of tasks. It
 * does not cover run-to-run variance, harness choices or contamination, and the
 * page says so.
 */

export const INDEPENDENT_VERSION = "1.0.0"

const Z95 = 1.96

export interface IndependentEntry {
  model: ModelItem
  record: IndependentRecord
  value: number
  /** Display string: "59.6%", "1785", "67". */
  score: string
  rank: number
  /** Hazen midrank percentile inside the cohort, 0 to 100. */
  percentile: number
  /** 95% sampling band in the score's own units, or null without a task count. */
  band: [number, number] | null
  /** True when the evidence cannot separate this entry from the leader. */
  tiedWithLeader: boolean
}

export interface IndependentBoard {
  id: string
  test: string
  domain: string
  info: IndependentBenchmarkInfo
  entries: IndependentEntry[]
}

function formatScore(info: IndependentBenchmarkInfo, value: number, rounded: boolean): string {
  if (info.unit === "percent") return `${rounded ? value.toFixed(0) : value.toFixed(1)}%`
  if (info.unit === "elo" || info.unit === "index") return `${value}`
  return `${value}`
}

/** Standard error, in percentage points, of a proportion measured on n tasks. */
function standardError(percent: number, tasks: number): number {
  const p = Math.min(0.999, Math.max(0.001, percent / 100))
  return Math.sqrt((p * (1 - p)) / tasks) * 100
}

function hazen(values: number[], value: number): { rank: number; percentile: number } {
  const n = values.length
  const above = values.filter((other) => other > value).length
  const below = values.filter((other) => other < value).length
  const equal = values.filter((other) => other === value).length
  return { rank: above + 1, percentile: ((below + (equal - 1) / 2 + 0.5) / n) * 100 }
}

export function independentFor(modelId: string): IndependentRecord | undefined {
  return independentRecords.find((record) => record.modelId === modelId)
}

/** One board per evaluation, current models only, in the registry's order of value. */
export function buildIndependentBoards(models: ModelItem[] = modelsData): IndependentBoard[] {
  const byId = new Map(models.filter(isCurrent).map((model) => [model.id, model]))
  const boards: IndependentBoard[] = []

  for (const info of INDEPENDENT_BENCHMARKS) {
    const rows = independentRecords
      .map((record) => ({ record, model: byId.get(record.modelId), value: record.values[info.key] }))
      .filter(
        (row): row is { record: IndependentRecord; model: ModelItem; value: number } =>
          row.model !== undefined && typeof row.value === "number",
      )
    if (rows.length < MIN_COHORT_SIZE) continue

    const values = rows.map((row) => row.value)
    const top = Math.max(...values)

    const entries: IndependentEntry[] = rows
      .map((row) => {
        const { rank, percentile } = hazen(values, row.value)
        let band: [number, number] | null = null
        let tied = row.value === top
        const printed = row.record.uncertainty?.[info.key]
        if (typeof printed === "number") {
          // The evaluator printed its own 95% half-width: use it directly.
          const se = printed / Z95
          band = [row.value - printed, row.value + printed]
          const leaderRecord = rows.find((r) => r.value === top)!.record
          const leaderSe = (leaderRecord.uncertainty?.[info.key] ?? printed) / Z95
          const z = (top - row.value) / Math.sqrt(se * se + leaderSe * leaderSe)
          tied = row.value === top || z < Z95
        } else if (info.unit === "percent" && info.tasks) {
          const se = standardError(row.value, info.tasks)
          band = [Math.max(0, row.value - Z95 * se), Math.min(100, row.value + Z95 * se)]
          const leaderSe = standardError(top, info.tasks)
          const z = (top - row.value) / Math.sqrt(se * se + leaderSe * leaderSe)
          tied = row.value === top || z < Z95
        }
        return {
          model: row.model,
          record: row.record,
          value: row.value,
          score: formatScore(info, row.value, Boolean(row.record.rounded)),
          rank,
          percentile,
          band,
          tiedWithLeader: tied,
        }
      })
      .sort((a, b) => a.rank - b.rank || a.model.name.localeCompare(b.model.name))

    boards.push({
      id: `independent::${info.key}`,
      test: info.label,
      domain: info.domain,
      info,
      entries,
    })
  }

  // Composite first, then the largest cohorts.
  return boards.sort((a, b) => {
    if (a.info.key === "intelligenceIndex") return -1
    if (b.info.key === "intelligenceIndex") return 1
    return b.entries.length - a.entries.length
  })
}

/** Adapter so the standing engine can rank independent boards unchanged. */
export function toRankable(boards: IndependentBoard[]): RankableBoard[] {
  return boards
    // The composite is the evaluator's own blend of the other nine, so ranking
    // it beside its own components would count every component twice.
    .filter((board) => board.info.key !== "intelligenceIndex")
    .map((board) => ({
      id: board.id,
      test: board.test,
      domain: board.domain,
      entries: board.entries.map((entry) => ({
        model: entry.model,
        reading: { value: entry.value, score: entry.score },
        rank: entry.rank,
      })),
    }))
}

/**
 * The cross-test standing, computed from independent results only. Laboratory
 * reports are left out of it on purpose: they are chosen by the seller, so
 * mixing them in would reintroduce exactly the selection the evaluator removes.
 */
/** A model needs this many of the evaluator's tests before it is rated at all. */
export const MIN_INDEPENDENT_TESTS = 7

export function buildIndependentStanding(models: ModelItem[] = modelsData): StandingResult {
  const boards = toRankable(buildIndependentBoards(models))
  // Percentiles are measured inside every cohort, but only models with broad
  // coverage are rated: a model missing most tests could look better or worse
  // than it is depending on which tests happen to be missing.
  const covered = new Set(
    models
      .filter((model) => boards.filter((b) => b.entries.some((e) => e.model.id === model.id)).length >= MIN_INDEPENDENT_TESTS)
      .map((model) => model.id),
  )
  return buildStanding(
    models.filter((model) => covered.has(model.id)),
    boards,
  )
}

/** Same boards in the shape the page and the position helpers already read. */
export function toLeaderboards(boards: IndependentBoard[]): Leaderboard[] {
  return boards.map((board) => ({
    id: board.id,
    key: board.info.key as unknown as Leaderboard["key"],
    domain: board.domain,
    test: board.test,
    identity: board.info.key,
    versionStated: true,
    entries: board.entries.map((entry) => ({
      model: entry.model,
      reading: {
        key: board.info.key as unknown as Leaderboard["key"],
        label: board.test,
        raw: entry.score,
        score: entry.score,
        value: entry.value,
        identity: board.info.key,
        qualifier: null,
        versioned: true,
      },
      rank: entry.rank,
      percentile: entry.percentile,
    })),
  }))
}

export interface IndependentPosition {
  test: string
  domain: string
  rank: number
  of: number
  score: string
  percentile: number
  tiedWithLeader: boolean
}

export function independentPositionsFor(model: ModelItem, boards: IndependentBoard[]): IndependentPosition[] {
  const out: IndependentPosition[] = []
  for (const board of boards) {
    const entry = board.entries.find((candidate) => candidate.model.id === model.id)
    if (!entry) continue
    out.push({
      test: board.test,
      domain: board.domain,
      rank: entry.rank,
      of: board.entries.length,
      score: entry.score,
      percentile: entry.percentile,
      tiedWithLeader: entry.tiedWithLeader,
    })
  }
  return out
}

/* ------------------------------------------------------------------ */
/* Laboratory figure against independent run                           */
/* ------------------------------------------------------------------ */

export interface Discrepancy {
  model: ModelItem
  test: string
  lab: number
  labRaw: string
  independent: number
  /** Independent minus laboratory, in percentage points. */
  gap: number
  /** False when the laboratory did not state which version it ran. */
  likeForLike: boolean
}

/**
 * Terminal-Bench is the one evaluation where both a laboratory figure and an
 * independent run exist for the same family. A figure that names version 4.0 is
 * a like-for-like comparison; an unversioned one is shown but flagged, because
 * it could be any version of the test.
 */
export function discrepancies(models: ModelItem[] = modelsData): Discrepancy[] {
  const out: Discrepancy[] = []
  for (const model of models.filter(isCurrent)) {
    const raw = model.benchmarks.terminalBench
    const record = independentFor(model.id)
    const independent = record?.values.terminalBench4
    if (!raw || independent === undefined) continue
    const reading = readBenchmark("terminalBench", raw)
    if (reading.value === null) continue
    const qualifier = reading.qualifier ?? ""
    // A figure labelled "(AA)" is the evaluator's own number, not a claim.
    if (/AA/.test(qualifier)) continue
    const stated4 = /4.0/.test(qualifier)
    // A different stated version is a different test, so it is not comparable.
    if (reading.versioned && !stated4) continue
    out.push({
      model,
      test: "Terminal-Bench 4.0",
      lab: reading.value,
      labRaw: reading.raw,
      independent,
      gap: Math.round((independent - reading.value) * 10) / 10,
      likeForLike: stated4,
    })
  }
  return out.sort((a, b) => a.gap - b.gap)
}

/* ------------------------------------------------------------------ */
/* Cost                                                                */
/* ------------------------------------------------------------------ */

export interface ValueRow {
  model: ModelItem
  index: number
  costPerTask: number
  minutesPerTask: number | null
  /** Index points per dollar of evaluation cost. */
  pointsPerDollar: number
  /** True when no other model scores higher for less money. */
  onFrontier: boolean
}

export function valueRows(models: ModelItem[] = modelsData): ValueRow[] {
  const byId = new Map(models.filter(isCurrent).map((model) => [model.id, model]))
  const rows = independentRecords
    .filter(
      (record) =>
        byId.has(record.modelId) &&
        record.values.intelligenceIndex !== undefined &&
        typeof record.costPerTask === "number" &&
        record.costPerTask > 0,
    )
    .map((record) => ({
      model: byId.get(record.modelId)!,
      index: record.values.intelligenceIndex as number,
      costPerTask: record.costPerTask as number,
      minutesPerTask: record.minutesPerTask ?? null,
      pointsPerDollar: (record.values.intelligenceIndex as number) / (record.costPerTask as number),
      onFrontier: false,
    }))
  for (const row of rows) {
    row.onFrontier = !rows.some(
      (other) =>
        other !== row &&
        other.index >= row.index &&
        other.costPerTask <= row.costPerTask &&
        (other.index > row.index || other.costPerTask < row.costPerTask),
    )
  }
  return rows.sort((a, b) => b.index - a.index)
}

export { INDEPENDENT_BENCHMARKS, INDEPENDENT_EVALUATOR }
export type { IndependentBenchmarkKey }
