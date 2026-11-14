import { modelsData, type ModelItem } from "@/data/models"
import { isCurrent, currentSuccessor } from "@/lib/currency"
import { independentFor } from "@/lib/independent"
import { outputClass } from "@/lib/seo"

/**
 * "Alternatives to X" for one model: who is cheaper, who scores higher, who is
 * open-weights. Every figure is already in the registry; nothing is estimated.
 * A score is the independent Intelligence Index when one exists, otherwise the
 * row says it was not independently measured.
 */

export interface AlternativeRow {
  model: ModelItem
  /** Independent Intelligence Index, when measured. */
  index: number | null
  /** Evaluator cost per Intelligence Index task in USD, when measured. */
  costPerTask: number | null
  /** 3:1 input to output blend, USD per 1M tokens. */
  blended: number
}

export interface AlternativesView {
  model: ModelItem
  self: AlternativeRow
  successor: ModelItem | null
  cheaper: AlternativeRow[]
  stronger: AlternativeRow[]
  open: AlternativeRow[]
  /** The single best "same quality, less money" pick, when one exists. */
  bestSwap: AlternativeRow | null
  total: number
}

const blend = (m: ModelItem) => (3 * m.pricing.input + m.pricing.output) / 4

function row(model: ModelItem): AlternativeRow {
  const record = independentFor(model.id)
  const index = record?.values.intelligenceIndex
  return {
    model,
    index: typeof index === "number" ? index : null,
    costPerTask: typeof record?.costPerTask === "number" ? record.costPerTask : null,
    blended: blend(model),
  }
}

/** Models that get an alternatives page: token-priced text models. */
export function hasAlternatives(model: ModelItem): boolean {
  return outputClass(model) === "text" && !model.pricingUnit && model.pricing.input > 0 && model.pricing.output > 0
}

export function buildAlternatives(model: ModelItem, models: ModelItem[] = modelsData): AlternativesView | null {
  if (!hasAlternatives(model)) return null
  const self = row(model)
  const pool = models
    .filter((m) => m.id !== model.id && isCurrent(m) && hasAlternatives(m))
    .map(row)

  const cheaper = pool
    .filter((r) => r.blended < self.blended * 0.9)
    .sort((a, b) => (b.index ?? -1) - (a.index ?? -1) || a.blended - b.blended)
    .slice(0, 5)

  const stronger =
    self.index === null
      ? []
      : pool
          .filter((r) => r.index !== null && r.index > (self.index as number))
          .sort((a, b) => (a.index as number) - (b.index as number))
          .slice(0, 5)

  const open = pool
    .filter((r) => r.model.openWeights)
    .sort((a, b) => (b.index ?? -1) - (a.index ?? -1) || a.blended - b.blended)
    .slice(0, 5)

  // Same quality for less: within 3 index points of this model, at least 25% cheaper.
  const bestSwap =
    self.index === null
      ? null
      : pool
          .filter((r) => r.index !== null && Math.abs((r.index as number) - (self.index as number)) <= 3 && r.blended <= self.blended * 0.75)
          .sort((a, b) => a.blended - b.blended)[0] ?? null

  const total = new Set([...cheaper, ...stronger, ...open].map((r) => r.model.id)).size
  return { model, self, successor: currentSuccessor(model, models), cheaper, stronger, open, bestSwap, total }
}
