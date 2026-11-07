// Offline contract tests for the packaged CLI (cli/).
//
// These run without a server: argument parsing, usage text, exit codes, and the
// published package metadata. Live behaviour against a running build is covered
// in scripts/test-routes.js, where a server is already up.
const fs = require("fs")
const path = require("path")
const { spawnSync } = require("child_process")

console.log("⌨️  Verifying the CLI package...")

const CLI_DIR = path.resolve(__dirname, "../cli")
const ENTRY = path.join(CLI_DIR, "index.mjs")

const failures = []
function pass(label, detail = "") {
  console.log(`  ok: '${label}'${detail ? ` (${detail})` : ""}`)
}
function fail(label, detail) {
  console.error(`  FAIL: '${label}' (${detail})`)
  failures.push(label)
}
function check(label, condition, detail = "") {
  if (condition) pass(label, detail)
  else fail(label, detail)
}

function run(args) {
  return spawnSync(process.execPath, [ENTRY, ...args], {
    encoding: "utf8",
    timeout: 20_000,
    env: { ...process.env, NO_COLOR: "1" },
  })
}

// 1. Package metadata: publishable, with a bin entry and no dependencies.
const pkg = JSON.parse(fs.readFileSync(path.join(CLI_DIR, "package.json"), "utf8"))
check("cli-bin-entry", pkg.bin && pkg.bin.modelregistry === "./index.mjs", JSON.stringify(pkg.bin))
check("cli-publishable", pkg.private !== true, "private is not set")
check("cli-no-dependencies", !pkg.dependencies && !pkg.devDependencies, "zero dependencies")
check("cli-node-engine", typeof pkg.engines?.node === "string", pkg.engines?.node)
check("cli-files-include-entry", Array.isArray(pkg.files) && pkg.files.includes("index.mjs"))
check("cli-license-mit", pkg.license === "MIT")
check("cli-readme", fs.existsSync(path.join(CLI_DIR, "README.md")))

// 2. Entry point is executable by Node directly and carries a shebang.
const entrySource = fs.readFileSync(ENTRY, "utf8")
check("cli-shebang", entrySource.startsWith("#!/usr/bin/env node"))
check("cli-no-external-imports", !/from\s+"(?!node:)[a-z@]/i.test(entrySource))

// 3. --version prints a semver-ish version and exits 0.
const version = run(["--version"])
check(
  "cli-version",
  version.status === 0 && /^\d+\.\d+\.\d+\s*$/.test(version.stdout || ""),
  `${JSON.stringify((version.stdout || "").trim())} exit ${version.status}`
)

// 4. help names the product, every command, and the exit-code contract.
const help = run(["help"])
const helpText = help.stdout || ""
check("cli-help-exit", help.status === 0, `exit ${help.status}`)
for (const token of ["modelregistry", "models", "model <id>", "changes", "health", "markdown", "Exit codes"]) {
  check(`cli-help-${token.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`, helpText.includes(token))
}
check("cli-help-mentions-rate-headers", helpText.includes("No account, key, or token is required."))

// 5. No command prints usage rather than hitting the network.
const bare = run([])
check("cli-no-args-usage", bare.status === 0 && (bare.stdout || "").includes("Usage"))

// 6. Usage errors exit 2 and name the offending input.
const unknownCommand = run(["nope"])
check(
  "cli-unknown-command",
  unknownCommand.status === 2 && (unknownCommand.stderr || "").includes("Unknown command 'nope'"),
  `exit ${unknownCommand.status}`
)
const unknownFlag = run(["models", "--nope"])
check(
  "cli-unknown-flag",
  unknownFlag.status === 2 && (unknownFlag.stderr || "").includes("Unknown option '--nope'"),
  `exit ${unknownFlag.status}`
)
const missingValue = run(["models", "--company"])
check("cli-missing-value", missingValue.status === 2, `exit ${missingValue.status}`)
const missingId = run(["model"])
check("cli-model-needs-id", missingId.status === 2, `exit ${missingId.status}`)
const badUrl = run(["models", "--base-url", "not a url"])
check("cli-bad-base-url", badUrl.status === 2, `exit ${badUrl.status}`)
const badTimeout = run(["models", "--timeout", "soon"])
check("cli-bad-timeout", badTimeout.status === 2, `exit ${badTimeout.status}`)

// 7. The root test script must include this file.
const rootPkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../package.json"), "utf8"))
check("pnpm-test-includes-cli", rootPkg.scripts.test.includes("test-cli.js"))

if (failures.length > 0) {
  console.error(`\n❌ CLI checks failed: ${failures.join(", ")}`)
  process.exit(1)
}
console.log("\n✔ CLI package verified.")
