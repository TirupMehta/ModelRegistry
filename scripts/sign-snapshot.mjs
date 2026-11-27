/**
 * scripts/sign-snapshot.mjs
 *
 * Builds the deterministic snapshot manifest, signs its root SHA-256 with the
 * Ed25519 private key, and writes both artifacts.
 *
 * Outputs:
 *   public/verify/manifest.json   per-file SHA-256, dataset digest, score digest, root
 *   public/verify/manifest.sig    detached Base64 Ed25519 signature of rootSha256
 *   public/.well-known/modelregistry-pubkey.pem   public key (only with a key present)
 *
 * Run it after any change to the data files the manifest covers. `--check`
 * regenerates in memory and exits non-zero when the committed manifest is stale,
 * which is what CI should use.
 */
import fs from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"

const require = createRequire(import.meta.url)
const snapshot = require("./lib/snapshot.js")

const checkOnly = process.argv.includes("--check")
const allowUnsigned = process.argv.includes("--allow-unsigned")
const root = snapshot.ROOT

let built
try {
  built = snapshot.buildManifest()
} catch (error) {
  console.error(`✗ ${error.message}`)
  process.exit(1)
}
const { manifest, rootSha256 } = built
const manifestText = `${JSON.stringify(manifest, null, 2)}\n`
const manifestPath = path.join(root, snapshot.PATHS.manifest)
const signaturePath = path.join(root, snapshot.PATHS.signature)
const publicKeyPath = path.join(root, snapshot.PATHS.publicKey)

if (checkOnly) {
  if (!fs.existsSync(manifestPath)) {
    console.error(`✗ ${snapshot.PATHS.manifest} does not exist. Run: node scripts/sign-snapshot.mjs`)
    process.exit(1)
  }
  const committed = fs.readFileSync(manifestPath, "utf8")
  if (committed !== manifestText) {
    console.error("✗ The snapshot manifest is stale: the data changed after it was generated.")
    console.error("  Run: node scripts/sign-snapshot.mjs")
    process.exit(1)
  }
  const result = snapshot.verifyManifest(JSON.parse(committed))
  if (!result.ok) {
    console.error("✗ The committed snapshot does not verify:")
    for (const problem of result.problems) console.error(`  - ${problem}`)
    process.exit(1)
  }
  console.log(`✔ Snapshot manifest is current and verifies (${result.signature} signature).`)
  console.log(`  root: ${manifest.rootSha256}`)
  process.exit(0)
}

const privateKey = snapshot.loadPrivateKey()
let signatureWritten = false

if (privateKey) {
  const keyPem = snapshot.publicKeyPem(privateKey)
  fs.mkdirSync(path.dirname(publicKeyPath), { recursive: true })

  const existing = fs.existsSync(publicKeyPath) ? fs.readFileSync(publicKeyPath, "utf8") : null
  if (existing && existing !== keyPem) {
    console.warn("! The published public key does not match the private key in use.")
    console.warn("  Replacing it. Every signature made with the old key stops verifying.")
  }
  fs.writeFileSync(publicKeyPath, keyPem)

  const signature = snapshot.signRoot(rootSha256, privateKey)
  fs.mkdirSync(path.dirname(signaturePath), { recursive: true })
  fs.writeFileSync(signaturePath, `${signature.toString("base64")}\n`)
  signatureWritten = true
} else if (fs.existsSync(signaturePath)) {
  if (!allowUnsigned) {
    console.error("✗ A signed snapshot already exists and no private key is available.")
    console.error("  Refusing to overwrite a signed snapshot with an unsigned one.")
    console.error("")
    console.error("  Set REGISTRY_SIGNING_PRIVATE_KEY, or place the key at")
    console.error(`  ${snapshot.PATHS.privateKey} (git-ignored).`)
    console.error("  To deliberately publish an unsigned snapshot, pass --allow-unsigned.")
    process.exit(1)
  }
  // An unsigned manifest must not sit beside a signature that no longer matches
  // it: that would look signed and verify as broken.
  fs.rmSync(signaturePath)
  console.warn("! Removed the stale signature: this snapshot is now unsigned.")
}

fs.mkdirSync(path.dirname(manifestPath), { recursive: true })
fs.writeFileSync(manifestPath, manifestText)

console.log(signatureWritten ? "Snapshot signed." : "Snapshot written WITHOUT a signature.")
console.log(`  ${snapshot.PATHS.manifest}`)
if (signatureWritten) console.log(`  ${snapshot.PATHS.signature}`)
if (!signatureWritten) {
  console.log("  No signing key was configured, so only the SHA-256 manifest was produced.")
  console.log("  Create one with: node scripts/generate-signing-key.mjs")
}
console.log("")
console.log(`  dataset:  ${manifest.datasetVersion} (revised ${manifest.revisedAt})`)
console.log(`  records:  ${manifest.recordCount}`)
console.log(`  files:    ${manifest.files.length} hashed`)
console.log(`  scores:   ${manifest.scores.models} rated, version ${manifest.scores.methodVersion}`)
console.log(`  root:     ${manifest.rootSha256}`)
