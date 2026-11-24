/**
 * Independent benchmark results.
 *
 * Every other score in this registry is published by the laboratory that built
 * the model, on a harness it chose, with settings it did not always disclose.
 * These are different: one independent evaluator, Artificial Analysis, ran the
 * same suite with the same harness on every model, through the provider's own
 * API, at about the same time. That is the only kind of score that can be
 * ranked across laboratories without trusting the seller.
 *
 * Each record names the exact Artificial Analysis page it was read from, the
 * configuration that page reports (reasoning effort), and the retrieval date.
 * A value is copied as printed on that page. Nothing here is estimated, and a
 * blank is a number the page did not show, never a zero.
 *
 * Artificial Analysis may revise any figure, so `retrievedAt` is the age of the
 * evidence, not a live reading.
 */

export type IndependentBenchmarkKey =
  | "intelligenceIndex"
  | "aaBriefcase"
  | "automationBench"
  | "terminalBench4"
  | "frontierCode"
  | "omniscience"
  | "gdpPdf"
  | "hleDiamond"
  | "critPt"
  | "terminalBenchScience"
  | "arenaText"

export interface IndependentBenchmarkInfo {
  key: IndependentBenchmarkKey
  label: string
  /** What a reader would call the capability. */
  domain: string
  unit: "index" | "percent" | "elo" | "net"
  /**
   * Whether the evaluator keeps the test set private, as its methodology page
   * states in the Private column. null: not a task test (human votes) or not a
   * test at all (the composite).
   */
  access: "private" | "public" | null
  /** Task count when the evaluator states it; used for the sampling-error band. */
  tasks: number | null
  /** One plain sentence on what is measured. */
  measures: string
}

export const INDEPENDENT_BENCHMARKS: IndependentBenchmarkInfo[] = [
  {
    key: "arenaText",
    label: "Text Arena (human preference)",
    domain: "Human preference in blind chat votes",
    unit: "elo",
    access: null,
    tasks: null,
    measures:
      "Elo from millions of blind side-by-side votes by real users on arena.ai. It measures what people prefer, not whether an answer is correct, and a second, different evaluator from the task benchmarks.",
  },
  {
    key: "intelligenceIndex",
    label: "AA Intelligence Index v5.0.1",
    domain: "Overall (evaluator's composite)",
    unit: "index",
    access: null,
    tasks: null,
    measures:
      "Artificial Analysis's own weighted composite of nine evaluations. It is their number and their weighting, not ModelRegistry's.",
  },
  {
    key: "terminalBench4",
    label: "Terminal-Bench 4.0",
    domain: "Agentic command-line work",
    unit: "percent",
    access: "public",
    tasks: 66,
    measures: "66 hard multi-step terminal tasks across software, ML, security and operations.",
  },
  {
    key: "frontierCode",
    label: "FrontierCode 2.0",
    domain: "Software engineering",
    unit: "percent",
    access: "private",
    tasks: 132,
    measures:
      "132 private tasks in real open-source repositories, graded on whether a maintainer would merge the change.",
  },
  {
    key: "hleDiamond",
    label: "HLE-Diamond",
    domain: "Expert knowledge and reasoning",
    unit: "percent",
    access: "public",
    tasks: 1000,
    measures: "1,000 expert-level questions from Humanity's Last Exam, half reasoning and half knowledge.",
  },
  {
    key: "critPt",
    label: "CritPt v2 (Hard)",
    domain: "Research-level physics",
    unit: "percent",
    access: "private",
    tasks: 70,
    measures: "70 research-level physics challenges solved with a code tool.",
  },
  {
    key: "terminalBenchScience",
    label: "Terminal-Bench-Science 0.1",
    domain: "Scientific workflows",
    unit: "percent",
    access: "public",
    tasks: 70,
    measures: "70 expert-authored research workflows completed in a terminal.",
  },
  {
    key: "automationBench",
    label: "AutomationBench",
    domain: "Business workflow automation",
    unit: "percent",
    access: "private",
    tasks: null,
    measures: "Share of objectives completed across simulated SaaS workflows without breaking a guardrail.",
  },
  {
    key: "aaBriefcase",
    label: "AA-Briefcase v1.1",
    domain: "Agentic knowledge work",
    unit: "elo",
    access: "private",
    tasks: null,
    measures: "Long-horizon business deliverables (spreadsheets, decks, memos), reported as an Elo.",
  },
  {
    key: "omniscience",
    label: "AA-Omniscience v1.1",
    domain: "Factual reliability",
    unit: "net",
    access: "private",
    tasks: null,
    measures:
      "Net score from -100 to 100: correct answers minus hallucinations, with no penalty for declining to answer.",
  },
  {
    key: "gdpPdf",
    label: "GDP.pdf",
    domain: "Long professional documents",
    unit: "percent",
    access: "public",
    tasks: null,
    measures: "Reasoning over long real-world documents against detailed task criteria.",
  },
]

