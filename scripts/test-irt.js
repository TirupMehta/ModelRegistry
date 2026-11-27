/**
 * scripts/test-irt.js
 *
 * Proves the properties the IRT board claims, on synthetic data where the right
 * answer is known. A green run means:
 *
 *   1. a model with two easy tests cannot outrank a model with fifteen hard ones
 *   2. regularization keeps slopes and estimates finite on a sparse matrix
 *   3. provider-only evidence yields "Estimated" and a wider interval
 *   4. saturated, stale and thin cohorts get zero weight
 *   5. tool and non-tool runs stay separate, and head-to-head counts are exact
 *   6. two runs over identical input produce identical bytes
 *   7. anchors are pinned exactly, so a published score cannot drift
 */
const { load } = require("./lib/ts-load")

const { fitIrt, sharedHeadToHead, MIN_COHORT } = load("lib/irt.ts")
const { canonicalJson } = load("lib/canonical-json.ts")

let failures = 0
function check(name, cond, detail) {
  if (cond) console.log(`  ✓ ${name}`)
  else {
    failures += 1
    console.error(`  ✗ ${name}${detail ? ` - ${detail}` : ""}`)
  }
}

const AS_OF = "2026-11-27"
const clamp = (value, low = 1, high = 99) => Math.min(high, Math.max(low, value))

/** One observation with honest defaults. */
function row(model, benchmark, raw, overrides = {}) {
  return {
    modelSlug: model,
    benchmarkId: benchmark,
    domain: "coding",
    rawScore: raw,
    floorScore: 0,
    ceilingScore: 100,
    toolMode: "none",
    sourceTier: "tier1_independent",
    evaluatorName: "Synthetic evaluator",
    evaluatedAt: "2026-10-01",
    sourceUrl: "https://example.com/benchmark",
    ...overrides,
  }
}

// ---- 1. two easy tests cannot beat fifteen hard ones ----------------------
{
  const abilities = { strong: 1.2, mid1: 0.5, mid2: 0.2, mid3: -0.2, mid4: -0.5, weak: -0.3 }
  const fillers = ["mid1", "mid2", "mid3", "mid4"]
  const observations = []
  for (let i = 0; i < 15; i += 1) {
    const difficulty = i / 14
    const benchmark = `bench-${i}`
    for (const model of ["strong", ...fillers]) {
      // Ceiling kept below 95 so the cohort is not dropped as saturated: the
      // point of this test is sparse evidence, not the ceiling filter.
      observations.push(row(model, benchmark, clamp(40 + 40 * abilities[model] - 40 * difficulty + 25, 5, 92)))
    }
  }
  // The weak model takes only the two easiest tests, and aces both.
  observations.push(row("weak", "bench-0", 99))
  observations.push(row("weak", "bench-1", 98))

  const result = fitIrt(observations, { asOf: AS_OF })
  const strong = result.models.find((entry) => entry.slug === "strong")
  const weak = result.models.find((entry) => entry.slug === "weak")
  check("both models are scored", Boolean(strong && weak))
  check("the weak model's evidence is two tests", weak?.observations === 2, `got ${weak?.observations}`)
  check("the fifteen-test model outranks the two-easy-test model", (strong?.index ?? 0) > (weak?.index ?? 100), `strong ${strong?.index} vs weak ${weak?.index}`)
}

// ---- 2. regularization: no NaN, no infinite slope ------------------------
{
  // One cohort, four models, identical answers: the least identifiable matrix.
  const degenerate = ["a", "b", "c", "d"].map((model) => row(model, "flat", 70))
  const result = fitIrt(degenerate, { asOf: AS_OF })
  const finite = result.models.every(
    (entry) => Number.isFinite(entry.theta) && Number.isFinite(entry.se) && Number.isFinite(entry.index) && entry.se > 0,
  )
  check("a degenerate matrix produces finite estimates", finite)
  check("regularization keeps the interval finite", result.models.every((entry) => Number.isFinite(entry.ci90[0]) && Number.isFinite(entry.ci90[1])))

  // Extremes: all 99s. Saturation drops the cohort, and nothing may NaN.
  const extremes = ["a", "b", "c", "d", "e"].map((model) => row(model, "ceiling", 99))
  const ceiling = fitIrt(extremes, { asOf: AS_OF })
  check("an all-ceiling cohort is dropped, not fitted", ceiling.counts.fittedObservations === 0, `${ceiling.counts.fittedObservations}`)
  check("dropping a cohort leaves no NaN behind", ceiling.models.length === 0)
}

