import { NextResponse } from "next/server"
import { apiError } from "@/lib/api-errors"
import { modelsData } from "@/data/models"
import { openRouterModelIds } from "@/data/provider-catalog"

export const dynamic = "force-dynamic"

type ProviderEndpoint = {
  provider_name?: unknown
  service_tier?: unknown
  tag?: unknown
  context_length?: unknown
  max_completion_tokens?: unknown
  pricing?: { prompt?: unknown; completion?: unknown }
}

function numberOrNull(value: unknown): number | null {
  if (typeof value !== "string" && typeof value !== "number") return null
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const model = modelsData.find((item) => item.id.toLowerCase() === id.toLowerCase())
  if (!model) {
    return apiError({
      status: 404,
      code: "model_not_found",
      message: `Model '${id}' not found.`,
      details: { id, provider: "OpenRouter", endpoints: [] },
    })
  }

  const providerModelId = openRouterModelIds[model.id]
  const headers = { "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=600" }
  if (!providerModelId) {
    return NextResponse.json({ status: "unmapped", modelId: model.id, provider: "OpenRouter", endpoints: [] }, { headers })
  }

  const checkedAt = new Date().toISOString()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 3500)
  try {
    const response = await fetch(
      `https://openrouter.ai/api/v1/models/${providerModelId}/endpoints`,
      { signal: controller.signal, cache: "no-store", headers: { Accept: "application/json" } },
    )
    if (!response.ok) {
      const status = response.status === 404 ? "no_endpoints" : "lookup_failed"
      return NextResponse.json({ status, modelId: model.id, provider: "OpenRouter", checkedAt, endpoints: [] }, { headers })
    }

    const payload = await response.json()
    const rawEndpoints = Array.isArray(payload?.data?.endpoints) ? payload.data.endpoints as ProviderEndpoint[] : []
    const endpoints = rawEndpoints
      .filter((entry) => typeof entry.provider_name === "string")
      .map((entry) => {
        const routeLabel = typeof entry.tag === "string" ? entry.tag.split("/").slice(1).join("/") || "default" : null
        const inputPrice = numberOrNull(entry.pricing?.prompt)
        const outputPrice = numberOrNull(entry.pricing?.completion)
        return {
          provider: entry.provider_name as string,
          tier: typeof entry.service_tier === "string" ? entry.service_tier : routeLabel,
          contextTokens: numberOrNull(entry.context_length),
          maxOutputTokens: numberOrNull(entry.max_completion_tokens),
          inputUsdPerMillion: inputPrice === null ? null : inputPrice * 1_000_000,
          outputUsdPerMillion: outputPrice === null ? null : outputPrice * 1_000_000,
        }
      })
      .sort((a, b) => a.provider.localeCompare(b.provider) || (a.tier ?? "").localeCompare(b.tier ?? ""))

    return NextResponse.json({
      status: endpoints.length ? "listed" : "no_endpoints",
      modelId: model.id,
      provider: "OpenRouter",
      providerModelId,
      checkedAt,
      endpointCount: endpoints.length,
      endpoints: endpoints.slice(0, 8),
    }, { headers })
  } catch {
    return NextResponse.json({ status: "lookup_failed", modelId: model.id, provider: "OpenRouter", checkedAt, endpoints: [] }, { headers })
  } finally {
    clearTimeout(timeout)
  }
}
