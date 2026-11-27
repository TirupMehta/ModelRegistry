/**
 * Append-only price observations, in the laboratory's own currency.
 *
 * A price is a fact with a date. The registry's editorial records keep the
 * current number, which is enough to compare today and useless for answering
 * "what changed". This file is the history: one line per observation, never
 * edited, so a drop or an increase is computed from real readings rather than
 * remembered.
 *
 * Rules:
 *   - Append. Never rewrite an earlier entry, even to fix a typo: add a
 *     correction entry with a `note`.
 *   - Record a price change HERE before the record's `lastVerifiedAt` moves.
 *     The current price in `data/models.ts` is projected as the newest
 *     observation, dated by `lastVerifiedAt`; it is derived, not stored. So if a
 *     re-verification finds a new price and no line was added here first, the old
 *     price leaves the history with the date it used to carry. The guard in
 *     `canonicalDatasetIssues` rejects an entry dated after `lastVerifiedAt`.
 *   - `observedAt` is the date the price was read; `effectiveDate` is the date
 *     the laboratory says it applies from, or null when unstated.
 *   - Prices are in the currency the laboratory publishes, never converted.
 *     A cross-currency comparison is the UI's problem to state, not the data's
 *     problem to hide.
 *   - `sourceUrl` is the page that shows the number.
 *
 * The current price in `data/models.ts` is added automatically as the latest
 * observation (see lib/canonical.ts), so this file only needs entries that are
 * no longer current - a launch price, a promotional rate, an increase.
 */

export interface RecordedPrice {
  /** 'YYYY-MM-DD' the price was read. */
  observedAt: string
  /** 'YYYY-MM-DD' the laboratory says the price applies from, or null. */
  effectiveDate: string | null
  input: number | null
  output: number | null
  currency: "USD" | "INR" | "CNY"
  unit: "per_1m_tokens" | "per_second" | "per_request" | "other"
  /** Page that shows the number. */
  sourceUrl: string | null
  /** Why this is not the current price, e.g. "Launch price, ended 2026-11-30". */
  note: string | null
}

/** Keyed by canonical slug, oldest first. */
export const recordedPriceHistory: Record<string, RecordedPrice[]> = {}
