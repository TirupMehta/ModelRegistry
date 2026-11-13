"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowUpRight, ChevronDown } from "lucide-react"
import TextWithBlur from "@/components/text-with-blur"
import { PageHeader } from "@/components/ui"
import ModelDetailsModal from "@/components/model-details-modal"
import ModelFilterControls from "@/components/model-filter-controls"
import { modelsData, type ModelItem } from "@/data/models"
import { independentRecords } from "@/data/independent-benchmarks"
import { leaderboardSpotlights, leaderboardMethodology } from "@/data/leaderboard"
import { datasetRevision } from "@/data/revision"
import { folioFor } from "@/lib/registry"
import { isCurrent } from "@/lib/currency"
import { formatDate, formatPrice } from "@/lib/utils"
import { tapFeedback } from "@/lib/feedback"
import { DEFAULT_MODEL_FILTERS, filterModels, type ModelFilters } from "@/lib/model-filters"

interface Row {
  model: ModelItem
  /** The figure the section is ranked by, as shown. */
  value: string
  /** Numeric form of the same figure, for ordering. Higher ranks first unless `ascending`. */
  sort: number
}

interface Section {
  id: string
  title: string
  description: string
  rows: Row[]
  /** What the shown figure is, in a few words. */
  measure: string
  ascending?: boolean
  methodKey?: "reasoning" | "coding" | "value"
  basis?: string
}

const record = (id: string) => independentRecords.find((r) => r.modelId === id)

function ranked(models: ModelItem[], score: (m: ModelItem) => Omit<Row, "model"> | null, ascending = false): Row[] {
  return models
    .map((model) => {
      const s = score(model)
      return s ? { model, ...s } : null
    })
    .filter((row): row is Row => row !== null)
    .sort((a, b) => (ascending ? a.sort - b.sort : b.sort - a.sort))
}

function buildSections(): Section[] {
  const current = modelsData.filter(isCurrent)
  const spot = (ids: string[]) => modelsData.filter((m) => ids.includes(m.id))
  const index = (m: ModelItem) => {
    const v = record(m.id)?.values.intelligenceIndex
    return typeof v === "number" ? { value: String(v), sort: v } : null
  }
  return [
    {
      id: "reasoning",
      title: "Overall intelligence",
      description: "Highest independent Intelligence Index among current models.",
      measure: "Intelligence Index",
      methodKey: "reasoning",
      rows: ranked(spot(leaderboardSpotlights.reasoning), index),
    },
    {
      id: "coding",
      title: "Software engineering",
      description: "Highest independent FrontierCode 2.0 score among current models.",
      measure: "FrontierCode",
      methodKey: "coding",
      rows: ranked(spot(leaderboardSpotlights.coding), (m) => {
        const v = record(m.id)?.values.frontierCode
        return typeof v === "number" ? { value: `${v.toFixed(1)}%`, sort: v } : null
      }),
    },
    {
      id: "value",
      title: "Best score per dollar",
      description: "Nothing scores higher on the Intelligence Index for less cost per task.",
      measure: "Cost per task",
      methodKey: "value",
      ascending: true,
      rows: ranked(
        spot(leaderboardSpotlights.value),
        (m) => {
          const r = record(m.id)
          return typeof r?.costPerTask === "number" ? { value: `$${r.costPerTask.toFixed(2)}`, sort: r.costPerTask } : null
        },
        true,
      ),
    },
    {
      id: "open-weights",
      title: "Open weights",
      description: "Downloadable weights, ranked by independent Intelligence Index where measured.",
      measure: "Intelligence Index",
      rows: ranked(current.filter((m) => m.openWeights), index).slice(0, 5),
    },
    {
      id: "context",
      title: "Longest context",
      description: "Largest stated context limits. A larger limit does not guarantee accurate recall.",
      measure: "Context window",
      basis: `Stated limits from each lab, as recorded on ${formatDate(datasetRevision.revisedAt)}.`,
      rows: ranked(current, (m) =>
        m.contextWindowTokens > 0
          ? { value: `${(m.contextWindowTokens / 1_000_000).toFixed(m.contextWindowTokens % 1_000_000 ? 2 : 0)}M`, sort: m.contextWindowTokens }
          : null,
      ).slice(0, 5),
    },
    {
      id: "price",
      title: "Lowest input price",
      description: "Cheapest listed input price per 1M tokens. Output, caching and provider fees change the total.",
      measure: "Input / 1M",
      ascending: true,
      basis: `Lab list prices, as recorded on ${formatDate(datasetRevision.revisedAt)}.`,
      rows: ranked(
        current.filter((m) => !m.pricingUnit),
        (m) => ({ value: m.pricing.input === 0 ? "Free" : `$${m.pricing.input}`, sort: m.pricing.input }),
        true,
      ).slice(0, 5),
    },
  ]
}

