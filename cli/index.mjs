#!/usr/bin/env node
/**
 * modelregistry - official CLI for the ModelRegistry frontier AI model registry.
 *
 * Zero dependencies, Node 18+. Talks to the same public JSON API a browser or
 * agent uses, so there is nothing to configure and no key to leak. Every command
 * has a `--json` escape hatch: the default output is for people, `--json` is the
 * untouched API payload for scripts and agents.
 *
 *   npx modelregistry models --company anthropic
 *   npx modelregistry model claude-opus-5
 *   npx modelregistry changes --since 2026-11-01 --json
 *
 * Base URL and timeout are overridable with --base-url / --timeout for testing
 * against a local build.
 */

import process from "node:process"

const DEFAULT_BASE_URL = "https://modelregistry.tirup.in"
const VERSION = "1.0.0"
const DEFAULT_TIMEOUT_MS = 15_000

const USAGE = `modelregistry ${VERSION} - query the ModelRegistry API from the terminal

Usage
  modelregistry <command> [options]

Commands
  models                 List tracked frontier models
  model <id>             Show one model by its stable id
  changes                List changelog entries (incremental sync)
  health                 Dataset revision, verification counts, upstream status
  markdown [path]        Print the Markdown view of a site page (default "/")
  help                   Show this help

Filters for "models"
  --company <id>         Laboratory id, e.g. anthropic
  --category <name>      flagship | reasoning | open-weights | code | multimodal | audio | image | video
  --open-weights         Only models with downloadable weights
  --flagship-only        One primary flagship per laboratory
  --latest-only          Each laboratory's newest shipped checkpoint

Filters for "changes"
  --since <YYYY-MM-DD>   Inclusive lower bound
  --until <YYYY-MM-DD>   Inclusive upper bound
  --model <id>           One record id
  --company <id>         One laboratory id
  --limit <n>            Max entries (default 100, max 500)

Global options
  --json                 Print the raw API payload instead of a table
  --base-url <url>       API origin (default ${DEFAULT_BASE_URL})
  --timeout <ms>         Request timeout (default ${DEFAULT_TIMEOUT_MS})
  -h, --help             Show this help
  -v, --version          Print the version

Examples
  modelregistry models --flagship-only
  modelregistry models --open-weights --json
  modelregistry model gpt-6-1-sol
  modelregistry changes --since 2026-11-01 --limit 20
  modelregistry markdown /docs

Exit codes: 0 success, 1 request or API error, 2 usage error.
No account, key, or token is required.`

const BOOLEAN_FLAGS = new Map([
  ["--json", "json"],
  ["--help", "help"],
  ["-h", "help"],
  ["--version", "version"],
  ["-v", "version"],
  ["--open-weights", "openWeights"],
  ["--flagship-only", "flagshipOnly"],
  ["--latest-only", "latestOnly"],
])

const VALUE_FLAGS = new Map([
  ["--base-url", "baseUrl"],
  ["--timeout", "timeout"],
  ["--company", "company"],
  ["--category", "category"],
  ["--since", "since"],
  ["--until", "until"],
  ["--model", "model"],
  ["--limit", "limit"],
])

class UsageError extends Error {}

function parseArgs(argv) {
  const options = { positional: [] }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === "--") {
      options.positional.push(...argv.slice(i + 1))
      break
    }
    if (!arg.startsWith("-") || arg === "-") {
      options.positional.push(arg)
      continue
    }

    // Support both `--flag value` and `--flag=value`.
    const eq = arg.indexOf("=")
    const name = eq === -1 ? arg : arg.slice(0, eq)
    const inlineValue = eq === -1 ? undefined : arg.slice(eq + 1)

    if (BOOLEAN_FLAGS.has(name)) {
      if (inlineValue !== undefined) throw new UsageError(`${name} takes no value`)
      options[BOOLEAN_FLAGS.get(name)] = true
      continue
    }

    if (VALUE_FLAGS.has(name)) {
      const value = inlineValue ?? argv[i + 1]
      if (value === undefined || (inlineValue === undefined && value.startsWith("-"))) {
        throw new UsageError(`${name} needs a value`)
      }
      if (inlineValue === undefined) i += 1
      options[VALUE_FLAGS.get(name)] = value
      continue
    }

    throw new UsageError(`Unknown option '${name}'. Run 'modelregistry help'.`)
  }

  return options
}

function resolveBaseUrl(raw) {
  const value = raw || process.env.MODELREGISTRY_BASE_URL || DEFAULT_BASE_URL
  try {
    return new URL(value).origin
  } catch {
    throw new UsageError(`'${value}' is not a valid URL`)
  }
}

function resolveTimeout(raw) {
  if (raw === undefined) return DEFAULT_TIMEOUT_MS
  const n = Number.parseInt(raw, 10)
  if (!Number.isInteger(n) || n < 1) throw new UsageError(`--timeout must be a positive integer (got '${raw}')`)
  return n
}

