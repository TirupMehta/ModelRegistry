/**
 * scripts/test-meridian.js
 * The Meridian score must be right by construction, and stay right as models are
 * added. This suite checks the properties that make that true, then compares
 * every published score with the ledger so no number can change by accident.
 *
 *   node scripts/test-meridian.js                 run everything
 *   node scripts/test-meridian.js --write-ledger  record the current scores as the ledger
 *
 * The properties (each one is a way a scoring system silently breaks):
 *   anchoring       adding, removing or changing any other model never moves a score
 *   order           the order of models, boards and entries never changes the result
 *   monotonic       a better result on any test never lowers a score
 *   finite          extreme or boundary readings give finite scores in the right order
 *   refusal         NaN, null, text, out-of-range percentages and duplicates throw
 *   shrinkage       more tests behind the same strength never lowers a score
 *   tiers           tiers follow the order and the stated error
 *   calibration     every scored test, and the suite, are covered by the frozen constants
 *   ledger          published scores change only when their inputs change
 */
const fs = require("fs")
const path = require("path")
const crypto = require("crypto")
const { load, ROOT } = require("./lib/ts-load")

const LEDGER = path.join(__dirname, "meridian-ledger.json")
const WRITE = process.argv.includes("--write-ledger")

const { buildStanding } = load("lib/standing.ts")
const meridian = load("lib/meridian.ts")
const { meridianCalibration } = load("data/meridian-calibration.ts")
const { independentRecords, INDEPENDENT_EVALUATOR } = load("data/independent-benchmarks.ts")
const independent = load("lib/independent.ts")
const { modelsData } = load("data/models.ts")

let failures = 0
function check(name, ok, detail) {
  if (ok) console.log(`  ✓ ${name}`)
  else {
    failures += 1
    console.error(`  ✗ ${name}${detail ? ` - ${detail}` : ""}`)
  }
}
function throws(fn, name) {
  try {
    fn()
    return false
  } catch (error) {
    return error && error.name === name
  }
}

// ---------------------------------------------------------------- fixtures
const TEST_IDS = Object.keys(meridianCalibration.tests)
const keyOf = (id) => id.replace("independent::", "")
const fake = (id) => ({ id, name: id, companyId: "x", companyName: "X" })

/** Boards in the shape the engine reads, from plain records: { id, values } */
function boardsFrom(records) {
  return TEST_IDS.map((id) => ({
    id,
    test: id,
    domain: id,
    entries: records
      .filter((record) => typeof record.values[keyOf(id)] === "number")
      .map((record) => ({ model: fake(record.id), reading: { value: record.values[keyOf(id)], score: String(record.values[keyOf(id)]) }, rank: 0 })),
  }))
}
const baseRecords = independentRecords
  .filter((record) => TEST_IDS.filter((id) => typeof record.values[keyOf(id)] === "number").length >= 7)
  .map((record) => ({ id: record.modelId, values: { ...record.values } }))
const modelsOf = (records) => records.map((record) => fake(record.id))
const run = (records, boards) => buildStanding(modelsOf(records), boards ?? boardsFrom(records))
const scores = (result) => Object.fromEntries(result.rows.map((row) => [row.model.id, row.standing]))

