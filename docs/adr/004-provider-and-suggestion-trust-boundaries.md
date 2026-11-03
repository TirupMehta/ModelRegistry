# ADR 004: Keep provider availability and suggestions separate from registry facts

- Status: Accepted
- Date: 2026-11-03
- Deciders: ModelRegistry owner

## Context

The registry contains curated, source-reviewed model facts. Provider endpoint offers can change independently from those facts, and community suggestions must not publish unverified model data.

## Decision

1. Show live provider offers as a separate integration using explicit model-ID mappings. Preserve distinct `listed`, `unmapped`, `no_endpoints`, and `lookup_failed` states. An absent provider listing does not mean a model is unavailable, and provider offers do not replace official model specifications or pricing.
2. The suggestion form prepares a GitHub issue. A maintainer verifies sources and registry fields before adding or publishing a model; the form never writes directly to registry data.

## Consequences

- Provider mapping coverage and upstream freshness need ongoing review. Failures must leave official registry facts intact and visible.
- Future provider integrations follow the same separation and explicit status contract.
- Suggestions remain actionable without granting public submissions write access to registry data.
