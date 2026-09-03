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

  // Automatically synchronize README.md table
  try {
    const { execFileSync } = require("child_process")
    execFileSync(process.execPath, [path.resolve(__dirname, "sync-readme.js")], { stdio: "inherit" })
  } catch (err) {
    console.warn("⚠️ Note: Could not auto-sync README table:", err.message)
  }

  process.exit(0)
}
