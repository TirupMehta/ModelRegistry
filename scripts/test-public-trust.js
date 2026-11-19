/**
 * Public trust guard. The site shows confirmed facts only. No page, API, feed,
 * markdown, MCP or CLI output may carry a half-confirmed label ("partially
 * verified", "unverified", "unconfirmed", "partly checked"). Internal audit state
 * lives in data/ and scripts/ and reaches output only through
 * lib/verification.ts, which returns "verified" or "retired" and nothing else.
 */
const fs = require("fs")
const path = require("path")
const ROOT = path.resolve(__dirname, "..")
const DIRS = ["app", "components", "lib", "public", "cli"]
const EXT = new Set([".ts", ".tsx", ".js", ".mjs", ".json", ".txt", ".md"])
const BANNED = /partially[_ ]verified|partly (checked|verified|confirmed)|unconfirmed|not yet confirmed|unverified|secondary mention/i
// A webhook that rejects unsigned payloads is about request signing, not about records.
const ALLOWED_FILES = new Set(["app/api/github-refresh/route.ts"])

let failures = 0
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name === ".next") continue
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p)
    else if (EXT.has(path.extname(e.name))) scan(p)
  }
}
function scan(file) {
  const rel = path.relative(ROOT, file).split(path.sep).join("/")
  if (ALLOWED_FILES.has(rel)) return
  fs.readFileSync(file, "utf8").split(/\r?\n/).forEach((line, i) => {
    if (BANNED.test(line)) {
      failures++
      console.error(`  ✗ ${rel}:${i + 1} public surface carries a half-confirmed label: ${line.trim().slice(0, 120)}`)
    }
  })
}
for (const d of DIRS) if (fs.existsSync(path.join(ROOT, d))) walk(path.join(ROOT, d))

// Public JSON for a record must never expose a non-confirmed status.
const v = fs.readFileSync(path.join(ROOT, "lib/verification.ts"), "utf8")
if (!/"verified" \|\| model\.verificationStatus === "retired"/.test(v)) {
  failures++
  console.error("  ✗ lib/verification.ts must expose only verified or retired")
}
if (failures) {
  console.error(`\n❌ public-trust failed with ${failures} problem(s). Show confirmed facts only; never advertise a gap.`)
  process.exit(1)
}
console.log("✔ Public surfaces carry confirmed facts only.")
