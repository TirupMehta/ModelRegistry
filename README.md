# Checkpoint

> The internet's real-time source of truth for frontier AI models and research checkpoints across every major AI lab.

Checkpoint is an open, minimalist registry tracking primary foundation flagships and research checkpoints across Anthropic, OpenAI, Google DeepMind, DeepSeek, Meta AI, xAI, Alibaba Cloud (Qwen), Mistral AI, and Cohere.

Aesthetic and interaction design inspired by [tirup.in](https://tirup.in).

---

## ⚡ Features

- **Dual Hierarchy**: Clean distinction between a lab's **Primary Foundation Flagship** (e.g. Llama 4 Maverick, GPT-5.6 Sol, Claude Fable 5.1) and its **Latest Specialized Checkpoints** (e.g. Muse Voice Transcribe, OpenAI Astra).
- **Domain-by-Domain Comparison**: Direct head-to-head rankings across Reasoning, Coding, Context Window, and Value.
- **Open Telemetry**:
  - Public JSON API: `/api/v1/models`
  - RSS 2.0 Syndication Feed: `/rss.xml`
  - AI Crawler Guide: `/llms.txt`
- **Minimalist Aesthetic**:
  - GPU-composited sliding pill navigation with custom spring curves (`cubic-bezier(0.16, 1, 0.3, 1)`)
  - Sibling-dimming lists (`.list-hover-group`)
  - Circular View Transition theme toggler (Dark / Light)
  - Procedural architectural canvas lighting shader (`AmbientShader`)

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router, Server Components & Static Site Generation)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, CSS Custom Properties, Vanilla CSS
- **Icons**: Lucide React, React Icons
- **Animation**: Native GPU transitions & Canvas Shaders

---

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/TirupMehta/Checkpoint.git
cd Checkpoint

# Install dependencies
pnpm install

# Run the development server
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📡 API Usage

```bash
# Fetch all active models
curl -s https://checkpoint.dev/api/v1/models

# Fetch only primary company flagships
curl -s https://checkpoint.dev/api/v1/models?flagshipOnly=true

# Fetch only open-weight models
curl -s https://checkpoint.dev/api/v1/models?openWeights=true
```

---

## 📄 License

MIT © [Tirup Mehta](https://tirup.in)
