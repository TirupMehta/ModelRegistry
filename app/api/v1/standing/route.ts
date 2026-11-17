import { NextResponse } from "next/server"
import { createHash } from "crypto"
import { modelsData } from "@/data/models"
import { datasetRevision } from "@/data/revision"
import { CONTESTED_SPREAD, CORROBORATED_SPREAD, MIN_TESTS_FOR_STANDING, STABILITY_TOLERANCE, STANDING_VERSION } from "@/lib/standing"
import { PRIOR_TESTS, SOFT_LIMIT } from "@/lib/meridian"
import { meridianCalibration } from "@/data/meridian-calibration"
import { INDEPENDENT_EVALUATOR, buildIndependentStanding } from "@/lib/independent"
import { splitLineup } from "@/lib/currency"
import { leaderboardStats, LEADERBOARD_VERSION, MIN_COHORT_SIZE } from "@/lib/leaderboards"
import { SITE_URL } from "@/lib/site"

export const dynamic = "force-dynamic"

/**
 * The Meridian score as machine-readable data. The calibration constants are
 * published in full, so every score here can be recomputed from the evaluator's
 * own readings without trusting this endpoint.
 *
 * The HTML page (/score) and the Markdown view (/api/markdown/score) are the
 * readable versions of this. This endpoint exists so an agent or a third party
 * can cite, reproduce or diff the standing without scraping HTML, which is the
 * only way the numbers can be checked against the method.
 *
 * Versioned: STANDING_VERSION changes when the scale, the calibration, the
 * weighting, the refusal rule or the audit changes. Dataset revision changes when the data changes. A consumer
 * can pin both and know exactly which standing it received.
 */
export async function GET() {
  const standing = buildIndependentStanding(modelsData)
  const lineup = splitLineup(modelsData)
  const { tests } = leaderboardStats(modelsData, { currentOnly: true })

  const body = {
    status: "success",
    standingVersion: STANDING_VERSION,
    meridianVersion: STANDING_VERSION,
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
    scale: {
      name: "Meridian",
      referenceAverage: 500,
      pointsPerReferenceStandardDeviation: 100,
      ceiling: null,
      note: "Scores are measured against a frozen reference, so adding, removing or superseding any other model never changes a score.",
    },
    rules: {
      minTestsForStanding: MIN_TESTS_FOR_STANDING,
      minCohortSize: MIN_COHORT_SIZE,
      corroborationSpread: CORROBORATED_SPREAD,
      contestedSpread: CONTESTED_SPREAD,
      stabilityTolerance: STABILITY_TOLERANCE,
      transform: "percentage tests on a logit scale (readings kept 0.25 points inside 0 and 100); index, Elo and net tests as printed",
      standardise: "z = (reading - location) / scale, with the frozen median and 1.4826 x MAD of the reference field",
      influenceLimit: `z is linear to ${SOFT_LIMIT}, then ${SOFT_LIMIT} + ln(1 + |z| - ${SOFT_LIMIT}); never clipped`,
      combine: `sum of per-test z / (tests + ${PRIOR_TESTS}), equal weight per test`,
      place: "meridian = 500 + 100 x (composite - mean) / sd, with the frozen reference mean and sd",
      band: "95% band from the pooled disagreement between a model's own tests: 1.96 x noise x sqrt(tests) / (tests + prior) on the same scale",
      tiers: "a row joins the tier of the row above unless its gap to the tier leader exceeds 1.96 x the combined standard error",
      audit: "leave one test out; test dependent when the model moves more than 2 places",
    },
    calibration: meridianCalibration,
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
      standing: row.standing,
      meridian: row.standing,
      standardError: row.se,
      band95: row.band,
      perTest: row.perTest,
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