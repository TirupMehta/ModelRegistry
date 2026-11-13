/**
 * Shared reader for Artificial Analysis comparison tables, used by
 * refresh-independent.mjs and intake.mjs. Values are copied as printed.
 */
export const ROW_KEYS = new Map([
  ["intelligence index", "intelligenceIndex"],
  ["aa-briefcase v1.1", "aaBriefcase"],
  ["automationbench-aa", "automationBench"],
  ["terminal-bench 4.0", "terminalBench4"],
  ["frontiercode-aa 2.0", "frontierCode"],
  ["frontiercode 2.0", "frontierCode"],
  ["aa-omniscience v1.1", "omniscience"],
  ["gdp.pdf", "gdpPdf"],
  ["hle-diamond", "hleDiamond"],
  ["critpt v2 (hard subset)", "critPt"],
  ["terminal-bench-science 0.1", "terminalBenchScience"],
  ["cost per task", "costPerTask"],
  ["cost per task usd", "costPerTask"],
  ["time per task minutes", "minutesPerTask"],
  ["time per task", "minutesPerTask"],
])

export const norm = (text) => text.toLowerCase().replace(/[^a-z0-9.]+/g, "")

const clean = (html) =>
  html
    .replace(/<svg[\s\S]*?<\/svg>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim()

function parseValue(text) {
  const t = text.replace(/−/g, "-").replace(/[,$\s]/g, "").replace(/min$/i, "").replace(/%$/, "")
  if (t === "" || t === "--" || t === "-") return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

/** One AA comparison page -> { columns: [label], rows: {key: [value|null per column]} }. */
export function parseComparison(html) {
  const start = html.indexOf("<table")
  const end = html.indexOf("</table>", start)
  if (start < 0 || end < 0) return null
  const table = html.slice(start, end)
  const head = table.slice(table.indexOf("<thead"), table.indexOf("</thead>"))
  const cornerIsTh = !/^<thead[^>]*><tr[^>]*><td/.test(head)
  const columns = head
    .split(/<th[\s>]/)
    .slice(cornerIsTh ? 2 : 1) // a <th> corner shifts the split by one; a <td> corner does not
    .map((cell) => clean(cell.replace(/^[^>]*>/, "")))
    .filter((label) => label && label !== "Add model")
  const rows = {}
  for (const match of table.matchAll(/<tr[^>]*>\s*<th scope="row"[^>]*>([\s\S]*?)<\/th>([\s\S]*?)<\/tr>/g)) {
    const key = ROW_KEYS.get(clean(match[1]).toLowerCase())
    if (!key || rows[key]) continue
    const cells = [...match[2].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((c) => parseValue(clean(c[1])))
    rows[key] = cells
  }
  return { columns, rows }
}
