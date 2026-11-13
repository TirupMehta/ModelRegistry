"use client"

import { useEffect, useRef, useState } from "react"
import { companies } from "@/data/companies"
import { DEFAULT_MODEL_FILTERS, hasActiveModelFilters, type ModelFilters } from "@/lib/model-filters"
import Select, { labelClass, type SelectOption } from "@/components/select"
import { RotateCcw, SlidersHorizontal, X } from "lucide-react"

const inputClass = "h-10 w-full rounded-lg border border-[var(--field-edge)] bg-[var(--surface-field)] px-3 text-small tabular-nums text-black transition-colors placeholder:text-fg-muted hover:border-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ink/30 dark:text-white dark:placeholder:text-zinc-400 dark:hover:border-white/40"

export default function ModelFilterControls({
  filters,
  onChange,
  alwaysOpen = false,
  className = "relative z-30 flex w-full justify-end",
}: {
  filters: ModelFilters
  onChange: (filters: ModelFilters) => void
  alwaysOpen?: boolean
  className?: string
}) {
  const [open, setOpen] = useState(alwaysOpen)
  const visible = alwaysOpen || open
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const update = <K extends keyof ModelFilters>(key: K, value: ModelFilters[K]) =>
    onChange({ ...filters, [key]: value })
  const active = hasActiveModelFilters(filters)
  const activeCount = [
    filters.lab !== "all",
    filters.weights !== "all",
    filters.modality !== "all",
    filters.minContext !== "",
    filters.maxInputPrice !== "",
    filters.sort !== "default",
  ].filter(Boolean).length

  useEffect(() => {
    if (!open || alwaysOpen) return
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target) && !(event.target instanceof Element && event.target.closest("[data-model-filter-menu]"))) setOpen(false)
    }
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open, alwaysOpen])

  return (
    <div ref={rootRef} className={className + (visible ? " z-50" : "")}>
      {!alwaysOpen && <button
        ref={triggerRef}
        type="button"
        aria-label={active ? "Refine results, " + activeCount + " active" : "Refine results"}
        aria-expanded={open}
        aria-controls="model-refine-panel"
        title="Refine results"
        onClick={() => setOpen((current) => !current)}
        className={"relative inline-flex h-7 w-7 items-center justify-center rounded text-fg-muted transition-colors hover:bg-black/[0.06] hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ink/40 dark:hover:bg-white/[0.08] dark:hover:text-white " + (open || active ? "bg-accent/[0.1] text-accent-ink dark:bg-accent/[0.14] dark:text-white" : "")}
      >
        <SlidersHorizontal size={13} strokeWidth={1.8} aria-hidden="true" />
        {active && <span aria-hidden="true" className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-accent ring-2 ring-white dark:ring-[var(--surface-field)]" />}
      </button>}

      {visible && (
        <section id="model-refine-panel" aria-label="Refine model results" className={(alwaysOpen ? "absolute inset-x-0 top-0 z-[60] w-full overflow-visible " : "absolute right-0 top-full z-[60] mt-2 w-[min(560px,calc(100vw-2rem))] overflow-visible ") + "rounded-xl border border-black/[0.12] bg-[var(--card-bg)] p-3 shadow-[0_4px_14px_rgba(0,0,0,0.08)] dark:border-white/[0.12] dark:bg-[var(--surface-raised)] dark:shadow-[0_4px_14px_rgba(0,0,0,0.3)] sm:p-3"}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-body font-semibold text-black dark:text-white">Refine results</h2>
              <p className="mt-1 text-small leading-relaxed text-fg-muted">Choose what matters. Results update as you change a filter.</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                disabled={!active}
                onClick={() => onChange(DEFAULT_MODEL_FILTERS)}
                className="inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2 text-caption font-medium text-fg-muted transition-colors hover:bg-black/[0.045] hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35 disabled:cursor-not-allowed disabled:opacity-35 dark:hover:bg-white/[0.06] dark:hover:text-white"
              >
                <RotateCcw size={12} aria-hidden="true" />
                Reset{active ? " (" + activeCount + ")" : ""}
              </button>
              {!alwaysOpen && <button
                type="button"
                aria-label="Close filters"
                onClick={() => { setOpen(false); triggerRef.current?.focus() }}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-fg-muted transition-colors hover:bg-black/[0.05] hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35 dark:hover:bg-white/[0.07] dark:hover:text-white"
              >
                <X size={15} aria-hidden="true" />
              </button>}
            </div>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2.5 border-t border-black/[0.08] pt-2 dark:border-white/[0.08] sm:grid-cols-3">
            <Select id="model-filter-lab" label="Lab" value={filters.lab} onChange={(value) => update("lab", value)} options={[
              ["all", "All labs"],
              ...Object.values(companies).map((company) => [company.id, company.name] as SelectOption),
            ]} />
            <Select id="model-filter-weights" label="Weights" value={filters.weights} onChange={(value) => update("weights", value as ModelFilters["weights"])} options={[
              ["all", "Any"],
              ["open", "Open weights"],
              ["closed", "Closed weights"],
            ]} />
            <Select id="model-filter-modality" label="Modality" value={filters.modality} onChange={(value) => update("modality", value)} options={[
              ["all", "Any modality"],
              ...["Text", "Vision", "Audio", "Video", "Code", "Image"].map((modality) => [modality, modality] as SelectOption),
            ]} />
            <label htmlFor="model-filter-context" className="min-w-0">
              <span className={labelClass}>Min context (K tokens)</span>
              <input id="model-filter-context" className={inputClass} type="number" min="0" step="1" inputMode="numeric" placeholder="Any size" value={filters.minContext} onChange={(event) => update("minContext", event.target.value)} />
            </label>
            <label htmlFor="model-filter-price" className="min-w-0">
              <span className={labelClass}>Max input $ / 1M</span>
              <input id="model-filter-price" className={inputClass} type="number" min="0" step="0.01" inputMode="decimal" placeholder="Any price" value={filters.maxInputPrice} onChange={(event) => update("maxInputPrice", event.target.value)} />
            </label>
            <Select id="model-filter-sort" label="Sort by" value={filters.sort} onChange={(value) => update("sort", value as ModelFilters["sort"])} options={[
              ["default", "Default order"],
              ["newest", "Release date"],
              ["context", "Context size"],
              ["price", "Input price"],
              ["name", "Model name"],
            ]} />
          </div>

          <div className="mt-2 border-t border-black/[0.08] pt-2 dark:border-white/[0.08]">
            <p className="text-caption leading-relaxed text-fg-muted">Price limits use listed input cost per 1M tokens. Models billed by another unit are excluded when a limit is set.</p>
          </div>
        </section>
      )}
    </div>
  )
}
