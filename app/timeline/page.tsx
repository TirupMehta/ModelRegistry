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

      <section className="section max-w-4xl mx-auto w-full px-6 md:px-20 pb-20">
        <div className="space-y-4 text-base md:text-lg font-light text-black/70 dark:text-white/70 leading-relaxed max-w-3xl mb-10">
          <TextWithBlur delay={120}>
            <p>
              The chronological release log of major foundation model checkpoints and research breakthroughs.
            </p>
          </TextWithBlur>
        </div>

        {/* Timeline Months with Sibling Dimming */}
        <div className="flex flex-col list-hover-group space-y-10">
          {Object.entries(groupedTimeline).map(([monthYear, models], gIndex) => (
            <TextWithBlur key={monthYear} delay={gIndex * 40}>
              <div className="border-l-2 border-black/10 dark:border-white/10 pl-4 sm:pl-6 ml-2 relative">
                {/* Node indicator */}
                <div className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-[#fafaf9] dark:bg-[#090a0d] border-2 border-accent" />

                <h2 className="text-base sm:text-lg font-medium text-black dark:text-white mb-4 flex items-center gap-2">
                  <Calendar size={15} className="text-accent" />
                  <span>{monthYear}</span>
                  <span className="text-xs font-mono text-black/40 dark:text-white/40 font-normal">
                    ({models.length} {models.length === 1 ? "release" : "releases"})
                  </span>
                </h2>

                <div className="space-y-3">
                  {models.map((model) => {
                    const company = companies[model.companyId]

                    return (
                      <div
                        key={model.id}
                        onClick={() => setActiveModalModel(model)}
                        className="cursor-pointer p-4 rounded-xl border border-black/5 dark:border-white/5 bg-black/[0.015] dark:bg-white/[0.02] hover:bg-black/5 dark:hover:bg-white/5 transition-all select-none active:scale-[0.99] group"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: company?.accentColor || "#7c88e8" }}
                            />
                            <span className="text-xs font-mono text-black/50 dark:text-white/50">
                              {model.companyName}
                            </span>
                            <span className="text-black/20 dark:text-white/20 select-none">/</span>
                            <span className="text-sm font-medium text-black dark:text-white group-hover:text-accent transition-colors">
                              {model.name}
                            </span>
                          </div>

                          <span className="text-xs font-mono text-black/40 dark:text-white/40">
                            {formatDate(model.releaseDate)}
                          </span>
                        </div>

                        <p className="text-xs sm:text-sm font-light text-black/60 dark:text-white/60 leading-relaxed mb-2 line-clamp-2">
                          {model.highlight}
                        </p>

                        <div className="flex items-center justify-between text-xs pt-1.5 border-t border-black/5 dark:border-white/5">
                          <div className="flex gap-2">
                            <span className="font-mono text-[11px] text-black/45 dark:text-white/45">
                              {model.contextWindow}
                            </span>
                            <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-black/5 dark:bg-white/5 text-black/55 dark:text-white/55">
                              {model.statusBadge}
                            </span>
                          </div>

                          <span className="inline-flex items-center gap-1 text-[11px] text-black/40 dark:text-white/40 group-hover:text-accent transition-colors">
                            Inspect Specs <ArrowUpRight size={11} />
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
      <footer className="py-6 px-6 text-center border-t border-black/10 dark:border-white/10 max-w-4xl mx-auto w-full">
        <p className="text-xs font-light text-black/50 dark:text-white/50">
          © {currentYear} ModelRegistry. The open public registry for frontier AI models.
        </p>
      </footer>
    </main>
  )
}
