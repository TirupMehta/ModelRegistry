import type { ModelItem, SourceRef } from "@/data/models"
import { canonicalOverrides, type CanonicalOverride } from "@/data/canonical-overrides"
import { recordedPriceHistory, type RecordedPrice } from "@/data/price-history"
import { huggingfaceSnapshot } from "@/data/huggingface"
import { providerApiIds } from "@/data/api-ids"
import { openRouterModelIds } from "@/data/provider-catalog"
import { publicVerificationStatus } from "./verification"

/**
 * The canonical record: one model, normalized for machines.
 *
 * `data/models.ts` is the registry's editorial truth. It answers a reader's
 * questions - what is this, what does it cost, what did the laboratory claim,
 * where was it read - and it is deliberately free-form in places (a context
 * window as "1,000,000 tokens", a parameter count as "552B MoE (8B / 16B
 * Activated)"). That shape is good for a page and bad for an agent.
 *
 * This module is the projection: a versioned, fully-typed record where every
 * field is either confirmed or explicitly null, and where nothing is inferred.
 * A gap stays a gap. The point is that a consumer can rely on the contract -
 * "if this field is a number, it was read on a primary source" - instead of
 * parsing prose.
 *
 *   SOURCE OF TRUTH     data/models.ts, plus data/canonical-overrides.ts for
 *                       facts the editorial record does not carry and
 *                       data/price-history.ts for prices that are no longer
 *                       current.
 *   GUARANTEE           every key of a ModelItem is either projected here or
 *                       carried in `legacy` unchanged. `canonicalDatasetIssues`
 *                       fails on a key it does not recognise, so adding a field
 *                       to the dataset forces a decision here rather than
 *                       silently dropping it.
 *   NO FABRICATION      a parser only returns a number when the source text is
 *                       unambiguous; otherwise null. The exact wording always
 *                       stays visible in `parameterSourceText` and in `legacy`.
 *
 * Pure module over its inputs: no dataset import, safe to load from a script.
 */

export const CANONICAL_SCHEMA_VERSION = "1.0" as const

/** Editorial ModelItem fields this projection reads and rewrites. */
export const CONSUMED_KEYS = [
  "id",
  "name",
  "companyId",
  "companyName",
  "releaseDate",
  "openWeights",
  "license",
  "pricing",
  "modalities",
  "sources",
  "lastVerifiedAt",
  "verificationStatus",
  "contextWindowTokens",
] as const

/** Editorial ModelItem fields carried unchanged in `legacy`. */
export const LEGACY_KEYS = [
  "version",
  "isCompanyFlagship",
  "isLatestCheckpoint",
  "statusBadge",
  "category",
  "categoryLabel",
  "contextWindow",
  "maxOutputTokens",
  "parameters",
  "pricingUnit",
  "pricingCurrency",
  "highlight",
  "benchmarks",
  "variants",
  "links",
  "fieldSources",
  "changeLog",
  "supersededBy",
] as const

export type RouterName = "openrouter" | "aws-bedrock" | "google-vertex"
export type PriceCurrency = "USD" | "INR" | "CNY"
export type PriceUnit = "per_1m_tokens" | "per_second" | "per_request" | "other"
export type SourceTier = "official" | "independent" | "community"
export type ModelStatus = "active" | "preview" | "deprecated" | "retired"

export interface RouterId {
  router: RouterName
  modelId: string
}

export interface QuantizedVariant {
  format: "gguf" | "mlx" | "other"
  quantization: string | null
  url: string | null
  verifiedAt: string | null
}

export interface Capabilities {
  reasoning: boolean | null
  toolCalling: boolean | null
  structuredJson: boolean | null
  vision: boolean | null
  audio: boolean | null
  video: boolean | null
  promptCaching: boolean | null
  batchApi: boolean | null
}

export interface Pricing {
  input: number | null
  output: number | null
  cachedInput: number | null
  batchInput: number | null
  batchOutput: number | null
  currency: PriceCurrency
  unit: PriceUnit
  effectiveDate: string | null
  observedAt: string
}

export interface PriceSnapshot {
  observedAt: string
  effectiveDate: string | null
  input: number | null
  output: number | null
  currency: PriceCurrency
  unit: PriceUnit
  sourceUrl: string | null
  note: string | null
}

