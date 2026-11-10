import { type ModelItem } from "@/data/models"
import { type BenchmarkKey, type BenchmarkReading, readBenchmark } from "./benchmarks"
import { isCurrent } from "./currency"

/**
 * Benchmark leaderboards.
 *
 * There is deliberately no cross-test composite score in this file, and the
 * absence is the design. A single number across GPQA, MMLU-Pro, DeepSWE and
 * Terminal-Bench would be an average of four different exams taken by four
 * different subsets of models. Two models can both be "scored" while sharing
 * no measurement at all, which makes the ordering an artefact of which tests
 * each laboratory chose to publish rather than a statement about capability.
 *
 * So this module produces the only thing the data can support:
 *
 *   1. COHORT. Readings are grouped by benchmark and normalised test identity.
 *      A cohort is a set of models whose scores came from the same test at the
 *      same version. Cohorts under MIN_COHORT_SIZE are discarded: a rank among
 *      three values is noise dressed as a result.
 *   2. VERSION GATE. For benchmarks that exist in several versions
 *      (Terminal-Bench, SWE-bench), a reading with no stated version cannot
 *      join a cohort. "90.6%" with no qualifier could be any version of the
 *      test, so it is reported as unranked rather than pooled with records that
 *      do name a version.
 *   3. RANK. Inside a cohort, models are ordered by score with ties averaged.
 *      Rank, cohort size and score are published together, always.
 *
 * A model is therefore never "the best model". It holds a position on each
 * test it reports, and those positions are shown side by side so a reader can
 * see the shape of the evidence instead of a single flattering number.
 */

/** Bumped when the cohort rule, the version gate or the ranking changes. */
export const LEADERBOARD_VERSION = "2.0.0"

/** Below this, a rank is not a measurement. */
export const MIN_COHORT_SIZE = 4

export interface TrackedBenchmark {
  key: BenchmarkKey
  label: string
  domain: string
  /** True when the benchmark exists in several versions and a version must be stated. */
  versionGate: boolean
}

export const TRACKED_BENCHMARKS: TrackedBenchmark[] = [
  {
    key: "terminalBench",
    label: "Terminal-Bench",
    domain: "Agentic execution",
    versionGate: true,
  },
  {
    key: "sweBench",
    label: "SWE-bench family",
    domain: "Software engineering",
    versionGate: true,
  },
  {
    key: "gpqa",
    label: "GPQA",
    domain: "Scientific reasoning",
    versionGate: false,
  },
  {
    key: "mmluPro",
    label: "MMLU-Pro",
    domain: "Broad knowledge",
    versionGate: false,
  },
]

export interface RankedEntry {
  model: ModelItem
  reading: BenchmarkReading
  /** 1 is the top score in this cohort. */
  rank: number
  /** 0-100 position inside the cohort; 100 is the top score. */
  percentile: number
}

export interface Leaderboard {
  id: string
  key: BenchmarkKey
  domain: string
  /** Display label, e.g. "Terminal-Bench 2.1". */
  test: string
  identity: string
  /** Every member states a version, so the cohort is genuinely one test. */
  versionStated: boolean
  entries: RankedEntry[]
}

/** "Terminal-Bench 2.1" rather than "Terminal-Bench (Terminal-Bench v2.1)". */
function displayTest(key: BenchmarkKey, reading: BenchmarkReading): string {
  const base = reading.label
  if (!reading.qualifier) return base
  const cleaned = reading.qualifier
    .replace(/,?\s*self[- ]reported/gi, "")
    .replace(/^v(?=\d)/i, "")
    .trim()
  // "SWE-bench (Verified)" should not read "SWE-bench Verified (Verified)".
  if (cleaned.toLowerCase().startsWith(base.toLowerCase())) return cleaned
  return `${base} ${cleaned}`
}

function rankWithin(values: number[], value: number): { rank: number; percentile: number } {
  const n = values.length
  const above = values.filter((other) => other > value).length
  const equal = values.filter((other) => other === value).length
  // Ties share the best position they would occupy.
  const rank = above + 1
  if (n <= 1) return { rank, percentile: 50 }
  const below = values.filter((other) => other < value).length
  // Hazen plotting position: the best and worst members of a cohort sit half a
  // step inside the interval rather than at exactly 0 and 100. Without the half
  // step a cohort of four turns its last member into a zero, and that zero then
  // dominates any average taken across tests.
  return { rank, percentile: ((below + (equal - 1) / 2 + 0.5) / n) * 100 }
}

export interface LeaderboardOptions {
  /**
   * Rank only records a reader can choose today. A leaderboard that mixes a
   * superseded checkpoint with the current release is not a leaderboard, it is a
   * history of publishing.
   */
  currentOnly?: boolean
}

