const fs = require("fs")
const path = require("path")
const ts = require("typescript")
const vm = require("vm")

console.log("🔍 Validating ModelRegistry dataset integrity...")

function loadTsModule(relPath) {
  const fullPath = path.resolve(__dirname, relPath)
  const source = fs.readFileSync(fullPath, "utf8")
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText

  const mod = { exports: {} }
  const ctx = vm.createContext({
    module: mod,
    exports: mod.exports,
    require,
    console,
  })
  vm.runInContext(transpiled, ctx)
  return mod.exports
}

const { modelsData } = loadTsModule("../data/models.ts")
const { companies } = loadTsModule("../data/companies.ts")
const { leaderboardSpotlights, leaderboardMethodology } = loadTsModule("../data/leaderboard.ts")

// Records labelled current (flagship / latest checkpoint) must have been
// source-checked within this window, or the label is stale.
const VERIFICATION_FRESHNESS_DAYS = 90
const VERIFICATION_STATUSES = new Set(["verified", "partially_verified", "unverified", "retired"])
const SOURCE_TYPES = new Set([
  "announcement",
  "api-docs",
  "pricing",
  "model-card",
  "paper",
  "weights",
  "benchmark",
  "console",
])
const CORE_SOURCED_FIELDS = [
  "releaseDate",
  "contextWindow",
  "maxOutputTokens",
  "parameters",
  "license",
  "pricing",
  "modalities",
  "isCompanyFlagship",
  "isLatestCheckpoint",
]

function isValidDate(s) {
  return (
    typeof s === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(s) &&
    !Number.isNaN(new Date(`${s}T00:00:00Z`).getTime())
  )
}

function isHttpUrl(u) {
  try {
    const parsed = new URL(u)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  } catch {
    return false
  }
}

function daysSince(dateStr) {
  return (Date.now() - new Date(`${dateStr}T00:00:00Z`).getTime()) / (1000 * 60 * 60 * 24)
}

const errors = []
const seenIds = new Set()
const validCompanyIds = new Set(Object.keys(companies))
const companyFlagshipCounts = {}

modelsData.forEach((model, index) => {
  const prefix = `Model #${index + 1} [${model.id || "MISSING_ID"}]`

  // 1. ID validations
  if (!model.id || typeof model.id !== "string") {
    errors.push(`${prefix}: Missing or invalid 'id'. Must be a string.`)
  } else {
    if (seenIds.has(model.id)) {
      errors.push(`${prefix}: Duplicate id '${model.id}' detected. IDs must be unique.`)
    }
    if (!/^[a-z0-9-]+$/.test(model.id)) {
      errors.push(`${prefix}: ID '${model.id}' must be lowercase alphanumeric with hyphens only.`)
    }
    seenIds.add(model.id)
  }

  // 2. Name validation
  if (!model.name || model.name.trim().length === 0) {
    errors.push(`${prefix}: 'name' cannot be empty.`)
  }

  // 3. Company validation
  if (!model.companyId || !validCompanyIds.has(model.companyId)) {
    errors.push(
      `${prefix}: Unknown companyId '${model.companyId}'. Valid: ${Array.from(validCompanyIds).join(", ")}`
    )
  } else {
    if (model.isCompanyFlagship) {
      companyFlagshipCounts[model.companyId] = (companyFlagshipCounts[model.companyId] || 0) + 1
    }
  }

  // 4. Date validation
  if (!model.releaseDate || !/^\d{4}-\d{2}-\d{2}$/.test(model.releaseDate)) {
    errors.push(`${prefix}: 'releaseDate' must be formatted as YYYY-MM-DD (got: ${model.releaseDate}).`)
  }

  // 5. Specs validation
  if (!model.contextWindow) {
    errors.push(`${prefix}: 'contextWindow' is required (e.g. '1,000,000 tokens').`)
  }
  if (!model.parameters) {
    errors.push(`${prefix}: 'parameters' is required (e.g. '1.6T MoE').`)
  }
  if (!model.pricing || typeof model.pricing.input !== "number" || typeof model.pricing.output !== "number") {
    errors.push(`${prefix}: 'pricing' must contain numeric 'input' and 'output' values.`)
  }
  if (!model.highlight || model.highlight.trim().length < 10) {
    errors.push(`${prefix}: 'highlight' must be a descriptive summary (min 10 chars).`)
  }

  // 5b. Category / pricing-unit / modality enums (must match the ModelItem union)
  const validCategories = new Set(["flagship", "reasoning", "open-weights", "code", "multimodal", "audio", "image", "video"])
  if (!validCategories.has(model.category)) {
    errors.push(`${prefix}: Unknown category '${model.category}'. Valid: ${Array.from(validCategories).join(", ")}`)
  }
  const validModalities = new Set(["Text", "Vision", "Audio", "Video", "Code", "Image"])
  ;(model.modalities || []).forEach((mod) => {
    if (!validModalities.has(mod)) {
      errors.push(`${prefix}: Unknown modality '${mod}'. Valid: ${Array.from(validModalities).join(", ")}`)
    }
  })
  if (model.pricingUnit !== undefined && model.pricingUnit !== "per second") {
    errors.push(`${prefix}: Unknown pricingUnit '${model.pricingUnit}'. Only 'per second' is allowed (token pricing is the default).`)
  }

  // 5c. Sub-variants (rendered inside the parent page, not separate entries)
  if (model.variants !== undefined) {
    if (!Array.isArray(model.variants)) {
      errors.push(`${prefix}: 'variants' must be an array.`)
    } else {
      model.variants.forEach((v, vIdx) => {
        if (!v.name || !v.role || !v.detail || !v.pricingNote) {
          errors.push(`${prefix}: variants[${vIdx}] needs name, role, detail, and pricingNote.`)
        }
        if (v.link) {
          try {
            new URL(v.link)
          } catch {
            errors.push(`${prefix}: Invalid URL '${v.link}' in variants[${vIdx}].link.`)
          }
        }
      })
    }
  }

  // 6. Links validation
  if (model.links) {
    const urls = [model.links.announcement, model.links.playground, model.links.weights].filter(Boolean)
    urls.forEach((u) => {
      try {
        new URL(u)
      } catch {
        errors.push(`${prefix}: Invalid URL '${u}' in links.`)
      }
    })
  }
})

