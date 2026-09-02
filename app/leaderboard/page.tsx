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
      leader: "Claude Fable 5.1 (Terminal-Bench 52.6% SOTA) / Gemini 3.7 Flash",
      models: modelsData.filter((m) =>
        ["claude-fable-5-1", "gemini-3-7-flash", "grok-4-6", "cohere-north-mini-code"].includes(m.id)
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
      leader: "Llama 4 Scout (1.31M) / OpenAI Astra (1.05M) / Gemini 3.7 (1.048M)",
      models: [...modelsData].sort((a, b) => b.contextWindowTokens - a.contextWindowTokens).slice(0, 5),
    },
    {
      title: "Inference Cost & Value",
      icon: Coins,
      description: "Lowest input/output pricing per 1M tokens combined with near-frontier intelligence for production applications.",
      leader: "North Mini Code (Free) / Muse Voice ($0.10/M) / Qwen3.8 Flash ($0.15/M)",
      models: [...modelsData].sort((a, b) => a.pricing.input - b.pricing.input).slice(0, 5),
    },
  ]

  return (
    <main className="relative min-h-screen">
      <Header />

      <section className="section max-w-4xl mx-auto w-full px-6 md:px-20 pb-20">
        <div className="space-y-4 text-base md:text-lg font-light text-black/70 dark:text-white/70 leading-relaxed max-w-3xl mb-10">
          <TextWithBlur delay={120}>
            <p>
              Domain-by-domain evaluation of which foundation models hold the state of the art in September 2026.
            </p>
          </TextWithBlur>
        </div>

        {/* Categories Stack with Sibling Dimming */}
        <div className="flex flex-col list-hover-group space-y-8">
          {categories.map((category, index) => {
            const Icon = category.icon

            return (
              <TextWithBlur key={category.title} delay={index * 35}>
                <div className="p-5 sm:p-6 rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.015] dark:bg-white/[0.02] [transition:all_140ms_ease-out]">
                  {/* Category Header */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-accent shrink-0">
                        <Icon size={16} />
                      </div>
                      <div>
                        <h2 className="text-lg sm:text-xl font-medium text-black dark:text-white">
                          {category.title}
                        </h2>
                        <p className="text-xs sm:text-sm font-light text-black/60 dark:text-white/60">
                          {category.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Leader Banner */}
                  <div className="mb-4 py-2 px-3 rounded-lg bg-accent/5 dark:bg-accent/10 border border-accent/15 flex items-center justify-between text-xs">
                    <span className="font-mono text-accent font-medium uppercase tracking-wider text-[11px]">
                      Domain Leader
                    </span>
                    <span className="font-medium text-black dark:text-white truncate ml-2">
                      {category.leader}
                    </span>
                  </div>

                  {/* Contenders Table */}
                  <div className="space-y-2">
                    {category.models.map((model, mIndex) => (
                      <div
                        key={model.id}
                        onClick={() => setActiveModalModel(model)}
                        className="cursor-pointer p-3 rounded-xl border border-black/5 dark:border-white/5 bg-black/[0.01] dark:bg-white/[0.02] hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center justify-between gap-3 text-xs active:scale-[0.99]"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="font-mono text-black/35 dark:text-white/35 w-4 shrink-0">
                            #{mIndex + 1}
                          </span>
                          <span className="font-medium text-black dark:text-white truncate">
                            {model.name}
                          </span>
                          <span className="text-black/40 dark:text-white/40 font-mono text-[11px] shrink-0">
                            ({model.companyName})
                          </span>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-mono text-[11px] text-black/55 dark:text-white/55">
                            {model.contextWindow.replace(" tokens", "")}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60 border border-black/5 dark:border-white/5">
                            {model.pricing.input === 0 ? "Free" : `$${model.pricing.input}/M`}
                          </span>
                          <ArrowUpRight size={13} className="opacity-40 group-hover:opacity-100 text-black dark:text-white" />
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
      <footer className="py-6 px-6 text-center border-t border-black/10 dark:border-white/10 max-w-4xl mx-auto w-full">
        <p className="text-xs font-light text-black/50 dark:text-white/50">
          © {currentYear} ModelRegistry. The open public registry for frontier AI models.
        </p>
      </footer>
    </main>
  )
}
