"use client"

import { useState } from "react"
import TextWithBlur from "@/components/text-with-blur"
import { PageHeader } from "@/components/ui"
import ModelDetailsModal from "@/components/model-details-modal"
import { modelsData, ModelItem } from "@/data/models"
import { parseLocalDate, withoutReleasePrefix } from "@/lib/utils"
import { folioFor } from "@/lib/registry"
import { tapFeedback } from "@/lib/feedback"

export default function TimelineClient() {
  const [activeModalModel, setActiveModalModel] = useState<ModelItem | null>(null)
  const modalFolio = folioFor(activeModalModel, modelsData)

  const openModel = (model: ModelItem) => {
    tapFeedback()
    setActiveModalModel(model)
  }

  // Sort chronological descending
  const sortedModels = [...modelsData].sort(
    (a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
  )

  // Group by Month Year
  const groupedTimeline: { [key: string]: ModelItem[] } = {}
  sortedModels.forEach((model) => {
    const d = parseLocalDate(model.releaseDate)
    const monthYear = d.toLocaleDateString("en-US", { month: "long", year: "numeric" })
    if (!groupedTimeline[monthYear]) {
      groupedTimeline[monthYear] = []
    }
    groupedTimeline[monthYear].push(model)
  })

  return (
    <>
      <section className="section page">
        <TextWithBlur delay={120}>
          <PageHeader title="Release timeline" lead="Every tracked model checkpoint, newest first. Select a row for the full record." />
        </TextWithBlur>

        <div className="space-y-10">
          {Object.entries(groupedTimeline).map(([monthYear, models], gIndex) => (
            <TextWithBlur key={monthYear} delay={gIndex * 40}>
              <section id={monthYear.toLowerCase().replace(/[^a-z0-9]+/g, "-")} aria-label={monthYear} className="scroll-mt-24">
                <h2 className="mb-1 font-display text-heading font-semibold tracking-tight text-fg-strong">
                  {monthYear}
                  <span className="ml-2 text-small font-normal text-fg-muted">
                    {models.length} {models.length === 1 ? "release" : "releases"}
                  </span>
                </h2>

                <ul className="rule-t">
                  {models.map((model) => (
                    <li key={model.id} className="rule-b">
                      <button
                        type="button"
                        onClick={() => openModel(model)}
                        className="group grid w-full cursor-pointer grid-cols-[3.5rem_1fr] items-baseline gap-x-4 py-3.5 text-left sm:grid-cols-[4rem_1fr_auto]"
                      >
                        <time dateTime={model.releaseDate} className="text-small tabular-nums text-fg-muted">
                          {parseLocalDate(model.releaseDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </time>
                        <span className="min-w-0">
                          <span className="block truncate font-display text-title font-semibold tracking-tight text-fg-strong transition-colors group-hover:text-accent-ink">
                            {model.name}
                          </span>
                          <span className="block truncate text-small text-fg-muted">
                            {model.companyName} · {model.categoryLabel}
                          </span>
                          <span className="mt-1 line-clamp-2 text-body leading-6 text-fg">{withoutReleasePrefix(model.highlight)}</span>
                        </span>
                        <span className="hidden text-small tabular-nums text-fg-muted sm:block">
                          {model.contextWindowTokens > 0 ? `${(model.contextWindowTokens / 1_000_000).toFixed(model.contextWindowTokens % 1_000_000 ? 2 : 0)}M context` : ""}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            </TextWithBlur>
          ))}
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
