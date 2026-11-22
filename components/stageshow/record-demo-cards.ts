import type { ModelItem } from "@/data/models"
import { formatDate } from "@/lib/utils"

// Cards for the homepage demo, built on the server from the registry's own
// records so every string on screen is read from the dataset. Kept apart from
// the client component so the dataset never reaches the browser bundle: the
// demo needs six records, not four hundred kilobytes.

export const ROW_IDS = [
  "claude-fable-5-2",
  "gpt-6-1-sol",
  "grok-4-7",
  "mistral-large-4",
  "kimi-k3-1-pro",
  "qwen-3-8-2-4t-a95b",
] as const

// The story opens on START, the cursor opens TARGET, and the loop ends back on START.
export const START = "gpt-6-1-sol"
export const TARGET = "mistral-large-4"

export type Card = {
  id: string
  name: string
  lab: string
  released: string
  context: string
  input: string
  output: string
  publisher: string
  source: string
  checked: string
}

/** 1,000,000 → 1M, 1,048,576 → 1.05M, 500,000 → 500K. */
function compactTokens(n: number): string {
  if (n >= 1_000_000) return `${+(n / 1_000_000).toFixed(2)}M`
  return `${Math.round(n / 1_000)}K`
}

/** USD per 1M tokens: two decimals, more only under a dime. Matches the index. */
function usd(n: number): string {
  if (n === 0) return "Free"
  return n < 0.1 ? `$${n}` : `$${n.toFixed(2)}`
}

function toCard(model: ModelItem): Card | null {
  const source = model.sources[0]
  if (!source || model.contextWindowTokens <= 0 || model.pricingUnit || model.pricingCurrency) return null
  return {
    id: model.id,
    name: model.name,
    lab: model.companyName,
    released: formatDate(model.releaseDate),
    context: compactTokens(model.contextWindowTokens),
    input: usd(model.pricing.input),
    output: usd(model.pricing.output),
    publisher: source.publisher,
    source: source.title,
    checked: formatDate(model.lastVerifiedAt),
  }
}

/** Demo cards for the records the story uses; any record that cannot be shown honestly is left out. */
export function buildDemoCards(models: readonly ModelItem[]): Card[] {
  return ROW_IDS.flatMap((id) => {
    const model = models.find((m) => m.id === id)
    const card = model ? toCard(model) : null
    return card ? [card] : []
  })
}
