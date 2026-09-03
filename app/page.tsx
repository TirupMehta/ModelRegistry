"use client"

import { useState, useMemo, useEffect } from "react"
import Header from "@/components/header"
import TextWithBlur from "@/components/text-with-blur"
import ModelDetailsModal from "@/components/model-details-modal"
import { modelsData, type ModelItem } from "@/data/models"
import { Search, ArrowUpRight, Terminal, Sparkles, Layers, Copy, Check } from "lucide-react"

type ViewTab = "flagships" | "latest-drops" | "open-weights" | "all"

export default function Home() {
  const [activeTab, setActiveTab] = useState<ViewTab>("flagships")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeModalModel, setActiveModalModel] = useState<ModelItem | null>(null)
  const [curlCopied, setCurlCopied] = useState(false)

  const currentYear = new Date().getFullYear()

  // URL Deep-Linking via ?model= query parameter (clean, no # hash)
  useEffect(() => {
    const handleUrlQuery = () => {
      const params = new URLSearchParams(window.location.search)
      const modelId = params.get("model")
      if (modelId) {
        const found = modelsData.find((m) => m.id === modelId)
        if (found) {
          setActiveModalModel(found)
        }
      }
    }

    handleUrlQuery()
    window.addEventListener("popstate", handleUrlQuery)
    return () => window.removeEventListener("popstate", handleUrlQuery)
  }, [])

  // Sync query parameter with modal state
  useEffect(() => {
    const url = new URL(window.location.href)
    if (activeModalModel) {
      url.searchParams.set("model", activeModalModel.id)
      window.history.replaceState(null, "", url.pathname + url.search)
    } else if (url.searchParams.has("model")) {
      url.searchParams.delete("model")
      window.history.replaceState(null, "", url.pathname + (url.search ? url.search : ""))
    }
  }, [activeModalModel])

  // Global keyboard shortcut: press "/" to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault()
        document.getElementById("models-search-input")?.focus()
      } else if (e.key === "Escape" && searchQuery) {
        setSearchQuery("")
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [searchQuery])

  // Filter models based on tab & query
  const filteredModels = useMemo(() => {
    return modelsData.filter((model) => {
      if (activeTab === "flagships" && !model.isCompanyFlagship) return false
      if (activeTab === "latest-drops" && !model.isLatestCheckpoint) return false
      if (activeTab === "open-weights" && !model.openWeights) return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchName = model.name.toLowerCase().includes(q)
        const matchCompany = model.companyName.toLowerCase().includes(q)
        const matchHighlight = model.highlight.toLowerCase().includes(q)
        const matchCategory = model.categoryLabel.toLowerCase().includes(q)
        return matchName || matchCompany || matchHighlight || matchCategory
      }

      return true
    })
  }, [activeTab, searchQuery])

  // Filter counters
  const counts = useMemo(() => {
    return {
      flagships: modelsData.filter((m) => m.isCompanyFlagship).length,
      latestDrops: modelsData.filter((m) => m.isLatestCheckpoint).length,
      openWeights: modelsData.filter((m) => m.openWeights).length,
      all: modelsData.length,
    }
  }, [])

  // Check if a flagship has a specialized newest drop
  const getSpecializedDrop = (companyId: string, currentId: string) => {
    return modelsData.find(
      (m) => m.companyId === companyId && m.isLatestCheckpoint && m.id !== currentId
    )
  }

  return (
    <main className="relative min-h-screen">
      <Header />

      {/*
        SSR Knowledge Vault for AI Answer Engines & Web Crawlers
      */}
      <noscript>
        <article style={{ maxWidth: "48rem", margin: "0 auto", padding: "2rem 1.5rem", fontFamily: "monospace", lineHeight: 1.6, color: "#111" }}>
          <h1>ModelRegistry — Frontier AI Model Telemetry Index</h1>
          <p>
            Official open machine-readable registry of premier frontier artificial intelligence models across OpenAI, Anthropic, Google DeepMind, DeepSeek, Meta AI, xAI, Mistral, and Alibaba Cloud.
          </p>
          <h2>Active Heavyweight Flagships (September 2026)</h2>
          <ul>
            {modelsData.map((m) => (
              <li key={m.id}>
                <strong>{m.name}</strong> ({m.companyName}) — {m.categoryLabel}. Released: {m.releaseDate}. Context: {m.contextWindow}. Parameters: {m.parameters}. Status: {m.statusBadge}. Summary: {m.highlight}
              </li>
            ))}
          </ul>
        </article>
      </noscript>

      <section className="section max-w-4xl mx-auto w-full px-4 sm:px-6 md:px-20 pb-20">
        {/* Thesis Description */}
        <div className="space-y-4 text-base md:text-[17px] font-light text-black/75 dark:text-zinc-300 leading-relaxed max-w-3xl mb-8">
          <TextWithBlur delay={120}>
            <p>
              ModelRegistry is an open technical ledger indexing primary foundation model architectures alongside specialized research checkpoints across leading AI laboratories.
            </p>
          </TextWithBlur>

          {/* Quick Terminal & Developer Strip */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-1 text-xs font-mono text-black/60 dark:text-zinc-400">
            <button
              onClick={() => {
                navigator.clipboard.writeText("curl -s https://modelregistry.tirup.in/latest")
                setCurlCopied(true)
                setTimeout(() => setCurlCopied(false), 2000)
              }}
              className="group inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-md border border-black/10 dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.03] hover:border-[#ff5d2e]/40 transition-colors duration-150 cursor-pointer select-none text-[11px] sm:text-xs max-w-full"
              title="Copy terminal CLI query"
            >
              <Terminal size={12} className="text-[#ff5d2e] shrink-0" />
              <span className="text-black/80 dark:text-zinc-200 truncate">curl -s modelregistry.tirup.in/latest</span>
              {curlCopied ? (
                <Check size={12} className="text-[#00e599] shrink-0" />
              ) : (
                <Copy size={11} className="opacity-40 group-hover:opacity-100 transition-opacity shrink-0" />
              )}
            </button>

            <div className="flex items-center gap-2.5 sm:gap-3 text-[11px] text-black/45 dark:text-zinc-500">
              <a
                href="/api/v1/models"
                target="_blank"
                className="hover:text-black dark:hover:text-white transition-colors"
              >
                REST API
              </a>
              <span>•</span>
              <a
                href="/api/badge?model=latest"
                target="_blank"
                className="hover:text-black dark:hover:text-white transition-colors"
              >
                SVG Badges
              </a>
              <span>•</span>
              <a
                href="/llms.txt"
                target="_blank"
                className="hover:text-black dark:hover:text-white transition-colors"
              >
                llms.txt
              </a>
              <span>•</span>
              <a
                href="https://github.com/TirupMehta/ModelRegistry/blob/main/CONTRIBUTING.md"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#ff5d2e] transition-colors flex items-center gap-1 font-medium text-[#ff5d2e]"
              >
                <span>+ Add Model (60s)</span>
                <ArrowUpRight size={10} />
              </a>
            </div>
          </div>
        </div>

        {/* View Switcher & Search */}
        <TextWithBlur delay={180}>
          <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-black/10 dark:border-white/[0.08] pb-4">
            {/* Unified Segmented Filter Track (Single Row) */}
            <div className="inline-flex items-center p-0.5 rounded bg-black/[0.035] dark:bg-[#131518] border border-black/10 dark:border-white/[0.08] overflow-x-auto max-w-full shrink-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <button
                onClick={() => setActiveTab("flagships")}
                className={`py-1.5 px-2.5 sm:px-3 rounded-md text-xs font-mono tracking-tight transition-colors duration-150 select-none cursor-pointer whitespace-nowrap ${
                  activeTab === "flagships"
                    ? "bg-black text-white dark:bg-white dark:text-black font-medium"
                    : "text-black/60 dark:text-zinc-400 hover:text-black dark:hover:text-white"
                }`}
              >
                Flagships <span className="opacity-60 text-[10px]">[{counts.flagships}]</span>
              </button>

              <button
                onClick={() => setActiveTab("latest-drops")}
                className={`py-1.5 px-2.5 sm:px-3 rounded-md text-xs font-mono tracking-tight transition-colors duration-150 select-none cursor-pointer whitespace-nowrap ${
                  activeTab === "latest-drops"
                    ? "bg-black text-white dark:bg-white dark:text-black font-medium"
                    : "text-black/60 dark:text-zinc-400 hover:text-black dark:hover:text-white"
                }`}
              >
                New Drops <span className="opacity-60 text-[10px]">[{counts.latestDrops}]</span>
              </button>

              <button
                onClick={() => setActiveTab("open-weights")}
                className={`py-1.5 px-2.5 sm:px-3 rounded-md text-xs font-mono tracking-tight transition-colors duration-150 select-none cursor-pointer whitespace-nowrap ${
                  activeTab === "open-weights"
                    ? "bg-black text-white dark:bg-white dark:text-black font-medium"
                    : "text-black/60 dark:text-zinc-400 hover:text-black dark:hover:text-white"
                }`}
              >
                Open Weights <span className="opacity-60 text-[10px]">[{counts.openWeights}]</span>
              </button>

              <button
                onClick={() => setActiveTab("all")}
                className={`py-1.5 px-2.5 sm:px-3 rounded-md text-xs font-mono tracking-tight transition-colors duration-150 select-none cursor-pointer whitespace-nowrap ${
                  activeTab === "all"
                    ? "bg-black text-white dark:bg-white dark:text-black font-medium"
                    : "text-black/60 dark:text-zinc-400 hover:text-black dark:hover:text-white"
                }`}
              >
                All <span className="opacity-60 text-[10px]">[{counts.all}]</span>
              </button>
            </div>

            {/* Terminal Style Search Input */}
            <div className="relative w-full md:w-56 shrink-0">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-[#ff5d2e] pointer-events-none">
                &gt;
              </span>
              <input
                id="models-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="filter index..."
                className="w-full pl-6 pr-7 py-1.5 text-xs font-mono bg-black/[0.025] dark:bg-[#0d0f13] border border-black/10 dark:border-white/[0.08] rounded-md focus:outline-none focus:border-[#ff5d2e] text-black dark:text-white placeholder:text-black/35 dark:placeholder:text-zinc-500 transition-colors duration-150"
              />
              <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-mono text-black/35 dark:text-zinc-400 bg-black/5 dark:bg-white/[0.06] border border-black/10 dark:border-white/[0.08] rounded pointer-events-none select-none">
                /
              </kbd>
            </div>
          </div>
        </TextWithBlur>

        {/* Technical Ledger Manifest */}
        <div className="flex flex-col list-hover-group">
          {filteredModels.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-black/40 dark:text-zinc-500">
              [ NO MODELS MATCHING QUERY &quot;{searchQuery}&quot; ]
            </div>
          ) : (
            filteredModels.map((model, index) => {
              const specializedDrop = getSpecializedDrop(model.companyId, model.id)

              return (
                <TextWithBlur key={model.id} delay={Math.min(index * 20, 200)}>
                  <div
                    onClick={() => setActiveModalModel(model)}
                    className={[
                      "group block py-3 sm:py-3.5 -mx-2 sm:-mx-3 px-2 sm:px-3 rounded-md cursor-pointer transition-colors duration-150",
                      index > 0 ? "border-t border-black/10 dark:border-white/[0.06]" : "",
                      "hover:bg-black/[0.025] dark:hover:bg-white/[0.035]",
                    ].join(" ")}
                  >
                    {/* Mobile Card Row (< sm) */}
                    <div className="sm:hidden">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-baseline gap-2 min-w-0">
                          <span className="font-mono tabular-nums text-xs text-[#ff5d2e]/80 dark:text-[#ff7347] select-none shrink-0 font-medium">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="font-display font-semibold text-base tracking-tight text-black dark:text-white group-hover:text-[#ff5d2e] dark:group-hover:text-[#ff7347] transition-colors duration-150 truncate">
                            {model.name}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono tracking-wider px-1.5 py-0.5 rounded border border-black/10 dark:border-white/[0.08] bg-black/[0.03] dark:bg-white/[0.04] text-black/75 dark:text-zinc-300 shrink-0 whitespace-nowrap font-medium">
                          {model.statusBadge}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-black/50 dark:text-zinc-400 mb-1 pl-5">
                        <span className="uppercase text-black/70 dark:text-zinc-300 font-medium">{model.companyName}</span>
                        <span>•</span>
                        <span>{model.contextWindow.replace(" tokens", "")}</span>
                        <span>•</span>
                        <span>{model.pricing.input === 0 ? "Open" : `$${model.pricing.input}/M`}</span>
                      </div>

                      <p className="text-xs font-light text-black/65 dark:text-zinc-300 leading-relaxed line-clamp-2 pl-5">
                        {model.highlight}
                      </p>

                      {specializedDrop && activeTab === "flagships" && (
                        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-mono text-black/45 dark:text-zinc-400 pl-5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#ff5d2e] shrink-0" />
                          <span className="truncate">
                            Checkpoint:{" "}
                            <span className="text-black/80 dark:text-zinc-200 underline underline-offset-2 font-normal">
                              {specializedDrop.name}
                            </span>{" "}
                            ({specializedDrop.categoryLabel})
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Desktop Ledger Row (sm and up) */}
                    <div className="hidden sm:flex items-baseline gap-5">
                      {/* Monospace Ledger Index */}
                      <span className="font-mono tabular-nums text-xs text-[#ff5d2e]/80 dark:text-[#ff7347] select-none w-6 shrink-0 transition-colors duration-150 group-hover:text-[#ff5d2e] font-medium">
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      {/* Content Column */}
                      <div className="flex-1 min-w-0">
                        {/* Title / Lab / Domain Header */}
                        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 text-base leading-snug mb-1">
                          <span className="font-display font-semibold text-[17px] tracking-tight text-black dark:text-white group-hover:text-[#ff5d2e] dark:group-hover:text-[#ff7347] transition-colors duration-150">
                            {model.name}
                          </span>
                          <span className="text-black/25 dark:text-white/20 select-none font-mono text-xs">/</span>
                          <span className="text-[12px] font-mono uppercase tracking-wider text-black/60 dark:text-zinc-400 font-medium">
                            {model.companyName}
                          </span>
                          <span className="text-black/25 dark:text-white/20 select-none font-mono text-xs">/</span>
                          <span className="text-[12px] font-mono text-black/45 dark:text-zinc-400 truncate max-w-xs">
                            {model.categoryLabel}
                          </span>
                        </div>

                        {/* Highlight Description */}
                        <p className="text-[13.5px] font-normal text-black/70 dark:text-zinc-300 leading-relaxed line-clamp-1 group-hover:text-black/95 dark:group-hover:text-white transition-colors duration-150">
                          {model.highlight}
                        </p>

                        {/* Checkpoint Callout */}
                        {specializedDrop && activeTab === "flagships" && (
                          <div className="mt-1 flex items-center gap-1.5 text-[11px] font-mono text-black/45 dark:text-zinc-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#ff5d2e] shrink-0" />
                            <span className="truncate">
                              Checkpoint drop:{" "}
                              <span className="text-black/80 dark:text-zinc-200 underline underline-offset-2 font-normal">
                                {specializedDrop.name}
                              </span>{" "}
                              ({specializedDrop.categoryLabel})
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Specs Readout */}
                      <div className="flex items-center gap-3 shrink-0 text-right">
                        <span className="hidden md:inline font-mono text-[11px] text-black/45 dark:text-zinc-400">
                          ${model.pricing.input}/${model.pricing.output}
                        </span>
                        <time
                          dateTime={model.releaseDate}
                          className="font-mono text-xs text-black/45 dark:text-zinc-400"
                        >
                          {model.contextWindow.replace(" tokens", "")}
                        </time>

                        <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-black/10 dark:border-white/[0.08] bg-black/[0.03] dark:bg-white/[0.04] text-black/70 dark:text-zinc-300 transition-colors duration-150 group-hover:border-[#ff5d2e]/40 group-hover:text-[#ff5d2e] dark:group-hover:text-[#ff7347]">
                          {model.statusBadge}
                        </span>

                        <ArrowUpRight
                          size={12}
                          className="opacity-25 group-hover:opacity-100 transition-colors duration-150 text-black dark:text-white group-hover:text-[#ff5d2e]"
                        />
                      </div>
                    </div>
                  </div>
                </TextWithBlur>
              )
            })
          )}
          {/* Bottom ledger rule */}
          <div className="border-t border-black/10 dark:border-white/[0.08]" />
        </div>

        {/* Direct Technical Endpoints */}
        <TextWithBlur delay={300}>
          <div className="mt-12 border-t border-black/10 dark:border-white/[0.08] pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[11px] font-mono uppercase tracking-widest text-[#ff5d2e] font-medium flex items-center gap-1.5">
                <Terminal size={12} />
                <span>OPEN TELEMETRY &amp; SYNDICATION</span>
              </h2>
              <span className="text-[10px] font-mono text-black/35 dark:text-zinc-400">
                curl -s https://modelregistry.tirup.in
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono text-black/65 dark:text-zinc-400">
              <a
                href="/api/v1/models"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-2.5 rounded-md border border-black/5 dark:border-white/[0.07] bg-black/[0.02] dark:bg-[#0d0f13] hover:border-[#ff5d2e] hover:-translate-y-0.5 hover:shadow-xs active:scale-[0.96] transition-all duration-200 flex items-center justify-between cursor-pointer"
              >
                <span className="group-hover:text-black dark:group-hover:text-white transition-colors duration-200">GET /api/v1/models</span>
                <ArrowUpRight size={11} className="opacity-40 group-hover:opacity-100 group-hover:text-[#ff5d2e] transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
              <a
                href="/rss.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-2.5 rounded-md border border-black/5 dark:border-white/[0.07] bg-black/[0.02] dark:bg-[#0d0f13] hover:border-[#ff5d2e] hover:-translate-y-0.5 hover:shadow-xs active:scale-[0.96] transition-all duration-200 flex items-center justify-between cursor-pointer"
              >
                <span className="group-hover:text-black dark:group-hover:text-white transition-colors duration-200">GET /rss.xml</span>
                <ArrowUpRight size={11} className="opacity-40 group-hover:opacity-100 group-hover:text-[#ff5d2e] transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
              <a
                href="/llms.txt"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-2.5 rounded-md border border-black/5 dark:border-white/[0.07] bg-black/[0.02] dark:bg-[#0d0f13] hover:border-[#ff5d2e] hover:-translate-y-0.5 hover:shadow-xs active:scale-[0.96] transition-all duration-200 flex items-center justify-between cursor-pointer"
              >
                <span className="group-hover:text-black dark:group-hover:text-white transition-colors duration-200">GET /llms.txt</span>
                <ArrowUpRight size={11} className="opacity-40 group-hover:opacity-100 group-hover:text-[#ff5d2e] transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
              <a
                href="https://github.com/TirupMehta/ModelRegistry/blob/main/CONTRIBUTING.md"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-2.5 rounded-md border border-[#ff5d2e]/30 dark:border-[#ff5d2e]/40 bg-[#ff5d2e]/[0.03] dark:bg-[#ff5d2e]/[0.06] hover:border-[#ff5d2e] hover:-translate-y-0.5 hover:shadow-xs active:scale-[0.96] transition-all duration-200 flex items-center justify-between cursor-pointer"
              >
                <div className="flex flex-col">
                  <span className="font-semibold text-xs text-[#ff5d2e] dark:text-[#ff7347]">CONTRIBUTE (60s)</span>
                  <span className="text-[10px] text-black/45 dark:text-zinc-400">Edit 1 file • Auto-sync</span>
                </div>
                <ArrowUpRight size={13} className="text-[#ff5d2e] opacity-80 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shrink-0" />
              </a>
            </div>
          </div>
        </TextWithBlur>
      </section>

      {/* Technical Spec Inspection Drawer */}
      <ModelDetailsModal
        model={activeModalModel}
        onClose={() => setActiveModalModel(null)}
      />

      {/* Industrial Footer */}
      <footer className="py-6 px-6 text-center border-t border-black/10 dark:border-white/[0.08] max-w-4xl mx-auto w-full">
        <p className="text-[11px] font-mono text-black/50 dark:text-zinc-400">
          © {currentYear} ModelRegistry. The open technical index for frontier AI systems.
        </p>
      </footer>
    </main>
  )
}
