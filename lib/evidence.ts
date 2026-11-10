import { type ModelItem, type SourceType } from "@/data/models"

/**
 * Evidence coverage.
 *
 * A record with one source is a claim. A record with an announcement, the
 * model documentation, the pricing page, the weights and the benchmark table
 * is checkable by five independent documents, and a reader no longer has to
 * take a single number on faith.
 *
 * This module counts what a record actually carries, merges the official links
 * that were already stored on the record (but not previously surfaced as
 * evidence), and grades the result against a published standard. The grade is
 * deliberately harsh: a record can be perfectly accurate and still grade C
 * because nothing backs its price.
 */

export type EvidenceKind = SourceType | "reference"

export interface EvidenceItem {
  url: string
  publisher: string
  title: string
  kind: EvidenceKind
  publishedAt?: string
  accessedAt?: string
  live?: boolean
  note?: string
  /** True when the URL is cited in `sources`; false when it is an official link only. */
  cited: boolean
}

const LINK_KIND: Record<string, EvidenceKind> = {
  announcement: "announcement",
  apiDocs: "api-docs",
  playground: "console",
  paper: "paper",
  weights: "weights",
}

const LINK_TITLE: Record<string, string> = {
  announcement: "Official announcement",
  apiDocs: "Official API documentation",
  playground: "Official console",
  paper: "Technical report",
  weights: "Model weights",
}

export const EVIDENCE_KIND_LABEL: Record<EvidenceKind, string> = {
  announcement: "Announcement",
  "api-docs": "Documentation",
  pricing: "Pricing",
  "model-card": "Model card",
  paper: "Paper",
  weights: "Weights",
  benchmark: "Benchmark",
  console: "Console",
  reference: "Reference",
}

export function evidenceFor(model: ModelItem): EvidenceItem[] {
  const items: EvidenceItem[] = []
  const seen = new Set<string>()

  for (const source of model.sources) {
    if (seen.has(source.url)) continue
    seen.add(source.url)
    items.push({
      url: source.url,
      publisher: source.publisher,
      title: source.title,
      kind: source.sourceType,
      publishedAt: source.publishedAt,
      accessedAt: source.accessedAt,
      live: source.live,
      note: source.note,
      cited: true,
    })
  }

  for (const [key, url] of Object.entries(model.links)) {
    if (!url || seen.has(url)) continue
    seen.add(url)
    items.push({
      url,
      publisher: model.companyName,
      title: LINK_TITLE[key] ?? "Official reference",
      kind: LINK_KIND[key] ?? "reference",
      cited: false,
    })
  }

  return items
}

export type EvidenceGrade = "A" | "B" | "C"

export interface EvidenceSummary {
  grade: EvidenceGrade
  items: EvidenceItem[]
  kinds: EvidenceKind[]
  citedCount: number
  /** Concrete reasons the record falls short of the published standard. */
  missing: string[]
}

const GRADE_COPY: Record<EvidenceGrade, string> = {
  A: "Announcement, documentation, pricing and any benchmark figures are each backed by a linked document.",
  B: "Primary announcement and at least one supporting document, but at least one field is not backed by a linked source.",
  C: "Thin evidence: the record rests on a single document or leaves a core field unsourced.",
}

export function gradeLabel(grade: EvidenceGrade): string {
  return GRADE_COPY[grade]
}

export function evidenceSummary(model: ModelItem): EvidenceSummary {
  const items = evidenceFor(model)
  const kinds = [...new Set(items.map((item) => item.kind))]
  const citedCount = items.filter((item) => item.cited).length

  const hasAnnouncement = items.some((item) => item.kind === "announcement")
  const hasDocs = items.some(
    (item) => item.kind === "api-docs" || item.kind === "model-card" || item.kind === "paper",
  )
  const hasPricing = items.some((item) => item.kind === "pricing")
  const hasBenchmarkSource = Boolean(model.fieldSources.benchmarks?.length)
  const hasBenchmarks = Object.keys(model.benchmarks).length > 0
  const hasWeights = items.some((item) => item.kind === "weights")

  const missing: string[] = []
  if (!hasAnnouncement) missing.push("No primary announcement is cited.")
  if (!hasDocs) missing.push("No documentation, model card or paper is cited.")
  if (!hasPricing && !model.pricingUnit) missing.push("Price is not backed by a cited pricing page.")
  if (hasBenchmarks && !hasBenchmarkSource)
    missing.push("Benchmark figures are not tied to a cited source.")
  if (model.openWeights && !hasWeights) missing.push("Weights are described but not linked.")

  const grade: EvidenceGrade =
    missing.length === 0 && items.length >= 3
      ? "A"
      : missing.length <= 2 && items.length >= 2
        ? "B"
        : "C"

  return { grade, items, kinds, citedCount, missing }
}

export interface EvidenceAudit {
  total: number
  grades: Record<EvidenceGrade, number>
  /** Records below grade A, worst first. */
  below: { model: ModelItem; summary: EvidenceSummary }[]
  averageItems: number
  averageKinds: number
}

export function auditEvidence(models: ModelItem[]): EvidenceAudit {
  const grades: Record<EvidenceGrade, number> = { A: 0, B: 0, C: 0 }
  const below: { model: ModelItem; summary: EvidenceSummary }[] = []
  let items = 0
  let kinds = 0

  for (const model of models) {
    const summary = evidenceSummary(model)
    grades[summary.grade] += 1
    items += summary.items.length
    kinds += summary.kinds.length
    if (summary.grade !== "A") below.push({ model, summary })
  }

  below.sort((a, b) => {
    // C before B: the worst-evidenced records lead the audit.
    const gradeDelta = b.summary.grade.localeCompare(a.summary.grade)
    if (gradeDelta !== 0) return gradeDelta
    return a.summary.items.length - b.summary.items.length
  })

  return {
    total: models.length,
    grades,
    below,
    averageItems: models.length > 0 ? items / models.length : 0,
    averageKinds: models.length > 0 ? kinds / models.length : 0,
  }
}
