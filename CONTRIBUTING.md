# Contributing to ModelRegistry

Thank you for your interest in contributing to **ModelRegistry**! 

ModelRegistry is an open public catalog indexing frontier foundation models and major AI research checkpoints. We depend on community researchers, engineers, and contributors to keep the registry accurate, comprehensive, and up-to-date.

---

## 📋 Contribution Guidelines

Before submitting a pull request, please ensure your contribution adheres to these standards:

1. **Official Verification Required**: Every model addition or benchmark update must include a verifiable primary source link (official lab announcement, technical report, arXiv paper, or Hugging Face model repository). Social media claims without official verification will not be merged.
2. **Dual-Tier Model Philosophy**:
   - **Company Flagship**: A lab's reigning general-purpose foundation model (typically only 1 active flagship per company at any time).
   - **Latest Checkpoint**: Specialized models, reasoning variants, code specialists, or voice/multimodal models recently released.
3. **TypeScript & Schema Strictness**: All contributions must pass type validation (`pnpm run build`) without any compiler or linter errors.

---

## 🚀 How to Add a New Model

### 1. Fork & Clone

```bash
git clone https://github.com/<your-username>/ModelRegistry.git
cd ModelRegistry
git checkout -b feat/register-<model-id>
pnpm install
```

### 2. Add Entry to `data/models.ts`

Open [`data/models.ts`](./data/models.ts) and append your model to `modelsData`:

```typescript
{
  id: "meta-llama-4-maverick",
  companyId: "meta",
  companyName: "Meta AI",
  name: "Llama 4 Maverick",
  version: "4.0",
  releaseDate: "2026-07-23",
  isCompanyFlagship: true,      // Set to true if this is the lab's primary frontier LLM
  isLatestCheckpoint: false,    // Set to true if this is the newest release from this lab
  statusBadge: "FLAGSHIP",       // E.g. "FLAGSHIP", "NEW DROP", "OPEN WEIGHTS"
  category: "flagship",         // "flagship" | "agentic" | "reasoning" | "voice" | "code" | "multimodal"
  categoryLabel: "Frontier Foundation",
  contextWindow: "1,000,000 tokens",
  contextWindowTokens: 1000000,
  maxOutputTokens: "32,768 tokens",
  parameters: "1.2T parameters (MoE 48x25B)",
  openWeights: true,
  license: "Llama 4 Community License",
  pricing: {
    input: 0,
    output: 0,
  },
  highlight: "Meta's trillion-parameter mixture-of-experts open flagship featuring native multimodal reasoning.",
  modalities: ["Text", "Code", "Vision"],
  benchmarks: {
    sweBench: "72.4%",
    aime2024: "84.2%",
    mmluPro: "86.1%",
    gpqa: "68.5%",
  },
  links: {
    announcement: "https://ai.meta.com/blog/llama-4-maverick",
    playground: "https://llama.meta.com",
    weights: "https://huggingface.co/meta-llama/Llama-4-Maverick",
  },
}
```

> **Note**: If `isCompanyFlagship` is set to `true`, ensure that any previous flagship for that `companyId` has its `isCompanyFlagship` updated to `false`.

---

## 🏢 Adding a New Laboratory

If the model belongs to a company or AI research lab not yet listed in the registry:

Open [`data/companies.ts`](./data/companies.ts) and add the laboratory definition:

```typescript
"lab-id": {
  id: "lab-id",
  name: "Laboratory Name",
  description: "Brief 1-2 sentence description of the lab's primary research focus.",
  website: "https://example.com",
  headquarters: "City, Country",
  accentColor: "#hexColor", // Brand color used for badges and timeline dots
}
```

---

## 🧪 Testing Your Changes

Before submitting your pull request, verify that the project builds cleanly:

```bash
# Verify type correctness and build output
pnpm run build

# Start local server to preview your changes
pnpm run dev
```

Visit `http://localhost:3000` to inspect:
- The Overview list row and modal card.
- The `/companies` laboratory breakdown.
- The `/timeline` chronological drop log.
- The `/api/v1/models` JSON API output.

---

## 📦 Pull Request Guidelines

1. **Title format**: `feat: register [Model Name] ([Lab])` or `fix: update [Model Name] benchmarks`.
2. **Description**:
   - Summary of model or changes.
   - Primary source URL (announcement, tech report, or paper).
3. Ensure CI checks pass.

Thank you for contributing to an open, transparent AI model index!
