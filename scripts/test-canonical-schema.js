/**
 * scripts/test-canonical-schema.js
 *
 * Proves the canonical record is what it claims to be:
 *   1. every real record validates against the PUBLISHED schema
 *      (data/model-schema.v1.json), using the same validator the site ships
 *   2. the validator actually rejects bad records, so a green run is not vacuous
 *   3. the projection loses nothing: every editorial field is either projected
 *      or carried unchanged, and every source URL survives
 *   4. no number is invented: a parsed parameter count re-derives from the
 *      laboratory's own sentence, and absent facts stay null
 *   5. canonical JSON is deterministic and refuses undefined/NaN/Date
 *
 * Offline. Exit 1 on the first violated rule group, naming the record.
 */
const fs = require("fs")
const path = require("path")
const { load } = require("./lib/ts-load")

const ROOT = path.resolve(__dirname, "..")
let failures = 0

function check(name, cond, detail) {
  if (cond) console.log(`  ✓ ${name}`)
  else {
    failures += 1
    console.error(`  ✗ ${name}${detail ? ` - ${detail}` : ""}`)
  }
}

const { modelsData } = load("data/models.ts")
const canonicalModule = load("lib/canonical.ts")
const jsonSchemaModule = load("lib/json-schema.ts")
const canonicalJsonModule = load("lib/canonical-json.ts")

const {
  toCanonicalDataset,
  canonicalDatasetIssues,
  parseParameterCounts,
  parseTokenLimit,
  huggingFaceRepoFromLink,
  CONSUMED_KEYS,
  LEGACY_KEYS,
  CANONICAL_SCHEMA_VERSION,
} = canonicalModule
const { validateSchema } = jsonSchemaModule
const { canonicalJson } = canonicalJsonModule

const schema = JSON.parse(fs.readFileSync(path.join(ROOT, "data/model-schema.v1.json"), "utf8"))
const records = toCanonicalDataset(modelsData)

console.log(`Canonical schema ${CANONICAL_SCHEMA_VERSION}: ${records.length} records\n`)

// ---- 1. every record validates against the published schema ----------------
const schemaFailures = []
for (const record of records) {
  for (const issue of validateSchema(schema, record)) {
    schemaFailures.push(`${record.slug} ${issue.path}: ${issue.message}`)
  }
}
check(`all ${records.length} records validate against the published schema`, schemaFailures.length === 0, schemaFailures.slice(0, 6).join(" | "))

// ---- 2. the validator is not vacuous --------------------------------------
const fixture = records[0]
const broken = {
  "missing required field": (() => { const copy = { ...fixture }; delete copy.slug; return copy })(),
  "wrong type": { ...fixture, contextWindowTokens: "1000000" },
  "bad date": { ...fixture, releaseDate: "2026-13-45" },
  "unknown property": { ...fixture, surprise: true },
  "bad enum": { ...fixture, accessType: "closed" },
  "bad uri": { ...fixture, sources: [{ ...fixture.sources[0], url: "not a url" }] },
  "negative price": { ...fixture, pricing: { ...fixture.pricing, input: -1 } },
  "empty sources": { ...fixture, sources: [] },
  "duplicate alias": { ...fixture, aliases: ["a", "a"] },
  "bad pattern": { ...fixture, slug: "Not A Slug" },
}
for (const [label, value] of Object.entries(broken)) {
  check(`validator rejects: ${label}`, validateSchema(schema, value).length > 0)
}

// ---- 3. zero data loss ----------------------------------------------------
const known = new Set([...CONSUMED_KEYS, ...LEGACY_KEYS])
const lost = []
const sourceLoss = []
const legacyMismatch = []
for (const model of modelsData) {
  const record = records.find((candidate) => candidate.slug === model.id)
  if (!record) { lost.push(`${model.id}: no canonical record`); continue }
  for (const key of Object.keys(model)) {
    if (!known.has(key)) lost.push(`${model.id}: unprojected field '${key}'`)
  }
  // Editorial fields carried in legacy must be byte-identical to the source.
  for (const key of LEGACY_KEYS) {
    if (!(key in model)) continue
    if (!(key in record.legacy)) { lost.push(`${model.id}: legacy is missing '${key}'`); continue }
    if (canonicalJson(record.legacy[key]) !== canonicalJson(model[key])) {
      legacyMismatch.push(`${model.id}: legacy.${key} differs from data/models.ts`)
    }
  }
  // Every source URL and label must survive the rewrite.
  const before = model.sources.map((source) => `${source.url} ${source.title}`).sort()
  const after = record.sources.map((source) => `${source.url} ${source.label}`).sort()
  if (before.join("\n") !== after.join("\n")) sourceLoss.push(`${model.id}: source set changed`)
  // The canonical record must not leak an internal-only status.
  if (record.publicStatus !== null && !["verified", "retired"].includes(record.publicStatus)) {
    sourceLoss.push(`${model.id}: publicStatus '${record.publicStatus}' is not a public state`)
  }
}
check("every editorial field is projected or carried in legacy", lost.length === 0, lost.slice(0, 6).join(" | "))
check("every legacy value matches data/models.ts exactly", legacyMismatch.length === 0, legacyMismatch.slice(0, 6).join(" | "))
check("every source URL and title survives the projection", sourceLoss.length === 0, sourceLoss.slice(0, 6).join(" | "))