export interface IndependentRecord {
  /** Registry model id. */
  modelId: string
  /** Name and configuration exactly as the evaluator labels it. */
  evaluatedAs: string
  /** The page the figures were read from. */
  sourceUrl: string
  values: Partial<Record<IndependentBenchmarkKey, number>>
  /** Evaluator's weighted cost per Intelligence Index task, USD. */
  costPerTask?: number
  /** Evaluator's time per Intelligence Index task, minutes. */
  minutesPerTask?: number
  /** True when the page printed rounded whole-number percentages. */
  rounded?: boolean
  /** Page the Text Arena figure was read from, when this record carries one. */
  arenaSourceUrl?: string
  /**
   * Date this row was read, when it is newer than the suite-wide retrieval.
   * Omitted means INDEPENDENT_EVALUATOR.retrievedAt.
   */
  retrievedAt?: string
  /** 95% half-width printed by the evaluator, in the score's own units. */
  uncertainty?: Partial<Record<IndependentBenchmarkKey, number>>
  /** Results that cannot be ranked inside the registry (too few models), shown as printed. */
  extras?: { label: string; value: string; note: string; sourceUrl: string }[]
}

/** Where each test's private or public status was read, and when. */
export const TEST_ACCESS_SOURCE = {
  url: "https://artificialanalysis.ai/methodology/intelligence-benchmarking",
  checkedAt: "2026-11-20",
  statement:
    "Artificial Analysis lists AA-Briefcase, AutomationBench-AA, FrontierCode-AA 2.0, CritPt v2 and AA-Omniscience as private test sets, and GDP.pdf, Terminal-Bench 4.0, Terminal-Bench-Science and HLE-Diamond as not private.",
} as const

export const INDEPENDENT_EVALUATOR = {
  name: "Artificial Analysis",
  url: "https://artificialanalysis.ai/evaluations/artificial-analysis-intelligence-index",
  suite: "Intelligence Index v5.0.1",
  retrievedAt: "2026-11-24",
  method:
    "Same suite, same harness, run by the evaluator through each provider's own API. Reasoning effort is the setting the evaluator reports for the model, which differs by model.",
} as const

/** arena.ai blocks automated reads, so this source is refreshed by hand; asOf is the board's own date. */
export const ARENA_EVALUATOR = {
  name: "arena.ai Text Arena",
  url: "https://arena.ai/leaderboard/text",
  asOf: "2026-11-09",
} as const

const ARENA = "https://arena.ai/leaderboard/text"
// Comparison pages hold exactly two models. Four-way links stop resolving when
// the evaluator retires any one of the four, so every row below names a pair
// that still lists the configuration it was read for.
const AA = "https://artificialanalysis.ai/models/comparisons/"
const AA_PAGE = "https://artificialanalysis.ai/models/"
const G_FLASH = `${AA}glm-5-3-flash-vs-qwen3-8-2-4t-a95b`
const G_BEAM = `${AA}reflection-beam-vs-gpt-6-2-astra`
const G_GPT62 = `${AA}gpt-6-2-sol-vs-gpt-6-2-astra`
const G_OPUS = `${AA}claude-opus-5-5-vs-claude-fable-5-2`
const G_GROK = `${AA}grok-4-7-vs-gpt-6-2-astra`
const G_FABLE = `${AA}claude-fable-5-2-vs-claude-sonnet-5-5`
const G_HAIKU = `${AA}claude-haiku-5-5-vs-claude-fable-5-2`
const G_KIMI = `${AA}deepseek-v4-1-flash-1017-vs-kimi-k3-1-pro`
const G_MIMO = `${AA}mimo-v2-6-pro-vs-mimo-v2-6-flash`
const G_TERRA = `${AA}gpt-6-1-terra-vs-gemini-4-argon`
const G_MUSE = `${AA}muse-ember-vs-muse-wonder`
const G_GLM = `${AA}glm-5-3-vs-minimax-m3-1-flash`
const G_MISTRAL = `${AA}mistral-large-4-vs-nemotron-3-5-super-vl`
const G_DSPRO = `${AA}deepseek-v4-pro-vs-nvidia-nemotron-3-ultra-550b-a55b`
const G_SPARK = `${AA}muse-spark-open-vs-claude-opus-5-5`
const G_HY4 = `${AA}tencent-hy4-vs-claude-opus-5-5`
const G_CARBON = "https://artificialanalysis.ai/models/releases/comparisons/claude-fable-5-2-vs-gemini-4-carbon"
const G_HYDROGEN = "https://artificialanalysis.ai/models/releases/comparisons/claude-fable-5-2-vs-gemini-4-hydrogen"
const G_NEON = "https://artificialanalysis.ai/models/releases/comparisons/claude-fable-5-2-vs-gemini-4-neon"
const G_QWEN4MAX = "https://artificialanalysis.ai/models/releases/comparisons/qwen4-max-vs-claude-fable-5-2"

