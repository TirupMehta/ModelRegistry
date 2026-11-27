import { modelsData } from "@/data/models"
import { companies } from "@/data/companies"
import { datasetRevision } from "@/data/revision"
import { SITE_URL } from "@/lib/site"

export const dynamic = "force-dynamic"

// Versioned full-dataset snapshot for researchers. Filename carries the
// dataset version so downloads are citable and reproducible.
export async function GET() {
  const body = {
    dataset: "ModelRegistry",
    datasetVersion: datasetRevision.datasetVersion,
    revisedAt: datasetRevision.revisedAt,
    license: "MIT (Open Data)",
    methodology: `${SITE_URL}/methodology`,
    changelog: `${SITE_URL}/changelog`,
    counts: {
      models: modelsData.length,
      companies: Object.keys(companies).length,
    },
    companies: Object.values(companies),
    models: modelsData,
  }

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="modelregistry-${datasetRevision.datasetVersion}.json"`,
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
    },
  })
}