// Verify provenance: every published record must explain where its claims
// come from, and current/latest/flagship labels require live evidence.
modelsData.forEach((model, index) => {
  const prefix = `Model #${index + 1} [${model.id || "MISSING_ID"}]`
  const isCurrent = Boolean(model.isCompanyFlagship || model.isLatestCheckpoint)

  if (!VERIFICATION_STATUSES.has(model.verificationStatus)) {
    errors.push(
      `${prefix}: Unknown verificationStatus '${model.verificationStatus}'. Valid: ${Array.from(VERIFICATION_STATUSES).join(", ")}.`
    )
  }
  if (!isValidDate(model.lastVerifiedAt)) {
    errors.push(`${prefix}: 'lastVerifiedAt' must be YYYY-MM-DD (got: ${model.lastVerifiedAt}).`)
  }
  if (!Array.isArray(model.sources) || model.sources.length === 0) {
    errors.push(`${prefix}: Published model has no official source. Add at least one SourceRef.`)
  } else {
    model.sources.forEach((s, sIdx) => {
      if (!s || !isHttpUrl(s.url)) {
        errors.push(`${prefix}: sources[${sIdx}] has a malformed URL ('${s && s.url}').`)
      }
      if (!s || typeof s.publisher !== "string" || s.publisher.trim().length === 0) {
        errors.push(`${prefix}: sources[${sIdx}] needs a publisher.`)
      }
      if (!s || typeof s.title !== "string" || s.title.trim().length === 0) {
        errors.push(`${prefix}: sources[${sIdx}] needs a title.`)
      }
      if (!s || !isValidDate(s.accessedAt)) {
        errors.push(`${prefix}: sources[${sIdx}] needs accessedAt as YYYY-MM-DD.`)
      }
      if (!s || !SOURCE_TYPES.has(s.sourceType)) {
        errors.push(
          `${prefix}: sources[${sIdx}] has unknown sourceType '${s && s.sourceType}'. Valid: ${Array.from(SOURCE_TYPES).join(", ")}.`
        )
      }
    })
  }
  if (!model.changeLog || !Array.isArray(model.changeLog) || model.changeLog.length === 0) {
    errors.push(`${prefix}: 'changeLog' must contain at least the initial entry.`)
  }
  if (model.supersededBy !== undefined) {
    if (!seenIds.has(model.supersededBy)) {
      errors.push(`${prefix}: supersededBy '${model.supersededBy}' does not match any model id.`)
    }
    if (model.supersededBy === model.id) {
      errors.push(`${prefix}: supersededBy must reference a different model.`)
    }
  }

  // `verified` means every core fact was read against a live primary source:
  // field-level citations are mandatory, benchmarks included when published.
  if (model.verificationStatus === "verified") {
    const required = [...CORE_SOURCED_FIELDS]
    if (model.benchmarks && Object.keys(model.benchmarks).length > 0) required.push("benchmarks")
    required.forEach((field) => {
      const refs = model.fieldSources && model.fieldSources[field]
      if (!Array.isArray(refs) || refs.length === 0) {
        errors.push(`${prefix}: 'verified' record lacks field-level sourcing for '${field}'.`)
      } else {
        refs.forEach((r) => {
          if (!r || !isHttpUrl(r.url)) {
            errors.push(`${prefix}: 'verified' field '${field}' cites a malformed URL.`)
          }
        })
      }
    })
  }

  // Current / latest / flagship labels require fresh, live evidence.
  if (isCurrent) {
    if (model.verificationStatus !== "verified" && model.verificationStatus !== "partially_verified") {
      errors.push(
        `${prefix}: Labeled flagship/latest but verificationStatus is '${model.verificationStatus}'. Current labels require verified or partially_verified evidence.`
      )
    }
    const liveSources = (model.sources || []).filter((s) => s && s.live === true)
    if (liveSources.length === 0) {
      errors.push(`${prefix}: Labeled flagship/latest but has no live (HTTP 2xx) official source.`)
    }
    if (isValidDate(model.lastVerifiedAt) && daysSince(model.lastVerifiedAt) > VERIFICATION_FRESHNESS_DAYS) {
      errors.push(
        `${prefix}: Labeled flagship/latest but lastVerifiedAt (${model.lastVerifiedAt}) is older than ${VERIFICATION_FRESHNESS_DAYS} days.`
      )
    }
  }
})

