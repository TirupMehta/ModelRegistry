import { NextResponse } from "next/server"
import { createHash } from "crypto"
import { modelsData } from "@/data/models"
import { companies } from "@/data/companies"
import { datasetRevision } from "@/data/revision"

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

  if (openWeights === "true") {
    filtered = filtered.filter((m) => m.openWeights)
  } else if (openWeights === "false") {
    filtered = filtered.filter((m) => !m.openWeights)
  }

  if (flagshipOnly === "true") {
    filtered = filtered.filter((m) => m.isCompanyFlagship)
  }

  if (latestOnly === "true") {
    filtered = filtered.filter((m) => m.isLatestCheckpoint)
  }

  const verification = { verified: 0, partially_verified: 0, unverified: 0, retired: 0 }
  for (const m of filtered) {
    verification[m.verificationStatus] = (verification[m.verificationStatus] || 0) + 1
  }

  const body = {
    status: "success",
    total: filtered.length,
    // Honest revision stamp: the last real data change, not the request time.
    // See data/revision.ts (scripts/write-revision.js) and /methodology.
    updatedAt: datasetRevision.revisedAt,
    datasetVersion: datasetRevision.datasetVersion,
    verification,
    methodology: "https://modelregistry.tirup.in/methodology",
    metadata: {
      registry: "ModelRegistry",
      documentation: "https://modelregistry.tirup.in",
      docs: "https://modelregistry.tirup.in/docs",
      license: "Open Data / MIT",
      revisionPolicy:
        "Stable kebab-case record IDs. Additive fields only within v1. Breaking changes ship as v2. Dataset revisions are dated; see /changelog.",
      description: "Open frontier AI model registry tracking primary flagships and research checkpoints across all premier labs.",
    },
    companies: Object.values(companies).map((c) => {
      const flagship = modelsData.find((m) => m.companyId === c.id && m.isCompanyFlagship)
      const checkpoint = modelsData.find((m) => m.companyId === c.id && m.isLatestCheckpoint && !m.isCompanyFlagship)
      return {
        id: c.id,
        name: c.name,
        page: `/companies/${c.id}`,
        latestFlagship: flagship?.name || "",
        latestCheckpoint: checkpoint?.name || "",
      }
    }),
    models: filtered,
  }

  const etag = `"${createHash("sha256")
    .update(datasetRevision.contentHash)
    .update(request.url)
    .digest("hex")
    .slice(0, 32)}"`
  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, {
      status: 304,
      headers: { ETag: etag },
    })
  }

  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
      ETag: etag,
      "Last-Modified": new Date(`${datasetRevision.revisedAt}T00:00:00Z`).toUTCString(),
    },
  })
}
