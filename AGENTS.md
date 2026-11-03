# ModelRegistry agent notes

Read this file before continuing product work. The roadmap below describes work that is **not complete**; do not claim it is shipped unless the code and live behavior prove it.

## Data and product rules

- Keep lab-published specifications separate from live provider offers. The current provider panel is OpenRouter-only; an unmapped model does not mean unavailable.
- Treat `lastVerifiedAt` as the date a source was reviewed, not a live availability signal. A dataset revision date is not a substitute for field verification.
- When changing model data or public routes, keep the model page, API/OpenAPI, RSS/JSON Feed, metadata, and share previews consistent.
- Comparisons must identify the source, benchmark version, and test conditions. Do not label a model universally “best” from incomparable results.
- Model suggestions require maintainer review. A generated GitHub issue does not publish a model.

## Unfinished roadmap

1. **Model Alerts — deferred by the owner.** `/alerts` and the popup currently collect a launch waitlist; they do not send model-change alerts. Wait for the owner to reopen this work. Then define watched models/change types, consent and confirmation, delivery frequency, unsubscribe, deduplication, retries, and retention before building delivery.
2. **Refresh source verification across the registry.** Audit older as well as new records field by field against primary sources, refresh stale `lastVerifiedAt` values and the source audit, and make stale or unsupported claims visible. Many records still show an October 7, 2026 verification date while the dataset is revised November 3, 2026.
3. **Make model comparisons evidence-complete.** Expand per-model benchmark provenance with source URLs, benchmark/version, date, and evaluation conditions; compare only compatible runs and explain where the evidence cannot support a direct ranking.
4. **Broaden live provider coverage carefully.** The current API fetches OpenRouter endpoint offers for an explicit subset of mapped models. Add other providers only with stable source APIs, explicit model mappings, freshness/cache behavior, clear outage states, and wording that distinguishes provider offers from official lab specifications.
5. **Finish share-preview parity.** Audit Open Graph and Twitter previews across home, model, lab, changelog, and other shareable routes. Add generated route-specific images from the same source data and verify their rendered output after metadata changes. No route-specific image files currently exist.
6. **Complete the contribution workflow.** The suggestion form prepares a GitHub issue; it does not validate or create a pull request. Improve maintainer triage, duplicate detection, source checks, and validation before considering a PR generator. Keep publication behind maintainer review.
7. **Add release-grade regression coverage.** Cover filters and dropdown keyboard/pointer behavior, mobile layouts, feed/API parity, provider lookup failures, and metadata/share output. Preserve honest empty, stale, and unavailable states.

## Recently implemented; verify before extending

Footer discovery for Alerts and retired models, distinct Changelog and Release timeline labels, changelog lab/date/last-visit filters with RSS and JSON Feed links, shared model filters, GitHub issue suggestions, and OpenRouter endpoint listings are implemented in this working tree. Check their current source before redoing them.
