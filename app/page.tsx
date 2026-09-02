"use client"

import { useState, useMemo } from "react"
import Header from "@/components/header"
import TextWithBlur from "@/components/text-with-blur"
import ModelDetailsModal from "@/components/model-details-modal"
import { modelsData, ModelItem } from "@/data/models"
import { Search, Sparkles, ArrowUpRight, Cpu, Layers } from "lucide-react"

type ViewTab = "flagships" | "latest-drops" | "open-weights" | "all"

export default function Home() {
  const currentYear = new Date().getFullYear()
  const [activeTab, setActiveTab] = useState<ViewTab>("flagships")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeModalModel, setActiveModalModel] = useState<ModelItem | null>(null)

  // Filter models based on active tab and search
  const filteredModels = useMemo(() => {
    return modelsData.filter((model) => {
      // Tab filter
      if (activeTab === "flagships" && !model.isCompanyFlagship) {
        return false
      }
      if (activeTab === "latest-drops" && !model.isLatestCheckpoint) {
        return false
      }
      if (activeTab === "open-weights" && !model.openWeights) {
        return false
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesName = model.name.toLowerCase().includes(q)
        const matchesCompany = model.companyName.toLowerCase().includes(q)
        const matchesHighlight = model.highlight.toLowerCase().includes(q)
        const matchesCategory = model.categoryLabel.toLowerCase().includes(q)
        return matchesName || matchesCompany || matchesHighlight || matchesCategory
      }

      return true
    })
  }, [activeTab, searchQuery])

  // Count items for each tab
  const counts = useMemo(() => {
    return {
      flagships: modelsData.filter((m) => m.isCompanyFlagship).length,
      latestDrops: modelsData.filter((m) => m.isLatestCheckpoint).length,
      openWeights: modelsData.filter((m) => m.openWeights).length,
      all: modelsData.length,
    }
  }, [])

  // Find if a flagship's company has a specialized newest checkpoint (e.g. Meta has Muse Voice Transcribe)
  const getSpecializedDrop = (companyId: string, currentModelId: string) => {
    return modelsData.find(
      (m) => m.companyId === companyId && m.isLatestCheckpoint && m.id !== currentModelId
    )
  }

  return (
    <main className="relative min-h-screen">
      <Header />

      <section className="section max-w-4xl mx-auto w-full px-6 md:px-20 pb-20">
        {/* Story Description (tirup.in style) */}
        <div className="space-y-4 text-base md:text-lg font-light text-black/70 dark:text-white/70 leading-relaxed max-w-3xl mb-8">
          <TextWithBlur delay={120}>
            <p>
              Checkpoint is an open registry of the frontier in artificial intelligence. 
              We index the primary heavyweight foundation models from the world&apos;s leading AI labs, alongside their latest research releases.
            </p>
          </TextWithBlur>
        </div>

        {/* View Switcher & Search (Subtle, sleek, tirup.in aesthetic) */}
        <TextWithBlur delay={180}>
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/5 dark:border-white/5 pb-4">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap text-xs md:text-sm">
              <button
                onClick={() => setActiveTab("flagships")}
                className={`py-1.5 px-3 rounded-md transition-all select-none cursor-pointer ${
                  activeTab === "flagships"
                    ? "bg-black/[0.06] dark:bg-white/[0.08] text-black dark:text-white font-medium shadow-sm"
                    : "text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white"
                }`}
              >
                Flagship LLMs <span className="font-mono opacity-50 text-[11px]">({counts.flagships})</span>
              </button>

              <button
                onClick={() => setActiveTab("latest-drops")}
                className={`py-1.5 px-3 rounded-md transition-all select-none cursor-pointer ${
                  activeTab === "latest-drops"
                    ? "bg-black/[0.06] dark:bg-white/[0.08] text-black dark:text-white font-medium shadow-sm"
                    : "text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white"
                }`}
              >
                Newest Drops <span className="font-mono opacity-50 text-[11px]">({counts.latestDrops})</span>
              </button>

              <button
                onClick={() => setActiveTab("open-weights")}
                className={`py-1.5 px-3 rounded-md transition-all select-none cursor-pointer ${
                  activeTab === "open-weights"
                    ? "bg-black/[0.06] dark:bg-white/[0.08] text-black dark:text-white font-medium shadow-sm"
                    : "text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white"
                }`}
              >
                Open Weights <span className="font-mono opacity-50 text-[11px]">({counts.openWeights})</span>
              </button>

              <button
                onClick={() => setActiveTab("all")}
                className={`py-1.5 px-3 rounded-md transition-all select-none cursor-pointer ${
                  activeTab === "all"
                    ? "bg-black/[0.06] dark:bg-white/[0.08] text-black dark:text-white font-medium shadow-sm"
                    : "text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white"
                }`}
              >
                All <span className="font-mono opacity-50 text-[11px]">({counts.all})</span>
              </button>
            </div>

            {/* Quick Search */}
            <div className="relative w-full sm:w-56">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-black/35 dark:text-white/35 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter models..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-black/[0.025] dark:bg-white/[0.035] border border-black/5 dark:border-white/5 rounded-md focus:outline-none focus:border-accent text-black dark:text-white placeholder:text-black/35 dark:placeholder:text-white/35 font-light transition-colors"
              />
            </div>
          </div>
        </TextWithBlur>

        {/* Models List (100% tirup.in /work visual structure) */}
        <div className="flex flex-col list-hover-group">
          {filteredModels.length === 0 ? (
            <div className="py-12 text-center text-sm font-light text-black/40 dark:text-white/40">
              No models found matching &quot;{searchQuery}&quot;.
            </div>
          ) : (
            filteredModels.map((model, index) => {
              const specializedDrop = getSpecializedDrop(model.companyId, model.id)

              return (
                <TextWithBlur key={model.id} delay={Math.min(index * 30, 250)}>
                  <div
                    onClick={() => setActiveModalModel(model)}
                    className={[
                      "group block py-4 sm:py-5 -mx-3 px-3 rounded-lg cursor-pointer",
                      index > 0 ? "border-t border-black/10 dark:border-white/10" : "",
                      "[transition:background-color_120ms_ease-out]",
                      "hover:bg-black/[0.025] dark:hover:bg-white/[0.025]",
                      "active:scale-[0.99] [transition:background-color_120ms_ease-out,transform_100ms_cubic-bezier(0.16,1,0.3,1)]",
                    ].join(" ")}
                  >
                    <div className="flex items-baseline gap-3.5 sm:gap-5">
                      {/* Index Number */}
                      <span className="font-mono tabular-nums text-xs md:text-sm text-black/40 dark:text-white/40 select-none w-5 sm:w-6 shrink-0 group-hover:text-black/60 dark:group-hover:text-white/60 [transition:color_80ms_ease-out]">
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      {/* Content Column */}
                      <div className="flex-1 min-w-0">
                        {/* Main Title / Lab / Category Row */}
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm md:text-base leading-relaxed mb-0.5">
                          <span className="font-medium text-black dark:text-white group-hover:text-accent [transition:color_80ms_ease-out]">
                            {model.name}
                          </span>
                          <span className="text-black/20 dark:text-white/20 select-none font-extralight">/</span>
                          <span className="text-black/50 dark:text-white/50 font-light text-xs sm:text-sm">
                            {model.companyName}
                          </span>
                          <span className="text-black/20 dark:text-white/20 select-none font-extralight hidden sm:inline">/</span>
                          <span className="text-black/45 dark:text-white/45 font-light text-xs sm:text-sm truncate max-w-sm hidden sm:inline">
                            {model.categoryLabel}
                          </span>
                        </div>

                        {/* Highlight / Description */}
                        <p className="text-xs sm:text-sm font-light text-black/60 dark:text-white/60 leading-relaxed line-clamp-1 group-hover:text-black/75 dark:group-hover:text-white/75 transition-colors">
                          {model.highlight}
                        </p>

                        {/* If this flagship has a specialized newest drop, show note */}
                        {specializedDrop && activeTab === "flagships" && (
                          <div className="mt-1 flex items-center gap-1.5 text-[11px] font-mono text-black/40 dark:text-white/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent/70 shrink-0"></span>
                            <span>
                              Latest drop:{" "}
                              <span className="text-black/65 dark:text-white/65 underline underline-offset-2">
                                {specializedDrop.name}
                              </span>{" "}
                              ({specializedDrop.categoryLabel})
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Right Specs Badges */}
                      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 text-right">
                        <span className="font-mono text-xs text-black/40 dark:text-white/40 hidden md:inline">
                          {model.contextWindow.replace(" tokens", "")}
                        </span>

                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60 border border-black/5 dark:border-white/5">
                          {model.statusBadge}
                        </span>

                        <ArrowUpRight
                          size={13}
                          className="opacity-25 group-hover:opacity-100 transition-opacity text-black dark:text-white hidden sm:block"
                        />
                      </div>
                    </div>
                  </div>
                </TextWithBlur>
              )
            })
          )}
          {/* End of list bottom border */}
          <div className="border-t border-black/10 dark:border-white/10" />
        </div>

        {/* Connect & Syndication Links (tirup.in style) */}
        <TextWithBlur delay={300}>
          <div className="mt-12 border-t border-black/5 dark:border-white/5 pt-6">
            <h2 className="text-xs uppercase tracking-[0.2em] text-black/40 dark:text-white/40 mb-4 font-medium">
              Open Telemetry &amp; Endpoints
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-8 gap-y-3 text-xs md:text-sm font-light text-black/60 dark:text-white/60">
              <a
                href="/api/v1/models"
                target="_blank"
                rel="noopener noreferrer"
                className="group hover:text-black dark:hover:text-white transition-colors inline-flex items-center gap-1 w-fit"
              >
                JSON API <ArrowUpRight size={13} className="opacity-40 group-hover:opacity-100" />
              </a>
              <a
                href="/rss.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="group hover:text-black dark:hover:text-white transition-colors inline-flex items-center gap-1 w-fit"
              >
                RSS Feed <ArrowUpRight size={13} className="opacity-40 group-hover:opacity-100" />
              </a>
              <a
                href="/llms.txt"
                target="_blank"
                rel="noopener noreferrer"
                className="group hover:text-black dark:hover:text-white transition-colors inline-flex items-center gap-1 w-fit"
              >
                llms.txt <ArrowUpRight size={13} className="opacity-40 group-hover:opacity-100" />
              </a>
              <a
                href="https://github.com/TirupMehta"
                target="_blank"
                rel="noopener noreferrer"
                className="group hover:text-black dark:hover:text-white transition-colors inline-flex items-center gap-1 w-fit"
              >
                GitHub <ArrowUpRight size={13} className="opacity-40 group-hover:opacity-100" />
              </a>
            </div>
          </div>
        </TextWithBlur>
      </section>

      {/* Model Inspection Modal */}
      <ModelDetailsModal
        model={activeModalModel}
        onClose={() => setActiveModalModel(null)}
      />

      {/* Footer (1:1 tirup.in style) */}
      <footer className="py-6 px-6 text-center border-t border-black/10 dark:border-white/10 max-w-4xl mx-auto w-full">
        <p className="text-xs font-light text-black/50 dark:text-white/50">
          © {currentYear} Checkpoint. Built for the open internet.
        </p>
      </footer>
    </main>
  )
}
