"use client"

import { useState, useMemo, useEffect } from "react"
import Header from "@/components/header"
import TextWithBlur from "@/components/text-with-blur"
import ModelDetailsModal from "@/components/model-details-modal"
import { modelsData, ModelItem } from "@/data/models"
import { Search, ArrowUpRight } from "lucide-react"

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

  // Deep link detection from window.location.hash and keyboard shortcuts
  useEffect(() => {
    // 1. URL Hash Deep-linking
    const hash = window.location.hash.replace("#", "")
    if (hash) {
      const match = modelsData.find((m) => m.id === hash)
      if (match) {
        setActiveModalModel(match)
      }
    }

    // 2. Global keyboard shortcut ('/' to search, 'Esc' to clear)
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault()
        const input = document.getElementById("models-search-input") as HTMLInputElement | null
        input?.focus()
      } else if (e.key === "Escape") {
        const input = document.getElementById("models-search-input") as HTMLInputElement | null
        if (input && document.activeElement === input) {
          input.blur()
          setSearchQuery("")
        }
      }
    }

    window.addEventListener("keydown", handleGlobalKeyDown)
    return () => window.removeEventListener("keydown", handleGlobalKeyDown)
  }, [])

  return (
    <main className="relative min-h-screen">
      <Header />

      {/*
        ── Semantic Knowledge Vault for AI crawlers & non-JS engines ──
        Ensures GPTBot, ClaudeBot, PerplexityBot, and Googlebot ingest the full structured
        dataset with zero hydration latency (inspired by tirup.in).
      */}
      <noscript>
        <article
          style={{
            maxWidth: "48rem",
            margin: "0 auto",
            padding: "2rem 1.5rem",
            fontFamily: "sans-serif",
            lineHeight: 1.7,
            color: "#111",
          }}
        >
          <h1>ModelRegistry — Open Frontier AI Model &amp; Checkpoint Index</h1>
          <p>
            The internet&apos;s open, real-time registry tracking primary foundation flagships and research checkpoints across OpenAI, Anthropic, Google DeepMind, DeepSeek, Meta AI, xAI, Alibaba Cloud (Qwen), Mistral AI, and Cohere.
          </p>

          <h2>Primary Foundation Flagships by AI Laboratory (September 2026)</h2>
          <ul>
            {modelsData
              .filter((m) => m.isCompanyFlagship)
              .map((m) => (
                <li key={m.id}>
                  <strong>{m.companyName}:</strong> {m.name} — Context: {m.contextWindow}, Parameters: {m.parameters}. Released {m.releaseDate}. {m.highlight}
                </li>
              ))}
          </ul>

          <h2>Latest Research &amp; Specialized Checkpoints</h2>
          <ul>
            {modelsData
              .filter((m) => m.isLatestCheckpoint)
              .map((m) => (
                <li key={m.id}>
                  <strong>{m.companyName}:</strong> {m.name} ({m.categoryLabel}) — Released {m.releaseDate}. {m.highlight}
                </li>
              ))}
          </ul>

          <h2>Developer Endpoints</h2>
          <p>
            API: <a href="https://modelregistry.tirup.in/api/v1/models">https://modelregistry.tirup.in/api/v1/models</a><br />
            RSS: <a href="https://modelregistry.tirup.in/rss.xml">https://modelregistry.tirup.in/rss.xml</a><br />
            Agent Resource: <a href="https://modelregistry.tirup.in/llms.txt">https://modelregistry.tirup.in/llms.txt</a>
          </p>
        </article>
      </noscript>

      <section className="section max-w-4xl mx-auto w-full px-6 md:px-20 pb-20">
        {/* Story Description (tirup.in style) */}
        <div className="space-y-4 text-base md:text-[17px] font-light text-black/70 dark:text-white/70 leading-relaxed max-w-3xl mb-8">
          <TextWithBlur delay={120}>
            <p>
              ModelRegistry is an open public catalog of frontier artificial intelligence. 
              We index the primary heavyweight foundation models from the world&apos;s leading research labs alongside newly registered model checkpoints.
            </p>
          </TextWithBlur>
        </div>

        {/* View Switcher & Search (tirup.in aesthetic) */}
        <TextWithBlur delay={180}>
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/5 dark:border-white/5 pb-4">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap text-xs sm:text-sm">
              <button
                onClick={() => setActiveTab("flagships")}
                className={`py-1.5 px-3 rounded-md transition-all select-none cursor-pointer ${
                  activeTab === "flagships"
                    ? "bg-black/[0.06] dark:bg-white/[0.08] text-black dark:text-white font-medium shadow-sm border border-black/5 dark:border-white/10"
                    : "text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white dark:hover:bg-white/[0.03]"
                }`}
              >
                Flagship LLMs <span className="font-mono opacity-50 text-[11px]">({counts.flagships})</span>
              </button>

              <button
                onClick={() => setActiveTab("latest-drops")}
                className={`py-1.5 px-3 rounded-md transition-all select-none cursor-pointer ${
                  activeTab === "latest-drops"
                    ? "bg-black/[0.06] dark:bg-white/[0.08] text-black dark:text-white font-medium shadow-sm border border-black/5 dark:border-white/10"
                    : "text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white dark:hover:bg-white/[0.03]"
                }`}
              >
                Newest Drops <span className="font-mono opacity-50 text-[11px]">({counts.latestDrops})</span>
              </button>

              <button
                onClick={() => setActiveTab("open-weights")}
                className={`py-1.5 px-3 rounded-md transition-all select-none cursor-pointer ${
                  activeTab === "open-weights"
                    ? "bg-black/[0.06] dark:bg-white/[0.08] text-black dark:text-white font-medium shadow-sm border border-black/5 dark:border-white/10"
                    : "text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white dark:hover:bg-white/[0.03]"
                }`}
              >
                Open Weights <span className="font-mono opacity-50 text-[11px]">({counts.openWeights})</span>
              </button>

              <button
                onClick={() => setActiveTab("all")}
                className={`py-1.5 px-3 rounded-md transition-all select-none cursor-pointer ${
                  activeTab === "all"
                    ? "bg-black/[0.06] dark:bg-white/[0.08] text-black dark:text-white font-medium shadow-sm border border-black/5 dark:border-white/10"
                    : "text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white dark:hover:bg-white/[0.03]"
                }`}
              >
                All <span className="font-mono opacity-50 text-[11px]">({counts.all})</span>
              </button>
            </div>

            {/* Quick Search */}
            <div className="relative w-full sm:w-60">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-black/35 dark:text-white/35 pointer-events-none"
              />
              <input
                id="models-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter models..."
                className="w-full pl-8 pr-7 py-1.5 text-xs sm:text-sm bg-black/[0.025] dark:bg-white/[0.035] border border-black/5 dark:border-white/10 rounded-md focus:outline-none focus:border-accent text-black dark:text-white placeholder:text-black/35 dark:placeholder:text-white/35 font-light transition-colors"
              />
              <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-mono text-black/30 dark:text-white/30 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded pointer-events-none select-none">
                /
              </kbd>
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
                        <p className="text-xs sm:text-sm font-light text-black/60 dark:text-white/60 leading-relaxed line-clamp-1 group-hover:text-black/80 dark:group-hover:text-white/80 transition-colors">
                          {model.highlight}
                        </p>

                        {/* If this flagship has a specialized newest drop, show note */}
                        {specializedDrop && activeTab === "flagships" && (
                          <div className="mt-1 flex items-center gap-1.5 text-[11px] sm:text-xs font-mono text-black/40 dark:text-white/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0"></span>
                            <span>
                              Latest checkpoint:{" "}
                              <span className="text-black/70 dark:text-white/70 underline underline-offset-2 font-normal">
                                {specializedDrop.name}
                              </span>{" "}
                              ({specializedDrop.categoryLabel})
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Right Specs Badges */}
                      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 text-right">
                        <time
                          dateTime={model.releaseDate}
                          className="font-mono text-xs text-black/40 dark:text-white/40 hidden md:inline"
                        >
                          {model.contextWindow.replace(" tokens", "")}
                        </time>

                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60 border border-black/5 dark:border-white/5">
                          {model.statusBadge}
                        </span>

                        <ArrowUpRight
                          size={13}
                          className="opacity-30 group-hover:opacity-100 transition-opacity text-black dark:text-white hidden sm:block"
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-8 gap-y-3 text-xs sm:text-sm font-light text-black/60 dark:text-white/60">
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
                href="https://github.com/TirupMehta/ModelRegistry"
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
          © {currentYear} ModelRegistry. The open public registry for frontier AI models.
        </p>
      </footer>
    </main>
  )
}