export interface Attribution {
  label: string
  url: string
  license: string
  retrievedAt: string
}

export interface Telemetry {
  region: "ap-south-1" | "eu-central-1" | "us-east-1"
  ttftMs: number | null
  tokensPerSec: number | null
  uptimePct: number | null
  measuredAt: string
}

export interface CanonicalSource {
  label: string
  url: string
  sourceTier: SourceTier
  verifiedAt: string
  publisher?: string
  kind?: SourceRef["sourceType"]
  live?: boolean
  publishedAt?: string
  note?: string
}

/** Editorial fields, unchanged. Kept so the projection loses nothing. */
export interface CanonicalLegacy {
  version: string
  isCompanyFlagship: boolean
  isLatestCheckpoint: boolean
  statusBadge: string
  category: ModelItem["category"]
  categoryLabel: string
  contextWindow: string
  maxOutputTokens: string
  parameters: string
  pricingUnit?: string
  pricingCurrency?: PriceCurrency
  highlight: string
  benchmarks: ModelItem["benchmarks"]
  variants?: ModelItem["variants"]
  links: ModelItem["links"]
  fieldSources: ModelItem["fieldSources"]
  changeLog: ModelItem["changeLog"]
  supersededBy?: string
}

export interface CanonicalModel {
  schemaVersion: typeof CANONICAL_SCHEMA_VERSION
  slug: string
  aliases: string[]
  displayName: string
  provider: string
  providerId: string
  family: string | null
  accessType: "proprietary" | "open-weight"
  canonicalApiIds: string[]
  routerIds: RouterId[]
  huggingfaceRepo: string | null
  license: string
  licenseSpdx: string | null
  parameterCountTotal: number | null
  parameterCountActive: number | null
  parameterSourceText: string
  quantizedVariants: QuantizedVariant[]
  hfDownloads30d: number | null
  contextWindowTokens: number | null
  maxOutputTokens: number | null
  knowledgeCutoff: string | null
  modalities: string[]
  modalitiesInput: string[] | null
  modalitiesOutput: string[] | null
  capabilities: Capabilities
  pricing: Pricing
  priceHistory: PriceSnapshot[]
  releaseDate: string
  status: ModelStatus
  deprecationDate: string | null
  sunsetDate: string | null
  recommendedReplacementSlug: string | null
  trainingComputeFlops: number | null
  trainingHardware: string | null
  attributions: Attribution[]
  telemetry: Telemetry[]
  lastVerifiedAt: string
  sources: CanonicalSource[]
  publicStatus: "verified" | "retired" | null
  legacy: CanonicalLegacy
}

/* ------------------------------------------------------------------ */
/* Parsers: strict, and only from unambiguous wording                  */
/* ------------------------------------------------------------------ */

const SCALE: Record<string, number> = {
  b: 1e9,
  billion: 1e9,
  t: 1e12,
  trillion: 1e12,
}

/** Wording that means the laboratory published no parameter count. */
const NO_PARAMETER_COUNT = /undisclosed|not (?:published|stated|disclosed)|size not stated|planned|later|unknown/i

/**
 * Total and active parameter counts from the laboratory's own sentence.
 *
 * Rules, in order:
 *   1. "N total" wins, because it is explicit even when other numbers follow.
 *   2. Otherwise a leading "NB" / "NT" is the total ("305B MoE").
 *   3. Active is the first "NB active" / "NB activated".
 * Anything ambiguous - a range, "planned", "not stated", a count in parentheses
 * only - returns null. A wrong number here becomes a false spec, so the parser
 * refuses rather than guesses.
 */
