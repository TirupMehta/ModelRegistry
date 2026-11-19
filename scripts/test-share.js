/**
 * Share-preview and public-output parity.
 *
 * Every indexable route must carry an Open Graph image and a Twitter image
 * that match its own title (no text without an image, no title inherited from
 * another page), every page card the routes ask for must exist, and public
 * model JSON must never expose a non-confirmed verification status.
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

function walk(dir, out = []) {
  for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const rel = `${dir}/${e.name}`
    if (e.isDirectory()) walk(rel, out)
    else if (e.name === "page.tsx" || e.name === "layout.tsx") out.push(rel)
  }
  return out
}

// 1. Every route's metadata ships a share image, via the shared helper or its own image.
console.log("Share metadata coverage")
const NOT_INDEXED = new Set(["app/intake/page.tsx"])
const ROOT_LAYOUT = "app/layout.tsx"
for (const rel of walk("app")) {
  if (NOT_INDEXED.has(rel)) continue
  const src = read(rel)
  if (!/export const metadata|export async function generateMetadata|export function generateMetadata/.test(src)) continue
  const ok = rel === ROOT_LAYOUT ? src.includes("/api/og?") : src.includes("withShare(") || /images:\s*\[/.test(src)
  check(`share-image ${rel}`, ok, "has metadata but no share image")
}

// 2. Every page card a route asks for exists in lib/share.ts.
console.log("Page cards")
const share = read("lib/share.ts")
const cards = new Set([...share.matchAll(/case "([^"]+)":/g)].map((m) => m[1]))
const used = new Set()
for (const rel of walk("app")) {
  for (const m of read(rel).matchAll(/withShare\([\s\S]*?\{ page: "([^"]+)" \}/g)) used.add(m[1])
}
for (const p of used) check(`page-card ${p}`, cards.has(p), "withShare asks for a card that does not exist")

// 3. The image route renders page and task cards.
const og = read("app/api/og/route.tsx")
check("og route renders page cards", og.includes("pageCard("))
check("og route renders task cards", og.includes('searchParams.get("task")'))

// 4. Public model JSON never leaks an internal verification status.
console.log("Public status parity")
const src = ts.transpileModule(read("lib/verification.ts").replace(/^import type .*$/m, ""), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText
const mod = { exports: {} }
vm.runInNewContext(src, { module: mod, exports: mod.exports })
const { toPublicModel, publicVerificationStatus } = mod.exports
for (const status of ["verified", "retired", "partially_verified", "unverified"]) {
  const pub = toPublicModel({ id: "x", verificationStatus: status })
  const expected = status === "verified" || status === "retired" ? status : undefined
  check(`public status for ${status}`, pub.verificationStatus === expected && publicVerificationStatus({ verificationStatus: status }) === expected)
}

if (failures) {
  console.error(`\n❌ test-share failed with ${failures} problem(s).`)
  process.exit(1)
}
console.log("\n✔ Share previews and public output are consistent.")
