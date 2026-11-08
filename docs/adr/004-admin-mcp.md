# ADR 004 — Admin MCP: write-capable, review-gated model management

Status: **Proposed** (not implemented). Read-only public MCP ships at `/api/mcp` (see `lib/mcp.ts`).

## Context

The public MCP server (`/api/mcp`) and the REST API are intentionally read-only and keyless. Adding models today requires editing `data/models.ts` by hand, running `pnpm test`, and opening a PR (see `CONTRIBUTING.md`). The owner wants an admin-only MCP so an AI agent can perform those edits through chat, while preserving the review and provenance gates that make the registry trustworthy.

Constraints that must survive any implementation:

- Roadmap item 6: "Model suggestions require maintainer review. A generated GitHub issue does not publish a model." Publication stays behind maintainer review.
- Provenance rule (`CONTRIBUTING.md`): every record cites live official sources (`sources`), per-field citations (`fieldSources`), a `lastVerifiedAt` date, a `verificationStatus`, and a `changeLog`. No source → no fact. No guessed benchmarks/prices.
- Single source of truth: `data/models.ts` only. `sync-readme.js`, `validate-registry.js`, sitemap, feeds, API, OG, and metadata all derive from it at build time.
- Freshness invariants (CONTRIBUTING step 4): exactly one `isCompanyFlagship` per lab; scrub stale superlatives on dethroned records; never copy a crown without an official source.
- No em dashes in new copy; no modification of data files by automated surfaces without validation.

## Decision

Build a **separate, authenticated MCP endpoint** `POST /api/mcp-admin` that reuses the JSON-RPC plumbing from `/api/mcp` but exposes write tools gated by an admin token. By default it **prepares a pull request; it never pushes to `main`.**

## Authentication

- Env var `ADMIN_MCP_TOKEN` (long random string, set in Vercel production env).
- Every request must carry `Authorization: Bearer <token>`. Missing/invalid → `401` with a small JSON body, no tool list leaked.
- The endpoint is **not** listed in `llms.txt`, `openapi.json`, or the public docs nav, and is absent from `/.well-known/agent-skills`. Only the owner configures it.
- Separate rate limit bucket (stricter than the public 600/min) and an audit log (see below).
- Optional second factor later: require a `X-Admin-Confirm: yes` header on mutating calls so a stray agent tool call cannot fire a write.

## Tool surface (admin only)

Read helpers (reuse public logic):

| Tool | Purpose |
| --- | --- |
| `validate_registry` | Run the in-process equivalent of `scripts/validate-registry.js`; return errors/warnings. |
| `preview_diff` | Show the unified diff that a proposed change would produce in `data/models.ts`. |
| `open_pr_for_change` | Create a branch, commit, push, open a PR; return the PR URL. Does not merge. |

Mutating tools (each requires `confirm: true` in arguments, otherwise returns a dry-run preview):

| Tool | Arguments | Effect |
| --- | --- | --- |
| `add_model` | `{ model: ModelItem, confirm? }` | Append one object to `modelsData`. |
| `update_model` | `{ id, patch: Partial<ModelItem>, confirm? }` | Patch fields of an existing record; auto-appends a `changeLog` entry. |
| `retire_model` | `{ id, reason, successorId?, confirm? }` | Set `isCompanyFlagship`/`isLatestCheckpoint` false as needed, mark retired, scrub superlatives on dethroned records. Never hard-deletes. |
| `add_lab` | `{ company: Company, confirm? }` | Add a lab to `data/companies.ts` (rare; requires flagship on first model). |
| `demote_flagship` | `{ labId, newFlagshipId, confirm? }` | Enforce the one-flagship-per-lab invariant. |

All mutating tools run, in order: schema validation → provenance checks → freshness invariants → `sync-readme` preview → diff. Any failure aborts before any git write.

## Provenance enforcement (in-tool, not just CI)