export const independentRecords: IndependentRecord[] = [
  {
    modelId: "claude-fable-5-2",
    evaluatedAs: "Claude Fable 5.2 (Max, Default Fallback)",
    sourceUrl: G_FABLE,
    values: { intelligenceIndex: 65, aaBriefcase: 1783, automationBench: 76.4, terminalBench4: 59.6, frontierCode: 48.8, omniscience: 67, gdpPdf: 24.2, hleDiamond: 80.2, critPt: 76.5, terminalBenchScience: 73.3 },
    costPerTask: 26.54,
    minutesPerTask: 41,
  },
  {
    modelId: "claude-opus-5-5",
    evaluatedAs: "Claude Opus 5.5 (Max, Default Fallback)",
    sourceUrl: G_OPUS,
    values: { intelligenceIndex: 59, aaBriefcase: 1797, automationBench: 69.5, terminalBench4: 59.6, frontierCode: 46.4, omniscience: 48, gdpPdf: 26.2, hleDiamond: 67.9, critPt: 68.0, terminalBenchScience: 59.0 },
    costPerTask: 10.04,
    minutesPerTask: 24.8,
  },
  {
    modelId: "claude-sonnet-5-5",
    evaluatedAs: "Claude Sonnet 5.5 (Max, Default Fallback)",
    sourceUrl: G_FABLE,
    values: { intelligenceIndex: 55, aaBriefcase: 1813, automationBench: 71.8, terminalBench4: 63.6, frontierCode: 41.7, omniscience: 30, gdpPdf: 25.8, hleDiamond: 53.3, critPt: 59.0, terminalBenchScience: 53.3 },
    costPerTask: 10.02,
    minutesPerTask: 31.1,
  },
  {
    modelId: "claude-haiku-5-5",
    evaluatedAs: "Claude Haiku 5.5 (Max)",
    sourceUrl: G_HAIKU,
    values: { intelligenceIndex: 36, aaBriefcase: 1571, automationBench: 35.4, terminalBench4: 32.8, frontierCode: 34.9, omniscience: 12, gdpPdf: 20.8, hleDiamond: 29.6, critPt: 43.5, terminalBenchScience: 20.0 },
    costPerTask: 0.41,
    minutesPerTask: 14.6,
  },
  {
    modelId: "gpt-6-2-astra",
    evaluatedAs: "GPT-6.2 Astra (Max)",
    sourceUrl: G_GPT62,
    values: { intelligenceIndex: 62, aaBriefcase: 1643, automationBench: 77.2, terminalBench4: 64.1, frontierCode: 45.4, omniscience: 50, gdpPdf: 29.8, hleDiamond: 72.2, critPt: 71.5, terminalBenchScience: 78.1 },
    costPerTask: 4.0,
    minutesPerTask: 14,
  },
  {
    modelId: "gpt-6-2-sol",
    evaluatedAs: "GPT-6.2 Sol (Max)",
    sourceUrl: G_GPT62,
    values: { intelligenceIndex: 57, aaBriefcase: 1612, automationBench: 71.3, terminalBench4: 60.1, frontierCode: 44.4, omniscience: 40, gdpPdf: 30.0, hleDiamond: 64.0, critPt: 62.5, terminalBenchScience: 67.6 },
    costPerTask: 1.01,
    minutesPerTask: 10.1,
  },
  {
    modelId: "gpt-6-astra",
    evaluatedAs: "GPT-6 Astra (Max)",
    sourceUrl: `${AA_PAGE}gpt-6-astra`,
    values: { intelligenceIndex: 57, aaBriefcase: 1569, automationBench: 68.5, terminalBench4: 59.1, frontierCode: 42.4, omniscience: 42, gdpPdf: 31.0, hleDiamond: 63.8, critPt: 70.5, terminalBenchScience: 63.3 },
    costPerTask: 6.24,
    minutesPerTask: 18.9,
  },
  {
    modelId: "gpt-6-1-sol",
    evaluatedAs: "GPT-6.1 Sol (Max)",
    sourceUrl: `${AA_PAGE}gpt-6-1-sol`,
    values: { intelligenceIndex: 55, aaBriefcase: 1555, automationBench: 64.9, terminalBench4: 56.1, frontierCode: 40.6, omniscience: 42, gdpPdf: 31.0, hleDiamond: 58.8, critPt: 69.5, terminalBenchScience: 58.1 },
    costPerTask: 1.27,
    minutesPerTask: 23,
  },
  {
    modelId: "gpt-6-1-terra",
    evaluatedAs: "GPT-6.1 Terra (Max)",
    sourceUrl: G_TERRA,
    values: { intelligenceIndex: 51, aaBriefcase: 1399, automationBench: 60.2, terminalBench4: 55.6, frontierCode: 42.3, omniscience: 30, gdpPdf: 28.6, hleDiamond: 47.3, critPt: 68.0, terminalBenchScience: 57.6 },
    costPerTask: 0.96,
    minutesPerTask: 14.1,
  },
  {
    modelId: "gemini-4-argon",
    evaluatedAs: "Gemini 4 Argon (High)",
    sourceUrl: G_TERRA,
    values: { intelligenceIndex: 50, aaBriefcase: 1484, automationBench: 77.5, terminalBench4: 57.1, frontierCode: 25.7, omniscience: 46, gdpPdf: 21.8, hleDiamond: 56.7, critPt: 52.5, terminalBenchScience: 52.9 },
    costPerTask: 9.95,
    minutesPerTask: 23.4,
  },
  {
    modelId: "gemini-4-carbon",
    evaluatedAs: "Gemini 4 Carbon (High)",
    sourceUrl: G_CARBON,
    values: { intelligenceIndex: 60, aaBriefcase: 1611, automationBench: 77.8, terminalBench4: 65.2, frontierCode: 40.6, omniscience: 54, gdpPdf: 28.4, hleDiamond: 69.1, critPt: 69.0, terminalBenchScience: 64.8 },
    costPerTask: 7.76,
    minutesPerTask: 25.6,
  },
  {
    modelId: "gemini-4-hydrogen",
    evaluatedAs: "Gemini 4 Hydrogen (Xhigh)",
    sourceUrl: G_HYDROGEN,
    retrievedAt: "2026-11-13",
    values: { intelligenceIndex: 54, aaBriefcase: 1567, automationBench: 76.1, terminalBench4: 53.5, frontierCode: 39.0, omniscience: 46, gdpPdf: 27.6, hleDiamond: 58.8, critPt: 66.0, terminalBenchScience: 49.5 },
    costPerTask: 3.16,
    minutesPerTask: 13.7,
  },
  {
    modelId: "gemini-4-neon",
    evaluatedAs: "Gemini 4 Neon (Xhigh)",
    sourceUrl: G_NEON,
    retrievedAt: "2026-11-19",
    values: { intelligenceIndex: 61, aaBriefcase: 1699, automationBench: 79.3, terminalBench4: 63.6, frontierCode: 44.4, omniscience: 55, gdpPdf: 28.0, hleDiamond: 71.3, critPt: 60.5, terminalBenchScience: 70.0 },
    costPerTask: 6.44,
    minutesPerTask: 21.5,
  },
  {
    // One column, no reasoning variants: the evaluator lists the model once, at
    // its default reasoning effort, which Alibaba documents as "high".
    modelId: "qwen4-max",
    evaluatedAs: "Qwen4 Max",
    sourceUrl: G_QWEN4MAX,
    retrievedAt: "2026-11-19",
    values: { intelligenceIndex: 43, aaBriefcase: 1686, automationBench: 72.6, terminalBench4: 48.5, frontierCode: 26.5, omniscience: 28, gdpPdf: 26.2, hleDiamond: 44.9, critPt: 43, terminalBenchScience: 23.3 },
    costPerTask: 3.27,
    minutesPerTask: 30.8,
  },
  {
    modelId: "gemini-3-8-flash",
    evaluatedAs: "Gemini 3.8 Flash (High)",
    sourceUrl: `${AA_PAGE}gemini-3-8-flash`,
    values: { intelligenceIndex: 31, aaBriefcase: 1203, automationBench: 59.9, terminalBench4: 19.7, frontierCode: 18.7, omniscience: 23, gdpPdf: 21.0, hleDiamond: 33.1, critPt: 46.5, terminalBenchScience: 10.0 },
    costPerTask: 7.77,
    minutesPerTask: 16.2,
  },
  {
    modelId: "grok-4-7",
    evaluatedAs: "Grok 4.7 (Xhigh)",
    sourceUrl: G_GROK,
    values: { intelligenceIndex: 35, aaBriefcase: 1634, automationBench: 65.6, terminalBench4: 25.8, frontierCode: 28.7, omniscience: 31, gdpPdf: 20.0, hleDiamond: 23.2, critPt: 33.5, terminalBenchScience: 11.4 },
    costPerTask: 7.77,
    minutesPerTask: 23,
  },
  {
    modelId: "kimi-k3-1-pro",
    evaluatedAs: "Kimi K3.1 Pro",
    sourceUrl: G_KIMI,
    values: { intelligenceIndex: 46, aaBriefcase: 1672, automationBench: 73.3, terminalBench4: 67.2, frontierCode: 25.5, omniscience: 30, gdpPdf: 31.4, hleDiamond: 37.3, critPt: 49.5, terminalBenchScience: 34.3 },
    costPerTask: 3.68,
    minutesPerTask: 35.7,
  },
  {
    modelId: "deepseek-v4-1-flash-1017",
    evaluatedAs: "DeepSeek V4.1 Flash 1017 (Max)",
    sourceUrl: G_KIMI,
    values: { intelligenceIndex: 33, aaBriefcase: 1570, automationBench: 66.6, terminalBench4: 33.8, frontierCode: 28.5, omniscience: 1, gdpPdf: 17.2, hleDiamond: 25.3, critPt: 25.0, terminalBenchScience: 12.9 },
    costPerTask: 0.6,
    minutesPerTask: 13.8,
  },
  {
    modelId: "mimo-v2-6-pro",
    evaluatedAs: "MiMo-V2.6-Pro",
    sourceUrl: G_MIMO,
    values: { intelligenceIndex: 30, aaBriefcase: 1511, automationBench: 58.6, terminalBench4: 34.8, frontierCode: 24.0, omniscience: -4, gdpPdf: 19.2, hleDiamond: 15.2, critPt: 34.0, terminalBenchScience: 5.7 },
    costPerTask: 0.26,
    minutesPerTask: 49.3,
  },
  {
    modelId: "mimo-v2-6-flash",
    evaluatedAs: "MiMo-V2.6-Flash",
    sourceUrl: G_MIMO,
    values: { intelligenceIndex: 27, aaBriefcase: 1490, automationBench: 64.1, terminalBench4: 22.7, frontierCode: 21.6, omniscience: -11, gdpPdf: 9.0, hleDiamond: 13.7, critPt: 29.5, terminalBenchScience: 4.3 },
    costPerTask: 0.13,
    minutesPerTask: 55.3,
  },
  {
    modelId: "muse-ember",
    evaluatedAs: "Muse Ember (Max)",
    sourceUrl: G_MUSE,
    values: { intelligenceIndex: 36, aaBriefcase: 1519, automationBench: 68.1, terminalBench4: 40.9, frontierCode: 27.2, omniscience: 7, gdpPdf: 22.8, hleDiamond: 25.1, critPt: 39.0, terminalBenchScience: 20.0 },
    costPerTask: 0.14,
    minutesPerTask: 3.3,
  },
  {
    modelId: "muse-wonder",
    evaluatedAs: "Muse Wonder (Max)",
    sourceUrl: G_MUSE,
    values: { intelligenceIndex: 44, aaBriefcase: 1659, automationBench: 68.1, terminalBench4: 52.0, frontierCode: 27.9, omniscience: 25, gdpPdf: 30.6, hleDiamond: 39.0, critPt: 50.5, terminalBenchScience: 25.7 },
    costPerTask: 6.95,
    minutesPerTask: 15.4,
  },
  {
    modelId: "muse-spark-open",
    evaluatedAs: "Muse Spark Open (Xhigh)",
    sourceUrl: G_SPARK,
    values: { intelligenceIndex: 25, aaBriefcase: 1281, automationBench: 49.7, terminalBench4: 8.1, frontierCode: 7.6, omniscience: 26, gdpPdf: 18.6, hleDiamond: 26.3, critPt: 29.5, terminalBenchScience: 1.9 },
    costPerTask: 2.02,
    minutesPerTask: 6.3,
  },
  {
    modelId: "mistral-large-4",
    evaluatedAs: "Mistral Large 4 (High)",
    sourceUrl: G_MISTRAL,
    values: { intelligenceIndex: 26, aaBriefcase: 1347, automationBench: 57.8, terminalBench4: 24.7, frontierCode: 15.0, omniscience: 5, gdpPdf: 17.6, hleDiamond: 17.3, critPt: 27.0, terminalBenchScience: 4.3 },
    costPerTask: 2.06,
    minutesPerTask: 17.8,
  },
  {
    modelId: "minimax-m3-1-flash",
    evaluatedAs: "MiniMax-M3.1-Flash",
    sourceUrl: G_GLM,
    values: { intelligenceIndex: 29, aaBriefcase: 1475, automationBench: 72.5, terminalBench4: 25.8, frontierCode: 20.8, omniscience: -6, gdpPdf: 20.8, hleDiamond: 28.1, critPt: 32.5, terminalBenchScience: 3.3 },
    costPerTask: 0.49,
    minutesPerTask: 17.5,
  },
  {
    modelId: "nemotron-3-5-super-vl",
    evaluatedAs: "Nemotron 3.5 Super VL",
    sourceUrl: G_MISTRAL,
    values: { intelligenceIndex: 14, aaBriefcase: 999, automationBench: 14.8, terminalBench4: 0.0, frontierCode: 6.1, omniscience: -3, gdpPdf: 8.0, hleDiamond: 8.8, critPt: 13.5, terminalBenchScience: 0.0 },
    costPerTask: 0.48,
    minutesPerTask: 3.8,
  },
  {
    modelId: "glm-5-3",
    evaluatedAs: "GLM-5.3 (Max)",
    sourceUrl: G_GLM,
    values: { intelligenceIndex: 32, aaBriefcase: 1499, automationBench: 62.2, terminalBench4: 41.9, frontierCode: 21.6, omniscience: 6, gdpPdf: 11.2, hleDiamond: 17.9, critPt: 33.5, terminalBenchScience: 9.5 },
    costPerTask: 5.01,
    minutesPerTask: 27.8,
  },
  {
    modelId: "deepseek-v4-pro-0813",
    evaluatedAs: "DeepSeek V4 Pro 0813 (Max)",
    sourceUrl: G_DSPRO,
    values: { intelligenceIndex: 23, aaBriefcase: 1252, automationBench: 56.7, terminalBench4: 14.1, frontierCode: 17.1, omniscience: -6, gdpPdf: 11.4, hleDiamond: 19.5, critPt: 23.5, terminalBenchScience: 5.7 },
    costPerTask: 1.77,
    minutesPerTask: 19.1,
  },
  {
    modelId: "nemotron-3-ultra",
    evaluatedAs: "Nemotron 3 Ultra",
    sourceUrl: G_DSPRO,
    values: { intelligenceIndex: 12, aaBriefcase: 879, automationBench: 3.0, terminalBench4: 0.5, frontierCode: 1.1, omniscience: 3, gdpPdf: 5.0, hleDiamond: 8.5, critPt: 15.0, terminalBenchScience: 0.0 },
    costPerTask: 2.19,
    minutesPerTask: 4.2,
  },
  {
    modelId: "tencent-hy4",
    evaluatedAs: "Tencent Hy4",
    sourceUrl: G_HY4,
    rounded: true,
    values: { intelligenceIndex: 35, aaBriefcase: 1445, automationBench: 66, terminalBench4: 37, frontierCode: 31, omniscience: 5, gdpPdf: 22, hleDiamond: 33, critPt: 39, terminalBenchScience: 13 },
    costPerTask: 1.03,
    minutesPerTask: 13.9,
  },
  {
    modelId: "beam-1",
    evaluatedAs: "Beam 1.0",
    sourceUrl: G_BEAM,
    values: { intelligenceIndex: 18, aaBriefcase: 976, automationBench: 48.5, terminalBench4: 3.0, frontierCode: 5.5, omniscience: 2, gdpPdf: 11.6, hleDiamond: 12.8, critPt: 26.5, terminalBenchScience: 0.5 },
    costPerTask: 0.28,
    minutesPerTask: 1.8,
  },
  {
    modelId: "glm-5-3-flash",
    evaluatedAs: "GLM-5.3-Flash",
    sourceUrl: G_FLASH,
    values: { intelligenceIndex: 28, aaBriefcase: 1448, automationBench: 60.4, terminalBench4: 32.8, frontierCode: 17.6, omniscience: 1, gdpPdf: 15.4, hleDiamond: 18.2, critPt: 24.5, terminalBenchScience: 4.8 },
    costPerTask: 0.58,
    minutesPerTask: 36.5,
  },
  {
    // The evaluator has run only part of its suite on this model: no index, no cost,
    // no FrontierCode, CritPt or Terminal-Bench-Science yet. Published as a partial row.
    modelId: "qwen-3-8-2-4t-a95b",
    evaluatedAs: "Qwen3.8 2.4T A95B",
    sourceUrl: G_FLASH,
    values: { aaBriefcase: 1429, automationBench: 57.2, terminalBench4: 11.1, omniscience: 8, gdpPdf: 15.6, hleDiamond: 20.1 },
  },
]

