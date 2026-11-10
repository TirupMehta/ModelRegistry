import { type ModelItem, modelsData } from "@/data/models"
import { isCurrent } from "./currency"
import { buildLeaderboards, type Leaderboard } from "./leaderboards"
import { outputClass } from "./seo"

/**
 * "Best model for X", answered the only way the evidence allows.
 *
 * People search for a best model. A registry that answers "no single model is
 * best" and stops is correct and useless: the reader still has to choose. So
 * this module answers every question it can, and states exactly what the answer
 * is: the highest score reported on one named test, at one named version,
 * among the current models that report the same test. It never says "best
 * overall", never mixes tests, and always shows the size of the field and the
 * runners-up, because a lead of half a point is a tie.
 *
 * Price and context are facts on a record, not benchmark results, so they are
 * answered as lowest listed price and longest listed window.
 */

/** A lead smaller than this many points is reported as a tie, not a win. */
export const TIE_MARGIN_POINTS = 2

export interface BestEntry {
  model: ModelItem
  /** Display value, e.g. "77.9%", "$0.60 per 1M tokens". */
  value: string
  rank: number
}

export interface BestAnswer {
  id: string
  /** The question a reader asks, e.g. "Best AI model for coding". */
  question: string
  /** The answer in one sentence, safe to quote out of context. */
  answer: string
  /** What is measured, e.g. "SWE-bench DeepSWE v1.1". */
  measure: string
  /** Number of current models in the field. */
  field: number
  entries: BestEntry[]
  /** Best open-weights result when the leader is closed. */
  openLeader: BestEntry | null
  /** True when the top two are within TIE_MARGIN_POINTS. */
  tied: boolean
  caveat: string
  /** Where the full table lives. */
  href: string
}

const QUESTION_FOR: Record<string, { question: string; use: string }> = {
  sweBench: {
    question: "Best AI model for software engineering",
    use: "fixing real repository issues",
  },
  terminalBench: {
    question: "Best AI model for agentic command-line work",
    use: "multi-step terminal tasks",
  },
  gpqa: {
    question: "Best AI model for graduate-level science questions",
    use: "graduate-level science reasoning",
  },
  mmluPro: {
    question: "Best AI model for broad knowledge",
    use: "broad academic knowledge",
  },
}

function money(value: number): string {
  if (value < 0.1) return `$${value.toFixed(3)}`
  return value < 1 ? `$${value.toFixed(2)}` : `$${value.toFixed(value % 1 === 0 ? 0 : 2)}`
}

function fromBoard(board: Leaderboard): BestAnswer | null {
  const meta = QUESTION_FOR[board.key]
  if (!meta || board.entries.length === 0) return null
  const top = board.entries.slice(0, 3).map((entry) => ({
    model: entry.model,
    value: entry.reading.score,
    rank: entry.rank,
  }))
  const first = board.entries[0]
  const second = board.entries[1]
  const tied =
    Boolean(second) &&
    (first.reading.value as number) - (second.reading.value as number) < TIE_MARGIN_POINTS

  const open = board.entries.find((entry) => entry.model.openWeights)
  const openLeader =
    open && !first.model.openWeights
      ? { model: open.model, value: open.reading.score, rank: open.rank }
      : null

  const lead = tied
    ? `${first.model.name} (${first.reading.score}) and ${second.model.name} (${second.reading.score}) are tied within ${TIE_MARGIN_POINTS} points`
    : `${first.model.name} reports the highest score, ${first.reading.score}`

  return {
    id: board.id,
    question: `${meta.question}${board.versionStated ? ` (${board.test})` : ""}`,
    answer: `On ${board.test}, ${lead}, among ${board.entries.length} current models that report this test. Scores are laboratory-reported.`,
    measure: board.test,
    field: board.entries.length,
    entries: top,
    openLeader,
    tied,
    caveat: `${board.test} measures ${meta.use}. It is one test: a model that leads here can trail on another, and laboratories choose which tests to publish.`,
    href: "/score",
  }
}

function priceAnswer(models: ModelItem[]): BestAnswer | null {
  // Token-priced text models only; per-second and per-image pricing is not comparable.
  const field = models.filter(
    (model) => outputClass(model) === "text" && !model.pricingUnit && model.pricing.input > 0 && model.pricing.output > 0,
  )
  if (field.length < 4) return null
  // A 3:1 input to output mix: a stated, common chat ratio, not a quality claim.
  const blended = (model: ModelItem) => (3 * model.pricing.input + model.pricing.output) / 4
  const sorted = [...field].sort((a, b) => blended(a) - blended(b))
  const entries = sorted.slice(0, 3).map((model, index) => ({
    model,
    value: `${money(model.pricing.input)} in / ${money(model.pricing.output)} out per 1M`,
    rank: index + 1,
  }))
  const cheapest = sorted[0]
  return {
    id: "price",
    question: "Cheapest AI model by listed API price",
    answer: `${cheapest.name} has the lowest listed API price of ${field.length} current text models, ${money(cheapest.pricing.input)} input and ${money(cheapest.pricing.output)} output per 1M tokens, on a 3:1 input to output mix.`,
    measure: "Blended list price per 1M tokens",
    field: field.length,
    entries,
    openLeader: null,
    tied: false,
    caveat:
      "List price says nothing about quality, and cached, batch and provider-resold prices differ. A cheap model that fails your task costs more than a dear one that does not.",
    href: "/pricing",
  }
}

function contextAnswer(models: ModelItem[]): BestAnswer | null {
  const field = models.filter(
    (model) => outputClass(model) === "text" && model.contextWindowTokens > 0,
  )
  if (field.length < 4) return null
  const sorted = [...field].sort((a, b) => b.contextWindowTokens - a.contextWindowTokens)
  const top = sorted[0].contextWindowTokens
  const leaders = sorted.filter((model) => model.contextWindowTokens === top)
  const entries = sorted.slice(0, Math.max(3, leaders.length)).map((model, index) => ({
    model,
    value: `${model.contextWindowTokens.toLocaleString("en-US")} tokens`,
    rank: index + 1,
  }))
  const names = leaders.length > 4 ? `${leaders.length} models` : leaders.map((m) => m.name).join(", ")
  return {
    id: "context",
    question: "Longest context window",
    answer: `${names} list the longest context window of ${field.length} current text models: ${top.toLocaleString("en-US")} tokens.`,
    measure: "Listed context window",
    field: field.length,
    entries: entries.slice(0, 5),
    openLeader: null,
    tied: leaders.length > 1,
    caveat:
      "A larger window is not better recall. The listed size is an input limit, and accuracy across a long prompt is not measured by this figure.",
    href: "/leaderboard",
  }
}

export function buildBestAnswers(models: ModelItem[] = modelsData): BestAnswer[] {
  const current = models.filter(isCurrent)
  const boards = buildLeaderboards(models, { currentOnly: true })
  const answers: BestAnswer[] = []
  for (const board of boards) {
    const answer = fromBoard(board)
    if (answer) answers.push(answer)
  }
  const price = priceAnswer(current)
  if (price) answers.push(price)
  const context = contextAnswer(current)
  if (context) answers.push(context)
  return answers
}
