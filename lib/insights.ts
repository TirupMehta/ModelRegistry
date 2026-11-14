import { discrepancies, valueRows, INDEPENDENT_EVALUATOR, independentFor } from "@/lib/independent"

/** Facts for the two data stories under /insights. Computed from the registry, never typed in. */

function summarise(rows: ReturnType<typeof discrepancies>) {
  const lower = rows.filter((row) => row.gap < 0)
  const mean = rows.length ? rows.reduce((sum, row) => sum + row.gap, 0) / rows.length : 0
  return { total: rows.length, lowerCount: lower.length, meanGap: Math.round(mean * 10) / 10 }
}

export function labClaimStory() {
  const rows = discrepancies()
  const all = summarise(rows)
  const same = summarise(rows.filter((row) => row.likeForLike))
  return { rows, ...all, sameVersion: same, worst: rows[0] ?? null }
}

export function costStory() {
  const rows = valueRows()
  const frontier = rows.filter((row) => row.onFrontier).sort((a, b) => a.costPerTask - b.costPerTask)
  const top = rows[0] ?? null
  const cheapestAbove50 = rows.filter((row) => row.index >= 50).sort((a, b) => a.costPerTask - b.costPerTask)[0] ?? null
  const priciest = [...rows].sort((a, b) => b.costPerTask - a.costPerTask)[0] ?? null
  return { rows, frontier, top, cheapestAbove50, priciest }
}

const csvCell = (value: string | number | null | undefined) => {
  const text = value === null || value === undefined ? "" : String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function toCsv(header: string[], rows: (string | number | null | undefined)[][]): string {
  return [header, ...rows].map((line) => line.map(csvCell).join(",")).join("\n") + "\n"
}

export function labClaimCsv(): string {
  const story = labClaimStory()
  return toCsv(
    ["model_id", "model", "lab", "test", "lab_reported_pct", "independent_pct", "gap_points", "same_version", "independent_source", "read_on"],
    story.rows.map((row) => [
      row.model.id,
      row.model.name,
      row.model.companyName,
      row.test,
      row.lab,
      row.independent,
      row.gap,
      row.likeForLike ? "yes" : "no",
      independentFor(row.model.id)?.sourceUrl ?? "",
      INDEPENDENT_EVALUATOR.retrievedAt,
    ]),
  )
}

export function costCsv(): string {
  const story = costStory()
  return toCsv(
    ["model_id", "model", "lab", "intelligence_index", "cost_per_task_usd", "minutes_per_task", "index_points_per_dollar", "on_cost_frontier", "independent_source", "read_on"],
    story.rows.map((row) => [
      row.model.id,
      row.model.name,
      row.model.companyName,
      row.index,
      row.costPerTask,
      row.minutesPerTask,
      Math.round(row.pointsPerDollar * 100) / 100,
      row.onFrontier ? "yes" : "no",
      independentFor(row.model.id)?.sourceUrl ?? "",
      INDEPENDENT_EVALUATOR.retrievedAt,
    ]),
  )
}
