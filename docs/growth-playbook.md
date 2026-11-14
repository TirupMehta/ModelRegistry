# Growth playbook: search, answer engines and AI citation

How ModelRegistry gets found and cited, what is already built, and the manual steps only the owner can do. Written 2026-11-14.

## 1. How the three systems differ

| System | Who it serves | What it rewards |
| --- | --- | --- |
| Search (Google, Bing) | A person scanning ten links | A page that matches one query, loads fast, has clear titles, and is linked to by others |
| Answer engines (featured snippets, AI Overviews, voice) | A person who wants the answer in one line | A direct answer in the first 40 to 60 words, then evidence |
| Generative engines (ChatGPT search, Perplexity, Claude, Gemini) | A model composing an answer from retrieved pages | Pages that are easy to retrieve, quote exactly and cite: unique facts, dates, tables, stable URLs, no gating |

Most generative search tools retrieve through Bing or their own crawler, and then quote. So the work is the same three things: be indexed fast, be the clearest source for a narrow question, and own facts nobody else has.

## 2. What the site already does (do not rebuild)

- Crawlers: `robots.txt` allows Googlebot, Bingbot, GPTBot, ClaudeBot, PerplexityBot, Google-Extended and the other AI crawlers. Nothing is gated.
- Orientation files: `/llms.txt`, `/llms-full.txt`, markdown on request (`Accept: text/markdown`), an MCP endpoint, an OpenAPI file, RSS and JSON Feed.
- Structured data on every page type: Organization, Person, WebSite with SearchAction, Dataset, FAQPage, BreadcrumbList, ItemList, TechArticle.
- Freshness: sitemap `lastmod` comes from real data changes, not build time. Each model carries its own verified date.
- A trust layer an answer engine can follow: editorial policy, methodology, corrections via the changelog.

## 3. What this change adds

1. **One page per high-intent question** (`/best/coding`, `/best/cheapest`, `/best/longest-context` and 11 more). Each has its own title, an answer-first paragraph, a ranked table, FAQ markup and a dated stamp. Before, all of these lived behind anchors on one URL, which can only rank for one query.
2. **Alternatives pages** (`/alternatives/{model}`, 57 models). "X alternatives" is a common query at every launch. Each page names the closest swap, the cheaper options, the stronger options and the open-weights options, with the numbers.
3. **Insights with downloadable data** (`/insights`): "Do AI labs' benchmark claims hold up?" and "What does AI intelligence cost?". These are the pages journalists, newsletters and other sites can cite, because the figure is new and the CSV is one click away.
4. **CSV endpoints** (`/data/lab-vs-independent.csv`, `/data/intelligence-per-dollar.csv`), open CORS, cached.
5. **IndexNow on every deploy** (`.github/workflows/indexnow.yml`).
6. The sitemap now lists 14 task pages, 57 alternatives pages and the insight pages (about 530 URLs, up from about 450).

## 4. Why these work (and what is hype)

Works:

- **Answer-first paragraphs.** Retrieval systems lift the first self-contained passage. Every new page opens with a sentence that stands alone, with the number in it.
- **Exact numbers and dates in text, not images.** Models quote text. A table with a date beats a chart.
- **Unique facts.** A page that says what everyone else says is never cited. The lab-claims and cost-per-task figures exist nowhere else in this form.
- **Narrow pages for narrow questions.** One URL per question beats one big page.
- **Fast indexing.** Bing index drives ChatGPT search and Copilot. IndexNow gets pages in within hours.
- **Stable URLs and a stated citation format.** Each insight page prints how to cite it.

Does not work, or is not measurable:

- Hidden text, keyword stuffing, fake reviews, link farms and cloaked pages for AI crawlers. They are detected, penalised, and a trust site cannot afford one flag.
- An `ai.txt` or "AI meta tags": no major engine reads them. `llms.txt` is cheap and harmless but its effect on ranking is unproven. Keep it, do not rely on it.
- Schema alone. Structured data helps parsing, not ranking.

## 5. Manual steps (owner only)

Do these once. Each takes minutes and none can be automated from the repo.

1. **Bing Webmaster Tools**: add `modelregistry.tirup.in`, verify, submit `https://modelregistry.tirup.in/sitemap.xml`. This is the highest-value step for ChatGPT search and Copilot.
2. **Google Search Console**: add the property, submit the sitemap, then request indexing for `/insights` and the three most important `/best/...` pages.
3. **Publish the data where researchers look.** Put `data/models.ts` exports and the two CSVs on Hugging Face Datasets and Kaggle, with the MIT licence and a link back. Create a Zenodo record from the GitHub repo to get a DOI, then cite the DOI in the README. Each gives a high-authority link and a stable citation.
4. **Directories for developer tools**: the MCP server on the official MCP registry, Smithery and mcp.so; the API on public-apis and APIs.guru; the CLI on npm if not already; the agent skill on the skills directories.
5. **Launch posts that lead with a finding, not a product.** "We compared lab-reported benchmark scores with independent runs: most were lower" with the CSV link is a Hacker News and r/LocalLLaMA post. "Show HN: a registry that quotes its sources" is a weaker lead. Post once per genuinely new data story.
6. **Launch-day speed.** Each new model launch is a spike for "[model] pricing", "[model] context window" and "[model] alternatives". Use the intake script, merge the same day, and let IndexNow ping. Being first with a structured, sourced page is how small sites get cited on launch day.
7. **Badges in READMEs.** `/api/badge` already exists. Ask projects that depend on a model to link it; every README badge is a backlink.

## 6. How to measure it

- Search Console: impressions and clicks for `/best/*`, `/alternatives/*`, `/insights/*` after 4 to 6 weeks.
- Bing Webmaster: indexed pages and the "AI performance" view, when available.
- Server logs or Vercel analytics: requests from GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot.
- Citation checks: once a month ask ChatGPT, Perplexity, Gemini and Claude ten fixed questions ("best AI model for coding", "cheapest AI model API", "alternatives to GPT-6.1 Sol") and record whether ModelRegistry is cited. Keep the list in this folder and compare month to month.

## 7. Next candidates

- A monthly "State of AI models" post built from the changelog and the two CSVs: new releases, price moves, who moved on the independent index.
- A per-lab "pricing history" page once there are at least three dated price points per lab.
- A real social image per `/best/*` page (the Open Graph route already renders labs and models).
