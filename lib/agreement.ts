import { epochRecords, type EpochRecord } from "@/data/epoch-eci"
import { Z95, separable } from "./meridian"
import type { StandingRow } from "./standing"

/**
 * Agreement between the ModelRegistry Score and a second evaluator.
 *
 * The score is built from one evaluator's tests (plus a blind human-vote Elo).
 * The honest answer to "is that just one source's view?" is to compare it with
 * a different method on different benchmarks and publish how well they agree,
 * including the models where they do not. The second evaluator is a cross-check
 * only; nothing here feeds back into a score.
 *
 * Two numbers, each easy to state:
 *
 *   - RANK CORRELATION (Spearman): do the two evaluators order the shared
 *     models the same way? 1 is identical order, 0 is unrelated.
 *   - PAIR AGREEMENT: of the pairs of models that BOTH evaluators can tell apart
 *     (the gap is larger than the combined 95% error on each side), what share
 *     are ordered the same way? Pairs either evaluator cannot separate are left
 *     out, because an order the evidence cannot support is not a disagreement.
 *
 * A model without a match in the second evaluator's file is listed as not
 * covered, never estimated.
 */

/** Rank correlation is not reported for fewer models than this. */
export const MIN_AGREEMENT_MODELS = 5

export interface AgreementRow {
  row: StandingRow
  epoch: EpochRecord
  /** 1 is the highest score among the models both evaluators cover. */
  ourRank: number
  epochRank: number
  /** Our rank minus the other evaluator's. Positive: we place the model lower than they do. */
  gap: number
}

export interface Agreement {
  rows: AgreementRow[]
  covered: number
  rated: number
  /** Spearman rank correlation, or null with too few shared models. */
  rho: number | null
  /** Pairs both evaluators can separate, and how many of them are ordered the same way. */
  pairs: { separable: number; same: number }
  notCovered: StandingRow[]
}

/** Rank 1 is the largest value; tied values share the average of the ranks they span. */
export function ranksDescending(values: readonly number[]): number[] {
  const order = values.map((value, index) => ({ value, index })).sort((a, b) => b.value - a.value || a.index - b.index)
  const ranks = new Array<number>(values.length)
  let start = 0
  while (start < order.length) {
    let end = start
    while (end + 1 < order.length && order[end + 1].value === order[start].value) end++
    const shared = (start + end) / 2 + 1
    for (let k = start; k <= end; k++) ranks[order[k].index] = shared
    start = end + 1
  }
  return ranks
}

/** Spearman rank correlation of two equal-length series; null when it is undefined. */
export function spearman(xs: readonly number[], ys: readonly number[]): number | null {
  if (xs.length !== ys.length || xs.length < 3) return null
  const a = ranksDescending(xs)
  const b = ranksDescending(ys)
  const mean = (list: number[]) => list.reduce((sum, value) => sum + value, 0) / list.length
  const ma = mean(a)
  const mb = mean(b)
  let cov = 0
  let va = 0
  let vb = 0
  for (let i = 0; i < a.length; i++) {
    cov += (a[i] - ma) * (b[i] - mb)
    va += (a[i] - ma) ** 2
    vb += (b[i] - mb) ** 2
  }
  if (va === 0 || vb === 0) return null
  return cov / Math.sqrt(va * vb)
}

/** Standard error of an ECI from its printed 95% credible interval. */
function epochSe(record: EpochRecord): number {
  return (record.ciHigh - record.ciLow) / (2 * Z95)
}

export function buildAgreement(rows: StandingRow[], records: readonly EpochRecord[] = epochRecords): Agreement {
  const byId = new Map(records.map((record) => [record.modelId, record]))
  const shared = rows.flatMap((row) => {
    const epoch = byId.get(row.model.id)
    return epoch ? [{ row, epoch }] : []
  })
  const ours = ranksDescending(shared.map((item) => item.row.standing))
  const theirs = ranksDescending(shared.map((item) => item.epoch.eci))
  const agreementRows: AgreementRow[] = shared
    .map((item, index) => ({ ...item, ourRank: ours[index], epochRank: theirs[index], gap: ours[index] - theirs[index] }))
    .sort((a, b) => a.ourRank - b.ourRank || a.row.model.name.localeCompare(b.row.model.name))

  let separablePairs = 0
  let samePairs = 0
  for (let i = 0; i < shared.length; i++) {
    for (let j = i + 1; j < shared.length; j++) {
      const a = shared[i]
      const b = shared[j]
      const bothSeparate =
        separable({ meridian: a.row.standing, se: a.row.se }, { meridian: b.row.standing, se: b.row.se }) &&
        separable({ meridian: a.epoch.eci, se: epochSe(a.epoch) }, { meridian: b.epoch.eci, se: epochSe(b.epoch) })
      if (!bothSeparate) continue
      separablePairs++
      if (Math.sign(a.row.standing - b.row.standing) === Math.sign(a.epoch.eci - b.epoch.eci)) samePairs++
    }
  }

  const coveredIds = new Set(shared.map((item) => item.row.model.id))
  return {
    rows: agreementRows,
    covered: shared.length,
    rated: rows.length,
    rho: shared.length >= MIN_AGREEMENT_MODELS ? spearman(shared.map((s) => s.row.standing), shared.map((s) => s.epoch.eci)) : null,
    pairs: { separable: separablePairs, same: samePairs },
    notCovered: rows.filter((row) => !coveredIds.has(row.model.id)),
  }
}