const datasetIssues = canonicalDatasetIssues(records, modelsData)
check("cross-record invariants hold", datasetIssues.length === 0, datasetIssues.slice(0, 6).map((i) => `${i.slug}: ${i.message}`).join(" | "))

// ---- 4. no invented numbers ----------------------------------------------
const invented = []
for (const record of records) {
  const derived = parseParameterCounts(record.parameterSourceText)
  if (derived.total !== record.parameterCountTotal) invented.push(`${record.slug}: total ${record.parameterCountTotal} vs text ${derived.total}`)
  if (derived.active !== record.parameterCountActive) invented.push(`${record.slug}: active ${record.parameterCountActive} vs text ${derived.active}`)
  if (record.telemetry.length > 0) invented.push(`${record.slug}: telemetry present without a measurement pipeline`)
  for (const snapshot of record.priceHistory) {
    if (snapshot.observedAt < record.releaseDate) invented.push(`${record.slug}: price observed before release`)
  }
}
check("parsed parameter counts re-derive from the stated text", invented.length === 0, invented.slice(0, 6).join(" | "))

// Parser behaviour on real strings, including the ones it must refuse.
const parserCases = [
  ["305B MoE", 305e9, null],
  ["1.6 Trillion Total (49B Activated)", 1.6e12, 49e9],
  ["77B active (3B embedded, ~2.8T total)", 2.8e12, 77e9],
  ["Undisclosed", null, null],
  ["Undisclosed (substantially smaller than frontier models)", null, null],
  ["Post-trained from Gemma 4 26B-A4B (size not stated)", null, null],
  ["Streaming Audio Foundation", null, null],
]
let parserOk = true
for (const [text, total, active] of parserCases) {
  const result = parseParameterCounts(text)
  if (result.total !== total || result.active !== active) {
    parserOk = false
    console.error(`      parser: "${text}" -> ${result.total}/${result.active}, expected ${total}/${active}`)
  }
}
check("parameter parser accepts explicit counts and refuses prose", parserOk)

check("token parser keeps plain limits, drops conditional ones", [
  parseTokenLimit("128,000 tokens") === 128000,
  parseTokenLimit("384K tokens") === 384000,
  parseTokenLimit("Undisclosed") === null,
  parseTokenLimit("65,536 tokens (up to 1,048,576 with long decode)") === null,
  parseTokenLimit("8-second clips") === null,
].every(Boolean))

check("Hugging Face parser accepts repositories, rejects pages and collections", [
  huggingFaceRepoFromLink("https://huggingface.co/Qwen/Qwen3.8-2.4T-A95B") === "Qwen/Qwen3.8-2.4T-A95B",
  huggingFaceRepoFromLink("https://huggingface.co/meta-llama") === null,
  huggingFaceRepoFromLink("https://huggingface.co/collections/XiaomiMiMo/mimo-v26") === null,
  huggingFaceRepoFromLink(undefined) === null,
].every(Boolean))

// ---- 5. the guards are live, not decoration -------------------------------
// A validator whose rules never fire is indistinguishable from no validator, so
// each invariant is provoked here with a minimal bad input and then removed.
const { canonicalOverrides } = load("data/canonical-overrides.ts")
const { recordedPriceHistory } = load("data/price-history.ts")
const { resolveAlias } = canonicalModule
const probe = records[0]
const other = records[1]
const third = records[2]

check("resolveAlias returns null for a slug it does not know", resolveAlias("no-such-slug") === null)
canonicalOverrides[probe.slug] = { aliases: ["probe-former-name"] }
check("resolveAlias maps a former slug to its canonical one", resolveAlias("probe-former-name") === probe.slug)
check("resolveAlias does not treat a live slug as an alias", resolveAlias(probe.slug) === null)
check("an aliased slug is not a second canonical record", records.every((record) => record.slug !== "probe-former-name"))

canonicalOverrides["zzz-unknown-model"] = {}
check(
  "an override for an unknown slug is reported",
  canonicalDatasetIssues(records, modelsData).some((issue) => issue.slug === "zzz-unknown-model"),
)
delete canonicalOverrides["zzz-unknown-model"]

