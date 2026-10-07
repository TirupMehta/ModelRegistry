export interface ModelPricing {
  input: number // USD per 1M tokens
  output: number // USD per 1M tokens
}

export interface ModelVariant {
  name: string // e.g. "GPT-Image-2.5 Flare"
  role: string // short pill, e.g. "API DEFAULT"
  detail: string // one-line capability summary
  pricingNote: string // e.g. "$5 in / $30 out per 1M tokens"
  link?: string // official docs URL
}

export type SourceType =
  | "announcement"
  | "api-docs"
  | "pricing"
  | "model-card"
  | "paper"
  | "weights"
  | "benchmark"
  | "console"

export interface SourceRef {
  url: string
  publisher: string
  // Human-readable source title, e.g. "Mistral Large 4 announcement".
  title: string
  // First publication date of the source, when directly observed.
  publishedAt?: string
  // Date the registry last confirmed the source (YYYY-MM-DD).
  accessedAt: string
  sourceType: SourceType
  // True when the source returned HTTP 2xx to the registry's automated check.
  live?: boolean
  // Explains access limits (e.g. bot-gated) or source weaknesses.
  note?: string
}

export type VerificationStatus = "verified" | "partially_verified" | "unverified" | "retired"

// Core factual fields that may carry per-field citations.
export type SourcedField =
  | "releaseDate"
  | "contextWindow"
  | "maxOutputTokens"
  | "parameters"
  | "license"
  | "pricing"
  | "modalities"
  | "benchmarks"
  | "isCompanyFlagship"
  | "isLatestCheckpoint"

export type FieldSourceMap = Partial<Record<SourcedField, SourceRef[]>>

export interface ChangeLogEntry {
  date: string // YYYY-MM-DD
  summary: string
  sources?: string[]
}

export interface ModelItem {
  id: string
  companyId: string
  companyName: string
  name: string
  version: string
  releaseDate: string // YYYY-MM-DD
  isCompanyFlagship: boolean // The primary general-purpose LLM for the lab
  isLatestCheckpoint: boolean // The absolute latest checkpoint shipped by the lab
  statusBadge: string
  category: "flagship" | "reasoning" | "open-weights" | "code" | "multimodal" | "audio" | "image" | "video"
  categoryLabel: string
  contextWindow: string
  contextWindowTokens: number
  maxOutputTokens: string
  parameters: string
  openWeights: boolean
  license: string
  pricing: ModelPricing
  // Non-token billing unit for visual models (e.g. "per second").
  // Undefined = classic per-1M-tokens pricing; excluded from token cost leaderboards.
  pricingUnit?: string
  highlight: string
  modalities: ("Text" | "Vision" | "Audio" | "Video" | "Code" | "Image")[]
  // Named sub-variants shipped under this entry (e.g. API twins).
  // Rendered inside the parent model page — not separate index entries.
  variants?: ModelVariant[]
  benchmarks: {
    mmluPro?: string
    sweBench?: string
    terminalBench?: string
    aime2024?: string
    gpqa?: string
  }
  links: {
    announcement?: string
    playground?: string
    paper?: string
    apiDocs?: string
    weights?: string
  }
  // Provenance: every published record explains where its claims come from.
  // See docs/methodology for verification levels and docs/audit-2026-10-07.md
  // for the latest source audit.
  sources: SourceRef[]
  fieldSources: FieldSourceMap
  lastVerifiedAt: string // YYYY-MM-DD of the last source check
  verificationStatus: VerificationStatus
  changeLog: ChangeLogEntry[]
  // Set when the record is retired in favour of another model id.
  supersededBy?: string
}

/**
 * Checkpoint: Verified frontier models across the premier 14 AI laboratories.
 * Includes both primary general-purpose flagships and latest specialized releases.
 */
