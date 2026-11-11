import { NextResponse } from "next/server"
import { createHash } from "crypto"
import { modelsData } from "@/data/models"
import { datasetRevision } from "@/data/revision"
import { STANDING_VERSION } from "@/lib/standing"
import { INDEPENDENT_EVALUATOR, buildIndependentStanding } from "@/lib/independent"
import { splitLineup } from "@/lib/currency"
import { leaderboardStats, LEADERBOARD_VERSION, MIN_COHORT_SIZE } from "@/lib/leaderboards"
import { SITE_URL } from "@/lib/site"

export const dynamic = "force-dynamic"

/**
 * Cross-test standing as machine-readable data.
 *
 * The HTML page (/score) and the Markdown view (/api/markdown/score) are the
 * readable versions of this. This endpoint exists so an agent or a third party
 * can cite, reproduce or diff the standing without scraping HTML, which is the
 * only way the numbers can be checked against the method.
 *
 * Versioned: STANDING_VERSION changes when the equating, weighting, refusal rule
 * or audit changes. Dataset revision changes when the data changes. A consumer
 * can pin both and know exactly which standing it received.
 */
export async function GET() {
  const standing = buildIndependentStanding(modelsData)
  const lineup = splitLineup(modelsData)
  const { tests } = leaderboardStats(modelsData, { currentOnly: true })

  const body = {
    status: "success",
    standingVersion: STANDING_VERSION,
    leaderboardVersion: LEADERBOARD_VERSION,
    updatedAt: datasetRevision.revisedAt,
    datasetVersion: datasetRevision.datasetVersion,
    source: {
      html: `${SITE_URL}/score`,
      markdown: `${SITE_URL}/api/markdown/score`,
      method: `${SITE_URL}/methodology`,
    },
    basis: {
      evaluator: INDEPENDENT_EVALUATOR.name,
      suite: INDEPENDENT_EVALUATOR.suite,
      retrievedAt: INDEPENDENT_EVALUATOR.retrievedAt,
      method: INDEPENDENT_EVALUATOR.method,
      laboratoryReportedScoresIncluded: false,
    },
    rules: {
      minTestsForStanding: 2,
      minCohortSize: MIN_COHORT_SIZE,
      corroborationSpread: 20,
      contestedSpread: 50,
      stabilityTolerance: 2,
      midrank: "Hazen plotting position (below + (equal-1)/2 + 0.5) / n",
      weights: "equal per cohort",
      audit: "leave one cohort out; test dependent when the model moves more than 2 places",
    },
    betweenTest: {
      sd: standing.betweenTestSd,
      pooledVariance: standing.betweenTest,
      observations: standing.observations,
      ratedModels: standing.rated,
      rankedModels: standing.ranked,
      worstShift: standing.worstShift,
      meanCoverage: standing.meanCoverage,
    },
    cohorts: standing.cohorts.map((cohort) => ({
      id: cohort.id,
      test: cohort.test,
      domain: cohort.domain,
      size: cohort.size,
      spread: cohort.spread,
      anchors: cohort.anchors,
      weaklyLinked: cohort.weaklyLinked,
      saturated: cohort.saturated,
    })),
    rows: standing.rows.map((row) => ({
      place: row.place,
      tier: row.tier,
      auditable: row.auditable,
      model: row.model.name,
      id: row.model.id,
      laboratory: row.model.companyName,
      standing: Number(row.standing.toFixed(1)),
      cohorts: row.cohorts,
      spread: Math.round(row.spread),
      agreement: row.agreement,
      levelUncertain: row.levelUncertain,
      stable: row.stable,
      maxShift: row.maxShift,
      unanimous: row.unanimous,
      tests: row.tests,
    })),
    singleTest: standing.singleTest.map((row) => ({
      model: row.model.name,
      id: row.model.id,
      laboratory: row.model.companyName,
      test: row.test,
      rank: row.rank,
      of: row.of,
      score: row.score,
      leading: row.leading,
    })),
    superseded: lineup.superseded.map(({ model, successor }) => ({
      model: model.name,
      id: model.id,
      laboratory: model.companyName,
      released: model.releaseDate,
      supersededBy: successor ? successor.id : null,
      successor: successor ? successor.name : null,
    })),
    tests,
  }

  const etag = `"${createHash("sha256").update(JSON.stringify(body)).digest("hex").slice(0, 16)}"`

  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
      ETag: etag,
      "Last-Modified": new Date(`${datasetRevision.revisedAt}T00:00:00Z`).toUTCString(),
    },
  })
}