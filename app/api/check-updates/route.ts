import { NextResponse } from "next/server"
import { companies } from "@/data/companies"
import { modelsData } from "@/data/models"
import { datasetRevision } from "@/data/revision"

export const dynamic = "force-dynamic"

// Honest health signal. The OpenRouter fetch below is an unrelated
// third-party availability heartbeat — it says nothing about whether this
// registry's facts are correct, and the response never conflates the two.
// Factual freshness comes only from per-record verification dates.
export async function GET() {
  const generatedAt = new Date().toISOString()
  let upstream = "unchecked"
  let externalLiveCount = 0

  try {
    // Check OpenRouter public models endpoint as an upstream availability probe.
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 4000)

    const res = await fetch("https://openrouter.ai/api/v1/models", {
      signal: controller.signal,
      next: { revalidate: 300 },
    })
    clearTimeout(timeoutId)

    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data?.data)) {
        externalLiveCount = data.data.length
      }
      upstream = "reachable"
    } else {
      upstream = "unreachable"
    }
  } catch {
    // gracefully fall back if network is offline or throttled
    upstream = "unreachable"
  }

  const counts = { verified: 0, partially_verified: 0, unverified: 0, retired: 0 }
  let oldestVerificationDate: string | null = null
  for (const m of modelsData) {
    counts[m.verificationStatus] = (counts[m.verificationStatus] || 0) + 1
    if (!oldestVerificationDate || m.lastVerifiedAt < oldestVerificationDate) {
      oldestVerificationDate = m.lastVerifiedAt
    }
  }

  return NextResponse.json({
    status: "ok",
    generatedAt,
    datasetVersion: datasetRevision.datasetVersion,
    datasetLastChangedAt: datasetRevision.revisedAt,
    oldestVerificationDate,
    verifiedModelCount: counts.verified,
    partiallyVerifiedModelCount: counts.partially_verified,
    unverifiedModelCount: counts.unverified,
    retiredModelCount: counts.retired,
    upstreamAvailability: {
      openrouter: upstream,
      externalLiveCount,
    },
    trackedLabsCount: Object.keys(companies).length,
    trackedModelsCount: modelsData.length,
    methodology: "https://modelregistry.tirup.in/methodology",
    message:
      `Snapshot ${datasetRevision.datasetVersion} (data revised ${datasetRevision.revisedAt}): ` +
      `${counts.verified} verified, ${counts.partially_verified} partially verified, ` +
      `${counts.unverified} unverified of ${modelsData.length} models. ` +
      "Upstream reachability is reported separately and never implies factual verification.",
  })
}
