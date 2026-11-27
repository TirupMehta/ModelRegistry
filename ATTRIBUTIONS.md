# Attributions

ModelRegistry publishes facts that were read from someone else's page. This file
records the upstream sources whose work the registry builds on, what was taken,
and the licence or terms each one carries. Per-record citations live on each model
page; this page covers the datasets and APIs that feed the registry as a whole.

## Epoch AI

- **What is used:** the Epoch Capabilities Index (ECI) for the models the registry
  can match to Epoch's published file, used only as a second-evaluator cross-check
  on the ModelRegistry Score.
- **Source:** <https://epoch.ai/eci>, data file <https://epoch.ai/data/eci_scores.csv>
- **Licence:** [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- **Changes made:** Epoch's file is filtered to the models the registry tracks and
  carries (20 of its rows at the last refresh); model names are mapped to registry
  ids; no benchmark or ECI value is altered. Every figure is copied as printed.
- **Attribution:** Epoch AI, "Epoch Capabilities Index", published online at
  epoch.ai.
- **What is not done:** the ECI is never an input to a score. It is a composite of
  50+ benchmarks, so mixing it in would double-count tests and change published
  numbers. Epoch's method paper was funded by Google DeepMind; the index is an
  Epoch AI product.
- **Refresh:** `node scripts/refresh-epoch.mjs --write`. The committed
  `data/epoch-eci.ts` is generated; do not edit it by hand.

## Artificial Analysis

- **What is used:** independent benchmark results for the models the registry
  covers, with the evaluator's own configuration labels, plus its published cost
  and time per task.
- **Source:** <https://artificialanalysis.ai>, per-record page linked as
  `sourceUrl` in `data/independent-benchmarks.ts`.
- **Terms:** figures are quoted with attribution and a link to the page they were
  read from. No licence is asserted beyond that; the registry does not redistribute
  their dataset.
- **Attribution:** Artificial Analysis, "Artificial Analysis Intelligence Index"
  and the individual evaluations, published online at artificialanalysis.ai.
- **Refresh:** manual, by reading the cited page; the suite and its retrieval date
  are recorded in `data/independent-benchmarks.ts`.

## Hugging Face

- **What is used:** repository identity, 30-day download counter, likes, licence
  tag, creation and modification dates, and gated status for open-weight models,
  from the public Hub API.
- **Source:** <https://huggingface.co/api/models>
- **Terms:** public API metadata, quoted with the retrieval date. The registry does
  not host, mirror or redistribute weights.
- **Refresh:** `node scripts/ingest/huggingface.mjs`. A repository that returns 404
  is omitted rather than zeroed, and a partial refresh refuses to write.

## Provider documentation

- **What is used:** the exact model string a provider's API accepts, recorded only
  when the provider's own model page ends in that id and contains it.
- **Source:** the `apiDocs` link on each record; every entry in
  `data/api-ids.ts` carries the URL that proved it.
- **Refresh:** `node scripts/verify-api-ids.mjs`.

## Laboratories

Every specification on the site comes from the laboratory that built the model:
announcement, API documentation, pricing page or model card. Each record lists its
sources with publisher, title, the date the page was read and, where stated, the
date the laboratory published it. The registry does not infer a specification from
a press summary or another model in the same family.

## What ModelRegistry does not use

- No scraped leaderboard exports.
- No model weights, and no hosted inference.
- No provider traffic, usage share or revenue figures: those are not lab
  specifications.
