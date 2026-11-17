/**
 * Meridian: the registry's cross-test score.
 *
 * A meridian is the fixed line every position is measured from. That is the
 * whole design. A score here is measured against frozen reference constants
 * (data/meridian-calibration.ts), never against whichever models happen to be
 * listed today, so:
 *
 *   - adding, removing or superseding any other model never changes a score;
 *   - a score never saturates: a model that beats the whole reference field by a
 *     wide margin simply scores higher, so a future frontier stays separable;
 *   - the number is comparable across time, because the ruler does not move.
 *
 * How a score is built, per model, from one evaluator's results:
 *
 *   1. SCALE. A percentage test is put on a logit scale first, so 80% against
 *      90% counts for more than 40% against 50%, and a measured 0% or 100% stays
 *      finite. Index, Elo and net-score tests are used as printed.
 *   2. STANDARDISE. z = (reading - location) / scale, where location and scale
 *      are the median and the robust spread (1.4826 x MAD) of the frozen
 *      reference field for that test. One outlier cannot move a calibration.
 *   3. LIMIT INFLUENCE. Past |z| = SOFT_LIMIT the z grows only logarithmically,
 *      so one extreme result cannot decide a model's score, and nothing is ever
 *      clipped, so order is always preserved.
 *   4. COMBINE. Every test counts equally. The sum is divided by (tests + PRIOR),
 *      which shrinks a model that reports few tests toward the reference
 *      centre, so reporting only your best tests never helps you.
 *   5. PLACE ON THE SCALE. Meridian = 500 + 100 x (composite - mean) / sd, where
 *      mean and sd are frozen from the reference field: 500 is the reference
 *      average and 100 points is one standard deviation of the reference field.
 *
 * Every function here is pure and deterministic. No function reads the field of
 * models, so none can depend on it. Invalid input is rejected with a named error
 * and never scored as a guess.
 */

export const MERIDIAN_VERSION = "3.0.0"

/** Past this many standard deviations an individual test's z grows logarithmically. */
export const SOFT_LIMIT = 2.5

/** Pseudo-tests at the reference centre: the shrinkage that discourages cherry-picking. */
export const PRIOR_TESTS = 1

/** The 95% two-sided normal quantile used for bands and tiers. */
export const Z95 = 1.959964

/** A percentage reading is kept this far inside 0 and 100 before the logit, so it is always finite. */
export const PERCENT_FLOOR = 0.25

export type Transform = "identity" | "logit"

export interface TestCalibration {
  transform: Transform
  /** Median of the transformed reference readings. */
  location: number
  /** 1.4826 x MAD of the transformed reference readings (SD when the MAD is zero). */
  scale: number
  /** Readings behind the constants. */
  n: number
}

export interface Calibration {
  version: string
  /** The evaluator suite the constants were read for; a different suite is a different ruler. */
  suite: string
  calibratedAt: string
  tests: Record<string, TestCalibration>
  /** Mean and standard deviation of the reference composites, for the 500 + 100 x z placement. */
  composite: { mean: number; sd: number }
  /** Pooled standard deviation of a model's own per-test z across the reference field. */
  noise: number
}

export class MeridianInputError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "MeridianInputError"
  }
}

export function assertReading(test: string, value: unknown, transform: Transform): asserts value is number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new MeridianInputError(`${test}: a reading must be a finite number (got ${String(value)}).`)
  }
  if (transform === "logit" && (value < 0 || value > 100)) {
    throw new MeridianInputError(`${test}: a percentage must be between 0 and 100 (got ${value}).`)
  }
}

/** Monotone, finite for every valid reading. */
export function transformReading(value: number, transform: Transform): number {
  if (transform === "identity") return value
  const p = Math.min(100 - PERCENT_FLOOR, Math.max(PERCENT_FLOOR, value)) / 100
  return Math.log(p / (1 - p))
}

/** Strictly increasing, odd, linear to SOFT_LIMIT, logarithmic beyond; never clipped. */
export function limitInfluence(z: number): number {
  const magnitude = Math.abs(z)
  if (magnitude <= SOFT_LIMIT) return z
  return Math.sign(z) * (SOFT_LIMIT + Math.log(1 + magnitude - SOFT_LIMIT))
}

/** The limited z of one reading against one test's frozen calibration. */
export function testZ(test: string, value: number, calibration: TestCalibration): number {
  assertReading(test, value, calibration.transform)
  return limitInfluence((transformReading(value, calibration.transform) - calibration.location) / calibration.scale)
}

/** Shrunk equal-weight composite of per-test limited z values. Empty input is the reference centre. */
export function composite(zs: readonly number[]): number {
  if (zs.length === 0) return 0
  return zs.reduce((sum, z) => sum + z, 0) / (zs.length + PRIOR_TESTS)
}

export function toMeridian(compositeValue: number, calibration: Calibration): number {
  return 500 + (100 * (compositeValue - calibration.composite.mean)) / calibration.composite.sd
}

/** Standard error of a model's composite, in Meridian points, from the pooled disagreement between tests. */
export function standardError(tests: number, calibration: Calibration): number {
  if (tests <= 0) return Infinity
  const seComposite = (calibration.noise * Math.sqrt(tests)) / (tests + PRIOR_TESTS)
  return (100 * seComposite) / calibration.composite.sd
}

/** Two scores the evidence cannot tell apart: their gap is inside the combined 95% error. */
export function separable(a: { meridian: number; se: number }, b: { meridian: number; se: number }): boolean {
  return Math.abs(a.meridian - b.meridian) > Z95 * Math.sqrt(a.se * a.se + b.se * b.se)
}

/** Median of a non-empty list. */
export function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = sorted.length >> 1
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

/** Robust location and scale of a reference field. Used only to calibrate, never to score. */
export function calibrateTest(readings: readonly number[], transform: Transform, testName: string): TestCalibration {
  if (readings.length < 3) {
    throw new MeridianInputError(`${testName}: a calibration needs at least 3 reference readings (got ${readings.length}).`)
  }
  const values = readings.map((reading) => {
    assertReading(testName, reading, transform)
    return transformReading(reading, transform)
  })
  const location = median(values)
  const mad = median(values.map((value) => Math.abs(value - location))) * 1.4826
  const sd = Math.sqrt(values.reduce((sum, value) => sum + (value - location) ** 2, 0) / values.length)
  const scale = mad > 1e-9 ? mad : sd
  if (!(scale > 1e-9)) throw new MeridianInputError(`${testName}: the reference readings are all identical, so there is no scale.`)
  return { transform, location, scale, n: values.length }
}