/* Text Arena (arena.ai), leaderboard dated 2026-11-09. Score is Elo with the 95% half-width printed. */
const arenaText: Record<string, { elo: number; ci: number; label: string }> = {
  "gemini-4-carbon": { elo: 1526, ci: 10, label: "Gemini 4 Carbon (High), preliminary" },
  "gemini-4-argon": { elo: 1522, ci: 5, label: "Gemini 4 Argon (High)" },
  "muse-wonder": { elo: 1511, ci: 6, label: "Muse Wonder (Max)" },
  "claude-opus-5-5": { elo: 1506, ci: 6, label: "Claude Opus 5.5 (High)" },
  "gemini-3-8-flash": { elo: 1497, ci: 4, label: "Gemini 3.8 Flash (High), preliminary" },
  "glm-5-3": { elo: 1483, ci: 5, label: "GLM-5.3 (Max)" },
  "kimi-k3-1-pro": { elo: 1483, ci: 11, label: "Kimi K3.1 Pro (Max)" },
  "gpt-6-1-sol": { elo: 1482, ci: 6, label: "GPT-6.1 Sol (Max)" },
  "mimo-v2-6-pro": { elo: 1480, ci: 9, label: "MiMo-V2.6-Pro" },
  "gpt-6-astra": { elo: 1474, ci: 6, label: "GPT-6 Astra (Max)" },
  "claude-sonnet-5-5": { elo: 1472, ci: 6, label: "Claude Sonnet 5.5 (xHigh)" },
  "deepseek-v4-pro-0813": { elo: 1464, ci: 7, label: "DeepSeek-V4-Pro (High, 20260813)" },
  "mimo-v2-6-flash": { elo: 1448, ci: 5, label: "MiMo-V2.6-Flash" },
  "grok-4-7": { elo: 1442, ci: 5, label: "Grok 4.7 (xHigh)" },
  "beam-1": { elo: 1435, ci: 10, label: "Beam 1.0 501B A23B" },
  "mistral-large-4": { elo: 1423, ci: 9, label: "Mistral Large 4" },
  "claude-haiku-5-5": { elo: 1422, ci: 6, label: "Claude Haiku 5.5 (High)" },
  "nemotron-3-ultra": { elo: 1426, ci: 7, label: "NVIDIA-Nemotron-3-Ultra-550B-A55B (NVFP4)" },
  "nemotron-3-5-super-vl": { elo: 1415, ci: 10, label: "NVIDIA-Nemotron-3.5-Super-VL-120B-A12B (NVFP4), preliminary" },
}
for (const [modelId, row] of Object.entries(arenaText)) {
  const record = independentRecords.find((candidate) => candidate.modelId === modelId)
  if (!record) continue
  record.values.arenaText = row.elo
  record.arenaSourceUrl = ARENA
  record.uncertainty = { ...(record.uncertainty ?? {}), arenaText: row.ci }
}

