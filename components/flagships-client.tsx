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
      {flagships.map((model) => <div key={model.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-0.5 py-3 rule-b">
        <Link href={`/models/${model.id}`} className="min-w-0 text-body font-medium tracking-tight text-fg-strong hover:text-accent-ink">
          {model.name}
        </Link>
        <div className="flex items-baseline justify-end gap-3 text-small font-sans tabular-nums">
          <span className="font-medium text-fg">
            {priceSymbol(model)}{model.pricing.input}/{priceSymbol(model)}{model.pricing.output}
          </span>
          {model.primarySourceUrl && <a href={model.primarySourceUrl} target="_blank" rel="noopener noreferrer" className="text-caption text-accent-ink hover:underline underline-offset-2">Source</a>}
        </div>
        {/* Provenance runs the full width of the row under the name, so a record
            with a caveat-heavy context window wraps as prose instead of pushing
            the price or the source out of the column. */}
        <p className="col-span-2 text-pretty text-small font-sans text-fg-muted">
          <Link href={`/companies/${model.companyId}`} className="hover:text-accent-ink">
            {model.companyName}
          </Link>
          <span aria-hidden="true"> · </span>
          <time dateTime={model.releaseDate} className="tabular-nums whitespace-nowrap">
            {model.releaseDate}
          </time>
          <span aria-hidden="true"> · </span>
          <span className="tabular-nums">{model.contextWindow.replace(" tokens", "")}</span>
        </p>
      </div>)}
      {flagships.length === 0 && <p className="py-10 text-center text-body text-fg-muted">No flagship models match these filters.</p>}
    </div>
  </>
}
