/**
 * Non-USD prices are shown exactly as the lab publishes them and are never
 * converted, ranked or compared against USD prices.
 */
const fs = require("fs")
const path = require("path")
const vm = require("vm")
const ROOT = path.resolve(__dirname, "..")
const ts = require(path.join(ROOT, "node_modules", "typescript"))
let failures = 0
const check = (name, ok, detail = "") => {
  if (ok) console.log(`  ok: '${name}'`)
  else {
    failures++
    console.error(`  ✗ ${name} ${detail}`)
  }
}
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8").replace(/\r\n/g, "\n")
function load(rel, stub = {}) {
  const out = ts.transpileModule(read(rel), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText
  const mod = { exports: {} }
  vm.runInNewContext(out, { module: mod, exports: mod.exports, require: (n) => stub[n] ?? {}, console })
  return mod.exports
}

const { modelsData } = load("data/models.ts")
const { formatPrice, isUsdPriced, priceSymbol } = load("lib/utils.ts", { clsx: { clsx: () => "" }, "tailwind-merge": { twMerge: () => "" } })

const inr = modelsData.filter((m) => m.pricingCurrency)
check("at least one model carries a non-USD price", inr.length > 0)
for (const m of inr) {
  check(`${m.id} currency is a known code`, m.pricingCurrency === "INR")
  check(`${m.id} is not USD-priced`, !isUsdPriced(m))
  check(`${m.id} shows its own symbol`, formatPrice(m).includes(priceSymbol(m)) && !formatPrice(m).includes("$"), formatPrice(m))
  check(`${m.id} price carries a citation naming the currency`, (m.fieldSources.pricing ?? []).some((s) => /₹|INR|rupee/i.test(`${s.title} ${s.note ?? ""}`)))
}

// USD rankings and comparisons must filter on isUsdPriced.
for (const rel of ["lib/alternatives.ts", "lib/best.ts", "lib/model-filters.ts", "lib/seo.ts", "app/pricing/page.tsx"]) {
  check(`${rel} excludes non-USD prices from USD comparison`, read(rel).includes("isUsdPriced"))
}

if (failures) {
  console.error(`\n❌ test-currency failed with ${failures} problem(s).`)
  process.exit(1)
}
console.log("\n✔ Non-USD prices are shown as published and never compared with USD.")
