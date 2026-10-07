"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import Header from "@/components/header"
import Footer from "@/components/footer"
import TextWithBlur from "@/components/text-with-blur"
import ModelDetailsModal from "@/components/model-details-modal"
import { modelsData, type ModelItem } from "@/data/models"
import { companies } from "@/data/companies"
import { formatDate } from "@/lib/utils"
import { selectFeedback, tapFeedback, successFeedback } from "@/lib/feedback"
import { ArrowUpRight, Terminal, Copy, Check, X, SearchX } from "lucide-react"

type ViewTab = "flagships" | "latest-drops" | "open-weights" | "visual" | "all"

// New Drops is purely date-driven: models released within this window,
// sorted newest-first. No per-lab flags involved.
const NEW_DROPS_WINDOW_DAYS = 30

function isNewDrop(releaseDate: string, now: number = Date.now()): boolean {
  const t = new Date(releaseDate).getTime()
  if (Number.isNaN(t)) return false
  const diffDays = (now - t) / (1000 * 60 * 60 * 24)
  return diffDays >= 0 && diffDays <= NEW_DROPS_WINDOW_DAYS
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<ViewTab>("flagships")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeModalModel, setActiveModalModel] = useState<ModelItem | null>(null)
  const [curlCopied, setCurlCopied] = useState(false)

  const handleTab = (tab: ViewTab) => {
    // Fire on every tap, even re-tapping the active tab — a button that
    // sometimes silently does nothing feels broken.
    selectFeedback()
    setActiveTab(tab)
  }

  const openModel = (model: ModelItem) => {
    tapFeedback()
    setActiveModalModel(model)
  }

  // URL Deep-Linking via ?model= query parameter (clean, no # hash).
  // Also honors ?q= so the WebSite SearchAction target actually filters.
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
      const q = params.get("q")
      if (q) {
        setSearchQuery(q)
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

  // Filter models based on tab & query.
  // New Drops is a purely datewise feed: released in the last
  // NEW_DROPS_WINDOW_DAYS, newest releaseDate first.
  const filteredModels = useMemo(() => {
    const filtered = modelsData.filter((model) => {
      // Flagships tab is the LLM-frontier landing strip: company flagships
      // except pure video generators (they live under the Visual tab).
      if (activeTab === "flagships" && (!model.isCompanyFlagship || model.category === "video")) return false
      if (activeTab === "latest-drops" && !isNewDrop(model.releaseDate)) return false
      if (activeTab === "open-weights" && !model.openWeights) return false
      if (activeTab === "visual" && model.category !== "image" && model.category !== "video") return false

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

    if (activeTab === "latest-drops") {
      filtered.sort((a, b) => b.releaseDate.localeCompare(a.releaseDate))
    }

    return filtered
  }, [activeTab, searchQuery])

  // Filter counters
  const counts = useMemo(() => {
    return {
      flagships: modelsData.filter((m) => m.isCompanyFlagship && m.category !== "video").length,
      latestDrops: modelsData.filter((m) => isNewDrop(m.releaseDate)).length,
      openWeights: modelsData.filter((m) => m.openWeights).length,
      visual: modelsData.filter((m) => m.category === "image" || m.category === "video").length,
      all: modelsData.length,
    }
  }, [])

  // Check if a flagship has a specialized newest drop (newest by releaseDate)
  const getSpecializedDrop = (companyId: string, currentId: string) => {
    return modelsData
      .filter(
        (m) => m.companyId === companyId && m.isLatestCheckpoint && m.id !== currentId
      )
      .sort((a, b) => b.releaseDate.localeCompare(a.releaseDate))[0]
  }

  // Crawler-facing copy stays accurate as labs and releases are added.
  const labNames = Object.values(companies)
    .map((c) => c.name)
    .join(", ")
  const newestReleaseMonth = (() => {
    const newest = [...modelsData].sort((a, b) =>
      b.releaseDate.localeCompare(a.releaseDate)
    )[0]
    if (!newest) return ""
    return new Date(`${newest.releaseDate.slice(0, 7)}-02`).toLocaleDateString(
      "en-US",
      { month: "long", year: "numeric" }
    )
  })()

  return (
    <main className="relative min-h-screen">
      <Header />

      {/*
        SSR Knowledge Vault for AI Answer Engines & Web Crawlers
      */}
      <noscript>
        <article style={{ maxWidth: "48rem", margin: "0 auto", padding: "2rem 1.5rem", fontFamily: "Plus Jakarta Sans, system-ui, sans-serif", lineHeight: 1.6, color: "#111" }}>
          <h1>ModelRegistry — Frontier AI Model Telemetry Index</h1>
          <p>
            Official open machine-readable registry of premier frontier artificial intelligence models across {labNames}.
          </p>
          <h2>Active Heavyweight Flagships ({newestReleaseMonth})</h2>
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
        <div className="space-y-4 text-base md:text-[17px] font-normal text-black/75 dark:text-zinc-300 leading-relaxed max-w-3xl mb-8">
          <TextWithBlur delay={120}>
            <p>
              ModelRegistry is an open technical ledger indexing primary foundation model architectures alongside specialized research checkpoints across leading AI laboratories.
            </p>
          </TextWithBlur>

          {/* Quick Terminal & Developer Strip */}
          <div className="flex items-center justify-between gap-2 sm:gap-3 pt-1 text-xs font-sans text-black/60 dark:text-zinc-400 w-full">
            <button
              onClick={() => {
                navigator.clipboard.writeText("curl -s https://modelregistry.tirup.in/latest")
                successFeedback()
                setCurlCopied(true)
                setTimeout(() => setCurlCopied(false), 2000)
              }}
              className="group inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-md border border-black/10 dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.03] hover:bg-black/[0.04] dark:hover:bg-white/[0.05] hover:border-black/25 dark:hover:border-white/20 active:scale-[0.985] transition-[color,background-color,border-color,transform] duration-150 cursor-pointer select-none text-[11px] sm:text-xs min-w-0 max-w-full flex-1 sm:flex-none"
              title="Copy terminal CLI query"
            >
              <Terminal size={12} className="text-[#ff5d2e] shrink-0" />
              <span className="text-black/80 dark:text-zinc-200 truncate min-w-0">curl -s modelregistry.tirup.in/latest</span>
              {curlCopied ? (
                <Check size={12} className="text-[#00e599] shrink-0" />
              ) : (
                <Copy size={11} className="opacity-40 group-hover:opacity-100 transition-opacity shrink-0" />
              )}
            </button>

            <a
              href="https://github.com/TirupMehta/ModelRegistry/blob/main/CONTRIBUTING.md"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto hover:text-[#ff5d2e] transition-colors inline-flex items-center gap-1 font-medium text-[#ff5d2e] text-[11px] sm:text-xs shrink-0"
            >
              <span>+ Add Model (60s)</span>
              <ArrowUpRight size={10} />
            </a>
          </div>
        </div>

        {/* View Switcher & Search */}
        <TextWithBlur delay={180}>
          <div className="mb-2 flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Unified Segmented Filter Track — grid-cols-5 so the five tabs
                always fill the track exactly on every screen width (no
                trailing blank space, no squeeze, no scroll). */}
            <div className="grid grid-cols-5 md:flex md:items-center p-1 rounded-xl bg-black/[0.035] dark:bg-[#101318] border border-black/10 dark:border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] w-full md:w-auto gap-0.5">
              <button
                onClick={() => handleTab("flagships")}
                className={`min-w-0 md:flex-none py-2 md:py-1.5 px-1 md:px-3 rounded-lg text-[10px] md:text-xs font-sans tracking-tight transition-all duration-150 select-none cursor-pointer truncate md:overflow-visible ${
                  activeTab === "flagships"
                    ? "bg-black text-white dark:bg-white dark:text-black font-medium shadow-sm"
                    : "text-black/60 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
                }`}
              >
                Flagships <span className="hidden sm:inline opacity-60 tabular-nums text-[11px]">{counts.flagships}</span>
              </button>

              <button
                onClick={() => handleTab("latest-drops")}
                title={`Released in the last ${NEW_DROPS_WINDOW_DAYS} days, newest first`}
                className={`min-w-0 md:flex-none py-2 md:py-1.5 px-1 md:px-3 rounded-lg text-[10px] md:text-xs font-sans tracking-tight transition-all duration-150 select-none cursor-pointer truncate md:overflow-visible ${
                  activeTab === "latest-drops"
                    ? "bg-black text-white dark:bg-white dark:text-black font-medium shadow-sm"
                    : "text-black/60 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
                }`}
              >
                New Drops <span className="hidden sm:inline opacity-60 tabular-nums text-[11px]">{counts.latestDrops}</span>
              </button>

              <button
                onClick={() => handleTab("open-weights")}
                className={`min-w-0 md:flex-none py-2 md:py-1.5 px-1 md:px-3 rounded-lg text-[10px] md:text-xs font-sans tracking-tight transition-all duration-150 select-none cursor-pointer truncate md:overflow-visible ${
                  activeTab === "open-weights"
                    ? "bg-black text-white dark:bg-white dark:text-black font-medium shadow-sm"
                    : "text-black/60 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
                }`}
              >
                <span className="sm:hidden">Open</span>
                <span className="hidden sm:inline">Open Weights</span> <span className="hidden sm:inline opacity-60 tabular-nums text-[11px]">{counts.openWeights}</span>
              </button>

              <button
                onClick={() => handleTab("visual")}
                className={`min-w-0 md:flex-none py-2 md:py-1.5 px-1 md:px-3 rounded-lg text-[10px] md:text-xs font-sans tracking-tight transition-all duration-150 select-none cursor-pointer truncate md:overflow-visible ${
                  activeTab === "visual"
                    ? "bg-black text-white dark:bg-white dark:text-black font-medium shadow-sm"
                    : "text-black/60 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
                }`}
              >
                Visual <span className="hidden sm:inline opacity-60 tabular-nums text-[11px]">{counts.visual}</span>
              </button>

              <button
                onClick={() => handleTab("all")}
                className={`min-w-0 md:flex-none py-2 md:py-1.5 px-1 md:px-3 rounded-lg text-[10px] md:text-xs font-sans tracking-tight transition-all duration-150 select-none cursor-pointer truncate md:overflow-visible ${
                  activeTab === "all"
                    ? "bg-black text-white dark:bg-white dark:text-black font-medium shadow-sm"
                    : "text-black/60 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
                }`}
              >
                All <span className="hidden sm:inline opacity-60 tabular-nums text-[11px]">{counts.all}</span>
              </button>
            </div>

            {/* Terminal Style Search Input */}
            <div className="relative w-full md:w-60 shrink-0">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-[#ff5d2e] pointer-events-none select-none">
                &gt;
              </span>
              <input
                id="models-search-input"
                type="text"
                aria-label="Filter model index"
                name="model-filter"
                autoComplete="off"
                spellCheck={false}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="filter index..."
                className="w-full pl-6 pr-12 py-2 text-xs font-sans bg-white dark:bg-[#0d0f13] border border-black/10 dark:border-white/[0.08] rounded-lg shadow-sm focus:outline-none focus:border-[#ff5d2e]/60 focus:ring-2 focus:ring-[#ff5d2e]/15 text-black dark:text-white placeholder:text-black/35 dark:placeholder:text-zinc-500 transition-all duration-150"
              />
              {searchQuery ? (
                <button
                  onClick={() => {
                    tapFeedback()
                    setSearchQuery("")
                  }}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-5 h-5 rounded-md text-black/40 hover:text-black dark:text-zinc-500 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X size={12} />
                </button>
              ) : (
                <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center justify-center min-w-5 px-1.5 py-0.5 text-[11px] font-sans text-black/35 dark:text-zinc-400 bg-black/5 dark:bg-white/[0.06] border border-black/10 dark:border-white/[0.08] rounded-md pointer-events-none select-none">
                  /
                </kbd>
              )}
            </div>
          </div>
          <div className="mb-5 flex items-center justify-between border-b border-black/10 dark:border-white/[0.08] pb-3 pt-1">
            <p className="text-[11px] font-sans tabular-nums tracking-wide text-black/40 dark:text-zinc-500">
              {filteredModels.length} {filteredModels.length === 1 ? "model" : "models"} shown
              {searchQuery.trim() && (
                <span> for &ldquo;{searchQuery.trim()}&rdquo;</span>
              )}
            </p>
            <p className="hidden sm:block text-[11px] font-mono text-black/30 dark:text-zinc-600 select-none">
              sorted by relevance
            </p>
          </div>
        </TextWithBlur>

        {/* Technical Ledger Manifest */}
        <div className="flex flex-col gap-2.5 sm:gap-0 list-hover-group sm:divide-y sm:divide-black/10 sm:dark:divide-white/[0.06]">
          {filteredModels.length === 0 ? (
            <div className="py-14 px-6 text-center rounded-xl border border-dashed border-black/15 dark:border-white/15 bg-black/[0.015] dark:bg-white/[0.02]">
              <div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-black/40 dark:text-zinc-400">
                <SearchX size={16} />
              </div>
              <p className="text-sm font-medium text-black dark:text-white">
                {activeTab === "latest-drops" && !searchQuery.trim()
                  ? "No new drops in the last 30 days"
                  : "No models match your filter"}
              </p>
              <p className="mt-1 text-xs font-sans text-black/50 dark:text-zinc-400">
                {searchQuery.trim()
                  ? `Nothing found for "${searchQuery.trim()}". Try a lab, model, or capability.`
                  : "Try a different tab — the full index is one click away."}
              </p>
              {(searchQuery.trim() || activeTab !== "all") && (
                <button
                  onClick={() => {
                    tapFeedback()
                    setSearchQuery("")
                    setActiveTab("all")
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-black dark:text-white hover:border-[#ff5d2e]/50 hover:text-[#ff5d2e] active:scale-[0.98] transition-all cursor-pointer"
                >
                  <X size={12} />
                  Clear filter
                </button>
              )}
            </div>
          ) : (
            filteredModels.map((model, index) => {
              const specializedDrop = getSpecializedDrop(model.companyId, model.id)

              return (
                <TextWithBlur key={model.id} delay={Math.min(index * 20, 200)}>
                  <div
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
                    className={[
                      "group block cursor-pointer transition-all duration-150 active:scale-[0.985] sm:active:scale-100",
                      // Mobile: true card
                      "rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#0e1014] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)] active:border-[#ff5d2e]/50",
                      // Desktop: ledger row reset
                      "sm:rounded-xl sm:border-0 sm:shadow-none sm:bg-transparent sm:dark:bg-transparent sm:p-0 sm:mx-0 sm:px-3 sm:py-4 sm:active:border-transparent",
                      "sm:hover:bg-black/[0.025] sm:dark:hover:bg-white/[0.035] sm:hover:shadow-sm",
                    ].join(" ")}
                  >
                    {/* Mobile Card (< sm) */}
                    <div className="sm:hidden">
                      {/* Lab + date */}
                      <div className="flex items-center gap-1.5 text-[11px] font-sans mb-1.5 min-w-0">
                        <span
                          className="w-2 h-2 rounded-[3px] ring-1 ring-black/10 dark:ring-white/10 shrink-0"
                          style={{
                            backgroundColor:
                              companies[model.companyId]?.accentColor || "#ff5d2e",
                          }}
                        />
                        <span className="uppercase tracking-[0.08em] font-semibold text-black/60 dark:text-zinc-300 truncate">
                          {model.companyName}
                        </span>
                        <time
                          dateTime={model.releaseDate}
                          className="ml-auto tabular-nums text-black/40 dark:text-zinc-500 shrink-0"
                        >
                          {formatDate(model.releaseDate)}
                        </time>
                      </div>

                      {/* Title + badge */}
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="font-display font-semibold text-[17px] leading-snug tracking-tight text-black dark:text-white min-w-0">
                          {model.name}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-sans px-1.5 py-0.5 rounded-md border border-black/10 dark:border-white/[0.08] bg-black/[0.03] dark:bg-white/[0.04] text-black/70 dark:text-zinc-300 shrink-0 whitespace-nowrap font-medium mt-0.5">
                          {model.openWeights && (
                            <span className="w-1 h-1 rounded-full bg-emerald-500 shrink-0" />
                          )}
                          {model.statusBadge}
                        </span>
                      </div>

                      <p className="text-[13px] font-normal text-black/60 dark:text-zinc-400 leading-relaxed line-clamp-2">
                        {model.highlight}
                      </p>

                      {/* Spec strip */}
                      <div className="mt-3 grid grid-cols-3 divide-x divide-black/[0.06] dark:divide-white/[0.06] rounded-xl bg-black/[0.025] dark:bg-white/[0.03] py-2">
                        <div className="px-2.5 min-w-0">
                          <p className="text-[9px] font-sans font-semibold uppercase tracking-[0.12em] text-black/40 dark:text-zinc-500">
                            Input / 1M
                          </p>
                          <p className="text-xs font-sans font-semibold tabular-nums text-black dark:text-white mt-0.5 truncate">
                            {model.pricing.input === 0 ? "Free" : `$${model.pricing.input}`}
                          </p>
                        </div>
                        <div className="px-2.5 min-w-0">
                          <p className="text-[9px] font-sans font-semibold uppercase tracking-[0.12em] text-black/40 dark:text-zinc-500">
                            Context
                          </p>
                          <p className="text-xs font-sans font-semibold tabular-nums text-black dark:text-white mt-0.5 truncate">
                            {model.contextWindow.replace(" tokens", "")}
                          </p>
                        </div>
                        <div className="px-2.5 min-w-0">
                          <p className="text-[9px] font-sans font-semibold uppercase tracking-[0.12em] text-black/40 dark:text-zinc-500">
                            Access
                          </p>
                          <p className="text-xs font-sans font-semibold text-black dark:text-white mt-0.5 truncate">
                            {model.openWeights ? "Open" : "API"}
                          </p>
                        </div>
                      </div>

                      {specializedDrop && activeTab === "flagships" && (
                        <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-sans text-black/45 dark:text-zinc-400">
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
                    <div className="hidden sm:flex items-baseline gap-4">
                      {/* Monospace Ledger Index — compact */}
                      <span className="font-mono tabular-nums text-[10px] text-black/30 dark:text-zinc-600 select-none w-4 shrink-0 transition-colors duration-150 group-hover:text-[#ff5d2e]">
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      {/* Content Column */}
                      <div className="flex-1 min-w-0">
                        {/* Title / Lab / Domain Header */}
                        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 text-base leading-snug mb-1">
                          <span className="font-display font-semibold text-[17px] tracking-tight text-black dark:text-white group-hover:text-[#ff5d2e] dark:group-hover:text-[#ff7347] transition-colors duration-150">
                            {model.name}
                          </span>
                          <span className="text-black/25 dark:text-white/20 select-none font-sans text-xs">/</span>
                          <span className="text-[12px] font-sans uppercase tracking-wider text-black/60 dark:text-zinc-400 font-medium">
                            {model.companyName}
                          </span>
                          <span className="text-black/25 dark:text-white/20 select-none font-sans text-xs">/</span>
                          <span className="text-[12px] font-sans text-black/45 dark:text-zinc-400 truncate max-w-xs">
                            {model.categoryLabel}
                          </span>
                        </div>

                        {/* Highlight Description */}
                        <p className="text-[13.5px] font-normal text-black/60 dark:text-zinc-400 leading-relaxed line-clamp-1 group-hover:text-black/90 dark:group-hover:text-zinc-100 transition-colors duration-150">
                          {model.highlight}
                        </p>

                        {/* Checkpoint Callout */}
                        {specializedDrop && activeTab === "flagships" && (
                          <div className="mt-1 flex items-center gap-1.5 text-[11px] font-sans text-black/45 dark:text-zinc-400">
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
                      <div className="flex items-center gap-2.5 shrink-0 text-right">
                        <span className="hidden md:inline font-sans text-[11px] text-black/40 dark:text-zinc-500 tabular-nums">
                          ${model.pricing.input}/${model.pricing.output}
                        </span>
                        <time
                          dateTime={model.releaseDate}
                          title={formatDate(model.releaseDate)}
                          className="font-sans text-xs text-black/45 dark:text-zinc-400 tabular-nums whitespace-nowrap"
                        >
                          {formatDate(model.releaseDate)}
                        </time>
                        <span className="hidden lg:inline font-sans text-[11px] text-black/40 dark:text-zinc-500 tabular-nums whitespace-nowrap">
                          {model.contextWindow.replace(" tokens", "")}
                        </span>

                        <span className="inline-flex items-center gap-1.5 text-[11px] font-sans px-2 py-1 rounded-md border border-black/10 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] text-black/70 dark:text-zinc-300 shadow-sm transition-all duration-150 group-hover:border-[#ff5d2e]/50 group-hover:text-[#ff5d2e] dark:group-hover:text-[#ff7347] group-hover:shadow-md group-hover:shadow-[#ff5d2e]/10">
                          {model.openWeights && (
                            <span className="w-1 h-1 rounded-full bg-emerald-500 shrink-0" />
                          )}
                          {model.statusBadge}
                        </span>

                        <ArrowUpRight
                          size={13}
                          className="opacity-30 group-hover:opacity-100 group-hover:translate-x-px group-hover:-translate-y-px transition-all duration-150 text-black dark:text-white group-hover:text-[#ff5d2e]"
                        />
                      </div>
                    </div>
                  </div>
                </TextWithBlur>
              )
            })
          )}
          {/* Bottom ledger rule (desktop only — mobile uses cards) */}
          <div className="hidden sm:block border-t border-black/10 dark:border-white/[0.08]" />
        </div>

        {/* Direct Technical Endpoints */}
        <TextWithBlur delay={300}>
          <div className="mt-12 rounded-2xl border border-black/10 dark:border-white/[0.08] bg-white/[0.6] dark:bg-white/[0.02] p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[11px] font-sans uppercase tracking-[0.14em] text-black/50 dark:text-zinc-400 font-semibold flex items-center gap-1.5">
                <Terminal size={12} className="text-[#ff5d2e]" />
                <span>Open telemetry &amp; syndication</span>
              </h2>
              <span className="hidden sm:block text-[11px] font-mono tabular-nums text-black/30 dark:text-zinc-600 select-none">
                curl -s modelregistry.tirup.in
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-xs font-sans">
              <a
                href="/api/v1/models"
                target="_blank"
                rel="noopener noreferrer"
                className="card-lift group p-3 rounded-xl border border-black/10 dark:border-white/[0.08] bg-black/[0.02] dark:bg-[#0c0e12] hover:bg-white dark:hover:bg-[#13161c] hover:border-[#ff5d2e]/40 active:scale-[0.98] transition-all duration-150 ease-out flex items-center justify-between gap-2 cursor-pointer select-none"
              >
                <span className="font-mono text-xs sm:text-[13px] text-black/70 dark:text-zinc-300 group-hover:text-black dark:group-hover:text-white transition-colors duration-150 truncate min-w-0">
                  /api/v1/models
                </span>
                <ArrowUpRight
                  size={12}
                  className="text-black/30 dark:text-zinc-500 group-hover:text-[#ff5d2e] dark:group-hover:text-[#ff7347] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-150 ease-out shrink-0"
                />
              </a>

              <a
                href="/rss.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="card-lift group p-3 rounded-xl border border-black/10 dark:border-white/[0.08] bg-black/[0.02] dark:bg-[#0c0e12] hover:bg-white dark:hover:bg-[#13161c] hover:border-[#ff5d2e]/40 active:scale-[0.98] transition-all duration-150 ease-out flex items-center justify-between gap-2 cursor-pointer select-none"
              >
                <span className="font-mono text-xs sm:text-[13px] text-black/70 dark:text-zinc-300 group-hover:text-black dark:group-hover:text-white transition-colors duration-150 truncate min-w-0">
                  /rss.xml
                </span>
                <ArrowUpRight
                  size={12}
                  className="text-black/30 dark:text-zinc-500 group-hover:text-[#ff5d2e] dark:group-hover:text-[#ff7347] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-150 ease-out shrink-0"
                />
              </a>

              <a
                href="/llms.txt"
                target="_blank"
                rel="noopener noreferrer"
                className="card-lift group p-3 rounded-xl border border-black/10 dark:border-white/[0.08] bg-black/[0.02] dark:bg-[#0c0e12] hover:bg-white dark:hover:bg-[#13161c] hover:border-[#ff5d2e]/40 active:scale-[0.98] transition-all duration-150 ease-out flex items-center justify-between gap-2 cursor-pointer select-none"
              >
                <span className="font-mono text-xs sm:text-[13px] text-black/70 dark:text-zinc-300 group-hover:text-black dark:group-hover:text-white transition-colors duration-150 truncate min-w-0">
                  /llms.txt
                </span>
                <ArrowUpRight
                  size={12}
                  className="text-black/30 dark:text-zinc-500 group-hover:text-[#ff5d2e] dark:group-hover:text-[#ff7347] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-150 ease-out shrink-0"
                />
              </a>

              <a
                href="https://github.com/TirupMehta/ModelRegistry/blob/main/CONTRIBUTING.md"
                target="_blank"
                rel="noopener noreferrer"
                className="card-lift group p-3 rounded-xl border border-black dark:border-white bg-black dark:bg-white hover:bg-[#ff5d2e] dark:hover:bg-[#ff5d2e] hover:border-[#ff5d2e] active:scale-[0.98] transition-all duration-150 ease-out flex items-center justify-between gap-2 cursor-pointer select-none shadow-sm"
              >
                <div className="flex flex-col min-w-0 pr-1">
                  <span className="font-semibold text-xs text-white dark:text-black group-hover:text-white transition-colors">
                    Contribute · 60s
                  </span>
                  <span className="font-mono text-[10px] text-white/60 dark:text-black/60 group-hover:text-white/80 truncate">
                    1 file · auto-sync
                  </span>
                </div>
                <ArrowUpRight
                  size={13}
                  className="text-white dark:text-black group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-150 ease-out shrink-0"
                />
              </a>
            </div>
          </div>
        </TextWithBlur>

        {/* Latest flagship by lab — compact quick-answer index */}
        <TextWithBlur delay={320}>
          <div className="mt-12">
            <div className="flex items-baseline justify-between gap-3 mb-2">
              <h2 className="text-[11px] font-sans uppercase tracking-[0.14em] text-black/50 dark:text-zinc-400 font-semibold">
                Latest flagship by lab
              </h2>
              <Link
                href="/companies"
                className="text-[11px] font-sans font-medium text-[#ff5d2e] dark:text-[#ff7347] hover:underline underline-offset-2 shrink-0"
              >
                All labs
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 border-y border-black/10 dark:border-white/[0.08]">
              {Object.values(companies).map((company) => {
                const flagship = modelsData.find(
                  (m) => m.companyId === company.id && m.isCompanyFlagship
                )
                if (!flagship) return null
                const stamp = new Date(
                  `${flagship.releaseDate.slice(0, 7)}-02`
                ).toLocaleDateString("en-US", { month: "short", year: "numeric" })
                return (
                  <div
                    key={company.id}
                    className="flex items-baseline gap-2 py-2 border-b border-black/5 dark:border-white/[0.05] text-[13px] font-sans min-w-0"
                  >
                    <Link
                      href={`/companies/${company.id}`}
                      className="text-black/50 dark:text-zinc-400 hover:text-[#ff5d2e] dark:hover:text-[#ff7347] transition-colors duration-150 shrink-0"
                    >
                      {company.shortName}
                    </Link>
                    <span className="text-black/20 dark:text-white/20 select-none">→</span>
                    <Link
                      href={`/models/${flagship.id}`}
                      className="font-medium tracking-tight text-black dark:text-white hover:text-[#ff5d2e] dark:hover:text-[#ff7347] transition-colors duration-150 truncate"
                    >
                      {flagship.name}
                    </Link>
                    <span className="ml-auto text-[11px] tabular-nums text-black/35 dark:text-zinc-500 shrink-0">
                      {stamp}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </TextWithBlur>
      </section>

      {/* Technical Spec Inspection Drawer */}
      <ModelDetailsModal
        model={activeModalModel}
        onClose={() => setActiveModalModel(null)}
      />

      <Footer />
    </main>
  )
}
