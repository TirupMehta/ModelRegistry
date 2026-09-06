# Security Policy

## Supported Versions

ModelRegistry is deployed continuously from `main` to
[modelregistry.tirup.in](https://modelregistry.tirup.in).

| Version | Supported          |
| ------- | ------------------ |
| `main` (latest) | :white_check_mark: |
| Older commits / forks | :x: |

We do not maintain LTS branches. Please verify against the latest `main` before reporting.

## Scope

In scope:

- XSS / injection via model fields (`data/models.ts`, `data/companies.ts`) rendered on the site, API (`/api/v1/models`), RSS (`/rss.xml`), `llms.txt`
- Auth / session issues, open redirects, SSRF in API routes and badges (`/api/badge/*`)
- Data poisoning vectors: ability to get unverified pricing, links, or weights served as trusted
- Supply-chain issues in `next.config.mjs`, `middleware.ts`, GitHub Actions (`.github/workflows/`)

Out of scope:

- Spam / SEO reports about model listing content (use a Data Correction issue instead)
- Volumetric DDoS without a demonstrated exploit
- Reports that the README table is stale (run `pnpm test` / see `scripts/sync-readme.js`)

This project handles no secrets, payments, or user credentials. There are no API keys to leak — the REST API is intentionally public and unauthenticated.

## Reporting a Vulnerability

**Do NOT open a public GitHub issue.**

Report privately via either:

1. GitHub Private Vulnerability Reporting (preferred):
   https://github.com/TirupMehta/ModelRegistry/security/advisories/new
2. Open a blank issue only if advisory reporting is unavailable, with no exploit details, and request a private contact.

Include:

- Affected URL / route / file (e.g. `/api/v1/models?company=...`, `app/models/[id]/page.tsx`)
- Steps to reproduce, including payload if XSS/injection
- Impact assessment
- Your environment (browser, commit SHA)

## Response SLA

- Acknowledgement: within 48 hours
- Triage + fix or mitigation plan: within 7 days for valid High/Critical reports
- Disclosure: coordinated — please do not publish until a fix is live on `main`

We credit reporters in the fix PR unless anonymity is requested. No bug bounty program is offered at this time.

## Secure Contribution Notes

- Never commit `.env`, `.env.local`, or tokens. `pnpm build` must pass without secrets.
- All external model links must be official sources (announcement / paper / Hugging Face). No URL shorteners.
- Validate new entries with `pnpm test` (`scripts/validate-registry.js`) before opening a PR.
