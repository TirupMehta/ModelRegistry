/**
 * scripts/test-fallback.js
 * Permanent coverage for the retired-slug fallback (see ADR 002).
 * Run via `pnpm test`. Fails non-zero on any mismatch.
 */
const fs = require("fs")
const path = require("path")
const ts = require("typescript")
const vm = require("vm")

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
const { resolveCompanyFallback } = loadTsModule("../lib/model-fallback.ts")

// [unknown slug, expected target id (null = must 404)]
const cases = [
  ["openai-astra", "gpt-6-astra"],
  ["gpt-5-6-sol", "gpt-6-astra"],
  ["gpt-5-6-luna", "gpt-6-astra"],
  ["claude-opus-4-8", "claude-fable-5-1"],
  ["xyz-nope-zz", null],
  ["pro", null], // ambiguous across labs: must 404, never guess
  ["", null],
]

let failures = 0
for (const [slug, expected] of cases) {
  const got = resolveCompanyFallback(slug, modelsData)?.id ?? null
  if (got !== expected) {
    console.error(`  FAIL: '${slug}' -> '${got}' (expected '${expected}')`)
    failures += 1
  } else {
    console.log(`  ok: '${slug}' -> '${got}'`)
  }
}

if (failures > 0) {
  console.error(`\n❌ Fallback test failed with ${failures} mismatch(es).`)
  process.exit(1)
}
console.log("\n✔ Fallback behavior verified.")
