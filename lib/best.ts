import { type ModelItem, modelsData } from "@/data/models"
import { isCurrent } from "./currency"
import { INDEPENDENT_EVALUATOR, buildIndependentBoards, valueRows, type IndependentBoard } from "./independent"
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
  intelligenceIndex: {
    question: "Best AI model overall",
    use: "the evaluator's blend of nine tests across knowledge work, coding, science and general knowledge",
  },
  arenaText: {
    question: "Most preferred AI model in blind chat votes",
    use: "what real users prefer in blind side-by-side chats, which is taste and usefulness rather than correctness",
  },
  frontierCode: {
    question: "Best AI model for software engineering",
    use: "changes to real open-source repositories that a maintainer would merge",
  },
  terminalBench4: {
    question: "Best AI model for agentic command-line work",
    use: "hard multi-step terminal tasks",
  },
  hleDiamond: {
    question: "Best AI model for expert-level questions",
    use: "expert-written reasoning and knowledge questions",
  },
  critPt: {
    question: "Best AI model for research-level physics",
    use: "research-level physics problems solved with code",
  },
  terminalBenchScience: {
    question: "Best AI model for scientific workflows",
    use: "expert-authored research workflows run in a terminal",
  },
  automationBench: {
    question: "Best AI model for business workflow automation",
    use: "multi-step tasks across simulated business software",
  },
  aaBriefcase: {
    question: "Best AI model for long business deliverables",
    use: "spreadsheets, decks and memos produced over a long task",
  },
  omniscience: {
    question: "Most factually reliable AI model",
    use: "correct answers minus hallucinations, with no penalty for declining to answer",
  },
  gdpPdf: {
    question: "Best AI model for long professional documents",
    use: "reasoning over long real-world documents",
  },
}

/** Order shown on the page: the overall answer first, then by what people ask for most. */
const QUESTION_ORDER = [
  "intelligenceIndex",
  "arenaText",
  "frontierCode",
  "terminalBench4",
  "hleDiamond",
  "automationBench",
  "omniscience",
  "critPt",
  "terminalBenchScience",
  "aaBriefcase",
  "gdpPdf",
]

function money(value: number): string {
  if (value < 0.1) return `$${value.toFixed(3)}`
  return value < 1 ? `$${value.toFixed(2)}` : `$${value.toFixed(value % 1 === 0 ? 0 : 2)}`
}

function fromBoard(board: IndependentBoard): BestAnswer | null {
  const meta = QUESTION_FOR[board.info.key]
  if (!meta || board.entries.length === 0) return null
  const first = board.entries[0]
  const top = board.entries.slice(0, 3).map((entry) => ({
    model: entry.model,
    value: entry.score,
    rank: entry.rank,
  }))
  const tiedOthers = board.entries.filter((entry) => entry !== first && entry.tiedWithLeader)
  const tied = tiedOthers.length > 0

  const open = board.entries.find((entry) => entry.model.openWeights)
  const openLeader =
    open && !first.model.openWeights
      ? { model: open.model, value: open.score, rank: open.rank }
      : null

  const sampling = board.info.tasks && tiedOthers.length > 0
    ? `With ${board.info.tasks} tasks, the sampling error is large enough that ${tiedOthers.length} other model${tiedOthers.length === 1 ? "" : "s"} cannot be separated from ${first.model.name}.`
    : ""
  const lead = `${first.model.name} scores highest, ${first.score}`
  return {
    id: board.id,
    question: meta.question,
    answer:
      board.info.key === "arenaText"
        ? `${first.model.name} has the highest Elo, ${first.score}, of ${board.entries.length} current models in arena.ai's blind human-preference votes. ${sampling || (tiedOthers.length > 0 ? `${tiedOthers.length} other model${tiedOthers.length === 1 ? "" : "s"} sit within the printed error of it.` : "")}`.trim()
        : `On ${board.test}, ${lead}, of ${board.entries.length} current models, each run by ${INDEPENDENT_EVALUATOR.name} on the same tasks. ${sampling}`.trim(),
    measure: board.test,
    field: board.entries.length,
    entries: top,
    openLeader,
    tied,
    caveat: `${board.test} measures ${meta.use}. It is one test, and the evaluator's configuration for each model may differ in reasoning effort.`,
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
  const boards = buildIndependentBoards(models)
  const answers: BestAnswer[] = []
  for (const key of QUESTION_ORDER) {
    const board = boards.find((candidate) => candidate.info.key === key)
    if (!board) continue
    const answer = fromBoard(board)
    if (answer) answers.push(answer)
  }
  const value = valueAnswer()
  if (value) answers.push(value)
  const price = priceAnswer(current)
  if (price) answers.push(price)
  const context = contextAnswer(current)
  if (context) answers.push(context)
  return answers
}

/** Best result per dollar: the cheapest model on the cost frontier that is still near the top. */
function valueAnswer(): BestAnswer | null {
  const rows = valueRows().filter((row) => row.onFrontier)
  if (rows.length < 3) return null
  const sorted = [...rows].sort((a, b) => b.index - a.index)
  const entries = sorted.slice(0, 3).map((row, index) => ({
    model: row.model,
    value: `index ${row.index} at ${money(row.costPerTask)} per task`,
    rank: index + 1,
  }))
  const cheapestAbove50 = [...rows].filter((r) => r.index >= 50).sort((a, b) => a.costPerTask - b.costPerTask)[0]
  return {
    id: "value",
    question: "Best AI model for the money",
    answer: cheapestAbove50
      ? `${cheapestAbove50.model.name} is the cheapest model to score 50 or more on the independent Intelligence Index, at ${money(cheapestAbove50.costPerTask)} per task against ${money(sorted[0].costPerTask)} for ${sorted[0].model.name}, the highest scorer.`
      : `${sorted[0].model.name} scores highest on the cost frontier.`,
    measure: "Intelligence Index against evaluator cost per task",
    field: rows.length,
    entries,
    openLeader: null,
    tied: false,
    caveat:
      "The frontier lists models where no other model scores higher for less. Cost per task counts the reasoning tokens a model spends, so it is not the same as price per token.",
    href: "/score",
  }
}
