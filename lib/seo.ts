import { type ModelItem } from "@/data/models"
import {
  type BenchmarkRow,
  type WithheldBenchmark,
  compareBenchmarks,
} from "./benchmarks"
import { isCurrent } from "./currency"

/**
 * Shared structured-data and comparison primitives.
 *
 * Two rules govern everything in this file:
 *   1. Every claim emitted here is derived from the dataset - never invented.
 *   2. Nothing is emitted unless the same statement is visible on the page.
 *      A schema block that says something the reader cannot see is a
 *      structured-data violation, and answer engines treat it as a reason to
 *      distrust the whole record.
 */

export const SITE = "https://modelregistry.tirup.in"

export function abs(path: string): string {
  return `${SITE}${path.startsWith("/") ? path : `/${path}`}`
}

/* ------------------------------------------------------------------ */
/* Generic builders                                                    */
/* ------------------------------------------------------------------ */

export function breadcrumbList(items: { name: string; path?: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.path ? { item: abs(item.path) } : {}),
    })),
  }
}

export function itemList({
  name,
  path,
  description,
  models,
  order = "https://schema.org/ItemListOrderAscending",
}: {
  name: string
  path: string
  description?: string
  models: ModelItem[]
  order?: string
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    ...(description ? { description } : {}),
    url: abs(path),
    numberOfItems: models.length,
    itemListOrder: order,
    itemListElement: models.map((model, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: `${model.name} (${model.companyName})`,
      url: abs(`/models/${model.id}`),
    })),
  }
}

export function faqPage(qas: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: qas.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  }
}

/** `variableMeasured` entries: the record's numeric facts as machine data. */
export function measuredProperties(model: ModelItem) {
  const props: Record<string, unknown>[] = []

  if (model.contextWindowTokens > 0) {
    props.push({
      "@type": "PropertyValue",
      name: "Context window",
      value: model.contextWindowTokens,
      unitText: "tokens",
    })
  }

  const output = tokenCount(model.maxOutputTokens)
  if (output) {
    props.push({
      "@type": "PropertyValue",
      name: "Max output",
      value: output,
      unitText: "tokens",
    })
  }

  if (!model.pricingUnit) {
    props.push(
      {
        "@type": "PropertyValue",
        name: "Input price",
        value: model.pricing.input,
        unitText: "USD per 1M tokens",
      },
      {
        "@type": "PropertyValue",
        name: "Output price",
        value: model.pricing.output,
        unitText: "USD per 1M tokens",
      },
    )
  }

  return props
}

/* ------------------------------------------------------------------ */
/* Comparison graph                                                    */
/* ------------------------------------------------------------------ */

/**
 * A model worth comparing: a lab flagship or its newest shipped checkpoint,
 * still on offer. A superseded record is not a choice, so pairing it with a
 * current model produces a page nobody would search for and nobody could act on.
 */
export function isComparable(model: ModelItem): boolean {
  return (model.isCompanyFlagship || model.isLatestCheckpoint) && isCurrent(model)
}

/**
 * What a model actually produces.
 *
 * Pairing on "flagship" alone generates comparisons like "GPT-6.1 Sol vs Grok
 * Voice 3.0": one writes prose, the other speaks aloud. That is not a hard
 * comparison, it is two different products in one table. Pairs are formed only
 * inside one output class, so a reader never lands on a page that compares an
 * image generator with a reasoning model.
 */
export type OutputClass = "text" | "image" | "video" | "speech" | "transcription"

export function outputClass(model: ModelItem): OutputClass {
  const haystack = `${model.categoryLabel} ${model.name}`.toLowerCase()
  if (/transcrib|speech[- ]to[- ]text/.test(haystack)) return "transcription"
  if (/speech|voice|\blive\b/.test(haystack)) return "speech"
  if (/video/.test(haystack)) return "video"
  if (/image|imagen|banana/.test(haystack)) return "image"
  return "text"
}

