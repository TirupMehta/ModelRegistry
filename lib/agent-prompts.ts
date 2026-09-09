import { modelsData } from "../data/models"
import { companies } from "../data/companies"

export const SITE_URL = "https://modelregistry.tirup.in"
export const REPO_URL = "https://github.com/TirupMehta/ModelRegistry"

/** Bump when the prompt text changes so sync checks can detect drift. */
export const CONTRIBUTE_PROMPT_VERSION = "v1"

/** Lab ids derived live so the prompt never lists a stale set. */
function labIds(): string {
  return Object.keys(companies).join(", ")
}

/** Category buckets derived live from the dataset. */
function categories(): string {
  return Array.from(new Set(modelsData.map((m) => m.category))).join(" | ")
}

/** Modality values derived live from the dataset. */
function modalities(): string {
  const all = new Set<string>()
  modelsData.forEach((m) => m.modalities.forEach((mod) => all.add(mod)))
  return Array.from(all).join(" | ")
}

/**
 * Single source of truth for the "contribute with AI" prompt. Rendered on the
 * homepage, in /docs, and injected into README.md by scripts/sync-readme.js —
 * never copy-paste the text anywhere else.
 */
export function buildContributePrompt(): string {
  return `You are helping me contribute a new AI model to ModelRegistry (${SITE_URL}, repo: ${REPO_URL}), the open registry of frontier AI models.

Follow this workflow step by step. Ask me for any fact you cannot verify from an official source — never invent specifications, benchmarks, pricing, or dates.

1. Clone and set up:
   git clone ${REPO_URL}.git
   cd ModelRegistry
   pnpm install

2. Open data/models.ts and append ONE object to the modelsData array using this exact schema (every field required unless marked ?):

{
  id: "lab-model-name-0102",        // unique lowercase kebab-case id
  companyId: "openai",              // one of: ${labIds()}
  companyName: "OpenAI",            // lab display name
  name: "Model Display Name",
  version: "1.0",                   // lab version string
  releaseDate: "2026-09-08",        // YYYY-MM-DD, first public availability
  isCompanyFlagship: false,         // true ONLY if this is the lab's primary flagship (exactly 1 per lab — demote the previous flagship to false)
  isLatestCheckpoint: true,         // true if this is the lab's newest release
  statusBadge: "NEW DROP",          // short uppercase pill, e.g. "NEW DROP", "OPEN WEIGHTS", "EXPIRES SEPT 10"
  category: "flagship",             // one of: ${categories()}
  categoryLabel: "Human Readable Label",
  contextWindow: "1,048,576 tokens", // human string; visual models use descriptive windows like "8s clips"
  contextWindowTokens: 1048576,     // sortable number; use 0 for non-token windows
  maxOutputTokens: "65,536 tokens",
  parameters: "1.6T MoE",           // architecture; write "Undisclosed (...)" when the lab published nothing — never fabricate
  openWeights: false,
  license: "Proprietary API",       // e.g. "MIT License" for open weights
  pricing: { input: 10.0, output: 50.0 }, // USD per 1M tokens; per-second video models add pricingUnit: "per second"
  highlight: "One factual sentence: release date plus what changed.",
  modalities: ["Text", "Vision"],   // any of: ${modalities()}
  benchmarks: {},                   // lab-published scores only (sweBench, mmluPro, gpqa); {} when none published
  links: {
    announcement: "https://...",   // MANDATORY: official announcement, docs page, paper, or verified weights repo
    playground: "https://...",     // ? optional chat/API playground
    apiDocs: "https://...",        // ? optional API docs
    weights: "https://..."         // ? optional weights repo
  }
}

3. If the model is from a laboratory not yet tracked, also add it to data/companies.ts with: id, name, shortName, description, website, headquarters, accentColor, latestFlagship.

4. Run: pnpm test
   This validates the schema and auto-syncs the README table. Fix every error it reports.

5. Commit on a new branch and walk me through opening the Pull Request (use gh if authenticated).

RULES:
- Official source required for every fact. No rumors, leaks, or benchmark guesses.
- Popularity bar: top-15 OpenRouter weekly volume, a primary flagship, or a genuinely frontier capability. No obscure checkpoints or minor variants.
- Touch ONLY data/models.ts (plus data/companies.ts for a new lab). Website, API, RSS, and README update automatically.`
}

/**
 * Short prompt that teaches an agent to query the registry API.
 * Shown in /docs alongside the full reference.
 */
export const API_USE_PROMPT = `Query ModelRegistry (${SITE_URL}) — the open frontier-AI model index. Free, no auth, CORS-open, read-only (GET only).

- List & filter models: GET ${SITE_URL}/api/v1/models with optional combinable params:
  ?company=openai & ?category=video (flagship|reasoning|open-weights|code|multimodal|audio|image|video)
  & ?openWeights=true & ?flagshipOnly=true & ?latestOnly=true
  Unknown values return HTTP 200 with an empty list — never an error.
- Response shape: { status, total, updatedAt, metadata, companies[{id,name,page,latestFlagship,latestCheckpoint}], models[{id,companyId,name,releaseDate,pricing,highlight,modalities,benchmarks,links,…}] }
- Stay fresh: poll GET ${SITE_URL}/api/check-updates (at most every 5 minutes) and re-fetch /api/v1/models when trackedModelsCount changes.
- Ground truth for reasoning: ${SITE_URL}/llms-full.txt · Human reference: ${SITE_URL}/docs
- Ask the user which lab, modality, or budget matters before dumping the full list.`