- `add_model`/`update_model` reject `verificationStatus: "verified"` unless every core field (release date, context, output limit, parameters, license, pricing, modalities, benchmarks where published, flagship/latest status) has a matching entry in `fieldSources` and `sources` is non-empty.
- `sources[].url` must be `https://` and unique within the record; `accessedAt` must be a valid date not in the future.
- `benchmarks` keys must be a subset of the known benchmark keys; unknown keys are rejected (no invented metrics).
- `update_model` requires a `changeLog` entry with `date`, `summary`, and `sources` whenever a factual field changes; the tool auto-generates one if omitted, using the patch's source URLs.
- `highlight` is capped at 2 lines and must not contain superlatives unless `isCompanyFlagship`/`isLatestCheckpoint` is true for this record.

## Freshness invariants (in-tool)

- After `add_model` with `isCompanyFlagship: true`, the previous flagship for that lab is demoted to `false` and its highlight scrubbed of `#1`, `NEWEST`, `SOTA`, `best`, `latest`, `reigning`, `most advanced`, `newly`.
- `retire_model` removes flagship/latest flags and, if a successor is given, promotes it with a source check.
- `add_lab` requires `latestFlagship` to be set and a first model added in the same PR.

## Branch / PR sequence

1. Tool validates input locally (no network).
2. Tool checks out a new branch `admin-mcp/<timestamp>-<slug>` from `main` (via GitHub API, not local git).
3. Tool commits the edited `data/models.ts` (and `data/companies.ts` if needed) with a signed-ish commit message listing the changed model ids and the maintainer token's identity.
4. Tool runs the validation suite against the branch (GitHub Actions on push, or in-process port of `validate-registry.js` + `test-site-integrity.js`).
5. Tool opens a PR titled `admin-mcp: <summary>` with body = diff summary + source list + "Generated by admin MCP; maintainer review required."
6. Tool returns `{ branch, commit, prUrl, validation: { ok, errors } }`. It never merges.
7. On merge, existing CI (`.github/workflows/ci.yml`) runs the full gate; Vercel deploys.

Direct-to-main is **not** supported in v1. A `--direct` flag may be added later after the PR flow has been used for a few weeks without incident.

## Audit log

- Every mutating call appends one line to `data/audit-log.json` (git-tracked, append-only): `{ ts, actor: "admin-mcp", tool, argsSummary, branch, prUrl, result }`.
- The audit log is never edited or truncated by the tools; corrections are new entries.
- The public site does not render the audit log (it may be exposed later as an admin-only route).

## Concurrency

- One open admin PR at a time: if an admin PR is already open, mutating tools return `conflict: open_pr_exists` with its URL instead of creating a second branch.
- Reads are never blocked.

## What is explicitly out of scope for v1

- Auto-merging PRs (defeats the review gate).
- Editing non-data files (site, API, docs) through the admin MCP.
- Bulk import from a CSV/JSON dump (too easy to fabricate provenance; do it model by model).
- Deleting records (retire only).
- Publishing to npm / changing the CLI.

## Implementation estimate

- Auth-gated endpoint + tool dispatch: ~1 day (reuse `/api/mcp` plumbing; add a middleware checking `ADMIN_MCP_TOKEN`).
- Write tools + in-process validation: ~1-2 days (port checks from `scripts/validate-registry.js` and `scripts/sync-readme.js` into `lib/`).
- Git branch/commit/PR automation via GitHub API: ~1 day, including conflict handling.
- Audit log + tests: ~1 day.

Total ~4-5 days for a solid v1, plus a safety review before enabling direct-to-main (if ever).

## When to revisit

- After the read-only admin helpers (`validate_registry`, `preview_diff`, `open_pr_for_change`) have been used for a few weeks without a bad PR.
- If the owner decides the review gate can be relaxed for trusted single-user edits (only then consider `--direct`).
- If a second maintainer is added (then per-actor tokens and per-PR approval rules).

## References

- `CONTRIBUTING.md` — provenance rule and contribution workflow.
- `scripts/validate-registry.js` — schema and cross-lab invariants.
- `scripts/sync-readme.js` — README auto-sync.
- `lib/mcp.ts` — public read-only MCP tool implementations (template for the admin dispatch).
- `app/api/mcp/route.ts` — public endpoint (template for auth + CORS).
- Roadmap item 6 in `AGENTS.md` — contribution workflow completion.
