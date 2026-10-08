import { type ModelItem } from "@/data/models"

/**
 * Shared registry queries. Single home for the "which model is newest /
 * related / Nth" derivations that used to be copy-pasted across pages,
 * components, and routes.
 *
 * The dataset is ALWAYS passed in explicitly (never imported here): server
 * components pass the server-side import for free, while client components
 * pass the copy they already hold. A top-level `modelsData` import in this
 * module would silently bundle all 219KB into every client that uses a
 * single helper - that is exactly the trap this module exists to avoid.
 */

/** Newest record by releaseDate (undefined when the registry is empty). */
export function newestRelease(models: ModelItem[]): ModelItem | undefined {
  if (models.length === 0) return undefined
  let newest = models[0]
  for (const m of models) {
    if (m.releaseDate.localeCompare(newest.releaseDate) > 0) newest = m
  }
  return newest
}

/** "YYYY-MM" of the newest tracked release, for freshness stamps. */
export function newestReleaseMonth(models: ModelItem[]): string {
  return newestRelease(models)?.releaseDate.slice(0, 7) ?? ""
}

/** Same-lab siblings for crawlable internal linking (newest first). */
export function modelSiblings(model: ModelItem, count: number, models: ModelItem[]): ModelItem[] {
  return models
    .filter((m) => m.companyId === model.companyId && m.id !== model.id)
    .sort((a, b) => b.releaseDate.localeCompare(a.releaseDate))
    .slice(0, count)
}

/**
 * Dossier folio for export surfaces. The number is the model's deterministic
 * position in the registry (1-based, zero-padded); the id is the stable
 * record slug. Both derive from live data - never hand-maintained.
 */
export function modelFolio(modelId: string, models: ModelItem[]): {
  folio: string
  folioId: string
} {
  const folioIndex = Math.max(0, models.findIndex((m) => m.id === modelId))
  return {
    folio: `MR / ${String(folioIndex + 1).padStart(3, "0")}`,
    folioId: `MR / ${modelId.toUpperCase()}`,
  }
}

/**
 * Null-safe folio for modal call sites: the details modal renders nothing
 * without a model, so a missing model yields blank strings that never paint.
 */
export function folioFor(model: ModelItem | null, models: ModelItem[]): {
  folio: string
  folioId: string
} {
  if (!model) return { folio: "", folioId: "" }
  return modelFolio(model.id, models)
}
