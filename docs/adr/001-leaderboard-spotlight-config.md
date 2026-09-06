# ADR 001: Centralized Leaderboard Spotlight Config

- Status: Accepted
- Date: 2026-09-06

## Context

`app/leaderboard/page.tsx` hardcoded model IDs in filter arrays. After merging
`openai-astra` and `gpt-5-6-sol` into family entries, two leaderboard cards
silently vanished with no error anywhere.

## Decision

Curated spotlight ID lists live in `data/leaderboard.ts`
(`leaderboardSpotlights`). The page imports them. `scripts/validate-registry.js`
fails `pnpm test` if any listed ID does not exist, and if any configured
section is not rendered by the page — so neither stale IDs nor orphan sections
can slip through silently again.

## Consequences

- Renames/merges require updating one data file; CI enforces it.
- Editorial curation stays human (which models represent a section is a judgment call).
