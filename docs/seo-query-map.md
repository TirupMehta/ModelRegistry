# Search query map

What this site can rank for, which page is supposed to answer each query, and
what is actually implemented today. Keep this in sync when routes or metadata
change; a query with no page behind it is a gap, not a keyword.

Search demand for this product splits into four buckets. They need different
pages, because one page cannot be the best answer to all four.

## 1. Person and brand (winnable outright)

Nobody else is competing for these, so they should rank first and stay ranked.

| Query | Page that answers it | Status |
|---|---|---|
| Tirup Mehta ModelRegistry | `/` + `/about` | Person + Organization nodes linked by `@id` |
| Tirup Mehta model registry | `/about` | Body copy names the project and the person |
| Mr Tirup Mehta / TirupMehta | `/about` | `alternateName` on the Person node |
| modelregistry.tirup.in | `/` | Canonical host |
| ModelRegistry AI / AI ModelRegistry | `/` | Title, description, keywords |
| Who made ModelRegistry | `/about` | FAQPage question 1 |
| Is ModelRegistry open source | `/about` | FAQPage question 4 |
| ModelRegistry by Tirup Mehta | `/about` | Organization `alternateName` |

Failure mode to avoid: the person name only appearing in a GitHub URL. The name
now exists as a `Person` entity with the same `@id` used by tirup.in and
blogs.tirup.in, so an indexer merges it into one identity instead of creating a
second, unranked one.

## 2. Category (contested, needs the qualifier)

The unqualified phrase "model registry" is owned by MLOps tooling: MLflow,
SageMaker, Vertex AI, Weights & Biases. Those results are correct for people
looking for artifact versioning. This site is a different product, so it targets
the qualified forms and states the difference on the page rather than fighting
for the head term.

| Query | Page that answers it | Status |
|---|---|---|
| AI model registry | `/` | Title + body copy |
| LLM registry | `/` | Body copy |
| frontier AI model index | `/` | H1 + description |
| public / open model registry | `/` | Keywords |
| AI model database | `/` | Keywords |
| model registry comparison | `/best` | Needs an intro paragraph on that page |
| registry of AI models vs MLOps | `/about` | "What ModelRegistry is not" section |

## 3. Data comparison (highest intent, strongest pages)

These queries convert, and each already has a dedicated page. What they lack is
the intro copy that names the query in visible text.

| Query | Page that answers it | Status |
|---|---|---|
| AI model leaderboard | `/best` | Page exists; h1 only |
| context window comparison | `/context` | Page exists |
| AI model pricing comparison | `/pricing` | Page exists |
| open weights models list | `/licenses` | Page exists |
| AI model release timeline | `/timeline` | Page exists |
| latest AI models 2026 | `/` + `/flagships` | Both exist |
| retired AI models | `/retired` | Page exists |

Next step for this bucket: one short intro paragraph per page containing the
query phrase in a real sentence, plus a link back to the model it describes.

## 4. Long tail (generated per model, already covered)

Every model page targets its own set of queries through the title pattern and
`TechArticle.keywords`:

- `{model} specs`
- `{model} context window`
- `{model} pricing`
- `{model} benchmarks`
- `{model} release date`
- `{company} latest model`

These are generated from the dataset, so a new model gets them automatically.
The limiting factor is not markup, it is whether the page has enough verifiable
detail to deserve the ranking; generic datasheets do not.

## What is deliberately not done

- No off-site SEO, no link building, no guest posts. Those are paid or time
  purchases, not code changes.
- No keyword stuffing in body copy. Every phrase above appears once, in a
  sentence a person would actually write.
- No `FAQPage` markup on pages that do not visibly render the questions.
- Model names are not claimed as guaranteed rankings; if a lab publishes no
  primary source for a field, the record says so instead of inventing it.

## Measurement

Nothing here is a ranking guarantee. Check quarterly in Search Console:
impressions for the person and brand terms, then click-through on the data
pages. If "Tirup Mehta" impressions are flat after the entity work, the problem
is external authority, not on-page markup.
