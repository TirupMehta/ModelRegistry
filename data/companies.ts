export interface Company {
  id: string
  name: string
  shortName: string
  website: string
  headquarters: string
  accentColor: string
  description: string
  latestFlagship: string
  latestReasoning?: string
  openWeightsAdvocate: boolean
}

export const companies: Record<string, Company> = {
  anthropic: {
    id: "anthropic",
    name: "Anthropic",
    shortName: "Anthropic",
    website: "https://www.anthropic.com",
    headquarters: "San Francisco, CA",
    accentColor: "#d97706",
    description: "Creator of the Claude family; pioneers of adaptive thinking, Enterprise Frontier Safeguards (EFS), and agentic knowledge work.",
    latestFlagship: "Claude Fable 5.1",
    latestReasoning: "Claude Mythos 5.1 (Restricted) / Claude Fable 5.1",
    openWeightsAdvocate: false,
  },
  openai: {
    id: "openai",
    name: "OpenAI",
    shortName: "OpenAI",
    website: "https://openai.com",
    headquarters: "San Francisco, CA",
    accentColor: "#10a37f",
    description: "Pioneered unified foundation models with GPT-5.6 (Sol, Terra, Luna) and the Astra critical-capability cybersecurity model.",
    latestFlagship: "GPT-5.6 Sol / Terra Pro",
    latestReasoning: "OpenAI Astra (Cybersecurity) / GPT-5.6 Sol",
    openWeightsAdvocate: false,
  },
  google: {
    id: "google",
    name: "Google DeepMind",
    shortName: "Google",
    website: "https://deepmind.google",
    headquarters: "London, UK / Mountain View, CA",
    accentColor: "#4285f4",
    description: "Creators of the Gemini 3 family, leading ultra-fast agentic coding, multi-step workflows, and 1M+ token real-time multimodal streaming.",
    latestFlagship: "Gemini 3.8 Flash",
    latestReasoning: "Gemini 3.8 Flash / Gemini 3.1 Pro",
    openWeightsAdvocate: true,
  },
  xai: {
    id: "xai",
    name: "xAI",
    shortName: "xAI",
    website: "https://x.ai",
    headquarters: "San Francisco, CA / Memphis, TN",
    accentColor: "#ec4899",
    description: "Elon Musk's lab powered by the Memphis Colossus supercluster, creators of Grok 4.6 with 1.5T parameters and upcoming Grok 4.7.",
    latestFlagship: "Grok 4.6",
    latestReasoning: "Grok 4.6 (Think Mode)",
    openWeightsAdvocate: true,
  },
  deepseek: {
    id: "deepseek",
    name: "DeepSeek",
    shortName: "DeepSeek",
    website: "https://www.deepseek.com",
    headquarters: "Hangzhou, China",
    accentColor: "#4f46e5",
    description: "Open-source frontier champion famous for DeepSeek-V4 massive MoE architecture (1.6T parameters) and DSpark speculative decoding.",
    latestFlagship: "DeepSeek V4-Pro (0813)",
    latestReasoning: "DeepSeek V4-Pro (Thinking Mode)",
    openWeightsAdvocate: true,
  },
  meta: {
    id: "meta",
    name: "Meta AI",
    shortName: "Meta",
    website: "https://ai.meta.com",
    headquarters: "Menlo Park, CA",
    accentColor: "#0668e1",
    description: "Global open-source foundation leader with Llama 4 (Maverick, Scout) and real-time multimodal foundation family Muse (Spark 1.3, Voice Transcribe).",
    latestFlagship: "Llama 4 Maverick (128E)",
    latestReasoning: "Muse Spark 1.3 / Llama 4 Scout",
    openWeightsAdvocate: true,
  },
  qwen: {
    id: "qwen",
    name: "Alibaba Cloud (Qwen)",
    shortName: "Qwen",
    website: "https://qwenlm.github.io",
    headquarters: "Hangzhou, China",
    accentColor: "#8b5cf6",
    description: "Massive open and proprietary foundation ecosystem, leading global charts with the Qwen3.8 series and 2.4T open MoE models.",
    latestFlagship: "Qwen3.8 Max / 2.4T A95B",
    latestReasoning: "Qwen3.8 Flash (Multimodal Reasoning)",
    openWeightsAdvocate: true,
  },
  mistral: {
    id: "mistral",
    name: "Mistral AI",
    shortName: "Mistral",
    website: "https://mistral.ai",
    headquarters: "Paris, France",
    accentColor: "#f97316",
    description: "European frontier lab building high-efficiency dense and MoE models including Mistral Medium 3.5, Mistral Small 4, and Devstral 2.",
    latestFlagship: "Mistral Medium 3.5",
    latestReasoning: "Mistral Small 4",
    openWeightsAdvocate: true,
  },
}
