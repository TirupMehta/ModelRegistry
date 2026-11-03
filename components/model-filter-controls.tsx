"use client"

import { useEffect, useRef, useState, type KeyboardEvent } from "react"
import { createPortal } from "react-dom"
import { companies } from "@/data/companies"
import { DEFAULT_MODEL_FILTERS, hasActiveModelFilters, type ModelFilters } from "@/lib/model-filters"
import { Check, ChevronDown, RotateCcw, SlidersHorizontal, X } from "lucide-react"

type FilterOption = [string, string]

const fieldClass = "h-10 w-full rounded-lg border border-black/10 bg-white px-3 text-xs text-black transition-colors hover:border-black/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5d2e]/30 dark:border-white/[0.1] dark:bg-[#0d0f13] dark:text-white dark:hover:border-white/20"
const labelClass = "mb-1.5 block text-[11px] font-medium text-black/60 dark:text-zinc-400"
const inputClass = "h-10 w-full rounded-lg border border-black/10 bg-white px-3 text-xs tabular-nums text-black transition-colors placeholder:text-black/55 hover:border-black/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5d2e]/30 dark:border-white/[0.1] dark:bg-[#0d0f13] dark:text-white dark:placeholder:text-zinc-400 dark:hover:border-white/20"

function FilterSelect({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string
  label: string
  value: string
  options: FilterOption[]
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(Math.max(0, options.findIndex(([optionValue]) => optionValue === value)))
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; width: number; maxHeight: number } | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([])
  const selectedLabel = options.find(([optionValue]) => optionValue === value)?.[1] ?? options[0][1]

  useEffect(() => {
    if (!open) {
      setMenuPosition(null)
      return
    }

    const updatePosition = () => {
      const trigger = triggerRef.current
      if (!trigger) return

      const rect = trigger.getBoundingClientRect()
      const edge = 8
      const gap = 6
      const desiredHeight = Math.min(224, options.length * 36 + 14)
      const spaceBelow = window.innerHeight - rect.bottom - edge - gap
      const spaceAbove = rect.top - edge - gap
      const placeAbove = spaceBelow < desiredHeight && spaceAbove > spaceBelow
      const available = Math.max(80, placeAbove ? spaceAbove : spaceBelow)
      const maxHeight = Math.min(desiredHeight, available)
      const width = Math.min(rect.width, window.innerWidth - edge * 2)
      const left = Math.max(edge, Math.min(rect.left, window.innerWidth - width - edge))
      const top = placeAbove
        ? Math.max(edge, rect.top - maxHeight - gap)
        : Math.min(rect.bottom + gap, window.innerHeight - maxHeight - edge)

      setMenuPosition({ top, left, width, maxHeight })
    }

    updatePosition()
    window.addEventListener("resize", updatePosition)
    window.addEventListener("scroll", updatePosition, true)
    return () => {
      window.removeEventListener("resize", updatePosition)
      window.removeEventListener("scroll", updatePosition, true)
    }
  }, [open, options.length])

  useEffect(() => {
    if (open && menuPosition) optionRefs.current[activeIndex]?.focus()
  }, [open, activeIndex, menuPosition])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener("pointerdown", onPointerDown)
    return () => document.removeEventListener("pointerdown", onPointerDown)
  }, [open])

  const close = (restoreFocus: boolean) => {
    setOpen(false)
    if (restoreFocus) triggerRef.current?.focus()
  }

  const moveActive = (index: number) => {
    const next = (index + options.length) % options.length
    setActiveIndex(next)
    optionRefs.current[next]?.focus()
  }

  const onOptionKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      moveActive(index + 1)
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      moveActive(index - 1)
    } else if (event.key === "Home") {
      event.preventDefault()
      moveActive(0)
    } else if (event.key === "End") {
      event.preventDefault()
      moveActive(options.length - 1)
    } else if (event.key === "Escape") {
      event.preventDefault()
      event.stopPropagation()
      close(true)
    }
  }

  const openAt = (index: number) => {
    setActiveIndex((index + options.length) % options.length)
    setOpen(true)
  }

  return (
    <div ref={rootRef} className="relative min-w-0">
      <span id={id + "-label"} className={labelClass}>{label}</span>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={id + "-options"}
        onClick={() => open ? close(false) : openAt(Math.max(0, options.findIndex(([optionValue]) => optionValue === value)))}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault()
            const selected = Math.max(0, options.findIndex(([optionValue]) => optionValue === value))
            openAt(event.key === "ArrowDown" ? selected : selected - 1)
          }
        }}
        className={fieldClass + " flex items-center justify-between gap-2 text-left"}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown size={14} aria-hidden="true" className={"shrink-0 text-black/45 transition-transform dark:text-zinc-400" + (open ? " rotate-180" : "")} />
      </button>
      {open && menuPosition && typeof document !== "undefined" && createPortal(
        <div
          ref={menuRef}
      data-model-filter-menu=""
          className="fixed z-[1000] overflow-hidden rounded-xl border border-black/10 bg-white p-1.5 shadow-[0_8px_20px_rgba(0,0,0,0.12)] dark:border-white/[0.12] dark:bg-[#15171c] dark:shadow-[0_8px_20px_rgba(0,0,0,0.4)]"
          style={{ top: menuPosition.top, left: menuPosition.left, width: menuPosition.width, maxHeight: menuPosition.maxHeight }}
        >
          <div id={id + "-options"} role="listbox" aria-labelledby={id + "-label"} className="overflow-y-auto overscroll-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden" style={{ maxHeight: Math.max(64, menuPosition.maxHeight - 14) }}>
            {options.map(([optionValue, optionLabel], index) => {
              const selected = optionValue === value
              return (
                <button
                  key={optionValue}
                  ref={(element) => { optionRefs.current[index] = element }}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  tabIndex={-1}
                  onClick={() => {
                    onChange(optionValue)
                    close(true)
                  }}
                  onKeyDown={(event) => onOptionKeyDown(event, index)}
                  className={"flex min-h-9 w-full items-center justify-between gap-3 rounded-lg px-2.5 text-left text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#ff5d2e]/45 " + (selected ? "bg-[#ff5d2e]/[0.08] font-medium text-[#bd401f] dark:text-[#ff987b]" : "text-black/75 hover:bg-black/[0.045] dark:text-zinc-200 dark:hover:bg-white/[0.06]")}
                >
                  <span className="truncate">{optionLabel}</span>
                  {selected && <Check size={13} aria-hidden="true" className="shrink-0" />}
                </button>
              )
            })}
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}

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
        className={"relative inline-flex h-5 w-5 items-center justify-center rounded-md border border-black/10 bg-black/5 text-black/65 transition-colors hover:border-black/20 hover:bg-black/[0.08] hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5d2e]/40 dark:border-white/[0.08] dark:bg-white/[0.06] dark:text-zinc-300 dark:hover:border-white/20 dark:hover:bg-white/[0.1] dark:hover:text-white " + (open || active ? "border-[#ff5d2e]/35 bg-[#ff5d2e]/[0.08] text-black dark:border-[#ff5d2e]/40 dark:bg-[#ff5d2e]/[0.12] dark:text-white" : "")}
      >
        <SlidersHorizontal size={12} strokeWidth={1.8} aria-hidden="true" />
        {active && <span aria-hidden="true" className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[#ff5d2e] ring-2 ring-white dark:ring-[#0d0f13]" />}
      </button>}

      {visible && (
        <section id="model-refine-panel" aria-label="Refine model results" className={(alwaysOpen ? "absolute inset-x-0 top-0 z-[60] w-full overflow-visible " : "absolute right-0 top-full z-[60] mt-2 w-[min(560px,calc(100vw-2rem))] overflow-visible ") + "rounded-xl border border-black/[0.12] bg-[#fbfbf9] p-3 shadow-[0_4px_14px_rgba(0,0,0,0.08)] dark:border-white/[0.12] dark:bg-[#111317] dark:shadow-[0_4px_14px_rgba(0,0,0,0.3)] sm:p-3"}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-black dark:text-white">Refine results</h2>
              <p className="mt-1 text-xs leading-relaxed text-black/55 dark:text-zinc-400">Choose what matters. Results update as you change a filter.</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                disabled={!active}
                onClick={() => onChange(DEFAULT_MODEL_FILTERS)}
                className="inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2 text-[11px] font-medium text-black/60 transition-colors hover:bg-black/[0.045] hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5d2e]/35 disabled:cursor-not-allowed disabled:opacity-35 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
              >
                <RotateCcw size={12} aria-hidden="true" />
                Reset{active ? " (" + activeCount + ")" : ""}
              </button>
              {!alwaysOpen && <button
                type="button"
                aria-label="Close filters"
                onClick={() => { setOpen(false); triggerRef.current?.focus() }}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-black/55 transition-colors hover:bg-black/[0.05] hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5d2e]/35 dark:text-zinc-400 dark:hover:bg-white/[0.07] dark:hover:text-white"
              >
                <X size={15} aria-hidden="true" />
              </button>}
            </div>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2.5 border-t border-black/[0.08] pt-2 dark:border-white/[0.08] sm:grid-cols-3">
            <FilterSelect id="model-filter-lab" label="Lab" value={filters.lab} onChange={(value) => update("lab", value)} options={[
              ["all", "All labs"],
              ...Object.values(companies).map((company) => [company.id, company.name] as FilterOption),
            ]} />
            <FilterSelect id="model-filter-weights" label="Weights" value={filters.weights} onChange={(value) => update("weights", value as ModelFilters["weights"])} options={[
              ["all", "Any"],
              ["open", "Open weights"],
              ["closed", "Closed weights"],
            ]} />
            <FilterSelect id="model-filter-modality" label="Modality" value={filters.modality} onChange={(value) => update("modality", value)} options={[
              ["all", "Any modality"],
              ...["Text", "Vision", "Audio", "Video", "Code", "Image"].map((modality) => [modality, modality] as FilterOption),
            ]} />
            <label htmlFor="model-filter-context" className="min-w-0">
              <span className={labelClass}>Min context (K tokens)</span>
              <input id="model-filter-context" className={inputClass} type="number" min="0" step="1" inputMode="numeric" placeholder="Any size" value={filters.minContext} onChange={(event) => update("minContext", event.target.value)} />
            </label>
            <label htmlFor="model-filter-price" className="min-w-0">
              <span className={labelClass}>Max input $ / 1M</span>
              <input id="model-filter-price" className={inputClass} type="number" min="0" step="0.01" inputMode="decimal" placeholder="Any price" value={filters.maxInputPrice} onChange={(event) => update("maxInputPrice", event.target.value)} />
            </label>
            <FilterSelect id="model-filter-sort" label="Sort by" value={filters.sort} onChange={(value) => update("sort", value as ModelFilters["sort"])} options={[
              ["default", "Default order"],
              ["newest", "Release date"],
              ["context", "Context size"],
              ["price", "Input price"],
              ["name", "Model name"],
            ]} />
          </div>

          <div className="mt-2 border-t border-black/[0.08] pt-2 dark:border-white/[0.08]">
            <p className="text-[11px] leading-relaxed text-black/55 dark:text-zinc-400">Price limits use listed input cost per 1M tokens. Models billed by another unit are excluded when a limit is set.</p>
          </div>
        </section>
      )}
    </div>
  )
}