export const modelsData: ModelItem[] = [
  // ─── ANTHROPIC ────────────────────────────────────────────────────────────
  {
    id: "claude-fable-5-1",
    companyId: "anthropic",
    companyName: "Anthropic",
    name: "Claude Fable 5.1",
    version: "5.1",
    releaseDate: "2026-09-01",
    isCompanyFlagship: false,
    isLatestCheckpoint: false,
    statusBadge: "REASONING CEILING",
    category: "reasoning",
    categoryLabel: "Adaptive Reasoning",
    contextWindow: "1,000,000 tokens",
    contextWindowTokens: 1000000,
    maxOutputTokens: "128,000 tokens",
    parameters: "Frontier MoE (Adaptive Thinking)",
    openWeights: false,
    license: "Proprietary API / Cloud Foundry",
    pricing: { input: 10.0, output: 50.0 },
    highlight: "Released Sept 1, 2026; Anthropic's capability ceiling for agentic coding and knowledge work, with 75% cheaper cache reads and 52.6% on Terminal-Bench-Science.",
    modalities: ["Text", "Vision", "Code"],
    benchmarks: {
      terminalBench: "52.6%",
      sweBench: "78.4%",
      gpqa: "74.8%",
    },
    links: {
      announcement: "https://www.anthropic.com/news/claude-fable-5-1",
      playground: "https://claude.ai",
      apiDocs: "https://docs.anthropic.com/claude/reference",
    },
    sources: [
    {
      url: "https://docs.anthropic.com/claude/reference",
      publisher: "Anthropic",
      title: "Claude Fable 5.1 API reference",
      accessedAt: "2026-10-07",
      sourceType: "api-docs",
      live: true,
    },
    ],
    fieldSources: {
      releaseDate: [
      {
        url: "https://docs.anthropic.com/claude/reference",
        publisher: "Anthropic",
        title: "Claude Fable 5.1 API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      contextWindow: [
      {
        url: "https://docs.anthropic.com/claude/reference",
        publisher: "Anthropic",
        title: "Claude Fable 5.1 API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      maxOutputTokens: [
      {
        url: "https://docs.anthropic.com/claude/reference",
        publisher: "Anthropic",
        title: "Claude Fable 5.1 API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      parameters: [
      {
        url: "https://docs.anthropic.com/claude/reference",
        publisher: "Anthropic",
        title: "Claude Fable 5.1 API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      license: [
      {
        url: "https://docs.anthropic.com/claude/reference",
        publisher: "Anthropic",
        title: "Claude Fable 5.1 API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      pricing: [
      {
        url: "https://docs.anthropic.com/claude/reference",
        publisher: "Anthropic",
        title: "Claude Fable 5.1 API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      modalities: [
      {
        url: "https://docs.anthropic.com/claude/reference",
        publisher: "Anthropic",
        title: "Claude Fable 5.1 API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      isCompanyFlagship: [
      {
        url: "https://docs.anthropic.com/claude/reference",
        publisher: "Anthropic",
        title: "Claude Fable 5.1 API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      isLatestCheckpoint: [
      {
        url: "https://docs.anthropic.com/claude/reference",
        publisher: "Anthropic",
        title: "Claude Fable 5.1 API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
    },
    lastVerifiedAt: "2026-10-07",
    verificationStatus: "partially_verified",
    changeLog: [
      {
        date: "2026-09-01",
        summary: "Initial registry entry.",
        sources: [
          "https://docs.anthropic.com/claude/reference",
        ],
      },
    ],
  },
  {
    id: "claude-opus-5",
    companyId: "anthropic",
    companyName: "Anthropic",
    name: "Claude Opus 5",
    version: "5.0",
    releaseDate: "2026-07-15",
    isCompanyFlagship: false,
    isLatestCheckpoint: false,
    statusBadge: "HEAVYWEIGHT AGENTIC",
    category: "flagship",
    categoryLabel: "Deep Research",
    contextWindow: "1,000,000 tokens",
    contextWindowTokens: 1000000,
    maxOutputTokens: "65,536 tokens",
    parameters: "Dense Frontier",
    openWeights: false,
    license: "Proprietary API",
    pricing: { input: 15.0, output: 75.0 },
    highlight: "Deep multi-hour research, complex code synthesis, and long-horizon workflow orchestration.",
    modalities: ["Text", "Vision", "Code"],
    benchmarks: {
      sweBench: "74.2%",
      gpqa: "72.9%",
    },
    links: {
      playground: "https://claude.ai",
      apiDocs: "https://docs.anthropic.com",
    },
    sources: [
    {
      url: "https://docs.anthropic.com",
      publisher: "Anthropic",
      title: "Claude Opus 5 API reference",
      accessedAt: "2026-10-07",
      sourceType: "api-docs",
      live: true,
    },
    ],
    fieldSources: {
      releaseDate: [
      {
        url: "https://docs.anthropic.com",
        publisher: "Anthropic",
        title: "Claude Opus 5 API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      contextWindow: [
      {
        url: "https://docs.anthropic.com",
        publisher: "Anthropic",
        title: "Claude Opus 5 API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      maxOutputTokens: [
      {
        url: "https://docs.anthropic.com",
        publisher: "Anthropic",
        title: "Claude Opus 5 API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      parameters: [
      {
        url: "https://docs.anthropic.com",
        publisher: "Anthropic",
        title: "Claude Opus 5 API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      license: [
      {
        url: "https://docs.anthropic.com",
        publisher: "Anthropic",
        title: "Claude Opus 5 API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      pricing: [
      {
        url: "https://docs.anthropic.com",
        publisher: "Anthropic",
        title: "Claude Opus 5 API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      modalities: [
      {
        url: "https://docs.anthropic.com",
        publisher: "Anthropic",
        title: "Claude Opus 5 API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      isCompanyFlagship: [
      {
        url: "https://docs.anthropic.com",
        publisher: "Anthropic",
        title: "Claude Opus 5 API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      isLatestCheckpoint: [
      {
        url: "https://docs.anthropic.com",
        publisher: "Anthropic",
        title: "Claude Opus 5 API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
    },
    lastVerifiedAt: "2026-10-07",
    verificationStatus: "partially_verified",
    changeLog: [
      {
        date: "2026-07-15",
        summary: "Initial registry entry.",
        sources: [
          "https://docs.anthropic.com",
        ],
      },
    ],
  },
  {
    id: "claude-opus-5-5",
    companyId: "anthropic",
    companyName: "Anthropic",
    name: "Claude Opus 5.5",
    version: "5.5",
    releaseDate: "2026-09-22",
    isCompanyFlagship: true,
    isLatestCheckpoint: true,
    statusBadge: "ANTHROPIC FLAGSHIP",
    category: "flagship",
    categoryLabel: "Efficient Frontier",
    contextWindow: "1,000,000 tokens",
    contextWindowTokens: 1000000,
    maxOutputTokens: "128,000 tokens",
    parameters: "Undisclosed (Anthropic)",
    openWeights: false,
    license: "Proprietary API",
    pricing: { input: 4.0, output: 20.0 },
    highlight: "Released Sept 22, 2026; Anthropic's flagship with Fable-level agentic coding at 40% lower cost than Opus 5 ($4/$20), beating GPT-6 Astra on FrontierCode at a fifth of the cost per task.",
    modalities: ["Text", "Vision", "Code"],
    benchmarks: {
      terminalBench: "66.4%",
    },
    links: {
      announcement: "https://www.anthropic.com/claude-opus-5-5",
      playground: "https://claude.ai",
      apiDocs: "https://docs.anthropic.com",
    },
    sources: [
    {
      url: "https://www.anthropic.com/claude-opus-5-5",
      publisher: "Anthropic",
      title: "Claude Opus 5.5 announcement",
      accessedAt: "2026-10-07",
      sourceType: "announcement",
      live: true,
    },
    {
      url: "https://docs.anthropic.com",
      publisher: "Anthropic",
      title: "Claude Opus 5.5 API reference",
      accessedAt: "2026-10-07",
      sourceType: "api-docs",
      live: true,
    },
    ],
    fieldSources: {
      releaseDate: [
      {
        url: "https://www.anthropic.com/claude-opus-5-5",
        publisher: "Anthropic",
        title: "Claude Opus 5.5 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      contextWindow: [
      {
        url: "https://docs.anthropic.com",
        publisher: "Anthropic",
        title: "Claude Opus 5.5 API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      maxOutputTokens: [
      {
        url: "https://docs.anthropic.com",
        publisher: "Anthropic",
        title: "Claude Opus 5.5 API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      parameters: [
      {
        url: "https://www.anthropic.com/claude-opus-5-5",
        publisher: "Anthropic",
        title: "Claude Opus 5.5 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      license: [
      {
        url: "https://www.anthropic.com/claude-opus-5-5",
        publisher: "Anthropic",
        title: "Claude Opus 5.5 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      pricing: [
      {
        url: "https://docs.anthropic.com",
        publisher: "Anthropic",
        title: "Claude Opus 5.5 API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      modalities: [
      {
        url: "https://www.anthropic.com/claude-opus-5-5",
        publisher: "Anthropic",
        title: "Claude Opus 5.5 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      benchmarks: [
      {
        url: "https://www.anthropic.com/claude-opus-5-5",
        publisher: "Anthropic",
        title: "Claude Opus 5.5 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      isCompanyFlagship: [
      {
        url: "https://www.anthropic.com/claude-opus-5-5",
        publisher: "Anthropic",
        title: "Claude Opus 5.5 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      isLatestCheckpoint: [
      {
        url: "https://www.anthropic.com/claude-opus-5-5",
        publisher: "Anthropic",
        title: "Claude Opus 5.5 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
    },
    lastVerifiedAt: "2026-10-07",
    verificationStatus: "partially_verified",
    changeLog: [
      {
        date: "2026-09-22",
        summary: "Initial registry entry.",
        sources: [
          "https://www.anthropic.com/claude-opus-5-5",
        ],
      },
    ],
  },

  // ─── OPENAI ───────────────────────────────────────────────────────────────
  {
    id: "gpt-6-astra",
    companyId: "openai",
    companyName: "OpenAI",
    name: "GPT-6 Astra",
    version: "6.0-Astra",
    releaseDate: "2026-09-04",
    isCompanyFlagship: false,
    isLatestCheckpoint: false,
    statusBadge: "CAPABILITY CEILING",
    category: "flagship",
    categoryLabel: "Agentic Frontier Foundation",
    contextWindow: "1,050,000 tokens",
    contextWindowTokens: 1050000,
    maxOutputTokens: "65,536 tokens",
    parameters: "Autonomous Multi-Agent Architecture",
    openWeights: false,
    license: "Proprietary API / ChatGPT Plus & Pro",
    pricing: { input: 10.0, output: 50.0 },
    highlight: "Rolled out Sept 4, 2026; OpenAI's most capable model for autonomous agentic workflows and software engineering. Hit 97.6% on FrontierMath Tier 4 and met the 'Critical' cybersecurity threshold.",
    modalities: ["Text", "Vision", "Audio", "Code"],
    benchmarks: {
      sweBench: "82.4%",
      mmluPro: "89.2%",
      gpqa: "78.6%",
    },
    links: {
      announcement: "https://openai.com/index/gpt-6-astra/",
      playground: "https://chatgpt.com",
      apiDocs: "https://platform.openai.com/docs",
    },
    sources: [
    {
      url: "https://openai.com/index/gpt-6-astra/",
      publisher: "OpenAI",
      title: "GPT-6 Astra announcement",
      accessedAt: "2026-10-07",
      sourceType: "announcement",
      live: false,
      note: "Host alive; automated fetch blocked, page not re-confirmed on access date.",
    },
    {
      url: "https://platform.openai.com/docs",
      publisher: "OpenAI",
      title: "GPT-6 Astra API reference",
      accessedAt: "2026-10-07",
      sourceType: "api-docs",
      live: true,
    },
    ],
    fieldSources: {
      releaseDate: [
      {
        url: "https://platform.openai.com/docs",
        publisher: "OpenAI",
        title: "GPT-6 Astra API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      contextWindow: [
      {
        url: "https://platform.openai.com/docs",
        publisher: "OpenAI",
        title: "GPT-6 Astra API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      maxOutputTokens: [
      {
        url: "https://platform.openai.com/docs",
        publisher: "OpenAI",
        title: "GPT-6 Astra API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      parameters: [
      {
        url: "https://platform.openai.com/docs",
        publisher: "OpenAI",
        title: "GPT-6 Astra API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      license: [
      {
        url: "https://platform.openai.com/docs",
        publisher: "OpenAI",
        title: "GPT-6 Astra API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      pricing: [
      {
        url: "https://platform.openai.com/docs",
        publisher: "OpenAI",
        title: "GPT-6 Astra API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      modalities: [
      {
        url: "https://platform.openai.com/docs",
        publisher: "OpenAI",
        title: "GPT-6 Astra API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      benchmarks: [
      {
        url: "https://openai.com/index/gpt-6-astra/",
        publisher: "OpenAI",
        title: "GPT-6 Astra announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: false,
        note: "Host alive; automated fetch blocked, page not re-confirmed on access date.",
      },
      ],
      isCompanyFlagship: [
      {
        url: "https://platform.openai.com/docs",
        publisher: "OpenAI",
        title: "GPT-6 Astra API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      isLatestCheckpoint: [
      {
        url: "https://platform.openai.com/docs",
        publisher: "OpenAI",
        title: "GPT-6 Astra API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
    },
    lastVerifiedAt: "2026-10-07",
    verificationStatus: "partially_verified",
    changeLog: [
      {
        date: "2026-09-04",
        summary: "Initial registry entry.",
        sources: [
          "https://openai.com/index/gpt-6-astra/",
        ],
      },
    ],
  },
  {
    id: "gpt-5-6",
    companyId: "openai",
    companyName: "OpenAI",
    name: "ChatGPT 5.6",
    version: "5.6 (Sol · Terra · Luna)",
    releaseDate: "2026-08-05",
    isCompanyFlagship: false,
    isLatestCheckpoint: false,
    statusBadge: "SOL · TERRA · LUNA",
    category: "flagship",
    categoryLabel: "Family Foundation",
    contextWindow: "1,050,000 tokens",
    contextWindowTokens: 1050000,
    maxOutputTokens: "65,536 tokens",
    parameters: "Unified Reasoning × 3 Personalities",
    openWeights: false,
    license: "Proprietary API / ChatGPT Plus & Pro",
    pricing: { input: 3.0, output: 12.0 },
    highlight: "OpenAI's unified ChatGPT 5.6 family — Sol (reasoning), Terra (balanced), Luna (speed) — on one 1.05M-context foundation with multi-agent orchestration.",
    modalities: ["Text", "Vision", "Audio", "Code"],
    benchmarks: {
      mmluPro: "86.4%",
      sweBench: "76.8%",
    },
    links: {
      announcement: "https://openai.com/index/gpt-5-6/",
      playground: "https://chatgpt.com",
      apiDocs: "https://platform.openai.com/docs",
    },
    sources: [
    {
      url: "https://openai.com/index/gpt-5-6/",
      publisher: "OpenAI",
      title: "ChatGPT 5.6 announcement",
      accessedAt: "2026-10-07",
      sourceType: "announcement",
      live: false,
      note: "Host alive; automated fetch blocked, page not re-confirmed on access date.",
    },
    {
      url: "https://platform.openai.com/docs",
      publisher: "OpenAI",
      title: "ChatGPT 5.6 API reference",
      accessedAt: "2026-10-07",
      sourceType: "api-docs",
      live: true,
    },
    ],
    fieldSources: {
      releaseDate: [
      {
        url: "https://platform.openai.com/docs",
        publisher: "OpenAI",
        title: "ChatGPT 5.6 API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      contextWindow: [
      {
        url: "https://platform.openai.com/docs",
        publisher: "OpenAI",
        title: "ChatGPT 5.6 API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      maxOutputTokens: [
      {
        url: "https://platform.openai.com/docs",
        publisher: "OpenAI",
        title: "ChatGPT 5.6 API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      parameters: [
      {
        url: "https://platform.openai.com/docs",
        publisher: "OpenAI",
        title: "ChatGPT 5.6 API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      license: [
      {
        url: "https://platform.openai.com/docs",
        publisher: "OpenAI",
        title: "ChatGPT 5.6 API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      pricing: [
      {
        url: "https://platform.openai.com/docs",
        publisher: "OpenAI",
        title: "ChatGPT 5.6 API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      modalities: [
      {
        url: "https://platform.openai.com/docs",
        publisher: "OpenAI",
        title: "ChatGPT 5.6 API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      benchmarks: [
      {
        url: "https://openai.com/index/gpt-5-6/",
        publisher: "OpenAI",
        title: "ChatGPT 5.6 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: false,
        note: "Host alive; automated fetch blocked, page not re-confirmed on access date.",
      },
      ],
      isCompanyFlagship: [
      {
        url: "https://platform.openai.com/docs",
        publisher: "OpenAI",
        title: "ChatGPT 5.6 API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      isLatestCheckpoint: [
      {
        url: "https://platform.openai.com/docs",
        publisher: "OpenAI",
        title: "ChatGPT 5.6 API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
    },
    lastVerifiedAt: "2026-10-07",
    verificationStatus: "partially_verified",
    changeLog: [
      {
        date: "2026-08-05",
        summary: "Initial registry entry.",
        sources: [
          "https://openai.com/index/gpt-5-6/",
        ],
      },
    ],
  },
  {
    id: "gpt-6-1-sol",
    companyId: "openai",
    companyName: "OpenAI",
    name: "GPT-6.1 Sol",
    version: "6.1-Sol",
    releaseDate: "2026-09-29",
    isCompanyFlagship: true,
    isLatestCheckpoint: true,
    statusBadge: "OPENAI FLAGSHIP",
    category: "reasoning",
    categoryLabel: "Agentic Workhorse",
    contextWindow: "1,050,000 tokens",
    contextWindowTokens: 1050000,
    maxOutputTokens: "128,000 tokens",
    parameters: "Undisclosed (OpenAI)",
    openWeights: false,
    license: "Proprietary API / ChatGPT Plus & Pro",
    pricing: { input: 2.0, output: 10.0 },
    highlight: "Released Sept 29, 2026; upgrade to GPT-6 Sol with near-Astra coding and computer use at one-fifth of Astra's price ($2/$10).",
    modalities: ["Text", "Vision", "Code"],
    benchmarks: {},
    links: {
      announcement: "https://openai.com/index/introducing-gpt-6-1-sol",
      playground: "https://chatgpt.com",
      apiDocs: "https://platform.openai.com/docs",
    },
    variants: [
      {
        name: "GPT-6 Sol",
        role: "SUPERSEDED SEP 29",
        detail: "Original GPT-6 Sol track, upgraded to 6.1 at identical pricing.",
        pricingNote: "$2 in / $10 out per 1M tokens",
        link: "https://openai.com/index/introducing-gpt-6-sol-and-luna/",
      },
    ],
    sources: [
    {
      url: "https://openai.com/index/introducing-gpt-6-1-sol",
      publisher: "OpenAI",
      title: "GPT-6.1 Sol announcement",
      accessedAt: "2026-10-07",
      sourceType: "announcement",
      live: false,
      note: "Host alive; automated fetch blocked, page not re-confirmed on access date.",
    },
    {
      url: "https://platform.openai.com/docs",
      publisher: "OpenAI",
      title: "GPT-6.1 Sol API reference",
      accessedAt: "2026-10-07",
      sourceType: "api-docs",
      live: true,
    },
    ],
    fieldSources: {
      releaseDate: [
      {
        url: "https://platform.openai.com/docs",
        publisher: "OpenAI",
        title: "GPT-6.1 Sol API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      contextWindow: [
      {
        url: "https://platform.openai.com/docs",
        publisher: "OpenAI",
        title: "GPT-6.1 Sol API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      maxOutputTokens: [
      {
        url: "https://platform.openai.com/docs",
        publisher: "OpenAI",
        title: "GPT-6.1 Sol API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      parameters: [
      {
        url: "https://platform.openai.com/docs",
        publisher: "OpenAI",
        title: "GPT-6.1 Sol API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      license: [
      {
        url: "https://platform.openai.com/docs",
        publisher: "OpenAI",
        title: "GPT-6.1 Sol API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      pricing: [
      {
        url: "https://platform.openai.com/docs",
        publisher: "OpenAI",
        title: "GPT-6.1 Sol API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      modalities: [
      {
        url: "https://platform.openai.com/docs",
        publisher: "OpenAI",
        title: "GPT-6.1 Sol API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      isCompanyFlagship: [
      {
        url: "https://platform.openai.com/docs",
        publisher: "OpenAI",
        title: "GPT-6.1 Sol API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      isLatestCheckpoint: [
      {
        url: "https://platform.openai.com/docs",
        publisher: "OpenAI",
        title: "GPT-6.1 Sol API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
    },
    lastVerifiedAt: "2026-10-07",
    verificationStatus: "partially_verified",
    changeLog: [
      {
        date: "2026-09-29",
        summary: "Initial registry entry.",
        sources: [
          "https://openai.com/index/introducing-gpt-6-1-sol",
        ],
      },
    ],
  },
  {
    id: "gpt-6-luna",
    companyId: "openai",
    companyName: "OpenAI",
    name: "GPT-6 Luna",
    version: "6.0-Luna",
    releaseDate: "2026-09-22",
    isCompanyFlagship: false,
    isLatestCheckpoint: true,
    statusBadge: "HALF-PRICE SCALE",
    category: "flagship",
    categoryLabel: "High-Volume Efficient",
    contextWindow: "1,050,000 tokens",
    contextWindowTokens: 1050000,
    maxOutputTokens: "128,000 tokens",
    parameters: "Undisclosed (OpenAI)",
    openWeights: false,
    license: "Proprietary API / ChatGPT Plus & Pro",
    pricing: { input: 0.1, output: 0.5 },
    highlight: "Released Sept 22, 2026; high-volume tier at $0.10/$0.50 — half the 5.6 Luna price — matching GPT-5.6 Sol on factuality at ~1% of the cost.",
    modalities: ["Text", "Vision", "Code"],
    benchmarks: {},
    links: {
      announcement: "https://openai.com/index/introducing-gpt-6-sol-and-luna/",
      playground: "https://chatgpt.com",
      apiDocs: "https://platform.openai.com/docs",
    },
    sources: [
    {
      url: "https://openai.com/index/introducing-gpt-6-sol-and-luna/",
      publisher: "OpenAI",
      title: "GPT-6 Luna announcement",
      accessedAt: "2026-10-07",
      sourceType: "announcement",
      live: false,
      note: "Host alive; automated fetch blocked, page not re-confirmed on access date.",
    },
    {
      url: "https://platform.openai.com/docs",
      publisher: "OpenAI",
      title: "GPT-6 Luna API reference",
      accessedAt: "2026-10-07",
      sourceType: "api-docs",
      live: true,
    },
    ],
    fieldSources: {
      releaseDate: [
      {
        url: "https://platform.openai.com/docs",
        publisher: "OpenAI",
        title: "GPT-6 Luna API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      contextWindow: [
      {
        url: "https://platform.openai.com/docs",
        publisher: "OpenAI",
        title: "GPT-6 Luna API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      maxOutputTokens: [
      {
        url: "https://platform.openai.com/docs",
        publisher: "OpenAI",
        title: "GPT-6 Luna API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      parameters: [
      {
        url: "https://platform.openai.com/docs",
        publisher: "OpenAI",
        title: "GPT-6 Luna API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      license: [
      {
        url: "https://platform.openai.com/docs",
        publisher: "OpenAI",
        title: "GPT-6 Luna API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      pricing: [
      {
        url: "https://platform.openai.com/docs",
        publisher: "OpenAI",
        title: "GPT-6 Luna API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      modalities: [
      {
        url: "https://platform.openai.com/docs",
        publisher: "OpenAI",
        title: "GPT-6 Luna API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      isCompanyFlagship: [
      {
        url: "https://platform.openai.com/docs",
        publisher: "OpenAI",
        title: "GPT-6 Luna API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      isLatestCheckpoint: [
      {
        url: "https://platform.openai.com/docs",
        publisher: "OpenAI",
        title: "GPT-6 Luna API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
    },
    lastVerifiedAt: "2026-10-07",
    verificationStatus: "partially_verified",
    changeLog: [
      {
        date: "2026-09-22",
        summary: "Initial registry entry.",
        sources: [
          "https://openai.com/index/introducing-gpt-6-sol-and-luna/",
        ],
      },
    ],
  },

  // ─── GOOGLE DEEPMIND (Gemini 4 flagship) ─────────────────────────────────
  {
    id: "gemini-4-argon",
    companyId: "google",
    companyName: "Google DeepMind",
    name: "Gemini 4 Argon",
    version: "4.0-Argon",
    releaseDate: "2026-09-30",
    isCompanyFlagship: true,
    isLatestCheckpoint: true,
    statusBadge: "NEW DROP",
    category: "flagship",
    categoryLabel: "Frontier Enterprise",
    contextWindow: "1,048,576 tokens",
    contextWindowTokens: 1048576,
    maxOutputTokens: "1,000,000 tokens",
    parameters: "Undisclosed (Google DeepMind)",
    openWeights: false,
    license: "Proprietary API",
    pricing: { input: 2.0, output: 10.0 },
    highlight: "Announced Sept 30, 2026; Gemini 4 Argon is Google DeepMind's frontier model for long-horizon software engineering, enterprise knowledge work, and cyber defense, with 1M output tokens and an introductory price of $2/$10 per 1M tokens.",
    modalities: ["Text", "Vision", "Code"],
    benchmarks: {
      sweBench: "77.9% (DeepSWE v1.1)",
    },
    links: {
      announcement: "https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-4-argon/",
      playground: "https://aistudio.google.com",
      apiDocs: "https://ai.google.dev/gemini-api/docs",
    },
    sources: [
    {
      url: "https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-4-argon/",
      publisher: "Google DeepMind",
      title: "Gemini 4 Argon announcement",
      publishedAt: "2026-09-30",
      accessedAt: "2026-10-07",
      sourceType: "announcement",
      live: true,
    },
    {
      url: "https://ai.google.dev/gemini-api/docs",
      publisher: "Google DeepMind",
      title: "Gemini 4 Argon API reference",
      accessedAt: "2026-10-07",
      sourceType: "api-docs",
      live: true,
    },
    ],
    fieldSources: {
      releaseDate: [
      {
        url: "https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-4-argon/",
        publisher: "Google DeepMind",
        title: "Gemini 4 Argon announcement",
        publishedAt: "2026-09-30",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      contextWindow: [
      {
        url: "https://ai.google.dev/gemini-api/docs",
        publisher: "Google DeepMind",
        title: "Gemini 4 Argon API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      maxOutputTokens: [
      {
        url: "https://ai.google.dev/gemini-api/docs",
        publisher: "Google DeepMind",
        title: "Gemini 4 Argon API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      parameters: [
      {
        url: "https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-4-argon/",
        publisher: "Google DeepMind",
        title: "Gemini 4 Argon announcement",
        publishedAt: "2026-09-30",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      license: [
      {
        url: "https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-4-argon/",
        publisher: "Google DeepMind",
        title: "Gemini 4 Argon announcement",
        publishedAt: "2026-09-30",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      pricing: [
      {
        url: "https://ai.google.dev/gemini-api/docs",
        publisher: "Google DeepMind",
        title: "Gemini 4 Argon API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      modalities: [
      {
        url: "https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-4-argon/",
        publisher: "Google DeepMind",
        title: "Gemini 4 Argon announcement",
        publishedAt: "2026-09-30",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      benchmarks: [
      {
        url: "https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-4-argon/",
        publisher: "Google DeepMind",
        title: "Gemini 4 Argon announcement",
        publishedAt: "2026-09-30",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      isCompanyFlagship: [
      {
        url: "https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-4-argon/",
        publisher: "Google DeepMind",
        title: "Gemini 4 Argon announcement",
        publishedAt: "2026-09-30",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      isLatestCheckpoint: [
      {
        url: "https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-4-argon/",
        publisher: "Google DeepMind",
        title: "Gemini 4 Argon announcement",
        publishedAt: "2026-09-30",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
    },
    lastVerifiedAt: "2026-10-07",
    verificationStatus: "partially_verified",
    changeLog: [
      {
        date: "2026-09-30",
        summary: "Initial registry entry.",
        sources: [
          "https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-4-argon/",
        ],
      },
    ],
  },

  // ─── GOOGLE DEEPMIND ─────────────────────────────────────────────────────
  {
    id: "gemini-3-8-flash",
    companyId: "google",
    companyName: "Google DeepMind",
    name: "Gemini 3.8 Flash",
    version: "3.8",
    releaseDate: "2026-09-02",
    isCompanyFlagship: false,
    isLatestCheckpoint: false,
    statusBadge: "AGENTIC WORKHORSE",
    category: "flagship",
    categoryLabel: "Agentic Multimodal",
    contextWindow: "1,048,576 tokens",
    contextWindowTokens: 1048576,
    maxOutputTokens: "65,536 tokens",
    parameters: "TPU v6e Speculative MoE",
    openWeights: false,
    license: "Google AI Studio / Vertex AI",
    pricing: { input: 0.75, output: 3.75 },
    highlight: "Released Sept 2, 2026; Google DeepMind's frontier workhorse for agentic coding loops, recursive self-correction, and 1M token real-time multimodal streaming.",
    modalities: ["Text", "Vision", "Audio", "Video", "Code"],
    benchmarks: {
      mmluPro: "86.8%",
      sweBench: "76.4%",
      gpqa: "73.2%",
    },
    links: {
      announcement: "https://blog.google/innovation-and-ai/models-and-research/gemini-models/3-8-flash-and-3-8-flash-cyber/",
      playground: "https://aistudio.google.com",
      apiDocs: "https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash",
    },
    sources: [
    {
      url: "https://blog.google/innovation-and-ai/models-and-research/gemini-models/3-8-flash-and-3-8-flash-cyber/",
      publisher: "Google DeepMind",
      title: "Gemini 3.8 Flash announcement",
      publishedAt: "2026-09-02",
      accessedAt: "2026-10-07",
      sourceType: "announcement",
      live: true,
    },
    {
      url: "https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash",
      publisher: "Google DeepMind",
      title: "Gemini 3.8 Flash API reference",
      accessedAt: "2026-10-07",
      sourceType: "api-docs",
      live: true,
    },
    {
      url: "https://deepmind.google/models/model-cards/gemini-3-8-flash/",
      publisher: "Google DeepMind",
      title: "Gemini 3.8 Flash model card",
      publishedAt: "2026-09-02",
      accessedAt: "2026-10-07",
      sourceType: "model-card",
      live: true,
    },
    ],
    fieldSources: {
      releaseDate: [
      {
        url: "https://blog.google/innovation-and-ai/models-and-research/gemini-models/3-8-flash-and-3-8-flash-cyber/",
        publisher: "Google DeepMind",
        title: "Gemini 3.8 Flash announcement",
        publishedAt: "2026-09-02",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      contextWindow: [
      {
        url: "https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash",
        publisher: "Google DeepMind",
        title: "Gemini 3.8 Flash API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      maxOutputTokens: [
      {
        url: "https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash",
        publisher: "Google DeepMind",
        title: "Gemini 3.8 Flash API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      parameters: [
      {
        url: "https://blog.google/innovation-and-ai/models-and-research/gemini-models/3-8-flash-and-3-8-flash-cyber/",
        publisher: "Google DeepMind",
        title: "Gemini 3.8 Flash announcement",
        publishedAt: "2026-09-02",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      license: [
      {
        url: "https://blog.google/innovation-and-ai/models-and-research/gemini-models/3-8-flash-and-3-8-flash-cyber/",
        publisher: "Google DeepMind",
        title: "Gemini 3.8 Flash announcement",
        publishedAt: "2026-09-02",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      pricing: [
      {
        url: "https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash",
        publisher: "Google DeepMind",
        title: "Gemini 3.8 Flash API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      modalities: [
      {
        url: "https://blog.google/innovation-and-ai/models-and-research/gemini-models/3-8-flash-and-3-8-flash-cyber/",
        publisher: "Google DeepMind",
        title: "Gemini 3.8 Flash announcement",
        publishedAt: "2026-09-02",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      benchmarks: [
      {
        url: "https://blog.google/innovation-and-ai/models-and-research/gemini-models/3-8-flash-and-3-8-flash-cyber/",
        publisher: "Google DeepMind",
        title: "Gemini 3.8 Flash announcement",
        publishedAt: "2026-09-02",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      isCompanyFlagship: [
      {
        url: "https://blog.google/innovation-and-ai/models-and-research/gemini-models/3-8-flash-and-3-8-flash-cyber/",
        publisher: "Google DeepMind",
        title: "Gemini 3.8 Flash announcement",
        publishedAt: "2026-09-02",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      isLatestCheckpoint: [
      {
        url: "https://blog.google/innovation-and-ai/models-and-research/gemini-models/3-8-flash-and-3-8-flash-cyber/",
        publisher: "Google DeepMind",
        title: "Gemini 3.8 Flash announcement",
        publishedAt: "2026-09-02",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
    },
    lastVerifiedAt: "2026-10-07",
    verificationStatus: "partially_verified",
    changeLog: [
      {
        date: "2026-09-02",
        summary: "Initial registry entry.",
        sources: [
          "https://blog.google/innovation-and-ai/models-and-research/gemini-models/3-8-flash-and-3-8-flash-cyber/",
        ],
      },
      {
        date: "2026-10-07",
        summary: "Audit correction: Re-sourced announcement to canonical blog URL and added API reference + model card; registry benchmark figures remain lab-reported, pending per-field recheck.",
        sources: [
          "https://blog.google/innovation-and-ai/models-and-research/gemini-models/3-8-flash-and-3-8-flash-cyber/",
          "https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash",
          "https://deepmind.google/models/model-cards/gemini-3-8-flash/",
        ],
      },
    ],
  },
  {
    id: "gemini-3-8-live-extended-thinking",
    companyId: "google",
    companyName: "Google DeepMind",
    name: "Gemini 3.8 Live Extended Thinking",
    version: "3.8-Live",
    releaseDate: "2026-09-15",
    isCompanyFlagship: false,
    isLatestCheckpoint: true,
    statusBadge: "#1 SPEECH-TO-SPEECH",
    category: "audio",
    categoryLabel: "Live Speech-to-Speech",
    contextWindow: "131,072 tokens",
    contextWindowTokens: 131072,
    maxOutputTokens: "65,536 tokens",
    parameters: "Undisclosed (Gemini 3 native audio stack)",
    openWeights: false,
    license: "Google AI Studio / Vertex AI",
    pricing: { input: 0.75, output: 4.5 },
    highlight:
      "Released Sept 15, 2026; Google's native speech-to-speech model that reasons and talks at once, with background tools, 97-language switching, and #1 82.6 on the Speech-to-Speech Quality Index.",
    modalities: ["Text", "Vision", "Audio", "Video"],
    variants: [
      {
        name: "Gemini 3.8 Live Extended Thinking",
        role: "REASONING LIVE",
        detail: "High-complexity live reasoning with configurable thinking (low/medium/high), simultaneous speech and background multi-step tool use for production voice agents.",
        pricingNote: "$0.75 in / $4.50 out per 1M text tokens ($0.005/min in / $0.018/min out audio; thinking billed as output)",
        link: "https://ai.google.dev/gemini-api/docs/models/gemini-3.8-live-extended-thinking",
      },
      {
        name: "Gemini 3.8 Live",
        role: "LOW-LATENCY LIVE",
        detail: "Cost-efficient native speech-to-speech for fluid dialogue and near real-time visual grounding with background async tools; #2 Speech Agent Arena.",
        pricingNote: "$0.75 in / $4.50 out per 1M text tokens ($0.005/min in / $0.018/min out audio)",
        link: "https://ai.google.dev/gemini-api/docs/models/gemini-3.8-live",
      },
    ],
    benchmarks: {},
    links: {
      announcement:
        "https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-8-live-gemini-3-8-live-extended-thinking/",
      playground: "https://aistudio.google.com",
      apiDocs: "https://ai.google.dev/gemini-api/docs/models/gemini-3.8-live-extended-thinking",
    },
    sources: [
    {
      url: "https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-8-live-gemini-3-8-live-extended-thinking/",
      publisher: "Google DeepMind",
      title: "Gemini 3.8 Live Extended Thinking announcement",
      accessedAt: "2026-10-07",
      sourceType: "announcement",
      live: true,
    },
    {
      url: "https://ai.google.dev/gemini-api/docs/models/gemini-3.8-live-extended-thinking",
      publisher: "Google DeepMind",
      title: "Gemini 3.8 Live Extended Thinking API reference",
      accessedAt: "2026-10-07",
      sourceType: "api-docs",
      live: true,
    },
    ],
    fieldSources: {
      releaseDate: [
      {
        url: "https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-8-live-gemini-3-8-live-extended-thinking/",
        publisher: "Google DeepMind",
        title: "Gemini 3.8 Live Extended Thinking announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      contextWindow: [
      {
        url: "https://ai.google.dev/gemini-api/docs/models/gemini-3.8-live-extended-thinking",
        publisher: "Google DeepMind",
        title: "Gemini 3.8 Live Extended Thinking API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      maxOutputTokens: [
      {
        url: "https://ai.google.dev/gemini-api/docs/models/gemini-3.8-live-extended-thinking",
        publisher: "Google DeepMind",
        title: "Gemini 3.8 Live Extended Thinking API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      parameters: [
      {
        url: "https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-8-live-gemini-3-8-live-extended-thinking/",
        publisher: "Google DeepMind",
        title: "Gemini 3.8 Live Extended Thinking announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      license: [
      {
        url: "https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-8-live-gemini-3-8-live-extended-thinking/",
        publisher: "Google DeepMind",
        title: "Gemini 3.8 Live Extended Thinking announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      pricing: [
      {
        url: "https://ai.google.dev/gemini-api/docs/models/gemini-3.8-live-extended-thinking",
        publisher: "Google DeepMind",
        title: "Gemini 3.8 Live Extended Thinking API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      modalities: [
      {
        url: "https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-8-live-gemini-3-8-live-extended-thinking/",
        publisher: "Google DeepMind",
        title: "Gemini 3.8 Live Extended Thinking announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      isCompanyFlagship: [
      {
        url: "https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-8-live-gemini-3-8-live-extended-thinking/",
        publisher: "Google DeepMind",
        title: "Gemini 3.8 Live Extended Thinking announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      isLatestCheckpoint: [
      {
        url: "https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-8-live-gemini-3-8-live-extended-thinking/",
        publisher: "Google DeepMind",
        title: "Gemini 3.8 Live Extended Thinking announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
    },
    lastVerifiedAt: "2026-10-07",
    verificationStatus: "partially_verified",
    changeLog: [
      {
        date: "2026-09-15",
        summary: "Initial registry entry.",
        sources: [
          "https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-8-live-gemini-3-8-live-extended-thinking/",
        ],
      },
    ],
  },

  // ─── XAI ─────────────────────────────────────────────────────────────────
  {
    id: "grok-4-6",
    companyId: "xai",
    companyName: "xAI",
    name: "Grok 4.6",
    version: "4.6",
    releaseDate: "2026-08-12",
    isCompanyFlagship: false,
    isLatestCheckpoint: false,
    statusBadge: "1.5T SUPERCOMPUTE",
    category: "flagship",
    categoryLabel: "Frontier Coding & STEM",
    contextWindow: "500,000 tokens",
    contextWindowTokens: 500000,
    maxOutputTokens: "65,536 tokens",
    parameters: "1.5 Trillion Parameters",
    openWeights: false,
    license: "Proprietary API / Grok Build",
    pricing: { input: 2.0, output: 6.0 },
    highlight: "Released August 12, 2026; xAI's smartest model with frontier performance in coding and autonomous agents, integrated natively into Cursor and Grok Build.",
    modalities: ["Text", "Vision", "Code"],
    benchmarks: {
      mmluPro: "86.1%",
      sweBench: "75.8%",
    },
    links: {
      announcement: "https://x.ai/blog/grok-4-6",
      playground: "https://x.com/i/grok",
    },
    sources: [
    {
      url: "https://x.ai/blog/grok-4-6",
      publisher: "xAI",
      title: "Grok 4.6 announcement",
      accessedAt: "2026-10-07",
      sourceType: "announcement",
      live: false,
      note: "Host alive; automated fetch blocked, page not re-confirmed on access date.",
    },
    ],
    fieldSources: {
      releaseDate: [
      {
        url: "https://x.ai/blog/grok-4-6",
        publisher: "xAI",
        title: "Grok 4.6 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: false,
        note: "Host alive; automated fetch blocked, page not re-confirmed on access date.",
      },
      ],
      contextWindow: [
      {
        url: "https://x.ai/blog/grok-4-6",
        publisher: "xAI",
        title: "Grok 4.6 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: false,
        note: "Host alive; automated fetch blocked, page not re-confirmed on access date.",
      },
      ],
      maxOutputTokens: [
      {
        url: "https://x.ai/blog/grok-4-6",
        publisher: "xAI",
        title: "Grok 4.6 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: false,
        note: "Host alive; automated fetch blocked, page not re-confirmed on access date.",
      },
      ],
      parameters: [
      {
        url: "https://x.ai/blog/grok-4-6",
        publisher: "xAI",
        title: "Grok 4.6 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: false,
        note: "Host alive; automated fetch blocked, page not re-confirmed on access date.",
      },
      ],
      license: [
      {
        url: "https://x.ai/blog/grok-4-6",
        publisher: "xAI",
        title: "Grok 4.6 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: false,
        note: "Host alive; automated fetch blocked, page not re-confirmed on access date.",
      },
      ],
      pricing: [
      {
        url: "https://x.ai/blog/grok-4-6",
        publisher: "xAI",
        title: "Grok 4.6 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: false,
        note: "Host alive; automated fetch blocked, page not re-confirmed on access date.",
      },
      ],
      modalities: [
      {
        url: "https://x.ai/blog/grok-4-6",
        publisher: "xAI",
        title: "Grok 4.6 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: false,
        note: "Host alive; automated fetch blocked, page not re-confirmed on access date.",
      },
      ],
      benchmarks: [
      {
        url: "https://x.ai/blog/grok-4-6",
        publisher: "xAI",
        title: "Grok 4.6 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: false,
        note: "Host alive; automated fetch blocked, page not re-confirmed on access date.",
      },
      ],
      isCompanyFlagship: [
      {
        url: "https://x.ai/blog/grok-4-6",
        publisher: "xAI",
        title: "Grok 4.6 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: false,
        note: "Host alive; automated fetch blocked, page not re-confirmed on access date.",
      },
      ],
      isLatestCheckpoint: [
      {
        url: "https://x.ai/blog/grok-4-6",
        publisher: "xAI",
        title: "Grok 4.6 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: false,
        note: "Host alive; automated fetch blocked, page not re-confirmed on access date.",
      },
      ],
    },
    lastVerifiedAt: "2026-10-07",
    verificationStatus: "partially_verified",
    changeLog: [
      {
        date: "2026-08-12",
        summary: "Initial registry entry.",
        sources: [
          "https://x.ai/blog/grok-4-6",
        ],
      },
    ],
  },
  {
    id: "grok-4-7",
    companyId: "xai",
    companyName: "xAI",
    name: "Grok 4.7",
    version: "4.7",
    releaseDate: "2026-09-21",
    isCompanyFlagship: true,
    isLatestCheckpoint: true,
    statusBadge: "XAI FLAGSHIP",
    category: "flagship",
    categoryLabel: "Frontier Coding & Knowledge",
    contextWindow: "500,000 tokens",
    contextWindowTokens: 500000,
    maxOutputTokens: "65,536 tokens",
    parameters: "Undisclosed (xAI, larger base than 4.6)",
    openWeights: false,
    license: "Proprietary API / Grok Build",
    pricing: { input: 2.0, output: 6.0 },
    highlight:
      "Released Sept 21, 2026; xAI's flagship for coding and knowledge work on a larger base with longer RL, matching Grok 4.6 price/speed ($2/$6) with 46.3% CursorBench 4.0 and 71.0% DeepSWE v1.1.",
    modalities: ["Text", "Vision", "Code"],
    benchmarks: {
      sweBench: "71.0% (DeepSWE v1.1)",
      terminalBench: "37.6%",
    },
    links: {
      announcement: "https://x.ai/news/grok-4-7",
      playground: "https://x.com/i/grok",
      apiDocs: "https://docs.x.ai",
    },
    sources: [
    {
      url: "https://x.ai/news/grok-4-7",
      publisher: "xAI",
      title: "Grok 4.7 announcement",
      accessedAt: "2026-10-07",
      sourceType: "announcement",
      live: true,
    },
    {
      url: "https://docs.x.ai",
      publisher: "xAI",
      title: "Grok 4.7 API reference",
      accessedAt: "2026-10-07",
      sourceType: "api-docs",
      live: true,
    },
    ],
    fieldSources: {
      releaseDate: [
      {
        url: "https://x.ai/news/grok-4-7",
        publisher: "xAI",
        title: "Grok 4.7 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      contextWindow: [
      {
        url: "https://docs.x.ai",
        publisher: "xAI",
        title: "Grok 4.7 API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      maxOutputTokens: [
      {
        url: "https://docs.x.ai",
        publisher: "xAI",
        title: "Grok 4.7 API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      parameters: [
      {
        url: "https://x.ai/news/grok-4-7",
        publisher: "xAI",
        title: "Grok 4.7 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      license: [
      {
        url: "https://x.ai/news/grok-4-7",
        publisher: "xAI",
        title: "Grok 4.7 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      pricing: [
      {
        url: "https://docs.x.ai",
        publisher: "xAI",
        title: "Grok 4.7 API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      modalities: [
      {
        url: "https://x.ai/news/grok-4-7",
        publisher: "xAI",
        title: "Grok 4.7 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      benchmarks: [
      {
        url: "https://x.ai/news/grok-4-7",
        publisher: "xAI",
        title: "Grok 4.7 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      isCompanyFlagship: [
      {
        url: "https://x.ai/news/grok-4-7",
        publisher: "xAI",
        title: "Grok 4.7 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      isLatestCheckpoint: [
      {
        url: "https://x.ai/news/grok-4-7",
        publisher: "xAI",
        title: "Grok 4.7 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
    },
    lastVerifiedAt: "2026-10-07",
    verificationStatus: "partially_verified",
    changeLog: [
      {
        date: "2026-09-21",
        summary: "Initial registry entry.",
        sources: [
          "https://x.ai/news/grok-4-7",
        ],
      },
    ],
  },
  {
    id: "grok-voice-transcribe-2",
    companyId: "xai",
    companyName: "xAI",
    name: "Grok Voice Transcribe 2.0",
    version: "2.0",
    releaseDate: "2026-09-18",
    isCompanyFlagship: false,
    isLatestCheckpoint: true,
    statusBadge: "NEW DROP",
    category: "audio",
    categoryLabel: "Speech-to-Text",
    contextWindow: "Streaming + batch audio",
    contextWindowTokens: 0,
    maxOutputTokens: "Transcript with timestamps",
    parameters: "Undisclosed (xAI)",
    openWeights: false,
    license: "Proprietary API / Grok Build",
    pricing: { input: 0.000028, output: 0.000056 },
    pricingUnit: "per second",
    highlight: "Released Sept 18, 2026; xAI's speech-to-text 2.0 ranked first for accuracy among 32 streaming models on Artificial Analysis, at $0.10/hr batch and $0.20/hr streaming.",
    modalities: ["Audio", "Text"],
    benchmarks: {},
    links: {
      announcement: "https://x.ai/news/grok-voice-transcribe-2",
    },
    sources: [
    {
      url: "https://x.ai/news/grok-voice-transcribe-2",
      publisher: "xAI",
      title: "Grok Voice Transcribe 2.0 announcement",
      accessedAt: "2026-10-07",
      sourceType: "announcement",
      live: true,
    },
    ],
    fieldSources: {
      releaseDate: [
      {
        url: "https://x.ai/news/grok-voice-transcribe-2",
        publisher: "xAI",
        title: "Grok Voice Transcribe 2.0 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      contextWindow: [
      {
        url: "https://x.ai/news/grok-voice-transcribe-2",
        publisher: "xAI",
        title: "Grok Voice Transcribe 2.0 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      maxOutputTokens: [
      {
        url: "https://x.ai/news/grok-voice-transcribe-2",
        publisher: "xAI",
        title: "Grok Voice Transcribe 2.0 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      parameters: [
      {
        url: "https://x.ai/news/grok-voice-transcribe-2",
        publisher: "xAI",
        title: "Grok Voice Transcribe 2.0 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      license: [
      {
        url: "https://x.ai/news/grok-voice-transcribe-2",
        publisher: "xAI",
        title: "Grok Voice Transcribe 2.0 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      pricing: [
      {
        url: "https://x.ai/news/grok-voice-transcribe-2",
        publisher: "xAI",
        title: "Grok Voice Transcribe 2.0 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      modalities: [
      {
        url: "https://x.ai/news/grok-voice-transcribe-2",
        publisher: "xAI",
        title: "Grok Voice Transcribe 2.0 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      isCompanyFlagship: [
      {
        url: "https://x.ai/news/grok-voice-transcribe-2",
        publisher: "xAI",
        title: "Grok Voice Transcribe 2.0 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      isLatestCheckpoint: [
      {
        url: "https://x.ai/news/grok-voice-transcribe-2",
        publisher: "xAI",
        title: "Grok Voice Transcribe 2.0 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
    },
    lastVerifiedAt: "2026-10-07",
    verificationStatus: "partially_verified",
    changeLog: [
      {
        date: "2026-09-18",
        summary: "Initial registry entry.",
        sources: [
          "https://x.ai/news/grok-voice-transcribe-2",
        ],
      },
    ],
  },

  // ─── DEEPSEEK ────────────────────────────────────────────────────────────
  {
    id: "deepseek-v4-1-flash",
    companyId: "deepseek",
    companyName: "DeepSeek",
    name: "DeepSeek V4.1 Flash",
    version: "V4.1-Flash",
    releaseDate: "2026-09-10",
    isCompanyFlagship: true,
    isLatestCheckpoint: true,
    statusBadge: "NEW ARCHITECTURE FLAGSHIP",
    category: "flagship",
    categoryLabel: "Frontier Multimodal MoE",
    contextWindow: "1,000,000 tokens",
    contextWindowTokens: 1000000,
    maxOutputTokens: "384,000 tokens",
    parameters: "552B MoE (8B / 16B Activated)",
    openWeights: true,
    license: "MIT License",
    pricing: { input: 0.3, output: 1.2 },
    highlight:
      "Released Sept 10, 2026; first of DeepSeek's Causal Encoder-Decoder family with native image+text, 1M context and 384K output. Replaces V4-Flash and V4-Pro from Sept 14.",
    modalities: ["Text", "Vision", "Code"],
    benchmarks: {
      mmluPro: "74.1%",
      terminalBench: "90.6%",
      sweBench: "74.2% (DeepSWE v1.1)",
      gpqa: "90.9%",
    },
    links: {
      announcement: "https://www.deepseek.com/en/news/deepseek-v4-1-flash/",
      playground: "https://chat.deepseek.com",
      paper: "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/blob/main/DeepSeek_V41_Tech_Report.pdf",
      apiDocs: "https://api-docs.deepseek.com/news/news260910",
      weights: "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash",
    },
    sources: [
    {
      url: "https://www.deepseek.com/en/news/deepseek-v4-1-flash/",
      publisher: "DeepSeek",
      title: "DeepSeek V4.1 Flash announcement",
      accessedAt: "2026-10-07",
      sourceType: "announcement",
      live: true,
    },
    {
      url: "https://api-docs.deepseek.com/news/news260910",
      publisher: "DeepSeek",
      title: "DeepSeek V4.1 Flash API reference",
      accessedAt: "2026-10-07",
      sourceType: "api-docs",
      live: true,
    },
    {
      url: "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash",
      publisher: "DeepSeek",
      title: "DeepSeek V4.1 Flash open weights",
      accessedAt: "2026-10-07",
      sourceType: "weights",
      live: true,
    },
    {
      url: "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/blob/main/DeepSeek_V41_Tech_Report.pdf",
      publisher: "DeepSeek",
      title: "DeepSeek V4.1 Flash technical report",
      accessedAt: "2026-10-07",
      sourceType: "paper",
      live: true,
    },
    ],
    fieldSources: {
      releaseDate: [
      {
        url: "https://www.deepseek.com/en/news/deepseek-v4-1-flash/",
        publisher: "DeepSeek",
        title: "DeepSeek V4.1 Flash announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      contextWindow: [
      {
        url: "https://api-docs.deepseek.com/news/news260910",
        publisher: "DeepSeek",
        title: "DeepSeek V4.1 Flash API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      maxOutputTokens: [
      {
        url: "https://api-docs.deepseek.com/news/news260910",
        publisher: "DeepSeek",
        title: "DeepSeek V4.1 Flash API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      parameters: [
      {
        url: "https://www.deepseek.com/en/news/deepseek-v4-1-flash/",
        publisher: "DeepSeek",
        title: "DeepSeek V4.1 Flash announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      license: [
      {
        url: "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash",
        publisher: "DeepSeek",
        title: "DeepSeek V4.1 Flash open weights",
        accessedAt: "2026-10-07",
        sourceType: "weights",
        live: true,
      },
      ],
      pricing: [
      {
        url: "https://api-docs.deepseek.com/news/news260910",
        publisher: "DeepSeek",
        title: "DeepSeek V4.1 Flash API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      modalities: [
      {
        url: "https://www.deepseek.com/en/news/deepseek-v4-1-flash/",
        publisher: "DeepSeek",
        title: "DeepSeek V4.1 Flash announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      benchmarks: [
      {
        url: "https://www.deepseek.com/en/news/deepseek-v4-1-flash/",
        publisher: "DeepSeek",
        title: "DeepSeek V4.1 Flash announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      isCompanyFlagship: [
      {
        url: "https://www.deepseek.com/en/news/deepseek-v4-1-flash/",
        publisher: "DeepSeek",
        title: "DeepSeek V4.1 Flash announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      isLatestCheckpoint: [
      {
        url: "https://www.deepseek.com/en/news/deepseek-v4-1-flash/",
        publisher: "DeepSeek",
        title: "DeepSeek V4.1 Flash announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
    },
    lastVerifiedAt: "2026-10-07",
    verificationStatus: "partially_verified",
    changeLog: [
      {
        date: "2026-09-10",
        summary: "Initial registry entry.",
        sources: [
          "https://www.deepseek.com/en/news/deepseek-v4-1-flash/",
        ],
      },
    ],
  },
  {
    id: "deepseek-v4-pro-0813",
    companyId: "deepseek",
    companyName: "DeepSeek",
    name: "DeepSeek V4-Pro (0813)",
    version: "V4-Pro",
    releaseDate: "2026-08-13",
    isCompanyFlagship: false,
    isLatestCheckpoint: true,
    statusBadge: "1.6T HOSTED SOTA",
    category: "flagship",
    categoryLabel: "Frontier MoE",
    contextWindow: "1,048,576 tokens",
    contextWindowTokens: 1048576,
    maxOutputTokens: "65,536 tokens",
    parameters: "1.6 Trillion Total (49B Activated)",
    openWeights: false,
    license: "DeepSeek API / Enterprise",
    pricing: { input: 1.12, output: 3.35 },
    highlight: "DeepSeek's primary 1.6T parameter powerhouse with 49B activated per token, configurable thinking budget, and 1M context.",
    modalities: ["Text", "Code"],
    benchmarks: {
      mmluPro: "85.7%",
      sweBench: "72.4%",
    },
    links: {
      announcement: "https://api-docs.deepseek.com/news/news260813",
      playground: "https://chat.deepseek.com",
    },
    sources: [
    {
      url: "https://api-docs.deepseek.com/news/news260813",
      publisher: "DeepSeek",
      title: "DeepSeek V4-Pro (0813) announcement",
      accessedAt: "2026-10-07",
      sourceType: "announcement",
      live: true,
    },
    ],
    fieldSources: {
      releaseDate: [
      {
        url: "https://api-docs.deepseek.com/news/news260813",
        publisher: "DeepSeek",
        title: "DeepSeek V4-Pro (0813) announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      contextWindow: [
      {
        url: "https://api-docs.deepseek.com/news/news260813",
        publisher: "DeepSeek",
        title: "DeepSeek V4-Pro (0813) announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      maxOutputTokens: [
      {
        url: "https://api-docs.deepseek.com/news/news260813",
        publisher: "DeepSeek",
        title: "DeepSeek V4-Pro (0813) announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      parameters: [
      {
        url: "https://api-docs.deepseek.com/news/news260813",
        publisher: "DeepSeek",
        title: "DeepSeek V4-Pro (0813) announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      license: [
      {
        url: "https://api-docs.deepseek.com/news/news260813",
        publisher: "DeepSeek",
        title: "DeepSeek V4-Pro (0813) announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      pricing: [
      {
        url: "https://api-docs.deepseek.com/news/news260813",
        publisher: "DeepSeek",
        title: "DeepSeek V4-Pro (0813) announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      modalities: [
      {
        url: "https://api-docs.deepseek.com/news/news260813",
        publisher: "DeepSeek",
        title: "DeepSeek V4-Pro (0813) announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      benchmarks: [
      {
        url: "https://api-docs.deepseek.com/news/news260813",
        publisher: "DeepSeek",
        title: "DeepSeek V4-Pro (0813) announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      isCompanyFlagship: [
      {
        url: "https://api-docs.deepseek.com/news/news260813",
        publisher: "DeepSeek",
        title: "DeepSeek V4-Pro (0813) announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      isLatestCheckpoint: [
      {
        url: "https://api-docs.deepseek.com/news/news260813",
        publisher: "DeepSeek",
        title: "DeepSeek V4-Pro (0813) announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
    },
    lastVerifiedAt: "2026-10-07",
    verificationStatus: "partially_verified",
    changeLog: [
      {
        date: "2026-08-13",
        summary: "Initial registry entry.",
        sources: [
          "https://api-docs.deepseek.com/news/news260813",
        ],
      },
    ],
  },
  {
    id: "deepseek-v4-flash-vision-exp",
    companyId: "deepseek",
    companyName: "DeepSeek",
    name: "DeepSeek V4 Flash Vision Exp",
    version: "V4-Vision-Exp",
    releaseDate: "2026-08-30",
    isCompanyFlagship: false,
    isLatestCheckpoint: false,
    statusBadge: "OPEN WEIGHTS (MIT)",
    category: "open-weights",
    categoryLabel: "Open Vision MoE",
    contextWindow: "262,144 tokens",
    contextWindowTokens: 262144,
    maxOutputTokens: "32,768 tokens",
    parameters: "305B MoE",
    openWeights: true,
    license: "MIT License",
    pricing: { input: 0.12, output: 0.36 },
    highlight: "Open-sourced under MIT license on August 30, 2026. 305B parameter multimodal vision-language model with native document understanding.",
    modalities: ["Text", "Vision", "Code"],
    benchmarks: {
      mmluPro: "81.4%",
    },
    links: {
      weights: "https://huggingface.co/deepseek-ai",
    },
    sources: [
    {
      url: "https://huggingface.co/deepseek-ai",
      publisher: "DeepSeek",
      title: "DeepSeek V4 Flash Vision Exp open weights",
      accessedAt: "2026-10-07",
      sourceType: "weights",
      live: true,
    },
    ],
    fieldSources: {
      releaseDate: [
      {
        url: "https://huggingface.co/deepseek-ai",
        publisher: "DeepSeek",
        title: "DeepSeek V4 Flash Vision Exp open weights",
        accessedAt: "2026-10-07",
        sourceType: "weights",
        live: true,
      },
      ],
      parameters: [
      {
        url: "https://huggingface.co/deepseek-ai",
        publisher: "DeepSeek",
        title: "DeepSeek V4 Flash Vision Exp open weights",
        accessedAt: "2026-10-07",
        sourceType: "weights",
        live: true,
      },
      ],
      license: [
      {
        url: "https://huggingface.co/deepseek-ai",
        publisher: "DeepSeek",
        title: "DeepSeek V4 Flash Vision Exp open weights",
        accessedAt: "2026-10-07",
        sourceType: "weights",
        live: true,
      },
      ],
      modalities: [
      {
        url: "https://huggingface.co/deepseek-ai",
        publisher: "DeepSeek",
        title: "DeepSeek V4 Flash Vision Exp open weights",
        accessedAt: "2026-10-07",
        sourceType: "weights",
        live: true,
      },
      ],
      isCompanyFlagship: [
      {
        url: "https://huggingface.co/deepseek-ai",
        publisher: "DeepSeek",
        title: "DeepSeek V4 Flash Vision Exp open weights",
        accessedAt: "2026-10-07",
        sourceType: "weights",
        live: true,
      },
      ],
      isLatestCheckpoint: [
      {
        url: "https://huggingface.co/deepseek-ai",
        publisher: "DeepSeek",
        title: "DeepSeek V4 Flash Vision Exp open weights",
        accessedAt: "2026-10-07",
        sourceType: "weights",
        live: true,
      },
      ],
    },
    lastVerifiedAt: "2026-10-07",
    verificationStatus: "partially_verified",
    changeLog: [
      {
        date: "2026-08-30",
        summary: "Initial registry entry.",
        sources: [
          "https://huggingface.co/deepseek-ai",
        ],
      },
    ],
  },

  // ─── META AI ─────────────────────────────────────────────────────────────
  {
    id: "meta-muse-spark-1-3",
    companyId: "meta",
    companyName: "Meta AI",
    name: "Muse Spark 1.3",
    version: "1.3",
    releaseDate: "2026-09-03",
    isCompanyFlagship: true,
    isLatestCheckpoint: true,
    statusBadge: "LATEST META SOTA",
    category: "flagship",
    categoryLabel: "Real-time Multimodal Spark",
    contextWindow: "262,144 tokens",
    contextWindowTokens: 262144,
    maxOutputTokens: "32,768 tokens",
    parameters: "14B Dense Real-time Multimodal",
    openWeights: true,
    license: "Meta Community License",
    pricing: { input: 0.05, output: 0.15 },
    highlight: "Released Sept 3, 2026; Meta's ultra-cheap ($0.05/M in, $0.15/M out) real-time multimodal model with native simultaneous voice, vision, and ultra-low latency response under 80ms.",
    modalities: ["Text", "Vision", "Audio", "Code"],
    benchmarks: {
      mmluPro: "81.9%",
      gpqa: "68.4%",
    },
    links: {
      announcement: "https://ai.meta.com/blog/muse-spark-1-3/",
      weights: "https://huggingface.co/meta-llama",
    },
    sources: [
    {
      url: "https://huggingface.co/meta-llama",
      publisher: "Meta",
      title: "Muse Spark 1.3 open weights",
      accessedAt: "2026-10-07",
      sourceType: "weights",
      live: true,
    },
    ],
    fieldSources: {
      releaseDate: [
      {
        url: "https://huggingface.co/meta-llama",
        publisher: "Meta",
        title: "Muse Spark 1.3 open weights",
        accessedAt: "2026-10-07",
        sourceType: "weights",
        live: true,
      },
      ],
      parameters: [
      {
        url: "https://huggingface.co/meta-llama",
        publisher: "Meta",
        title: "Muse Spark 1.3 open weights",
        accessedAt: "2026-10-07",
        sourceType: "weights",
        live: true,
      },
      ],
      license: [
      {
        url: "https://huggingface.co/meta-llama",
        publisher: "Meta",
        title: "Muse Spark 1.3 open weights",
        accessedAt: "2026-10-07",
        sourceType: "weights",
        live: true,
      },
      ],
      modalities: [
      {
        url: "https://huggingface.co/meta-llama",
        publisher: "Meta",
        title: "Muse Spark 1.3 open weights",
        accessedAt: "2026-10-07",
        sourceType: "weights",
        live: true,
      },
      ],
      isCompanyFlagship: [
      {
        url: "https://huggingface.co/meta-llama",
        publisher: "Meta",
        title: "Muse Spark 1.3 open weights",
        accessedAt: "2026-10-07",
        sourceType: "weights",
        live: true,
      },
      ],
      isLatestCheckpoint: [
      {
        url: "https://huggingface.co/meta-llama",
        publisher: "Meta",
        title: "Muse Spark 1.3 open weights",
        accessedAt: "2026-10-07",
        sourceType: "weights",
        live: true,
      },
      ],
    },
    lastVerifiedAt: "2026-10-07",
    verificationStatus: "partially_verified",
    changeLog: [
      {
        date: "2026-09-03",
        summary: "Initial registry entry.",
        sources: [
          "https://huggingface.co/meta-llama",
        ],
      },
    ],
  },
  {
    id: "llama-4-maverick",
    companyId: "meta",
    companyName: "Meta AI",
    name: "Llama 4 Maverick (128E)",
    version: "4.0",
    releaseDate: "2026-04-18",
    isCompanyFlagship: false,
    isLatestCheckpoint: false,
    statusBadge: "128E OPEN MOE",
    category: "open-weights",
    categoryLabel: "128-Expert Open MoE",
    contextWindow: "1,048,576 tokens",
    contextWindowTokens: 1048576,
    maxOutputTokens: "32,768 tokens",
    parameters: "128-Expert Mixture-of-Experts",
    openWeights: true,
    license: "Meta Community License",
    pricing: { input: 0.45, output: 1.35 },
    highlight: "Meta's trillion-parameter open foundation model. 128-expert MoE architecture with 1M token context, powering enterprise on-premise deployments and community fine-tuning.",
    modalities: ["Text", "Vision", "Code"],
    benchmarks: {
      mmluPro: "83.6%",
      sweBench: "71.2%",
    },
    links: {
      announcement: "https://ai.meta.com/blog/llama-4/",
      weights: "https://huggingface.co/meta-llama",
    },
    sources: [
    {
      url: "https://huggingface.co/meta-llama",
      publisher: "Meta",
      title: "Llama 4 Maverick (128E) open weights",
      accessedAt: "2026-10-07",
      sourceType: "weights",
      live: true,
    },
    ],
    fieldSources: {
      releaseDate: [
      {
        url: "https://huggingface.co/meta-llama",
        publisher: "Meta",
        title: "Llama 4 Maverick (128E) open weights",
        accessedAt: "2026-10-07",
        sourceType: "weights",
        live: true,
      },
      ],
      parameters: [
      {
        url: "https://huggingface.co/meta-llama",
        publisher: "Meta",
        title: "Llama 4 Maverick (128E) open weights",
        accessedAt: "2026-10-07",
        sourceType: "weights",
        live: true,
      },
      ],
      license: [
      {
        url: "https://huggingface.co/meta-llama",
        publisher: "Meta",
        title: "Llama 4 Maverick (128E) open weights",
        accessedAt: "2026-10-07",
        sourceType: "weights",
        live: true,
      },
      ],
      modalities: [
      {
        url: "https://huggingface.co/meta-llama",
        publisher: "Meta",
        title: "Llama 4 Maverick (128E) open weights",
        accessedAt: "2026-10-07",
        sourceType: "weights",
        live: true,
      },
      ],
      isCompanyFlagship: [
      {
        url: "https://huggingface.co/meta-llama",
        publisher: "Meta",
        title: "Llama 4 Maverick (128E) open weights",
        accessedAt: "2026-10-07",
        sourceType: "weights",
        live: true,
      },
      ],
      isLatestCheckpoint: [
      {
        url: "https://huggingface.co/meta-llama",
        publisher: "Meta",
        title: "Llama 4 Maverick (128E) open weights",
        accessedAt: "2026-10-07",
        sourceType: "weights",
        live: true,
      },
      ],
    },
    lastVerifiedAt: "2026-10-07",
    verificationStatus: "partially_verified",
    changeLog: [
      {
        date: "2026-04-18",
        summary: "Initial registry entry.",
        sources: [
          "https://huggingface.co/meta-llama",
        ],
      },
    ],
  },
  {
    id: "llama-4-scout",
    companyId: "meta",
    companyName: "Meta AI",
    name: "Llama 4 Scout (16E)",
    version: "4.0-Scout",
    releaseDate: "2026-05-10",
    isCompanyFlagship: false,
    isLatestCheckpoint: false,
    statusBadge: "LONG CONTEXT MOE",
    category: "open-weights",
    categoryLabel: "1.31M Context Scout",
    contextWindow: "1,310,720 tokens",
    contextWindowTokens: 1310720,
    maxOutputTokens: "32,768 tokens",
    parameters: "16-Expert MoE",
    openWeights: true,
    license: "Meta Community License",
    pricing: { input: 0.2, output: 0.6 },
    highlight: "Extended-context open-weights model capable of ingesting 1.31 million tokens in a single prompt for codebase-wide document analysis.",
    modalities: ["Text", "Code"],
    benchmarks: {
      mmluPro: "78.4%",
    },
    links: {
      weights: "https://huggingface.co/meta-llama",
    },
    sources: [
    {
      url: "https://huggingface.co/meta-llama",
      publisher: "Meta",
      title: "Llama 4 Scout (16E) open weights",
      accessedAt: "2026-10-07",
      sourceType: "weights",
      live: true,
    },
    ],
    fieldSources: {
      releaseDate: [
      {
        url: "https://huggingface.co/meta-llama",
        publisher: "Meta",
        title: "Llama 4 Scout (16E) open weights",
        accessedAt: "2026-10-07",
        sourceType: "weights",
        live: true,
      },
      ],
      parameters: [
      {
        url: "https://huggingface.co/meta-llama",
        publisher: "Meta",
        title: "Llama 4 Scout (16E) open weights",
        accessedAt: "2026-10-07",
        sourceType: "weights",
        live: true,
      },
      ],
      license: [
      {
        url: "https://huggingface.co/meta-llama",
        publisher: "Meta",
        title: "Llama 4 Scout (16E) open weights",
        accessedAt: "2026-10-07",
        sourceType: "weights",
        live: true,
      },
      ],
      modalities: [
      {
        url: "https://huggingface.co/meta-llama",
        publisher: "Meta",
        title: "Llama 4 Scout (16E) open weights",
        accessedAt: "2026-10-07",
        sourceType: "weights",
        live: true,
      },
      ],
      isCompanyFlagship: [
      {
        url: "https://huggingface.co/meta-llama",
        publisher: "Meta",
        title: "Llama 4 Scout (16E) open weights",
        accessedAt: "2026-10-07",
        sourceType: "weights",
        live: true,
      },
      ],
      isLatestCheckpoint: [
      {
        url: "https://huggingface.co/meta-llama",
        publisher: "Meta",
        title: "Llama 4 Scout (16E) open weights",
        accessedAt: "2026-10-07",
        sourceType: "weights",
        live: true,
      },
      ],
    },
    lastVerifiedAt: "2026-10-07",
    verificationStatus: "partially_verified",
    changeLog: [
      {
        date: "2026-05-10",
        summary: "Initial registry entry.",
        sources: [
          "https://huggingface.co/meta-llama",
        ],
      },
    ],
  },
  {
    id: "meta-muse-voice-transcribe",
    companyId: "meta",
    companyName: "Meta AI",
    name: "Muse Voice Transcribe",
    version: "1.0",
    releaseDate: "2026-09-01",
    isCompanyFlagship: false,
    isLatestCheckpoint: true,
    statusBadge: "AUDIO CHECKPOINT",
    category: "audio",
    categoryLabel: "Streaming Speech",
    contextWindow: "Undisclosed (audio streaming)",
    contextWindowTokens: 0,
    maxOutputTokens: "Transcript with timestamps",
    parameters: "Streaming Audio Foundation",
    openWeights: false,
    license: "Proprietary API (Meta Model API)",
    pricing: { input: 0.00005, output: 0 },
    pricingUnit: "per second",
    highlight: "Announced Sept 1, 2026; Meta's streaming speech-to-text model with diarization and endpointing, trained on 70+ languages (25 validated), billed at $3.00 per 1,000 audio minutes ($0.18/hr).",
    modalities: ["Audio", "Text"],
    benchmarks: {},
    links: {
      announcement: "https://research.meta.ai/blog/introducing-muse-voice-transcribe",
      apiDocs: "https://dev.meta.ai/docs/speech-to-text",
    },
    sources: [
    {
      url: "https://research.meta.ai/blog/introducing-muse-voice-transcribe",
      publisher: "Meta",
      title: "Muse Voice Transcribe announcement",
      publishedAt: "2026-09-01",
      accessedAt: "2026-10-07",
      sourceType: "announcement",
      live: true,
    },
    {
      url: "https://dev.meta.ai/docs/speech-to-text",
      publisher: "Meta",
      title: "Muse Voice Transcribe API reference",
      accessedAt: "2026-10-07",
      sourceType: "api-docs",
      live: true,
    },
    {
      url: "https://dev.meta.ai/models/muse-voice-transcribe",
      publisher: "Meta",
      title: "Muse Voice Transcribe model page and pricing",
      accessedAt: "2026-10-07",
      sourceType: "pricing",
      live: true,
    },
    ],
    fieldSources: {
      releaseDate: [
      {
        url: "https://research.meta.ai/blog/introducing-muse-voice-transcribe",
        publisher: "Meta",
        title: "Muse Voice Transcribe announcement",
        publishedAt: "2026-09-01",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      contextWindow: [
      {
        url: "https://dev.meta.ai/docs/speech-to-text",
        publisher: "Meta",
        title: "Muse Voice Transcribe API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      maxOutputTokens: [
      {
        url: "https://dev.meta.ai/docs/speech-to-text",
        publisher: "Meta",
        title: "Muse Voice Transcribe API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      parameters: [
      {
        url: "https://research.meta.ai/blog/introducing-muse-voice-transcribe",
        publisher: "Meta",
        title: "Muse Voice Transcribe announcement",
        publishedAt: "2026-09-01",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      license: [
      {
        url: "https://research.meta.ai/blog/introducing-muse-voice-transcribe",
        publisher: "Meta",
        title: "Muse Voice Transcribe announcement",
        publishedAt: "2026-09-01",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      pricing: [
      {
        url: "https://dev.meta.ai/models/muse-voice-transcribe",
        publisher: "Meta",
        title: "Muse Voice Transcribe model page and pricing",
        accessedAt: "2026-10-07",
        sourceType: "pricing",
        live: true,
      },
      ],
      modalities: [
      {
        url: "https://research.meta.ai/blog/introducing-muse-voice-transcribe",
        publisher: "Meta",
        title: "Muse Voice Transcribe announcement",
        publishedAt: "2026-09-01",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      isCompanyFlagship: [
      {
        url: "https://research.meta.ai/blog/introducing-muse-voice-transcribe",
        publisher: "Meta",
        title: "Muse Voice Transcribe announcement",
        publishedAt: "2026-09-01",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      isLatestCheckpoint: [
      {
        url: "https://research.meta.ai/blog/introducing-muse-voice-transcribe",
        publisher: "Meta",
        title: "Muse Voice Transcribe announcement",
        publishedAt: "2026-09-01",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
    },
    lastVerifiedAt: "2026-10-07",
    verificationStatus: "partially_verified",
    changeLog: [
      {
        date: "2026-09-01",
        summary: "Initial registry entry.",
        sources: [
          "https://research.meta.ai/blog/introducing-muse-voice-transcribe",
        ],
      },
      {
        date: "2026-10-07",
        summary: "Audit correction: Corrected billing to per-second audio pricing ($3.00/1,000 min), removed unsupported token-context figures and open-weights claim, re-sourced to live Meta Research + Model API pages.",
        sources: [
          "https://research.meta.ai/blog/introducing-muse-voice-transcribe",
          "https://dev.meta.ai/docs/speech-to-text",
          "https://dev.meta.ai/models/muse-voice-transcribe",
        ],
      },
    ],
  },

  // ─── ALIBABA CLOUD / QWEN ────────────────────────────────────────────────
  {
    id: "qwen-3-8-2-4t-a95b",
    companyId: "qwen",
    companyName: "Alibaba Cloud (Qwen)",
    name: "Qwen3.8 2.4T A95B",
    version: "3.8-2.4T",
    releaseDate: "2026-08-12",
    isCompanyFlagship: true,
    isLatestCheckpoint: false,
    statusBadge: "2.4T OPEN TITAN",
    category: "open-weights",
    categoryLabel: "Largest Open MoE",
    contextWindow: "1,000,000 tokens",
    contextWindowTokens: 1000000,
    maxOutputTokens: "32,768 tokens",
    parameters: "2.4 Trillion Total (95B Activated)",
    openWeights: true,
    license: "Qwen Community License",
    pricing: { input: 0.8, output: 2.4 },
    highlight: "The largest open-weight MoE model in existence. 2.4 Trillion parameters with 95B activated per token and 1M context, available on HuggingFace and ModelScope.",
    modalities: ["Text", "Code"],
    benchmarks: {
      mmluPro: "85.2%",
      sweBench: "74.1%",
    },
    links: {
      announcement: "https://qwenlm.github.io/blog/qwen3.8-2.4t/",
      weights: "https://huggingface.co/Qwen",
    },
    sources: [
    {
      url: "https://huggingface.co/Qwen",
      publisher: "Alibaba Cloud (Qwen)",
      title: "Qwen3.8 2.4T A95B open weights",
      accessedAt: "2026-10-07",
      sourceType: "weights",
      live: true,
    },
    ],
    fieldSources: {
      releaseDate: [
      {
        url: "https://huggingface.co/Qwen",
        publisher: "Alibaba Cloud (Qwen)",
        title: "Qwen3.8 2.4T A95B open weights",
        accessedAt: "2026-10-07",
        sourceType: "weights",
        live: true,
      },
      ],
      parameters: [
      {
        url: "https://huggingface.co/Qwen",
        publisher: "Alibaba Cloud (Qwen)",
        title: "Qwen3.8 2.4T A95B open weights",
        accessedAt: "2026-10-07",
        sourceType: "weights",
        live: true,
      },
      ],
      license: [
      {
        url: "https://huggingface.co/Qwen",
        publisher: "Alibaba Cloud (Qwen)",
        title: "Qwen3.8 2.4T A95B open weights",
        accessedAt: "2026-10-07",
        sourceType: "weights",
        live: true,
      },
      ],
      modalities: [
      {
        url: "https://huggingface.co/Qwen",
        publisher: "Alibaba Cloud (Qwen)",
        title: "Qwen3.8 2.4T A95B open weights",
        accessedAt: "2026-10-07",
        sourceType: "weights",
        live: true,
      },
      ],
      isCompanyFlagship: [
      {
        url: "https://huggingface.co/Qwen",
        publisher: "Alibaba Cloud (Qwen)",
        title: "Qwen3.8 2.4T A95B open weights",
        accessedAt: "2026-10-07",
        sourceType: "weights",
        live: true,
      },
      ],
      isLatestCheckpoint: [
      {
        url: "https://huggingface.co/Qwen",
        publisher: "Alibaba Cloud (Qwen)",
        title: "Qwen3.8 2.4T A95B open weights",
        accessedAt: "2026-10-07",
        sourceType: "weights",
        live: true,
      },
      ],
    },
    lastVerifiedAt: "2026-10-07",
    verificationStatus: "partially_verified",
    changeLog: [
      {
        date: "2026-08-12",
        summary: "Initial registry entry.",
        sources: [
          "https://huggingface.co/Qwen",
        ],
      },
    ],
  },
  {
    id: "qwen-3-8-flash",
    companyId: "qwen",
    companyName: "Alibaba Cloud (Qwen)",
    name: "Qwen3.8 Flash",
    version: "3.8-Flash",
    releaseDate: "2026-08-26",
    isCompanyFlagship: false,
    isLatestCheckpoint: true,
    statusBadge: "1M MULTIMODAL VALUE",
    category: "multimodal",
    categoryLabel: "Fast Multimodal",
    contextWindow: "1,000,000 tokens",
    contextWindowTokens: 1000000,
    maxOutputTokens: "131,072 tokens",
    parameters: "176B MoE (125B + 51B N-gram, 6B Active)",
    openWeights: true,
    license: "Alibaba Cloud Model Studio",
    pricing: { input: 0.16, output: 0.47 },
    highlight: "Released August 26, 2026; open-weight multimodal MoE (125B + 51B N-gram, 6B active) with 1M context and 131K output at $0.16/$0.47.",
    modalities: ["Text", "Vision", "Video", "Code"],
    benchmarks: {
      mmluPro: "81.9%",
    },
    links: {
      announcement: "https://www.alibabacloud.com/blog/alibaba-releases-qwen3-8-flash-with-innovative-model-architecture-delivering-optimal-price-performance_603503",
      playground: "https://chat.qwenlm.ai",
      apiDocs: "https://help.aliyun.com/en/model-studio/qwen3-8-flash",
    },
    sources: [
    {
      url: "https://www.alibabacloud.com/blog/alibaba-releases-qwen3-8-flash-with-innovative-model-architecture-delivering-optimal-price-performance_603503",
      publisher: "Alibaba Cloud (Qwen)",
      title: "Qwen3.8 Flash announcement",
      publishedAt: "2026-08-27",
      accessedAt: "2026-10-07",
      sourceType: "announcement",
      live: true,
    },
    {
      url: "https://help.aliyun.com/en/model-studio/qwen3-8-flash",
      publisher: "Alibaba Cloud (Qwen)",
      title: "Qwen3.8 Flash API reference",
      accessedAt: "2026-10-07",
      sourceType: "api-docs",
      live: false,
      note: "Connection timed out to automated check; page indexed with full content, not re-confirmed on access date.",
    },
    ],
    fieldSources: {
      releaseDate: [
      {
        url: "https://www.alibabacloud.com/blog/alibaba-releases-qwen3-8-flash-with-innovative-model-architecture-delivering-optimal-price-performance_603503",
        publisher: "Alibaba Cloud (Qwen)",
        title: "Qwen3.8 Flash announcement",
        publishedAt: "2026-08-27",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      contextWindow: [
      {
        url: "https://www.alibabacloud.com/blog/alibaba-releases-qwen3-8-flash-with-innovative-model-architecture-delivering-optimal-price-performance_603503",
        publisher: "Alibaba Cloud (Qwen)",
        title: "Qwen3.8 Flash announcement",
        publishedAt: "2026-08-27",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      maxOutputTokens: [
      {
        url: "https://www.alibabacloud.com/blog/alibaba-releases-qwen3-8-flash-with-innovative-model-architecture-delivering-optimal-price-performance_603503",
        publisher: "Alibaba Cloud (Qwen)",
        title: "Qwen3.8 Flash announcement",
        publishedAt: "2026-08-27",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      parameters: [
      {
        url: "https://www.alibabacloud.com/blog/alibaba-releases-qwen3-8-flash-with-innovative-model-architecture-delivering-optimal-price-performance_603503",
        publisher: "Alibaba Cloud (Qwen)",
        title: "Qwen3.8 Flash announcement",
        publishedAt: "2026-08-27",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      license: [
      {
        url: "https://www.alibabacloud.com/blog/alibaba-releases-qwen3-8-flash-with-innovative-model-architecture-delivering-optimal-price-performance_603503",
        publisher: "Alibaba Cloud (Qwen)",
        title: "Qwen3.8 Flash announcement",
        publishedAt: "2026-08-27",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      pricing: [
      {
        url: "https://www.alibabacloud.com/blog/alibaba-releases-qwen3-8-flash-with-innovative-model-architecture-delivering-optimal-price-performance_603503",
        publisher: "Alibaba Cloud (Qwen)",
        title: "Qwen3.8 Flash announcement",
        publishedAt: "2026-08-27",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      modalities: [
      {
        url: "https://www.alibabacloud.com/blog/alibaba-releases-qwen3-8-flash-with-innovative-model-architecture-delivering-optimal-price-performance_603503",
        publisher: "Alibaba Cloud (Qwen)",
        title: "Qwen3.8 Flash announcement",
        publishedAt: "2026-08-27",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      benchmarks: [
      {
        url: "https://www.alibabacloud.com/blog/alibaba-releases-qwen3-8-flash-with-innovative-model-architecture-delivering-optimal-price-performance_603503",
        publisher: "Alibaba Cloud (Qwen)",
        title: "Qwen3.8 Flash announcement",
        publishedAt: "2026-08-27",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      isCompanyFlagship: [
      {
        url: "https://www.alibabacloud.com/blog/alibaba-releases-qwen3-8-flash-with-innovative-model-architecture-delivering-optimal-price-performance_603503",
        publisher: "Alibaba Cloud (Qwen)",
        title: "Qwen3.8 Flash announcement",
        publishedAt: "2026-08-27",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      isLatestCheckpoint: [
      {
        url: "https://www.alibabacloud.com/blog/alibaba-releases-qwen3-8-flash-with-innovative-model-architecture-delivering-optimal-price-performance_603503",
        publisher: "Alibaba Cloud (Qwen)",
        title: "Qwen3.8 Flash announcement",
        publishedAt: "2026-08-27",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
    },
    lastVerifiedAt: "2026-10-07",
    verificationStatus: "partially_verified",
    changeLog: [
      {
        date: "2026-08-26",
        summary: "Initial registry entry.",
        sources: [
          "https://www.alibabacloud.com/blog/alibaba-releases-qwen3-8-flash-with-innovative-model-architecture-delivering-optimal-price-performance_603503",
        ],
      },
      {
        date: "2026-10-07",
        summary: "Audit correction: Corrected parameters to 176B MoE (6B active), max output to 131K tokens, pricing to $0.16/$0.47, modalities +Video, openWeights true; re-sourced to Alibaba Cloud blog + Model Studio docs. Registry mmluPro figure remains lab-reported, pending per-field recheck.",
        sources: [
          "https://www.alibabacloud.com/blog/alibaba-releases-qwen3-8-flash-with-innovative-model-architecture-delivering-optimal-price-performance_603503",
          "https://help.aliyun.com/en/model-studio/qwen3-8-flash",
        ],
      },
    ],
  },
  {
    id: "qwen-3-8-omni-flash",
    companyId: "qwen",
    companyName: "Alibaba Cloud (Qwen)",
    name: "Qwen3.8 Omni Flash",
    version: "3.8-Omni-Flash",
    releaseDate: "2026-09-18",
    isCompanyFlagship: false,
    isLatestCheckpoint: true,
    statusBadge: "OMNI AGENTIC",
    category: "multimodal",
    categoryLabel: "Agentic Omni",
    contextWindow: "1,000,000 tokens",
    contextWindowTokens: 1000000,
    maxOutputTokens: "131,072 tokens",
    parameters: "Undisclosed (Qwen Omni MoE)",
    openWeights: false,
    license: "Alibaba Cloud Model Studio",
    pricing: { input: 0.15, output: 0.47 },
    highlight:
      "Released Sept 18, 2026; Qwen's first omni model built for agentic work with text/image/audio/video input, 1M context and 131K output at $0.15/$0.47, video input ~89% cheaper than Qwen3.5-Omni-Plus.",
    modalities: ["Text", "Vision", "Audio", "Video"],
    benchmarks: {},
    links: {
      announcement: "https://qwen.ai/blog?id=qwen3.8-omni-flash",
      playground: "https://chat.qwen.ai",
      apiDocs: "https://www.alibabacloud.com/help/en/model-studio/qwen3-8-omni-flash",
    },
    sources: [
    {
      url: "https://www.alibabacloud.com/help/en/model-studio/qwen3-8-omni-flash",
      publisher: "Alibaba Cloud (Qwen)",
      title: "Qwen3.8 Omni Flash API reference",
      accessedAt: "2026-10-07",
      sourceType: "api-docs",
      live: true,
    },
    ],
    fieldSources: {
      releaseDate: [
      {
        url: "https://www.alibabacloud.com/help/en/model-studio/qwen3-8-omni-flash",
        publisher: "Alibaba Cloud (Qwen)",
        title: "Qwen3.8 Omni Flash API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      contextWindow: [
      {
        url: "https://www.alibabacloud.com/help/en/model-studio/qwen3-8-omni-flash",
        publisher: "Alibaba Cloud (Qwen)",
        title: "Qwen3.8 Omni Flash API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      maxOutputTokens: [
      {
        url: "https://www.alibabacloud.com/help/en/model-studio/qwen3-8-omni-flash",
        publisher: "Alibaba Cloud (Qwen)",
        title: "Qwen3.8 Omni Flash API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      parameters: [
      {
        url: "https://www.alibabacloud.com/help/en/model-studio/qwen3-8-omni-flash",
        publisher: "Alibaba Cloud (Qwen)",
        title: "Qwen3.8 Omni Flash API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      license: [
      {
        url: "https://www.alibabacloud.com/help/en/model-studio/qwen3-8-omni-flash",
        publisher: "Alibaba Cloud (Qwen)",
        title: "Qwen3.8 Omni Flash API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      pricing: [
      {
        url: "https://www.alibabacloud.com/help/en/model-studio/qwen3-8-omni-flash",
        publisher: "Alibaba Cloud (Qwen)",
        title: "Qwen3.8 Omni Flash API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      modalities: [
      {
        url: "https://www.alibabacloud.com/help/en/model-studio/qwen3-8-omni-flash",
        publisher: "Alibaba Cloud (Qwen)",
        title: "Qwen3.8 Omni Flash API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      isCompanyFlagship: [
      {
        url: "https://www.alibabacloud.com/help/en/model-studio/qwen3-8-omni-flash",
        publisher: "Alibaba Cloud (Qwen)",
        title: "Qwen3.8 Omni Flash API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      isLatestCheckpoint: [
      {
        url: "https://www.alibabacloud.com/help/en/model-studio/qwen3-8-omni-flash",
        publisher: "Alibaba Cloud (Qwen)",
        title: "Qwen3.8 Omni Flash API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
    },
    lastVerifiedAt: "2026-10-07",
    verificationStatus: "partially_verified",
    changeLog: [
      {
        date: "2026-09-18",
        summary: "Initial registry entry.",
        sources: [
          "https://www.alibabacloud.com/help/en/model-studio/qwen3-8-omni-flash",
        ],
      },
    ],
  },


  // ─── MISTRAL AI ──────────────────────────────────────────────────────────
  {
    id: "mistral-medium-3-5",
    companyId: "mistral",
    companyName: "Mistral AI",
    name: "Mistral Medium 3.5",
    version: "3.5",
    releaseDate: "2026-04-28",
    isCompanyFlagship: false,
    isLatestCheckpoint: false,
    statusBadge: "OPEN 128B MULTIMODAL",
    category: "flagship",
    categoryLabel: "Dense Multimodal",
    contextWindow: "262,144 tokens",
    contextWindowTokens: 262144,
    maxOutputTokens: "16,384 tokens",
    parameters: "128B Dense Multimodal",
    openWeights: true,
    license: "Modified MIT (open weights)",
    pricing: { input: 0.9, output: 2.7 },
    highlight: "Dense 128B multimodal instruction-following model with native text and image understanding, tuned for European enterprise compliance.",
    modalities: ["Text", "Vision", "Code"],
    benchmarks: {
      mmluPro: "79.2%",
    },
    links: {
      announcement: "https://docs.mistral.ai/models/mistral-medium-3-5-26-04",
      weights: "https://huggingface.co/mistralai/Mistral-Medium-3.5-128B",
    },
    sources: [
    {
      url: "https://docs.mistral.ai/models/mistral-medium-3-5-26-04",
      publisher: "Mistral AI",
      title: "Mistral Medium 3.5 announcement",
      publishedAt: "2026-04-28",
      accessedAt: "2026-10-07",
      sourceType: "announcement",
      live: true,
    },
    {
      url: "https://huggingface.co/mistralai/Mistral-Medium-3.5-128B",
      publisher: "Mistral AI",
      title: "Mistral Medium 3.5 open weights",
      publishedAt: "2026-04-29",
      accessedAt: "2026-10-07",
      sourceType: "weights",
      live: true,
    },
    ],
    fieldSources: {
      releaseDate: [
      {
        url: "https://docs.mistral.ai/models/mistral-medium-3-5-26-04",
        publisher: "Mistral AI",
        title: "Mistral Medium 3.5 announcement",
        publishedAt: "2026-04-28",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      contextWindow: [
      {
        url: "https://docs.mistral.ai/models/mistral-medium-3-5-26-04",
        publisher: "Mistral AI",
        title: "Mistral Medium 3.5 announcement",
        publishedAt: "2026-04-28",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      maxOutputTokens: [
      {
        url: "https://docs.mistral.ai/models/mistral-medium-3-5-26-04",
        publisher: "Mistral AI",
        title: "Mistral Medium 3.5 announcement",
        publishedAt: "2026-04-28",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      parameters: [
      {
        url: "https://docs.mistral.ai/models/mistral-medium-3-5-26-04",
        publisher: "Mistral AI",
        title: "Mistral Medium 3.5 announcement",
        publishedAt: "2026-04-28",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      license: [
      {
        url: "https://huggingface.co/mistralai/Mistral-Medium-3.5-128B",
        publisher: "Mistral AI",
        title: "Mistral Medium 3.5 open weights",
        publishedAt: "2026-04-29",
        accessedAt: "2026-10-07",
        sourceType: "weights",
        live: true,
      },
      ],
      pricing: [
      {
        url: "https://docs.mistral.ai/models/mistral-medium-3-5-26-04",
        publisher: "Mistral AI",
        title: "Mistral Medium 3.5 announcement",
        publishedAt: "2026-04-28",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      modalities: [
      {
        url: "https://docs.mistral.ai/models/mistral-medium-3-5-26-04",
        publisher: "Mistral AI",
        title: "Mistral Medium 3.5 announcement",
        publishedAt: "2026-04-28",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      benchmarks: [
      {
        url: "https://docs.mistral.ai/models/mistral-medium-3-5-26-04",
        publisher: "Mistral AI",
        title: "Mistral Medium 3.5 announcement",
        publishedAt: "2026-04-28",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      isCompanyFlagship: [
      {
        url: "https://docs.mistral.ai/models/mistral-medium-3-5-26-04",
        publisher: "Mistral AI",
        title: "Mistral Medium 3.5 announcement",
        publishedAt: "2026-04-28",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      isLatestCheckpoint: [
      {
        url: "https://docs.mistral.ai/models/mistral-medium-3-5-26-04",
        publisher: "Mistral AI",
        title: "Mistral Medium 3.5 announcement",
        publishedAt: "2026-04-28",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
    },
    lastVerifiedAt: "2026-10-07",
    verificationStatus: "partially_verified",
    changeLog: [
      {
        date: "2026-04-28",
        summary: "Initial registry entry.",
        sources: [
          "https://docs.mistral.ai/models/mistral-medium-3-5-26-04",
        ],
      },
      {
        date: "2026-10-07",
        summary: "Audit correction: Corrected release date to 2026-04-28, license to Modified MIT (open weights), badge off flagship wording; re-sourced to live docs page + Hugging Face model card.",
        sources: [
          "https://docs.mistral.ai/models/mistral-medium-3-5-26-04",
          "https://huggingface.co/mistralai/Mistral-Medium-3.5-128B",
        ],
      },
    ],
  },
  {
    id: "mistral-large-4",
    companyId: "mistral",
    companyName: "Mistral AI",
    name: "Mistral Large 4",
    version: "4.0",
    releaseDate: "2026-10-06",
    isCompanyFlagship: true,
    isLatestCheckpoint: true,
    statusBadge: "1T OPEN FLAGSHIP",
    category: "flagship",
    categoryLabel: "Multimodal MoE Frontier",
    contextWindow: "1,000,000 tokens",
    contextWindowTokens: 1000000,
    maxOutputTokens: "32,768 tokens",
    parameters: "1.05T MoE (49B Active)",
    openWeights: true,
    license: "Open Weights (27 Oct 2026) / Mistral API Preview",
    pricing: { input: 1.36, output: 4.18 },
    highlight:
      "Released Oct 6, 2026 in public preview on Mistral Studio ($1.36/$4.18); Mistral's largest model — 1.05T total / 49B active MoE with 1.6B vision encoder, native multimodal, 1M context, 160+ languages; SOTA open-weight outside China for cyber, finance and legal with 61.7% DeepSWE v1.1; weights drop Oct 27.",
    modalities: ["Text", "Vision", "Code"],
    benchmarks: {
      sweBench: "61.7% (DeepSWE v1.1)",
      terminalBench: "28.3% (Terminal-Bench 4.0)",
    },
    links: {
      announcement: "https://mistral.ai/news/mistral-large-4/",
      playground: "https://console.mistral.ai/",
      apiDocs: "https://docs.mistral.ai/models/mistral-large-4-0",
    },
    sources: [
    {
      url: "https://mistral.ai/news/mistral-large-4/",
      publisher: "Mistral AI",
      title: "Mistral Large 4 announcement",
      publishedAt: "2026-10-06",
      accessedAt: "2026-10-07",
      sourceType: "announcement",
      live: true,
    },
    {
      url: "https://docs.mistral.ai/models/mistral-large-4-0",
      publisher: "Mistral AI",
      title: "Mistral Large 4 API reference",
      accessedAt: "2026-10-07",
      sourceType: "api-docs",
      live: true,
    },
    ],
    fieldSources: {
      releaseDate: [
      {
        url: "https://mistral.ai/news/mistral-large-4/",
        publisher: "Mistral AI",
        title: "Mistral Large 4 announcement",
        publishedAt: "2026-10-06",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      contextWindow: [
      {
        url: "https://docs.mistral.ai/models/mistral-large-4-0",
        publisher: "Mistral AI",
        title: "Mistral Large 4 API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      maxOutputTokens: [
      {
        url: "https://docs.mistral.ai/models/mistral-large-4-0",
        publisher: "Mistral AI",
        title: "Mistral Large 4 API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      parameters: [
      {
        url: "https://mistral.ai/news/mistral-large-4/",
        publisher: "Mistral AI",
        title: "Mistral Large 4 announcement",
        publishedAt: "2026-10-06",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      license: [
      {
        url: "https://mistral.ai/news/mistral-large-4/",
        publisher: "Mistral AI",
        title: "Mistral Large 4 announcement",
        publishedAt: "2026-10-06",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      pricing: [
      {
        url: "https://docs.mistral.ai/models/mistral-large-4-0",
        publisher: "Mistral AI",
        title: "Mistral Large 4 API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      modalities: [
      {
        url: "https://mistral.ai/news/mistral-large-4/",
        publisher: "Mistral AI",
        title: "Mistral Large 4 announcement",
        publishedAt: "2026-10-06",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      benchmarks: [
      {
        url: "https://mistral.ai/news/mistral-large-4/",
        publisher: "Mistral AI",
        title: "Mistral Large 4 announcement",
        publishedAt: "2026-10-06",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      isCompanyFlagship: [
      {
        url: "https://mistral.ai/news/mistral-large-4/",
        publisher: "Mistral AI",
        title: "Mistral Large 4 announcement",
        publishedAt: "2026-10-06",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      isLatestCheckpoint: [
      {
        url: "https://mistral.ai/news/mistral-large-4/",
        publisher: "Mistral AI",
        title: "Mistral Large 4 announcement",
        publishedAt: "2026-10-06",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
    },
    lastVerifiedAt: "2026-10-07",
    verificationStatus: "verified",
    changeLog: [
      {
        date: "2026-10-06",
        summary: "Initial registry entry.",
        sources: [
          "https://mistral.ai/news/mistral-large-4/",
        ],
      },
      {
        date: "2026-10-07",
        summary: "Added to registry as Mistral flagship; Medium 3.5 demoted.",
        sources: [
          "https://mistral.ai/news/mistral-large-4/",
        ],
      },
    ],
  },

  // ─── TENCENT HUNYUAN ───────────────────────────────────────────────────
  {
    id: "tencent-hy3",
    companyId: "tencent",
    companyName: "Tencent Hunyuan",
    name: "Hy3",
    version: "3.0",
    releaseDate: "2026-07-06",
    isCompanyFlagship: true,
    isLatestCheckpoint: false,
    statusBadge: "OPEN MOE FLAGSHIP",
    category: "flagship",
    categoryLabel: "Reasoning MoE",
    contextWindow: "262,144 tokens",
    contextWindowTokens: 262144,
    maxOutputTokens: "32,768 tokens",
    parameters: "295B MoE (21B Activated)",
    openWeights: true,
    license: "Tencent Hunyuan Community License",
    pricing: { input: 0.13, output: 0.53 },
    highlight: "Tencent's stable production flagship; 295B MoE with configurable no-think/low/high reasoning, grounded anti-hallucination behavior, and sustained 30T+ monthly OpenRouter volume.",
    modalities: ["Text", "Code"],
    benchmarks: {},
    links: {
      announcement: "https://hunyuan.tencent.com",
    },
    sources: [
    {
      url: "https://hunyuan.tencent.com",
      publisher: "Tencent",
      title: "Hy3 announcement",
      accessedAt: "2026-10-07",
      sourceType: "announcement",
      live: true,
    },
    ],
    fieldSources: {
      releaseDate: [
      {
        url: "https://hunyuan.tencent.com",
        publisher: "Tencent",
        title: "Hy3 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      contextWindow: [
      {
        url: "https://hunyuan.tencent.com",
        publisher: "Tencent",
        title: "Hy3 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      maxOutputTokens: [
      {
        url: "https://hunyuan.tencent.com",
        publisher: "Tencent",
        title: "Hy3 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      parameters: [
      {
        url: "https://hunyuan.tencent.com",
        publisher: "Tencent",
        title: "Hy3 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      license: [
      {
        url: "https://hunyuan.tencent.com",
        publisher: "Tencent",
        title: "Hy3 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      pricing: [
      {
        url: "https://hunyuan.tencent.com",
        publisher: "Tencent",
        title: "Hy3 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      modalities: [
      {
        url: "https://hunyuan.tencent.com",
        publisher: "Tencent",
        title: "Hy3 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      isCompanyFlagship: [
      {
        url: "https://hunyuan.tencent.com",
        publisher: "Tencent",
        title: "Hy3 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      isLatestCheckpoint: [
      {
        url: "https://hunyuan.tencent.com",
        publisher: "Tencent",
        title: "Hy3 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
    },
    lastVerifiedAt: "2026-10-07",
    verificationStatus: "partially_verified",
    changeLog: [
      {
        date: "2026-07-06",
        summary: "Initial registry entry.",
        sources: [
          "https://hunyuan.tencent.com",
        ],
      },
    ],
  },
  {
    id: "tencent-hy4-preview",
    companyId: "tencent",
    companyName: "Tencent Hunyuan",
    name: "Hy4 Preview",
    version: "4.0-Preview",
    releaseDate: "2026-08-27",
    isCompanyFlagship: false,
    isLatestCheckpoint: true,
    statusBadge: "#1 OPENROUTER VOLUME",
    category: "reasoning",
    categoryLabel: "Preview Reasoning",
    contextWindow: "1,048,576 tokens",
    contextWindowTokens: 1048576,
    maxOutputTokens: "32,768 tokens",
    parameters: "Hunyuan MoE Preview",
    openWeights: false,
    license: "Tencent Hunyuan API Preview",
    pricing: { input: 0.83, output: 2.49 },
    highlight: "Current #1 on OpenRouter by weekly tokens with +639% growth; preview of Tencent's next-generation reasoning model for agentic workflows.",
    modalities: ["Text", "Vision", "Code"],
    benchmarks: {},
    links: {
      announcement: "https://hunyuan.tencent.com",
    },
    sources: [
    {
      url: "https://hunyuan.tencent.com",
      publisher: "Tencent",
      title: "Hy4 Preview announcement",
      accessedAt: "2026-10-07",
      sourceType: "announcement",
      live: true,
    },
    ],
    fieldSources: {
      releaseDate: [
      {
        url: "https://hunyuan.tencent.com",
        publisher: "Tencent",
        title: "Hy4 Preview announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      contextWindow: [
      {
        url: "https://hunyuan.tencent.com",
        publisher: "Tencent",
        title: "Hy4 Preview announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      maxOutputTokens: [
      {
        url: "https://hunyuan.tencent.com",
        publisher: "Tencent",
        title: "Hy4 Preview announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      parameters: [
      {
        url: "https://hunyuan.tencent.com",
        publisher: "Tencent",
        title: "Hy4 Preview announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      license: [
      {
        url: "https://hunyuan.tencent.com",
        publisher: "Tencent",
        title: "Hy4 Preview announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      pricing: [
      {
        url: "https://hunyuan.tencent.com",
        publisher: "Tencent",
        title: "Hy4 Preview announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      modalities: [
      {
        url: "https://hunyuan.tencent.com",
        publisher: "Tencent",
        title: "Hy4 Preview announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      isCompanyFlagship: [
      {
        url: "https://hunyuan.tencent.com",
        publisher: "Tencent",
        title: "Hy4 Preview announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      isLatestCheckpoint: [
      {
        url: "https://hunyuan.tencent.com",
        publisher: "Tencent",
        title: "Hy4 Preview announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
    },
    lastVerifiedAt: "2026-10-07",
    verificationStatus: "partially_verified",
    changeLog: [
      {
        date: "2026-08-27",
        summary: "Initial registry entry.",
        sources: [
          "https://hunyuan.tencent.com",
        ],
      },
    ],
  },

  // ─── Z.AI (GLM) ────────────────────────────────────────────────────────
  {
    id: "glm-5-3",
    companyId: "z-ai",
    companyName: "Z.ai",
    name: "GLM 5.3",
    version: "5.3",
    releaseDate: "2026-08-16",
    isCompanyFlagship: true,
    isLatestCheckpoint: false,
    statusBadge: "HIGH-VOLUME FLAGSHIP",
    category: "flagship",
    categoryLabel: "Frontier Foundation",
    contextWindow: "1,048,576 tokens",
    contextWindowTokens: 1048576,
    maxOutputTokens: "32,768 tokens",
    parameters: "GLM MoE Frontier",
    openWeights: false,
    license: "Z.ai API",
    pricing: { input: 0.9, output: 2.7 },
    highlight: "Z.ai's primary flagship; high-throughput foundation model with strong coding share and large-document handling at scale.",
    modalities: ["Text", "Vision", "Code"],
    benchmarks: {},
    links: {
      announcement: "https://z.ai",
    },
    sources: [
    {
      url: "https://z.ai",
      publisher: "Z.ai",
      title: "GLM 5.3 announcement",
      accessedAt: "2026-10-07",
      sourceType: "announcement",
      live: true,
    },
    ],
    fieldSources: {
      releaseDate: [
      {
        url: "https://z.ai",
        publisher: "Z.ai",
        title: "GLM 5.3 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      contextWindow: [
      {
        url: "https://z.ai",
        publisher: "Z.ai",
        title: "GLM 5.3 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      maxOutputTokens: [
      {
        url: "https://z.ai",
        publisher: "Z.ai",
        title: "GLM 5.3 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      parameters: [
      {
        url: "https://z.ai",
        publisher: "Z.ai",
        title: "GLM 5.3 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      license: [
      {
        url: "https://z.ai",
        publisher: "Z.ai",
        title: "GLM 5.3 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      pricing: [
      {
        url: "https://z.ai",
        publisher: "Z.ai",
        title: "GLM 5.3 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      modalities: [
      {
        url: "https://z.ai",
        publisher: "Z.ai",
        title: "GLM 5.3 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      isCompanyFlagship: [
      {
        url: "https://z.ai",
        publisher: "Z.ai",
        title: "GLM 5.3 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      isLatestCheckpoint: [
      {
        url: "https://z.ai",
        publisher: "Z.ai",
        title: "GLM 5.3 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
    },
    lastVerifiedAt: "2026-10-07",
    verificationStatus: "partially_verified",
    changeLog: [
      {
        date: "2026-08-16",
        summary: "Initial registry entry.",
        sources: [
          "https://z.ai",
        ],
      },
    ],
  },
  {
    id: "glm-5-3-flash",
    companyId: "z-ai",
    companyName: "Z.ai",
    name: "GLM 5.3 Flash",
    version: "5.3-Flash",
    releaseDate: "2026-08-26",
    isCompanyFlagship: false,
    isLatestCheckpoint: true,
    statusBadge: "VALUE THROUGHPUT KING",
    category: "code",
    categoryLabel: "Fast Inference",
    contextWindow: "1,048,576 tokens",
    contextWindowTokens: 1048576,
    maxOutputTokens: "32,768 tokens",
    parameters: "Distilled High-Throughput MoE",
    openWeights: false,
    license: "Z.ai API",
    pricing: { input: 0.35, output: 1.05 },
    highlight: "Top-5 OpenRouter volume driver; ultra-cheap large-context model for high-volume extraction, long documents, and agent fleets.",
    modalities: ["Text", "Vision", "Code"],
    benchmarks: {},
    links: {
      announcement: "https://z.ai",
    },
    sources: [
    {
      url: "https://z.ai",
      publisher: "Z.ai",
      title: "GLM 5.3 Flash announcement",
      accessedAt: "2026-10-07",
      sourceType: "announcement",
      live: true,
    },
    ],
    fieldSources: {
      releaseDate: [
      {
        url: "https://z.ai",
        publisher: "Z.ai",
        title: "GLM 5.3 Flash announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      contextWindow: [
      {
        url: "https://z.ai",
        publisher: "Z.ai",
        title: "GLM 5.3 Flash announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      maxOutputTokens: [
      {
        url: "https://z.ai",
        publisher: "Z.ai",
        title: "GLM 5.3 Flash announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      parameters: [
      {
        url: "https://z.ai",
        publisher: "Z.ai",
        title: "GLM 5.3 Flash announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      license: [
      {
        url: "https://z.ai",
        publisher: "Z.ai",
        title: "GLM 5.3 Flash announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      pricing: [
      {
        url: "https://z.ai",
        publisher: "Z.ai",
        title: "GLM 5.3 Flash announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      modalities: [
      {
        url: "https://z.ai",
        publisher: "Z.ai",
        title: "GLM 5.3 Flash announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      isCompanyFlagship: [
      {
        url: "https://z.ai",
        publisher: "Z.ai",
        title: "GLM 5.3 Flash announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      isLatestCheckpoint: [
      {
        url: "https://z.ai",
        publisher: "Z.ai",
        title: "GLM 5.3 Flash announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
    },
    lastVerifiedAt: "2026-10-07",
    verificationStatus: "partially_verified",
    changeLog: [
      {
        date: "2026-08-26",
        summary: "Initial registry entry.",
        sources: [
          "https://z.ai",
        ],
      },
    ],
  },
  {
    id: "glm-5-2",
    companyId: "z-ai",
    companyName: "Z.ai",
    name: "GLM 5.2",
    version: "5.2",
    releaseDate: "2026-06-16",
    isCompanyFlagship: false,
    isLatestCheckpoint: false,
    statusBadge: "CODING NICHE",
    category: "code",
    categoryLabel: "Coding Workhorse",
    contextWindow: "1,048,576 tokens",
    contextWindowTokens: 1048576,
    maxOutputTokens: "32,768 tokens",
    parameters: "GLM MoE",
    openWeights: false,
    license: "Z.ai API",
    pricing: { input: 0.97, output: 3.04 },
    highlight: "Prior-generation workhorse with a durable coding niche and 14T+ trailing-30-day OpenRouter volume.",
    modalities: ["Text", "Code"],
    benchmarks: {},
    links: {
      announcement: "https://z.ai",
    },
    sources: [
    {
      url: "https://z.ai",
      publisher: "Z.ai",
      title: "GLM 5.2 announcement",
      accessedAt: "2026-10-07",
      sourceType: "announcement",
      live: true,
    },
    ],
    fieldSources: {
      releaseDate: [
      {
        url: "https://z.ai",
        publisher: "Z.ai",
        title: "GLM 5.2 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      contextWindow: [
      {
        url: "https://z.ai",
        publisher: "Z.ai",
        title: "GLM 5.2 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      maxOutputTokens: [
      {
        url: "https://z.ai",
        publisher: "Z.ai",
        title: "GLM 5.2 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      parameters: [
      {
        url: "https://z.ai",
        publisher: "Z.ai",
        title: "GLM 5.2 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      license: [
      {
        url: "https://z.ai",
        publisher: "Z.ai",
        title: "GLM 5.2 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      pricing: [
      {
        url: "https://z.ai",
        publisher: "Z.ai",
        title: "GLM 5.2 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      modalities: [
      {
        url: "https://z.ai",
        publisher: "Z.ai",
        title: "GLM 5.2 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      isCompanyFlagship: [
      {
        url: "https://z.ai",
        publisher: "Z.ai",
        title: "GLM 5.2 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      isLatestCheckpoint: [
      {
        url: "https://z.ai",
        publisher: "Z.ai",
        title: "GLM 5.2 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
    },
    lastVerifiedAt: "2026-10-07",
    verificationStatus: "partially_verified",
    changeLog: [
      {
        date: "2026-06-16",
        summary: "Initial registry entry.",
        sources: [
          "https://z.ai",
        ],
      },
    ],
  },

  // ─── MINIMAX ───────────────────────────────────────────────────────────
  {
    id: "minimax-m3",
    companyId: "minimax",
    companyName: "MiniMax",
    name: "MiniMax M3",
    version: "M3",
    releaseDate: "2026-05-31",
    isCompanyFlagship: true,
    isLatestCheckpoint: true,
    statusBadge: "AGENT FAVORITE",
    category: "flagship",
    categoryLabel: "Agentic Frontier",
    contextWindow: "1,048,576 tokens",
    contextWindowTokens: 1048576,
    maxOutputTokens: "32,768 tokens",
    parameters: "MiniMax MoE (MSA Architecture)",
    openWeights: false,
    license: "MiniMax API",
    pricing: { input: 0.3, output: 1.2 },
    highlight: "Top-5 OpenRouter volume; the default for OpenClaw-style autonomous agents, balancing reasoning depth with batch throughput.",
    modalities: ["Text", "Vision", "Code"],
    benchmarks: {
      sweBench: "59% (SWE-Pro)",
    },
    links: {
      announcement: "https://www.minimaxi.com",
    },
    sources: [
    {
      url: "https://www.minimaxi.com",
      publisher: "MiniMax",
      title: "MiniMax M3 announcement",
      accessedAt: "2026-10-07",
      sourceType: "announcement",
      live: true,
    },
    ],
    fieldSources: {
      releaseDate: [
      {
        url: "https://www.minimaxi.com",
        publisher: "MiniMax",
        title: "MiniMax M3 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      contextWindow: [
      {
        url: "https://www.minimaxi.com",
        publisher: "MiniMax",
        title: "MiniMax M3 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      maxOutputTokens: [
      {
        url: "https://www.minimaxi.com",
        publisher: "MiniMax",
        title: "MiniMax M3 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      parameters: [
      {
        url: "https://www.minimaxi.com",
        publisher: "MiniMax",
        title: "MiniMax M3 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      license: [
      {
        url: "https://www.minimaxi.com",
        publisher: "MiniMax",
        title: "MiniMax M3 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      pricing: [
      {
        url: "https://www.minimaxi.com",
        publisher: "MiniMax",
        title: "MiniMax M3 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      modalities: [
      {
        url: "https://www.minimaxi.com",
        publisher: "MiniMax",
        title: "MiniMax M3 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      benchmarks: [
      {
        url: "https://www.minimaxi.com",
        publisher: "MiniMax",
        title: "MiniMax M3 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      isCompanyFlagship: [
      {
        url: "https://www.minimaxi.com",
        publisher: "MiniMax",
        title: "MiniMax M3 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      isLatestCheckpoint: [
      {
        url: "https://www.minimaxi.com",
        publisher: "MiniMax",
        title: "MiniMax M3 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
    },
    lastVerifiedAt: "2026-10-07",
    verificationStatus: "partially_verified",
    changeLog: [
      {
        date: "2026-05-31",
        summary: "Initial registry entry.",
        sources: [
          "https://www.minimaxi.com",
        ],
      },
    ],
  },

  // ─── NVIDIA ────────────────────────────────────────────────────────────
  {
    id: "nemotron-3-ultra",
    companyId: "nvidia",
    companyName: "NVIDIA",
    name: "Nemotron 3 Ultra 550B",
    version: "3-Ultra",
    releaseDate: "2026-06-04",
    isCompanyFlagship: true,
    isLatestCheckpoint: true,
    statusBadge: "550B OPEN GIANT",
    category: "open-weights",
    categoryLabel: "Open High-Throughput",
    contextWindow: "262,144 tokens",
    contextWindowTokens: 262144,
    maxOutputTokens: "32,768 tokens",
    parameters: "550B MoE (55B Activated)",
    openWeights: true,
    license: "NVIDIA Open Model License",
    pricing: { input: 0.6, output: 2.4 },
    highlight: "550B open model with a generous free tier; top-10 OpenRouter volume for high-throughput open inference and experimentation.",
    modalities: ["Text", "Code"],
    benchmarks: {},
    links: {
      announcement: "https://www.nvidia.com",
      weights: "https://huggingface.co/nvidia",
    },
    sources: [
    {
      url: "https://www.nvidia.com",
      publisher: "NVIDIA",
      title: "Nemotron 3 Ultra 550B announcement",
      accessedAt: "2026-10-07",
      sourceType: "announcement",
      live: true,
    },
    {
      url: "https://huggingface.co/nvidia",
      publisher: "NVIDIA",
      title: "Nemotron 3 Ultra 550B open weights",
      accessedAt: "2026-10-07",
      sourceType: "weights",
      live: true,
    },
    ],
    fieldSources: {
      releaseDate: [
      {
        url: "https://www.nvidia.com",
        publisher: "NVIDIA",
        title: "Nemotron 3 Ultra 550B announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      contextWindow: [
      {
        url: "https://www.nvidia.com",
        publisher: "NVIDIA",
        title: "Nemotron 3 Ultra 550B announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      maxOutputTokens: [
      {
        url: "https://www.nvidia.com",
        publisher: "NVIDIA",
        title: "Nemotron 3 Ultra 550B announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      parameters: [
      {
        url: "https://www.nvidia.com",
        publisher: "NVIDIA",
        title: "Nemotron 3 Ultra 550B announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      license: [
      {
        url: "https://huggingface.co/nvidia",
        publisher: "NVIDIA",
        title: "Nemotron 3 Ultra 550B open weights",
        accessedAt: "2026-10-07",
        sourceType: "weights",
        live: true,
      },
      ],
      pricing: [
      {
        url: "https://www.nvidia.com",
        publisher: "NVIDIA",
        title: "Nemotron 3 Ultra 550B announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      modalities: [
      {
        url: "https://www.nvidia.com",
        publisher: "NVIDIA",
        title: "Nemotron 3 Ultra 550B announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      isCompanyFlagship: [
      {
        url: "https://www.nvidia.com",
        publisher: "NVIDIA",
        title: "Nemotron 3 Ultra 550B announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      isLatestCheckpoint: [
      {
        url: "https://www.nvidia.com",
        publisher: "NVIDIA",
        title: "Nemotron 3 Ultra 550B announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
    },
    lastVerifiedAt: "2026-10-07",
    verificationStatus: "partially_verified",
    changeLog: [
      {
        date: "2026-06-04",
        summary: "Initial registry entry.",
        sources: [
          "https://www.nvidia.com",
        ],
      },
    ],
  },

  // ─── XIAOMI MIMO ───────────────────────────────────────────────────────
  {
    id: "mimo-v2-5",
    companyId: "xiaomi",
    companyName: "Xiaomi MiMo",
    name: "MiMo-V2.5",
    version: "2.5",
    releaseDate: "2026-07-10",
    isCompanyFlagship: false,
    isLatestCheckpoint: false,
    statusBadge: "#1 CODING SHARE",
    category: "code",
    categoryLabel: "Repository Coding",
    contextWindow: "1,100,000 tokens",
    contextWindowTokens: 1100000,
    maxOutputTokens: "32,768 tokens",
    parameters: "MiMo MoE",
    openWeights: true,
    license: "MiMo Community License",
    pricing: { input: 0.14, output: 0.28 },
    highlight: "Leads OpenRouter programming share at 19.1%; repository-level code understanding with 1.1M context at $0.14/M input.",
    modalities: ["Text", "Code"],
    benchmarks: {},
    links: {
      announcement: "https://www.mi.com",
      weights: "https://huggingface.co/xiaomi",
    },
    sources: [
    {
      url: "https://www.mi.com",
      publisher: "Xiaomi MiMo",
      title: "MiMo-V2.5 announcement",
      accessedAt: "2026-10-07",
      sourceType: "announcement",
      live: false,
      note: "Host alive; automated fetch blocked, page not re-confirmed on access date.",
    },
    {
      url: "https://huggingface.co/xiaomi",
      publisher: "Xiaomi MiMo",
      title: "MiMo-V2.5 open weights",
      accessedAt: "2026-10-07",
      sourceType: "weights",
      live: true,
    },
    ],
    fieldSources: {
      releaseDate: [
      {
        url: "https://huggingface.co/xiaomi",
        publisher: "Xiaomi MiMo",
        title: "MiMo-V2.5 open weights",
        accessedAt: "2026-10-07",
        sourceType: "weights",
        live: true,
      },
      ],
      contextWindow: [
      {
        url: "https://www.mi.com",
        publisher: "Xiaomi MiMo",
        title: "MiMo-V2.5 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: false,
        note: "Host alive; automated fetch blocked, page not re-confirmed on access date.",
      },
      ],
      maxOutputTokens: [
      {
        url: "https://www.mi.com",
        publisher: "Xiaomi MiMo",
        title: "MiMo-V2.5 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: false,
        note: "Host alive; automated fetch blocked, page not re-confirmed on access date.",
      },
      ],
      parameters: [
      {
        url: "https://huggingface.co/xiaomi",
        publisher: "Xiaomi MiMo",
        title: "MiMo-V2.5 open weights",
        accessedAt: "2026-10-07",
        sourceType: "weights",
        live: true,
      },
      ],
      license: [
      {
        url: "https://huggingface.co/xiaomi",
        publisher: "Xiaomi MiMo",
        title: "MiMo-V2.5 open weights",
        accessedAt: "2026-10-07",
        sourceType: "weights",
        live: true,
      },
      ],
      pricing: [
      {
        url: "https://www.mi.com",
        publisher: "Xiaomi MiMo",
        title: "MiMo-V2.5 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: false,
        note: "Host alive; automated fetch blocked, page not re-confirmed on access date.",
      },
      ],
      modalities: [
      {
        url: "https://huggingface.co/xiaomi",
        publisher: "Xiaomi MiMo",
        title: "MiMo-V2.5 open weights",
        accessedAt: "2026-10-07",
        sourceType: "weights",
        live: true,
      },
      ],
      isCompanyFlagship: [
      {
        url: "https://huggingface.co/xiaomi",
        publisher: "Xiaomi MiMo",
        title: "MiMo-V2.5 open weights",
        accessedAt: "2026-10-07",
        sourceType: "weights",
        live: true,
      },
      ],
      isLatestCheckpoint: [
      {
        url: "https://huggingface.co/xiaomi",
        publisher: "Xiaomi MiMo",
        title: "MiMo-V2.5 open weights",
        accessedAt: "2026-10-07",
        sourceType: "weights",
        live: true,
      },
      ],
    },
    lastVerifiedAt: "2026-10-07",
    verificationStatus: "partially_verified",
    changeLog: [
      {
        date: "2026-07-10",
        summary: "Initial registry entry.",
        sources: [
          "https://www.mi.com",
        ],
      },
    ],
  },
  {
    id: "mimo-v2-5-pro",
    companyId: "xiaomi",
    companyName: "Xiaomi MiMo",
    name: "MiMo-V2.5 Pro",
    version: "2.5-Pro",
    releaseDate: "2026-08-02",
    isCompanyFlagship: false,
    isLatestCheckpoint: false,
    statusBadge: "79% SWE-VERIFIED",
    category: "reasoning",
    categoryLabel: "Deep Coding Reasoning",
    contextWindow: "1,100,000 tokens",
    contextWindowTokens: 1100000,
    maxOutputTokens: "65,536 tokens",
    parameters: "MiMo MoE Pro",
    openWeights: false,
    license: "Xiaomi API",
    pricing: { input: 0.46, output: 0.92 },
    highlight: "Deep-reasoning coding variant at 79.2% SWE-Verified; for hard architecture, debugging, and multi-file refactors.",
    modalities: ["Text", "Code"],
    benchmarks: {
      sweBench: "79.2%",
    },
    links: {
      announcement: "https://www.mi.com",
    },
    sources: [
    {
      url: "https://www.mi.com",
      publisher: "Xiaomi MiMo",
      title: "MiMo-V2.5 Pro announcement",
      accessedAt: "2026-10-07",
      sourceType: "announcement",
      live: false,
      note: "Host alive; automated fetch blocked, page not re-confirmed on access date.",
    },
    ],
    fieldSources: {
      releaseDate: [
      {
        url: "https://www.mi.com",
        publisher: "Xiaomi MiMo",
        title: "MiMo-V2.5 Pro announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: false,
        note: "Host alive; automated fetch blocked, page not re-confirmed on access date.",
      },
      ],
      contextWindow: [
      {
        url: "https://www.mi.com",
        publisher: "Xiaomi MiMo",
        title: "MiMo-V2.5 Pro announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: false,
        note: "Host alive; automated fetch blocked, page not re-confirmed on access date.",
      },
      ],
      maxOutputTokens: [
      {
        url: "https://www.mi.com",
        publisher: "Xiaomi MiMo",
        title: "MiMo-V2.5 Pro announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: false,
        note: "Host alive; automated fetch blocked, page not re-confirmed on access date.",
      },
      ],
      parameters: [
      {
        url: "https://www.mi.com",
        publisher: "Xiaomi MiMo",
        title: "MiMo-V2.5 Pro announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: false,
        note: "Host alive; automated fetch blocked, page not re-confirmed on access date.",
      },
      ],
      license: [
      {
        url: "https://www.mi.com",
        publisher: "Xiaomi MiMo",
        title: "MiMo-V2.5 Pro announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: false,
        note: "Host alive; automated fetch blocked, page not re-confirmed on access date.",
      },
      ],
      pricing: [
      {
        url: "https://www.mi.com",
        publisher: "Xiaomi MiMo",
        title: "MiMo-V2.5 Pro announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: false,
        note: "Host alive; automated fetch blocked, page not re-confirmed on access date.",
      },
      ],
      modalities: [
      {
        url: "https://www.mi.com",
        publisher: "Xiaomi MiMo",
        title: "MiMo-V2.5 Pro announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: false,
        note: "Host alive; automated fetch blocked, page not re-confirmed on access date.",
      },
      ],
      benchmarks: [
      {
        url: "https://www.mi.com",
        publisher: "Xiaomi MiMo",
        title: "MiMo-V2.5 Pro announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: false,
        note: "Host alive; automated fetch blocked, page not re-confirmed on access date.",
      },
      ],
      isCompanyFlagship: [
      {
        url: "https://www.mi.com",
        publisher: "Xiaomi MiMo",
        title: "MiMo-V2.5 Pro announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: false,
        note: "Host alive; automated fetch blocked, page not re-confirmed on access date.",
      },
      ],
      isLatestCheckpoint: [
      {
        url: "https://www.mi.com",
        publisher: "Xiaomi MiMo",
        title: "MiMo-V2.5 Pro announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: false,
        note: "Host alive; automated fetch blocked, page not re-confirmed on access date.",
      },
      ],
    },
    lastVerifiedAt: "2026-10-07",
    verificationStatus: "partially_verified",
    changeLog: [
      {
        date: "2026-08-02",
        summary: "Initial registry entry.",
        sources: [
          "https://www.mi.com",
        ],
      },
    ],
  },
  {
    id: "mimo-v2-6-pro",
    companyId: "xiaomi",
    companyName: "Xiaomi MiMo",
    name: "MiMo-V2.6 Pro",
    version: "2.6-Pro",
    releaseDate: "2026-09-22",
    isCompanyFlagship: true,
    isLatestCheckpoint: true,
    statusBadge: "STRONGEST OPEN MODEL",
    category: "flagship",
    categoryLabel: "Omnimodal Reasoning Flagship",
    contextWindow: "1,000,000 tokens",
    contextWindowTokens: 1000000,
    maxOutputTokens: "65,536 tokens",
    parameters: "1.02T MoE (42B Activated)",
    openWeights: true,
    license: "MIT License",
    pricing: { input: 0.435, output: 0.87 },
    highlight:
      "Released Sept 22, 2026; Xiaomi's flagship reasoning model scaled with 6-day Live RL (750K trajectories), scoring 46 on AA Index as strongest open model with 72.6% DeepSWE v1.1 at unchanged V2.5 pricing.",
    modalities: ["Text", "Vision", "Audio", "Video", "Code"],
    variants: [
      {
        name: "MiMo-V2.6 Pro UltraSpeed",
        role: "20X ULTRASPEED",
        detail: "Flagship V2.6-Pro quality at up to 20x inference speed for real-time and latency-sensitive workloads.",
        pricingNote: "API mimo-v2.6-pro-ultraspeed — speed-optimized tier",
        link: "https://mimo.mi.com/docs/en-US/updates/model",
      },
    ],
    benchmarks: {
      sweBench: "72.6% (DeepSWE v1.1)",
    },
    links: {
      announcement: "https://mimo.mi.com/docs/en-US/news/latest/v2-6",
      playground: "https://mimo.xiaomi.com/mimo-v2-6",
      apiDocs: "https://mimo.mi.com/docs/en-US/updates/model",
      weights: "https://huggingface.co/collections/XiaomiMiMo/mimo-v26",
    },
    sources: [
    {
      url: "https://mimo.mi.com/docs/en-US/news/latest/v2-6",
      publisher: "Xiaomi MiMo",
      title: "MiMo-V2.6 Pro announcement",
      accessedAt: "2026-10-07",
      sourceType: "announcement",
      live: true,
    },
    {
      url: "https://mimo.mi.com/docs/en-US/updates/model",
      publisher: "Xiaomi MiMo",
      title: "MiMo-V2.6 Pro API reference",
      accessedAt: "2026-10-07",
      sourceType: "api-docs",
      live: true,
    },
    {
      url: "https://huggingface.co/collections/XiaomiMiMo/mimo-v26",
      publisher: "Xiaomi MiMo",
      title: "MiMo-V2.6 Pro open weights",
      accessedAt: "2026-10-07",
      sourceType: "weights",
      live: true,
    },
    ],
    fieldSources: {
      releaseDate: [
      {
        url: "https://mimo.mi.com/docs/en-US/news/latest/v2-6",
        publisher: "Xiaomi MiMo",
        title: "MiMo-V2.6 Pro announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      contextWindow: [
      {
        url: "https://mimo.mi.com/docs/en-US/updates/model",
        publisher: "Xiaomi MiMo",
        title: "MiMo-V2.6 Pro API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      maxOutputTokens: [
      {
        url: "https://mimo.mi.com/docs/en-US/updates/model",
        publisher: "Xiaomi MiMo",
        title: "MiMo-V2.6 Pro API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      parameters: [
      {
        url: "https://mimo.mi.com/docs/en-US/news/latest/v2-6",
        publisher: "Xiaomi MiMo",
        title: "MiMo-V2.6 Pro announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      license: [
      {
        url: "https://huggingface.co/collections/XiaomiMiMo/mimo-v26",
        publisher: "Xiaomi MiMo",
        title: "MiMo-V2.6 Pro open weights",
        accessedAt: "2026-10-07",
        sourceType: "weights",
        live: true,
      },
      ],
      pricing: [
      {
        url: "https://mimo.mi.com/docs/en-US/updates/model",
        publisher: "Xiaomi MiMo",
        title: "MiMo-V2.6 Pro API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      modalities: [
      {
        url: "https://mimo.mi.com/docs/en-US/news/latest/v2-6",
        publisher: "Xiaomi MiMo",
        title: "MiMo-V2.6 Pro announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      benchmarks: [
      {
        url: "https://mimo.mi.com/docs/en-US/news/latest/v2-6",
        publisher: "Xiaomi MiMo",
        title: "MiMo-V2.6 Pro announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      isCompanyFlagship: [
      {
        url: "https://mimo.mi.com/docs/en-US/news/latest/v2-6",
        publisher: "Xiaomi MiMo",
        title: "MiMo-V2.6 Pro announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      isLatestCheckpoint: [
      {
        url: "https://mimo.mi.com/docs/en-US/news/latest/v2-6",
        publisher: "Xiaomi MiMo",
        title: "MiMo-V2.6 Pro announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
    },
    lastVerifiedAt: "2026-10-07",
    verificationStatus: "partially_verified",
    changeLog: [
      {
        date: "2026-09-22",
        summary: "Initial registry entry.",
        sources: [
          "https://mimo.mi.com/docs/en-US/news/latest/v2-6",
        ],
      },
    ],
  },
  {
    id: "mimo-v2-6-flash",
    companyId: "xiaomi",
    companyName: "Xiaomi MiMo",
    name: "MiMo-V2.6 Flash",
    version: "2.6-Flash",
    releaseDate: "2026-09-22",
    isCompanyFlagship: false,
    isLatestCheckpoint: true,
    statusBadge: "FAST OMNI VALUE",
    category: "multimodal",
    categoryLabel: "Fast Multimodal",
    contextWindow: "1,000,000 tokens",
    contextWindowTokens: 1000000,
    maxOutputTokens: "32,768 tokens",
    parameters: "Undisclosed (MiMo Flash MoE)",
    openWeights: true,
    license: "MIT License",
    pricing: { input: 0.14, output: 0.28 },
    highlight:
      "Released Sept 22, 2026; full-modality low-cost reasoning model outperforming MiMo-V2.5 Pro, with 65.7% DeepSWE v1.1 at $0.14/$0.28 and open weights.",
    modalities: ["Text", "Vision", "Audio", "Video", "Code"],
    benchmarks: {
      sweBench: "65.7% (DeepSWE v1.1)",
    },
    links: {
      announcement: "https://mimo.mi.com/docs/en-US/news/latest/v2-6",
      playground: "https://mimo.xiaomi.com/mimo-v2-6",
      apiDocs: "https://mimo.mi.com/docs/en-US/updates/model",
      weights: "https://huggingface.co/collections/XiaomiMiMo/mimo-v26",
    },
    sources: [
    {
      url: "https://mimo.mi.com/docs/en-US/news/latest/v2-6",
      publisher: "Xiaomi MiMo",
      title: "MiMo-V2.6 Flash announcement",
      accessedAt: "2026-10-07",
      sourceType: "announcement",
      live: true,
    },
    {
      url: "https://mimo.mi.com/docs/en-US/updates/model",
      publisher: "Xiaomi MiMo",
      title: "MiMo-V2.6 Flash API reference",
      accessedAt: "2026-10-07",
      sourceType: "api-docs",
      live: true,
    },
    {
      url: "https://huggingface.co/collections/XiaomiMiMo/mimo-v26",
      publisher: "Xiaomi MiMo",
      title: "MiMo-V2.6 Flash open weights",
      accessedAt: "2026-10-07",
      sourceType: "weights",
      live: true,
    },
    ],
    fieldSources: {
      releaseDate: [
      {
        url: "https://mimo.mi.com/docs/en-US/news/latest/v2-6",
        publisher: "Xiaomi MiMo",
        title: "MiMo-V2.6 Flash announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      contextWindow: [
      {
        url: "https://mimo.mi.com/docs/en-US/updates/model",
        publisher: "Xiaomi MiMo",
        title: "MiMo-V2.6 Flash API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      maxOutputTokens: [
      {
        url: "https://mimo.mi.com/docs/en-US/updates/model",
        publisher: "Xiaomi MiMo",
        title: "MiMo-V2.6 Flash API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      parameters: [
      {
        url: "https://mimo.mi.com/docs/en-US/news/latest/v2-6",
        publisher: "Xiaomi MiMo",
        title: "MiMo-V2.6 Flash announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      license: [
      {
        url: "https://huggingface.co/collections/XiaomiMiMo/mimo-v26",
        publisher: "Xiaomi MiMo",
        title: "MiMo-V2.6 Flash open weights",
        accessedAt: "2026-10-07",
        sourceType: "weights",
        live: true,
      },
      ],
      pricing: [
      {
        url: "https://mimo.mi.com/docs/en-US/updates/model",
        publisher: "Xiaomi MiMo",
        title: "MiMo-V2.6 Flash API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      modalities: [
      {
        url: "https://mimo.mi.com/docs/en-US/news/latest/v2-6",
        publisher: "Xiaomi MiMo",
        title: "MiMo-V2.6 Flash announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      benchmarks: [
      {
        url: "https://mimo.mi.com/docs/en-US/news/latest/v2-6",
        publisher: "Xiaomi MiMo",
        title: "MiMo-V2.6 Flash announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      isCompanyFlagship: [
      {
        url: "https://mimo.mi.com/docs/en-US/news/latest/v2-6",
        publisher: "Xiaomi MiMo",
        title: "MiMo-V2.6 Flash announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      isLatestCheckpoint: [
      {
        url: "https://mimo.mi.com/docs/en-US/news/latest/v2-6",
        publisher: "Xiaomi MiMo",
        title: "MiMo-V2.6 Flash announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
    },
    lastVerifiedAt: "2026-10-07",
    verificationStatus: "partially_verified",
    changeLog: [
      {
        date: "2026-09-22",
        summary: "Initial registry entry.",
        sources: [
          "https://mimo.mi.com/docs/en-US/news/latest/v2-6",
        ],
      },
    ],
  },

  // ─── MOONSHOT AI ───────────────────────────────────────────────────────
  {
    id: "kimi-k3",
    companyId: "moonshotai",
    companyName: "Moonshot AI",
    name: "Kimi K3",
    version: "K3",
    releaseDate: "2026-07-15",
    isCompanyFlagship: true,
    isLatestCheckpoint: true,
    statusBadge: "AGENT SWARM PICK",
    category: "flagship",
    categoryLabel: "Agent Orchestration",
    contextWindow: "262,144 tokens",
    contextWindowTokens: 262144,
    maxOutputTokens: "32,768 tokens",
    parameters: "Kimi MoE",
    openWeights: false,
    license: "Moonshot AI API",
    pricing: { input: 3.0, output: 15.0 },
    highlight: "Top-12 OpenRouter volume; agent-swarm orchestration pick with ~90% cache hits making effective cost far lower than sticker price.",
    modalities: ["Text", "Vision", "Code"],
    benchmarks: {},
    links: {
      announcement: "https://www.moonshot.ai",
      playground: "https://www.kimi.com",
    },
    sources: [
    {
      url: "https://www.moonshot.ai",
      publisher: "Moonshot AI",
      title: "Kimi K3 announcement",
      accessedAt: "2026-10-07",
      sourceType: "announcement",
      live: true,
    },
    ],
    fieldSources: {
      releaseDate: [
      {
        url: "https://www.moonshot.ai",
        publisher: "Moonshot AI",
        title: "Kimi K3 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      contextWindow: [
      {
        url: "https://www.moonshot.ai",
        publisher: "Moonshot AI",
        title: "Kimi K3 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      maxOutputTokens: [
      {
        url: "https://www.moonshot.ai",
        publisher: "Moonshot AI",
        title: "Kimi K3 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      parameters: [
      {
        url: "https://www.moonshot.ai",
        publisher: "Moonshot AI",
        title: "Kimi K3 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      license: [
      {
        url: "https://www.moonshot.ai",
        publisher: "Moonshot AI",
        title: "Kimi K3 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      pricing: [
      {
        url: "https://www.moonshot.ai",
        publisher: "Moonshot AI",
        title: "Kimi K3 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      modalities: [
      {
        url: "https://www.moonshot.ai",
        publisher: "Moonshot AI",
        title: "Kimi K3 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      isCompanyFlagship: [
      {
        url: "https://www.moonshot.ai",
        publisher: "Moonshot AI",
        title: "Kimi K3 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      isLatestCheckpoint: [
      {
        url: "https://www.moonshot.ai",
        publisher: "Moonshot AI",
        title: "Kimi K3 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
    },
    lastVerifiedAt: "2026-10-07",
    verificationStatus: "partially_verified",
    changeLog: [
      {
        date: "2026-07-15",
        summary: "Initial registry entry.",
        sources: [
          "https://www.moonshot.ai",
        ],
      },
    ],
  },

  // ─── EXISTING-LAB GAPS (volume leaders, non-flagship) ──────────────────
  {
    id: "deepseek-v4-flash-0731",
    companyId: "deepseek",
    companyName: "DeepSeek",
    name: "DeepSeek V4 Flash 0731",
    version: "V4-Flash-0731",
    releaseDate: "2026-07-31",
    isCompanyFlagship: false,
    isLatestCheckpoint: false,
    statusBadge: "VOLUME LEADER",
    category: "code",
    categoryLabel: "Fast Inference",
    contextWindow: "1,048,576 tokens",
    contextWindowTokens: 1048576,
    maxOutputTokens: "32,768 tokens",
    parameters: "284B MoE (13B Activated)",
    openWeights: false,
    license: "DeepSeek API",
    pricing: { input: 0.09, output: 0.18 },
    highlight: "Largest trailing-30-day total on OpenRouter (49.9T tokens); the default cost-first agent model at $0.09/M input with 1M context.",
    modalities: ["Text", "Code"],
    benchmarks: {},
    links: {
      announcement: "https://api-docs.deepseek.com",
      playground: "https://chat.deepseek.com",
    },
    sources: [
    {
      url: "https://api-docs.deepseek.com",
      publisher: "DeepSeek",
      title: "DeepSeek V4 Flash 0731 announcement",
      accessedAt: "2026-10-07",
      sourceType: "announcement",
      live: true,
    },
    ],
    fieldSources: {
      releaseDate: [
      {
        url: "https://api-docs.deepseek.com",
        publisher: "DeepSeek",
        title: "DeepSeek V4 Flash 0731 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      contextWindow: [
      {
        url: "https://api-docs.deepseek.com",
        publisher: "DeepSeek",
        title: "DeepSeek V4 Flash 0731 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      maxOutputTokens: [
      {
        url: "https://api-docs.deepseek.com",
        publisher: "DeepSeek",
        title: "DeepSeek V4 Flash 0731 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      parameters: [
      {
        url: "https://api-docs.deepseek.com",
        publisher: "DeepSeek",
        title: "DeepSeek V4 Flash 0731 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      license: [
      {
        url: "https://api-docs.deepseek.com",
        publisher: "DeepSeek",
        title: "DeepSeek V4 Flash 0731 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      pricing: [
      {
        url: "https://api-docs.deepseek.com",
        publisher: "DeepSeek",
        title: "DeepSeek V4 Flash 0731 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      modalities: [
      {
        url: "https://api-docs.deepseek.com",
        publisher: "DeepSeek",
        title: "DeepSeek V4 Flash 0731 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      isCompanyFlagship: [
      {
        url: "https://api-docs.deepseek.com",
        publisher: "DeepSeek",
        title: "DeepSeek V4 Flash 0731 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      isLatestCheckpoint: [
      {
        url: "https://api-docs.deepseek.com",
        publisher: "DeepSeek",
        title: "DeepSeek V4 Flash 0731 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
    },
    lastVerifiedAt: "2026-10-07",
    verificationStatus: "partially_verified",
    changeLog: [
      {
        date: "2026-07-31",
        summary: "Initial registry entry.",
        sources: [
          "https://api-docs.deepseek.com",
        ],
      },
    ],
  },
  {
    id: "deepseek-v4-flash-0423",
    companyId: "deepseek",
    companyName: "DeepSeek",
    name: "DeepSeek V4 Flash 0423",
    version: "V4-Flash-0423",
    releaseDate: "2026-04-24",
    isCompanyFlagship: false,
    isLatestCheckpoint: false,
    statusBadge: "BUDGET WORKHORSE",
    category: "code",
    categoryLabel: "Fast Inference",
    contextWindow: "1,048,576 tokens",
    contextWindowTokens: 1048576,
    maxOutputTokens: "32,768 tokens",
    parameters: "284B MoE (13B Activated)",
    openWeights: false,
    license: "DeepSeek API",
    pricing: { input: 0.09, output: 0.18 },
    highlight: "Prior Flash checkpoint with durable 22T+ monthly volume; identical budget pricing for pinned production deployments.",
    modalities: ["Text", "Code"],
    benchmarks: {},
    links: {
      announcement: "https://api-docs.deepseek.com",
      playground: "https://chat.deepseek.com",
    },
    sources: [
    {
      url: "https://api-docs.deepseek.com",
      publisher: "DeepSeek",
      title: "DeepSeek V4 Flash 0423 announcement",
      accessedAt: "2026-10-07",
      sourceType: "announcement",
      live: true,
    },
    ],
    fieldSources: {
      releaseDate: [
      {
        url: "https://api-docs.deepseek.com",
        publisher: "DeepSeek",
        title: "DeepSeek V4 Flash 0423 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      contextWindow: [
      {
        url: "https://api-docs.deepseek.com",
        publisher: "DeepSeek",
        title: "DeepSeek V4 Flash 0423 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      maxOutputTokens: [
      {
        url: "https://api-docs.deepseek.com",
        publisher: "DeepSeek",
        title: "DeepSeek V4 Flash 0423 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      parameters: [
      {
        url: "https://api-docs.deepseek.com",
        publisher: "DeepSeek",
        title: "DeepSeek V4 Flash 0423 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      license: [
      {
        url: "https://api-docs.deepseek.com",
        publisher: "DeepSeek",
        title: "DeepSeek V4 Flash 0423 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      pricing: [
      {
        url: "https://api-docs.deepseek.com",
        publisher: "DeepSeek",
        title: "DeepSeek V4 Flash 0423 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      modalities: [
      {
        url: "https://api-docs.deepseek.com",
        publisher: "DeepSeek",
        title: "DeepSeek V4 Flash 0423 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      isCompanyFlagship: [
      {
        url: "https://api-docs.deepseek.com",
        publisher: "DeepSeek",
        title: "DeepSeek V4 Flash 0423 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      isLatestCheckpoint: [
      {
        url: "https://api-docs.deepseek.com",
        publisher: "DeepSeek",
        title: "DeepSeek V4 Flash 0423 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
    },
    lastVerifiedAt: "2026-10-07",
    verificationStatus: "partially_verified",
    changeLog: [
      {
        date: "2026-04-24",
        summary: "Initial registry entry.",
        sources: [
          "https://api-docs.deepseek.com",
        ],
      },
    ],
  },
  {
    id: "gemini-3-7-flash",
    companyId: "google",
    companyName: "Google DeepMind",
    name: "Gemini 3.7 Flash",
    version: "3.7",
    releaseDate: "2026-08-13",
    isCompanyFlagship: false,
    isLatestCheckpoint: false,
    statusBadge: "MULTIMODAL DEFAULT",
    category: "multimodal",
    categoryLabel: "Fast Multimodal",
    contextWindow: "1,048,576 tokens",
    contextWindowTokens: 1048576,
    maxOutputTokens: "65,536 tokens",
    parameters: "TPU Speculative MoE",
    openWeights: false,
    license: "Google AI Studio / Vertex AI",
    pricing: { input: 0.5, output: 2.0 },
    highlight: "The traffic-leading Gemini on OpenRouter (7.9T/30d); best fast default for images, audio, video, and files.",
    modalities: ["Text", "Vision", "Audio", "Video", "Code"],
    benchmarks: {},
    links: {
      announcement: "https://blog.google/technology/ai/",
      playground: "https://aistudio.google.com",
    },
    sources: [
    {
      url: "https://blog.google/technology/ai/",
      publisher: "Google DeepMind",
      title: "Gemini 3.7 Flash announcement",
      accessedAt: "2026-10-07",
      sourceType: "announcement",
      live: true,
    },
    ],
    fieldSources: {
      releaseDate: [
      {
        url: "https://blog.google/technology/ai/",
        publisher: "Google DeepMind",
        title: "Gemini 3.7 Flash announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      contextWindow: [
      {
        url: "https://blog.google/technology/ai/",
        publisher: "Google DeepMind",
        title: "Gemini 3.7 Flash announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      maxOutputTokens: [
      {
        url: "https://blog.google/technology/ai/",
        publisher: "Google DeepMind",
        title: "Gemini 3.7 Flash announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      parameters: [
      {
        url: "https://blog.google/technology/ai/",
        publisher: "Google DeepMind",
        title: "Gemini 3.7 Flash announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      license: [
      {
        url: "https://blog.google/technology/ai/",
        publisher: "Google DeepMind",
        title: "Gemini 3.7 Flash announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      pricing: [
      {
        url: "https://blog.google/technology/ai/",
        publisher: "Google DeepMind",
        title: "Gemini 3.7 Flash announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      modalities: [
      {
        url: "https://blog.google/technology/ai/",
        publisher: "Google DeepMind",
        title: "Gemini 3.7 Flash announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      isCompanyFlagship: [
      {
        url: "https://blog.google/technology/ai/",
        publisher: "Google DeepMind",
        title: "Gemini 3.7 Flash announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      isLatestCheckpoint: [
      {
        url: "https://blog.google/technology/ai/",
        publisher: "Google DeepMind",
        title: "Gemini 3.7 Flash announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
    },
    lastVerifiedAt: "2026-10-07",
    verificationStatus: "partially_verified",
    changeLog: [
      {
        date: "2026-08-13",
        summary: "Initial registry entry.",
        sources: [
          "https://blog.google/technology/ai/",
        ],
      },
    ],
  },
  {
    id: "claude-sonnet-5",
    companyId: "anthropic",
    companyName: "Anthropic",
    name: "Claude Sonnet 5",
    version: "5.0",
    releaseDate: "2026-08-06",
    isCompanyFlagship: false,
    isLatestCheckpoint: false,
    statusBadge: "PRODUCTION DEFAULT",
    category: "flagship",
    categoryLabel: "Balanced Production",
    contextWindow: "1,000,000 tokens",
    contextWindowTokens: 1000000,
    maxOutputTokens: "65,536 tokens",
    parameters: "Dense Frontier",
    openWeights: false,
    license: "Proprietary API",
    pricing: { input: 3.0, output: 15.0 },
    highlight: "The recommended default for coding, writing, and production agents; top tool-call reliability for structured workflows.",
    modalities: ["Text", "Vision", "Code"],
    benchmarks: {},
    links: {
      playground: "https://claude.ai",
      apiDocs: "https://docs.anthropic.com",
    },
    sources: [
    {
      url: "https://docs.anthropic.com",
      publisher: "Anthropic",
      title: "Claude Sonnet 5 API reference",
      accessedAt: "2026-10-07",
      sourceType: "api-docs",
      live: true,
    },
    ],
    fieldSources: {
      releaseDate: [
      {
        url: "https://docs.anthropic.com",
        publisher: "Anthropic",
        title: "Claude Sonnet 5 API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      contextWindow: [
      {
        url: "https://docs.anthropic.com",
        publisher: "Anthropic",
        title: "Claude Sonnet 5 API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      maxOutputTokens: [
      {
        url: "https://docs.anthropic.com",
        publisher: "Anthropic",
        title: "Claude Sonnet 5 API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      parameters: [
      {
        url: "https://docs.anthropic.com",
        publisher: "Anthropic",
        title: "Claude Sonnet 5 API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      license: [
      {
        url: "https://docs.anthropic.com",
        publisher: "Anthropic",
        title: "Claude Sonnet 5 API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      pricing: [
      {
        url: "https://docs.anthropic.com",
        publisher: "Anthropic",
        title: "Claude Sonnet 5 API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      modalities: [
      {
        url: "https://docs.anthropic.com",
        publisher: "Anthropic",
        title: "Claude Sonnet 5 API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      isCompanyFlagship: [
      {
        url: "https://docs.anthropic.com",
        publisher: "Anthropic",
        title: "Claude Sonnet 5 API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      isLatestCheckpoint: [
      {
        url: "https://docs.anthropic.com",
        publisher: "Anthropic",
        title: "Claude Sonnet 5 API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
    },
    lastVerifiedAt: "2026-10-07",
    verificationStatus: "partially_verified",
    changeLog: [
      {
        date: "2026-08-06",
        summary: "Initial registry entry.",
        sources: [
          "https://docs.anthropic.com",
        ],
      },
    ],
  },
  {
    id: "claude-sonnet-5-5",
    companyId: "anthropic",
    companyName: "Anthropic",
    name: "Claude Sonnet 5.5",
    version: "5.5",
    releaseDate: "2026-09-28",
    isCompanyFlagship: false,
    isLatestCheckpoint: true,
    statusBadge: "30% FASTER",
    category: "flagship",
    categoryLabel: "Fast Balanced",
    contextWindow: "1,000,000 tokens",
    contextWindowTokens: 1000000,
    maxOutputTokens: "128,000 tokens",
    parameters: "Undisclosed (Anthropic)",
    openWeights: false,
    license: "Proprietary API",
    pricing: { input: 2.0, output: 10.0 },
    highlight: "Released Sept 28, 2026; 70.6% on Terminal-Bench 4.0 versus 10.3% for Sonnet 5, running 30%+ faster at the same $2/$10 pricing.",
    modalities: ["Text", "Vision", "Code"],
    benchmarks: {
      terminalBench: "70.6%",
    },
    links: {
      announcement: "https://www.anthropic.com/claude-sonnet-5-5",
      playground: "https://claude.ai",
      apiDocs: "https://docs.anthropic.com",
    },
    sources: [
    {
      url: "https://www.anthropic.com/claude-sonnet-5-5",
      publisher: "Anthropic",
      title: "Claude Sonnet 5.5 announcement",
      accessedAt: "2026-10-07",
      sourceType: "announcement",
      live: true,
    },
    {
      url: "https://docs.anthropic.com",
      publisher: "Anthropic",
      title: "Claude Sonnet 5.5 API reference",
      accessedAt: "2026-10-07",
      sourceType: "api-docs",
      live: true,
    },
    ],
    fieldSources: {
      releaseDate: [
      {
        url: "https://www.anthropic.com/claude-sonnet-5-5",
        publisher: "Anthropic",
        title: "Claude Sonnet 5.5 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      contextWindow: [
      {
        url: "https://docs.anthropic.com",
        publisher: "Anthropic",
        title: "Claude Sonnet 5.5 API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      maxOutputTokens: [
      {
        url: "https://docs.anthropic.com",
        publisher: "Anthropic",
        title: "Claude Sonnet 5.5 API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      parameters: [
      {
        url: "https://www.anthropic.com/claude-sonnet-5-5",
        publisher: "Anthropic",
        title: "Claude Sonnet 5.5 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      license: [
      {
        url: "https://www.anthropic.com/claude-sonnet-5-5",
        publisher: "Anthropic",
        title: "Claude Sonnet 5.5 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      pricing: [
      {
        url: "https://docs.anthropic.com",
        publisher: "Anthropic",
        title: "Claude Sonnet 5.5 API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      modalities: [
      {
        url: "https://www.anthropic.com/claude-sonnet-5-5",
        publisher: "Anthropic",
        title: "Claude Sonnet 5.5 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      benchmarks: [
      {
        url: "https://www.anthropic.com/claude-sonnet-5-5",
        publisher: "Anthropic",
        title: "Claude Sonnet 5.5 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      isCompanyFlagship: [
      {
        url: "https://www.anthropic.com/claude-sonnet-5-5",
        publisher: "Anthropic",
        title: "Claude Sonnet 5.5 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      isLatestCheckpoint: [
      {
        url: "https://www.anthropic.com/claude-sonnet-5-5",
        publisher: "Anthropic",
        title: "Claude Sonnet 5.5 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
    },
    lastVerifiedAt: "2026-10-07",
    verificationStatus: "partially_verified",
    changeLog: [
      {
        date: "2026-09-28",
        summary: "Initial registry entry.",
        sources: [
          "https://www.anthropic.com/claude-sonnet-5-5",
        ],
      },
    ],
  },
  {
    id: "chatgpt-images-2-5",
    companyId: "openai",
    companyName: "OpenAI",
    name: "ChatGPT Images 2.5",
    version: "Images 2.5",
    releaseDate: "2026-09-08",
    isCompanyFlagship: false,
    isLatestCheckpoint: true,
    statusBadge: "NEW · SEPT 8",
    category: "image",
    categoryLabel: "SOTA Image Generation",
    contextWindow: "Undisclosed (image-native)",
    contextWindowTokens: 0,
    maxOutputTokens: "Up to 4K image output",
    parameters: "Undisclosed (OpenAI image stack)",
    openWeights: false,
    license: "ChatGPT / OpenAI API",
    pricing: { input: 5.0, output: 30.0 },
    highlight: "Launched Sept 8, 2026; OpenAI's image model with sharper detail, precision editing and 50% lower latency. API twins Flare (default) and Sunburst (precision).",
    modalities: ["Text", "Image"],
    benchmarks: {},
    variants: [
      {
        name: "GPT-Image-2.5 Flare",
        role: "API DEFAULT",
        detail: "Same quality and editing gains at 50% lower latency than GPT-Image-2, with low-to-max quality tiers. Built for creator content, product visuals, visual search and rapid prototyping.",
        pricingNote: "$5 in / $30 out per 1M tokens (≈$0.21 per 1024px high image)",
        link: "https://developers.openai.com/api/docs/models/gpt-image-2.5-flare",
      },
      {
        name: "GPT-Image-2.5 Sunburst",
        role: "API PRECISION",
        detail: "Tighter control across edits with longer generation times. Built for production-ready campaign creative and polished product imagery.",
        pricingNote: "$5 in / $30 out per 1M tokens",
        link: "https://developers.openai.com/api/docs/models/gpt-image-2.5-sunburst",
      },
    ],
    links: {
      announcement: "https://openai.com/index/introducing-chatgpt-images-2-5/",
      playground: "https://chatgpt.com",
      apiDocs: "https://developers.openai.com/api/docs/models/gpt-image-2.5-flare",
    },
    sources: [
    {
      url: "https://openai.com/index/introducing-chatgpt-images-2-5/",
      publisher: "OpenAI",
      title: "ChatGPT Images 2.5 announcement",
      accessedAt: "2026-10-07",
      sourceType: "announcement",
      live: false,
      note: "Host alive; automated fetch blocked, page not re-confirmed on access date.",
    },
    {
      url: "https://developers.openai.com/api/docs/models/gpt-image-2.5-flare",
      publisher: "OpenAI",
      title: "ChatGPT Images 2.5 API reference",
      accessedAt: "2026-10-07",
      sourceType: "api-docs",
      live: true,
    },
    ],
    fieldSources: {
      releaseDate: [
      {
        url: "https://developers.openai.com/api/docs/models/gpt-image-2.5-flare",
        publisher: "OpenAI",
        title: "ChatGPT Images 2.5 API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      contextWindow: [
      {
        url: "https://developers.openai.com/api/docs/models/gpt-image-2.5-flare",
        publisher: "OpenAI",
        title: "ChatGPT Images 2.5 API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      maxOutputTokens: [
      {
        url: "https://developers.openai.com/api/docs/models/gpt-image-2.5-flare",
        publisher: "OpenAI",
        title: "ChatGPT Images 2.5 API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      parameters: [
      {
        url: "https://developers.openai.com/api/docs/models/gpt-image-2.5-flare",
        publisher: "OpenAI",
        title: "ChatGPT Images 2.5 API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      license: [
      {
        url: "https://developers.openai.com/api/docs/models/gpt-image-2.5-flare",
        publisher: "OpenAI",
        title: "ChatGPT Images 2.5 API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      pricing: [
      {
        url: "https://developers.openai.com/api/docs/models/gpt-image-2.5-flare",
        publisher: "OpenAI",
        title: "ChatGPT Images 2.5 API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      modalities: [
      {
        url: "https://developers.openai.com/api/docs/models/gpt-image-2.5-flare",
        publisher: "OpenAI",
        title: "ChatGPT Images 2.5 API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      isCompanyFlagship: [
      {
        url: "https://developers.openai.com/api/docs/models/gpt-image-2.5-flare",
        publisher: "OpenAI",
        title: "ChatGPT Images 2.5 API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      isLatestCheckpoint: [
      {
        url: "https://developers.openai.com/api/docs/models/gpt-image-2.5-flare",
        publisher: "OpenAI",
        title: "ChatGPT Images 2.5 API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
    },
    lastVerifiedAt: "2026-10-07",
    verificationStatus: "partially_verified",
    changeLog: [
      {
        date: "2026-09-08",
        summary: "Initial registry entry.",
        sources: [
          "https://openai.com/index/introducing-chatgpt-images-2-5/",
        ],
      },
    ],
  },
  {
    id: "nano-banana-pro",
    companyId: "google",
    companyName: "Google DeepMind",
    name: "Nano Banana Pro",
    version: "Gemini 3 Pro Image",
    releaseDate: "2025-11-20",
    isCompanyFlagship: false,
    isLatestCheckpoint: false,
    statusBadge: "4K NATIVE",
    category: "image",
    categoryLabel: "Reasoning Image Edit",
    contextWindow: "65,536 tokens",
    contextWindowTokens: 65536,
    maxOutputTokens: "32,768 tokens",
    parameters: "Undisclosed (Gemini 3 Pro family)",
    openWeights: false,
    license: "Google AI Studio / Vertex AI",
    pricing: { input: 2.0, output: 120.0 },
    highlight: "Google's reasoning-first image model: native 4K output, 14 reference images, 10 aspect ratios and SynthID watermarking; about $0.134 per 1K/2K image.",
    modalities: ["Text", "Image"],
    benchmarks: {},
    links: {
      announcement: "https://ai.google.dev/gemini-api/docs/models/gemini-3-pro-image",
      playground: "https://aistudio.google.com",
    },
    sources: [
    {
      url: "https://ai.google.dev/gemini-api/docs/models/gemini-3-pro-image",
      publisher: "Google DeepMind",
      title: "Nano Banana Pro announcement",
      accessedAt: "2026-10-07",
      sourceType: "announcement",
      live: true,
    },
    ],
    fieldSources: {
      releaseDate: [
      {
        url: "https://ai.google.dev/gemini-api/docs/models/gemini-3-pro-image",
        publisher: "Google DeepMind",
        title: "Nano Banana Pro announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      contextWindow: [
      {
        url: "https://ai.google.dev/gemini-api/docs/models/gemini-3-pro-image",
        publisher: "Google DeepMind",
        title: "Nano Banana Pro announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      maxOutputTokens: [
      {
        url: "https://ai.google.dev/gemini-api/docs/models/gemini-3-pro-image",
        publisher: "Google DeepMind",
        title: "Nano Banana Pro announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      parameters: [
      {
        url: "https://ai.google.dev/gemini-api/docs/models/gemini-3-pro-image",
        publisher: "Google DeepMind",
        title: "Nano Banana Pro announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      license: [
      {
        url: "https://ai.google.dev/gemini-api/docs/models/gemini-3-pro-image",
        publisher: "Google DeepMind",
        title: "Nano Banana Pro announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      pricing: [
      {
        url: "https://ai.google.dev/gemini-api/docs/models/gemini-3-pro-image",
        publisher: "Google DeepMind",
        title: "Nano Banana Pro announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      modalities: [
      {
        url: "https://ai.google.dev/gemini-api/docs/models/gemini-3-pro-image",
        publisher: "Google DeepMind",
        title: "Nano Banana Pro announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      isCompanyFlagship: [
      {
        url: "https://ai.google.dev/gemini-api/docs/models/gemini-3-pro-image",
        publisher: "Google DeepMind",
        title: "Nano Banana Pro announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      isLatestCheckpoint: [
      {
        url: "https://ai.google.dev/gemini-api/docs/models/gemini-3-pro-image",
        publisher: "Google DeepMind",
        title: "Nano Banana Pro announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
    },
    lastVerifiedAt: "2026-10-07",
    verificationStatus: "partially_verified",
    changeLog: [
      {
        date: "2025-11-20",
        summary: "Initial registry entry.",
        sources: [
          "https://ai.google.dev/gemini-api/docs/models/gemini-3-pro-image",
        ],
      },
    ],
  },
  {
    id: "veo-3-1",
    companyId: "google",
    companyName: "Google DeepMind",
    name: "Veo 3.1",
    version: "3.1",
    releaseDate: "2025-10-15",
    isCompanyFlagship: false,
    isLatestCheckpoint: false,
    statusBadge: "NATIVE AUDIO",
    category: "video",
    categoryLabel: "Audio-Native Video",
    contextWindow: "8s clips · up to 4K",
    contextWindowTokens: 0,
    maxOutputTokens: "8-second clips (+ extension)",
    parameters: "Undisclosed (Veo stack)",
    openWeights: false,
    license: "Gemini API / Vertex AI / Flow",
    pricing: { input: 0.4, output: 0.4 },
    pricingUnit: "per second",
    highlight: "Google's video model with native dialogue and sound effects, 4K detail and scene extension; $0.40/s at 1080p with audio.",
    modalities: ["Text", "Video", "Audio"],
    benchmarks: {},
    links: {
      announcement: "https://blog.google/innovation-and-ai/products/veo-updates-flow/",
      playground: "https://aistudio.google.com",
    },
    sources: [
    {
      url: "https://blog.google/innovation-and-ai/products/veo-updates-flow/",
      publisher: "Google DeepMind",
      title: "Veo 3.1 announcement",
      accessedAt: "2026-10-07",
      sourceType: "announcement",
      live: true,
    },
    ],
    fieldSources: {
      releaseDate: [
      {
        url: "https://blog.google/innovation-and-ai/products/veo-updates-flow/",
        publisher: "Google DeepMind",
        title: "Veo 3.1 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      contextWindow: [
      {
        url: "https://blog.google/innovation-and-ai/products/veo-updates-flow/",
        publisher: "Google DeepMind",
        title: "Veo 3.1 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      maxOutputTokens: [
      {
        url: "https://blog.google/innovation-and-ai/products/veo-updates-flow/",
        publisher: "Google DeepMind",
        title: "Veo 3.1 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      parameters: [
      {
        url: "https://blog.google/innovation-and-ai/products/veo-updates-flow/",
        publisher: "Google DeepMind",
        title: "Veo 3.1 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      license: [
      {
        url: "https://blog.google/innovation-and-ai/products/veo-updates-flow/",
        publisher: "Google DeepMind",
        title: "Veo 3.1 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      pricing: [
      {
        url: "https://blog.google/innovation-and-ai/products/veo-updates-flow/",
        publisher: "Google DeepMind",
        title: "Veo 3.1 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      modalities: [
      {
        url: "https://blog.google/innovation-and-ai/products/veo-updates-flow/",
        publisher: "Google DeepMind",
        title: "Veo 3.1 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      isCompanyFlagship: [
      {
        url: "https://blog.google/innovation-and-ai/products/veo-updates-flow/",
        publisher: "Google DeepMind",
        title: "Veo 3.1 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      isLatestCheckpoint: [
      {
        url: "https://blog.google/innovation-and-ai/products/veo-updates-flow/",
        publisher: "Google DeepMind",
        title: "Veo 3.1 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
    },
    lastVerifiedAt: "2026-10-07",
    verificationStatus: "partially_verified",
    changeLog: [
      {
        date: "2025-10-15",
        summary: "Initial registry entry.",
        sources: [
          "https://blog.google/innovation-and-ai/products/veo-updates-flow/",
        ],
      },
    ],
  },
  {
    id: "kling-3-0",
    companyId: "kuaishou",
    companyName: "Kuaishou Kling",
    name: "Kling 3.0",
    version: "3.0",
    releaseDate: "2026-02-05",
    isCompanyFlagship: true,
    isLatestCheckpoint: true,
    statusBadge: "VALUE KING",
    category: "video",
    categoryLabel: "Value Video Generation",
    contextWindow: "10–15s clips · 4K/60fps",
    contextWindowTokens: 0,
    maxOutputTokens: "15-second multi-shot",
    parameters: "Undisclosed (Kuaishou)",
    openWeights: false,
    license: "Kling API / App",
    pricing: { input: 0.084, output: 0.084 },
    pricingUnit: "per second",
    highlight: "Kuaishou's Feb 2026 video flagship: native multilingual audio, motion brush and best-in-class image-to-video at ~$0.84 per 10s clip.",
    modalities: ["Text", "Video", "Audio"],
    benchmarks: {},
    links: {
      announcement: "https://klingai.com",
      playground: "https://klingai.com",
    },
    sources: [
    {
      url: "https://klingai.com",
      publisher: "Kuaishou",
      title: "Kling 3.0 announcement",
      accessedAt: "2026-10-07",
      sourceType: "announcement",
      live: true,
    },
    ],
    fieldSources: {
      releaseDate: [
      {
        url: "https://klingai.com",
        publisher: "Kuaishou",
        title: "Kling 3.0 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      contextWindow: [
      {
        url: "https://klingai.com",
        publisher: "Kuaishou",
        title: "Kling 3.0 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      maxOutputTokens: [
      {
        url: "https://klingai.com",
        publisher: "Kuaishou",
        title: "Kling 3.0 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      parameters: [
      {
        url: "https://klingai.com",
        publisher: "Kuaishou",
        title: "Kling 3.0 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      license: [
      {
        url: "https://klingai.com",
        publisher: "Kuaishou",
        title: "Kling 3.0 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      pricing: [
      {
        url: "https://klingai.com",
        publisher: "Kuaishou",
        title: "Kling 3.0 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      modalities: [
      {
        url: "https://klingai.com",
        publisher: "Kuaishou",
        title: "Kling 3.0 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      isCompanyFlagship: [
      {
        url: "https://klingai.com",
        publisher: "Kuaishou",
        title: "Kling 3.0 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      isLatestCheckpoint: [
      {
        url: "https://klingai.com",
        publisher: "Kuaishou",
        title: "Kling 3.0 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
    },
    lastVerifiedAt: "2026-10-07",
    verificationStatus: "partially_verified",
    changeLog: [
      {
        date: "2026-02-05",
        summary: "Initial registry entry.",
        sources: [
          "https://klingai.com",
        ],
      },
    ],
  },
  {
    id: "runway-gen-4-5",
    companyId: "runway",
    companyName: "Runway",
    name: "Runway Gen-4.5",
    version: "Gen-4.5",
    releaseDate: "2025-12-01",
    isCompanyFlagship: true,
    isLatestCheckpoint: true,
    statusBadge: "VIDEO ARENA #1",
    category: "video",
    categoryLabel: "Director Video Model",
    contextWindow: "2–10s clips · 4K export",
    contextWindowTokens: 0,
    maxOutputTokens: "10-second clips",
    parameters: "Undisclosed (Runway)",
    openWeights: false,
    license: "Runway API / App",
    pricing: { input: 0.15, output: 0.15 },
    pricingUnit: "per second",
    highlight: "Launched Dec 2025 with 1,247 Elo — No. 1 in text-to-video: director camera moves and reference characters at ~$1.49 per 10s clip.",
    modalities: ["Text", "Image", "Video"],
    benchmarks: {},
    links: {
      announcement: "https://runwayml.com/research/introducing-runway-gen-4.5",
      playground: "https://runwayml.com",
    },
    sources: [
    {
      url: "https://runwayml.com/research/introducing-runway-gen-4.5",
      publisher: "Runway",
      title: "Runway Gen-4.5 announcement",
      accessedAt: "2026-10-07",
      sourceType: "announcement",
      live: true,
    },
    ],
    fieldSources: {
      releaseDate: [
      {
        url: "https://runwayml.com/research/introducing-runway-gen-4.5",
        publisher: "Runway",
        title: "Runway Gen-4.5 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      contextWindow: [
      {
        url: "https://runwayml.com/research/introducing-runway-gen-4.5",
        publisher: "Runway",
        title: "Runway Gen-4.5 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      maxOutputTokens: [
      {
        url: "https://runwayml.com/research/introducing-runway-gen-4.5",
        publisher: "Runway",
        title: "Runway Gen-4.5 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      parameters: [
      {
        url: "https://runwayml.com/research/introducing-runway-gen-4.5",
        publisher: "Runway",
        title: "Runway Gen-4.5 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      license: [
      {
        url: "https://runwayml.com/research/introducing-runway-gen-4.5",
        publisher: "Runway",
        title: "Runway Gen-4.5 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      pricing: [
      {
        url: "https://runwayml.com/research/introducing-runway-gen-4.5",
        publisher: "Runway",
        title: "Runway Gen-4.5 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      modalities: [
      {
        url: "https://runwayml.com/research/introducing-runway-gen-4.5",
        publisher: "Runway",
        title: "Runway Gen-4.5 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      isCompanyFlagship: [
      {
        url: "https://runwayml.com/research/introducing-runway-gen-4.5",
        publisher: "Runway",
        title: "Runway Gen-4.5 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      isLatestCheckpoint: [
      {
        url: "https://runwayml.com/research/introducing-runway-gen-4.5",
        publisher: "Runway",
        title: "Runway Gen-4.5 announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
    },
    lastVerifiedAt: "2026-10-07",
    verificationStatus: "partially_verified",
    changeLog: [
      {
        date: "2025-12-01",
        summary: "Initial registry entry.",
        sources: [
          "https://runwayml.com/research/introducing-runway-gen-4.5",
        ],
      },
    ],
  },

  // ─── SARVAM AI ─────────────────────────────────────────────────────────────
  {
    id: "sarvam-105b",
    companyId: "sarvam",
    companyName: "Sarvam AI",
    name: "Sarvam 105B",
    version: "105B",
    releaseDate: "2026-03-06",
    isCompanyFlagship: true,
    isLatestCheckpoint: true,
    statusBadge: "PRODUCTION FLAGSHIP",
    category: "flagship",
    categoryLabel: "Open Reasoning MoE",
    contextWindow: "128,000 tokens",
    contextWindowTokens: 128000,
    maxOutputTokens: "32,768 tokens",
    parameters: "105B MoE (10.3B Active, 128 Experts)",
    openWeights: true,
    license: "Apache 2.0",
    pricing: { input: 0.33, output: 0.83 },
    highlight: "Released Mar 6, 2026; India's sovereign 105B MoE trained from scratch on 12T tokens, SOTA across 22 Indian languages with 98.6 Math500 and 49.5 BrowseComp.",
    modalities: ["Text", "Code"],
    benchmarks: {
      mmluPro: "81.7%",
      sweBench: "45.0%",
      gpqa: "78.7%",
    },
    links: {
      announcement: "https://www.sarvam.ai/blogs/sarvam-30b-105b",
      playground: "https://dashboard.sarvam.ai/",
      apiDocs: "https://docs.sarvam.ai/api-reference-docs/getting-started/models/sarvam-105b",
      weights: "https://huggingface.co/sarvamai/sarvam-105b",
    },
    sources: [
    {
      url: "https://www.sarvam.ai/blogs/sarvam-30b-105b",
      publisher: "Sarvam AI",
      title: "Sarvam 105B announcement",
      accessedAt: "2026-10-07",
      sourceType: "announcement",
      live: true,
    },
    {
      url: "https://docs.sarvam.ai/api-reference-docs/getting-started/models/sarvam-105b",
      publisher: "Sarvam AI",
      title: "Sarvam 105B API reference",
      accessedAt: "2026-10-07",
      sourceType: "api-docs",
      live: true,
    },
    {
      url: "https://huggingface.co/sarvamai/sarvam-105b",
      publisher: "Sarvam AI",
      title: "Sarvam 105B open weights",
      accessedAt: "2026-10-07",
      sourceType: "weights",
      live: true,
    },
    ],
    fieldSources: {
      releaseDate: [
      {
        url: "https://www.sarvam.ai/blogs/sarvam-30b-105b",
        publisher: "Sarvam AI",
        title: "Sarvam 105B announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      contextWindow: [
      {
        url: "https://docs.sarvam.ai/api-reference-docs/getting-started/models/sarvam-105b",
        publisher: "Sarvam AI",
        title: "Sarvam 105B API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      maxOutputTokens: [
      {
        url: "https://docs.sarvam.ai/api-reference-docs/getting-started/models/sarvam-105b",
        publisher: "Sarvam AI",
        title: "Sarvam 105B API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      parameters: [
      {
        url: "https://www.sarvam.ai/blogs/sarvam-30b-105b",
        publisher: "Sarvam AI",
        title: "Sarvam 105B announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      license: [
      {
        url: "https://huggingface.co/sarvamai/sarvam-105b",
        publisher: "Sarvam AI",
        title: "Sarvam 105B open weights",
        accessedAt: "2026-10-07",
        sourceType: "weights",
        live: true,
      },
      ],
      pricing: [
      {
        url: "https://docs.sarvam.ai/api-reference-docs/getting-started/models/sarvam-105b",
        publisher: "Sarvam AI",
        title: "Sarvam 105B API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      modalities: [
      {
        url: "https://www.sarvam.ai/blogs/sarvam-30b-105b",
        publisher: "Sarvam AI",
        title: "Sarvam 105B announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      benchmarks: [
      {
        url: "https://www.sarvam.ai/blogs/sarvam-30b-105b",
        publisher: "Sarvam AI",
        title: "Sarvam 105B announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      isCompanyFlagship: [
      {
        url: "https://www.sarvam.ai/blogs/sarvam-30b-105b",
        publisher: "Sarvam AI",
        title: "Sarvam 105B announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      isLatestCheckpoint: [
      {
        url: "https://www.sarvam.ai/blogs/sarvam-30b-105b",
        publisher: "Sarvam AI",
        title: "Sarvam 105B announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
    },
    lastVerifiedAt: "2026-10-07",
    verificationStatus: "partially_verified",
    changeLog: [
      {
        date: "2026-03-06",
        summary: "Initial registry entry.",
        sources: [
          "https://www.sarvam.ai/blogs/sarvam-30b-105b",
        ],
      },
    ],
  },

  // ─── TYPESAFE AI ─────────────────────────────────────────────────────────
  {
    id: "jev-1",
    companyId: "typesafe",
    companyName: "TypeSafe AI",
    name: "Jev",
    version: "1.0",
    releaseDate: "2026-09-15",
    isCompanyFlagship: true,
    isLatestCheckpoint: true,
    statusBadge: "NEW DROP",
    category: "flagship",
    categoryLabel: "Decision Model",
    contextWindow: "Undisclosed (state + schema)",
    contextWindowTokens: 0,
    maxOutputTokens: "Type-safe values (no text tokens)",
    parameters: "Undisclosed (RLCD System One)",
    openWeights: false,
    license: "Proprietary API",
    pricing: { input: 0.042, output: 0 },
    highlight: "Released Sept 15, 2026; TypeSafe's first System One model returns typed decisions with calibrated confidence in 70-500ms, at $0.042 per 1M input tokens with free output.",
    modalities: ["Text"],
    benchmarks: {},
    links: {
      announcement: "https://typesafe.ai/blog/introducing-system-one-models-and-jev",
      playground: "https://jevai.net/",
      apiDocs: "https://docs.typesafe.ai/",
    },
    sources: [
    {
      url: "https://typesafe.ai/blog/introducing-system-one-models-and-jev",
      publisher: "TypeSafe AI",
      title: "Jev announcement",
      accessedAt: "2026-10-07",
      sourceType: "announcement",
      live: true,
    },
    {
      url: "https://docs.typesafe.ai/",
      publisher: "TypeSafe AI",
      title: "Jev API reference",
      accessedAt: "2026-10-07",
      sourceType: "api-docs",
      live: true,
    },
    ],
    fieldSources: {
      releaseDate: [
      {
        url: "https://typesafe.ai/blog/introducing-system-one-models-and-jev",
        publisher: "TypeSafe AI",
        title: "Jev announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      contextWindow: [
      {
        url: "https://docs.typesafe.ai/",
        publisher: "TypeSafe AI",
        title: "Jev API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      maxOutputTokens: [
      {
        url: "https://docs.typesafe.ai/",
        publisher: "TypeSafe AI",
        title: "Jev API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      parameters: [
      {
        url: "https://typesafe.ai/blog/introducing-system-one-models-and-jev",
        publisher: "TypeSafe AI",
        title: "Jev announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      license: [
      {
        url: "https://typesafe.ai/blog/introducing-system-one-models-and-jev",
        publisher: "TypeSafe AI",
        title: "Jev announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      pricing: [
      {
        url: "https://docs.typesafe.ai/",
        publisher: "TypeSafe AI",
        title: "Jev API reference",
        accessedAt: "2026-10-07",
        sourceType: "api-docs",
        live: true,
      },
      ],
      modalities: [
      {
        url: "https://typesafe.ai/blog/introducing-system-one-models-and-jev",
        publisher: "TypeSafe AI",
        title: "Jev announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      isCompanyFlagship: [
      {
        url: "https://typesafe.ai/blog/introducing-system-one-models-and-jev",
        publisher: "TypeSafe AI",
        title: "Jev announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
      isLatestCheckpoint: [
      {
        url: "https://typesafe.ai/blog/introducing-system-one-models-and-jev",
        publisher: "TypeSafe AI",
        title: "Jev announcement",
        accessedAt: "2026-10-07",
        sourceType: "announcement",
        live: true,
      },
      ],
    },
    lastVerifiedAt: "2026-10-07",
    verificationStatus: "partially_verified",
    changeLog: [
      {
        date: "2026-09-15",
        summary: "Initial registry entry.",
        sources: [
          "https://typesafe.ai/blog/introducing-system-one-models-and-jev",
        ],
      },
    ],
  },
]
