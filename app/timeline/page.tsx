"use client"

import { useState } from "react"
import Header from "@/components/header"
import TextWithBlur from "@/components/text-with-blur"
import ModelDetailsModal from "@/components/model-details-modal"
import { modelsData, ModelItem } from "@/data/models"
import { companies } from "@/data/companies"
import { formatDate } from "@/lib/utils"
import { ArrowUpRight, Calendar } from "lucide-react"

export default function TimelinePage() {
  const currentYear = new Date().getFullYear()
  const [activeModalModel, setActiveModalModel] = useState<ModelItem | null>(null)

  // Sort chronological descending
  const sortedModels = [...modelsData].sort(
    (a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
  )

  // Group by Month Year
  const groupedTimeline: { [key: string]: ModelItem[] } = {}
  sortedModels.forEach((model) => {
    const d = new Date(model.releaseDate)
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
        <div className="space-y-4 text-base md:text-[17px] font-light text-black/75 dark:text-zinc-300 leading-relaxed max-w-3xl mb-8">
          <TextWithBlur delay={120}>
            <p>
              The chronological release log of major foundation model checkpoints and research breakthroughs.
            </p>
          </TextWithBlur>
        </div>

        {/* Timeline Months with Sibling Dimming */}
        <div className="flex flex-col list-hover-group space-y-8">
          {Object.entries(groupedTimeline).map(([monthYear, models], gIndex) => (
            <TextWithBlur key={monthYear} delay={gIndex * 40}>
              <div className="border-l-2 border-black/10 dark:border-white/[0.08] pl-3.5 sm:pl-6 ml-1.5 sm:ml-2 relative">
                {/* Technical node indicator */}
                <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-sm bg-[#ff5d2e]" />

                <h2 className="text-base sm:text-lg font-medium text-black dark:text-white mb-4 flex items-center gap-2 font-mono">
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
                        onClick={() => setActiveModalModel(model)}
                        className="cursor-pointer p-3.5 sm:p-4 rounded-md border border-black/10 dark:border-white/[0.08] bg-black/[0.015] dark:bg-[#0d0f13] hover:border-[#ff5d2e]/40 transition-colors duration-150 select-none group"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 mb-1.5 font-mono text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-2 h-2 rounded-sm shrink-0"
                              style={{ backgroundColor: company?.accentColor || "#ff5d2e" }}
                            />
                            <span className="text-black/55 dark:text-zinc-400 uppercase text-[11px] sm:text-xs">
                              {model.companyName}
                            </span>
                            <span className="text-black/20 dark:text-white/20 select-none">/</span>
                            <span className="font-sans text-sm font-medium text-black dark:text-white group-hover:text-[#ff5d2e] dark:group-hover:text-[#ff7347] transition-colors duration-150">
                              {model.name}
                            </span>
                          </div>

                          <span className="text-black/40 dark:text-zinc-400">
                            {formatDate(model.releaseDate)}
                          </span>
                        </div>

                        <p className="text-xs sm:text-sm font-light text-black/60 dark:text-zinc-400 leading-relaxed mb-2 line-clamp-2">
                          {model.highlight}
                        </p>

                        <div className="flex items-center justify-between text-xs pt-2 border-t border-black/5 dark:border-white/[0.06] font-mono">
                          <div className="flex gap-2">
                            <span className="text-[11px] text-black/45 dark:text-zinc-400">
                              {model.contextWindow}
                            </span>
                            <span className="text-[10px] uppercase px-1.5 py-0.5 rounded border border-black/5 dark:border-white/[0.08] bg-black/5 dark:bg-white/[0.04] text-black/60 dark:text-zinc-300 transition-colors group-hover:border-[#ff5d2e]/40 group-hover:text-[#ff5d2e]">
                              {model.statusBadge}
                            </span>
                          </div>

                          <span className="inline-flex items-center gap-1 text-[11px] text-black/40 dark:text-zinc-400 group-hover:text-[#ff5d2e] transition-colors">
                            INSPECT SPEC <ArrowUpRight size={10} className="transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
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

      {/* Footer */}
      <footer className="py-6 px-6 text-center border-t border-black/10 dark:border-white/[0.08] max-w-4xl mx-auto w-full">
        <p className="text-[11px] font-mono text-black/50 dark:text-zinc-400">
          © {currentYear} ModelRegistry. The open technical index for frontier AI systems.
        </p>
      </footer>
    </main>
  )
}
