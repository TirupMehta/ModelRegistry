# ADR 002: Retired Model Slugs Fall Back to the Company's Newest Model

- Status: Accepted
- Date: 2026-09-06

## Context

Merging variants into family entries (e.g. `gpt-5-6-sol` into `gpt-5-6`)
retires URLs. Maintaining per-link redirects does not scale with future merges.

## Decision

Unknown `/models/<slug>` values are token-matched (`lib/model-fallback.ts`)
against every model's id / name / version / company. If exactly one company
wins, the visitor is redirected to that company's newest model by release date
(e.g. `/models/gpt-5-6-sol` → GPT-6 Astra). Ties and zero-matches still 404.
`generateMetadata` resolves to the same target so crawlers see the canonical URL.

## Consequences

- Zero per-link maintenance for all future merges.
- A slug matching two companies equally 404s by design (conservative over guessing).
- Covered by `scripts/test-fallback.js` in `pnpm test`.