export function parseParameterCounts(text: string): { total: number | null; active: number | null } {
  const source = text.trim()
  if (source.length === 0 || NO_PARAMETER_COUNT.test(source)) return { total: null, active: null }

  const totalMatch = /(~?\d+(?:\.\d+)?)\s*(b|t|billion|trillion)\s*total/i.exec(source)
  const leadingMatch = /^(~?\d+(?:\.\d+)?)\s*(b|t|billion|trillion)\b/i.exec(source)
  const activeMatch = /(~?\d+(?:\.\d+)?)\s*(b|t|billion|trillion)\s*(?:active|activated)\b/i.exec(source)

  const scaled = (match: RegExpExecArray | null): number | null => {
    if (!match) return null
    const value = Number.parseFloat(match[1].replace("~", ""))
    const scale = SCALE[match[2].toLowerCase()]
    if (!Number.isFinite(value) || scale === undefined) return null
    return Math.round(value * scale)
  }

  return { total: scaled(totalMatch) ?? scaled(leadingMatch), active: scaled(activeMatch) }
}

/**
 * Output token limit from a plain "N tokens" / "NK tokens" statement.
 *
 * Conditional limits ("65,536 tokens (up to 1,048,576 with long decode)") and
 * non-text limits ("8-second clips") return null, because picking one number
 * would be a claim the source does not make. The wording stays in `legacy`.
 */
export function parseTokenLimit(text: string): number | null {
  const source = text.trim()
  const plain = /^(\d[\d,]*)\s*tokens$/i.exec(source)
  if (plain) {
    const value = Number(plain[1].replace(/,/g, ""))
    return Number.isFinite(value) && value > 0 ? value : null
  }
  const short = /^(\d+(?:\.\d+)?)\s*(k|m)\s*tokens$/i.exec(source)
  if (short) {
    const value = Number(short[1]) * (short[2].toLowerCase() === "k" ? 1_000 : 1_000_000)
    return Number.isFinite(value) && value > 0 ? Math.round(value) : null
  }
  return null
}

const RESERVED_HF_PATHS = new Set([
  "api",
  "blog",
  "collections",
  "datasets",
  "docs",
  "join",
  "login",
  "models",
  "organizations",
  "papers",
  "pricing",
  "search",
  "settings",
  "spaces",
  "tasks",
])

/**
 * 'org/repo' from a Hugging Face repository URL, or null.
 *
 * Organization pages ("huggingface.co/meta-llama") and collections
 * ("huggingface.co/collections/XiaomiMiMo/mimo-v26") are not repositories, so
 * they return null rather than a plausible-looking string.
 */
export function huggingFaceRepoFromLink(url: string | undefined): string | null {
  if (!url) return null
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }
  if (parsed.hostname !== "huggingface.co" && parsed.hostname !== "www.huggingface.co") return null
  const parts = parsed.pathname.split("/").filter(Boolean)
  if (parts.length !== 2) return null
  const [owner, repo] = parts
  if (RESERVED_HF_PATHS.has(owner.toLowerCase())) return null
  if (!/^[A-Za-z0-9._-]+$/.test(owner) || !/^[A-Za-z0-9._-]+$/.test(repo)) return null
  return `${owner}/${repo}`
}

/* ------------------------------------------------------------------ */
/* Projection                                                          */
/* ------------------------------------------------------------------ */

function priceUnitOf(model: ModelItem): PriceUnit {
  return model.pricingUnit === "per second" ? "per_second" : "per_1m_tokens"
}

function sourceTierOf(source: SourceRef, provider: string): SourceTier {
  // A benchmark page is independent evidence unless the laboratory published
  // it, in which case it is a laboratory claim like any other.
  if (source.sourceType === "benchmark") {
    return source.publisher === provider ? "official" : "independent"
  }
  return "official"
}

function toCanonicalSource(source: SourceRef, provider: string): CanonicalSource {
  return {
    label: source.title,
    url: source.url,
    sourceTier: sourceTierOf(source, provider),
    verifiedAt: source.accessedAt,
    publisher: source.publisher,
    kind: source.sourceType,
    ...(source.live === undefined ? {} : { live: source.live }),
    ...(source.publishedAt ? { publishedAt: source.publishedAt } : {}),
    ...(source.note ? { note: source.note } : {}),
  }
}

function normalizeRecorded(price: RecordedPrice): PriceSnapshot {
  return {
    observedAt: price.observedAt,
    effectiveDate: price.effectiveDate,
    input: price.input,
    output: price.output,
    currency: price.currency,
    unit: price.unit,
    sourceUrl: price.sourceUrl,
    note: price.note,
  }
}