// Every leaderboard section needs a published methodology with cited sources.
for (const section of Object.keys(leaderboardSpotlights)) {
  const method = leaderboardMethodology && leaderboardMethodology[section]
  if (!method || typeof method.basis !== "string" || method.basis.trim().length < 20) {
    errors.push(`Leaderboard section '${section}' lacks a published methodology basis.`)
  }
  if (!method || !isValidDate(method.evaluatedAt)) {
    errors.push(`Leaderboard section '${section}' lacks a valid evaluatedAt date.`)
  }
  if (!method || !Array.isArray(method.sources) || method.sources.length === 0) {
    errors.push(`Leaderboard section '${section}' lacks cited source data.`)
  } else {
    method.sources.forEach((u) => {
      if (!isHttpUrl(u)) errors.push(`Leaderboard section '${section}' cites a malformed URL ('${u}').`)
    })
  }
}

// Verify that every leaderboard spotlight ID points at a real model,
// so renames/merges can never silently empty a leaderboard section.
for (const [section, ids] of Object.entries(leaderboardSpotlights)) {
  ids.forEach((id) => {
    if (!seenIds.has(id)) {
      errors.push(`Leaderboard section '${section}': unknown model id '${id}'. Update data/leaderboard.ts.`)
    }
  })
}

// Company website URLs must be valid: /companies calls new URL() at render,
// so one malformed URL would crash the whole page.
for (const [companyId, company] of Object.entries(companies)) {
  try {
    new URL(company.website)
  } catch {
    errors.push(`Company '${companyId}': invalid website URL '${company.website}'.`)
  }
}

// Every leaderboard section must be rendered by the leaderboard page,
// so config keys can never go stale unnoticed in the other direction.
// The page is a server shell; rendering lives in its client island, so
// both sources are checked together.
const leaderboardPageSource = [
  "../app/leaderboard/page.tsx",
  "../components/leaderboard-client.tsx",
]
  .map((f) => fs.readFileSync(path.resolve(__dirname, f), "utf8"))
  .join("\n")
for (const section of Object.keys(leaderboardSpotlights)) {
  if (!leaderboardPageSource.includes(`leaderboardSpotlights.${section}`)) {
    errors.push(`Leaderboard section '${section}' is configured but not rendered by the leaderboard page or its client island.`)
  }
}

// Verify that each company has at least one flagship model
for (const companyId of validCompanyIds) {
  const count = companyFlagshipCounts[companyId] || 0
  if (count === 0) {
    errors.push(`Company '${companyId}' has NO model designated with 'isCompanyFlagship: true'.`)
  } else if (count > 1) {
    errors.push(`Company '${companyId}' has ${count} models marked as 'isCompanyFlagship: true'. Only 1 allowed.`)
  }
}

if (errors.length > 0) {
  console.error(`\n❌ Validation failed with ${errors.length} error(s):`)
  errors.forEach((e) => console.error(`  - ${e}`))
  process.exit(1)
} else {
  console.log(
    `\n✔ Dataset verified successfully: ${modelsData.length} models across ${validCompanyIds.size} laboratories.`
  )
  const statusCounts = {}
  modelsData.forEach((m) => {
    statusCounts[m.verificationStatus] = (statusCounts[m.verificationStatus] || 0) + 1
  })
  console.log(`  Verification: ${Object.entries(statusCounts).map(([k, v]) => `${k}=${v}`).join(", ")}.`)

  // Automatically synchronize README.md table
  try {
    const { execFileSync } = require("child_process")
    execFileSync(process.execPath, [path.resolve(__dirname, "write-revision.js")], { stdio: "inherit" })
    execFileSync(process.execPath, [path.resolve(__dirname, "sync-readme.js")], { stdio: "inherit" })
  } catch (err) {
    console.warn("⚠️ Note: Could not auto-sync README table:", err.message)
  }

  process.exit(0)
}
