import type { ModelItem } from "@/data/models"

/**
 * Generic fallback for unknown model slugs (e.g. ids retired by a merge).
 * Scores every model by token overlap between the slug and the model's
 * id / name / version / company, then returns the winning company's flagship
 * (falling back to its newest model when a lab has none marked) — e.g.
 * `gpt-5-6-sol` resolves to GPT-6 Astra, not to a newer sibling from another
 * modality. Requires a unique winning company, so unrelated slugs return
 * null (caller 404s) instead of redirecting somewhere arbitrary. Zero
 * per-link maintenance for future merges.
 */
export function resolveCompanyFallback(slug: string, models: ModelItem[]): ModelItem | null {
  const slugTokens = slug
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
  if (slugTokens.length === 0) return null

  const companyScores = new Map<string, number>()
  for (const m of models) {
    const corpus = new Set(
      `${m.id} ${m.name} ${m.version} ${m.companyId} ${m.companyName}`
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter(Boolean)
    )
    let score = 0
    for (const t of slugTokens) {
      if (corpus.has(t)) score += 1
    }
    if (score > 0) {
      companyScores.set(m.companyId, Math.max(companyScores.get(m.companyId) ?? 0, score))
    }
  }
  if (companyScores.size === 0) return null

  const ranked = [...companyScores.entries()].sort((a, b) => b[1] - a[1])
  if (ranked.length > 1 && ranked[0][1] === ranked[1][1]) return null

  const winner = ranked[0][0]
  const companyModels = models.filter((m) => m.companyId === winner)
  const newest = [...companyModels].sort((a, b) => b.releaseDate.localeCompare(a.releaseDate))[0]
  return companyModels.find((m) => m.isCompanyFlagship) ?? newest ?? null
}