/**
 * Append-only price history: every recorded observation plus the current price
 * as read on `lastVerifiedAt`.
 *
 * The current price is itself an observation - the page was read that day - so
 * it belongs in the history. It is deduplicated against a recorded entry with
 * the same date and numbers so a curated line is never doubled.
 */
export function buildPriceHistory(model: ModelItem): PriceSnapshot[] {
  const currency: PriceCurrency = model.pricingCurrency ?? "USD"
  const unit = priceUnitOf(model)
  const current: PriceSnapshot = {
    observedAt: model.lastVerifiedAt,
    effectiveDate: null,
    input: model.pricing.input,
    output: model.pricing.output,
    currency,
    unit,
    sourceUrl: model.sources[0]?.url ?? null,
    note: null,
  }
  const key = (entry: PriceSnapshot) => `${entry.observedAt}|${entry.input}|${entry.output}|${entry.currency}|${entry.unit}`

  const history: PriceSnapshot[] = []
  const seen = new Set<string>()
  for (const entry of [...(recordedPriceHistory[model.id] ?? []).map(normalizeRecorded), current]) {
    const identity = key(entry)
    if (seen.has(identity)) continue
    seen.add(identity)
    history.push(entry)
  }
  return history.sort((a, b) => a.observedAt.localeCompare(b.observedAt))
}

function capabilitiesFor(model: ModelItem, override: CanonicalOverride | undefined): Capabilities {
  const stated = override?.capabilities ?? {}
  const has = (modality: ModelItem["modalities"][number]) => model.modalities.includes(modality)
  // Vision/audio/video are restatements of the registry's own modality list, not
  // inferences. Everything the dataset does not state stays null.
  return {
    reasoning: stated.reasoning ?? null,
    toolCalling: stated.toolCalling ?? null,
    structuredJson: stated.structuredJson ?? null,
    vision: stated.vision ?? has("Vision"),
    audio: stated.audio ?? has("Audio"),
    video: stated.video ?? has("Video"),
    promptCaching: stated.promptCaching ?? null,
    batchApi: stated.batchApi ?? null,
  }
}

function legacyOf(model: ModelItem): CanonicalLegacy {
  return {
    version: model.version,
    isCompanyFlagship: model.isCompanyFlagship,
    isLatestCheckpoint: model.isLatestCheckpoint,
    statusBadge: model.statusBadge,
    category: model.category,
    categoryLabel: model.categoryLabel,
    contextWindow: model.contextWindow,
    maxOutputTokens: model.maxOutputTokens,
    parameters: model.parameters,
    ...(model.pricingUnit === undefined ? {} : { pricingUnit: model.pricingUnit }),
    ...(model.pricingCurrency === undefined ? {} : { pricingCurrency: model.pricingCurrency }),
    highlight: model.highlight,
    benchmarks: model.benchmarks,
    ...(model.variants === undefined ? {} : { variants: model.variants }),
    links: model.links,
    fieldSources: model.fieldSources,
    changeLog: model.changeLog,
    ...(model.supersededBy === undefined ? {} : { supersededBy: model.supersededBy }),
  }
}