canonicalOverrides[other.slug] = { aliases: [third.slug] }
// Rebuild, because aliases reach the guard through the projected record, not
// through the override map. This is the projection being tested end to end.
const shadowed = toCanonicalDataset(modelsData)
check(
  "an alias that shadows a live slug is reported",
  canonicalDatasetIssues(shadowed, modelsData).some((issue) => issue.message.includes("shadows a live canonical slug")),
)
check("the shadowing alias is projected onto the record", shadowed.find((record) => record.slug === other.slug)?.aliases.includes(third.slug) === true)
delete canonicalOverrides[other.slug]
delete canonicalOverrides[probe.slug]

recordedPriceHistory[probe.slug] = [
  {
    observedAt: "2999-01-01",
    effectiveDate: null,
    input: 1,
    output: 2,
    currency: "USD",
    unit: "per_1m_tokens",
    sourceUrl: "https://example.com/pricing",
    note: null,
  },
]
check(
  "a price observed after lastVerifiedAt is reported",
  canonicalDatasetIssues(records, modelsData).some((issue) => issue.message.includes("after lastVerifiedAt")),
)

recordedPriceHistory[probe.slug] = [
  {
    observedAt: "2026-01-01",
    effectiveDate: null,
    input: 1,
    output: 2,
    currency: "USD",
    unit: "per_1m_tokens",
    sourceUrl: null,
    note: null,
  },
]
check(
  "a price observation without a source URL is reported",
  canonicalDatasetIssues(records, modelsData).some((issue) => issue.message.includes("no sourceUrl")),
)
delete recordedPriceHistory[probe.slug]

check("the guards pass again once the bad input is removed", canonicalDatasetIssues(records, modelsData).length === 0)

// The newest observation must be the current price, or priceHistory and pricing
// are two different stories about the same model.
const priceDrift = records.filter((record) => {
  const newest = record.priceHistory[record.priceHistory.length - 1]
  return !newest || newest.input !== record.pricing.input || newest.output !== record.pricing.output || newest.currency !== record.pricing.currency
})
check("the newest price observation is the current price", priceDrift.length === 0, priceDrift.map((record) => record.slug).slice(0, 4).join(", "))

// Hugging Face ingestion must reach the canonical record, not sit in a file.
// The counts are whatever the Hub returned on the refresh date, so the test
// checks shape and wiring, never a hard-coded number that would rot.
const { huggingfaceSnapshot } = load("data/huggingface.ts")
const ingested = Object.keys(huggingfaceSnapshot.records)
const withHub = records.filter((record) => record.hfDownloads30d !== null)
check("at least one repository was ingested", ingested.length > 0, `${ingested.length} ingested`)
check("every populated download count has a repository", withHub.every((record) => record.huggingfaceRepo !== null))
check("download counts are non-negative integers", withHub.every((record) => Number.isInteger(record.hfDownloads30d) && record.hfDownloads30d >= 0))
check(
  "every ingested repository is projected onto its record",
  ingested.every((slug) => records.find((record) => record.slug === slug)?.huggingfaceRepo === huggingfaceSnapshot.records[slug].repo),
)
check(
  "no record outside the snapshot claims a download figure",
  records.filter((record) => record.hfDownloads30d !== null && !ingested.includes(record.slug)).length === 0,
)

// Provider API ids must be the verified ones, not a derived string.
const { providerApiIds } = load("data/api-ids.ts")
const slugs = new Set(records.map((record) => record.slug))
check("every verified API id belongs to a real record", providerApiIds.every((entry) => slugs.has(entry.modelId)))
check("every verified API id carries its source page", providerApiIds.every((entry) => typeof entry.sourceUrl === "string" && entry.sourceUrl.startsWith("http")))
check(
  "every verified API id reaches its canonical record",
  providerApiIds.every((entry) => records.find((record) => record.slug === entry.modelId)?.canonicalApiIds.includes(entry.id)),
)
check(
  "no model carries an API id that was not verified",
  records
    .filter((record) => record.canonicalApiIds.length > 0)
    .every((record) => record.canonicalApiIds.every((id) => providerApiIds.some((entry) => entry.modelId === record.slug && entry.id === id))),
)

// ---- 6. canonical JSON is deterministic and strict ------------------------
const a = canonicalJson(records)
const b = canonicalJson([...records])
check("canonical JSON is stable across runs", a === b)
check("canonical JSON sorts keys", canonicalJson({ b: 1, a: 2 }) === '{"a":2,"b":1}')
check("canonical JSON refuses undefined", (() => { try { canonicalJson({ a: undefined }); return false } catch { return true } })())
check("canonical JSON refuses NaN", (() => { try { canonicalJson({ a: NaN }); return false } catch { return true } })())
check("canonical JSON refuses Date", (() => { try { canonicalJson({ a: new Date() }); return false } catch { return true } })())

// ---- report ---------------------------------------------------------------
if (failures > 0) {
  console.error(`\n❌ canonical schema failed with ${failures} problem group(s).`)
  process.exit(1)
}
console.log(`\n✔ Canonical schema ${CANONICAL_SCHEMA_VERSION} holds for ${records.length} records; projection is lossless.`)
