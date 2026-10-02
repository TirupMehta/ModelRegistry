"use client"

import { useState } from "react"
import Header from "@/components/header"
import Footer from "@/components/footer"
import TextWithBlur from "@/components/text-with-blur"
import ModelDetailsModal from "@/components/model-details-modal"
import { modelsData, ModelItem } from "@/data/models"
import { companies } from "@/data/companies"
import { formatDate, parseLocalDate } from "@/lib/utils"
import { tapFeedback } from "@/lib/feedback"
import { ArrowUpRight, Calendar } from "lucide-react"

export default function TimelinePage() {
  const [activeModalModel, setActiveModalModel] = useState<ModelItem | null>(null)

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
    <main className="relative min-h-screen">
      <Header />

      <section className="section max-w-4xl mx-auto w-full px-4 sm:px-6 md:px-20 pb-20">
        <div className="space-y-4 text-base md:text-[17px] font-normal text-black/75 dark:text-zinc-300 leading-relaxed max-w-3xl mb-8">
          <TextWithBlur delay={120}>
            <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-black dark:text-white">
              Release Timeline
            </h1>
            <p>
              The chronological release log of major foundation model checkpoints and research breakthroughs.
            </p>
          </TextWithBlur>
        </div>

        {/* Timeline Months with Sibling Dimming */}
        <div className="flex flex-col list-hover-group space-y-8">
          {Object.entries(groupedTimeline).map(([monthYear, models], gIndex) => (
            <TextWithBlur key={monthYear} delay={gIndex * 40}>
              <div
                id={monthYear.toLowerCase().replace(/[^a-z0-9]+/g, "-")}
                className="border-l border-black/10 dark:border-white/[0.08] pl-3.5 sm:pl-6 ml-1.5 sm:ml-2 relative scroll-mt-24"
              >
                {/* Technical node indicator */}
                <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#ff5d2e] ring-4 ring-[#ff5d2e]/15" />

                <h2 className="text-base sm:text-lg font-medium text-black dark:text-white mb-4 flex items-center gap-2 font-sans">
                  <Calendar size={14} className="text-[#ff5d2e]" />
                  <span>{monthYear}</span>
                  <span className="text-xs text-black/40 dark:text-zinc-400 font-normal">
                    [{models.length} {models.length === 1 ? "release" : "releases"}]
                  </span>
                </h2>

                <div className="space-y-3">
                  {models.map((model) => {
                    const company = companies[model.companyId]

                    return (
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
                        className="card-lift cursor-pointer p-3.5 sm:p-4 rounded-2xl border border-black/10 dark:border-white/[0.08] bg-white/[0.7] dark:bg-[#0d0f13] shadow-sm hover:border-[#ff5d2e]/40 transition-all duration-150 select-none group"
                      >
                        <div className="mb-1.5">
                          <div className="flex items-center gap-2 font-sans min-w-0">
                            <span
                              className="w-2 h-2 rounded-[3px] ring-1 ring-black/10 dark:ring-white/10 shrink-0"
                              style={{ backgroundColor: company?.accentColor || "#ff5d2e" }}
                            />
                            <span className="text-black/55 dark:text-zinc-400 uppercase text-[11px] truncate">
                              {model.companyName}
                            </span>
                            <span className="ml-auto text-[11px] text-black/40 dark:text-zinc-400 tabular-nums whitespace-nowrap shrink-0">
                              {formatDate(model.releaseDate)}
                            </span>
                          </div>
                          <div className="mt-1 font-sans text-[15px] sm:text-base font-medium tracking-tight leading-snug text-black dark:text-white group-hover:text-[#ff5d2e] dark:group-hover:text-[#ff7347] transition-colors duration-150">
                            {model.name}
                          </div>
                        </div>

                        <p className="text-xs sm:text-sm font-normal text-black/60 dark:text-zinc-400 leading-relaxed mb-2 line-clamp-2">
                          {model.highlight}
                        </p>

                        <div className="flex flex-wrap items-center justify-between gap-y-1.5 gap-x-3 text-xs pt-2 border-t border-black/5 dark:border-white/[0.06] font-sans">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] text-black/45 dark:text-zinc-400">
                              {model.contextWindow}
                            </span>
                            <span className="text-[11px] uppercase px-1.5 py-0.5 rounded border border-black/5 dark:border-white/[0.08] bg-black/5 dark:bg-white/[0.04] text-black/60 dark:text-zinc-300 transition-colors group-hover:border-[#ff5d2e]/40 group-hover:text-[#ff5d2e]">
                              {model.statusBadge}
                            </span>
                          </div>

                          <span className="inline-flex items-center gap-1 text-[11px] text-black/40 dark:text-zinc-400 group-hover:text-[#ff5d2e] transition-colors shrink-0">
                            INSPECT SPEC <ArrowUpRight size={10} className="opacity-60" />
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </TextWithBlur>
          ))}
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
