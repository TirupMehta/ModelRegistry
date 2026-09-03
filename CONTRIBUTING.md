# Contributing to ModelRegistry

Contributing takes less than 60 seconds. You only need to touch **one file**: [`data/models.ts`](./data/models.ts). 

Our automated pipeline handles everything else — the website, REST API, RSS feed, and README table sync automatically.

---

## ⚡ 3-Step Quickstart

### 1. Clone the repo
```bash
git clone https://github.com/TirupMehta/ModelRegistry.git
cd ModelRegistry
pnpm install
```

### 2. Add your model to [`data/models.ts`](./data/models.ts)
Open `data/models.ts` and add your model to the `modelsData` array:

```typescript
{
  id: "meta-muse-spark-1-3",           // Unique lowercase kebab-case ID
  companyId: "meta",                   // openai | anthropic | google | xai | deepseek | meta | qwen | mistral
  companyName: "Meta AI",
  name: "Muse Spark 1.3",
  version: "1.3",
  releaseDate: "2026-09-03",           // YYYY-MM-DD
  isCompanyFlagship: true,             // true = lab's primary flagship, false = specialized checkpoint
  isLatestCheckpoint: false,           // true if it is the lab's newest secondary release
  statusBadge: "LATEST SOTA",          // Short pill badge: "FLAGSHIP", "NEW DROP", "OPEN WEIGHTS"
  category: "flagship",                // "flagship" | "agentic" | "reasoning" | "voice" | "code" | "multimodal"
  categoryLabel: "Frontier Multimodal",
  contextWindow: "262k tokens",
  contextWindowTokens: 262144,
  maxOutputTokens: "16,384 tokens",
  parameters: "14B parameters",
  openWeights: true,                   // true if weights are downloadable, false if proprietary
  license: "Meta Community License",
  pricing: {
    input: 0.05,                       // Official hosted API price per 1M input tokens (USD)
    output: 0.15,                      // Official hosted API price per 1M output tokens (USD)
  },
  highlight: "Sub-80ms real-time audio-visual foundation model for live voice & vision reasoning.",
  modalities: ["Text", "Vision", "Audio"],
  links: {
    announcement: "https://ai.meta.com/blog/...", // Official announcement / paper (MANDATORY)
    playground: "https://...",                    // Optional API playground or chat URL
    weights: "https://huggingface.co/...",       // Optional Hugging Face weights URL
  },
}
```

> **💡 The Flagship Rule**: Each company has exactly **1 active flagship** (`isCompanyFlagship: true`). If your new model is the lab's primary flagship, set `isCompanyFlagship: true` on it and set `isCompanyFlagship: false` on the lab's previous flagship.

### 3. Validate & Submit
```bash
pnpm test
```
*`pnpm test` automatically verifies the data schema and **auto-syncs the README table**.*

Once it passes, commit and open a Pull Request! 🎉

---

## 🏢 Adding a New AI Lab (Optional)
If the model is from a laboratory not yet tracked, add it to [`data/companies.ts`](./data/companies.ts):

```typescript
"laboratory-id": {
  id: "laboratory-id",
  name: "Laboratory Name",
  description: "Brief 1-line overview of the lab.",
  website: "https://...",
  headquarters: "San Francisco, CA",
  accentColor: "#ff5d2e",
}
```

---

## 📋 Quality Standards
- **Official Source Required**: Every model must link to an official announcement, technical report, arXiv paper, or verified Hugging Face repository. No rumors or social leaks.
- **Accurate API Pricing**: For open-weights models, provide the lab's official hosted API rate per 1M tokens.
