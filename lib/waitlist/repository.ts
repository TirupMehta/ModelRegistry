import { sql } from "drizzle-orm"
import { getDb } from "@/lib/db"
import { waitlistRateLimits, waitlistSignups } from "@/lib/db/schema"

/**
 * Database access for the waitlist. Route handlers never build SQL, and nothing
 * here knows about HTTP, so this layer can be reused by a future admin view or
 * export without dragging request plumbing along.
 */

/** Fine for a public one-field form: a person will not submit 10 times. */
const RATE_LIMIT_WINDOW_SECONDS = Number(process.env.WAITLIST_RATE_LIMIT_WINDOW_SECONDS ?? 600)
const RATE_LIMIT_MAX_ATTEMPTS = Number(process.env.WAITLIST_RATE_LIMIT_MAX ?? 10)

export type SignupOutcome = "inserted" | "duplicate"

/**
 * Insert a signup, or report that the address is already on the list.
 *
 * Uniqueness is a database concern: `ON CONFLICT DO NOTHING` means two
 * simultaneous submissions of the same address both complete without error and
 * exactly one row exists afterwards.
 */
export async function addWaitlistSignup(params: {
  email: string
  consentVersion: string
}): Promise<SignupOutcome> {
  const db = getDb()

  const inserted = await db
    .insert(waitlistSignups)
    .values({
      email: params.email,
      consentGiven: true,
      consentAt: new Date(),
      consentVersion: params.consentVersion,
    })
    .onConflictDoNothing({ target: waitlistSignups.email })
    .returning({ id: waitlistSignups.id })

  return inserted.length > 0 ? "inserted" : "duplicate"
}

export type RateLimitDecision = {
  allowed: boolean
  retryAfterSeconds: number
}

/**
 * Atomically count one attempt for `keyHash` inside the current window.
 *
 * This is a single upsert so concurrent requests from the same client cannot
 * each read "0 attempts" and proceed. The window resets in place when it has
 * expired, which keeps the table to one row per active client.
 */
export async function consumeRateLimit(keyHash: string): Promise<RateLimitDecision> {
  const db = getDb()

  const result = await db.execute(sql`
    insert into ${waitlistRateLimits} (key_hash, window_start, attempts)
    values (${keyHash}, now(), 1)
    on conflict (key_hash) do update set
      attempts = case
        when ${waitlistRateLimits.windowStart} < now() - (${RATE_LIMIT_WINDOW_SECONDS} * interval '1 second') then 1
        else ${waitlistRateLimits.attempts} + 1
      end,
      window_start = case
        when ${waitlistRateLimits.windowStart} < now() - (${RATE_LIMIT_WINDOW_SECONDS} * interval '1 second') then now()
        else ${waitlistRateLimits.windowStart}
      end
    returning attempts
  `)

  const attempts = readRows<{ attempts: number }>(result)[0]?.attempts ?? 1
  return {
    allowed: attempts <= RATE_LIMIT_MAX_ATTEMPTS,
    retryAfterSeconds: RATE_LIMIT_WINDOW_SECONDS,
  }
}

/**
 * Sweep expired counters occasionally instead of on a schedule: the waitlist
 * has no cron, and a stale row costs nothing until it is a day old.
 */
export async function maybeSweepRateLimits(): Promise<void> {
  if (Math.random() > 0.02) return
  try {
    await getDb().execute(
      sql`delete from ${waitlistRateLimits} where ${waitlistRateLimits.windowStart} < now() - interval '1 day'`
    )
  } catch {
    // Housekeeping only; a failure must never affect a signup.
  }
}

/** Neon's HTTP driver returns `{ rows }`; keep the unwrapping in one place. */
function readRows<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[]
  if (result && typeof result === "object" && Array.isArray((result as { rows?: unknown }).rows)) {
    return (result as { rows: T[] }).rows
  }
  return []
}