async function requestJson(baseUrl, path, timeoutMs) {
  const url = new URL(path, baseUrl)
  let res
  try {
    res = await fetch(url, {
      headers: {
        accept: "application/json",
        "user-agent": `modelregistry-cli/${VERSION}`,
      },
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch (cause) {
    throw new Error(`Could not reach ${url.origin} (${cause?.name ?? "network error"})`)
  }

  const text = await res.text()
  let body
  try {
    body = JSON.parse(text)
  } catch {
    throw new Error(`Expected a JSON response from ${url.pathname} but got HTTP ${res.status}`)
  }

  if (!res.ok) {
    const error = new Error(body.error || `HTTP ${res.status} from ${url.pathname}`)
    error.hint = body.hint
    error.code = body.code
    throw error
  }
  return body
}

async function requestMarkdown(baseUrl, pagePath, timeoutMs) {
  const slug = pagePath === "/" ? "" : pagePath.startsWith("/") ? pagePath : `/${pagePath}`
  const url = new URL(`/api/markdown${slug}`, baseUrl)
  let res
  try {
    res = await fetch(url, { headers: { accept: "text/markdown" }, signal: AbortSignal.timeout(timeoutMs) })
  } catch (cause) {
    throw new Error(`Could not reach ${url.origin} (${cause?.name ?? "network error"})`)
  }
  const text = await res.text()
  if (res.status !== 200) {
    throw new Error(text.trim().split("\n")[0] || `HTTP ${res.status} from ${url.pathname}`)
  }
  return text
}

/* ------------------------------------------------------------------ output */

const MAX_CELL = 34

function clip(value, width = MAX_CELL) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim()
  return text.length > width ? `${text.slice(0, width - 3)}...` : text
}

function table(headers, rows) {
  const cells = rows.map((row) => row.map((cell) => clip(cell)))
  const widths = headers.map((header, index) =>
    Math.max(header.length, ...cells.map((row) => (row[index] ?? "").length))
  )
  const line = (row) =>
    row
      .map((cell, index) => (index === row.length - 1 ? cell : cell.padEnd(widths[index])))
      .join("  ")
      .trimEnd()
  return [line(headers), line(widths.map((w) => "-".repeat(w))), ...cells.map(line)].join("\n")
}

function formatPrice(model) {
  const { input, output } = model.pricing ?? {}
  if (input === undefined || output === undefined) return "n/a"
  if (model.pricingUnit) return input === output ? `$${input} ${model.pricingUnit}` : `$${input}/$${output} ${model.pricingUnit}`
  return `$${input}/$${output} per 1M`
}

function verificationLabel(status) {
  return String(status ?? "").replace(/_/g, " ")
}

/* ---------------------------------------------------------------- commands */

async function commandModels(options, context) {
  const params = new URLSearchParams()
  if (options.company) params.set("company", options.company)
  if (options.category) params.set("category", options.category)
  if (options.openWeights) params.set("openWeights", "true")
  if (options.flagshipOnly) params.set("flagshipOnly", "true")
  if (options.latestOnly) params.set("latestOnly", "true")
  const query = params.size > 0 ? `?${params}` : ""

  const data = await requestJson(context.baseUrl, `/api/v1/models${query}`, context.timeoutMs)
  if (options.json) return printJson(data)

  const models = data.models ?? []
  if (models.length === 0) {
    console.log("No models matched those filters. Drop a filter or check `modelregistry models --json`.")
    return
  }

  console.log(
    `${data.total} model${data.total === 1 ? "" : "s"} · dataset ${data.datasetVersion} · revised ${data.updatedAt ?? "unknown"}`
  )
  console.log("")
  console.log(
    table(
      ["LAB", "MODEL", "RELEASED", "CONTEXT", "PRICE", "VERIFICATION"],
      models.map((model) => [
        model.companyName ?? model.companyId,
        model.name,
        model.releaseDate,
        model.contextWindowTokens ? model.contextWindow : "n/a",
        formatPrice(model),
        verificationLabel(model.verificationStatus),
      ])
    )
  )
  console.log("")
  console.log(`Record ids are stable - fetch one with: modelregistry model <id>`)
}

async function commandModel(options, context) {
  const id = options.positional[0]
  if (!id) throw new UsageError("model needs a record id. List ids with 'modelregistry models --json'.")

  const data = await requestJson(
    context.baseUrl,
    `/api/v1/models/${encodeURIComponent(id)}`,
    context.timeoutMs
  )
  if (options.json) return printJson(data)

  const model = data.model
  const rows = [
    ["Record id", model.id],
    ["Laboratory", `${model.companyName ?? model.companyId} (${model.companyId})`],
    ["Released", model.releaseDate],
    ["Category", model.categoryLabel ?? model.category],
    ["Role", model.isCompanyFlagship ? "primary flagship" : model.isLatestCheckpoint ? "latest checkpoint" : "tracked"],
    ["Context window", model.contextWindow],
    ["Max output", model.maxOutputTokens],
    ["Parameters", model.parameters],
    ["Pricing", formatPrice(model)],
    ["License", model.license],
    ["Modalities", (model.modalities ?? []).join(", ")],
    ["Verification", `${verificationLabel(model.verificationStatus)} (last checked ${model.lastVerifiedAt})`],
  ]

  console.log(`${model.name} - ${model.companyName ?? model.companyId}`)
  console.log("")
  for (const [label, value] of rows) console.log(`  ${label.padEnd(15)} ${value ?? "n/a"}`)

  const benchmarks = Object.entries(model.benchmarks ?? {})
  if (benchmarks.length > 0) {
    console.log("")
    console.log("Lab-reported benchmarks (not independently reproduced):")
    for (const [name, score] of benchmarks) console.log(`  ${name.padEnd(15)} ${score}`)
  }

  const sources = model.sources ?? []
  if (sources.length > 0) {
    console.log("")
    console.log("Sources:")
    for (const source of sources) console.log(`  - ${source.publisher}: ${source.title} (${source.url})`)
  }

  console.log("")
  console.log(`Page:  ${context.baseUrl}/models/${model.id}`)
  console.log(`JSON:  ${context.baseUrl}/api/v1/models/${model.id}`)
}

async function commandChanges(options, context) {
  const params = new URLSearchParams()
  if (options.since) params.set("since", options.since)
  if (options.until) params.set("until", options.until)
  if (options.model) params.set("model", options.model)
  if (options.company) params.set("company", options.company)
  if (options.limit) params.set("limit", options.limit)
  const query = params.size > 0 ? `?${params}` : ""

  const data = await requestJson(context.baseUrl, `/api/v1/changes${query}`, context.timeoutMs)
  if (options.json) return printJson(data)

  const changes = data.changes ?? []
  console.log(`${data.returned} of ${data.total} change${data.total === 1 ? "" : "s"} · dataset ${data.datasetVersion}`)
  if (changes.length === 0) {
    console.log("Nothing changed in that window.")
    return
  }
  console.log("")
  console.log(
    table(
      ["DATE", "MODEL", "LAB", "CHANGE"],
      changes.map((entry) => [entry.date, entry.modelName, entry.companyName ?? entry.companyId, entry.summary])
    )
  )
}

async function commandHealth(options, context) {
  const data = await requestJson(context.baseUrl, "/api/check-updates", context.timeoutMs)
  if (options.json) return printJson(data)

  console.log(`Status              ${data.status}`)
  console.log(`Dataset             ${data.datasetVersion} (revised ${data.datasetLastChangedAt ?? "unknown"})`)
  console.log(`Coverage            ${data.trackedModelsCount} models / ${data.trackedLabsCount} laboratories`)
  console.log(`Verified            ${data.verifiedModelCount}`)
  console.log(`Partially verified  ${data.partiallyVerifiedModelCount}`)
  console.log(`Unverified          ${data.unverifiedModelCount}`)
  console.log(`Retired             ${data.retiredModelCount}`)
  console.log(`Oldest source check ${data.oldestVerificationDate ?? "unknown"}`)
  console.log(
    `Upstream (OpenRouter) ${data.upstreamAvailability?.openrouter ?? "unknown"}` +
      (data.upstreamAvailability?.externalLiveCount ? ` · ${data.upstreamAvailability.externalLiveCount} models listed` : "")
  )
  console.log("")
  console.log("Upstream reachability is not a verification signal; lastVerifiedAt is.")
}

async function commandMarkdown(options, context) {
  const page = options.positional[0] || "/"
  const text = await requestMarkdown(context.baseUrl, page, context.timeoutMs)
  process.stdout.write(text.endsWith("\n") ? text : `${text}\n`)
}

function printJson(value) {
  console.log(JSON.stringify(value, null, 2))
}

/* -------------------------------------------------------------------- main */

async function main() {
  const options = parseArgs(process.argv.slice(2))

  if (options.version) {
    console.log(VERSION)
    return
  }
  if (options.help || options.positional.length === 0) {
    console.log(USAGE)
    return
  }

  const command = options.positional.shift()
  const context = {
    baseUrl: resolveBaseUrl(options.baseUrl),
    timeoutMs: resolveTimeout(options.timeout),
  }

  switch (command) {
    case "models":
      return commandModels(options, context)
    case "model":
      return commandModel(options, context)
    case "changes":
      return commandChanges(options, context)
    case "health":
      return commandHealth(options, context)
    case "markdown":
      return commandMarkdown(options, context)
    case "help":
      console.log(USAGE)
      return
    default:
      throw new UsageError(`Unknown command '${command}'. Run 'modelregistry help'.`)
  }
}

main().catch((error) => {
  if (error instanceof UsageError) {
    console.error(`error: ${error.message}`)
    process.exitCode = 2
    return
  }
  console.error(`error: ${error.message}`)
  if (error.hint) console.error(`hint:  ${error.hint}`)
  if (error.code) console.error(`code:  ${error.code}`)
  process.exitCode = 1
})
