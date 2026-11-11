"use client"

import { useState } from "react"
import TextWithBlur from "@/components/text-with-blur"
import ModelDetailsModal from "@/components/model-details-modal"
import { modelsData, ModelItem } from "@/data/models"
import { leaderboardSpotlights, leaderboardMethodology } from "@/data/leaderboard"
import { datasetRevision } from "@/data/revision"
import { folioFor } from "@/lib/registry"
import { isCurrent } from "@/lib/currency"
import Link from "next/link"
import { formatDate, formatPrice } from "@/lib/utils"
import { tapFeedback } from "@/lib/feedback"
import { Code, Brain, Maximize, Coins, Layers, ArrowUpRight } from "lucide-react"
import ModelFilterControls from "@/components/model-filter-controls"
import { DEFAULT_MODEL_FILTERS, filterModels, type ModelFilters } from "@/lib/model-filters"

interface ComparisonCategory {
  title: string
  icon: any
  description: string
  models: ModelItem[]
  // Only metric-sorted sections get ordinal positions.
  ordered: boolean
  // Key into leaderboardMethodology for editorial comparison sets.
  methodKey?: "reasoning" | "coding" | "value"
}

export default function LeaderboardClient() {
  const [activeModalModel, setActiveModalModel] = useState<ModelItem | null>(null)
  const [filters, setFilters] = useState<ModelFilters>(DEFAULT_MODEL_FILTERS)
  const modalFolio = folioFor(activeModalModel, modelsData)

  const datasetRevisedLabel = formatDate(datasetRevision.revisedAt)

  const openModel = (model: ModelItem) => {
    tapFeedback()
    setActiveModalModel(model)
  }

  const categories: ComparisonCategory[] = [
    {
      title: "Reasoning & STEM Intelligence",
      icon: Brain,
      description: "The highest independent Intelligence Index scores among current models.",
      ordered: false,
      methodKey: "reasoning",
      models: modelsData.filter((m) =>
        leaderboardSpotlights.reasoning.includes(m.id)
      ),
    },
    {
      title: "Agentic Software Engineering & Coding",
      icon: Code,
      description: "The highest independent FrontierCode 2.0 scores among current models.",
      ordered: false,
      methodKey: "coding",
      models: modelsData.filter((m) =>
        leaderboardSpotlights.coding.includes(m.id)
      ),
    },
    {
      title: "Best Score Per Dollar",
      icon: Layers,
      description: "Current models on the cost frontier: nothing scores higher for less.",
      ordered: false,
      methodKey: "value",
      models: modelsData.filter((m) =>
        leaderboardSpotlights.value.includes(m.id)
      ),
    },
    {
      title: "Open Weights & Self-Hosting",
      icon: Maximize,
      description: "Models with published downloadable weights. License terms and hosting requirements vary by model.",
      ordered: false,
      models: modelsData.filter((m) => m.openWeights && isCurrent(m)).slice(0, 5),
    },
    {
      title: "Context Window Capacity",
      icon: Maximize,
      description: "Largest stated context limits in this dataset. A larger limit does not guarantee accurate recall across the full context.",
      ordered: true,
      models: [...modelsData].filter(isCurrent).sort((a, b) => b.contextWindowTokens - a.contextWindowTokens).slice(0, 5),
    },
    {
      title: "Inference Cost & Value",
      icon: Coins,
      description: "Lowest listed input prices per 1M tokens among token-priced models. Output, caching, and provider fees affect total cost.",
      ordered: true,
      models: [...modelsData].filter((m) => !m.pricingUnit && isCurrent(m)).sort((a, b) => a.pricing.input - b.pricing.input).slice(0, 5),
    },
  ]

  return (
    <>

      <section className="section max-w-4xl mx-auto w-full px-4 sm:px-6 md:px-20 pb-20">
        <div className="space-y-4 text-base md:text-[17px] font-normal text-black/75 dark:text-zinc-300 leading-relaxed max-w-3xl mb-8">
          <TextWithBlur delay={120}>
            <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-black dark:text-white">
              Frontier AI Leaderboard
            </h1>
            <p>
              Editorial snapshots comparing foundation models domain by domain
              {datasetRevisedLabel ? `, using the dataset revised ${datasetRevisedLabel}` : ""}. Leaders hold the
              highest <em>published</em> score in each comparison - not a universal “best model”
              title. <Link href="/methodology" className="text-accent-ink hover:underline underline-offset-2">Methodology</Link>
            </p>
          </TextWithBlur>
        </div>

        <ModelFilterControls
          filters={filters}
          onChange={setFilters}
          alwaysOpen
          className="relative z-10 mb-6 h-[392px] w-full min-[390px]:h-[366px] sm:h-[292px] md:h-[276px]"
        />
        {/* Categories Stack with Sibling Dimming */}
        <div className="flex flex-col list-hover-group space-y-6">
          {categories.map((category, index) => {
            const Icon = category.icon
            // Each category has a metric-defined rank; shared filters must not
            // replace that order with a global sort unrelated to its heading.
            const visibleModels = filterModels(category.models, filters, true)
            const anchorId = category.title
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/(^-|-$)/g, "")

            return (
              <TextWithBlur key={category.title} delay={index * 35}>
                <div
                  id={anchorId}
                  className="card-lift scroll-mt-24 p-4 sm:p-6 rounded-2xl border border-black/10 dark:border-white/[0.08] bg-white/[0.7] dark:bg-[var(--surface-raised)] shadow-sm [transition:border-color,background-color_120ms_ease-out]"
                >
                  {/* Category Header */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded flex items-center justify-center bg-black/5 dark:bg-[var(--surface-hover)] border border-black/10 dark:border-white/[0.08] text-accent-ink shrink-0">
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

                  {/* Model set; ordinals appear only where rows use a stated metric sort. */}
                  <div className="space-y-2">
                    {visibleModels.map((model, mIndex) => (
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
                        className="group cursor-pointer p-2.5 sm:p-3 rounded-xl border border-black/5 dark:border-white/[0.06] bg-black/[0.01] dark:bg-[var(--surface-field)] hover:border-accent/40 hover:shadow-sm hover:bg-white dark:hover:bg-white/[0.03] active:scale-[0.995] transition-[color,background-color,border-color,opacity,transform,box-shadow] duration-150 flex items-center justify-between gap-2.5 sm:gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                          {category.ordered ? (
                            <span className="font-mono text-[11px] text-black/30 dark:text-zinc-600 w-5 shrink-0 tabular-nums transition-colors group-hover:text-accent-ink">
                              {String(mIndex + 1).padStart(2, "0")}
                            </span>
                          ) : (
                            <span className="w-1 h-1 rounded-full bg-black/25 dark:bg-white/25 shrink-0" aria-hidden="true" />
                          )}
                          <span className="font-medium text-black dark:text-zinc-100 truncate group-hover:text-accent-ink transition-colors duration-150">
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
                          <span className="text-[11px] px-1.5 py-0.5 rounded border border-black/5 dark:border-white/[0.08] bg-black/5 dark:bg-white/[0.04] text-black/60 dark:text-zinc-300 transition-colors group-hover:border-accent/40 group-hover:text-accent-ink tabular-nums whitespace-nowrap">
                            {model.pricingUnit
                              ? formatPrice(model)
                              : model.pricing.input === 0
                                ? "Free"
                                : `$${model.pricing.input}/M`}
                          </span>
                          <ArrowUpRight size={12} className="opacity-30 group-hover:opacity-100 group-hover:translate-x-px group-hover:-translate-y-px text-black dark:text-white group-hover:text-accent-ink transition-[color,background-color,border-color,opacity,transform,box-shadow] duration-150" />
                        </div>
                      </div>
                    ))}
                    {visibleModels.length === 0 && <p className="py-4 text-center text-xs text-black/50 dark:text-zinc-400">No models in this section match these filters.</p>}
                  </div>

                  {/* Section methodology + evaluation date */}
                  <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/[0.06] text-[11px] font-sans text-black/45 dark:text-zinc-500 leading-relaxed">
                    {category.methodKey && leaderboardMethodology[category.methodKey] ? (
                      <p>
                        <span className="font-medium text-black/60 dark:text-zinc-400">How this is judged: </span>
                        {leaderboardMethodology[category.methodKey].basis}{" "}
                        <span className="tabular-nums">Reviewed {leaderboardMethodology[category.methodKey].evaluatedAt}.</span>{" "}
                        {leaderboardMethodology[category.methodKey].sources.map((u) => (
                          <a key={u} href={u} target="_blank" rel="noopener noreferrer" className="text-accent-ink hover:underline underline-offset-2 mr-2">
                            {new URL(u).hostname.replace(/^www\./, "")}
                          </a>
                        ))}
                      </p>
                    ) : (
                      <p>
                        <span className="font-medium text-black/60 dark:text-zinc-400">How this is judged: </span>
                        Calculated from this registry snapshot. Values were last revised {datasetRevisedLabel}; provider data is not fetched on each visit.
                      </p>
                    )}
                  </div>
                </div>
              </TextWithBlur>
            )
          })}
        </div>

        <div className="mt-8 rounded-2xl border border-black/10 dark:border-white/[0.08] bg-white/[0.6] dark:bg-white/[0.02] p-4 sm:p-5 text-xs sm:text-sm font-sans text-black/60 dark:text-zinc-400 leading-relaxed">
          <p>
            This leaderboard is an editorial snapshot, not an objective ranking. Scores are
            lab-published figures that vendors measure with different harnesses and versions;
            usage stats reflect observed public routing share. Full rules:{" "}
            <Link href="/methodology" className="text-accent-ink hover:underline underline-offset-2">/methodology</Link>
            {" "}· Record-level sources:{" "}
            <Link href="/changelog" className="text-accent-ink hover:underline underline-offset-2">/changelog</Link>
          </p>
        </div>
      </section>

      {/* Model Details Modal */}
      <ModelDetailsModal
        model={activeModalModel}
        onClose={() => setActiveModalModel(null)}
        folio={modalFolio.folio}
        folioId={modalFolio.folioId}
      />

    </>
  )
}
