/**
 * scripts/test-user-experience.js
 * What a real visitor on average hardware lives with, checked at the source so
 * it cannot quietly regress. Five questions, each with a guard:
 *
 *   1. How much JavaScript runs on first load?    client islands never import the dataset
 *   2. Which requests are unnecessary?            no <Link> to a feed or API (it prefetches)
 *   3. What happens when the API fails?           provider and evidence panels say so and offer a retry
 *   4. Can it be used without a mouse?            skip link, a target on every page, a focus-trapped dialog
 *   5. Is the slim list actually slim?            the client record drops provenance
 *
 * The live counterpart (real script bytes of the production build) is in
 * scripts/test-routes.js.
 */
const fs = require("fs")
const path = require("path")
const { load, ROOT } = require("./lib/ts-load")

let failures = 0
const check = (name, ok, detail = "") => {
  if (ok) console.log(`  ok: '${name}'`)
  else {
    failures++
    console.error(`  ✗ ${name} ${detail}`)
  }
}
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8")
function walk(dir) {
  const out = []
  for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const rel = `${dir}/${entry.name}`
    if (entry.isDirectory()) out.push(...walk(rel))
    else if (/\.(tsx?|jsx?)$/.test(entry.name)) out.push(rel)
  }
  return out
}
const sources = [...walk("app"), ...walk("components")].filter((f) => /\.tsx$/.test(f))

