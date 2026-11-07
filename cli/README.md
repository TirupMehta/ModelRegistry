# modelregistry CLI

Official command-line client for [ModelRegistry](https://modelregistry.tirup.in) - the open,
source-linked registry of frontier AI model specifications.

Zero dependencies, Node 18+. Free, unauthenticated, read-only.

```bash
npx modelregistry models --company anthropic
npx modelregistry model gpt-6-1-sol
npx modelregistry changes --since 2026-11-01
npx modelregistry health
npx modelregistry markdown /docs
```

## Why a CLI

The registry is a plain JSON API, so a shell script can call it with `curl`. This CLI adds the
parts that are annoying to rewrite: query building, table layout for a terminal, followable error
hints, and a `--json` flag that prints the untouched API payload for pipelines.

```bash
# Every flagship, one per laboratory
modelregistry models --flagship-only

# Machine-readable output for jq
modelregistry models --open-weights --json | jq '.models[].id'

# What changed since a date, newest first
modelregistry changes --since 2026-11-01 --limit 20

# Markdown view of any page (the same bytes an agent gets from Accept: text/markdown)
modelregistry markdown /about
```

## Install

```bash
npm install -g modelregistry   # or: pnpm add -g modelregistry / npx modelregistry
```

Running from a checkout of this repository:

```bash
node cli/index.mjs models --flagship-only
```

## Commands

| Command | What it does |
| --- | --- |
| `models` | List tracked models. Filters: `--company`, `--category`, `--open-weights`, `--flagship-only`, `--latest-only`. |
| `model <id>` | Show one record: specs, pricing, license, verification status, benchmarks, sources. |
| `changes` | Changelog entries newest first. Filters: `--since`, `--until`, `--model`, `--company`, `--limit`. |
| `health` | Dataset revision, per-status counts, oldest source check, upstream reachability. |
| `markdown [path]` | Markdown rendering of a site page, default `/`. |
| `help`, `--version` | Usage and version. |

Global options: `--json`, `--base-url <url>`, `--timeout <ms>`.

Point it at a local build with `--base-url http://localhost:3000` or
`MODELREGISTRY_BASE_URL`. Exit codes: `0` success, `1` request or API error, `2` usage error.

## Honest limits

- Benchmark figures are lab-reported, not independently reproduced.
- `lastVerifiedAt` is the date a source was reviewed, not a live availability signal.
- Provider listings (`/api/v1/models/{id}/providers`) are a separate live snapshot and never
  change a record's verification status.
- Rate budget is advertised on every API response (`RateLimit` headers). The CLI respects a
  single request per invocation; batch jobs should read those headers and back off on `429`.

Full API reference: <https://modelregistry.tirup.in/docs> ·
OpenAPI 3.1: <https://modelregistry.tirup.in/openapi.json> ·
Site guide for agents: <https://modelregistry.tirup.in/llms.txt>

MIT licensed.
