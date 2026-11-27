/**
 * scripts/lib/snapshot.js
 *
 * The tamper-evident snapshot. One canonical manifest, one root SHA-256, one
 * optional Ed25519 signature, all reproducible from the files in the repository.
 *
 * What a reader can prove with it:
 *   1. The dataset files here are the ones the manifest lists (per-file SHA-256).
 *   2. The canonical projection of those files hashes to the recorded digest.
 *   3. The ModelRegistry Score that the projection implies hashes to the recorded
 *      digest.
 *   4. If a signature is published, the manifest was signed by the holder of the
 *      private key whose public half is at /.well-known/modelregistry-pubkey.pem,
 *      and not one byte of the manifest changed after signing.
 *
 * Determinism is the whole point, so `generatedAt` is the dataset revision date,
 * never a build clock. Two runs over the same data produce the same bytes, and
 * `scripts/test-snapshot.js` asserts exactly that.
 *
 * Node only (crypto, fs). Shared by the signer CLI, the verifier CLI and tests.
 */
const fs = require("fs")
const path = require("path")
const crypto = require("crypto")
const { load, ROOT } = require("./ts-load")

const { canonicalJson } = load("lib/canonical-json.ts")

/**
 * The dataset modules are loaded on first use, not at require time: verification
 * only needs the manifest, the files and the public key, so `verify-snapshot`
 * stays fast and independent of the dataset it is checking.
 */
let cached = null
function dataset() {
  if (cached) return cached
  const { toCanonicalDataset } = load("lib/canonical.ts")
  const { buildIndependentStanding } = load("lib/independent.ts")
  const { modelsData } = load("data/models.ts")
  const { datasetRevision } = load("data/revision.ts")
  cached = { toCanonicalDataset, buildIndependentStanding, modelsData, datasetRevision }
  return cached
}

const SNAPSHOT_VERSION = "1.0"
const SCHEMA_VERSION = "1.0"

/** Paths relative to the repository root. */
const PATHS = {
  manifest: "public/verify/manifest.json",
  signature: "public/verify/manifest.sig",
  publicKey: "public/.well-known/modelregistry-pubkey.pem",
  privateKey: ".secrets/modelregistry-signing-key.pem",
}

/**
 * Files the manifest covers. Data and the published schema only: the code that
 * generates the snapshot is versioned by git, and hashing it here would make
 * every comment edit look like a data change.
 */
const HASHED_FILES = [
  "data/models.ts",
  "data/companies.ts",
  "data/leaderboard.ts",
  "data/independent-benchmarks.ts",
  "data/meridian-calibration.ts",
  "data/epoch-eci.ts",
  "data/huggingface.ts",
  "data/benchmarks.ts",
  "data/irt-anchors.ts",
  "data/irt-scores.ts",
  "data/api-ids.ts",
  "data/provider-catalog.ts",
  "data/revision.ts",
  "data/canonical-overrides.ts",
  "data/price-history.ts",
  "data/model-schema.v1.json",
]

function resolvePath(rel) {
  return path.resolve(ROOT, rel)
}

function sha256(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex")
}

/** Canonical projection of the whole registry, plus its digest. */
function buildCanonicalDataset() {
  const { toCanonicalDataset, modelsData } = dataset()
  const records = toCanonicalDataset(modelsData)
  const text = canonicalJson(records)
  return {
    records,
    digest: {
      sha256: sha256(Buffer.from(text, "utf8")),
      bytes: Buffer.byteLength(text, "utf8"),
      records: records.length,
    },
  }
}

/**
 * The published score, reduced to the values that matter for reproducibility.
 * The full rows carry model objects; the digest deliberately covers only the
 * numbers, so re-serializing a page cannot change the snapshot.
 */
function buildScoreDigest() {
  const { buildIndependentStanding } = dataset()
  const standing = buildIndependentStanding()
  const rows = standing.rows
    .map((row) => ({
      slug: row.model.id,
      standing: row.standing,
      se: row.se,
      bandLow: row.band[0],
      bandHigh: row.band[1],
      place: row.place,
      tier: row.tier,
      tests: row.tests.length,
    }))
    .sort((a, b) => a.slug.localeCompare(b.slug))
  const payload = { method: "ModelRegistry Score", methodVersion: standing.version, rows }
  const text = canonicalJson(payload)
  return {
    methodVersion: standing.version,
    sha256: sha256(Buffer.from(text, "utf8")),
    bytes: Buffer.byteLength(text, "utf8"),
    models: rows.length,
    observations: standing.observations,
  }
}

/**
 * The manifest body the root hash covers: everything except the hash itself.
 * The signature is detached (public/verify/manifest.sig), so the manifest bytes
 * are identical whether or not the snapshot was signed.
 */
function manifestBody(manifest) {
  const { rootSha256: _root, ...body } = manifest
  void _root
  return body
}

function computeRoot(manifest) {
  return sha256(Buffer.from(canonicalJson(manifestBody(manifest)), "utf8"))
}

/**
 * Builds the manifest from the current files. Pure with respect to the clock:
 * `generatedAt` comes from the dataset revision, so the output is reproducible.
 */
