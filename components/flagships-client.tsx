"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import type { ModelListItem } from "@/lib/model-list"
import { companies } from "@/data/companies"
import ModelFilterControls from "@/components/model-filter-controls"
import { DEFAULT_MODEL_FILTERS, filterModels, type ModelFilters } from "@/lib/model-filters"
import { priceSymbol } from "@/lib/utils"

export default function FlagshipsClient({ models }: { models: ModelListItem[] }) {
  const [filters, setFilters] = useState<ModelFilters>(DEFAULT_MODEL_FILTERS)
  const flagships = useMemo(() => {
    const filtered = filterModels(models.filter((model) => model.isCompanyFlagship), filters)
    return filters.sort === "default"
      ? filtered.sort((a, b) => Object.keys(companies).indexOf(a.companyId) - Object.keys(companies).indexOf(b.companyId))
      : filtered
  }, [filters, models])

  return <>
    <ModelFilterControls filters={filters} onChange={setFilters} />
    <p className="mb-3 text-caption tabular-nums text-fg-muted" aria-live="polite">{flagships.length} {flagships.length === 1 ? "lab" : "labs"} shown</p>
    <div className="rule-t">
      {flagships.map((model) => <div key={model.id} className="flex flex-col gap-1 py-3 rule-b text-body sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3">
        <span className="flex items-center gap-2 min-w-0 sm:w-64 shrink-0">
          <Link href={`/models/${model.id}`} className="font-medium tracking-tight text-fg-strong hover:text-accent-ink truncate">{model.name}</Link>
        </span>
        <Link href={`/companies/${model.companyId}`} className="text-small font-sans text-fg-muted hover:text-accent-ink sm:shrink-0">{model.companyName}</Link>
        {/* The detail string can be a full sentence for long context or per-second
            pricing, so it moves to its own right-aligned line instead of running
            past the column. Source is part of that line and stays with it. */}
        <span className="min-w-0 text-small font-sans tabular-nums text-fg-muted sm:ml-auto sm:max-w-full sm:shrink-0 sm:text-right">
          {model.releaseDate} · {model.contextWindow.replace(" tokens", "")} · {priceSymbol(model)}{model.pricing.input}/{priceSymbol(model)}{model.pricing.output}
          {model.primarySourceUrl && <> · <a href={model.primarySourceUrl} target="_blank" rel="noopener noreferrer" className="text-caption text-accent-ink hover:underline underline-offset-2">Source</a></>}
        </span>
      </div>)}
      {flagships.length === 0 && <p className="py-10 text-center text-body text-fg-muted">No flagship models match these filters.</p>}
    </div>
  </>
}
