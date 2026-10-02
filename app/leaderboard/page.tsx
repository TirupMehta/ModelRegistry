"use client"

import { useState } from "react"
import Header from "@/components/header"
import Footer from "@/components/footer"
import TextWithBlur from "@/components/text-with-blur"
import ModelDetailsModal from "@/components/model-details-modal"
import { modelsData, ModelItem } from "@/data/models"
import { leaderboardSpotlights } from "@/data/leaderboard"
import { formatPrice } from "@/lib/utils"
import { tapFeedback } from "@/lib/feedback"
import { Code, Brain, Maximize, Coins, Layers, ArrowUpRight } from "lucide-react"

interface ComparisonCategory {
  title: string
  icon: any
  description: string
  leader: string
  models: ModelItem[]
}

export default function LeaderboardPage() {
  const [activeModalModel, setActiveModalModel] = useState<ModelItem | null>(null)

  // Freshness stamp for the intro copy: month of the newest tracked release.
  const newestMonth = [...modelsData]
    .sort((a, b) => b.releaseDate.localeCompare(a.releaseDate))[0]
    ?.releaseDate.slice(0, 7)
  const newestMonthLabel = newestMonth
    ? new Date(`${newestMonth}-02`).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : ""

  const openModel = (model: ModelItem) => {
    tapFeedback()
    setActiveModalModel(model)
  }

  const categories: ComparisonCategory[] = [
    {
      title: "Reasoning & STEM Intelligence",
      icon: Brain,
      description: "Models with adaptive test-time compute, deep chain-of-thought, and autonomous multi-turn reasoning.",
      leader: "Claude Fable 5.1 / GPT-6 Astra / Grok 4.6",
      models: modelsData.filter((m) =>
        leaderboardSpotlights.reasoning.includes(m.id)
      ),
    },
    {
      title: "Agentic Software Engineering & Coding",
      icon: Code,
      description: "Frontier performance on long-horizon code refactoring, Terminal-Bench execution, and tool orchestration.",
      leader: "Claude Fable 5.1 (Terminal-Bench 52.6% SOTA) / Gemini 3.8 Flash",
      models: modelsData.filter((m) =>
        leaderboardSpotlights.coding.includes(m.id)
      ),
    },
    {
      title: "High-Volume Value",
      icon: Layers,
      description: "Models developers actually route at massive scale on OpenRouter — proven price-performance in production, not benchmark scores.",
      leader: "DeepSeek V4 Flash 0731 (49.9T/30d) / MiMo-V2.5 (coding share #1)",
      models: modelsData.filter((m) =>
        leaderboardSpotlights.value.includes(m.id)
      ),
    },
    {
      title: "Open Weights & Self-Hosting",
      icon: Maximize,
      description: "Publicly downloadable weights under open and community licenses for enterprise sovereignty and private clusters.",
      leader: "Qwen3.8 2.4T A95B (2.4T MoE) / Llama 4 Maverick (128E MoE)",
      models: modelsData.filter((m) => m.openWeights).slice(0, 5),
    },
    {
      title: "Context Window Capacity",
      icon: Maximize,
      description: "Maximum tokens accommodated in a single inference session without losing retrieval precision or needle recall.",
      leader: "Llama 4 Scout (1.31M) / OpenAI Astra (1.05M) / Gemini 3.8 (1.048M)",
      models: [...modelsData].sort((a, b) => b.contextWindowTokens - a.contextWindowTokens).slice(0, 5),
    },
    {
      title: "Inference Cost & Value",
      icon: Coins,
      description: "Lowest input/output pricing per 1M tokens combined with near-frontier intelligence for production applications.",
      leader: "Muse Voice ($0.04/M) / Muse Spark ($0.05/M) / DeepSeek Flash ($0.12/M)",
      models: [...modelsData].filter((m) => !m.pricingUnit).sort((a, b) => a.pricing.input - b.pricing.input).slice(0, 5),
    },
  ]

  return (
    <main className="relative min-h-screen">
      <Header />

      <section className="section max-w-4xl mx-auto w-full px-4 sm:px-6 md:px-20 pb-20">
        <div className="space-y-4 text-base md:text-[17px] font-normal text-black/75 dark:text-zinc-300 leading-relaxed max-w-3xl mb-8">
          <TextWithBlur delay={120}>
            <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-black dark:text-white">
              Frontier AI Leaderboard
            </h1>
            <p>
              Domain-by-domain evaluation of which foundation models hold the state of the art{newestMonthLabel ? ` in ${newestMonthLabel}` : ""}.
            </p>
          </TextWithBlur>
        </div>

        {/* Categories Stack with Sibling Dimming */}
        <div className="flex flex-col list-hover-group space-y-6">
          {categories.map((category, index) => {
            const Icon = category.icon

            return (
              <TextWithBlur key={category.title} delay={index * 35}>
                <div className="card-lift p-4 sm:p-6 rounded-2xl border border-black/10 dark:border-white/[0.08] bg-white/[0.7] dark:bg-[#111317] shadow-sm [transition:border-color,background-color_120ms_ease-out]">
                  {/* Category Header */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded flex items-center justify-center bg-black/5 dark:bg-[#15181e] border border-black/10 dark:border-white/[0.08] text-[#ff5d2e] shrink-0">
                        <Icon size={16} />
                      </div>
                      <div>
                        <h2 className="text-base sm:text-xl font-medium text-black dark:text-white">
                          {category.title}
                        </h2>
                        <p className="text-xs sm:text-sm font-normal text-black/60 dark:text-zinc-400">
                          {category.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Leader Banner */}
                  <div className="mb-4 py-2 px-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/10 dark:border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 text-xs font-sans">
                    <span className="inline-flex items-center gap-1.5 text-[#ff5d2e] font-semibold uppercase tracking-[0.12em] text-[10px] shrink-0">
                      <span className="w-1 h-1 rounded-full bg-[#ff5d2e]" />
                      Domain SOTA
                    </span>
                    <span className="font-medium tabular-nums text-black/70 dark:text-zinc-200 text-[11px] sm:text-xs break-words sm:text-right">
                      {category.leader}
                    </span>
                  </div>

                  {/* Contenders Table */}
                  <div className="space-y-2">
                    {category.models.map((model, mIndex) => (
                      <div
                        key={model.id}
                        onClick={() => openModel(model)}
                        role="button"
                        tabIndex={0}
                        aria-label={`View details for ${model.name}`}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            openModel(model)
                          }
                        }}
                        className="group cursor-pointer p-2.5 sm:p-3 rounded-xl border border-black/5 dark:border-white/[0.06] bg-black/[0.01] dark:bg-[#0d0f13] hover:border-[#ff5d2e]/40 hover:shadow-sm hover:bg-white dark:hover:bg-white/[0.03] active:scale-[0.995] transition-all duration-150 flex items-center justify-between gap-2.5 sm:gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                          <span className="font-mono text-[11px] text-black/30 dark:text-zinc-600 w-5 shrink-0 tabular-nums transition-colors group-hover:text-[#ff5d2e]">
                            {String(mIndex + 1).padStart(2, "0")}
                          </span>
                          <span className="font-medium text-black dark:text-zinc-100 truncate group-hover:text-[#ff5d2e] dark:group-hover:text-[#ff7347] transition-colors duration-150">
                            {model.name}
                          </span>
                          <span className="text-black/40 dark:text-zinc-400 font-sans text-[11px] shrink-0 hidden sm:inline">
                            ({model.companyName})
                          </span>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3 shrink-0 font-sans">
                          <span className="text-[11px] text-black/55 dark:text-zinc-400 hidden sm:inline tabular-nums">
                            {model.contextWindow.replace(" tokens", "")}
                          </span>
                          <span className="text-[11px] px-1.5 py-0.5 rounded border border-black/5 dark:border-white/[0.08] bg-black/5 dark:bg-white/[0.04] text-black/60 dark:text-zinc-300 transition-colors group-hover:border-[#ff5d2e]/40 group-hover:text-[#ff5d2e] tabular-nums whitespace-nowrap">
                            {model.pricingUnit
                              ? formatPrice(model)
                              : model.pricing.input === 0
                                ? "Free"
                                : `$${model.pricing.input}/M`}
                          </span>
                          <ArrowUpRight size={12} className="opacity-30 group-hover:opacity-100 group-hover:translate-x-px group-hover:-translate-y-px text-black dark:text-white group-hover:text-[#ff5d2e] transition-all duration-150" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TextWithBlur>
            )
          })}
        </div>
      </section>

      {/* Model Details Modal */}
      <ModelDetailsModal
        model={activeModalModel}
        onClose={() => setActiveModalModel(null)}
      />

      <Footer />
    </main>
  )
}