function buildManifest() {
  const { modelsData, datasetRevision } = dataset()

  // A snapshot whose version does not match its files is the one thing the
  // version exists to prevent. Refuse before writing anything.
  const { computeContentHash } = require("../write-revision.js")
  const expected = computeContentHash()
  if (expected !== datasetRevision.contentHash) {
    throw new Error(
      `data/revision.ts is stale (content hash ${datasetRevision.contentHash}, data hashes to ${expected}). Run: npm run validate, then re-run this.`,
    )
  }

  const files = HASHED_FILES.map((rel) => {
    const bytes = fs.readFileSync(resolvePath(rel))
    return { path: rel, sha256: sha256(bytes), bytes: bytes.length }
  }).sort((a, b) => a.path.localeCompare(b.path))

  const canonical = buildCanonicalDataset()
  const scores = buildScoreDigest()

  const body = {
    // The version of this snapshot format. Content identity is datasetVersion
    // plus rootSha256; this number only says how to read the file.
    snapshotVersion: SNAPSHOT_VERSION,
    schemaVersion: SCHEMA_VERSION,
    datasetVersion: datasetRevision.datasetVersion,
    revisedAt: datasetRevision.revisedAt,
    generatedAt: datasetRevision.revisedAt,
    recordCount: modelsData.length,
    files,
    canonicalDataset: canonical.digest,
    scores,
  }

  const rootSha256 = sha256(Buffer.from(canonicalJson(body), "utf8"))
  const manifest = { ...body, rootSha256 }
  return { manifest, rootSha256 }
}

/* ------------------------------------------------------------------ */
/* Keys                                                                */
/* ------------------------------------------------------------------ */

/**
 * The signing key, from `REGISTRY_SIGNING_PRIVATE_KEY` (PEM, or base64 of PEM)
 * or from the local, git-ignored `.secrets/` file. Null when neither exists.
 */
function loadPrivateKey() {
  const inline = (process.env.REGISTRY_SIGNING_PRIVATE_KEY || "").trim()
  if (inline.length > 0) {
    const pem = inline.includes("BEGIN") ? inline.replace(/\\n/g, "\n") : Buffer.from(inline, "base64").toString("utf8")
    return crypto.createPrivateKey(pem)
  }
  const file = resolvePath(PATHS.privateKey)
  if (fs.existsSync(file)) return crypto.createPrivateKey(fs.readFileSync(file, "utf8"))
  return null
}

function publicKeyPem(privateKey) {
  return crypto.createPublicKey(privateKey).export({ type: "spki", format: "pem" }).toString()
}

function signRoot(rootSha256, privateKey) {
  return crypto.sign(null, Buffer.from(rootSha256, "utf8"), privateKey)
}

function verifyRoot(rootSha256, signature, publicKeyPemText) {
  try {
    return crypto.verify(null, Buffer.from(rootSha256, "utf8"), publicKeyPemText, signature)
  } catch {
    return false
  }
}

/* ------------------------------------------------------------------ */
/* Verification                                                        */
/* ------------------------------------------------------------------ */

/** Every file the manifest lists, hashed again from disk. */
function verifyFiles(manifest, rootDir = ROOT) {
  const mismatches = []
  for (const entry of manifest.files || []) {
    const file = path.resolve(rootDir, entry.path)
    if (!fs.existsSync(file)) {
      mismatches.push(`${entry.path}: missing`)
      continue
    }
    const bytes = fs.readFileSync(file)
    if (bytes.length !== entry.bytes) {
      mismatches.push(`${entry.path}: ${bytes.length} bytes, manifest says ${entry.bytes}`)
      continue
    }
    if (sha256(bytes) !== entry.sha256) mismatches.push(`${entry.path}: SHA-256 differs from the manifest`)
  }
  return { ok: mismatches.length === 0, mismatches }
}

/**
 * Full offline verification of a manifest object against the files on disk and,
 * when present, the published public key.
 */
function verifyManifest(manifest, { rootDir = ROOT, publicKeyPem: keyPem } = {}) {
  const problems = []

  const computed = computeRoot(manifest)
  if (computed !== manifest.rootSha256) {
    problems.push(`root SHA-256 mismatch: manifest says ${manifest.rootSha256}, content hashes to ${computed}`)
  }

  // Two numbers that must agree: the dataset count is published twice, and a
  // manifest that disagrees with itself is not a manifest.
  if (
    typeof manifest.recordCount === "number" &&
    manifest.canonicalDataset &&
    typeof manifest.canonicalDataset.records === "number" &&
    manifest.recordCount !== manifest.canonicalDataset.records
  ) {
    problems.push(
      `recordCount ${manifest.recordCount} does not match canonicalDataset.records ${manifest.canonicalDataset.records}`,
    )
  }

  const files = verifyFiles(manifest, rootDir)
  problems.push(...files.mismatches)

  // The signature is detached, so its existence on disk is what makes the
  // snapshot signed. A manifest with no .sig beside it is an unsigned snapshot,
  // not a broken one.
  let signature = "absent"
  const signatureFile = path.resolve(rootDir, PATHS.signature)
  if (fs.existsSync(signatureFile)) {
    if (!keyPem) {
      const keyFile = path.resolve(rootDir, PATHS.publicKey)
      if (fs.existsSync(keyFile)) keyPem = fs.readFileSync(keyFile, "utf8")
    }
    if (!keyPem) {
      problems.push("a signature exists but no public key was found")
      signature = "unverifiable"
    } else {
      const raw = fs.readFileSync(signatureFile, "utf8").trim()
      const valid = verifyRoot(manifest.rootSha256, Buffer.from(raw, "base64"), keyPem)
      if (!valid) problems.push("Ed25519 signature does not verify against the published public key")
      signature = valid ? "valid" : "invalid"
    }
  }

  return { ok: problems.length === 0, problems, signature }
}

module.exports = {
  ROOT,
  PATHS,
  HASHED_FILES,
  SNAPSHOT_VERSION,
  SCHEMA_VERSION,
  sha256,
  canonicalJson,
  buildCanonicalDataset,
  buildScoreDigest,
  buildManifest,
  manifestBody,
  computeRoot,
  loadPrivateKey,
  publicKeyPem,
  signRoot,
  verifyRoot,
  verifyFiles,
  verifyManifest,
  resolvePath,
}
