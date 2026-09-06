# ADR 003: Honest Labels and the Popularity Bar

- Status: Accepted
- Date: 2026-09-06

## Context

"GPT-6 Astra" and "OpenAI Astra" read as duplicates to normal visitors, and the
`/companies` second slot plus the README "Latest Checkpoint" column labeled
non-latest models as latest.

## Decision

1. Variants merge into single family entries (ChatGPT 5.6 = Sol · Terra · Luna).
2. The `/companies` second slot shows a true latest checkpoint labeled as such,
   otherwise the newest non-flagship labeled "More from {lab}" — never a false
   "latest". The README table shows "—" instead of a fallback model.
3. Curation rule (also in CONTRIBUTING.md): top-15 OpenRouter weekly volume,
   lab flagship, or genuinely frontier capability. Obscure checkpoints are slop.

## Consequences

- Some table cells/cards show less, but everything shown is true.
- Contributors get a written bar to judge additions against.
