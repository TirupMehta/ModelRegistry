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
    tasks: null,
    measures:
      "Elo from millions of blind side-by-side votes by real users on arena.ai. It measures what people prefer, not whether an answer is correct, and a second, different evaluator from the task benchmarks.",
  },
  {
    key: "intelligenceIndex",
    label: "AA Intelligence Index v5.0.1",
    domain: "Overall (evaluator's composite)",
    unit: "index",
    tasks: null,
    measures:
      "Artificial Analysis's own weighted composite of nine evaluations. It is their number and their weighting, not ModelRegistry's.",
  },
  {
    key: "terminalBench4",
    label: "Terminal-Bench 4.0",
    domain: "Agentic command-line work",
    unit: "percent",
    tasks: 66,
    measures: "66 hard multi-step terminal tasks across software, ML, security and operations.",
  },
  {
    key: "frontierCode",
    label: "FrontierCode 2.0",
    domain: "Software engineering",
    unit: "percent",
    tasks: 132,
    measures:
      "132 private tasks in real open-source repositories, graded on whether a maintainer would merge the change.",
  },
  {
    key: "hleDiamond",
    label: "HLE-Diamond",
    domain: "Expert knowledge and reasoning",
    unit: "percent",
    tasks: 1000,
    measures: "1,000 expert-level questions from Humanity's Last Exam, half reasoning and half knowledge.",
  },
  {
    key: "critPt",
    label: "CritPt v2 (Hard)",
    domain: "Research-level physics",
    unit: "percent",
    tasks: 70,
    measures: "70 research-level physics challenges solved with a code tool.",
  },
  {
    key: "terminalBenchScience",
    label: "Terminal-Bench-Science 0.1",
    domain: "Scientific workflows",
    unit: "percent",
    tasks: 70,
    measures: "70 expert-authored research workflows completed in a terminal.",
  },
  {
    key: "automationBench",
    label: "AutomationBench",
    domain: "Business workflow automation",
    unit: "percent",
    tasks: null,
    measures: "Share of objectives completed across simulated SaaS workflows without breaking a guardrail.",
  },
  {
    key: "aaBriefcase",
    label: "AA-Briefcase v1.1",
    domain: "Agentic knowledge work",
    unit: "elo",
    tasks: null,
    measures: "Long-horizon business deliverables (spreadsheets, decks, memos), reported as an Elo.",
  },
  {
    key: "omniscience",
    label: "AA-Omniscience v1.1",
    domain: "Factual reliability",
    unit: "net",
    tasks: null,
    measures:
      "Net score from -100 to 100: correct answers minus hallucinations, with no penalty for declining to answer.",
  },
  {
    key: "gdpPdf",
    label: "GDP.pdf",
    domain: "Long professional documents",
    unit: "percent",
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

export const INDEPENDENT_EVALUATOR = {
  name: "Artificial Analysis",
  url: "https://artificialanalysis.ai/evaluations/artificial-analysis-intelligence-index",
  suite: "Intelligence Index v5.0.1",
  retrievedAt: "2026-11-13",
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
const AA = "https://artificialanalysis.ai/models/comparisons/"
const G_FLASH = `${AA}glm-5-3-flash-vs-reflection-beam-vs-qwen3-8-2-4t-a95b-vs-sarvam-105b`
const G_ASTRA = `${AA}gpt-6-astra-vs-claude-opus-5-5-vs-grok-4-7-vs-gemini-3-8-flash`
const G_FABLE = `${AA}claude-fable-5-2-vs-claude-sonnet-5-5-vs-claude-haiku-5-5-vs-gpt-6-1-sol`
const G_KIMI = `${AA}deepseek-v4-1-flash-1017-vs-kimi-k3-1-pro-vs-mimo-v2-6-pro-vs-mimo-v2-6-flash`
const G_TERRA = `${AA}gpt-6-1-terra-vs-gemini-4-argon-vs-muse-wonder-vs-muse-ember`
const G_GLM = `${AA}glm-5-3-vs-minimax-m3-1-flash-vs-mistral-large-4-vs-nemotron-3-5-super-vl`
const G_DSPRO = `${AA}deepseek-v4-pro-vs-nvidia-nemotron-3-ultra-550b-a55b`
const G_SPARK = `${AA}muse-spark-open-vs-claude-opus-5-5`
const G_HY4 = `${AA}tencent-hy4-vs-claude-opus-5-5`
const G_CARBON = "https://artificialanalysis.ai/models/releases/comparisons/claude-fable-5-2-vs-gemini-4-carbon"
const G_HYDROGEN = "https://artificialanalysis.ai/models/releases/comparisons/claude-fable-5-2-vs-gemini-4-hydrogen"

export const independentRecords: IndependentRecord[] = [
  {
    modelId: "claude-fable-5-2",
    evaluatedAs: "Claude Fable 5.2 (Max, Default Fallback)",
    sourceUrl: G_FABLE,
    values: { intelligenceIndex: 65, aaBriefcase: 1785, automationBench: 76.4, terminalBench4: 59.6, frontierCode: 48.8, omniscience: 67, gdpPdf: 24.2, hleDiamond: 80.2, critPt: 76.5, terminalBenchScience: 73.3 },
    costPerTask: 26.54,
    minutesPerTask: 46.8,
  },
  {
    modelId: "claude-opus-5-5",
    evaluatedAs: "Claude Opus 5.5 (Max, Default Fallback)",
    sourceUrl: G_ASTRA,
    values: { intelligenceIndex: 59, aaBriefcase: 1801, automationBench: 69.5, terminalBench4: 59.6, frontierCode: 46.4, omniscience: 48, gdpPdf: 26.2, hleDiamond: 67.9, critPt: 68.0, terminalBenchScience: 59.0 },
    costPerTask: 10.04,
    minutesPerTask: 25.2,
  },
  {
    modelId: "claude-sonnet-5-5",
    evaluatedAs: "Claude Sonnet 5.5 (Max, Default Fallback)",
    sourceUrl: G_FABLE,
    values: { intelligenceIndex: 55, aaBriefcase: 1816, automationBench: 71.8, terminalBench4: 63.6, frontierCode: 41.7, omniscience: 30, gdpPdf: 25.8, hleDiamond: 53.3, critPt: 59.0, terminalBenchScience: 53.3 },
    costPerTask: 10.02,
    minutesPerTask: 34.1,
  },
  {
    modelId: "claude-haiku-5-5",
    evaluatedAs: "Claude Haiku 5.5 (Max)",
    sourceUrl: G_FABLE,
    values: { intelligenceIndex: 36, aaBriefcase: 1573, automationBench: 35.4, terminalBench4: 32.8, frontierCode: 34.9, omniscience: 12, gdpPdf: 20.8, hleDiamond: 29.6, critPt: 43.5, terminalBenchScience: 20.0 },
    costPerTask: 0.41,
    minutesPerTask: 14.7,
  },
  {
    modelId: "gpt-6-astra",
    evaluatedAs: "GPT-6 Astra (Max)",
    sourceUrl: G_ASTRA,
    values: { intelligenceIndex: 57, aaBriefcase: 1569, automationBench: 68.5, terminalBench4: 59.1, frontierCode: 42.4, omniscience: 42, gdpPdf: 31.0, hleDiamond: 63.8, critPt: 70.5, terminalBenchScience: 63.3 },
    costPerTask: 6.24,
    minutesPerTask: 24.2,
  },
  {
    modelId: "gpt-6-1-sol",
    evaluatedAs: "GPT-6.1 Sol (Max)",
    sourceUrl: G_FABLE,
    values: { intelligenceIndex: 55, aaBriefcase: 1555, automationBench: 64.9, terminalBench4: 56.1, frontierCode: 40.6, omniscience: 42, gdpPdf: 31.0, hleDiamond: 58.8, critPt: 69.5, terminalBenchScience: 58.1 },
    costPerTask: 1.27,
    minutesPerTask: 23.3,
  },
  {
    modelId: "gpt-6-1-terra",
    evaluatedAs: "GPT-6.1 Terra (Max)",
    sourceUrl: G_TERRA,
    values: { intelligenceIndex: 51, aaBriefcase: 1403, automationBench: 60.2, terminalBench4: 55.6, frontierCode: 42.3, omniscience: 30, gdpPdf: 28.6, hleDiamond: 47.3, critPt: 68.0, terminalBenchScience: 57.6 },
    costPerTask: 0.96,
    minutesPerTask: 14.6,
  },
  {
    modelId: "gemini-4-argon",
    evaluatedAs: "Gemini 4 Argon (High)",
    sourceUrl: G_TERRA,
    values: { intelligenceIndex: 50, aaBriefcase: 1484, automationBench: 77.5, terminalBench4: 57.1, frontierCode: 25.7, omniscience: 46, gdpPdf: 21.8, hleDiamond: 56.7, critPt: 52.5, terminalBenchScience: 52.9 },
    costPerTask: 4.97,
    minutesPerTask: 30,
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
    modelId: "gemini-3-8-flash",
    evaluatedAs: "Gemini 3.8 Flash (High)",
    sourceUrl: G_ASTRA,
    values: { intelligenceIndex: 31, aaBriefcase: 1203, automationBench: 59.9, terminalBench4: 19.7, frontierCode: 18.7, omniscience: 23, gdpPdf: 21.0, hleDiamond: 33.1, critPt: 46.5, terminalBenchScience: 10.0 },
    costPerTask: 7.77,
    minutesPerTask: 14.7,
  },
  {
    modelId: "grok-4-7",
    evaluatedAs: "Grok 4.7 (Xhigh)",
    sourceUrl: G_ASTRA,
    values: { intelligenceIndex: 35, aaBriefcase: 1636, automationBench: 65.6, terminalBench4: 25.8, frontierCode: 28.7, omniscience: 31, gdpPdf: 20.0, hleDiamond: 23.2, critPt: 33.5, terminalBenchScience: 11.4 },
    costPerTask: 7.77,
    minutesPerTask: 27,
  },
  {
    modelId: "kimi-k3-1-pro",
    evaluatedAs: "Kimi K3.1 Pro",
    sourceUrl: G_KIMI,
    values: { intelligenceIndex: 46, aaBriefcase: 1675, automationBench: 73.3, terminalBench4: 67.2, frontierCode: 25.5, omniscience: 30, gdpPdf: 31.4, hleDiamond: 37.3, critPt: 49.5, terminalBenchScience: 34.3 },
    costPerTask: 3.68,
    minutesPerTask: 38.4,
  },
  {
    modelId: "deepseek-v4-1-flash-1017",
    evaluatedAs: "DeepSeek V4.1 Flash 1017 (Max)",
    sourceUrl: G_KIMI,
    values: { intelligenceIndex: 33, aaBriefcase: 1570, automationBench: 66.6, terminalBench4: 33.8, frontierCode: 28.5, omniscience: 1, gdpPdf: 17.2, hleDiamond: 25.3, critPt: 25.0, terminalBenchScience: 12.9 },
    costPerTask: 0.6,
    minutesPerTask: 14.8,
  },
  {
    modelId: "mimo-v2-6-pro",
    evaluatedAs: "MiMo-V2.6-Pro",
    sourceUrl: G_KIMI,
    values: { intelligenceIndex: 30, aaBriefcase: 1512, automationBench: 58.6, terminalBench4: 34.8, frontierCode: 24.0, omniscience: -4, gdpPdf: 19.2, hleDiamond: 15.2, critPt: 34.0, terminalBenchScience: 5.7 },
    costPerTask: 0.26,
    minutesPerTask: 35.9,
  },
  {
    modelId: "mimo-v2-6-flash",
    evaluatedAs: "MiMo-V2.6-Flash",
    sourceUrl: G_KIMI,
    values: { intelligenceIndex: 27, aaBriefcase: 1487, automationBench: 64.1, terminalBench4: 22.7, frontierCode: 21.6, omniscience: -11, gdpPdf: 9.0, hleDiamond: 13.7, critPt: 29.5, terminalBenchScience: 4.3 },
    costPerTask: 0.13,
    minutesPerTask: 54.4,
  },
  {
    modelId: "muse-ember",
    evaluatedAs: "Muse Ember (Max)",
    sourceUrl: G_TERRA,
    values: { intelligenceIndex: 36, aaBriefcase: 1521, automationBench: 68.1, terminalBench4: 40.9, frontierCode: 27.2, omniscience: 7, gdpPdf: 22.8, hleDiamond: 25.1, critPt: 39.0, terminalBenchScience: 20.0 },
    costPerTask: 0.14,
    minutesPerTask: 3.2,
  },
  {
    modelId: "muse-wonder",
    evaluatedAs: "Muse Wonder (Max)",
    sourceUrl: G_TERRA,
    values: { intelligenceIndex: 44, aaBriefcase: 1659, automationBench: 68.1, terminalBench4: 52.0, frontierCode: 27.9, omniscience: 25, gdpPdf: 30.6, hleDiamond: 39.0, critPt: 50.5, terminalBenchScience: 25.7 },
    costPerTask: 6.95,
    minutesPerTask: 14.8,
  },
  {
    modelId: "muse-spark-open",
    evaluatedAs: "Muse Spark Open (Xhigh)",
    sourceUrl: G_SPARK,
    values: { intelligenceIndex: 25, aaBriefcase: 1279, automationBench: 49.7, terminalBench4: 8.1, frontierCode: 7.6, omniscience: 26, gdpPdf: 18.6, hleDiamond: 26.3, critPt: 29.5, terminalBenchScience: 1.9 },
    costPerTask: 2.02,
    minutesPerTask: 7.9,
  },
  {
    modelId: "mistral-large-4",
    evaluatedAs: "Mistral Large 4 (High)",
    sourceUrl: G_GLM,
    values: { intelligenceIndex: 26, aaBriefcase: 1348, automationBench: 57.8, terminalBench4: 24.7, frontierCode: 15.0, omniscience: 5, gdpPdf: 17.6, hleDiamond: 17.3, critPt: 27.0, terminalBenchScience: 4.3 },
    costPerTask: 2.06,
    minutesPerTask: 12.1,
  },
  {
    modelId: "minimax-m3-1-flash",
    evaluatedAs: "MiniMax-M3.1-Flash",
    sourceUrl: G_GLM,
    values: { intelligenceIndex: 29, aaBriefcase: 1474, automationBench: 72.5, terminalBench4: 25.8, frontierCode: 20.8, omniscience: -6, gdpPdf: 20.8, hleDiamond: 28.1, critPt: 32.5, terminalBenchScience: 3.3 },
    costPerTask: 0.49,
    minutesPerTask: 16.6,
  },
  {
    modelId: "nemotron-3-5-super-vl",
    evaluatedAs: "Nemotron 3.5 Super VL",
    sourceUrl: G_GLM,
    values: { intelligenceIndex: 14, aaBriefcase: 999, automationBench: 14.8, terminalBench4: 0.0, frontierCode: 6.1, omniscience: -3, gdpPdf: 8.0, hleDiamond: 8.8, critPt: 13.5, terminalBenchScience: 0.0 },
    costPerTask: 0.52,
    minutesPerTask: 5.4,
  },
  {
    modelId: "glm-5-3",
    evaluatedAs: "GLM-5.3 (Max)",
    sourceUrl: G_GLM,
    values: { intelligenceIndex: 32, aaBriefcase: 1503, automationBench: 62.2, terminalBench4: 41.9, frontierCode: 21.6, omniscience: 6, gdpPdf: 11.2, hleDiamond: 17.9, critPt: 33.5, terminalBenchScience: 9.5 },
    costPerTask: 5.01,
    minutesPerTask: 27.7,
  },
  {
    modelId: "deepseek-v4-pro-0813",
    evaluatedAs: "DeepSeek V4 Pro 0813 (Max)",
    sourceUrl: G_DSPRO,
    values: { intelligenceIndex: 23, aaBriefcase: 1253, automationBench: 56.7, terminalBench4: 14.1, frontierCode: 17.1, omniscience: -6, gdpPdf: 11.4, hleDiamond: 19.5, critPt: 23.5, terminalBenchScience: 5.7 },
    costPerTask: 1.77,
    minutesPerTask: 21.4,
  },
  {
    modelId: "nemotron-3-ultra",
    evaluatedAs: "Nemotron 3 Ultra 550B A55B (Reasoning)",
    sourceUrl: G_DSPRO,
    values: { intelligenceIndex: 12, aaBriefcase: 877, automationBench: 3.0, terminalBench4: 0.5, frontierCode: 1.1, omniscience: 3, gdpPdf: 5.0, hleDiamond: 8.5, critPt: 15.0, terminalBenchScience: 0.0 },
    costPerTask: 2.23,
    minutesPerTask: 4.4,
  },
  {
    modelId: "tencent-hy4",
    evaluatedAs: "Tencent Hy4",
    sourceUrl: G_HY4,
    rounded: true,
    values: { intelligenceIndex: 35, aaBriefcase: 1446, automationBench: 66, terminalBench4: 37, frontierCode: 31, omniscience: 5, gdpPdf: 22, hleDiamond: 33, critPt: 39, terminalBenchScience: 13 },
    costPerTask: 1.03,
    minutesPerTask: 13.9,
  },
  {
    modelId: "beam-1",
    evaluatedAs: "Beam 1.0",
    sourceUrl: G_FLASH,
    values: { intelligenceIndex: 18, aaBriefcase: 976, automationBench: 48.5, terminalBench4: 3.0, frontierCode: 5.5, omniscience: 2, gdpPdf: 11.6, hleDiamond: 12.8, critPt: 26.5, terminalBenchScience: 0.5 },
    costPerTask: 0.28,
    minutesPerTask: 2.0,
  },
  {
    modelId: "glm-5-3-flash",
    evaluatedAs: "GLM-5.3-Flash",
    sourceUrl: G_FLASH,
    values: { intelligenceIndex: 28, aaBriefcase: 1450, automationBench: 60.4, terminalBench4: 32.8, frontierCode: 17.6, omniscience: 1, gdpPdf: 15.4, hleDiamond: 18.2, critPt: 24.5, terminalBenchScience: 4.8 },
    costPerTask: 0.58,
    minutesPerTask: 48.6,
  },
  {
    // The evaluator has run only part of its suite on this model: no index, no cost,
    // no FrontierCode, CritPt or Terminal-Bench-Science yet. Published as a partial row.
    modelId: "qwen-3-8-2-4t-a95b",
    evaluatedAs: "Qwen3.8 2.4T A95B",
    sourceUrl: G_FLASH,
    values: { aaBriefcase: 1430, automationBench: 57.2, terminalBench4: 11.1, omniscience: 8, gdpPdf: 15.6, hleDiamond: 20.1 },
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
