import { neon } from "@neondatabase/serverless"
import { loadEnv } from "./load-env.mjs"
loadEnv()
const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL
if (!url) { console.error("no url"); process.exit(1) }
const sql = neon(url)

const TEST_EMAIL = "waitlist-test-20261031@modelregistry-test.invalid"

console.log("1. connection + schema check")
const cols = await sql`select column_name, data_type from information_schema.columns where table_name='waitlist_signups' order by ordinal_position`
console.log(JSON.stringify(cols.map(c => c.column_name + ":" + c.data_type)))
const tables = await sql`select table_name from information_schema.tables where table_schema='public' and table_name in ('waitlist_signups','waitlist_rate_limits')`
console.log("tables:", tables.map(t => t.table_name).sort().join(","))

console.log("2. insert test row")
await sql`delete from waitlist_signups where email = ${TEST_EMAIL.toLowerCase()}`
const inserted = await sql`
  insert into waitlist_signups (email, consent_given, consent_at, consent_version)
  values (${TEST_EMAIL}, true, now(), '2026-10-31')
  on conflict (email) do nothing
  returning id, email, consent_given, consent_at, consent_version, created_at
`
console.log("inserted rows:", inserted.length, inserted[0]?.email)

console.log("3. read back")
const rows = await sql`select id, email, consent_given, consent_version from waitlist_signups where email = ${TEST_EMAIL.toLowerCase()}`
console.log("read rows:", rows.length, rows[0]?.email, rows[0]?.consent_given, rows[0]?.consent_version)

console.log("4. duplicate (same normalized email) must not create a second row")
const dup = await sql`
  insert into waitlist_signups (email, consent_given, consent_at, consent_version)
  values (${TEST_EMAIL.toLowerCase()}, true, now(), '2026-10-31')
  on conflict (email) do nothing
  returning id
`
console.log("duplicate returning rows:", dup.length, "(expected 0)")
const count = await sql`select count(*)::int as n from waitlist_signups where email = ${TEST_EMAIL.toLowerCase()}`
console.log("rows for test email:", count[0].n, "(expected 1)")

console.log("5. normalization invariant: unnormalized insert is rejected by CHECK")
let checkViolated = false
try {
  await sql`insert into waitlist_signups (email, consent_given, consent_at, consent_version) values (${TEST_EMAIL.toUpperCase()}, true, now(), '2026-10-31')`
} catch (e) {
  checkViolated = /check/i.test(e.message) || e.code === "23514"
  console.log("caught:", e.code ?? e.message?.slice(0, 60))
}
console.log("check constraint raised:", checkViolated)

console.log("6. unique constraint enforcement (raw duplicate, no on-conflict)")
let uniqueViolated = false
try {
  await sql`insert into waitlist_signups (email, consent_given, consent_at, consent_version) values (${TEST_EMAIL.toLowerCase()}, true, now(), '2026-10-31')`
} catch (e) {
  uniqueViolated = /unique/i.test(e.message) || e.code === "23505"
  console.log("caught:", e.code ?? e.message?.slice(0, 60))
}
console.log("unique violation raised:", uniqueViolated)

console.log("7. cleanup test row")
const del = await sql`delete from waitlist_signups where email = ${TEST_EMAIL.toLowerCase()} returning id`
console.log("deleted:", del.length)

console.log("DONE")