// ---- 3. provider-only evidence is Estimated with a wider interval --------
{
  const observations = []
  const providerModels = ["prov1", "prov2", "prov3", "prov4", "prov5", "prov6"]
  const supportedModels = ["sup1", "sup2", "sup3", "sup4", "sup5", "sup6"]
  for (const model of providerModels) {
    observations.push(row(model, "lab-a", 60, { sourceTier: "tier2_provider" }))
    observations.push(row(model, "lab-b", 62, { sourceTier: "tier2_provider" }))
  }
  for (const model of supportedModels) {
    observations.push(row(model, "ind-a", 60))
    observations.push(row(model, "ind-b", 62))
  }
  const result = fitIrt(observations, { asOf: AS_OF })
  const provider = result.models.find((entry) => entry.slug === "prov1")
  const supported = result.models.find((entry) => entry.slug === "sup1")
  check("a provider-only model is Estimated", provider?.confidenceStatus === "Estimated", provider?.confidenceStatus)
  check("an independently measured model is Supported", supported?.confidenceStatus === "Supported", supported?.confidenceStatus)
  check("provider-only evidence gives a wider 90% interval", (provider?.se ?? 0) > (supported?.se ?? 0), `${provider?.se} vs ${supported?.se}`)
}

// ---- 4. saturated, stale and thin cohorts carry no weight ----------------
{
  const observations = []
  // saturated: 3 of 8 at the ceiling (37.5% > 25%)
  const sat = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"]
  sat.forEach((model, index) => observations.push(row(model, "sat", index < 3 ? 99 : 40)))
  // stale: last evaluation 2024, far outside the 365-day window
  const stale = ["t1", "t2", "t3", "t4", "t5"]
  stale.forEach((model) => observations.push(row(`stale-${model}`, "old", 70, { evaluatedAt: "2024-01-01" })))
  // thin: below the overlap floor
  const thin = ["u1", "u2", "u3"]
  thin.forEach((model) => observations.push(row(`thin-${model}`, "thin", 70)))
  // a healthy cohort so the fit is not empty
  const healthy = ["h1", "h2", "h3", "h4", "h5", "h6"]
  healthy.forEach((model) => {
    observations.push(row(model, "good-a", 55))
    observations.push(row(model, "good-b", 60))
  })

  const result = fitIrt(observations, { asOf: AS_OF })
  const byId = Object.fromEntries(result.cohorts.map((cohort) => [cohort.benchmarkId, cohort]))
  check("a cohort with more than 25% at the ceiling is saturated", byId.sat?.status === "saturated", byId.sat?.status)
  check("a cohort untouched for a year is stale", byId.old?.status === "stale", byId.old?.status)
  check("a cohort below the overlap floor is display only", byId.thin?.status === "insufficient_overlap", byId.thin?.status)
  check("a healthy cohort is kept", byId["good-a"]?.status === "kept", byId["good-a"]?.status)
  check("dropped cohorts produce no scores", ["sat", "old", "thin"].every((id) => !result.models.some((entry) => entry.slug === `${id}` || entry.slug.startsWith(`${id}-`))))
  check("the overlap floor is enforced at " + MIN_COHORT, MIN_COHORT === 4)

  // A model whose only evidence is a dropped cohort must not appear at all.
  check("stale-only models are absent", !result.models.some((entry) => entry.slug.startsWith("stale-t")))
}

// ---- 5. tool mode isolation and exact head-to-head ----------------------
{
  const observations = [
    row("A", "shared", 80, { toolMode: "none" }),
    row("B", "shared", 70, { toolMode: "none" }),
    row("A", "shared", 60, { toolMode: "tools" }),
    row("B", "shared", 65, { toolMode: "tools" }),
    row("A", "only-a", 90, { toolMode: "none" }),
    row("B", "other", 90, { toolMode: "none" }),
  ]
  const result = fitIrt(observations, { asOf: AS_OF })
  const ids = result.cohorts.map((cohort) => cohort.id)
  check("the same benchmark under two tool modes is two cohorts", ids.includes("shared__none") && ids.includes("shared__tools"), ids.join(", "))

  const h2h = sharedHeadToHead("A", "B", observations)
  check("head-to-head counts only shared tests", h2h.sharedCount === 2, `${h2h.sharedCount}`)
  check("head-to-head keeps the tool-mode split", h2h.perBenchmark.filter((entry) => entry.benchmarkId === "shared").length === 2)
  check("head-to-head wins are exact", h2h.winsA === 1 && h2h.winsB === 1 && h2h.ties === 0, `${h2h.winsA}/${h2h.winsB}/${h2h.ties}`)
}

// ---- 6. determinism ------------------------------------------------------
{
  const observations = []
  for (let i = 0; i < 6; i += 1) {
    for (const model of ["m1", "m2", "m3", "m4", "m5"]) {
      observations.push(row(model, `b${i}`, 40 + i * 5 + model.charCodeAt(1) % 7))
    }
  }
  const a = canonicalJson(fitIrt(observations, { asOf: AS_OF }))
  const b = canonicalJson(fitIrt([...observations], { asOf: AS_OF }))
  check("two runs produce identical bytes", a === b)
}

