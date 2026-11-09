"use client"

import { useEffect, useState } from "react"
import { ExternalLink } from "lucide-react"

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

function tokens(value: number | null) {
  if (value === null) return "Not listed"
  return `${new Intl.NumberFormat("en-US").format(value)} tokens`
}

function endpointLabel(value: string) {
  if (value === "default") return "Standard"
  return value.split(/[-_/]/).map((part) => part.toLowerCase() === "us" ? "US" : part.charAt(0).toUpperCase() + part.slice(1)).join(" ")
}

export function ProviderAvailability({ modelId }: { modelId: string }) {
  const [result, setResult] = useState<ProviderResult | null>(null)
  const [requestFailed, setRequestFailed] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    fetch(`/api/v1/models/${encodeURIComponent(modelId)}/providers`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Provider request failed")
        return response.json()
      })
      .then((data) => { if (data) setResult(data as ProviderResult) })
      .catch(() => { if (!controller.signal.aborted) setRequestFailed(true) })
    return () => controller.abort()
  }, [modelId])

  return (
    <section className="mb-6 border-t border-black/10 pt-5 sm:mb-8 dark:border-white/[0.08]" aria-labelledby="provider-listings-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="provider-listings-title" className="font-display text-lg font-semibold tracking-tight text-black dark:text-white">OpenRouter provider listings</h2>
          <p className="mt-1 text-xs leading-relaxed text-black/50 dark:text-zinc-500">Current endpoint offers. Prices and limits can vary by provider and service tier; they do not replace the lab’s official specs above.</p>
        </div>
        {result?.providerModelId && <a href={`https://openrouter.ai/models/${result.providerModelId}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-black/55 hover:text-accent-ink dark:text-zinc-400">
          OpenRouter <ExternalLink size={12} />
        </a>}
      </div>

      {!result && !requestFailed && <p className="mt-4 text-xs text-black/50 dark:text-zinc-500">Checking the current OpenRouter listing…</p>}
      {!result && requestFailed && <p className="mt-4 text-xs text-black/55 dark:text-zinc-400">The current OpenRouter listing could not be loaded. The registry’s official specs and pricing above are unchanged.</p>}
      {result?.status === "unmapped" && <p className="mt-4 text-xs text-black/55 dark:text-zinc-400">No exact OpenRouter listing is mapped for this record. Availability through other providers has not been checked.</p>}
      {result?.status === "no_endpoints" && <p className="mt-4 text-xs text-black/55 dark:text-zinc-400">The mapped OpenRouter ID returned no provider endpoints. Availability through other providers has not been checked.</p>}
      {result?.status === "lookup_failed" && <p className="mt-4 text-xs text-black/55 dark:text-zinc-400">OpenRouter details could not be retrieved right now. The registry’s official specs and pricing above are unchanged.</p>}
      {result?.status === "listed" && <>
        <p className="mt-3 text-xs text-black/50 dark:text-zinc-500">Showing {result.endpoints.length}{result.endpointCount && result.endpointCount > result.endpoints.length ? ` of ${result.endpointCount}` : ""} listed endpoint{result.endpointCount === 1 ? "" : "s"}{result.checkedAt ? `, checked ${new Date(result.checkedAt).toLocaleString()}` : ""}</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {result.endpoints.map((endpoint, index) => <article key={`${endpoint.provider}-${endpoint.tier ?? "default"}-${index}`} className="rounded-md border border-black/[0.08] bg-white p-3 text-xs dark:border-white/[0.07] dark:bg-[var(--surface-raised)]">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <h3 className="font-semibold">{endpoint.provider}</h3>
              {endpoint.tier && <span className="text-xs text-black/50 dark:text-zinc-500">{endpointLabel(endpoint.tier)}</span>}
            </div>
            <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-black/55 dark:text-zinc-400">
              <div><dt>Input / 1M</dt><dd className="font-medium text-black/80 dark:text-zinc-200">{price(endpoint.inputUsdPerMillion)}</dd></div>
              <div><dt>Output / 1M</dt><dd className="font-medium text-black/80 dark:text-zinc-200">{price(endpoint.outputUsdPerMillion)}</dd></div>
              <div><dt>Context</dt><dd className="font-medium text-black/80 dark:text-zinc-200">{tokens(endpoint.contextTokens)}</dd></div>
              <div><dt>Max output</dt><dd className="font-medium text-black/80 dark:text-zinc-200">{tokens(endpoint.maxOutputTokens)}</dd></div>
            </dl>
          </article>)}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-black/40 dark:text-zinc-600">Provider listings can change without a registry revision. Check the source before making a purchasing or deployment decision.</p>
      </>}
    </section>
  )
}
