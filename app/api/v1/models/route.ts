import { NextResponse } from "next/server"
import { modelsData } from "@/data/models"
import { companies } from "@/data/companies"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const company = searchParams.get("company")
  const category = searchParams.get("category")
  const openWeights = searchParams.get("openWeights")
  const flagshipOnly = searchParams.get("flagshipOnly")
  const latestOnly = searchParams.get("latestOnly")

  let filtered = [...modelsData]

  if (company) {
    filtered = filtered.filter(
      (m) => m.companyId.toLowerCase() === company.toLowerCase()
    )
  }

  if (category) {
    filtered = filtered.filter(
      (m) => m.category.toLowerCase() === category.toLowerCase()
    )
  }

  if (openWeights !== null && openWeights !== undefined) {
    if (openWeights === "true") {
      filtered = filtered.filter((m) => m.openWeights)
    } else if (openWeights === "false") {
      filtered = filtered.filter((m) => !m.openWeights)
    }
  }

  if (flagshipOnly === "true") {
    filtered = filtered.filter((m) => m.isCompanyFlagship)
  }

  if (latestOnly === "true") {
    filtered = filtered.filter((m) => m.isLatestCheckpoint)
  }

  return NextResponse.json(
    {
      status: "success",
      total: filtered.length,
      updatedAt: new Date().toISOString(),
      metadata: {
        registry: "ModelRegistry",
        documentation: "https://modelregistry.tirup.in",
        license: "Open Data / MIT",
        description: "Open frontier AI model registry tracking primary flagships and research checkpoints across all premier labs.",
      },
      companies: Object.values(companies).map((c) => ({
        id: c.id,
        name: c.name,
        latestFlagship: c.latestFlagship,
        latestReasoning: c.latestReasoning,
      })),
      models: filtered,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        "Access-Control-Allow-Origin": "*",
      },
    }
  )
}
