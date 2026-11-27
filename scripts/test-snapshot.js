/**
 * scripts/test-snapshot.js
 *
 * Proves the tamper-evidence claim instead of asserting it:
 *   1. regeneration is deterministic (same data, same bytes, same root)
 *   2. the committed manifest is current
 *   3. the committed signature verifies against the published public key
 *   4. ONE changed byte in a covered file breaks the file hash
 *   5. ONE changed character in the manifest breaks the root hash
 *   6. ONE changed byte in the signature breaks verification
 *   7. an unsigned snapshot verifies as unsigned rather than as broken
 *
 * Works on copies in temp/: the repository's real artifacts are never modified.
 */
const fs = require("fs")
const path = require("path")
const crypto = require("crypto")
const { createRequire } = require("module")

const require_ = createRequire(__filename)
const snapshot = require_("./lib/snapshot.js")

const ROOT = snapshot.ROOT
const TMP = path.join(ROOT, "temp", "snapshot-test")
let failures = 0

function check(name, cond, detail) {
  if (cond) console.log(`  ✓ ${name}`)
  else {
    failures += 1
    console.error(`  ✗ ${name}${detail ? ` - ${detail}` : ""}`)
  }
}

function clean() {
  fs.rmSync(TMP, { recursive: true, force: true })
}

/** A throwaway verification root: the manifest plus every file it covers. */
function makeTempRoot(manifest) {
  fs.mkdirSync(TMP, { recursive: true })
  fs.writeFileSync(path.join(TMP, "manifest.json"), JSON.stringify(manifest, null, 2))
  for (const entry of manifest.files) {
    const source = path.join(ROOT, entry.path)
    const target = path.join(TMP, entry.path)
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.copyFileSync(source, target)
  }
  return TMP
}

clean()

const committedText = fs.readFileSync(path.join(ROOT, snapshot.PATHS.manifest), "utf8")
const committed = JSON.parse(committedText)

// ---- 1. determinism -------------------------------------------------------
const first = snapshot.buildManifest()
const second = snapshot.buildManifest()
check("buildManifest is deterministic (identical bytes)", snapshot.canonicalJson(first.manifest) === snapshot.canonicalJson(second.manifest))
check("root hash is stable across runs", first.rootSha256 === second.rootSha256)
check("generatedAt is the dataset revision, never a build clock", first.manifest.generatedAt === first.manifest.revisedAt)

// ---- 2. the committed manifest is current --------------------------------
check("committed manifest matches a fresh build", committedText === `${JSON.stringify(first.manifest, null, 2)}\n`, "run node scripts/sign-snapshot.mjs")
check("manifest covers the dataset and the published schema", ["data/models.ts", "data/model-schema.v1.json", "data/price-history.ts", "data/canonical-overrides.ts"].every((rel) => committed.files.some((entry) => entry.path === rel)))
check("record count matches the dataset", committed.recordCount === first.manifest.recordCount)

// ---- 3. the committed signature verifies ---------------------------------
const signatureFile = path.join(ROOT, snapshot.PATHS.signature)
const publicKeyFile = path.join(ROOT, snapshot.PATHS.publicKey)
check("signature file exists", fs.existsSync(signatureFile))
check("public key file exists", fs.existsSync(publicKeyFile))

const signature = Buffer.from(fs.readFileSync(signatureFile, "utf8").trim(), "base64")
const publicKeyPem = fs.readFileSync(publicKeyFile, "utf8")
check("signature is 64 bytes of Ed25519 output", signature.length === 64, `got ${signature.length}`)
check("signature verifies against the published key", snapshot.verifyRoot(committed.rootSha256, signature, publicKeyPem))

const verified = snapshot.verifyManifest(committed)
check("full verification of the committed artifacts passes", verified.ok, verified.problems.join(" | "))
check("verification reports a valid signature", verified.signature === "valid", verified.signature)

// ---- 4. one changed byte in a file ---------------------------------------
const tempRoot = makeTempRoot(committed)
check("copied root verifies before tampering", snapshot.verifyFiles(committed, tempRoot).ok)

const victim = path.join(tempRoot, "data", "models.ts")
const original = fs.readFileSync(victim)
const tampered = Buffer.from(original)
tampered[Math.floor(tampered.length / 2)] ^= 0x01
fs.writeFileSync(victim, tampered)
const fileTamper = snapshot.verifyFiles(committed, tempRoot)
check("one flipped bit in data/models.ts breaks the file hash", !fileTamper.ok)
check("the mismatch names the file", fileTamper.mismatches.some((line) => line.startsWith("data/models.ts")))
fs.writeFileSync(victim, original)
check("restoring the byte restores verification", snapshot.verifyFiles(committed, tempRoot).ok)