// ---- 7. anchors are pinned ----------------------------------------------
{
  const observations = []
  const anchors = { m1: 1.25 }
  for (let i = 0; i < 6; i += 1) {
    for (const model of ["m1", "m2", "m3", "m4", "m5"]) {
      observations.push(row(model, `b${i}`, 30 + i * 8 + (model === "m1" ? 20 : 0)))
    }
  }
  const result = fitIrt(observations, { asOf: AS_OF, anchors })
  const pinned = result.models.find((entry) => entry.slug === "m1")
  check("an anchored model keeps its exact theta", pinned?.theta === 1.25, String(pinned?.theta))
  check("the anchor is published with the result", result.anchors.m1 === 1.25)
}

// ---- 8. the committed scores are internally consistent ------------------
{
  const { IRT_SCORES, IRT_METHOD, IRT_COHORTS } = load("data/irt-scores.ts")
  const { modelsData } = load("data/models.ts")
  const known = new Set(modelsData.map((model) => model.id))
  check("every scored model exists in the registry", IRT_SCORES.every((row) => known.has(row.slug)))
  check("the index is the fixed map of theta", IRT_SCORES.every((row) => row.index === Math.round(Math.min(100, Math.max(0, 50 + 15 * row.theta)) * 10) / 10))
  check("every interval is ordered", IRT_SCORES.every((row) => row.ci90[0] <= row.index && row.index <= row.ci90[1]))
  check("every interval is finite and positive", IRT_SCORES.every((row) => Number.isFinite(row.se) && row.se > 0))
  check("scores are sorted by exact theta", IRT_SCORES.every((row, index) => index === 0 || IRT_SCORES[index - 1].theta >= row.theta))
  check("anchors are pinned in the published output", Object.entries(IRT_METHOD.anchors).every(([slug, theta]) => IRT_SCORES.find((row) => row.slug === slug)?.theta === theta))
  check("every cohort is reported with a status", IRT_COHORTS.every((cohort) => ["kept", "insufficient_overlap", "stale", "saturated", "legacy"].includes(cohort.status)))
  check("a model needs two fitted observations", IRT_SCORES.every((row) => row.observations >= 2))
}

// ---- 9. ranking uses exact ability, not the rounded index ----------------
{
  const { orderByAbility } = load("lib/irt.ts")
  // The real tie from the first published board: same 56.6 index, different theta.
  const rows = [
    { slug: "gpt-6-astra", theta: 0.4375, index: 56.6 },
    { slug: "claude-opus-5-5", theta: 0.4412, index: 56.6 },
    { slug: "glm-5-3", theta: -0.2781, index: 45.8 },
    { slug: "mimo-v2-6-pro", theta: -0.2802, index: 45.8 },
    { slug: "muse-spark-open", theta: -0.2826, index: 45.8 },
  ]
  const ordered = orderByAbility(rows).map((row) => row.slug).join(", ")
  check("an equal rounded index still ranks by exact theta", ordered === "claude-opus-5-5, gpt-6-astra, glm-5-3, mimo-v2-6-pro, muse-spark-open", ordered)
  const tie = orderByAbility([{ slug: "z", theta: 0.5 }, { slug: "a", theta: 0.5 }]).map((row) => row.slug).join(",")
  check("an exact tie breaks on the slug", tie === "a,z", tie)
}

// ---- 10. duplicate (model, cohort) rows are counted once ----------------
{
  const observations = []
  for (const model of ["a", "b", "c", "d"]) {
    observations.push(row(model, "bench-one", 55))
    observations.push(row(model, "bench-two", 60))
  }
  const clean = fitIrt(observations, { asOf: AS_OF })

  // Same model, same cohort, lower-tier and later reading: tier wins over date.
  const withDuplicate = [...observations, row("a", "bench-one", 99, { sourceTier: "tier2_provider", evaluatedAt: "2026-11-01" })]
  const result = fitIrt(withDuplicate, { asOf: AS_OF })
  check("a duplicate (model, cohort) is removed", result.counts.duplicatesRemoved === 1, String(result.counts.duplicatesRemoved))
  check("the cohort fits one row per model", result.counts.fittedObservations === 8, String(result.counts.fittedObservations))
  check("overlap counts and fitted rows agree", result.cohorts.find((cohort) => cohort.benchmarkId === "bench-one")?.models === 4)
  check(
    "the higher-tier reading is the one kept",
    result.models.find((entry) => entry.slug === "a")?.theta === clean.models.find((entry) => entry.slug === "a")?.theta,
  )

  // Two identical tiers: the later reading wins, deterministically.
  const dated = [...observations, row("a", "bench-one", 70, { evaluatedAt: "2026-11-02" })]
  const later = fitIrt(dated, { asOf: AS_OF })
  check("on equal provenance the later reading wins", later.counts.duplicatesRemoved === 1)
  check(
    "the later reading changes the estimate",
    later.models.find((entry) => entry.slug === "a")?.theta !== clean.models.find((entry) => entry.slug === "a")?.theta,
  )
}

if (failures > 0) {
  console.error(`\n❌ IRT failed with ${failures} problem(s).`)
  process.exit(1)
}
console.log("\n✔ IRT properties hold: no easy-test shortcut, finite slopes, honest provenance, zero-weight filters, isolated tool modes, deterministic output.")
