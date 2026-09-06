## What model / checkpoint is this for?

Model ID: `<!-- e.g. meta-muse-spark-1-3 -->`
Lab: `<!-- e.g. Meta AI -->`

## Type of change

- [ ] New model entry
- [ ] New lab (`data/companies.ts`)
- [ ] Data correction (pricing, context, links, badges)
- [ ] Site / API / docs fix (not model data)

## Official source (required)

<!-- Every model must link to an official announcement, technical report, arXiv paper, or verified Hugging Face repo. No rumors or social leaks. -->
Announcement / paper / weights URL:

## Checklist

- [ ] Edited only `data/models.ts` (and `data/companies.ts` if new lab)
- [ ] `id` is unique lowercase kebab-case
- [ ] `releaseDate` is `YYYY-MM-DD`
- [ ] Flagship rule followed: only 1x `isCompanyFlagship: true` per lab
- [ ] Popularity bar met: top-15 OpenRouter volume, primary flagship, or frontier capability
- [ ] Ran `pnpm test` locally and README table synced
- [ ] No secrets, `.env` files, or unrelated refactors included

## `pnpm test` output

```
<!-- paste relevant output -->
```

## Screenshots (if UI changed)

<!-- drag images here -->
