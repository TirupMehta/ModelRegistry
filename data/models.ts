export interface ModelPricing {
  input: number // USD per 1M tokens
  output: number // USD per 1M tokens
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
  category: "flagship" | "reasoning" | "open-weights" | "code" | "multimodal" | "audio"
  categoryLabel: string
  contextWindow: string
  contextWindowTokens: number
  maxOutputTokens: string
  parameters: string
  openWeights: boolean
  license: string
  pricing: ModelPricing
  highlight: string
  modalities: ("Text" | "Vision" | "Audio" | "Video" | "Code")[]
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
}

/**
 * Checkpoint: Verified frontier models across the premier 9 AI laboratories.
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
    isCompanyFlagship: true,
    isLatestCheckpoint: true,
    statusBadge: "FRONTIER FLAGSHIP #1",
    category: "reasoning",
    categoryLabel: "Adaptive Reasoning",
    contextWindow: "1,000,000 tokens",
    contextWindowTokens: 1000000,
    maxOutputTokens: "128,000 tokens",
    parameters: "Frontier MoE (Adaptive Thinking)",
    openWeights: false,
    license: "Proprietary API / Cloud Foundry",
    pricing: { input: 10.0, output: 50.0 },
    highlight: "Released Sept 1, 2026; Anthropic's reigning flagship for agentic coding and knowledge work. Features a 75% reduction in cache read costs ($0.25/M tokens) and 52.6% on Terminal-Bench-Science.",
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
  },

  // ─── OPENAI ───────────────────────────────────────────────────────────────
  {
    id: "gpt-5-6-sol",
    companyId: "openai",
    companyName: "OpenAI",
    name: "GPT-5.6 Sol",
    version: "5.6",
    releaseDate: "2026-08-05",
    isCompanyFlagship: true,
    isLatestCheckpoint: false,
    statusBadge: "PRIMARY FLAGSHIP",
    category: "flagship",
    categoryLabel: "Frontier Foundation",
    contextWindow: "1,050,000 tokens",
    contextWindowTokens: 1050000,
    maxOutputTokens: "65,536 tokens",
    parameters: "Unified Reasoning Architecture",
    openWeights: false,
    license: "Proprietary API / ChatGPT Pro",
    pricing: { input: 3.0, output: 12.0 },
    highlight: "OpenAI's primary general-purpose flagship model. Combines native fast execution, multi-agent orchestration, and 1.05M context for production software development.",
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
  },
  {
    id: "openai-astra",
    companyId: "openai",
    companyName: "OpenAI",
    name: "OpenAI Astra",
    version: "1.0",
    releaseDate: "2026-09-01",
    isCompanyFlagship: false,
    isLatestCheckpoint: true,
    statusBadge: "CRITICAL CYBERSECURITY",
    category: "reasoning",
    categoryLabel: "Cybersecurity Frontier",
    contextWindow: "1,050,000 tokens",
    contextWindowTokens: 1050000,
    maxOutputTokens: "65,536 tokens",
    parameters: "Universal Chain-of-Thought",
    openWeights: false,
    license: "Restricted Defense / Preparedness API",
    pricing: { input: 15.0, output: 60.0 },
    highlight: "Announced Sept 1, 2026; the first LLM to meet OpenAI's 'Critical' cybersecurity threshold under its Preparedness Framework, capable of identifying zero-day exploits.",
    modalities: ["Text", "Code"],
    benchmarks: {
      sweBench: "77.5%",
      gpqa: "75.1%",
    },
    links: {
      announcement: "https://openai.com/index/preparedness-framework-astra/",
    },
  },
  {
    id: "gpt-5-6-luna",
    companyId: "openai",
    companyName: "OpenAI",
    name: "GPT-5.6 Luna",
    version: "5.6-Luna",
    releaseDate: "2026-07-28",
    isCompanyFlagship: false,
    isLatestCheckpoint: false,
    statusBadge: "HIGH THROUGHPUT",
    category: "code",
    categoryLabel: "Fast Inference",
    contextWindow: "256,000 tokens",
    contextWindowTokens: 256000,
    maxOutputTokens: "16,384 tokens",
    parameters: "Distilled High-Throughput",
    openWeights: false,
    license: "OpenAI API",
    pricing: { input: 0.2, output: 0.8 },
    highlight: "High-speed developer model designed for streaming code completions, real-time function calling, and high-frequency queries at $0.20/1M tokens.",
    modalities: ["Text", "Code"],
    benchmarks: {
      mmluPro: "79.1%",
    },
    links: {
      apiDocs: "https://platform.openai.com/docs",
    },
  },

  // ─── META AI ─────────────────────────────────────────────────────────────
  {
    id: "llama-4-maverick",
    companyId: "meta",
    companyName: "Meta AI",
    name: "Llama 4 Maverick (128E)",
    version: "4.0",
    releaseDate: "2026-04-18",
    isCompanyFlagship: true,
    isLatestCheckpoint: false,
    statusBadge: "OPEN WEIGHTS SOTA",
    category: "open-weights",
    categoryLabel: "128-Expert Open MoE",
    contextWindow: "1,048,576 tokens",
    contextWindowTokens: 1048576,
    maxOutputTokens: "32,768 tokens",
    parameters: "128-Expert Mixture-of-Experts",
    openWeights: true,
    license: "Meta Community License",
    pricing: { input: 0.45, output: 1.35 },
    highlight: "Meta's flagship open-weights foundation model. 128-expert MoE architecture with 1M token context, powering enterprise on-premise deployments and community fine-tuning.",
    modalities: ["Text", "Vision", "Code"],
    benchmarks: {
      mmluPro: "83.6%",
      sweBench: "71.2%",
    },
    links: {
      announcement: "https://ai.meta.com/blog/llama-4/",
      weights: "https://huggingface.co/meta-llama",
    },
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
    statusBadge: "NEW AUDIO CHECKPOINT",
    category: "audio",
    categoryLabel: "Streaming Speech",
    contextWindow: "128,000 tokens",
    contextWindowTokens: 128000,
    maxOutputTokens: "16,384 tokens",
    parameters: "Streaming Audio Foundation",
    openWeights: true,
    license: "Meta Community License",
    pricing: { input: 0.1, output: 0.3 },
    highlight: "Announced Sept 1, 2026; streaming speech-to-text foundation model supporting 70+ languages, 20+ voice diarization, and multilingual code-switching.",
    modalities: ["Audio", "Text"],
    benchmarks: {},
    links: {
      announcement: "https://ai.meta.com/blog/muse-voice-transcribe/",
    },
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
  },

  // ─── GOOGLE DEEPMIND ─────────────────────────────────────────────────────
  {
    id: "gemini-3-7-flash",
    companyId: "google",
    companyName: "Google DeepMind",
    name: "Gemini 3.7 Flash",
    version: "3.7",
    releaseDate: "2026-08-13",
    isCompanyFlagship: true,
    isLatestCheckpoint: true,
    statusBadge: "AGENTIC WORKHORSE",
    category: "flagship",
    categoryLabel: "Agentic Multimodal",
    contextWindow: "1,048,576 tokens",
    contextWindowTokens: 1048576,
    maxOutputTokens: "65,536 tokens",
    parameters: "TPU v6 Optimized Flash MoE",
    openWeights: false,
    license: "Google AI Studio / Vertex AI",
    pricing: { input: 0.75, output: 3.75 },
    highlight: "Released August 13, 2026; Google's most capable model for agentic coding, multi-step tool use, and 1M token real-time multimodal reasoning.",
    modalities: ["Text", "Vision", "Audio", "Video", "Code"],
    benchmarks: {
      mmluPro: "84.9%",
      sweBench: "73.6%",
    },
    links: {
      announcement: "https://blog.google/technology/ai/gemini-3-7-flash/",
      playground: "https://aistudio.google.com",
    },
  },

  // ─── DEEPSEEK ────────────────────────────────────────────────────────────
  {
    id: "deepseek-v4-pro-0813",
    companyId: "deepseek",
    companyName: "DeepSeek",
    name: "DeepSeek V4-Pro (0813)",
    version: "V4-Pro",
    releaseDate: "2026-08-13",
    isCompanyFlagship: true,
    isLatestCheckpoint: false,
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
  },
  {
    id: "deepseek-v4-flash-vision-exp",
    companyId: "deepseek",
    companyName: "DeepSeek",
    name: "DeepSeek V4 Flash Vision Exp",
    version: "V4-Vision-Exp",
    releaseDate: "2026-08-30",
    isCompanyFlagship: false,
    isLatestCheckpoint: true,
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
  },

  // ─── XAI ─────────────────────────────────────────────────────────────────
  {
    id: "grok-4-6",
    companyId: "xai",
    companyName: "xAI",
    name: "Grok 4.6",
    version: "4.6",
    releaseDate: "2026-08-12",
    isCompanyFlagship: true,
    isLatestCheckpoint: true,
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
    pricing: { input: 1.8, output: 5.4 },
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
    maxOutputTokens: "32,768 tokens",
    parameters: "Next-Gen Qwen MoE",
    openWeights: false,
    license: "Alibaba Cloud Model Studio",
    pricing: { input: 0.15, output: 0.47 },
    highlight: "Released August 26, 2026; combines visual document understanding, fast agentic workflows, and 1M context with ultra-cheap $0.15/$0.47 pricing.",
    modalities: ["Text", "Vision", "Code"],
    benchmarks: {
      mmluPro: "81.9%",
    },
    links: {
      announcement: "https://qwenlm.github.io/blog/qwen3.8/",
      playground: "https://chat.qwenlm.ai",
    },
  },

  // ─── COHERE ──────────────────────────────────────────────────────────────
  {
    id: "cohere-command-a",
    companyId: "cohere",
    companyName: "Cohere",
    name: "Command A (111B)",
    version: "1.0",
    releaseDate: "2026-03-20",
    isCompanyFlagship: true,
    isLatestCheckpoint: false,
    statusBadge: "ENTERPRISE FLAGSHIP",
    category: "flagship",
    categoryLabel: "Enterprise RAG",
    contextWindow: "256,000 tokens",
    contextWindowTokens: 256000,
    maxOutputTokens: "16,384 tokens",
    parameters: "111B Parameters",
    openWeights: true,
    license: "CC-BY-NC 4.0 / Cohere API",
    pricing: { input: 1.25, output: 5.0 },
    highlight: "Cohere's primary flagship model optimized for business agentic search, long-document question answering, and multi-step tool use.",
    modalities: ["Text", "Code"],
    benchmarks: {
      mmluPro: "77.8%",
    },
    links: {
      announcement: "https://cohere.com/blog/command-a",
      weights: "https://huggingface.co/CohereForAI",
    },
  },
  {
    id: "cohere-north-mini-code",
    companyId: "cohere",
    companyName: "Cohere",
    name: "North Mini Code",
    version: "1.0",
    releaseDate: "2026-06-17",
    isCompanyFlagship: false,
    isLatestCheckpoint: true,
    statusBadge: "FREE AGENTIC CODE",
    category: "code",
    categoryLabel: "Autonomous Coding",
    contextWindow: "256,000 tokens",
    contextWindowTokens: 256000,
    maxOutputTokens: "16,384 tokens",
    parameters: "30B MoE (North Architecture)",
    openWeights: false,
    license: "Cohere Free / Developer API",
    pricing: { input: 0.0, output: 0.0 },
    highlight: "30B MoE agentic coding model specifically tuned for multi-file workspace inspection and test suites, offered free for developers.",
    modalities: ["Text", "Code"],
    benchmarks: {
      sweBench: "64.1%",
    },
    links: {
      announcement: "https://cohere.com/blog/north-mini-code",
      apiDocs: "https://docs.cohere.com",
    },
  },

  // ─── MISTRAL AI ──────────────────────────────────────────────────────────
  {
    id: "mistral-medium-3-5",
    companyId: "mistral",
    companyName: "Mistral AI",
    name: "Mistral Medium 3.5",
    version: "3.5",
    releaseDate: "2026-04-30",
    isCompanyFlagship: true,
    isLatestCheckpoint: true,
    statusBadge: "EUROPEAN FLAGSHIP",
    category: "flagship",
    categoryLabel: "Dense Multimodal",
    contextWindow: "262,144 tokens",
    contextWindowTokens: 262144,
    maxOutputTokens: "16,384 tokens",
    parameters: "128B Dense Multimodal",
    openWeights: true,
    license: "Mistral Commercial API / Research",
    pricing: { input: 1.5, output: 7.5 },
    highlight: "Dense 128B multimodal instruction-following model with native text and image understanding, tuned for European enterprise compliance.",
    modalities: ["Text", "Vision", "Code"],
    benchmarks: {
      mmluPro: "79.2%",
    },
    links: {
      announcement: "https://mistral.ai/news/mistral-medium-3-5/",
    },
  },
]
