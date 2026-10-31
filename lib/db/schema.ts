import { sql } from "drizzle-orm"
import { boolean, check, integer, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core"

/**
 * Waitlist signups ONLY. This is not a Model Alerts subscription: there is no
 * notification preference, company follow, digest setting, or verification
 * token here, and none should be added until the subscription system ships.
 * Its tables are deliberately kept out of this schema.
 *
 * `email` stores the normalized address (trimmed, lowercased) and is the only
 * personal datum collected. The original capitalization is intentionally not
 * kept: it carries no delivery value and doubling the column would only create
 * two sources of truth for uniqueness.
 */
export const waitlistSignups = pgTable(
  "waitlist_signups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    // Consent is recorded explicitly, never inferred from registration.
    consentGiven: boolean("consent_given").notNull(),
    consentAt: timestamp("consent_at", { withTimezone: true }).notNull(),
    consentVersion: text("consent_version").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Uniqueness is enforced by the database, so two concurrent submissions of
    // the same address can never both win.
    uniqueIndex("waitlist_signups_email_key").on(table.email),
    // The application normalizes before insert; this keeps a hand-run INSERT
    // from quietly creating a second, differently-cased row.
    check("waitlist_signups_email_normalized", sql`${table.email} = lower(${table.email})`),
    // `[.]` rather than an escaped dot: drizzle-kit writes the constraint text
    // verbatim into the migration, and a backslash does not survive the trip.
    check(
      "waitlist_signups_email_shape",
      sql`${table.email} ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'`
    ),
    check("waitlist_signups_email_length", sql`char_length(${table.email}) <= 254`),
    // A row without consent must be impossible, not merely unlikely.
    check("waitlist_signups_consent_recorded", sql`${table.consentGiven} and ${table.consentVersion} <> ''`),
  ]
)

/**
 * Per-client attempt counter backing the rate limiter. Serverless instances do
 * not share memory, so the public endpoint's throttle has to live in Postgres.
 *
 * `key_hash` is an HMAC of the client IP - a pseudonymous key, not the address
 * itself - and rows are swept once their window is long past. No other request
 * metadata is retained.
 */
export const waitlistRateLimits = pgTable("waitlist_rate_limits", {
  keyHash: text("key_hash").primaryKey(),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
  attempts: integer("attempts").notNull().default(0),
})

export type WaitlistSignup = typeof waitlistSignups.$inferSelect
export type NewWaitlistSignup = typeof waitlistSignups.$inferInsert