/* Results with too few registry models to rank, shown on the model page as printed. */
const AA_T2I = "https://artificialanalysis.ai/image/leaderboard/text-to-image"
const AA_T2V = "https://artificialanalysis.ai/video/leaderboard/text-to-video"
const AA_S2S = "https://artificialanalysis.ai/models/speech-to-speech"
const AA_STT = "https://artificialanalysis.ai/speech-to-text"
const AA_DECISION_MS = "https://artificialanalysis.ai/decision-models/microsoft-decision-1-1"
const AA_DECISION_MS1 = "https://artificialanalysis.ai/decision-models/microsoft-decision-1"
const AA_DECISION_JEV = "https://artificialanalysis.ai/decision-models/jev-1-14"
const mediaExtras: Record<string, { label: string; value: string; note: string; sourceUrl: string }[]> = {
  "nano-banana-pro": [
    { label: "AA text-to-image arena", value: "Elo 1120 ±10, rank 11 to 18", note: "Printed as Nano Banana Pro (Gemini 3 Pro Image), 15,710 samples, AA-Image-T2I v2.1.", sourceUrl: AA_T2I },
  ],
  "veo-3-1": [
    { label: "AA text-to-video arena", value: "Elo 964 ±15, rank 25 to 26", note: "Printed as Veo 3.1.", sourceUrl: AA_T2V },
  ],
  "gemini-omni-1-2-flash": [
    { label: "AA text-to-video arena", value: "Elo 1154 ±14, rank 3 to 8", note: "Printed as Gemini Omni Flash 1.2.", sourceUrl: AA_T2V },
  ],
  "kling-3-0": [
    { label: "AA text-to-video arena", value: "Elo 1020 ±14, rank 20 to 21", note: "Printed as Kling 3.0 Omni 1080p (Pro). The Kling 3.0 1080p (Pro) variant is fixed at 1000 as the board's reference point.", sourceUrl: AA_T2V },
  ],
  "grok-voice-3": [
    { label: "AA speech-to-speech index", value: "86.9; arena Elo 1059; speech reasoning 98.5%; task success 94.8%", note: "Printed as Grok Voice 3.0.", sourceUrl: AA_S2S },
  ],
  "gemini-3-8-live-extended-thinking": [
    { label: "AA speech-to-speech index", value: "82.6; arena Elo 966; speech reasoning 97.7%; task success 89.1%", note: "Printed as Gemini 3.8 Live Extended Thinking (High).", sourceUrl: AA_S2S },
  ],
  "chatgpt-images-2-6": [
    { label: "AA text-to-image arena", value: "Sunburst Elo 1261 ±14, rank 1; Flare Elo 1227 ±12, rank 3 (2 to 4)", note: "Printed as GPT Image 2.6 Sunburst (max) and GPT Image 2.6 Flare (max).", sourceUrl: AA_T2I },
  ],
  "grok-voice-transcribe-2": [
    { label: "AA speech-to-text (non-streaming)", value: "AA-WER 2.3% (lower is better); speed factor 177.6; $1.67 per 1,000 minutes", note: "Printed as Grok Voice Transcribe 2.0.", sourceUrl: AA_STT },
  ],
  "runway-gen-4-5": [
    { label: "AA text-to-video arena", value: "Elo 914 ±16, rank 31 to 34; 4,188 samples, on the 61% of prompts within Runway's 1,000-character limit; $7.20 per minute", note: "Printed as Runway Gen-4.5 (720p).", sourceUrl: AA_T2V },
  ],
  "meta-muse-voice-transcribe": [
    { label: "AA diarization index (speech-to-text)", value: "Word diarization error rate 8.6% (lower is better), rank 4 of 23; $3 per 1,000 minutes; it has no row in the main AA-WER table", note: "Printed as Muse Voice Transcribe.", sourceUrl: AA_STT },
  ],
  // A decision model returns probabilities for fixed options, so the language-model tests do not apply.
  // Artificial Analysis scores it on its own Decision Index (25 decision models), which is not part of Meridian.
  "microsoft-decision-1-1": [
    { label: "AA Decision Index", value: "68, rank 11 of 25 decision models; 123 ms and $140 per 1M tasks; Microsoft-Decision-1 scored 62", note: "Printed as Microsoft-Decision-1.1.", sourceUrl: AA_DECISION_MS },
  ],
  "microsoft-decision-1": [
    { label: "AA Decision Index", value: "62, rank 17 of 25 decision models; 274 ms and $143 per 1M tasks", note: "Printed as Microsoft-Decision-1.", sourceUrl: AA_DECISION_MS1 },
  ],
  "jev-1-14": [
    { label: "AA Decision Index", value: "66, rank 14 of 25 decision models; 92 ms and $156 per 1M tasks", note: "Printed as Jev 1.14.", sourceUrl: AA_DECISION_JEV },
  ],
}
for (const [modelId, extras] of Object.entries(mediaExtras)) {
  independentRecords.push({
    modelId,
    evaluatedAs: extras[0].note.replace(/^Printed as /, "").replace(/.$/, ""),
    sourceUrl: extras[0].sourceUrl,
    values: {},
    extras,
  })
}

