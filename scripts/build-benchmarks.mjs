/**
 * scripts/build-benchmarks.mjs
 *
 * Builds data/benchmarks.ts: one normalized observation per model, benchmark and
 * tool mode, from the two benchmark layers the registry already holds.
 *
 *   tier1_independent  Artificial Analysis, one evaluator, one harness, typed
 *                      values and (where printed) an uncertainty. This is the only
 *                      layer where models faced the same tasks by construction.
 *   tier2_provider     a laboratory's own figure, parsed from the display string.
 *                      Included only when it states a test version, because an
 *                      unversioned "88%" cannot be placed on one scale with a
 *                      versioned run. Colours the store, and enters scoring only
 *                      when a cohort still clears the overlap rule.
 *
 * Scale rules (floor -> ceiling) are per benchmark and explicit:
 *   percent 0 -> 100, index 0 -> 100, net -100 -> 100.
 *   Elo is excluded: a rating has no bounded scale, so normalizing it would
 *   invent a ceiling. Those observations stay out of the store rather than being
 *   silently rescaled.
 *
 *   node scripts/build-benchmarks.mjs           write data/benchmarks.ts
 *   node scripts/build-benchmarks.mjs --check   exit 1 if the file is stale
 */
import fs from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"

const require = createRequire(import.meta.url)
const { load, ROOT } = require("./lib/ts-load.js")

const { modelsData } = load("data/models.ts")
const { INDEPENDENT_BENCHMARKS, INDEPENDENT_EVALUATOR, independentRecords } = load("data/independent-benchmarks.ts")
const { readBenchmark, BENCHMARK_LABELS } = load("lib/benchmarks.ts")

const OUT = path.join(ROOT, "data", "benchmarks.ts")
const CHECK = process.argv.includes("--check")

/** The six Core Text domains, plus the two the registry keeps on separate boards. */
const DOMAIN_BY_INDEPENDENT_KEY = {
  terminalBench4: "agentic",
  terminalBenchScience: "agentic",
  automationBench: "agentic",
  frontierCode: "coding",
  hleDiamond: "reasoning",
  critPt: "reasoning",
  omniscience: "knowledge",
  gdpPdf: "knowledge",
  aaBriefcase: "instruction_following",
  // arenaText (Elo) and intelligenceIndex (the evaluator's own composite) are
  // deliberately absent: neither is a bounded, single-test measurement.
}

const DOMAIN_BY_LAB_KEY = {
  terminalBench: "agentic",
  sweBench: "coding",
  mmluPro: "knowledge",
  gpqa: "reasoning",
  aime2024: "math",
}

/** Only where the evaluator's own description states tool use. */
const TOOL_MODE_BY_INDEPENDENT_KEY = {
  critPt: "tools",
}

const FLOOR_CEILING_BY_UNIT = {
  percent: [0, 100],
  index: [0, 100],
  net: [-100, 100],
}

const observations = []
const skipped = { elo: 0, noDomain: 0, unversionedLab: 0, noValue: 0 }

const observedAt = (record) => record.retrievedAt ?? INDEPENDENT_EVALUATOR.retrievedAt

// ---- tier 1: the independent evaluator ------------------------------------
const byKey = new Map(INDEPENDENT_BENCHMARKS.map((info) => [info.key, info]))
for (const record of independentRecords) {
  for (const [key, value] of Object.entries(record.values)) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      skipped.noValue += 1
      continue
    }
    const info = byKey.get(key)
    if (!info) continue
    // Elo has no bounded scale, so it is excluded before domain mapping. A rating
    // squashed into 0..100 reads as a ceiling and poisons the fit.
    if (info.unit === "elo") {
      skipped.elo += 1
      continue
    }
    const domain = DOMAIN_BY_INDEPENDENT_KEY[key]
    if (!domain) {
      skipped.noDomain += 1
      continue
    }
    const scale = FLOOR_CEILING_BY_UNIT[info.unit]
    if (!scale) {
      skipped.noDomain += 1
      continue
    }
    const [floorScore, ceilingScore] = scale
    observations.push({
      modelSlug: record.modelId,
      benchmarkId: key,
      label: info.label,
      domain,
      rawScore: value,
      floorScore,
      ceilingScore,
      toolMode: TOOL_MODE_BY_INDEPENDENT_KEY[key] ?? "none",
      sourceTier: "tier1_independent",
      evaluatorName: INDEPENDENT_EVALUATOR.name,
      evaluatedAt: observedAt(record),
      sourceUrl: record.sourceUrl,
    })
  }
}

