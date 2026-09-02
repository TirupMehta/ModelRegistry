# ModelRegistry

> **The Open Public Registry for Frontier AI Models & Research Checkpoints**

[![GitHub Stars](https://img.shields.io/github/stars/TirupMehta/ModelRegistry?style=flat&color=7c88e8)](https://github.com/TirupMehta/ModelRegistry)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![RSS Feed](https://img.shields.io/badge/RSS-Feed-orange.svg)](https://modelregistry.tirup.in/rss.xml)
[![REST API](https://img.shields.io/badge/REST-API-emerald.svg)](https://modelregistry.tirup.in/api/v1/models)

**ModelRegistry** is a community-driven, machine-readable index tracking the state of foundational artificial intelligence. Rather than letting outdated models clutter developer workflows or burying flagship LLMs under niche audio drops, ModelRegistry maintains a clear dual-tier structure:

1. **Primary Foundation Flagships**: The reigning general-purpose models developers actually use in production (e.g. Meta Llama 4 Maverick, OpenAI GPT-5.6 Sol, Anthropic Claude Fable 5.1, Google Gemini 3.7 Flash, DeepSeek V4-Pro).
2. **Latest Specialized Checkpoints**: Newly dropped breakthroughs (e.g. Meta Muse Voice Transcribe, OpenAI Astra).

Hosted at **[modelregistry.tirup.in](https://modelregistry.tirup.in)**.

---

## ⚡ Highlights

- **Dual-Tier Model Organization**: Immediate distinction between heavyweight general foundation models and newly trained checkpoints.
- **SOTA Domain Leaderboard**: Head-to-head verified evaluations across Reasoning, Agentic Coding, Context Capacity, and Inference Value.
- **Open Telemetry & Syndication**:
  - `GET /api/v1/models` — Public JSON REST API with filtering parameters.
  - `GET /rss.xml` — Live RSS 2.0 syndication feed for newly registered models.
  - `GET /llms.txt` — Machine-readable ground truth formatted for AI answer engines and web crawlers.

---

## 💻 Terminal CLI Dashboard

Query the registry directly from your terminal without installing anything:

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
[![Google Flagship](https://modelregistry.tirup.in/api/badge/google)](https://modelregistry.tirup.in)
[![DeepSeek Flagship](https://modelregistry.tirup.in/api/badge/deepseek)](https://modelregistry.tirup.in)
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

We welcome community contributions. See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for full instructions on how to submit a new model entry or update benchmark metrics.

```bash
# Verify schema & build before submitting PR
pnpm install
pnpm run build
```

---

## 🛠️ Local Development

```bash
# Clone the repository
git clone https://github.com/TirupMehta/ModelRegistry.git
cd ModelRegistry

# Install dependencies
pnpm install

# Start development server
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📄 License

MIT © [Tirup Mehta](https://tirup.in) & [ModelRegistry Contributors](https://github.com/TirupMehta/ModelRegistry/graphs/contributors). See [`LICENSE`](./LICENSE) for details.