/** One editorial record to one canonical record. Total: no input throws. */
export function toCanonicalModel(model: ModelItem): CanonicalModel {
  const override = canonicalOverrides[model.id]
  const parameters = parseParameterCounts(model.parameters)
  const currency: PriceCurrency = model.pricingCurrency ?? "USD"
  const unit = priceUnitOf(model)
  const routerId = openRouterModelIds[model.id]
  // Verified against the Hub API by scripts/ingest/huggingface.mjs. Absent means
  // the repository was not resolved or the API was not read; it never means zero.
  const hub = huggingfaceSnapshot.records[model.id]
  // Only strings a provider's own model page proved, or an explicit override.
  const apiIds = providerApiIds.filter((entry) => entry.modelId === model.id).map((entry) => entry.id)

  return {
    schemaVersion: CANONICAL_SCHEMA_VERSION,
    slug: model.id,
    aliases: override?.aliases ? [...override.aliases] : [],
    displayName: model.name,
    provider: model.companyName,
    providerId: model.companyId,
    family: override?.family ?? null,
    accessType: model.openWeights ? "open-weight" : "proprietary",
    canonicalApiIds: override?.canonicalApiIds ? [...override.canonicalApiIds] : [...new Set(apiIds)],
    routerIds: routerId ? [{ router: "openrouter", modelId: routerId }] : [],
    huggingfaceRepo:
      override?.huggingfaceRepo ??
      hub?.repo ??
      (model.openWeights ? huggingFaceRepoFromLink(model.links.weights) : null),
    license: model.license,
    licenseSpdx: override?.licenseSpdx ?? hub?.licenseSpdx ?? null,
    parameterCountTotal: parameters.total,
    parameterCountActive: parameters.active,
    parameterSourceText: model.parameters,
    quantizedVariants: [],
    hfDownloads30d: hub?.downloads ?? override?.hfDownloads30d ?? null,
    // The registry stores 0 for a window that is not measured in tokens (video
    // clip length, an image pipeline, an audio stream). The canonical field is a
    // token count, so "no token window" is null; the human wording stays in
    // legacy.contextWindow.
    contextWindowTokens: model.contextWindowTokens > 0 ? model.contextWindowTokens : null,
    maxOutputTokens: parseTokenLimit(model.maxOutputTokens),
    knowledgeCutoff: override?.knowledgeCutoff ?? null,
    modalities: [...new Set(model.modalities)],
    modalitiesInput: override?.modalitiesInput ? [...override.modalitiesInput] : null,
    modalitiesOutput: override?.modalitiesOutput ? [...override.modalitiesOutput] : null,
    capabilities: capabilitiesFor(model, override),
    pricing: {
      input: model.pricing.input,
      output: model.pricing.output,
      cachedInput: null,
      batchInput: null,
      batchOutput: null,
      currency,
      unit,
      effectiveDate: null,
      observedAt: model.lastVerifiedAt,
    },
    priceHistory: buildPriceHistory(model),
    releaseDate: model.releaseDate,
    status: override?.status ?? (model.verificationStatus === "retired" ? "retired" : "active"),
    deprecationDate: override?.deprecationDate ?? null,
    sunsetDate: override?.sunsetDate ?? null,
    recommendedReplacementSlug: model.supersededBy ?? null,
    trainingComputeFlops: override?.trainingComputeFlops ?? null,
    trainingHardware: override?.trainingHardware ?? null,
    attributions: [],
    telemetry: [],
    lastVerifiedAt: model.lastVerifiedAt,
    sources: model.sources.map((source) => toCanonicalSource(source, model.companyName)),
    publicStatus: publicVerificationStatus(model) ?? null,
    legacy: legacyOf(model),
  }
}

/** The whole registry, in dataset order. */
export function toCanonicalDataset(models: readonly ModelItem[]): CanonicalModel[] {
  return models.map(toCanonicalModel)
}

/* ------------------------------------------------------------------ */
/* Cross-record invariants the JSON Schema cannot express              */
/* ------------------------------------------------------------------ */

