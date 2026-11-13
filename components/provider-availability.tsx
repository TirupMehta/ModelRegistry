"use client"

import { useEffect, useState } from "react"
import { ChevronDown, ExternalLink } from "lucide-react"

type Endpoint = {
  provider: string
  tier: string | null
  contextTokens: number | null
  maxOutputTokens: number | null
  inputUsdPerMillion: number | null
  outputUsdPerMillion: number | null
}

type ProviderResult = {
  status: "listed" | "unmapped" | "no_endpoints" | "lookup_failed"
  providerModelId?: string
  checkedAt?: string
  endpointCount?: number
  endpoints: Endpoint[]
}

function price(value: number | null) {
  if (value === null) return "Not listed"
  return `$${new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 }).format(value)}`
}

function endpointLabel(value: string) {
  if (value === "default") return "Standard"
  return value.split(/[-_/]/).map((part) => part.toLowerCase() === "us" ? "US" : part.charAt(0).toUpperCase() + part.slice(1)).join(" ")
}

export function ProviderAvailability({ modelId }: { modelId: string }) {
  const [result, setResult] = useState<ProviderResult | null>(null)
  const [query, setQuery] = useState("")

  useEffect(() => {
    const controller = new AbortController()
    fetch(`/api/v1/models/${encodeURIComponent(modelId)}/providers`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Provider request failed")
        return response.json()
      })
      .then((data) => { if (data) setResult(data as ProviderResult) })
      .catch(() => {})
    return () => controller.abort()
  }, [modelId])

  // Nothing to show means nothing is shown: no loading text, no "not found" notes.
  if (result?.status !== "listed") return null

  const rows = result.endpoints.filter((e) => `${e.provider} ${e.tier ?? ""}`.toLowerCase().includes(query.trim().toLowerCase()))
  const inputs = result.endpoints.map((e) => e.inputUsdPerMillion).filter((v): v is number => v !== null)
  const cheapest = inputs.length ? Math.min(...inputs) : null

  return (
    <section className="mb-6 sm:mb-8" aria-label="Other providers">
      <details className="group rounded-lg border border-black/10 dark:border-white/[0.08]">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-body [&::-webkit-details-marker]:hidden">
          <span className="font-medium text-black dark:text-white">Other providers</span>
          <span className="tabular-nums text-fg-muted">
            {result.endpoints.length} listed{cheapest !== null ? ` · from ${price(cheapest)} in` : ""}
          </span>
          <ChevronDown size={14} className="ml-auto text-fg-muted transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>

        <div className="border-t border-black/10 px-4 py-3 text-body dark:border-white/[0.08]">
          <div className="mb-2 flex items-center justify-between gap-3">
            {result.endpoints.length > 5 ? (
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter providers"
                aria-label="Filter providers"
                className="h-9 w-48 rounded-md border border-black/10 bg-transparent px-3 text-body outline-none focus:border-black/30 dark:border-white/15 dark:focus:border-white/40"
              />
            ) : <span />}
            {result.providerModelId && (
              <a href={`https://openrouter.ai/models/${result.providerModelId}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-fg-muted hover:text-accent-ink">
                OpenRouter <ExternalLink size={12} />
              </a>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] border-collapse text-left">
              <thead>
                <tr className="text-fg-muted">
                  <th className="py-1.5 pr-3 font-normal">Provider</th>
                  <th className="py-1.5 pr-3 text-right font-normal">In /1M</th>
                  <th className="py-1.5 pr-3 text-right font-normal">Out /1M</th>
                  <th className="py-1.5 text-right font-normal">Context</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((e, i) => (
                  <tr key={`${e.provider}-${e.tier ?? "default"}-${i}`} className="rule-t">
                    <td className="py-2 pr-3 text-black dark:text-white">
                      {e.provider}
                      {e.tier && <span className="ml-1.5 text-fg-muted">{endpointLabel(e.tier)}</span>}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums">{price(e.inputUsdPerMillion)}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{price(e.outputUsdPerMillion)}</td>
                    <td className="py-2 text-right tabular-nums">{e.contextTokens ? `${Math.round(e.contextTokens / 1000).toLocaleString("en-US")}K` : "Not listed"}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={4} className="py-3 text-fg-muted">No match.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-fg-muted">Checked {result.checkedAt ? new Date(result.checkedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "recently"}. Prices can differ from the lab.</p>
        </div>
      </details>
    </section>
  )
}
