import { NextResponse } from "next/server"
import { createHash } from "crypto"
import { modelsData } from "@/data/models"
import { datasetRevision } from "@/data/revision"

export const dynamic = "force-dynamic"

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const DEFAULT_LIMIT = 100
const MAX_LIMIT = 500

function isValidDate(s: string): boolean {
  return DATE_RE.test(s) && !Number.isNaN(new Date(`${s}T00:00:00Z`).getTime())
}

function error(message: string, status: 400) {
  return NextResponse.json(
    {
      status: "error",
      error: message,
      usage: "/api/v1/changes?since=2026-10-01&until=2026-10-07&model=<id>&company=<lab>&limit=100",
      methodology: "https://modelregistry.tirup.in/methodology",
    },
    {
      status,
      headers: { "Access-Control-Allow-Origin": "*" },
    }
  )
}

// Incremental sync over per-model changelog history (same source as the
// /changelog page, newest first). Agents/tools poll with ?since=<YYYY-MM-DD>
// (inclusive) instead of re-pulling the full registry, then fetch only the
// changed records via GET /api/v1/models/{id}.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const since = searchParams.get("since")
  const until = searchParams.get("until")
  const modelFilter = searchParams.get("model")
  const companyFilter = searchParams.get("company")
  const limitRaw = searchParams.get("limit")

  if (since !== null && !isValidDate(since)) {
    return error(`Invalid 'since' date '${since}'. Expected YYYY-MM-DD.`, 400)
  }
  if (until !== null && !isValidDate(until)) {
    return error(`Invalid 'until' date '${until}'. Expected YYYY-MM-DD.`, 400)
  }
  if (since !== null && until !== null && since > until) {
    return error(`'since' (${since}) must not be after 'until' (${until}).`, 400)
  }

  let limit = DEFAULT_LIMIT
  if (limitRaw !== null) {
    const parsed = Number.parseInt(limitRaw, 10)
    if (!Number.isInteger(parsed) || parsed < 1) {
      return error(`Invalid 'limit' value '${limitRaw}'. Expected an integer >= 1.`, 400)
    }
    limit = Math.min(parsed, MAX_LIMIT)
  }

  const entries = modelsData.flatMap((m) =>
    m.changeLog.map((e) => ({
      date: e.date,
      summary: e.summary,
      ...(e.sources !== undefined ? { sources: e.sources } : {}),
      modelId: m.id,
      modelName: m.name,
      companyId: m.companyId,
      companyName: m.companyName,
      page: `/models/${m.id}`,
      url: `https://modelregistry.tirup.in/models/${m.id}`,
    }))
  )

  let filtered = entries
  if (since !== null) {
    filtered = filtered.filter((e) => e.date >= since)
  }
  if (until !== null) {
    filtered = filtered.filter((e) => e.date <= until)
  }
  if (modelFilter !== null) {
    const needle = modelFilter.toLowerCase()
    filtered = filtered.filter((e) => e.modelId.toLowerCase() === needle)
  }
  if (companyFilter !== null) {
    const needle = companyFilter.toLowerCase()
    filtered = filtered.filter((e) => e.companyId.toLowerCase() === needle)
  }

  // Newest first - same ordering as the /changelog page.
  filtered.sort((a, b) => b.date.localeCompare(a.date) || a.modelName.localeCompare(b.modelName))

  const total = filtered.length
  const changes = filtered.slice(0, limit)

  const body = {
    status: "success",
    total,
    returned: changes.length,
    limit,
    since,
    until,
    model: modelFilter,
    company: companyFilter,
    // Honest revision stamp: the last real data change, not the request time.
    updatedAt: datasetRevision.revisedAt,
    datasetVersion: datasetRevision.datasetVersion,
    methodology: "https://modelregistry.tirup.in/methodology",
    changelog: "https://modelregistry.tirup.in/changelog",
    changes,
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
