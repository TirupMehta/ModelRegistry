/**
 * scripts/generate-signing-key.mjs
 *
 * Creates the Ed25519 key pair used to sign the registry snapshot.
 *
 * The private key is written to `.secrets/modelregistry-signing-key.pem`, which
 * is git-ignored and never leaves this machine. The public key is written to
 * `public/.well-known/modelregistry-pubkey.pem`, which is meant to be published:
 * it is the only thing a verifier needs.
 *
 * Losing the private key does not corrupt anything: existing signatures stay
 * valid and the public key stays published, but a new snapshot cannot be signed
 * until a new pair is generated and re-published. Treat it like any release
 * signing key.
 */
import crypto from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const PRIVATE_KEY_PATH = path.join(ROOT, ".secrets", "modelregistry-signing-key.pem")
const PUBLIC_KEY_PATH = path.join(ROOT, "public", ".well-known", "modelregistry-pubkey.pem")
const force = process.argv.includes("--force")

if (fs.existsSync(PRIVATE_KEY_PATH) && !force) {
  const existing = crypto.createPrivateKey(fs.readFileSync(PRIVATE_KEY_PATH, "utf8"))
  const fingerprint = crypto
    .createHash("sha256")
    .update(crypto.createPublicKey(existing).export({ type: "spki", format: "der" }))
    .digest("hex")
    .slice(0, 16)
  console.log("A signing key already exists; refusing to overwrite it.")
  console.log(`  private: ${path.relative(ROOT, PRIVATE_KEY_PATH)}`)
  console.log(`  public:  ${path.relative(ROOT, PUBLIC_KEY_PATH)}`)
  console.log(`  fingerprint: ${fingerprint}`)
  console.log("\nNothing was changed. Re-run with --force to replace it (invalidates every earlier signature).")
  process.exit(0)
}

const { privateKey, publicKey } = crypto.generateKeyPairSync("ed25519")

fs.mkdirSync(path.dirname(PRIVATE_KEY_PATH), { recursive: true })
fs.writeFileSync(PRIVATE_KEY_PATH, privateKey.export({ type: "pkcs8", format: "pem" }), { mode: 0o600 })
fs.mkdirSync(path.dirname(PUBLIC_KEY_PATH), { recursive: true })
fs.writeFileSync(PUBLIC_KEY_PATH, publicKey.export({ type: "spki", format: "pem" }))

const fingerprint = crypto
  .createHash("sha256")
  .update(publicKey.export({ type: "spki", format: "der" }))
  .digest("hex")

console.log("Ed25519 signing key created.")
console.log(`  private: ${path.relative(ROOT, PRIVATE_KEY_PATH)} (git-ignored, never publish)`)
console.log(`  public:  ${path.relative(ROOT, PUBLIC_KEY_PATH)} (publish this)`)
console.log(`  fingerprint: ${fingerprint}`)
console.log("\nNext:")
console.log("  node scripts/sign-snapshot.mjs")
console.log("\nFor CI, set the private key as a secret (PEM text):")
console.log("  REGISTRY_SIGNING_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----...-----END PRIVATE KEY-----")