export default function LeaderboardClient() {
  const [activeModalModel, setActiveModalModel] = useState<ModelItem | null>(null)
  const [filters, setFilters] = useState<ModelFilters>(DEFAULT_MODEL_FILTERS)
  const modalFolio = folioFor(activeModalModel, modelsData)
  const sections = buildSections()

  const openModel = (model: ModelItem) => {
    tapFeedback()
    setActiveModalModel(model)
  }

  return (
    <>
      <section className="section page">
        <TextWithBlur delay={120}>
          <div className="mb-10 flex items-start justify-between gap-4">
            <PageHeader
              className="mb-0"
              title="Leaderboard"
              lead={
                <>
                  Who leads on each measure, from independent results where they exist.{" "}
                  <Link href="/methodology" className="text-accent-ink underline-offset-4 hover:underline">
                    How it works
                  </Link>
                </>
              }
            />
            <ModelFilterControls filters={filters} onChange={setFilters} className="relative z-30 flex justify-end" />
          </div>
        </TextWithBlur>

        <div className="grid gap-x-10 gap-y-12 md:grid-cols-2">
          {sections.map((section, sectionIndex) => {
            const visibleIds = new Set(filterModels(section.rows.map((r) => r.model), filters, true).map((m) => m.id))
            const rows = section.rows.filter((r) => visibleIds.has(r.model.id))
            const method = section.methodKey ? leaderboardMethodology[section.methodKey] : undefined
            // Bar length: the share of the best figure in this list (for "lower is better" lists, best / own).
            const sorts = rows.map((r) => r.sort)
            const best = section.ascending ? Math.min(...sorts) : Math.max(...sorts)
            const share = (sort: number) =>
              sort <= 0 || best <= 0 ? 1 : section.ascending ? best / sort : sort / best

            return (
              <TextWithBlur key={section.id} delay={sectionIndex * 35}>
                <section id={section.id} aria-labelledby={`${section.id}-title`} className="scroll-mt-24">
                  <h2 id={`${section.id}-title`} className="text-heading font-semibold tracking-tight text-fg-strong">
                    {section.title}
                  </h2>
                  <p className="mt-1 text-small text-fg-muted">{section.description}</p>

                  <div className="mt-4 flex items-baseline justify-between border-b border-black/10 pb-2 text-small text-fg-muted dark:border-white/[0.08]">
                    <span>Model</span>
                    <span>{section.measure}</span>
                  </div>

                  <ol>
                    {rows.map((row, i) => (
                      <li key={row.model.id} className="rule-b">
                        <button
                          type="button"
                          onClick={() => openModel(row.model)}
                          className="group flex w-full cursor-pointer items-baseline gap-3 py-3 text-left"
                        >
                          <span className="w-5 shrink-0 text-small tabular-nums text-fg-muted">{i + 1}</span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-body font-medium text-fg-strong transition-colors group-hover:text-accent-ink">
                              {row.model.name}
                            </span>
                            <span className="block truncate text-small text-fg-muted">
                              {row.model.companyName}
                              {row.model.pricingUnit ? ` · ${formatPrice(row.model)}` : ""}
                            </span>
                            <span aria-hidden="true" className="mt-2 block h-1 overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/[0.08]">
                              <span
                                className={`block h-full rounded-full ${i === 0 ? "bg-accent" : "bg-accent/40"}`}
                                style={{ width: `${Math.max(4, Math.round(share(row.sort) * 100))}%` }}
                              />
                            </span>
                          </span>
                          <span className="shrink-0 text-body font-semibold tabular-nums text-fg-strong">{row.value}</span>
                          <ArrowUpRight
                            size={14}
                            aria-hidden="true"
                            className="shrink-0 self-center text-fg-muted opacity-40 transition-[opacity,color] group-hover:text-accent-ink group-hover:opacity-100"
                          />
                        </button>
                      </li>
                    ))}
                  </ol>
                  {rows.length === 0 && (
                    <p className="py-4 text-small text-fg-muted">No model in this list matches the filters.</p>
                  )}

                  <details className="group mt-3">
                    <summary className="flex w-fit cursor-pointer list-none items-center gap-1 text-small text-fg-muted hover:text-fg [&::-webkit-details-marker]:hidden">
                      How this is judged
                      <ChevronDown size={13} aria-hidden="true" className="transition-transform group-open:rotate-180" />
                    </summary>
                    <p className="mt-2 text-small leading-6 text-fg">
                      {method ? (
                        <>
                          {method.basis} Reviewed {formatDate(method.evaluatedAt)}.{" "}
                          {method.sources.map((u) => (
                            <a key={u} href={u} target="_blank" rel="noopener noreferrer" className="mr-2 text-accent-ink underline-offset-4 hover:underline">
                              {new URL(u).hostname.replace(/^www\./, "")}
                            </a>
                          ))}
                        </>
                      ) : (
                        section.basis
                      )}
                    </p>
                  </details>
                </section>
              </TextWithBlur>
            )
          })}
        </div>
      </section>

      <ModelDetailsModal
        model={activeModalModel}
        onClose={() => setActiveModalModel(null)}
        folio={modalFolio.folio}
        folioId={modalFolio.folioId}
      />
    </>
  )
}
