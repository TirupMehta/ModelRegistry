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
import { ArrowUpRight, Copy, Check, X, Search, SearchX } from "lucide-react"
import ModelFilterControls from "@/components/model-filter-controls"
import { DEFAULT_MODEL_FILTERS, filterModels, type ModelFilters } from "@/lib/model-filters"

type ViewTab = "flagships" | "latest-drops" | "open-weights" | "visual" | "all"

// New Drops is purely date-driven: models released within this window,
// sorted newest-first. No per-lab flags involved.
const NEW_DROPS_WINDOW_DAYS = 30

// The index is a scanning surface; the full summary lives on the model page.
// Truncate in the string (not with a CSS clamp) so the row stays one line and
// the text measured is the text painted.
function summarize(raw: string, max = 84): string {
  // The release date is shown beside the name, so a leading "Released Nov 9, 2026;" only repeats it.
  const stripped = raw.replace(/^(released|rolled out|shipped|launched)[^;:]{0,40}[;:]s*/i, "")
  const text = stripped ? stripped.charAt(0).toUpperCase() + stripped.slice(1) : raw
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), 60)).trimEnd()}…`
}

/** List price per 1M tokens: two decimals, more only when the price is under a dime. */
function usd(n: number): string {
  if (n === 0) return "Free"
  return n < 0.1 ? `$${n}` : `$${n.toFixed(2)}`
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

      <section className="section page-x pb-0">
        {/* Hero: the claim, one sentence, then the provenance that separates a
            cited registry from another list of models. */}
        <div>
          <h1 className="max-w-[20ch] font-display text-display font-semibold leading-[1.05] tracking-[-0.03em] text-black dark:text-white">
            Every frontier model, with its sources.
          </h1>
          <p className="mt-3 max-w-[52ch] text-title font-normal leading-[1.55] text-fg sm:mt-4 sm:text-title">
            Specs, prices and context limits for {modelsData.length} models. Each record names the lab page it came from and the date it was checked.
          </p>
          <p className="mt-3 text-small tabular-nums text-fg-muted">
            {Object.keys(companies).length} labs · {sourceCount} primary sources · <span className="whitespace-nowrap">revised {formatDate(datasetRevision.revisedAt)}</span>
          </p>
          {quickAnswers}

        </div>
      </section>

      <section className="section page">
        {/* Index: search, filters, then the ledger itself. */}
        <TextWithBlur delay={180}>
          <div className="mb-2 mt-8 flex flex-col gap-3 md:mt-10 lg:flex-row lg:items-center lg:justify-between">
            {/* Unified Segmented Filter Track - grid-cols-5 so the five tabs
                always fill the track exactly on every screen width (no
                trailing blank space, no squeeze, no scroll). */}
            <div className="flex h-9 w-full items-center gap-0.5 rounded-lg border border-[var(--field-edge)] bg-[var(--surface-inset)] p-0.5 lg:w-auto lg:shrink-0">
              <button
                onClick={() => handleTab("flagships")}
                className={`h-full flex-auto whitespace-nowrap px-2.5 lg:flex-none rounded-md text-small font-sans tracking-tight transition-colors duration-150 select-none cursor-pointer ${
                  activeTab === "flagships"
                    ? "bg-black text-white dark:bg-white dark:text-black font-medium shadow-sm"
                    : "text-fg-muted hover:text-black dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
                }`}
              >
                Flagships <span className="hidden sm:inline opacity-60 tabular-nums text-caption">{counts.flagships}</span>
              </button>

              <button
                onClick={() => handleTab("latest-drops")}
                title={`Released in the last ${NEW_DROPS_WINDOW_DAYS} days, newest first`}
                className={`h-full flex-auto whitespace-nowrap px-2.5 lg:flex-none rounded-md text-small font-sans tracking-tight transition-colors duration-150 select-none cursor-pointer ${
                  activeTab === "latest-drops"
                    ? "bg-black text-white dark:bg-white dark:text-black font-medium shadow-sm"
                    : "text-fg-muted hover:text-black dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
                }`}
              >
                <span className="sm:hidden">New</span><span className="hidden sm:inline">New Drops</span> <span className="hidden sm:inline opacity-60 tabular-nums text-caption">{counts.latestDrops}</span>
              </button>

              <button
                onClick={() => handleTab("open-weights")}
                className={`h-full flex-auto whitespace-nowrap px-2.5 lg:flex-none rounded-md text-small font-sans tracking-tight transition-colors duration-150 select-none cursor-pointer ${
                  activeTab === "open-weights"
                    ? "bg-black text-white dark:bg-white dark:text-black font-medium shadow-sm"
                    : "text-fg-muted hover:text-black dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
                }`}
              >
                <span className="sm:hidden">Open</span>
                <span className="hidden sm:inline">Open Weights</span> <span className="hidden sm:inline opacity-60 tabular-nums text-caption">{counts.openWeights}</span>
              </button>

              <button
                onClick={() => handleTab("visual")}
                className={`h-full flex-auto whitespace-nowrap px-2.5 lg:flex-none rounded-md text-small font-sans tracking-tight transition-colors duration-150 select-none cursor-pointer ${
                  activeTab === "visual"
                    ? "bg-black text-white dark:bg-white dark:text-black font-medium shadow-sm"
                    : "text-fg-muted hover:text-black dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
                }`}
              >
                Visual <span className="hidden sm:inline opacity-60 tabular-nums text-caption">{counts.visual}</span>
              </button>

              <button
                onClick={() => handleTab("all")}
                className={`h-full flex-auto whitespace-nowrap px-2.5 lg:flex-none rounded-md text-small font-sans tracking-tight transition-colors duration-150 select-none cursor-pointer ${
                  activeTab === "all"
                    ? "bg-black text-white dark:bg-white dark:text-black font-medium shadow-sm"
                    : "text-fg-muted hover:text-black dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
                }`}
              >
                All <span className="hidden sm:inline opacity-60 tabular-nums text-caption">{counts.all}</span>
              </button>
            </div>

            {/* Search: the primary action of the page. */}
            <div className="relative w-full lg:ml-3 lg:min-w-0 lg:flex-1">
              <Search
                size={14}
                aria-hidden="true"
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-muted"
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
                placeholder="Search models"
                className="h-9 w-full rounded-lg border border-[var(--field-edge)] bg-[var(--surface-field)] pl-8 pr-16 text-small font-sans text-black transition-colors duration-150 placeholder:text-fg-muted focus:border-accent-ink focus:outline-none focus:ring-2 focus:ring-accent-ink/20 disabled:cursor-not-allowed disabled:opacity-60 dark:text-white dark:placeholder:text-zinc-400"
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
                  className="absolute right-11 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded text-fg-muted transition-colors hover:bg-black/[0.06] hover:text-black dark:hover:bg-white/[0.08] dark:hover:text-white"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
          <div className="mb-1 flex items-center justify-between rule-b pb-3 pt-2">
            <p className="text-small font-sans tabular-nums text-fg-muted">
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
            <div className="py-14 px-6 text-center tile">
              <div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-fg-muted">
                <SearchX size={16} />
              </div>
              <p className="text-body font-medium text-black dark:text-white">
                {activeTab === "latest-drops" && !searchQuery.trim()
                  ? "No new drops in the last 30 days"
                  : "No models match your filter"}
              </p>
              <p className="mt-1 text-small font-sans text-fg-muted">
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
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.04] px-3 py-1.5 text-small font-medium text-black dark:text-white hover:border-accent/50 hover:text-accent-ink active:scale-[0.98] transition-[color,background-color,border-color,opacity,transform,box-shadow] cursor-pointer"
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
                      "lg:hover:bg-[var(--tile)] lg:hover:shadow-sm",
                    ].join(" ")}
                  >
                    {/* Card layout below the wide ledger breakpoint */}
                    <div className="lg:hidden">
                      {/* Lab + date */}
                      <div className="flex items-center gap-1.5 text-caption font-sans mb-1.5 min-w-0">
                        <span
                          className="w-2 h-2 rounded-[3px] ring-1 ring-black/10 dark:ring-white/10 shrink-0"
                          style={{
                            backgroundColor:
                              companies[model.companyId]?.accentColor || "rgb(var(--accent-rgb))",
                          }}
                        />
                        <span className="min-w-0 truncate font-semibold text-fg-muted">
                          {model.companyName}
                        </span>
                        <time
                          dateTime={model.releaseDate}
                          className="ml-auto tabular-nums text-fg-muted shrink-0"
                        >
                          {formatDate(model.releaseDate)}
                        </time>
                      </div>

                      {/* Title + badge */}
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="font-display font-semibold text-title leading-snug tracking-tight text-black dark:text-white min-w-0">
                          {model.name}
                        </span>
                      </div>

                      <p className="text-small font-normal text-fg-muted leading-relaxed line-clamp-2">
                        {summarize(model.highlight)}
                      </p>

                      {/* Spec strip */}
                      <div className="tile mt-3 grid grid-cols-3 divide-x divide-black/[0.06] dark:divide-white/[0.06] py-2">
                        <div className="px-2.5 min-w-0">
                          <p className="text-caption font-sans font-medium text-fg-muted">
                            Input / 1M
                          </p>
                          <p className="text-small font-sans font-semibold tabular-nums text-black dark:text-white mt-0.5 truncate">
                            {model.pricing.input === 0 ? "Free" : `$${model.pricing.input}`}
                          </p>
                        </div>
                        <div className="px-2.5 min-w-0">
                          <p className="text-caption font-sans font-medium text-fg-muted">
                            Context
                          </p>
                          <p className="text-small font-sans font-semibold tabular-nums text-black dark:text-white mt-0.5 truncate">
                            {model.contextWindow.replace(" tokens", "")}
                          </p>
                        </div>
                        <div className="px-2.5 min-w-0">
                          <p className="text-caption font-sans font-medium text-fg-muted">
                            Access
                          </p>
                          <p className="text-small font-sans font-semibold text-black dark:text-white mt-0.5 truncate">
                            {model.openWeights ? "Open" : "API"}
                          </p>
                        </div>
                      </div>

                      {specializedDrop && activeTab === "flagships" && (
                        <div className="mt-2.5 text-small font-sans text-fg-muted">
                          <span className="block truncate" title={`${specializedDrop.name} (${specializedDrop.categoryLabel})`}>
                            Checkpoint:{" "}
                            <span className="text-fg underline underline-offset-2 font-normal">
                              {specializedDrop.name}
                            </span>{" "}
                            ({specializedDrop.categoryLabel})
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Desktop ledger row (lg and up): name and facts on one line, summary below. */}
                    <div className="hidden lg:block">
                      <div className="flex items-baseline gap-3">
                        <span className="min-w-0 truncate font-display text-title font-semibold tracking-tight text-fg-strong transition-colors duration-150 group-hover:text-accent-ink">
                          {model.name}
                        </span>
                        <span className="shrink-0 text-small text-fg-muted">{model.companyName}</span>
                        <span className="ml-auto shrink-0 text-small tabular-nums text-fg">
                          {model.pricingUnit ? model.pricingUnit : `${usd(model.pricing.input)} / ${usd(model.pricing.output)}`}
                        </span>
                        <time dateTime={model.releaseDate} className="w-28 shrink-0 text-right text-small tabular-nums text-fg-muted">
                          {formatDate(model.releaseDate)}
                        </time>
                        <ArrowUpRight
                          size={14}
                          aria-hidden="true"
                          className="shrink-0 self-center text-fg-muted opacity-50 transition-[opacity,transform,color] duration-150 group-hover:translate-x-px group-hover:-translate-y-px group-hover:text-accent-ink group-hover:opacity-100"
                        />
                      </div>
                      <p className="mt-1 truncate pr-8 text-small text-fg-muted">
                        <span className="text-fg">{model.categoryLabel}</span>
                        <span aria-hidden="true"> · </span>
                        {summarize(model.highlight)}
                      </p>
                      {specializedDrop && activeTab === "flagships" && (
                        <p className="mt-1 truncate text-small text-fg-muted">
                          Also from this lab: <span className="text-fg">{specializedDrop.name}</span> ({specializedDrop.categoryLabel})
                        </p>
                      )}
                    </div>
                  </div>
                </TextWithBlur>
              )
            })
          )}
          {/* Bottom ledger rule (desktop only - narrower screens use cards) */}
          <div className="hidden border-t border-black/10 lg:block dark:border-white/[0.08]" />
        </div>

        {/* Labs: soft tiles, the same surface as the spec tiles on a model page. */}
        <TextWithBlur delay={300}>
          <section aria-labelledby="labs-heading" className="mt-16">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="labs-heading" className="font-display text-heading font-semibold tracking-tight text-fg-strong">
                Latest flagship by lab
              </h2>
              <Link href="/companies" className="shrink-0 text-small font-medium text-accent-ink underline-offset-4 hover:underline">
                All labs
              </Link>
            </div>
            <ul className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {Object.values(companies).map((company) => {
                const flagship = modelsData.find((m) => m.companyId === company.id && m.isCompanyFlagship)
                if (!flagship) return null
                return (
                  <li key={company.id}>
                    <Link
                      href={`/models/${flagship.id}`}
                      className="tile-link group flex h-full items-center gap-3 px-3.5 py-3"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-body font-semibold text-fg-strong transition-colors group-hover:text-accent-ink">
                          {flagship.name}
                        </span>
                        <span className="block truncate text-small text-fg-muted">
                          {company.shortName} · {formatDate(flagship.releaseDate)}
                        </span>
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>
        </TextWithBlur>

        {/* Use the data: the same tile surface, laid out as four endpoints. */}
        <TextWithBlur delay={320}>
          <section aria-labelledby="data-heading" className="mt-16">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="data-heading" className="font-display text-heading font-semibold tracking-tight text-fg-strong">
                Use the data
              </h2>
              <Link href="/docs" className="shrink-0 text-small font-medium text-accent-ink underline-offset-4 hover:underline">
                API docs
              </Link>
            </div>
            <p className="mt-1 text-small text-fg-muted">Free, no key. The same records as this page.</p>
            <ul className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "JSON API", path: "/api/v1/models" },
                { label: "RSS feed", path: "/rss.xml" },
                { label: "For AI agents", path: "/llms.txt" },
              ].map((item) => (
                <li key={item.path}>
                  <a
                    href={item.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tile-link group block h-full px-3.5 py-3"
                  >
                    <span className="flex items-center justify-between gap-2 text-body font-semibold text-fg-strong transition-colors group-hover:text-accent-ink">
                      {item.label}
                      <ArrowUpRight size={14} aria-hidden="true" className="shrink-0 text-fg-muted" />
                    </span>
                    <span className="mt-0.5 block truncate font-mono text-small text-fg-muted">{item.path}</span>
                  </a>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText("curl -s https://modelregistry.tirup.in/latest")
                    successFeedback()
                    setCurlCopied(true)
                    setTimeout(() => setCurlCopied(false), 2000)
                  }}
                  className="tile-link group block h-full w-full cursor-pointer px-3.5 py-3 text-left"
                >
                  <span className="flex items-center justify-between gap-2 text-body font-semibold text-fg-strong transition-colors group-hover:text-accent-ink">
                    Terminal
                    {curlCopied ? (
                      <Check size={14} aria-hidden="true" className="shrink-0 text-good" />
                    ) : (
                      <Copy size={14} aria-hidden="true" className="shrink-0 text-fg-muted" />
                    )}
                  </span>
                  <span className="mt-0.5 block truncate font-mono text-small text-fg-muted">{curlCopied ? "Copied" : "curl -s …/latest"}</span>
                </button>
              </li>
            </ul>
          </section>
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