// ---- 5. one changed character in the manifest ----------------------------
const edited = JSON.parse(JSON.stringify(committed))
edited.files[0].sha256 = `${edited.files[0].sha256.slice(0, -1)}${edited.files[0].sha256.endsWith("0") ? "1" : "0"}`
const rootMismatch = snapshot.verifyManifest(edited, { rootDir: tempRoot, publicKeyPem })
check("one edited character in the manifest breaks the root hash", !rootMismatch.ok)
check("the root mismatch is reported as such", rootMismatch.problems.some((line) => line.includes("root SHA-256 mismatch")))

const editedRoot = snapshot.computeRoot(edited) + ""
check("recomputing the root after an edit produces a different value", editedRoot !== committed.rootSha256)

// ---- 6. one changed byte in the signature --------------------------------
const badSignature = Buffer.from(signature)
badSignature[10] ^= 0x01
check("one flipped bit in the signature breaks verification", !snapshot.verifyRoot(committed.rootSha256, badSignature, publicKeyPem))
check("a signature from another key does not verify", !snapshot.verifyRoot(committed.rootSha256, crypto.randomBytes(64), publicKeyPem))

// The attack that matters: edit the manifest AND repair its root hash. The
// signature covers the root, so a repaired root must still fail to verify.
const repaired = JSON.parse(JSON.stringify(committed))
repaired.files[0].sha256 = "0".repeat(64)
repaired.rootSha256 = snapshot.computeRoot(repaired)
check("an edited manifest with a repaired root fails the signature", !snapshot.verifyRoot(repaired.rootSha256, signature, publicKeyPem))
check("full verification rejects the repaired manifest", !snapshot.verifyManifest(repaired, { rootDir: tempRoot, publicKeyPem }).ok)

// ---- 7. an unsigned snapshot is honestly unsigned ------------------------
const unsignedRoot = makeTempRoot(committed)
check("no signature present means unsigned, not broken", snapshot.verifyManifest(committed, { rootDir: unsignedRoot }).signature === "absent")
const unsignedResult = snapshot.verifyManifest(committed, { rootDir: unsignedRoot })
check("an unsigned but intact snapshot verifies", unsignedResult.ok, unsignedResult.problems.join(" | "))

// ---- 8. a missing covered file is caught --------------------------------
fs.rmSync(path.join(unsignedRoot, "data", "revision.ts"))
const missing = snapshot.verifyManifest(committed, { rootDir: unsignedRoot })
check("a missing covered file fails verification", !missing.ok)
check("the missing file is named", missing.problems.some((line) => line.startsWith("data/revision.ts")))

// ---- 9. the digests track content, and every tracked file is covered -------
const canonical = snapshot.buildCanonicalDataset()
const mutatedRecords = JSON.parse(JSON.stringify(canonical.records))
mutatedRecords[0].displayName = `${mutatedRecords[0].displayName} (edited)`
const mutatedDigest = snapshot.sha256(Buffer.from(snapshot.canonicalJson(mutatedRecords), "utf8"))
check("changing one field changes the canonical dataset digest", mutatedDigest !== canonical.digest.sha256)
check("the committed manifest carries the current canonical digest", committed.canonicalDataset.sha256 === canonical.digest.sha256)
check("the committed manifest carries the current score digest", committed.scores.sha256 === snapshot.buildScoreDigest().sha256)

// The revision and the manifest are two lists of "published data files". A file
// in the revision set but not the manifest set would let the snapshot change
// without its version moving, which is the one thing the version exists for.
const { DATA_FILES } = require_("./write-revision.js")
const hashed = new Set(committed.files.map((entry) => entry.path))
const uncovered = DATA_FILES.map((rel) => rel.replace(/^\.\.\//, "")).filter(
  (rel) => rel !== "data/revision.ts" && !hashed.has(rel),
)
check("every file the dataset revision tracks is also in the snapshot", uncovered.length === 0, uncovered.join(", "))

clean()

if (failures > 0) {
  console.error(`\n❌ snapshot failed with ${failures} problem(s).`)
  process.exit(1)
}
console.log(`\n✔ Snapshot ${committed.datasetVersion} verifies; one changed byte is detected by every layer.`)
