# Contributing to ModelRegistry

> **Shortcut:** copy the agent prompt from the homepage **Contribute with AI** card, the **Agent prompts** section in the [API docs](https://modelregistry.tirup.in/docs), or the [README](./README.md#contributing-with-ai) — paste it into Claude, Cursor, Codex, or Copilot and it will walk you through every step below.

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
  companyId: "meta",                   // one of: anthropic, openai, google, xai, deepseek, meta, qwen, mistral, tencent, z-ai, minimax, nvidia, xiaomi, moonshotai, kuaishou, runway
  companyName: "Meta AI",
  name: "Muse Spark 1.3",
  version: "1.3",
  releaseDate: "2026-09-03",           // YYYY-MM-DD
  isCompanyFlagship: true,             // true = lab's primary flagship, false = specialized checkpoint
  isLatestCheckpoint: false,           // true if it is the lab's newest secondary release
  statusBadge: "LATEST SOTA",          // Short pill badge: "FLAGSHIP", "NEW DROP", "OPEN WEIGHTS"
  category: "flagship",                // "flagship" | "reasoning" | "open-weights" | "code" | "multimodal" | "audio" | "image" | "video"
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
    announcement: "https://ai.meta.com/blog/...", // Official announcement / paper (MANDATORY, must be live)
    playground: "https://...",                    // Optional API playground or chat URL
    weights: "https://huggingface.co/...",       // Optional Hugging Face weights URL
  },
  // Provenance is mandatory — the validator rejects records without it:
  sources: [{                                     // >= 1 live official source (see links above)
    url: "https://ai.meta.com/blog/...",
    publisher: "Meta",
    title: "Muse Spark 1.3 announcement",
    accessedAt: "2026-10-07",                    // date you confirmed the URL loads
    sourceType: "announcement",                  // announcement | api-docs | pricing | model-card | paper | weights | benchmark | console
    live: true,
  }],
  fieldSources: {                                // per-field citations (cite only pages you read)
    releaseDate: [{ url: "https://ai.meta.com/blog/...", publisher: "Meta", title: "Muse Spark 1.3 announcement", accessedAt: "2026-10-07", sourceType: "announcement", live: true }],
    pricing: [{ url: "https://...", publisher: "Meta", title: "Model API pricing", accessedAt: "2026-10-07", sourceType: "pricing", live: true }],
  },
  lastVerifiedAt: "2026-10-07",                  // date of your source check
  verificationStatus: "partially_verified",      // verified ONLY if you read every core field against live sources
  changeLog: [{ date: "2026-09-03", summary: "Initial registry entry.", sources: ["https://ai.meta.com/blog/..."] }],
}
```

> **📎 The Provenance Rule (STRICT)**: every record must cite live official sources (`sources`), carry per-field citations for the facts you personally confirmed (`fieldSources`), a `lastVerifiedAt` date, a `verificationStatus`, and a `changeLog`. Never cite a page you did not open. Never mark `verified` unless every core field (release date, context, output limit, parameters, license, pricing, modalities, benchmarks, flagship/latest status) was read against a live primary source. Dead links are never cited — find the canonical URL or leave the record `unverified`. Figures without a citable source are omitted or explicitly marked, never guessed. Full definitions: [/methodology](https://modelregistry.tirup.in/methodology).

> **💡 The Flagship Rule**: Each company has exactly **1 active flagship** (`isCompanyFlagship: true`). If your new model is the lab's primary flagship, set `isCompanyFlagship: true` on it and set `isCompanyFlagship: false` on the lab's previous flagship.

> **🚧 The Popularity Bar**: This registry is curated, not exhaustive. A model belongs here only if it meets at least one: top-15 OpenRouter weekly volume, primary flagship of a major lab, or a genuinely frontier capability (SOTA benchmark, new modality). Obscure checkpoints and minor variants will be rejected — they turn the index into slop. When in doubt, merge variants into one family entry instead of adding new ones.

> **🔄 The Freshness Sweep (STRICT — never skip)**: The registry must never contradict itself. Every new entry must:
> 1. Keep exactly **one** `isCompanyFlagship: true` per lab — demote the previous flagship.
> 2. Scrub stale superlatives (`#1`, `NEWEST`, `SOTA`, `best`, `latest`, `reigning`, `most advanced`, `newly`) off every entry the newcomer dethrones — same lab first, plus any cross-lab record it takes. A record belongs only to its verified current holder.
> 3. Update `data/companies.ts` (`latestFlagship` / `latestReasoning` / `description`) and `data/leaderboard.ts` spotlights when they changed.
> 4. Keep every `highlight` to 1–2 tight lines; trim any older highlight that grew into a paragraph.
>
> A submission that adds a model without updating what it replaced will be rejected.

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

A public profile page (`/companies/laboratory-id`) with the lab's full release history, SEO metadata, and sitemap entry is generated automatically — no extra files needed.

---

## 📋 Quality Standards
- **Official Source Required**: Every model must link to an official announcement, technical report, arXiv paper, or verified Hugging Face repository. No rumors or social leaks. Links must load — dead URLs are never cited.
- **No guessing**: values the source does not state are omitted or marked, never inferred. Benchmark figures are lab-reported; do not present them as independently measured.
- **Accurate API Pricing**: For open-weights models, provide the lab's official hosted API rate per 1M tokens. Audio/per-second billed models use `pricingUnit: "per second"` with the provider's headline rate — never token-price equivalents you computed.
- **Fresh labels only**: flagship/latest designations require sources checked within the last 90 days; the validator enforces this automatically.
