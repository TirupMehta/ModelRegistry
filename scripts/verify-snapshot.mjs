/**
 * scripts/verify-snapshot.mjs
 *
 * Standalone, offline verification of the published snapshot. No network, no
 * trust in this codebase beyond the algorithms: it re-hashes every file the
 * manifest lists, recomputes the root hash from the manifest body, and checks
 * the detached Ed25519 signature against the published public key.
 *
 *   node scripts/verify-snapshot.mjs
 *   node scripts/verify-snapshot.mjs --json
 *
 * Exit 0 when everything verifies, 1 when anything does not.
 *
 * Equivalent manual check with standard tools:
 *   # root hash: SHA-256 of the canonical JSON of the manifest minus rootSha256
 *   openssl pkeyutl -verify -pubin -inkey public/.well-known/modelregistry-pubkey.pem \
 *     -rawin -in <(printf %s "<rootSha256>") \
 *     -sigfile <(base64 -d public/verify/manifest.sig)
 */
import fs from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"

const require = createRequire(import.meta.url)
const snapshot = require("./lib/snapshot.js")

const asJson = process.argv.includes("--json")
const manifestPath = path.join(snapshot.ROOT, snapshot.PATHS.manifest)

if (!fs.existsSync(manifestPath)) {
  console.error(`✗ No snapshot manifest at ${snapshot.PATHS.manifest}.`)
  console.error("  Generate one with: node scripts/sign-snapshot.mjs")
  process.exit(1)
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"))
const result = snapshot.verifyManifest(manifest)

if (asJson) {
  console.log(
    JSON.stringify(
      {
        ok: result.ok,
        signature: result.signature,
        problems: result.problems,
        datasetVersion: manifest.datasetVersion,
        revisedAt: manifest.revisedAt,
        rootSha256: manifest.rootSha256,
        files: (manifest.files || []).length,
        records: manifest.recordCount,
      },
      null,
      2,
    ),
  )
  process.exit(result.ok ? 0 : 1)
}

console.log("ModelRegistry snapshot verification\n")
console.log(`  dataset          ${manifest.datasetVersion} (revised ${manifest.revisedAt})`)
console.log(`  records          ${manifest.recordCount}`)
console.log(`  files hashed     ${(manifest.files || []).length}`)
console.log(`  canonical digest ${manifest.canonicalDataset?.sha256 ?? "missing"}`)
console.log(`  score digest     ${manifest.scores?.sha256 ?? "missing"} (version ${manifest.scores?.methodVersion ?? "?"})`)
console.log(`  root SHA-256     ${manifest.rootSha256}`)
console.log(`  signature        ${result.signature}`)
console.log("")

if (result.ok) {
  console.log("✔ Every file matches the manifest and the root hash is intact.")
  if (result.signature === "valid") {
    console.log("✔ The Ed25519 signature verifies against the published public key.")
  } else {
    console.log("  This snapshot is unsigned: the SHA-256 manifest detects accidental change,")
    console.log("  not a determined forger with write access to the files.")
  }
  process.exit(0)
}

console.error(`✗ Snapshot verification failed with ${result.problems.length} problem(s):`)
for (const problem of result.problems) console.error(`  - ${problem}`)
console.error("")
console.error("Any single changed byte breaks both the file hash and the root hash by design.")
process.exit(1)
