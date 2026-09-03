"use client"

import { useState } from "react"
import Header from "@/components/header"
import TextWithBlur from "@/components/text-with-blur"
import ModelDetailsModal from "@/components/model-details-modal"
import { modelsData, ModelItem } from "@/data/models"
import { Code, Brain, Maximize, Coins, ShieldAlert, ArrowUpRight } from "lucide-react"

interface ComparisonCategory {
  title: string
  icon: any
  description: string
  leader: string
  models: ModelItem[]
}

export default function LeaderboardPage() {
  const currentYear = new Date().getFullYear()
  const [activeModalModel, setActiveModalModel] = useState<ModelItem | null>(null)

  const categories: ComparisonCategory[] = [
    {
      title: "Reasoning & STEM Intelligence",
      icon: Brain,
      description: "Models with adaptive test-time compute, deep chain-of-thought, and autonomous multi-turn reasoning.",
      leader: "Claude Fable 5.1 / OpenAI Astra / Grok 4.6",
      models: modelsData.filter((m) =>
        ["claude-fable-5-1", "openai-astra", "grok-4-6", "gpt-5-6-sol"].includes(m.id)
      ),
    },
    {
      title: "Agentic Software Engineering & Coding",
      icon: Code,
      description: "Frontier performance on long-horizon code refactoring, Terminal-Bench execution, and tool orchestration.",
      leader: "Claude Fable 5.1 (Terminal-Bench 52.6% SOTA) / Gemini 3.8 Flash",
      models: modelsData.filter((m) =>
        ["claude-fable-5-1", "gemini-3-8-flash", "grok-4-6", "gpt-5-6-sol"].includes(m.id)
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
      leader: "Muse Voice ($0.10/M) / DeepSeek Flash ($0.12/M) / Qwen3.8 Flash ($0.15/M)",
      models: [...modelsData].sort((a, b) => a.pricing.input - b.pricing.input).slice(0, 5),
    },
  ]

  return (
    <main className="relative min-h-screen">
      <Header />

      <section className="section max-w-4xl mx-auto w-full px-4 sm:px-6 md:px-20 pb-20">
        <div className="space-y-4 text-base md:text-[17px] font-light text-black/75 dark:text-zinc-300 leading-relaxed max-w-3xl mb-8">
          <TextWithBlur delay={120}>
            <p>
              Domain-by-domain evaluation of which foundation models hold the state of the art in September 2026.
            </p>
          </TextWithBlur>
        </div>

        {/* Categories Stack with Sibling Dimming */}
        <div className="flex flex-col list-hover-group space-y-6">
          {categories.map((category, index) => {
            const Icon = category.icon

            return (
              <TextWithBlur key={category.title} delay={index * 35}>
                <div className="p-4 sm:p-6 rounded-lg border border-black/10 dark:border-white/[0.08] bg-black/[0.015] dark:bg-[#111317] [transition:all_120ms_ease-out]">
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
                        <p className="text-xs sm:text-sm font-light text-black/60 dark:text-zinc-400">
                          {category.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Leader Banner */}
                  <div className="mb-4 py-2 px-3 rounded bg-[#ff5d2e]/5 dark:bg-[#ff5d2e]/10 border border-[#ff5d2e]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 text-xs font-mono">
                    <span className="text-[#ff5d2e] font-medium uppercase tracking-wider text-[10px] shrink-0">
                      DOMAIN SOTA
                    </span>
                    <span className="font-medium text-black dark:text-zinc-100 text-[11px] sm:text-xs break-words">
                      {category.leader}
                    </span>
                  </div>

                  {/* Contenders Table */}
                  <div className="space-y-2">
                    {category.models.map((model, mIndex) => (
                      <div
                        key={model.id}
                        onClick={() => setActiveModalModel(model)}
                        className="group cursor-pointer p-2.5 sm:p-3 rounded-md border border-black/5 dark:border-white/[0.06] bg-black/[0.01] dark:bg-[#0d0f13] hover:border-[#ff5d2e]/40 transition-colors duration-150 flex items-center justify-between gap-2.5 sm:gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                          <span className="font-mono text-black/35 dark:text-zinc-500 w-5 shrink-0 tabular-nums transition-colors group-hover:text-[#ff5d2e]">
                            {String(mIndex + 1).padStart(2, "0")}
                          </span>
                          <span className="font-medium text-black dark:text-zinc-100 truncate group-hover:text-[#ff5d2e] dark:group-hover:text-[#ff7347] transition-colors duration-150">
                            {model.name}
                          </span>
                          <span className="text-black/40 dark:text-zinc-400 font-mono text-[11px] shrink-0 hidden sm:inline">
                            ({model.companyName})
                          </span>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3 shrink-0 font-mono">
                          <span className="text-[11px] text-black/55 dark:text-zinc-400 hidden sm:inline">
                            {model.contextWindow.replace(" tokens", "")}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded border border-black/5 dark:border-white/[0.08] bg-black/5 dark:bg-white/[0.04] text-black/60 dark:text-zinc-300 transition-colors group-hover:border-[#ff5d2e]/40 group-hover:text-[#ff5d2e]">
                            {model.pricing.input === 0 ? "Free" : `$${model.pricing.input}/M`}
                          </span>
                          <ArrowUpRight size={12} className="opacity-30 group-hover:opacity-100 text-black dark:text-white group-hover:text-[#ff5d2e] transition-colors duration-150" />
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

      {/* Footer */}
      <footer className="py-6 px-6 text-center border-t border-black/10 dark:border-white/[0.08] max-w-4xl mx-auto w-full">
        <p className="text-[11px] font-mono text-black/50 dark:text-zinc-400">
          © {currentYear} ModelRegistry. The open technical index for frontier AI systems.
        </p>
      </footer>
    </main>
  )
}