export const OUTPUT_CLASS_LABEL: Record<OutputClass, string> = {
  text: "Text models",
  image: "Image models",
  video: "Video models",
  speech: "Voice models",
  transcription: "Transcription models",
}

/** Canonical, order-independent slug so /compare/a-vs-b == /compare/b-vs-a. */
export function compareSlug(aId: string, bId: string): string {
  return [aId, bId].sort().join("-vs-")
}

export function compareHref(a: ModelItem, b: ModelItem): string {
  return `/compare/${compareSlug(a.id, b.id)}`
}

/** True when the two models are the same kind of product and can be compared. */
export function isComparablePair(a: ModelItem, b: ModelItem): boolean {
  return a.companyId !== b.companyId && outputClass(a) === outputClass(b)
}

/**
 * Cross-lab pairs only, and only within one output class. A comparison between
 * two checkpoints from the same laboratory is a product question ("Pro or
 * Flash?"), not a competitive one, and those already have a home on the lab
 * page.
 */
export function comparisonPairs(models: ModelItem[]): { a: ModelItem; b: ModelItem }[] {
  const notable = models
    .filter(isComparable)
    .slice()
    .sort((x, y) => x.id.localeCompare(y.id))

  const pairs: { a: ModelItem; b: ModelItem }[] = []
  for (let i = 0; i < notable.length; i++) {
    for (let j = i + 1; j < notable.length; j++) {
      if (!isComparablePair(notable[i], notable[j])) continue
      pairs.push({ a: notable[i], b: notable[j] })
    }
  }
  return pairs
}

/** Resolve a slug against the real pair set - never string-split a slug. */
export function resolveComparison(
  slug: string,
  models: ModelItem[],
): { a: ModelItem; b: ModelItem } | null {
  const target = slug.toLowerCase()
  for (const pair of comparisonPairs(models)) {
    if (compareSlug(pair.a.id, pair.b.id) === target) return pair
  }
  return null
}

/* ------------------------------------------------------------------ */
/* Comparison content                                                  */
/* ------------------------------------------------------------------ */

export interface ComparisonFact {
  label: string
  a: string
  b: string
  /** Only set when the two values are genuinely comparable. */
  edge?: "a" | "b" | "tie"
}

export interface BenchmarkRowView {
  label: string
  a: string
  b: string
  edge: "a" | "b" | "tie"
}

export interface Comparison {
  facts: ComparisonFact[]
  benchmarks: BenchmarkRow[]
  withheld: WithheldBenchmark[]
  /**
   * Material differences only, with the size of each gap. A five cent price
   * difference and a three times larger output ceiling are not the same kind
   * of fact, so the magnitude is carried alongside the values instead of being
   * left for the reader to divide.
   */
  differences: DifferenceRow[]
  /** Axes where the two records are effectively equal, so they decide nothing. */
  identical: string[]
  /** What the benchmark evidence can and cannot support. */
  evidenceNote: string
  /** Three sentences an answer engine can quote, in the same order as the page. */
  summary: string
  pickA: string[]
  pickB: string[]
  faq: { q: string; a: string }[]
}

export interface DifferenceRow {
  label: string
  a: string
  b: string
  /** Magnitude, e.g. "2.9x", "17% cheaper", "vision input". */
  delta: string
  edge: "a" | "b"
}

/** First number in a spec string ("1,048,576 tokens" -> 1048576). */
export function tokenCount(value: string | undefined): number | null {
  if (!value) return null
  const match = value.replace(/,/g, "").match(/(\d+)/)
  if (!match) return null
  const n = Number(match[1])
  return Number.isFinite(n) && n > 0 ? n : null
}

function contextTokens(model: ModelItem): number | null {
  if (model.contextWindowTokens > 0) return model.contextWindowTokens
  return tokenCount(model.contextWindow)
}

function money(value: number): string {
  return `$${value.toFixed(2)}`
}

function plural(n: number, word: string): string {
  return `${n.toLocaleString("en-US")} ${word}${n === 1 ? "" : "s"}`
}