// seeded shuffle so a failure is reproducible
function rng(seed) {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 2 ** 32
  }
}
function shuffled(list, random) {
  const out = [...list]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

const base = run(baseRecords)
const baseScores = scores(base)
check("the fixture rates the reference models", base.rows.length >= 20, `${base.rows.length} rated`)

// ---------------------------------------------------------------- anchoring
{
  const best = {}
  const worst = {}
  for (const id of TEST_IDS) {
    const values = baseRecords.map((record) => record.values[keyOf(id)]).filter((value) => typeof value === "number")
    const isPercent = meridianCalibration.tests[id].transform === "logit"
    best[keyOf(id)] = isPercent ? 99.9 : Math.max(...values) * 3
    worst[keyOf(id)] = isPercent ? 0.1 : Math.min(...values) - 1000
  }
  const variants = {
    "a model that beats everyone is added": [...baseRecords, { id: "syn-top", values: best }],
    "a model that loses to everyone is added": [...baseRecords, { id: "syn-bottom", values: worst }],
    "ten models are added": [...baseRecords, ...Array.from({ length: 10 }, (_, i) => ({ id: `syn-${i}`, values: i % 2 ? best : worst }))],
    "a model is removed": baseRecords.slice(1),
    "half the field is removed": baseRecords.filter((_, i) => i % 2 === 0),
  }
  for (const [label, records] of Object.entries(variants)) {
    const after = scores(run(records))
    const moved = Object.keys(after).filter((id) => baseScores[id] !== undefined && after[id] !== baseScores[id])
    check(`anchoring: no existing score moves when ${label}`, moved.length === 0, moved.slice(0, 3).map((id) => `${id} ${baseScores[id]} -> ${after[id]}`).join("; "))
  }
}

// ---------------------------------------------------------------- order
{
  const random = rng(20261117)
  let identical = true
  for (let round = 0; round < 12; round++) {
    const records = shuffled(baseRecords, random).map((record) => ({ id: record.id, values: Object.fromEntries(shuffled(Object.entries(record.values), random)) }))
    const boards = shuffled(boardsFrom(records), random).map((board) => ({ ...board, entries: shuffled(board.entries, random) }))
    const result = buildStanding(shuffled(modelsOf(records), random), boards)
    const same = JSON.stringify(result.rows.map((row) => [row.model.id, row.standing, row.place, row.tier, row.se, row.band, row.maxShift])) ===
      JSON.stringify(base.rows.map((row) => [row.model.id, row.standing, row.place, row.tier, row.se, row.band, row.maxShift]))
    if (!same) identical = false
  }
  check("order: shuffling models, boards and entries gives an identical result (12 shuffles)", identical)
  check("order: the same input twice gives the same output", JSON.stringify(run(baseRecords).rows.map((r) => r.standing)) === JSON.stringify(base.rows.map((r) => r.standing)))
}

// ---------------------------------------------------------------- monotonic
{
  // The unrounded score of one record, straight from the arithmetic.
  const exact = (values) => {
    const zs = TEST_IDS.filter((id) => typeof values[keyOf(id)] === "number").map((id) => meridian.testZ(id, values[keyOf(id)], meridianCalibration.tests[id]))
    return meridian.toMeridian(meridian.composite(zs), meridianCalibration)
  }
  let violations = 0
  let notStrict = 0
  let throughEngine = 0
  let checked = 0
  for (const record of baseRecords) {
    for (const id of TEST_IDS) {
      const key = keyOf(id)
      const value = record.values[key]
      if (typeof value !== "number") continue
      const cal = meridianCalibration.tests[id]
      const bump = cal.transform === "logit" ? Math.min(0.5, (100 - value) / 2) : cal.scale * 0.05
      if (!(bump > 0) || (cal.transform === "logit" && value + bump > 99.7)) continue
      checked += 1
      const before = exact(record.values)
      const after = exact({ ...record.values, [key]: value + bump })
      if (after < before) violations += 1
      if (!(after > before)) notStrict += 1
      const improved = baseRecords.map((other) => (other.id === record.id ? { ...other, values: { ...other.values, [key]: value + bump } } : other))
      if (scores(run(improved))[record.id] < baseScores[record.id]) throughEngine += 1
    }
  }
  check(`monotonic: improving any single result never lowers the exact score (${checked} cases)`, violations === 0, `${violations} violation(s)`)
  check("monotonic: improving a result strictly raises the exact score", notStrict === 0, `${notStrict} of ${checked} did not rise`)
  check("monotonic: the published (rounded) score never falls either", throughEngine === 0, `${throughEngine} fell`)
}

// ---------------------------------------------------------------- finite
{
  const extreme = (fill) => ({ id: "syn-x", values: Object.fromEntries(TEST_IDS.map((id) => [keyOf(id), fill(meridianCalibration.tests[id])])) })
  const huge = run([...baseRecords, extreme((cal) => (cal.transform === "logit" ? 100 : 1e9))]).rows.find((row) => row.model.id === "syn-x")
  const tiny = run([...baseRecords, extreme((cal) => (cal.transform === "logit" ? 0 : -1e9))]).rows.find((row) => row.model.id === "syn-x")
  check("finite: boundary and absurd readings still give finite scores", Boolean(huge && tiny && Number.isFinite(huge.standing) && Number.isFinite(tiny.standing) && Number.isFinite(huge.se)))
  check("finite: a model above the whole field scores above it, and below scores below", huge.standing > base.rows[0].standing && tiny.standing < base.rows[base.rows.length - 1].standing)
  const ladder = [0, 1, 2].map((step) => run([...baseRecords, extreme((cal) => (cal.transform === "logit" ? [20, 60, 99.9][step] : [1e3, 1e6, 1e9][step]))]).rows.find((row) => row.model.id === "syn-x").standing)
  check("finite: the scale never saturates (larger still scores larger)", ladder[0] < ladder[1] && ladder[1] < ladder[2], ladder.join(", "))
  const z = [-1e12, -50, -3, -2.5, 0, 2.5, 3, 50, 1e12].map(meridian.limitInfluence)
  check("finite: the influence limit is strictly increasing and finite", z.every((v, i) => Number.isFinite(v) && (i === 0 || v > z[i - 1])))
}

// ---------------------------------------------------------------- refusal
{
  const bad = (mutate) => () => {
    const boards = boardsFrom(baseRecords)
    mutate(boards)
    buildStanding(modelsOf(baseRecords), boards)
  }
  check("refusal: NaN reading throws", throws(bad((b) => (b[0].entries[0].reading.value = NaN)), "MeridianInputError"))
  check("refusal: Infinity reading throws", throws(bad((b) => (b[0].entries[0].reading.value = Infinity)), "MeridianInputError"))
  check("refusal: null reading throws", throws(bad((b) => (b[0].entries[0].reading.value = null)), "MeridianInputError"))
  check("refusal: text reading throws", throws(bad((b) => (b[0].entries[0].reading.value = "59.6%")), "MeridianInputError"))
  const percentBoard = (b) => b.find((board) => meridianCalibration.tests[board.id].transform === "logit")
  check("refusal: a percentage above 100 throws", throws(bad((b) => (percentBoard(b).entries[0].reading.value = 140)), "MeridianInputError"))
  check("refusal: a negative percentage throws", throws(bad((b) => (percentBoard(b).entries[0].reading.value = -1)), "MeridianInputError"))
  check("refusal: a model listed twice on one board throws", throws(bad((b) => b[0].entries.push({ ...b[0].entries[0] })), "MeridianInputError"))
  const unknown = boardsFrom(baseRecords)
  unknown.push({ id: "independent::notCalibrated", test: "x", domain: "x", entries: unknown[0].entries })
  const withUnknown = buildStanding(modelsOf(baseRecords), unknown)
  check("refusal: a test with no calibration is not scored, and is listed", withUnknown.uncalibrated.join() === "independent::notCalibrated" && JSON.stringify(scores(withUnknown)) === JSON.stringify(baseScores))
  const one = run([{ id: "solo", values: { [keyOf(TEST_IDS[0])]: 50 } }])
  check("refusal: a model with one test gets no cross-test score", one.rows.length === 0 && one.singleTest.length === 1)
  check("refusal: the site rates only models with at least 7 of the evaluator's tests", independent.MIN_INDEPENDENT_TESTS === 7)
}

// ---------------------------------------------------------------- shrinkage
{
  const cal = meridianCalibration
  const same = (k) => meridian.composite(Array.from({ length: k }, () => 1.5))
  check("shrinkage: the same strength shown on more tests scores higher", same(2) < same(5) && same(5) < same(9) && same(9) < 1.5)
  check("shrinkage: an average model stays average at any coverage", [2, 5, 9].every((k) => meridian.composite(Array.from({ length: k }, () => 0)) === 0))
  check("shrinkage: the error band narrows as tests are added", meridian.standardError(3, cal) > meridian.standardError(6, cal) && meridian.standardError(6, cal) > meridian.standardError(10, cal))
  check("shrinkage: no tests means no claim", meridian.standardError(0, cal) === Infinity)
}

// ---------------------------------------------------------------- tiers
{
  const rows = base.rows
  check("tiers: places run 1..n in order of score", rows.every((row, i) => row.place === i + 1 && (i === 0 || rows[i - 1].standing >= row.standing)))
  check("tiers: tiers never decrease down the table and start at 1", rows[0].tier === 1 && rows.every((row, i) => i === 0 || row.tier >= rows[i - 1].tier))
  const leaders = new Map()
  for (const row of rows) if (!leaders.has(row.tier)) leaders.set(row.tier, row)
  const within = (a, b) => Math.abs(a.standing - b.standing) <= meridian.Z95 * Math.hypot(a.se, b.se) + 1
  check("tiers: everyone in a tier is inside the combined error of that tier's leader", rows.every((row) => within(leaders.get(row.tier), row)))
  const leaderList = [...leaders.entries()].sort(([a], [b]) => a - b).map(([, row]) => row)
  check("tiers: each new tier starts clearly below the previous tier's leader", leaderList.every((row, i) => i === 0 || !within(leaderList[i - 1], row)))
  check("tiers: each score sits inside its own band", rows.every((row) => row.band[0] <= row.standing && row.standing <= row.band[1]))
}

// ---------------------------------------------------------------- calibration
{
  const boards = independent.toRankable(independent.buildIndependentBoards(modelsData))
  const missing = boards.filter((board) => !meridianCalibration.tests[board.id]).map((board) => board.id)
  check("calibration: every test the site scores is calibrated", missing.length === 0, missing.join(", "))
  check("calibration: the constants are for the evaluator suite in the data", meridianCalibration.suite === INDEPENDENT_EVALUATOR.suite, `${meridianCalibration.suite} vs ${INDEPENDENT_EVALUATOR.suite}`)
  check("calibration: the constants carry the current Meridian version", meridianCalibration.version === meridian.MERIDIAN_VERSION, `${meridianCalibration.version} vs ${meridian.MERIDIAN_VERSION}`)
  const sane = Object.values(meridianCalibration.tests).every((t) => Number.isFinite(t.location) && t.scale > 0 && t.n >= 8)
  check("calibration: every test has a positive scale from at least 8 reference readings", sane)
  check("calibration: composite and noise constants are usable", meridianCalibration.composite.sd > 0 && meridianCalibration.noise > 0)
  check("calibration: the engine refuses to score data from a different suite", (() => {
    const original = INDEPENDENT_EVALUATOR.suite
    INDEPENDENT_EVALUATOR.suite = `${original} (next)`
    try {
      return throws(() => independent.buildIndependentStanding(modelsData), "MeridianInputError")
    } finally {
      INDEPENDENT_EVALUATOR.suite = original
    }
  })())
}

// ---------------------------------------------------------------- ledger
const live = independent.buildIndependentStanding(modelsData)
const hashInputs = (id) => {
  const record = independentRecords.find((candidate) => candidate.modelId === id)
  const pairs = Object.entries(record?.values ?? {}).sort(([a], [b]) => a.localeCompare(b))
  return crypto.createHash("sha1").update(JSON.stringify(pairs)).digest("hex").slice(0, 12)
}
const current = Object.fromEntries(live.rows.map((row) => [row.model.id, { score: row.standing, tests: row.cohorts, inputs: hashInputs(row.model.id) }]))

if (WRITE) {
  if (failures > 0) {
    console.error("Not writing the ledger: a Meridian invariant failed above. Fix that first.")
    process.exit(1)
  }
  const previous = fs.existsSync(LEDGER) ? JSON.parse(fs.readFileSync(LEDGER, "utf8")) : { scores: {} }
  // Keep history: a model that is no longer rated (superseded) keeps its last published score.
  const scoresOut = { ...(previous.version === meridian.MERIDIAN_VERSION ? previous.scores : {}), ...current }
  const sorted = Object.fromEntries(Object.entries(scoresOut).sort(([a], [b]) => a.localeCompare(b)))
  fs.writeFileSync(LEDGER, JSON.stringify({ version: meridian.MERIDIAN_VERSION, suite: meridianCalibration.suite, scores: sorted }, null, 2) + "\n")
  console.log(`Wrote ${path.relative(ROOT, LEDGER)} (${Object.keys(sorted).length} models, Meridian ${meridian.MERIDIAN_VERSION}).`)
  process.exit(0)
}

{
  const ledger = fs.existsSync(LEDGER) ? JSON.parse(fs.readFileSync(LEDGER, "utf8")) : null
  check("ledger: scripts/meridian-ledger.json exists", Boolean(ledger), "run: node scripts/test-meridian.js --write-ledger")
  if (ledger) {
    check("ledger: it is for this Meridian version and suite", ledger.version === meridian.MERIDIAN_VERSION && ledger.suite === meridianCalibration.suite, `ledger ${ledger.version} / ${ledger.suite}`)
    const drift = []
    const changedInputs = []
    for (const [id, now] of Object.entries(current)) {
      const was = ledger.scores[id]
      if (!was) continue
      if (was.inputs === now.inputs && was.score !== now.score) drift.push(`${id}: ${was.score} -> ${now.score}`)
      else if (was.inputs !== now.inputs) changedInputs.push(`${id}: ${was.score} -> ${now.score}`)
    }
    check("ledger: no score changed while its inputs stayed the same (calculation drift)", drift.length === 0, drift.slice(0, 5).join("; "))
    check("ledger: every published score has a ledger line", Object.keys(current).every((id) => ledger.scores[id]), `unlisted: ${Object.keys(current).filter((id) => !ledger.scores[id]).join(", ")}. Run: node scripts/test-meridian.js --write-ledger`)
    check("ledger: a score whose evidence changed is recorded in the ledger", changedInputs.length === 0, `${changedInputs.length} changed (${changedInputs.slice(0, 4).join("; ")}). The evaluator's numbers moved: review them, then run: node scripts/test-meridian.js --write-ledger`)
  }
}

if (failures > 0) {
  console.error(`\n❌ test-meridian failed with ${failures} failure(s).`)
  process.exit(1)
}
console.log(`\n✔ test-meridian: Meridian ${meridian.MERIDIAN_VERSION} holds every invariant (${live.rated} models rated).`)
