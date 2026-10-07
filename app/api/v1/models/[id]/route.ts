import { NextResponse } from "next/server"
import { createHash } from "crypto"
import { modelsData } from "@/data/models"
import { datasetRevision } from "@/data/revision"
import { resolveCompanyFallback } from "@/lib/model-fallback"

export const dynamic = "force-dynamic"

interface RouteContext {
  params: Promise<{ id: string }>
}

// Single-record fetch so agents/tools can poll one model without pulling
// the full ~168KB registry. IDs are stable kebab-case (case-insensitive on
// read). Unknown ids return a JSON 404 — never a redirect — with a lab
// flagship suggestion when the slug unambiguously belongs to one lab (same
// resolver as the /models/[id] page fallback).
export async function GET(request: Request, { params }: RouteContext) {
  const { id: rawId } = await params
  const id = decodeURIComponent(rawId ?? "").trim()

  if (!id) {
    return NextResponse.json(
      {
        status: "error",
        error: "Model id is required.",
        methodology: "https://modelregistry.tirup.in/methodology",
      },
      {
        status: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
      }
    )
  }

  const model = modelsData.find((m) => m.id.toLowerCase() === id.toLowerCase())

  if (!model) {
    const fallback = resolveCompanyFallback(id, modelsData)
    return NextResponse.json(
      {
        status: "error",
        error: `Model '${id}' not found.`,
        id,
        ...(fallback
          ? {
              suggestion: fallback.id,
              suggestionPage: `/models/${fallback.id}`,
              suggestionUrl: `https://modelregistry.tirup.in/models/${fallback.id}`,
            }
          : {}),
        hint: "List known ids via GET /api/v1/models (or ?company=<lab> to narrow).",
        methodology: "https://modelregistry.tirup.in/methodology",
      },
      {
        status: 404,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
          "Access-Control-Allow-Origin": "*",
        },
      }
    )
  }

  const body = {
    status: "success",
    // Honest revision stamp: the last real data change, not the request time.
    updatedAt: datasetRevision.revisedAt,
    datasetVersion: datasetRevision.datasetVersion,
    methodology: "https://modelregistry.tirup.in/methodology",
    page: `/models/${model.id}`,
    url: `https://modelregistry.tirup.in/models/${model.id}`,
    model,
  }

  const etag = `"${createHash("sha256")
    .update(datasetRevision.contentHash)
    .update(`/api/v1/models/${model.id}`)
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
