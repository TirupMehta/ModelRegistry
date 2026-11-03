import type { ModelItem } from "@/data/models"

export type ModelSort = "default" | "newest" | "context" | "price" | "name"

export interface ModelFilters {
  lab: string
  weights: "all" | "open" | "closed"
  modality: string
  minContext: string
  maxInputPrice: string
  sort: ModelSort
}

export const DEFAULT_MODEL_FILTERS: ModelFilters = {
  lab: "all",
  weights: "all",
  modality: "all",
  minContext: "",
  maxInputPrice: "",
  sort: "default",
}

export function hasActiveModelFilters(filters: ModelFilters): boolean {
  return filters.lab !== "all" || filters.weights !== "all" ||
    filters.modality !== "all" || filters.minContext !== "" ||
    filters.maxInputPrice !== "" || filters.sort !== "default"
}

export function filterModels(models: ModelItem[], filters: ModelFilters, preserveInputOrder = false): ModelItem[] {
  const minContext = filters.minContext === "" ? null : Number(filters.minContext)
  const maxPrice = filters.maxInputPrice === "" ? null : Number(filters.maxInputPrice)
  const result = models.filter((model) => {
    if (filters.lab !== "all" && model.companyId !== filters.lab) return false
    if (filters.weights === "open" && !model.openWeights) return false
    if (filters.weights === "closed" && model.openWeights) return false
    if (filters.modality !== "all" && !model.modalities.includes(filters.modality as ModelItem["modalities"][number])) return false
    if (minContext !== null && model.contextWindowTokens < minContext * 1000) return false
    // Per-second and other non-token prices are intentionally excluded from this token-price filter.
    if (maxPrice !== null && (model.pricingUnit || model.pricing.input > maxPrice)) return false
    return true
  })

  if (!preserveInputOrder) {
    switch (filters.sort) {
      case "newest": result.sort((a, b) => b.releaseDate.localeCompare(a.releaseDate) || a.name.localeCompare(b.name)); break
      case "context": result.sort((a, b) => b.contextWindowTokens - a.contextWindowTokens || a.name.localeCompare(b.name)); break
      case "price": result.sort((a, b) => (a.pricingUnit ? Infinity : a.pricing.input) - (b.pricingUnit ? Infinity : b.pricing.input) || a.name.localeCompare(b.name)); break
      case "name": result.sort((a, b) => a.name.localeCompare(b.name)); break
    }
  }
  return result
}
