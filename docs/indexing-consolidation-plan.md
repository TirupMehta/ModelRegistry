# Indexing consolidation plan — 2026-11-05

Source data: Search Console coverage export `tirup.in-Coverage-2026-11-05`
(Domain property, so it covers `tirup.in`, `blogs.tirup.in`, and
`modelregistry.tirup.in`).

## What the export actually says

| Bucket | Pages |
| --- | --- |
| Discovered - currently not indexed | 110 |
| Crawled - currently not indexed | 11 |
| Page with redirect | 8 |
| Not found (404) | 2 |
| Alternative page with proper canonical tag | 2 |
| Duplicate, Google chose different canonical | 1 |
| Duplicate without user-selected canonical | 1 |
| Soft 404 | 1 |
| **Not indexed total** | **136** (32 indexed) |

`tirup.in` has 34 URLs and `blogs.tirup.in` has 15. This subdomain alone
publishes 102. The ~110 "Discovered - currently not indexed" pages are
therefore almost entirely the model and company detail pages here, not the
portfolio.

## Why Google will not crawl them

Measured on the live site (unique-word Jaccard similarity between model pages):

```
gpt-6-astra   vs claude-opus-5   68.2%
deepseek-v4   vs claude-opus-5   64.8%
gpt-6-astra   vs deepseek-v4     61.4%
gpt-6-astra   vs gemini-4-ultra  50.9%
```

Each model page renders ~370-450 words, but that is mostly shared template
(nav, spec labels, compare links, methodology boilerplate). The genuine
per-model payload is small, and for **32 of 65 models the benchmark object is
entirely empty**. "Discovered - currently not indexed" means Google has the
URL and is deliberately not spending crawl budget on it. Halving the URL count
and giving the survivors real data is the only reliable fix.

Supporting evidence from the data layer:

- 65 models, **32 with zero benchmark values**
- 27 models cite **one** source
- 22 company pages, 8 of them for a single model
- `/companies/z-ai` renders 298 words across 3 models
- `/models/glm-5-3` renders 371 words with 0 benchmarks and 1 source

## Fix applied

`app/sitemap.ts` no longer lists `/llms.txt`, `/llms-full.txt`, `/rss.xml`,
`/feed.json`. A sitemap advertises canonical HTML pages; plain-text and JSON
endpoints only consume the host's limited crawl budget. They remain
discoverable through `robots.txt`, `llms.txt`, and the page footers. Sitemap
drops from 102 to 98 URLs.

## Classification of every model page

Rule, applied in order:

1. `supersededBy` set, or `verificationStatus === "retired"` → **RETIRE**
2. 3 or more benchmark values → **KEEP**
3. 2 benchmarks, or 1 benchmark plus a flagship/newest flag, or 3+ sources →
   **UPGRADE**
4. everything else → **MERGE** into the company page

Result: 6 KEEP, 26 UPGRADE, 32 MERGE, 1 RETIRE.

### KEEP (6) — already carry a factual payload

| Page | Company | Benchmarks | Sources |
| --- | --- | --- | --- |
| `/models/claude-fable-5-1` | anthropic | 3 | 1 |
| `/models/gpt-6-astra` | openai | 3 | 2 |
| `/models/gemini-3-8-flash` | google | 3 | 3 |
| `/models/deepseek-v4-1-flash` | deepseek | 4 | 4 |
| `/models/sarvam-105b` | sarvam | 3 | 3 |
| `/models/nemotron-3-5-super-vl` | nvidia | 3 | 3 |

Only change needed: `claude-fable-5-1` should get a second source.

### UPGRADE (26) — keep the URL, add data before promoting

These earn their own URL but currently publish 0-2 benchmark values. Each one
needs at least 3 benchmark numbers with citations before it is worth a crawl:

`claude-opus-5`, `claude-opus-5-5`, `claude-haiku-5-5`, `gpt-5-6`,
`gpt-6-1-terra`, `grok-4-6`, `grok-4-7`, `deepseek-v4-pro-0813`,
`deepseek-v4-1-flash-1017`, `meta-muse-spark-1-3`, `llama-4-maverick`,
`meta-muse-voice-transcribe`, `muse-wonder`, `muse-spark-open`,
`qwen-3-8-2-4t-a95b`, `mistral-large-4`, `minimax-m3`, `minimax-m3-1-flash`,
`mimo-v2-6-pro`, `mimo-v2-6-flash`, `beam-1`, `glimpse`, `mercury-3`,
`kimi-k3-1-pro`, `gemini-4-carbon`, `ripple-65b-preview`

### MERGE (32) — fold into the company page, then 308 the URL

Zero or one benchmark value and no distinguishing prose. Their specs already
appear in the company comparison table; the standalone page adds nothing.

`gpt-6-1-sol`, `gpt-6-luna`, `gemini-4-argon`,
`gemini-3-8-live-extended-thinking`, `gemini-3-7-flash`, `nano-banana-pro`,
`veo-3-1`, `grok-voice-transcribe-2`, `grok-voice-3`,
`deepseek-v4-flash-vision-exp`, `deepseek-v4-flash-0731`,
`deepseek-v4-flash-0423`, `llama-4-scout`, `qwen-3-8-flash`,
`qwen-3-8-omni-flash`, `mistral-medium-3-5`, `tencent-hy3`,
`tencent-hy4-preview`, `tencent-hy4`, `glm-5-2`, `glm-5-3`, `glm-5-3-flash`,
`nemotron-3-ultra`, `mimo-v2-5`, `mimo-v2-5-pro`, `claude-sonnet-5`,
`claude-sonnet-5-5`, `chatgpt-images-2-5`, `chatgpt-images-2-6`,
`kling-3-0`, `runway-gen-4-5`, `jev-1`

### RETIRE (1)

`kimi-k3` — already has `supersededBy`, redirect to the successor.

## Single-model companies

Eight company pages cover exactly one model, so merging the model page would
leave the company page as the only URL for that lab. Those company pages must
carry the full spec table before the model URL is redirected:
`sarvam` (KEEP), `typesafe`, `kuaishou`, `runway` (MERGE), `reflection`,
`elorian`, `inception`, `ricursive` (UPGRADE).

## Execution order

Nothing here should be done all at once. Google reacts badly to a site losing
half its URLs in one deploy.

1. **Now:** sitemap fix (done). Resubmit `https://modelregistry.tirup.in/sitemap.xml`.
2. **Next 2 weeks:** fill benchmarks for the 26 UPGRADE pages. This is data
   work, not code. No URL count changes, so it is safe.
3. **Then:** move the 32 MERGE pages into their company pages and add 308
   redirects in `next.config`. Give Google 4-6 weeks to settle between batches;
   do it in company groups, not as one 32-page drop.
4. **Finally:** drop `priority` values from the sitemap. Currently 0.4-1.0 with
   most pages at 0.8, which is noise; Google ignores them anyway.

## Expected outcome

Sitemap goes from 98 to 70 URLs, of which 28 are model pages carrying at least
three cited benchmark values instead of 65 pages where half publish none. The
"Discovered - currently not indexed" bucket should shrink within one crawl
cycle. Pages that stay empty will stay excluded, which is the correct result.
