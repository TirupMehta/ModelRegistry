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
    <p className="mb-3 text-caption tabular-nums text-fg-muted" aria-live="polite">{flagships.length} {flagships.length === 1 ? "lab" : "labs"} shown</p>
    <div className="rule-t">
      {flagships.map((model) => <div key={model.id} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 py-3 rule-b text-body">
        <span className="flex items-center gap-2 min-w-0 sm:w-64 shrink-0">
          <Link href={`/models/${model.id}`} className="font-medium tracking-tight text-fg-strong hover:text-accent-ink truncate">{model.name}</Link>
        </span>
        <Link href={`/companies/${model.companyId}`} className="text-small font-sans text-fg-muted hover:text-accent-ink shrink-0">{model.companyName}</Link>
        <span className="text-small font-sans tabular-nums text-fg-muted sm:ml-auto shrink-0">{model.releaseDate} · {model.contextWindow.replace(" tokens", "")} · ${model.pricing.input}/${model.pricing.output}</span>
        {model.sources[0] && <a href={model.sources[0].url} target="_blank" rel="noopener noreferrer" className="text-caption font-sans text-accent-ink hover:underline underline-offset-2 shrink-0">Source</a>}
      </div>)}
      {flagships.length === 0 && <p className="py-10 text-center text-body text-fg-muted">No flagship models match these filters.</p>}
    </div>
  </>
}