export interface DatasetIssue {
  slug: string
  message: string
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/**
 * Canonical slug for a former slug, or null.
 *
 * Aliases exist so a rename never breaks a published URL. This is an exact map,
 * which is strictly better than a heuristic: the model page checks it before the
 * fuzzy company fallback, so a known rename always lands on the right record.
 */
export function resolveAlias(slug: string): string | null {
  const target = slug.toLowerCase()
  for (const [canonical, override] of Object.entries(canonicalOverrides)) {
    if (override.aliases?.includes(target)) return canonical
  }
  return null
}

/**
 * Checks that only make sense across the dataset: unique slugs, aliases that do
 * not shadow a real slug, replacements that resolve, price history in order, and
 * every editorial field accounted for.
 *
 * The JSON Schema validates one record; this validates the registry.
 */
export function canonicalDatasetIssues(canonical: readonly CanonicalModel[], models: readonly ModelItem[]): DatasetIssue[] {
  const issues: DatasetIssue[] = []
  const known = new Set<string>([...CONSUMED_KEYS, ...LEGACY_KEYS])
  const slugCounts = new Map<string, number>()
  for (const record of canonical) slugCounts.set(record.slug, (slugCounts.get(record.slug) ?? 0) + 1)

  if (canonical.length !== models.length) {
    issues.push({ slug: "(dataset)", message: `${canonical.length} canonical records for ${models.length} models` })
  }

  for (const model of models) {
    for (const key of Object.keys(model)) {
      if (!known.has(key)) {
        issues.push({
          slug: model.id,
          message: `field '${key}' is neither projected nor carried in legacy; add it to lib/canonical.ts`,
        })
      }
    }
  }

  const aliasOwners = new Map<string, string>()
  for (const record of canonical) {
    const slug = record.slug
    if ((slugCounts.get(slug) ?? 0) > 1) issues.push({ slug, message: "duplicate canonical slug" })
    if (slugCounts.has(slug) && record.aliases.includes(slug)) {
      issues.push({ slug, message: "an alias must not repeat the canonical slug" })
    }
    for (const alias of record.aliases) {
      const owner = aliasOwners.get(alias)
      if (owner !== undefined && owner !== slug) {
        issues.push({ slug, message: `alias '${alias}' is also claimed by '${owner}'` })
      }
      aliasOwners.set(alias, slug)
      if (slugCounts.has(alias)) {
        issues.push({ slug, message: `alias '${alias}' shadows a live canonical slug` })
      }
    }
    if (record.recommendedReplacementSlug !== null && !slugCounts.has(record.recommendedReplacementSlug)) {
      issues.push({ slug, message: `recommendedReplacementSlug '${record.recommendedReplacementSlug}' does not exist` })
    }
    if (record.sources.length === 0) issues.push({ slug, message: "no sources: a record without provenance is not publishable" })
    if (!ISO_DATE.test(record.lastVerifiedAt)) issues.push({ slug, message: `lastVerifiedAt is not a date: ${record.lastVerifiedAt}` })

    // A download figure without a repository is a number with nothing behind it.
    if (record.hfDownloads30d !== null && record.huggingfaceRepo === null) {
      issues.push({ slug, message: "hfDownloads30d is set but huggingfaceRepo is null" })
    }
    const hub = huggingfaceSnapshot.records[slug]
    if (hub && record.huggingfaceRepo !== hub.repo) {
      issues.push({ slug, message: `huggingfaceRepo '${record.huggingfaceRepo}' does not match the ingested repository '${hub.repo}'` })
    }
    for (let index = 1; index < record.priceHistory.length; index += 1) {
      const previous = record.priceHistory[index - 1]
      const current = record.priceHistory[index]
      if (current.observedAt < previous.observedAt) {
        issues.push({ slug, message: `priceHistory is not in observed-at order at entry ${index}` })
      }
    }
    if (record.status === "retired" && record.sunsetDate !== null && record.sunsetDate < record.releaseDate) {
      issues.push({ slug, message: "sunsetDate precedes releaseDate" })
    }
    if (record.deprecationDate !== null && record.deprecationDate < record.releaseDate) {
      issues.push({ slug, message: "deprecationDate precedes releaseDate" })
    }

    // A curated price observation dated after the record was last read is not an
    // observation, it is a prediction. The current price is derived from
    // lastVerifiedAt, so anything later would also sit out of order.
    for (const [index, entry] of (recordedPriceHistory[slug] ?? []).entries()) {
      if (entry.observedAt > record.lastVerifiedAt) {
        issues.push({ slug, message: `priceHistory[${index}] was observed after lastVerifiedAt` })
      }
      if (entry.sourceUrl === null) {
        issues.push({ slug, message: `priceHistory[${index}] has no sourceUrl` })
      }
      if (entry.currency === "USD" && record.legacy.pricingCurrency !== undefined) {
        issues.push({ slug, message: `priceHistory[${index}] is USD but the record prices in ${record.legacy.pricingCurrency}` })
      }
    }
  }

  // An override for a slug that does not exist is a silent no-op; make it loud.
  for (const slug of Object.keys(canonicalOverrides)) {
    if (!slugCounts.has(slug)) issues.push({ slug, message: "canonical override for an unknown model slug" })
  }
  for (const slug of Object.keys(recordedPriceHistory)) {
    if (!slugCounts.has(slug)) issues.push({ slug, message: "price history for an unknown model slug" })
  }

  return issues
}
