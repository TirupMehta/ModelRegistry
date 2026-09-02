import { modelsData } from "@/data/models"

export const dynamic = "force-dynamic"

export async function GET() {
  const flagships = modelsData.filter((m) => m.isCompanyFlagship)
  const specialized = modelsData.filter((m) => m.isLatestCheckpoint && !m.isCompanyFlagship)

  let table = ""
  table += "================================================================================\n"
  table += " MODELREGISTRY.TIRUP.IN  •  FRONTIER AI MODEL REGISTRY  •  SEPTEMBER 2026\n"
  table += "================================================================================\n\n"

  table += " PRIMARY FOUNDATION FLAGSHIPS:\n"
  table += " -------------------------------------------------------------------------------\n"
  table += " #   LAB               MODEL                   CONTEXT     PRICING     RELEASED\n"
  table += " -------------------------------------------------------------------------------\n"

  flagships.forEach((m, i) => {
    const num = String(i + 1).padStart(2, "0")
    const lab = m.companyName.padEnd(17, " ").slice(0, 17)
    const name = m.name.padEnd(23, " ").slice(0, 23)
    const ctx = m.contextWindow.replace(" tokens", "").padEnd(11, " ").slice(0, 11)
    const price = `$${m.pricing.input}/$${m.pricing.output}`.padEnd(11, " ").slice(0, 11)
    const date = m.releaseDate

    table += ` ${num}  ${lab} ${name} ${ctx} ${price} ${date}\n`
  })

  table += " -------------------------------------------------------------------------------\n\n"

  table += " RECENT SPECIALIZED CHECKPOINTS:\n"
  specialized.forEach((m) => {
    table += ` • ${m.companyName}: ${m.name} (${m.categoryLabel}) — Released ${m.releaseDate}\n`
  })

  table += "\n"
  table += " API: curl https://modelregistry.tirup.in/api/v1/models\n"
  table += " RSS: https://modelregistry.tirup.in/rss.xml\n"
  table += " WEB: https://modelregistry.tirup.in\n"
  table += " GIT: https://github.com/TirupMehta/ModelRegistry\n"
  table += "================================================================================\n"

  return new Response(table, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=86400",
    },
  })
}