/** "2.9x", "17%", "same". Used as the magnitude chip on a difference row. */
/**
 * How much larger `high` is than `low`.
 *
 * A real multiple reads as "3.4x". A small gap reads as the percentage above
 * the smaller value ("2%"), never as the smaller value's share of the larger
 * one, because "2% the ceiling of X" reads as "2% of X" and understates the
 * gap by an order of magnitude.
 */
function ratio(high: number, low: number): string {
  const r = high / low
  if (r >= 10) return `${Math.round(r)}x`
  if (r >= 1.15) return `${r.toFixed(1)}x`
  return `${Math.round((r - 1) * 100)}%`
}

/**
 * Is the gap big enough to be worth a row?
 *
 * Five percent. Below that a difference is measurement noise dressed as a
 * selling point: 128,000 against 131,072 output tokens, or eight dollars
 * against eight dollars five. Those belong in the "effectively equal" list, not
 * in a table of reasons to choose one model over another.
 */
const MATERIAL_GAP = 1.05

function material(high: number, low: number): boolean {
  if (low <= 0) return high > 0
  return high / low >= MATERIAL_GAP
}

function daysBetween(isoA: string, isoB: string): number {
  const a = Date.parse(isoA)
  const b = Date.parse(isoB)
  if (Number.isNaN(a) || Number.isNaN(b)) return 0
  return Math.round(Math.abs(a - b) / 86_400_000)
}

function weeksOrDays(days: number): string {
  if (days >= 14) {
    const weeks = Math.round(days / 7)
    return `${weeks} week${weeks === 1 ? "" : "s"}`
  }
  return `${days} day${days === 1 ? "" : "s"}`
}

