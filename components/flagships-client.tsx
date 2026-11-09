"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { modelsData } from "@/data/models"
import { companies } from "@/data/companies"
import ModelFilterControls from "@/components/model-filter-controls"
import { DEFAULT_MODEL_FILTERS, filterModels, type ModelFilters } from "@/lib/model-filters"

export default function FlagshipsClient() {
  const [filters, setFilters] = useState<ModelFilters>(DEFAULT_MODEL_FILTERS)
  const flagships = useMemo(() => {
    const filtered = filterModels(modelsData.filter((model) => model.isCompanyFlagship), filters)
    return filters.sort === "default"
      ? filtered.sort((a, b) => Object.keys(companies).indexOf(a.companyId) - Object.keys(companies).indexOf(b.companyId))
      : filtered
  }, [filters])

  return <>
    <ModelFilterControls filters={filters} onChange={setFilters} />
    <p className="mb-3 text-[11px] tabular-nums text-black/45 dark:text-zinc-500" aria-live="polite">{flagships.length} {flagships.length === 1 ? "lab" : "labs"} shown</p>
    <div className="border-t border-black/10 dark:border-white/[0.08]">
      {flagships.map((model) => <div key={model.id} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 py-3 border-b border-black/10 dark:border-white/[0.08] text-sm">
        <span className="flex items-center gap-2 min-w-0 sm:w-64 shrink-0">
          <Link href={`/models/${model.id}`} className="font-medium tracking-tight text-black dark:text-white hover:text-accent-ink truncate">{model.name}</Link>
        </span>
        <Link href={`/companies/${model.companyId}`} className="text-xs font-sans text-black/50 dark:text-zinc-400 hover:text-accent-ink shrink-0">{model.companyName}</Link>
        <span className="text-xs font-sans tabular-nums text-black/45 dark:text-zinc-500 sm:ml-auto shrink-0">{model.releaseDate} · {model.contextWindow.replace(" tokens", "")} · ${model.pricing.input}/${model.pricing.output}</span>
        {model.sources[0] && <a href={model.sources[0].url} target="_blank" rel="noopener noreferrer" className="text-[11px] font-sans text-accent-ink hover:underline underline-offset-2 shrink-0">Source</a>}
      </div>)}
      {flagships.length === 0 && <p className="py-10 text-center text-sm text-black/55 dark:text-zinc-400">No flagship models match these filters.</p>}
    </div>
  </>
}