// ---- tier 2: laboratory figures, versioned only ---------------------------
for (const model of modelsData) {
  for (const key of Object.keys(DOMAIN_BY_LAB_KEY)) {
    const raw = model.benchmarks[key]
    if (!raw) continue
    const reading = readBenchmark(key, raw)
    if (reading.value === null || !Number.isFinite(reading.value)) {
      skipped.noValue += 1
      continue
    }
    if (!reading.versioned) {
      skipped.unversionedLab += 1
      continue
    }
    const toolMode = /with tools|tool use/i.test(raw) ? "tools" : /no tools/i.test(raw) ? "none" : "none"
    observations.push({
      modelSlug: model.id,
      benchmarkId: `${key}@${reading.identity.replace(/\s+/g, "-")}`,
      label: `${BENCHMARK_LABELS[key]} (${reading.qualifier ?? "version not stated"})`,
      domain: DOMAIN_BY_LAB_KEY[key],
      rawScore: reading.value,
      floorScore: 0,
      ceilingScore: 100,
      toolMode,
      sourceTier: "tier2_provider",
      evaluatorName: model.companyName,
      // The registry read this figure on lastVerifiedAt; the laboratory published
      // it no earlier than the release. The release date is the honest floor.
      evaluatedAt: model.releaseDate,
      sourceUrl: model.fieldSources.benchmarks?.[0]?.url ?? model.sources[0]?.url ?? "",
    })
  }
}

const sorted = observations.sort(
  (a, b) =>
    a.benchmarkId.localeCompare(b.benchmarkId) ||
    a.modelSlug.localeCompare(b.modelSlug) ||
    a.toolMode.localeCompare(b.toolMode),
)

const counts = {
  tier1: sorted.filter((row) => row.sourceTier === "tier1_independent").length,
  tier2: sorted.filter((row) => row.sourceTier === "tier2_provider").length,
}

const file = `/**
 * data/benchmarks.ts - GENERATED by scripts/build-benchmarks.mjs. Do not edit.
 *
 * One normalized observation per model, benchmark and tool mode.
 *
 * The store is a provenance layer, not a leaderboard. An observation joins the
 * IRT fit only if its cohort clears the overlap, staleness, saturation and
 * legacy rules in lib/irt.ts; the raw rows stay here so every published score
 * can be traced back to the row that produced it.
 *
 * Scale: every row carries the floor and ceiling its own test uses. Elo is not
 * stored, because a rating has no bounded scale and normalizing it would invent
 * a ceiling.
 */

export type BenchmarkDomain =
  | "agentic"
  | "coding"
  | "reasoning"
  | "knowledge"
  | "math"
  | "instruction_following"
  | "multimodal"
  | "multilingual"

export type BenchmarkToolMode = "none" | "tools"

export type BenchmarkSourceTier = "tier1_independent" | "tier2_provider" | "tier3_legacy"

export interface BenchmarkObservation {
  modelSlug: string
  /** Stable id including the test version where one is stated. */
  benchmarkId: string
  label: string
  domain: BenchmarkDomain
  rawScore: number
  floorScore: number
  ceilingScore: number
  toolMode: BenchmarkToolMode
  sourceTier: BenchmarkSourceTier
  evaluatorName: string
  evaluatedAt: string
  sourceUrl: string
}

export const BENCHMARK_STORE_VERSION = "1.0.0"

export const benchmarkObservations: BenchmarkObservation[] = ${JSON.stringify(sorted, null, 2)}
`

if (CHECK) {
  const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : ""
  if (current !== file) {
    console.error("data/benchmarks.ts is stale. Run: node scripts/build-benchmarks.mjs")
    process.exit(1)
  }
  console.log("✔ data/benchmarks.ts is current.")
  process.exit(0)
}

fs.writeFileSync(OUT, file)

console.log(`Benchmark store: ${sorted.length} observations (${counts.tier1} independent, ${counts.tier2} laboratory).`)
console.log(`Skipped: ${skipped.elo} Elo, ${skipped.noDomain} composite, ${skipped.unversionedLab} unversioned laboratory figures, ${skipped.noValue} without a numeric value.`)

const perBenchmark = new Map()
for (const row of sorted) {
  const bucket = perBenchmark.get(row.benchmarkId) ?? { models: new Set(), tier: row.sourceTier }
  bucket.models.add(row.modelSlug)
  perBenchmark.set(row.benchmarkId, bucket)
}
const eligible = [...perBenchmark.entries()].filter(([, bucket]) => bucket.models.size >= 4)
console.log(`Cohorts with 4+ models: ${eligible.length} of ${perBenchmark.size}.`)
for (const [id, bucket] of [...perBenchmark.entries()].sort((a, b) => b[1].models.size - a[1].models.size)) {
  const tag = bucket.models.size >= 4 ? "  " : "  (display only) "
  console.log(`  ${tag}${id.padEnd(46)} ${String(bucket.models.size).padStart(3)} models  ${bucket.tier}`)
}
console.log(`\nWrote ${path.relative(ROOT, OUT)}.`)
