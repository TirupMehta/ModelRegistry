"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import TextWithBlur from "@/components/text-with-blur"
import ModelDetailsModal from "@/components/model-details-modal"
import { modelsData, type ModelItem } from "@/data/models"
import { companies } from "@/data/companies"
import { datasetRevision } from "@/data/revision"
import { formatDate } from "@/lib/utils"
import { folioFor, newestReleaseMonth } from "@/lib/registry"
import { selectFeedback, tapFeedback, successFeedback } from "@/lib/feedback"
import { ArrowUpRight, Terminal, Copy, Check, X, Search, SearchX } from "lucide-react"
import ModelFilterControls from "@/components/model-filter-controls"
import { DEFAULT_MODEL_FILTERS, filterModels, type ModelFilters } from "@/lib/model-filters"

type ViewTab = "flagships" | "latest-drops" | "open-weights" | "visual" | "all"

// New Drops is purely date-driven: models released within this window,
// sorted newest-first. No per-lab flags involved.
const NEW_DROPS_WINDOW_DAYS = 30

// The index is a scanning surface; the full summary lives on the model page.
// Truncate in the string (not with a CSS clamp) so the row stays one line and
// the text measured is the text painted.
function summarize(text: string, max = 84): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), 60)).trimEnd()}…`
}

function isNewDrop(releaseDate: string, now: number = Date.now()): boolean {
  const t = new Date(releaseDate).getTime()
  if (Number.isNaN(t)) return false
  const diffDays = (now - t) / (1000 * 60 * 60 * 24)
  return diffDays >= 0 && diffDays <= NEW_DROPS_WINDOW_DAYS
}

export default function HomeClient({ quickAnswers }: { quickAnswers?: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<ViewTab>("flagships")
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState<ModelFilters>(DEFAULT_MODEL_FILTERS)
  const [activeModalModel, setActiveModalModel] = useState<ModelItem | null>(null)
  const modalFolio = folioFor(activeModalModel, modelsData)
  const [curlCopied, setCurlCopied] = useState(false)

  const handleTab = (tab: ViewTab) => {
    // Fire on every tap, even re-tapping the active tab - a button that
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
        const matchModality = model.modalities.some((modality) => modality.toLowerCase().includes(q))
        return matchName || matchCompany || matchHighlight || matchCategory || matchModality
      }

      return true
    })

    const refined = filterModels(filtered, filters)
    if (filters.sort === "default" && activeTab === "flagships") {
      refined.sort((a, b) => Object.keys(companies).indexOf(a.companyId) - Object.keys(companies).indexOf(b.companyId))
    }
    if (filters.sort === "default" && activeTab === "latest-drops") {
      refined.sort((a, b) => b.releaseDate.localeCompare(a.releaseDate))
    }

    return refined
  }, [activeTab, searchQuery, filters])

  // The hero states how much of the dataset can be traced back to a source.
  const sourceCount = useMemo(
    () => modelsData.reduce((total, model) => total + (model.sources?.length ?? 0), 0),
    []
  )

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
  const newestMonth = newestReleaseMonth(modelsData)
  const newestReleaseMonthLabel = newestMonth
    ? new Date(`${newestMonth}-02`).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : ""

  return (
    <>
      <noscript>
        <article style={{ maxWidth: "48rem", margin: "0 auto", padding: "2rem 1.5rem", fontFamily: "var(--font-sans), system-ui, sans-serif", lineHeight: 1.6, color: "var(--fg)" }}>
          <h1>ModelRegistry - Frontier AI Model Telemetry Index</h1>
          <p>
            Official open machine-readable registry of premier frontier artificial intelligence models across {labNames}.
          </p>
          <h2>Active Heavyweight Flagships ({newestReleaseMonthLabel})</h2>
          <ul>
            {modelsData.map((m) => (
              <li key={m.id}>
                <strong>{m.name}</strong> ({m.companyName}) - {m.categoryLabel}. Released: {m.releaseDate}. Context: {m.contextWindow}. Parameters: {m.parameters}. Status: {m.statusBadge}. Summary: {m.highlight}
              </li>
            ))}
          </ul>
        </article>
      </noscript>

      <section className="section max-w-4xl mx-auto w-full px-4 sm:px-6 md:px-20 pb-0">
        {/* Hero: the claim, one sentence, then the provenance that separates a
            cited registry from another list of models. */}
        <div>
          <h1 className="max-w-[20ch] font-display text-[34px] sm:text-[44px] md:text-[52px] font-semibold leading-[1.05] tracking-[-0.03em] text-black dark:text-white">
            Every frontier model, with its sources.
          </h1>
          <p className="mt-3 max-w-[52ch] text-[17px] font-normal leading-[1.55] text-black/70 sm:mt-4 sm:text-[19px] md:text-[20px] dark:text-zinc-300">
            Specs, prices and context limits for {modelsData.length} models. Each record names the lab page it came from and the date it was checked.
          </p>
          {quickAnswers}

          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-y border-black/10 py-4 sm:grid-cols-3 md:mt-7 dark:border-white/[0.08]">
            <div className="min-w-0">
              <dt className="text-xs text-black/50 dark:text-zinc-500">Labs indexed</dt>
              <dd className="mt-1 font-display text-xl font-semibold tabular-nums text-black dark:text-white">
                {Object.keys(companies).length}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs text-black/50 dark:text-zinc-500">Primary sources cited</dt>
              <dd className="mt-1 font-display text-xl font-semibold tabular-nums text-black dark:text-white">
                {sourceCount}
              </dd>
            </div>
            <div className="col-span-2 min-w-0 sm:col-span-1">
              <dt className="text-xs text-black/50 dark:text-zinc-500">Last revised</dt>
              <dd className="mt-1 font-display text-xl font-semibold text-black dark:text-white">
                {formatDate(datasetRevision.revisedAt)}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="section max-w-4xl mx-auto w-full px-4 sm:px-6 md:px-20 pb-20">
        {/* Index: search, filters, then the ledger itself. */}
        <TextWithBlur delay={180}>
          <div className="mb-2 mt-8 flex flex-col gap-3 md:mt-10 lg:flex-row lg:items-center lg:justify-between">
            {/* Unified Segmented Filter Track - grid-cols-5 so the five tabs
                always fill the track exactly on every screen width (no
                trailing blank space, no squeeze, no scroll). */}
            <div className="grid h-9 w-full grid-cols-5 gap-0.5 rounded-lg border border-[var(--field-edge)] bg-[var(--surface-inset)] p-0.5 lg:flex lg:w-auto lg:items-center">
              <button
                onClick={() => handleTab("flagships")}
                className={`h-full min-w-0 md:flex-none px-1 md:px-2.5 rounded-md text-xs font-sans tracking-tight transition-colors duration-150 select-none cursor-pointer truncate md:overflow-visible ${
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
                className={`h-full min-w-0 md:flex-none px-1 md:px-2.5 rounded-md text-xs font-sans tracking-tight transition-colors duration-150 select-none cursor-pointer truncate md:overflow-visible ${
                  activeTab === "latest-drops"
                    ? "bg-black text-white dark:bg-white dark:text-black font-medium shadow-sm"
                    : "text-black/60 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
                }`}
              >
                <span className="sm:hidden">New</span><span className="hidden sm:inline">New Drops</span> <span className="hidden sm:inline opacity-60 tabular-nums text-[11px]">{counts.latestDrops}</span>
              </button>

              <button
                onClick={() => handleTab("open-weights")}
                className={`h-full min-w-0 md:flex-none px-1 md:px-2.5 rounded-md text-xs font-sans tracking-tight transition-colors duration-150 select-none cursor-pointer truncate md:overflow-visible ${
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
                className={`h-full min-w-0 md:flex-none px-1 md:px-2.5 rounded-md text-xs font-sans tracking-tight transition-colors duration-150 select-none cursor-pointer truncate md:overflow-visible ${
                  activeTab === "visual"
                    ? "bg-black text-white dark:bg-white dark:text-black font-medium shadow-sm"
                    : "text-black/60 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
                }`}
              >
                Visual <span className="hidden sm:inline opacity-60 tabular-nums text-[11px]">{counts.visual}</span>
              </button>

              <button
                onClick={() => handleTab("all")}
                className={`h-full min-w-0 md:flex-none px-1 md:px-2.5 rounded-md text-xs font-sans tracking-tight transition-colors duration-150 select-none cursor-pointer truncate md:overflow-visible ${
                  activeTab === "all"
                    ? "bg-black text-white dark:bg-white dark:text-black font-medium shadow-sm"
                    : "text-black/60 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
                }`}
              >
                All <span className="hidden sm:inline opacity-60 tabular-nums text-[11px]">{counts.all}</span>
              </button>
            </div>

            {/* Search: the primary action of the page. */}
            <div className="relative w-full shrink-0 lg:w-64">
              <Search
                size={14}
                aria-hidden="true"
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-black/40 dark:text-zinc-500"
              />
              <input
                id="models-search-input"
                type="search"
                aria-label="Search models or labs"
                name="model-filter"
                autoComplete="off"
                spellCheck={false}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search models or labs"
                className="h-9 w-full rounded-lg border border-[var(--field-edge)] bg-[var(--surface-field)] pl-8 pr-20 text-xs font-sans text-black transition-colors duration-150 placeholder:text-black/45 focus:border-accent-ink focus:outline-none focus:ring-2 focus:ring-accent-ink/20 disabled:cursor-not-allowed disabled:opacity-60 dark:text-white dark:placeholder:text-zinc-400"
              />
              <ModelFilterControls
                filters={filters}
                onChange={setFilters}
                className="absolute right-1 top-1/2 z-30 -translate-y-1/2"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    tapFeedback()
                    setSearchQuery("")
                  }}
                  aria-label="Clear search"
                  className="absolute right-11 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded text-black/40 transition-colors hover:bg-black/[0.06] hover:text-black dark:text-zinc-500 dark:hover:bg-white/[0.08] dark:hover:text-white"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
          <div className="mb-1 flex items-center justify-between border-b border-black/10 dark:border-white/[0.08] pb-3 pt-2">
            <p className="text-xs font-sans tabular-nums text-black/55 dark:text-zinc-400">
              {filteredModels.length} {filteredModels.length === 1 ? "model" : "models"} shown
              {searchQuery.trim() && (
                <span> for &ldquo;{searchQuery.trim()}&rdquo;</span>
              )}
            </p>
          </div>
        </TextWithBlur>

        {/* Technical Ledger Manifest */}
        <div className="list-hover-group flex flex-col gap-2.5 sm:gap-0 lg:divide-y lg:divide-black/10 lg:dark:divide-white/[0.06]">
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
                  : "Try a different tab - the full index is one click away."}
              </p>
              {(searchQuery.trim() || activeTab !== "all" || Object.values(filters).some((value) => value !== "all" && value !== "" && value !== "default")) && (
                <button
                  onClick={() => {
                    tapFeedback()
                    setSearchQuery("")
                    setFilters(DEFAULT_MODEL_FILTERS)
                    setActiveTab("all")
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-black dark:text-white hover:border-accent/50 hover:text-accent-ink active:scale-[0.98] transition-[color,background-color,border-color,opacity,transform,box-shadow] cursor-pointer"
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
                      "group block cursor-pointer transition-colors duration-150 active:scale-[0.985] sm:active:scale-100",
                      // Mobile: true card
                      "rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-[var(--surface-raised)] p-4 shadow-sm active:border-accent/50",
                      // Desktop ledger row only where there is room for the
                      // summary and the specs side by side.
                      "lg:rounded-xl lg:border-0 lg:shadow-none lg:bg-transparent lg:dark:bg-transparent lg:p-0 lg:mx-0 lg:px-3 lg:py-4 lg:active:border-transparent",
                      "lg:hover:bg-black/[0.025] lg:dark:hover:bg-white/[0.035] lg:hover:shadow-sm",
                    ].join(" ")}
                  >
                    {/* Card layout below the wide ledger breakpoint */}
                    <div className="lg:hidden">
                      {/* Lab + date */}
                      <div className="flex items-center gap-1.5 text-[11px] font-sans mb-1.5 min-w-0">
                        <span
                          className="w-2 h-2 rounded-[3px] ring-1 ring-black/10 dark:ring-white/10 shrink-0"
                          style={{
                            backgroundColor:
                              companies[model.companyId]?.accentColor || "rgb(var(--accent-rgb))",
                          }}
                        />
                        <span className="min-w-0 truncate font-semibold text-black/60 dark:text-zinc-300">
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
                          {model.statusBadge}
                        </span>
                      </div>

                      <p className="text-[13px] font-normal text-black/60 dark:text-zinc-400 leading-relaxed line-clamp-2">
                        {summarize(model.highlight)}
                      </p>

                      {/* Spec strip */}
                      <div className="mt-3 grid grid-cols-3 divide-x divide-black/[0.06] dark:divide-white/[0.06] rounded-xl bg-black/[0.025] dark:bg-white/[0.03] py-2">
                        <div className="px-2.5 min-w-0">
                          <p className="text-[10px] font-sans font-medium text-black/50 dark:text-zinc-500">
                            Input / 1M
                          </p>
                          <p className="text-xs font-sans font-semibold tabular-nums text-black dark:text-white mt-0.5 truncate">
                            {model.pricing.input === 0 ? "Free" : `$${model.pricing.input}`}
                          </p>
                        </div>
                        <div className="px-2.5 min-w-0">
                          <p className="text-[10px] font-sans font-medium text-black/50 dark:text-zinc-500">
                            Context
                          </p>
                          <p className="text-xs font-sans font-semibold tabular-nums text-black dark:text-white mt-0.5 truncate">
                            {model.contextWindow.replace(" tokens", "")}
                          </p>
                        </div>
                        <div className="px-2.5 min-w-0">
                          <p className="text-[10px] font-sans font-medium text-black/50 dark:text-zinc-500">
                            Access
                          </p>
                          <p className="text-xs font-sans font-semibold text-black dark:text-white mt-0.5 truncate">
                            {model.openWeights ? "Open" : "API"}
                          </p>
                        </div>
                      </div>

                      {specializedDrop && activeTab === "flagships" && (
                        <div className="mt-2.5 text-xs font-sans text-black/50 dark:text-zinc-400">
                          <span className="block truncate" title={`${specializedDrop.name} (${specializedDrop.categoryLabel})`}>
                            Checkpoint:{" "}
                            <span className="text-black/80 dark:text-zinc-200 underline underline-offset-2 font-normal">
                              {specializedDrop.name}
                            </span>{" "}
                            ({specializedDrop.categoryLabel})
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Desktop Ledger Row (lg and up) */}
                    <div className="hidden items-baseline gap-4 lg:flex">
                      {/* Monospace Ledger Index - compact */}
                      <span className="font-mono tabular-nums text-[11px] text-black/40 dark:text-zinc-600 select-none w-5 shrink-0 transition-colors duration-150 group-hover:text-accent-ink">
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      {/* Content Column */}
                      <div className="flex-1 min-w-0">
                        {/* Title / Lab / Domain Header */}
                        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 text-base leading-snug mb-1">
                          <span className="font-display font-semibold text-[17px] tracking-tight text-black dark:text-white group-hover:text-accent-ink transition-colors duration-150">
                            {model.name}
                          </span>
                          <span className="text-black/25 dark:text-white/20 select-none font-sans text-xs">/</span>
                          <span className="text-xs font-sans text-black/60 dark:text-zinc-400 font-medium">
                            {model.companyName}
                          </span>
                          <span className="text-black/25 dark:text-white/20 select-none font-sans text-xs">/</span>
                          <span className="text-[12px] font-sans text-black/45 dark:text-zinc-400 truncate max-w-xs">
                            {model.categoryLabel}
                          </span>
                        </div>

                        {/* Highlight Description */}
                        <p className="text-sm font-normal leading-relaxed text-black/60 group-hover:text-black/90 dark:text-zinc-400 dark:group-hover:text-zinc-100 transition-colors duration-150">
                          {summarize(model.highlight)}
                        </p>

                        {/* Checkpoint Callout */}
                        {specializedDrop && activeTab === "flagships" && (
                          <div className="mt-1 text-xs font-sans text-black/50 dark:text-zinc-400">
                            <span className="block truncate" title={`${specializedDrop.name} (${specializedDrop.categoryLabel})`}>
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
                        <span className="hidden font-sans text-xs tabular-nums text-black/50 md:inline dark:text-zinc-500">
                          ${model.pricing.input}/${model.pricing.output}
                        </span>
                        <time
                          dateTime={model.releaseDate}
                          title={formatDate(model.releaseDate)}
                          className="font-sans text-xs text-black/45 dark:text-zinc-400 tabular-nums whitespace-nowrap"
                        >
                          {formatDate(model.releaseDate)}
                        </time>
                        <span className="inline-flex items-center gap-1.5 rounded-md border border-black/10 bg-white px-2 py-1 text-xs font-sans text-black/70 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-300">
                          {model.statusBadge}
                        </span>

                        <ArrowUpRight
                          size={13}
                          className="opacity-30 group-hover:opacity-100 group-hover:translate-x-px group-hover:-translate-y-px transition-[color,background-color,border-color,opacity,transform,box-shadow] duration-150 text-black dark:text-white group-hover:text-accent-ink"
                        />
                      </div>
                    </div>
                  </div>
                </TextWithBlur>
              )
            })
          )}
          {/* Bottom ledger rule (desktop only - narrower screens use cards) */}
          <div className="hidden border-t border-black/10 lg:block dark:border-white/[0.08]" />
        </div>

        {/* Direct Technical Endpoints */}
        <TextWithBlur delay={300}>
          <div className="mt-12 rounded-2xl border border-black/10 dark:border-white/[0.08] bg-white/[0.6] dark:bg-white/[0.02] p-4 sm:p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight text-black dark:text-white">
                <Terminal size={16} className="text-accent-ink" />
                <span>Open telemetry and syndication</span>
              </h2>
              <button
                onClick={() => {
                  navigator.clipboard.writeText("curl -s https://modelregistry.tirup.in/latest")
                  successFeedback()
                  setCurlCopied(true)
                  setTimeout(() => setCurlCopied(false), 2000)
                }}
                title="Copy the terminal query"
                className="hidden sm:inline-flex items-center gap-2 rounded-md border border-[var(--field-edge)] px-2.5 py-1.5 text-xs font-mono text-black/70 hover:border-accent hover:text-accent-ink transition-colors duration-150 dark:text-zinc-300"
              >
                <span>curl -s …/latest</span>
                {curlCopied ? (
                  <Check size={12} className="text-good" />
                ) : (
                  <Copy size={12} className="opacity-50" />
                )}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-xs font-sans">
              <a
                href="/api/v1/models"
                target="_blank"
                rel="noopener noreferrer"
                className="card-lift group p-3 rounded-xl border border-black/10 dark:border-white/[0.08] bg-black/[0.02] dark:bg-[var(--surface-sunken)] hover:bg-white dark:hover:bg-[var(--surface-hover)] hover:border-accent/40 active:scale-[0.98] transition-[color,background-color,border-color,opacity,transform,box-shadow] duration-150 ease-out flex items-center justify-between gap-2 cursor-pointer select-none"
              >
                <span className="font-mono text-xs sm:text-[13px] text-black/70 dark:text-zinc-300 group-hover:text-black dark:group-hover:text-white transition-colors duration-150 truncate min-w-0">
                  /api/v1/models
                </span>
                <ArrowUpRight
                  size={12}
                  className="text-black/30 dark:text-zinc-500 group-hover:text-accent-ink group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-[color,background-color,border-color,opacity,transform,box-shadow] duration-150 ease-out shrink-0"
                />
              </a>

              <a
                href="/rss.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="card-lift group p-3 rounded-xl border border-black/10 dark:border-white/[0.08] bg-black/[0.02] dark:bg-[var(--surface-sunken)] hover:bg-white dark:hover:bg-[var(--surface-hover)] hover:border-accent/40 active:scale-[0.98] transition-[color,background-color,border-color,opacity,transform,box-shadow] duration-150 ease-out flex items-center justify-between gap-2 cursor-pointer select-none"
              >
                <span className="font-mono text-xs sm:text-[13px] text-black/70 dark:text-zinc-300 group-hover:text-black dark:group-hover:text-white transition-colors duration-150 truncate min-w-0">
                  /rss.xml
                </span>
                <ArrowUpRight
                  size={12}
                  className="text-black/30 dark:text-zinc-500 group-hover:text-accent-ink group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-[color,background-color,border-color,opacity,transform,box-shadow] duration-150 ease-out shrink-0"
                />
              </a>

              <a
                href="/llms.txt"
                target="_blank"
                rel="noopener noreferrer"
                className="card-lift group p-3 rounded-xl border border-black/10 dark:border-white/[0.08] bg-black/[0.02] dark:bg-[var(--surface-sunken)] hover:bg-white dark:hover:bg-[var(--surface-hover)] hover:border-accent/40 active:scale-[0.98] transition-[color,background-color,border-color,opacity,transform,box-shadow] duration-150 ease-out flex items-center justify-between gap-2 cursor-pointer select-none"
              >
                <span className="font-mono text-xs sm:text-[13px] text-black/70 dark:text-zinc-300 group-hover:text-black dark:group-hover:text-white transition-colors duration-150 truncate min-w-0">
                  /llms.txt
                </span>
                <ArrowUpRight
                  size={12}
                  className="text-black/30 dark:text-zinc-500 group-hover:text-accent-ink group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-[color,background-color,border-color,opacity,transform,box-shadow] duration-150 ease-out shrink-0"
                />
              </a>

              <a
                href="https://github.com/TirupMehta/ModelRegistry/blob/main/CONTRIBUTING.md"
                target="_blank"
                rel="noopener noreferrer"
                className="card-lift group p-3 rounded-xl border border-black dark:border-white bg-black dark:bg-white hover:bg-accent dark:hover:bg-accent hover:border-accent active:scale-[0.98] transition-[color,background-color,border-color,opacity,transform,box-shadow] duration-150 ease-out flex items-center justify-between gap-2 cursor-pointer select-none shadow-sm"
              >
                <div className="flex flex-col min-w-0 pr-1">
                  <span className="font-semibold text-xs text-white dark:text-black group-hover:text-white transition-colors">
                    Contribute in 60s
                  </span>
                  <span className="truncate text-[11px] text-white/60 dark:text-black/60 group-hover:text-white/80">
                    One file, auto-synced
                  </span>
                </div>
                <ArrowUpRight
                  size={13}
                  className="text-white dark:text-black group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-[color,background-color,border-color,opacity,transform,box-shadow] duration-150 ease-out shrink-0"
                />
              </a>
            </div>
          </div>
        </TextWithBlur>

        {/* Latest flagship by lab - compact quick-answer index */}
        <TextWithBlur delay={320}>
          <div className="mt-12">
            <div className="flex items-baseline justify-between gap-3 mb-2">
              <h2 className="font-display text-xl font-semibold tracking-tight text-black dark:text-white">
                Latest flagship by lab
              </h2>
              <Link
                href="/companies"
                className="text-[11px] font-sans font-medium text-accent-ink hover:underline underline-offset-2 shrink-0"
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
                      className="text-black/50 dark:text-zinc-400 hover:text-accent-ink transition-colors duration-150 shrink-0"
                    >
                      {company.shortName}
                    </Link>
                    <span className="text-black/20 dark:text-white/20 select-none">→</span>
                    <Link
                      href={`/models/${flagship.id}`}
                      className="font-medium tracking-tight text-black dark:text-white hover:text-accent-ink transition-colors duration-150 truncate"
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
        folio={modalFolio.folio}
        folioId={modalFolio.folioId}
      />
    </>
  )
}