export function buildComparison(a: ModelItem, b: ModelItem): Comparison {
  const facts: ComparisonFact[] = []

  // --- Context window -------------------------------------------------
  const aCtx = contextTokens(a)
  const bCtx = contextTokens(b)
  facts.push({
    label: "Context window",
    a: aCtx ? plural(aCtx, "token") : a.contextWindow,
    b: bCtx ? plural(bCtx, "token") : b.contextWindow,
    ...(aCtx && bCtx ? { edge: aCtx === bCtx ? "tie" : aCtx > bCtx ? "a" : "b" } : {}),
  })

  // --- Max output -----------------------------------------------------
  const aOut = tokenCount(a.maxOutputTokens)
  const bOut = tokenCount(b.maxOutputTokens)
  facts.push({
    label: "Max output",
    a: aOut ? plural(aOut, "token") : a.maxOutputTokens,
    b: bOut ? plural(bOut, "token") : b.maxOutputTokens,
    ...(aOut && bOut ? { edge: aOut === bOut ? "tie" : aOut > bOut ? "a" : "b" } : {}),
  })

  // --- Price ----------------------------------------------------------
  const tokenBilled = !a.pricingUnit && !b.pricingUnit
  if (tokenBilled) {
    const aIn = a.pricing.input
    const bIn = b.pricing.input
    const aOutPrice = a.pricing.output
    const bOutPrice = b.pricing.output
    facts.push({
      label: "Input price / 1M",
      a: money(aIn),
      b: money(bIn),
      edge: aIn === bIn ? "tie" : aIn < bIn ? "a" : "b",
    })
    facts.push({
      label: "Output price / 1M",
      a: money(aOutPrice),
      b: money(bOutPrice),
      edge: aOutPrice === bOutPrice ? "tie" : aOutPrice < bOutPrice ? "a" : "b",
    })
    facts.push({
      label: "1M in + 1M out",
      a: money(aIn + aOutPrice),
      b: money(bIn + bOutPrice),
      edge:
        aIn + aOutPrice === bIn + bOutPrice ? "tie" : aIn + aOutPrice < bIn + bOutPrice ? "a" : "b",
    })
  } else {
    facts.push({
      label: "Billing unit",
      a: a.pricingUnit ?? "per 1M tokens",
      b: b.pricingUnit ?? "per 1M tokens",
    })
  }

  // --- Access / licence ----------------------------------------------
  facts.push({
    label: "Weights",
    a: a.openWeights ? "Open" : "Closed (API only)",
    b: b.openWeights ? "Open" : "Closed (API only)",
    ...(a.openWeights !== b.openWeights ? { edge: a.openWeights ? "a" : "b" } : {}),
  })
  facts.push({ label: "Licence", a: a.license, b: b.license })

  // --- Release --------------------------------------------------------
  facts.push({
    label: "Released",
    a: a.releaseDate,
    b: b.releaseDate,
    edge:
      a.releaseDate === b.releaseDate ? "tie" : a.releaseDate > b.releaseDate ? "a" : "b",
  })

  // --- Modalities -----------------------------------------------------
  facts.push({
    label: "Inputs",
    a: a.modalities.join(", "),
    b: b.modalities.join(", "),
    ...(a.modalities.length !== b.modalities.length
      ? { edge: a.modalities.length > b.modalities.length ? "a" : "b" }
      : {}),
  })

  // --- Benchmarks: identical test AND version only ---------------------
  const { rows: benchmarks, withheld } = compareBenchmarks(a, b)

  // --- Reasons --------------------------------------------------------
  const pickA: string[] = []
  const pickB: string[] = []

  if (tokenBilled) {
    if (material(Math.max(a.pricing.input, b.pricing.input), Math.min(a.pricing.input, b.pricing.input))) {
      if (a.pricing.input < b.pricing.input) {
        pickA.push(`Cheaper input: ${money(a.pricing.input)} vs ${money(b.pricing.input)} per 1M tokens.`)
      } else {
        pickB.push(`Cheaper input: ${money(b.pricing.input)} vs ${money(a.pricing.input)} per 1M tokens.`)
      }
    }
  }

  if (aCtx && bCtx && material(Math.max(aCtx, bCtx), Math.min(aCtx, bCtx))) {
    const narrower = aCtx > bCtx ? b : a
    const list = aCtx > bCtx ? pickA : pickB
    list.push(
      `Larger context: ${plural(Math.max(aCtx, bCtx), "token")} vs ${plural(Math.min(aCtx, bCtx), "token")} on ${narrower.name}.`,
    )
  }

  if (aOut && bOut && material(Math.max(aOut, bOut), Math.min(aOut, bOut))) {
    const narrower = aOut > bOut ? b : a
    const list = aOut > bOut ? pickA : pickB
    list.push(
      `Longer single response: ${plural(Math.max(aOut, bOut), "output token")} vs ${plural(Math.min(aOut, bOut), "token")} on ${narrower.name}.`,
    )
  }

  if (a.openWeights !== b.openWeights) {
    const open = a.openWeights ? a : b
    const closed = a.openWeights ? b : a
    const list = a.openWeights ? pickA : pickB
    list.push(
      `Open weights under ${open.license}: self-hostable and auditable, unlike ${closed.name}.`,
    )
  }

  // Release recency is a fact, not an advantage. It stays in the difference
  // table and the FAQ, where a reader can weigh it, and it is deliberately not
  // a reason to choose a model: "released three weeks later" decides nothing.

  for (const row of benchmarks) {
    if (row.edge === "tie") continue
    const list = row.edge === "a" ? pickA : pickB
    list.push(`${row.label}: ${row.edge === "a" ? row.a : row.b} vs ${row.edge === "a" ? row.b : row.a} (lab-published).`)
  }

  if (pickA.length === 0) {
    pickA.push(
      `Nothing measured separates it from ${b.name}: price, context, output, modalities, weights and published benchmarks are equal or within 5%.`,
    )
  }
  if (pickB.length === 0) {
    pickB.push(
      `Nothing measured separates it from ${a.name}: price, context, output, modalities, weights and published benchmarks are equal or within 5%.`,
    )
  }

  // --- Differences, with magnitude -------------------------------------
  // Only axes with a real gap become rows. A 2% output ceiling or a five cent
  // price gap is not a difference a reader can act on, so it is listed as
  // effectively equal instead of being dressed up as a reason to choose.
  const differences: DifferenceRow[] = []
  const identical: string[] = []

  if (aCtx && bCtx) {
    if (aCtx === bCtx) {
      identical.push(`Context window (${plural(aCtx, "token")})`)
    } else if (!material(aCtx, bCtx)) {
      identical.push(`Context window (${plural(aCtx, "token")} and ${plural(bCtx, "token")})`)
    } else {
      const big = aCtx > bCtx ? a : b
      differences.push({
        label: "Context window",
        a: plural(aCtx, "token"),
        b: plural(bCtx, "token"),
        delta: `${ratio(Math.max(aCtx, bCtx), Math.min(aCtx, bCtx))} more on ${big.name}`,
        edge: aCtx > bCtx ? "a" : "b",
      })
    }
  }

  if (aOut && bOut) {
    if (aOut === bOut) {
      identical.push(`Max output (${plural(aOut, "token")})`)
    } else if (!material(aOut, bOut)) {
      identical.push(`Max output (${plural(aOut, "token")} and ${plural(bOut, "token")})`)
    } else {
      differences.push({
        label: "Max output",
        a: plural(aOut, "token"),
        b: plural(bOut, "token"),
        delta: `${ratio(Math.max(aOut, bOut), Math.min(aOut, bOut))} larger output ceiling on ${aOut > bOut ? a.name : b.name}`,
        edge: aOut > bOut ? "a" : "b",
      })
    }
  }

  if (tokenBilled) {
    const aTotal = a.pricing.input + a.pricing.output
    const bTotal = b.pricing.input + b.pricing.output
    if (aTotal === bTotal) {
      identical.push(`Price (${money(aTotal)} per 1M in plus 1M out)`)
    } else if (!material(aTotal, bTotal)) {
      identical.push(
        `Price (${money(aTotal)} and ${money(bTotal)} per 1M in plus 1M out)`,
      )
    } else {
      const cheap = aTotal < bTotal ? a : b
      const dear = aTotal < bTotal ? b : a
      differences.push({
        label: "Price, 1M in plus 1M out",
        a: money(aTotal),
        b: money(bTotal),
        delta: `${ratio(Math.max(aTotal, bTotal), Math.min(aTotal, bTotal))} cheaper on ${cheap.name}`,
        edge: aTotal < bTotal ? "a" : "b",
      })
      void dear
    }
  } else {
    differences.push({
      label: "Billing unit",
      a: a.pricingUnit ?? "per 1M tokens",
      b: b.pricingUnit ?? "per 1M tokens",
      delta: "different units, not comparable",
      edge: "a",
    })
  }

  if (a.openWeights !== b.openWeights) {
    const open = a.openWeights ? a : b
    differences.push({
      label: "Weights",
      a: a.openWeights ? "Open" : "Closed",
      b: b.openWeights ? "Open" : "Closed",
      delta: `self-hostable: ${open.name} only`,
      edge: a.openWeights ? "a" : "b",
    })
  } else {
    identical.push(a.openWeights ? `Open weights (${a.license} and ${b.license})` : "Closed weights")
  }

  const onlyInA = a.modalities.filter((m) => !b.modalities.includes(m))
  const onlyInB = b.modalities.filter((m) => !a.modalities.includes(m))
  if (onlyInA.length === 0 && onlyInB.length === 0) {
    identical.push(`Inputs (${a.modalities.join(", ")})`)
  } else if (onlyInA.length > 0 || onlyInB.length > 0) {
    const extra = onlyInA.length > 0 ? onlyInA : onlyInB
    differences.push({
      label: "Inputs",
      a: a.modalities.join(", "),
      b: b.modalities.join(", "),
      delta: `${extra.join(", ")} input on ${onlyInA.length > 0 ? a.name : b.name}`,
      edge: onlyInA.length > 0 ? "a" : "b",
    })
  }

  const releaseGap = daysBetween(a.releaseDate, b.releaseDate)
  if (releaseGap >= 14) {
    const newer = a.releaseDate > b.releaseDate ? a : b
    differences.push({
      label: "Released",
      a: a.releaseDate,
      b: b.releaseDate,
      delta: `${newer.name} is newer by ${weeksOrDays(releaseGap)}`,
      edge: a.releaseDate > b.releaseDate ? "a" : "b",
    })
  } else {
    identical.push(`Release date (${a.releaseDate} and ${b.releaseDate})`)
  }

  // --- What the benchmark evidence supports ----------------------------
  const evidenceNote =
    benchmarks.length > 0
      ? `${benchmarks.length} benchmark${benchmarks.length === 1 ? "" : "s"} can be placed side by side: ${benchmarks.map((row) => row.label).join(", ")}.`
      : withheld.length > 0
        ? `No benchmark is directly comparable. Both laboratories report ${withheld.map((row) => row.label).join(", ")}, but not on the same test or version, so the scores are not placed side by side.`
        : "Neither record publishes a benchmark score."

  // --- Summary ---------------------------------------------------------
  // Ordered by how much the gap is likely to change a decision: price,
  // output ceiling, modality, self-hosting, context, then the axes where the
  // two are equal. Filler such as "both are tracked in ModelRegistry" is
  // deliberately absent.
  const sentences: string[] = []

  if (tokenBilled) {
    const aTotal = a.pricing.input + a.pricing.output
    const bTotal = b.pricing.input + b.pricing.output
    if (aTotal !== bTotal && material(Math.max(aTotal, bTotal), Math.min(aTotal, bTotal))) {
      const cheap = aTotal < bTotal ? a : b
      const dear = aTotal < bTotal ? b : a
      sentences.push(
        `${cheap.name} costs less per token: ${money(cheap.pricing.input)} in and ${money(cheap.pricing.output)} out per 1M, against ${money(dear.pricing.input)} in and ${money(dear.pricing.output)} out.`,
      )
    } else {
      sentences.push(
        `Both list about the same price, ${money(a.pricing.input)} in and ${money(a.pricing.output)} out against ${money(b.pricing.input)} in and ${money(b.pricing.output)} out per 1M tokens.`,
      )
    }
  } else {
    sentences.push(
      `The two are billed in different units (${a.name}: ${a.pricingUnit ?? "per 1M tokens"}, ${b.name}: ${b.pricingUnit ?? "per 1M tokens"}), so no per-token price comparison is offered.`,
    )
  }

  if (aOut && bOut && material(Math.max(aOut, bOut), Math.min(aOut, bOut))) {
    const wider = aOut > bOut ? a : b
    const narrower = aOut > bOut ? b : a
    sentences.push(
      `${wider.name} allows ${plural(Math.max(aOut, bOut), "output token")} in one response, ${ratio(Math.max(aOut, bOut), Math.min(aOut, bOut))} larger than the ceiling of ${narrower.name} at ${plural(Math.min(aOut, bOut), "token")}.`,
    )
  }

  if (onlyInA.length > 0 || onlyInB.length > 0) {
    const extra = onlyInA.length > 0 ? onlyInA : onlyInB
    const holder = onlyInA.length > 0 ? a : b
    const other = onlyInA.length > 0 ? b : a
    sentences.push(
      `${holder.name} accepts ${extra.join(" and ")} input; ${other.name} does not.`,
    )
  }

  if (a.openWeights !== b.openWeights) {
    sentences.push(
      `Only ${a.openWeights ? a.name : b.name} publishes weights, so only that one can be self-hosted or audited.`,
    )
  }

  if (aCtx && bCtx && material(Math.max(aCtx, bCtx), Math.min(aCtx, bCtx))) {
    sentences.push(
      `${aCtx > bCtx ? a.name : b.name} carries the larger context window at ${plural(Math.max(aCtx, bCtx), "token")} against ${plural(Math.min(aCtx, bCtx), "token")}.`,
    )
  }

  if (identical.length > 0) {
    sentences.push(
      `No decision turns on ${identical
        .map((item) => item.replace(/\s*\(.*\)$/, "").toLowerCase())
        .join(", ")}.`,
    )
  }

  sentences.push(evidenceNote)

  const summary = sentences.slice(0, 4).join(" ")

  // --- FAQ ------------------------------------------------------------
  const faq: { q: string; a: string }[] = []

  faq.push({
    q: `Is ${a.name} cheaper than ${b.name}?`,
    a: tokenBilled
      ? a.pricing.input === b.pricing.input
        ? `${a.name} and ${b.name} list the same input price of ${money(a.pricing.input)} per 1M tokens. Output is ${money(a.pricing.output)} and ${money(b.pricing.output)} per 1M tokens respectively.`
        : `Yes for ${a.pricing.input < b.pricing.input ? a.name : b.name}. ${a.name} lists ${money(a.pricing.input)} in / ${money(a.pricing.output)} out per 1M tokens; ${b.name} lists ${money(b.pricing.input)} in / ${money(b.pricing.output)} out. Both are official list prices recorded with a source link.`
      : `The two models are not billed in the same unit (${a.name}: ${a.pricingUnit ?? "per 1M tokens"}; ${b.name}: ${b.pricingUnit ?? "per 1M tokens"}), so a per-token comparison would be misleading.`,
  })

  faq.push({
    q: `Which has the larger context window, ${a.name} or ${b.name}?`,
    a:
      aCtx && bCtx
        ? aCtx === bCtx
          ? `They are equal: both accept ${plural(aCtx, "token")} of context.`
          : `${aCtx > bCtx ? a.name : b.name} accepts ${plural(Math.max(aCtx, bCtx), "token")}; ${aCtx > bCtx ? b.name : a.name} accepts ${plural(Math.min(aCtx, bCtx), "token")}.`
        : `Only one record publishes a numeric context window: ${a.name} states "${a.contextWindow}" and ${b.name} states "${b.contextWindow}". ModelRegistry does not infer a figure that the laboratory has not published.`,
  })

  faq.push({
    q: `Is ${a.name} or ${b.name} open weights?`,
    a:
      a.openWeights === b.openWeights
        ? a.openWeights
          ? `Both are open weights, released under ${a.license} and ${b.license} respectively.`
          : `Neither publishes weights; both are closed API models (${a.license}; ${b.license}).`
        : `${a.openWeights ? a.name : b.name} publishes open weights under ${a.openWeights ? a.license : b.license}. ${a.openWeights ? b.name : a.name} is closed (${a.openWeights ? b.license : a.license}).`,
  })

  faq.push({
    q: `When were ${a.name} and ${b.name} released?`,
    a: `${a.name} was released on ${a.releaseDate} and ${b.name} on ${b.releaseDate}. ${a.releaseDate === b.releaseDate ? "They shipped on the same day." : `${a.releaseDate > b.releaseDate ? a.name : b.name} is the more recent release.`}`,
  })

  faq.push({
    q: `Do ${a.name} and ${b.name} report the same benchmarks?`,
    a:
      benchmarks.length > 0
        ? `They share ${benchmarks.length} benchmark${benchmarks.length === 1 ? "" : "s"} measured with an identical test and version: ${benchmarks.map((row) => row.label).join(", ")}. ${withheld.length > 0 ? `${withheld.length} further benchmark${withheld.length === 1 ? " is" : "s are"} reported by both laboratories but withheld from comparison because the test or version differs.` : "No benchmark reported by both was withheld."} All scores are laboratory-published and not independently reproduced.`
        : `No. ${withheld.length > 0 ? `Both laboratories publish a score for ${withheld.map((row) => row.label).join(", ")}, but not on the same test or version, so ModelRegistry does not place them side by side.` : "The two records do not publish a score for the same benchmark."} Comparing different evaluations would produce a ranking the evidence cannot support.`,
  })

  return { facts, benchmarks, withheld, differences, identical, evidenceNote, summary, pickA, pickB, faq }
}