/**
 * Models the evaluator has no published result for. This is a defined state, not a gap:
 * it names the evaluator's pages that were searched and the day they were, and the weekly
 * refresh (scripts/refresh-independent.mjs) re-reads those pages. When a page starts showing
 * a result it says so, and the entry is replaced by a real row above. The completeness gate
 * accepts an entry only while `checkedAt` is within 30 days of the suite's retrieval date.
 */
export interface NotEvaluatedRecord {
  modelId: string
  evaluator: string
  /** The day the pages below were searched (YYYY-MM-DD). */
  checkedAt: string
  /** Evaluator pages that were searched. A /models/<slug> page is read for its Intelligence Index; any other page is searched for `names`. */
  checked: string[]
  /** How the model is written on the evaluator's pages. */
  names: string[]
  /** What was found, in one sentence. */
  note: string
}

const AA_MODEL_LIST = "https://artificialanalysis.ai/leaderboards/models"
export const notEvaluatedRecords: NotEvaluatedRecord[] = [
  { modelId: "tencent-hy4-flash", evaluator: "Artificial Analysis", checkedAt: "2026-11-24", names: ["Hy4 flash", "Tencent Hy4 flash"], checked: ["https://artificialanalysis.ai/models/hy4-flash", "https://artificialanalysis.ai/models/tencent-hy4-flash", AA_MODEL_LIST], note: "Both model-page slugs return 404 and the model list names only Hy4, so the evaluator has published no result for it." },
  { modelId: "mai-code-2", evaluator: "Artificial Analysis", checkedAt: "2026-11-24", names: ["MAI Code 2", "Microsoft MAI Code 2"], checked: ["https://artificialanalysis.ai/models/mai-code-2", "https://artificialanalysis.ai/models/microsoft-mai-code-2", AA_MODEL_LIST], note: "No Artificial Analysis page exists for MAI Code 2 and the model list names no Microsoft MAI model, so the evaluator has published no result for it." },
  { modelId: "sarvam-105b", evaluator: "Artificial Analysis", checkedAt: "2026-11-24", names: ["Sarvam 105B"], checked: ["https://artificialanalysis.ai/models/sarvam-105b"], note: "Its page lists the Intelligence Index as N/A." },
  { modelId: "qwen-3-8-2-4t-a95b", evaluator: "Artificial Analysis", checkedAt: "2026-11-24", names: ["Qwen3.8 2.4T"], checked: ["https://artificialanalysis.ai/models/qwen3-8-2-4t-a95b"], note: "Its page lists the Intelligence Index as N/A, so no complete set of results exists." },
  { modelId: "mercury-3", evaluator: "Artificial Analysis", checkedAt: "2026-11-24", names: ["Mercury 3"], checked: ["https://artificialanalysis.ai/models/mercury-3", AA_MODEL_LIST], note: "There is no Mercury 3 page, and the model list shows only Mercury 2." },
  { modelId: "ripple-65b-preview", evaluator: "Artificial Analysis", checkedAt: "2026-11-24", names: ["Ripple"], checked: ["https://artificialanalysis.ai/models/ripple-65b-preview", AA_MODEL_LIST], note: "There is no page for it, and the model list does not name it." },
  { modelId: "glimpse", evaluator: "Artificial Analysis", checkedAt: "2026-11-24", names: ["Glimpse"], checked: ["https://artificialanalysis.ai/models/glimpse", AA_MODEL_LIST], note: "There is no page for it, and the model list does not name it." },
  { modelId: "qwen-3-8-omni-flash", evaluator: "Artificial Analysis", checkedAt: "2026-11-24", names: ["Qwen3.8 Omni"], checked: ["https://artificialanalysis.ai/models/qwen3-8-omni-flash", AA_MODEL_LIST], note: "There is no page for it, and the model list does not name it." },
]
