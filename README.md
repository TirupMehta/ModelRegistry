# ModelRegistry

> **The Open Public Registry for Frontier AI Models & Research Checkpoints**

[![GitHub Stars](https://img.shields.io/github/stars/TirupMehta/Checkpoint?style=flat&color=7c88e8)](https://github.com/TirupMehta/Checkpoint)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![RSS Feed](https://img.shields.io/badge/RSS-Feed-orange.svg)](https://modelregistry.tirup.in/rss.xml)
[![REST API](https://img.shields.io/badge/REST-API-emerald.svg)](https://modelregistry.tirup.in/api/v1/models)

**ModelRegistry** is a community-driven, machine-readable index tracking the state of foundational artificial intelligence. Rather than letting outdated models clutter developer workflows or burying flagship LLMs under niche audio drops, ModelRegistry maintains a clear dual-tier structure:
1. **Primary Foundation Flagships**: The reigning general-purpose models developers actually use (e.g. Meta Llama 4 Maverick, OpenAI GPT-5.6 Sol, Anthropic Claude Fable 5.1, Google Gemini 3.7 Flash, DeepSeek V4-Pro).
2. **Latest Specialized Checkpoints**: Newly dropped breakthroughs (e.g. Meta Muse Voice Transcribe, OpenAI Astra).

Visual craft and interaction design inspired by [tirup.in](https://tirup.in). Hosted at **[modelregistry.tirup.in](https://modelregistry.tirup.in)**.

---

## ⚡ Highlights

- **Dual-Tier Model Organization**: Immediate visual clarity between heavyweight general LLMs and specialized domain releases.
- **SOTA Domain Leaderboard**: Head-to-head evaluations across Reasoning, Agentic Coding, Context Capacity, and Inference Value.
- **Open Telemetry & Syndication**:
  - `GET /api/v1/models` — Public JSON REST API with filtering parameters.
  - `GET /rss.xml` — Live RSS 2.0 syndication feed for newly registered models.
  - `GET /llms.txt` — Machine-readable ground truth specifically formatted for AI answer engines and web crawlers.
- **Minimalist Aesthetic**:
  - GPU-composited sliding pill navigation (`160ms cubic-bezier(0.16, 1, 0.3, 1)`)
  - Sibling-dimming list hover group (`.list-hover-group`)
  - Circular View Transition dark/light theme toggler
  - Procedural canvas architectural lighting shader

---

## 💻 Terminal CLI Dashboard

Run directly from any terminal without installing anything:

```bash
curl -s https://modelregistry.tirup.in
```

---

## 🏷️ Embeddable GitHub Badges

Embed real-time frontier flagship badges directly in your GitHub READMEs:

```markdown
[![OpenAI Flagship](https://modelregistry.tirup.in/api/badge/openai)](https://modelregistry.tirup.in)
[![Anthropic Flagship](https://modelregistry.tirup.in/api/badge/anthropic)](https://modelregistry.tirup.in)
[![Meta AI Flagship](https://modelregistry.tirup.in/api/badge/meta)](https://modelregistry.tirup.in)
```

---

## 📡 Public API

ModelRegistry provides free, unauthenticated REST endpoints for bots, CLI tools, and agent workflows:

```bash
# Fetch all registered models
curl -s https://modelregistry.tirup.in/api/v1/models

# Fetch only primary company flagships
curl -s "https://modelregistry.tirup.in/api/v1/models?flagshipOnly=true"

# Fetch only open-weight community models
curl -s "https://modelregistry.tirup.in/api/v1/models?openWeights=true"

# Filter by laboratory
curl -s "https://modelregistry.tirup.in/api/v1/models?company=anthropic"
```

---

## 🤝 Contributing

We welcome community contributions! When an AI laboratory announces or ships a new frontier model, you can submit a pull request to register it.

### How to Add a New Model:
1. Fork this repository.
2. Open [`data/models.ts`](./data/models.ts).
3. Add the model schema entry:
   ```typescript
   {
     id: "lab-model-name",
     companyId: "openai",
     companyName: "OpenAI",
     name: "Model Name",
     version: "1.0",
     releaseDate: "YYYY-MM-DD",
     isCompanyFlagship: true,      // true if it replaces the lab's primary LLM
     isLatestCheckpoint: true,     // true if it's the newest drop
     statusBadge: "FLAGSHIP",
     category: "flagship",
     categoryLabel: "Frontier Foundation",
     contextWindow: "1,000,000 tokens",
     contextWindowTokens: 1000000,
     maxOutputTokens: "65,536 tokens",
     parameters: "MoE Architecture",
     openWeights: false,
     license: "Proprietary API",
     pricing: { input: 3.0, output: 12.0 },
     highlight: "Clear 1-sentence technical description.",
     modalities: ["Text", "Vision", "Code"],
     benchmarks: {
       mmluPro: "86.4%",
       sweBench: "76.8%",
     },
     links: {
       announcement: "https://...",
       playground: "https://...",
     },
   }
   ```
4. Run tests: `pnpm run build`
5. Open a Pull Request: `feat: register [Model Name] ([Lab])`

---

## 🛠️ Local Development

```bash
# Clone the repository
git clone https://github.com/TirupMehta/Checkpoint.git
cd Checkpoint

# Install dependencies
pnpm install

# Start development server
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📄 License

MIT © [Tirup Mehta](https://tirup.in)
