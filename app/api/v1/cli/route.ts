import { modelsData, type ModelItem } from "@/data/models"
import { companies } from "@/data/companies"

export const dynamic = "force-dynamic"

// Fixed column widths. This table is consumed by raw terminals (including
// Windows consoles, where wide characters can render double-width), so every
// cell is BOTH padded and sliced to its width: a value can never push the
// columns after it out of alignment - it truncates instead. The header row
// is built with the same helpers, so labels and data always line up.
const COL_LAB = 15
const COL_MODEL = 22
const COL_CTX = 10
const COL_PRICE = 13
// Full row: " NN  " (5) + LAB + " " + MODEL + " " + CTX + " " + PRICE + " " + date (10).
const TABLE_WIDTH = 5 + COL_LAB + 1 + COL_MODEL + 1 + COL_CTX + 1 + COL_PRICE + 1 + 10

function cell(value: string, width: number): string {
  return value.padEnd(width, " ").slice(0, width)
}

// Only "Alibaba Cloud (Qwen)" (20 chars) overflows the lab column; shorten it
// instead of truncating mid-word. Any other overflow falls back to the lab's
// shortName, then to a hard slice as a last resort (see cell()).
const LAB_DISPLAY: Record<string, string> = {
  qwen: "Alibaba (Qwen)",
}

function labDisplay(m: ModelItem): string {
  const override = LAB_DISPLAY[m.companyId]
  if (override) return override
  if (m.companyName.length <= COL_LAB) return m.companyName
  return companies[m.companyId]?.shortName ?? m.companyName
}

// Non-ASCII punctuation (en-dash, middle dot) renders double-width on some
// consoles, which silently breaks fixed columns. Footnotes are free text, but
// ASCII keeps them readable everywhere, so transliterate there too.
function toAscii(s: string): string {
  return s.replace(/[\u2013\u2014]/g, "-").replace(/\s*·\s*/g, ", ")
}

// Token windows render as the compact count ("1,000,000"). Descriptive
// non-token windows (contextWindowTokens === 0: video clip lengths, non-token
// architectures) cannot fit the fixed column, so they render as "-" with the
// full text moved to the footnote below the table.
function contextDisplay(m: ModelItem): string {
  if (m.contextWindowTokens > 0) return m.contextWindow.replace(" tokens", "")
  return "-"
}

function wrapFootnote(text: string, width = TABLE_WIDTH - 4): string[] {
  const words = text.split(" ")
  const lines: string[] = []
  let cur = ""
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w
    if (next.length > width) {
      lines.push(cur)
      cur = w
    } else {
      cur = next
    }
  }
  if (cur) lines.push(cur)
  return lines
}

export async function GET() {
  const flagships = modelsData.filter((m) => m.isCompanyFlagship)
  const specialized = modelsData.filter((m) => m.isLatestCheckpoint && !m.isCompanyFlagship)

  let table = ""
  table += `${"=".repeat(TABLE_WIDTH)}\n`
  const newest = [...modelsData].sort((a, b) => b.releaseDate.localeCompare(a.releaseDate))[0]
  const monthLabel = newest
    ? new Date(`${newest.releaseDate.slice(0, 7)}-02`)
        .toLocaleDateString("en-US", { month: "long", year: "numeric" })
        .toUpperCase()
    : ""
  table += ` MODELREGISTRY.TIRUP.IN  •  FRONTIER AI MODEL REGISTRY  •  ${monthLabel}\n`
  table += `${"=".repeat(TABLE_WIDTH)}\n\n`

  table += " PRIMARY FOUNDATION FLAGSHIPS:\n"
  table += ` ${"-".repeat(TABLE_WIDTH - 1)}\n`
  table += ` #   ${cell("LAB", COL_LAB)} ${cell("MODEL", COL_MODEL)} ${cell("CONTEXT", COL_CTX)} ${cell("PRICING", COL_PRICE)} ${cell("RELEASED", 10)}\n`
  table += ` ${"-".repeat(TABLE_WIDTH - 1)}\n`

  flagships.forEach((m, i) => {
    const num = String(i + 1).padStart(2, "0")
    const price = `$${m.pricing.input}/$${m.pricing.output}`
    table += ` ${num}  ${cell(labDisplay(m), COL_LAB)} ${cell(m.name, COL_MODEL)} ${cell(contextDisplay(m), COL_CTX)} ${cell(price, COL_PRICE)} ${m.releaseDate}\n`
  })

  table += ` ${"-".repeat(TABLE_WIDTH - 1)}\n`

  // Footnotes for everything that cannot live in the fixed columns.
  const perSecond = flagships.filter((m) => m.pricingUnit === "per second")
  if (perSecond.length > 0) {
    table += ` * ${perSecond.map((m) => m.name).join(" + ")} bill ${perSecond[0].pricingUnit}, not per token.\n`
  }
  const nonToken = flagships.filter((m) => m.contextWindowTokens === 0)
  if (nonToken.length > 0) {
    const detail = nonToken.map((m) => `${m.name}: ${toAscii(m.contextWindow)}`).join("; ")
    const wrapped = wrapFootnote(`Non-token context windows (full specs on the model pages): ${detail}.`)
    table += ` * ${wrapped[0]}\n`
    for (const cont of wrapped.slice(1)) {
      table += `   ${cont}\n`
    }
  }

  table += "\n"
  table += " RECENT SPECIALIZED CHECKPOINTS:\n"
  specialized.forEach((m) => {
    table += ` • ${m.companyName}: ${m.name} (${m.categoryLabel}) - Released ${m.releaseDate}\n`
  })

  table += "\n"
  table += " API: curl https://modelregistry.tirup.in/api/v1/models\n"
  table += " RSS: https://modelregistry.tirup.in/rss.xml\n"
  table += " WEB: https://modelregistry.tirup.in\n"
  table += " GIT: https://github.com/TirupMehta/ModelRegistry\n"
  table += `${"=".repeat(TABLE_WIDTH)}\n`

  return new Response(table, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      // Dataset revises ~daily, so an hour at the edge is safe; stale copies
      // stay servable for a day while revalidating (this is also the view
      // behind `curl /` via middleware.ts, so edge hits matter here).
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  })
}