export function buildLeaderboards(
  models: ModelItem[],
  options: LeaderboardOptions = {},
): Leaderboard[] {
  const field = options.currentOnly ? models.filter(isCurrent) : models
  const buckets = new Map<
    string,
    { key: BenchmarkKey; identity: string; entries: { model: ModelItem; reading: BenchmarkReading }[] }
  >()

  for (const model of field) {
    for (const tracked of TRACKED_BENCHMARKS) {
      const raw = model.benchmarks[tracked.key]
      if (!raw) continue
      const reading = readBenchmark(tracked.key, raw)
      if (reading.value === null) continue
      // The version gate: a versioned benchmark with no stated version cannot
      // be placed in a cohort, because the cohort would be an assumption.
      if (tracked.versionGate && !reading.versioned) continue
      const id = `${tracked.key}::${reading.identity}`
      const bucket = buckets.get(id)
      if (bucket) bucket.entries.push({ model, reading })
      else buckets.set(id, { key: tracked.key, identity: reading.identity, entries: [{ model, reading }] })
    }
  }

  const boards: Leaderboard[] = []

  for (const [id, bucket] of buckets) {
    if (bucket.entries.length < MIN_COHORT_SIZE) continue
    const values = bucket.entries.map((entry) => entry.reading.value as number)
    const entries = bucket.entries
      .map((entry) => {
        const { rank, percentile } = rankWithin(values, entry.reading.value as number)
        return { ...entry, rank, percentile }
      })
      .sort((a, b) => a.rank - b.rank || b.reading.value! - a.reading.value!)

    boards.push({
      id,
      key: bucket.key,
      domain: TRACKED_BENCHMARKS.find((tracked) => tracked.key === bucket.key)?.domain ?? "",
      test: displayTest(bucket.key, bucket.entries[0].reading),
      identity: bucket.identity,
      versionStated: bucket.entries.every((entry) => entry.reading.versioned),
      entries,
    })
  }

  // Largest cohort first: it carries the most information.
  return boards.sort((a, b) => b.entries.length - a.entries.length)
}

export interface ModelPosition {
  test: string
  domain: string
  rank: number
  of: number
  score: string
  percentile: number
}

/** Where one model sits on each leaderboard it appears on. */
export function positionsFor(model: ModelItem, boards: Leaderboard[]): ModelPosition[] {
  const positions: ModelPosition[] = []
  for (const board of boards) {
    const entry = board.entries.find((candidate) => candidate.model.id === model.id)
    if (!entry) continue
    positions.push({
      test: board.test,
      domain: board.domain,
      rank: entry.rank,
      of: board.entries.length,
      score: entry.reading.score,
      percentile: entry.percentile,
    })
  }
  return positions
}

export interface ReadingExclusion {
  model: ModelItem
  test: string
  raw: string
  reason: string
}

/**
 * Why a reading is not on a leaderboard. Published so the gap is visible
 * rather than looking like the model simply has no result.
 */
export function excludedReadings(
  models: ModelItem[],
  boards: Leaderboard[],
  options: LeaderboardOptions = {},
): ReadingExclusion[] {
  const excluded: ReadingExclusion[] = []

  for (const model of models) {
    if (options.currentOnly && !isCurrent(model)) continue
    for (const tracked of TRACKED_BENCHMARKS) {
      const raw = model.benchmarks[tracked.key]
      if (!raw) continue
      const reading = readBenchmark(tracked.key, raw)

      if (reading.value === null) {
        excluded.push({
          model,
          test: reading.label,
          raw,
          reason: "No numeric score in the published value.",
        })
        continue
      }

      if (tracked.versionGate && !reading.versioned) {
        excluded.push({
          model,
          test: reading.label,
          raw,
          reason: `${reading.label} exists in several versions and this record states none, so the score cannot join a cohort.`,
        })
        continue
      }

      const board = boards.find(
        (candidate) => candidate.key === tracked.key && candidate.identity === reading.identity,
      )
      if (board) continue

      excluded.push({
        model,
        test: reading.label,
        raw,
        reason: `Fewer than ${MIN_COHORT_SIZE} tracked models report ${reading.label}${
          reading.qualifier ? ` (${reading.qualifier})` : ""
        }, so no rank is computed.`,
      })
    }
  }

  return excluded
}

export interface LeaderboardStats {
  boards: Leaderboard[]
  /** Models with at least one published position. */
  ranked: number
  /** Models tracked in the registry with no rankable reading. */
  unranked: number
  /** Distinct tests represented. */
  tests: number
  /** Total positions published. */
  positions: number
}

export function leaderboardStats(
  models: ModelItem[],
  options: LeaderboardOptions = {},
): LeaderboardStats {
  const boards = buildLeaderboards(models, options)
  const field = options.currentOnly ? models.filter(isCurrent) : models
  const rankedIds = new Set(boards.flatMap((board) => board.entries.map((entry) => entry.model.id)))
  return {
    boards,
    ranked: rankedIds.size,
    unranked: field.length - rankedIds.size,
    tests: boards.length,
    positions: boards.reduce((sum, board) => sum + board.entries.length, 0),
  }
}