console.log("JavaScript on first load")
const clientFiles = sources.filter((f) => /^\s*["']use client["']/.test(read(f)))
/** True when a file imports a runtime value (not only types) from the dataset. */
function importsDatasetValue(src) {
  // The clause may not contain a quote or semicolon, so it cannot run on from an earlier import.
  for (const match of src.matchAll(/import\s+([^"';]*?)\s+from\s+["']@\/data\/models["']/g)) {
    const clause = match[1].trim()
    if (clause.startsWith("type ")) continue
    const named = clause.match(/\{([^}]*)\}/)
    const specifiers = named ? named[1].split(",").map((s) => s.trim()).filter(Boolean) : []
    const hasDefault = /^\w+/.test(clause) && !clause.startsWith("{")
    if (hasDefault || specifiers.some((s) => !s.startsWith("type "))) return true
  }
  return false
}
const offenders = clientFiles.filter((f) => importsDatasetValue(read(f)))
check("no client component imports the dataset as a value", offenders.length === 0, offenders.join(", "))
const registrySrc = read("lib/registry.ts")
check("registry helpers take the dataset as an argument and never import it", !/import\s+(?!type\b)[^;\n]*@\/data\/models/.test(registrySrc))
const listSrc = read("lib/model-list.ts")
check("the slim-list module imports the dataset only as a type or on demand", !/^import\s+(?!type\b)[^\n]*@\/data\/models/m.test(listSrc) && listSrc.includes('import("@/data/models")'))

console.log("The slim record")
const { toListItem, toListItems } = load("lib/model-list.ts")
const { modelsData } = load("data/models.ts")
const slim = toListItems(modelsData)
const heavy = ["fieldSources", "changeLog", "sources"]
check("a list record carries none of the heavy provenance fields", slim.every((m) => heavy.every((k) => !(k in m))))
check("a list record keeps the source count and first source link", slim.every((m, i) => m.sourceCount === modelsData[i].sources.length && m.primarySourceUrl === (modelsData[i].sources[0]?.url ?? null)))
check("a list record keeps every field a card, filter or share card reads", ["id", "name", "companyId", "companyName", "releaseDate", "pricing", "contextWindow", "contextWindowTokens", "modalities", "openWeights", "highlight", "statusBadge", "categoryLabel", "isCompanyFlagship", "links"].every((k) => slim.every((m) => k in m)))
const fullBytes = Buffer.byteLength(JSON.stringify(modelsData))
const slimBytes = Buffer.byteLength(JSON.stringify(slim))
check(`the list payload is under 40% of the full dataset (${Math.round(slimBytes / 1024)} KB of ${Math.round(fullBytes / 1024)} KB)`, slimBytes < fullBytes * 0.4)
check("projecting a record does not mutate it", (() => { const copy = JSON.stringify(modelsData[0]); toListItem(modelsData[0]); return JSON.stringify(modelsData[0]) === copy })())

console.log("Unnecessary requests")
const linkTargets = []
for (const file of sources) {
  const src = read(file)
  for (const match of src.matchAll(/<Link\b[^>]*?href=(?:"([^"]+)"|\{`([^`]+)`\})/g)) {
    const href = match[1] ?? match[2]
    if (/^\/(api\/|rss\.xml|feed\.json|llms|sitemap|\.well-known)/.test(href)) linkTargets.push(`${file}: ${href}`)
  }
}
check("no <Link> points at a feed or an API route (Link prefetches its target)", linkTargets.length === 0, linkTargets.join("; "))
check("no fetch runs on page load outside the provider panel", !/fetch\(/.test(read("components/home-client.tsx")) && !/fetch\(/.test(read("components/header.tsx")))

console.log("When the API fails")
const providers = read("components/provider-availability.tsx")
check("the provider panel times out instead of waiting forever", /setTimeout\([\s\S]{0,120}abort\(\)/.test(providers) && providers.includes("LOOKUP_TIMEOUT_MS"))
check("a failed provider lookup is announced, not shown as emptiness", providers.includes("could not be checked") && providers.includes('role="status"'))
check("the provider panel offers a retry", providers.includes("Try again") && providers.includes("setAttempt"))
check("the provider panel stays silent for a model with no other providers", /result\?\.status !== "listed"\) return null/.test(providers))
const evidence = read("components/model-evidence.tsx")
check("the evidence panel says it is loading, and says when it cannot load", evidence.includes("Loading sources") && evidence.includes("could not be loaded"))
check("the evidence panel offers a retry and the full page", evidence.includes("Try again") && evidence.includes("/models/${id}"))
const headerPrompt = read("components/header-prompt.tsx")
check("the copy-prompt button times out and says what it does on failure", headerPrompt.includes("controller.abort()") && headerPrompt.includes("Opening docs"))
const waitlist = read("components/alerts-waitlist-form.tsx")
check("the waitlist form handles a network failure and a rate limit", waitlist.includes("Could not reach the server") && waitlist.includes("429"))

console.log("Without a mouse")
const layout = read("app/layout.tsx")
check("the layout starts with a skip link to the main content", /<a href="#content" className="skip-link">/.test(layout) && layout.indexOf("skip-link") < layout.indexOf("{children}"))
check("the skip link is hidden until focused and then visible", /\.skip-link\s*\{[^}]*translateY\(-200%\)/.test(read("app/globals.css")) && /\.skip-link:focus/.test(read("app/globals.css")))
const withMain = sources.filter((f) => /<main\b/.test(read(f).replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, "")))
const noTarget = withMain.filter((f) => !/<main[^>]*id="content"/.test(read(f)))
check(`every page's main landmark is the skip-link target (${withMain.length} files)`, noTarget.length === 0, noTarget.join(", "))
const modal = read("components/model-details-modal.tsx")
check("the model dialog moves focus in, keeps Tab inside, closes on Escape and returns focus", modal.includes("panelRef.current?.focus") && modal.includes('e.key !== "Tab"') && modal.includes('e.key === "Escape"') && modal.includes("opener.focus"))
check("the model dialog is labelled and modal", modal.includes('role="dialog"') && modal.includes('aria-modal="true"') && modal.includes('aria-labelledby="modal-title"'))
for (const rel of ["components/share-card-modal.tsx", "components/alerts-popup.tsx"]) {
  const src = read(rel)
  check(`${rel.split("/").pop()} traps focus, closes on Escape and restores focus`, /Escape/.test(src) && /focus\(\)/.test(src) && /Tab/.test(src))
}
const select = read("components/select.tsx")
check("the dropdown is a listbox with arrow-key and Escape handling", select.includes('role="listbox"') && select.includes("Escape") && select.includes("onOptionKeyDown"))

if (failures > 0) {
  console.error(`\n❌ User-experience guards failed: ${failures}.`)
  process.exit(1)
}
console.log("\n✔ User-experience guards hold.")
