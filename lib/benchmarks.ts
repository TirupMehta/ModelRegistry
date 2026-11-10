import { type ModelItem } from "@/data/models"

/**
 * Benchmark readings, with the test identity kept separate from the score.
 *
 * The dataset stores a benchmark as one display string, e.g.
 * `"42.3% (Terminal-Bench 4.0)"` or `"65.2% (AA)"`. Those strings are fine to
 * print and useless to compare: Terminal-Bench 4.0 and Terminal-Bench 2.1 are
 * different tests, DeepSWE is not SWE-bench Verified, and an Artificial
 * Analysis index score is not a benchmark at all.
 *
 * So every value is parsed into a score plus a normalised *identity* (the test
 * and its version). Two values are only placed side by side when their
 * identities match exactly. Everything else is reported as withheld, with the
 * reason, which is more useful than a number that quietly compares two
 * different exams.
 */

export type BenchmarkKey = keyof ModelItem["benchmarks"]

export const BENCHMARK_LABELS: Record<string, string> = {
  terminalBench: "Terminal-Bench",
  sweBench: "SWE-bench",
  gpqa: "GPQA",
  mmluPro: "MMLU-Pro",
  aime2024: "AIME",
}

const BENCHMARK_KEYS: BenchmarkKey[] = [
  "terminalBench",
  "sweBench",
  "gpqa",
  "mmluPro",
  "aime2024",
]

export interface BenchmarkReading {
  key: BenchmarkKey
  label: string
  raw: string
  /** Display score, e.g. "42.3%". */
  score: string
  /** Numeric score when the string carries one. */
  value: number | null
  /** Normalised test + version, or "default" when the record names neither. */
  identity: string
  /** The parenthetical the record used, if any. */
  qualifier: string | null
  /** False when the record does not state a test version. */
  versioned: boolean
}

/**
 * "Terminal-Bench v2.1, self-reported" -> "terminal bench 2.1".
 * The leading "v" is dropped so v2.1 and 2.1 collapse to the same identity,
 * and the self-report caveat is stripped because it describes provenance,
 * not the test.
 */
function normalizeIdentity(qualifier: string): string {
  return qualifier
    .toLowerCase()
    .replace(/,?\s*self[- ]reported/g, "")
    .replace(/\bv(?=\d)/g, "")
    .replace(/[^a-z0-9.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function readBenchmark(key: BenchmarkKey, raw: string): BenchmarkReading {
  const scoreMatch = raw.match(/(\d+(?:\.\d+)?)\s*%/)
  const qualifierMatch = raw.match(/\(([^)]+)\)/)
  const qualifier = qualifierMatch ? qualifierMatch[1].trim() : null
  const identity = qualifier ? normalizeIdentity(qualifier) : "default"

  return {
    key,
    label: BENCHMARK_LABELS[key] ?? key,
    raw,
    score: scoreMatch ? `${scoreMatch[1]}%` : raw,
    value: scoreMatch ? Number(scoreMatch[1]) : null,
    identity,
    qualifier,
    versioned: Boolean(qualifier),
  }
}

export function readingsFor(model: ModelItem): BenchmarkReading[] {
  const readings: BenchmarkReading[] = []
  for (const key of BENCHMARK_KEYS) {
    const raw = model.benchmarks[key]
    if (raw) readings.push(readBenchmark(key, raw))
  }
  return readings
}

export interface BenchmarkRow {
  label: string
  a: string
  b: string
  edge: "a" | "b" | "tie"
  /** True when neither record states a test version. */
  unversioned: boolean
}

export interface WithheldBenchmark {
  label: string
  a: string
  b: string
  reason: string
}

export interface BenchmarkComparison {
  rows: BenchmarkRow[]
  withheld: WithheldBenchmark[]
}

export function compareBenchmarks(a: ModelItem, b: ModelItem): BenchmarkComparison {
  const aReadings = readingsFor(a)
  const bReadings = readingsFor(b)

  const rows: BenchmarkRow[] = []
  const withheld: WithheldBenchmark[] = []

  for (const aReading of aReadings) {
    const bReading = bReadings.find((candidate) => candidate.key === aReading.key)
    if (!bReading) continue

    if (aReading.identity !== bReading.identity) {
      const aTest = aReading.qualifier ?? "unstated version"
      const bTest = bReading.qualifier ?? "unstated version"
      withheld.push({
        label: aReading.label,
        a: aReading.raw,
        b: bReading.raw,
        reason: `Different tests or versions (${aTest} vs ${bTest}).`,
      })
      continue
    }

    const aValue = aReading.value
    const bValue = bReading.value

    rows.push({
      label: aReading.label,
      a: aReading.raw,
      b: bReading.raw,
      edge:
        aValue === null || bValue === null
          ? "tie"
          : aValue === bValue
            ? "tie"
            : aValue > bValue
              ? "a"
              : "b",
      unversioned: !aReading.versioned && !bReading.versioned,
    })
  }

  return { rows, withheld }
}
