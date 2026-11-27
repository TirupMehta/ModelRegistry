import { providerApiIds } from "@/data/api-ids"
import { huggingfaceSnapshot } from "@/data/huggingface"
import { canonicalOverrides } from "@/data/canonical-overrides"

/**
 * The verified Phase 2 facts for one record, in the exact property names and
 * shapes `/schema/model-v1.json` defines.
 *
 * Every field is optional and is omitted when it has no verified value: no null,
 * no empty array, no zero. An API consumer therefore sees the same contract the
 * canonical schema describes, without a field that exists only to say "unknown".
 *
 * `canonicalApiIds` is an array of plain strings, because that is what the schema
 * declares. The provenance for each string (the provider page that proved it)
 * lives in `data/api-ids.ts` and is reachable from the model page.
 */
export interface VerifiedFacts {
  canonicalApiIds?: string[]
  huggingfaceRepo?: string
  hfDownloads30d?: number
  licenseSpdx?: string
}

export function verifiedFacts(modelId: string): VerifiedFacts {
  const override = canonicalOverrides[modelId]
  const hub = huggingfaceSnapshot.records[modelId]

  const ids = [...new Set(providerApiIds.filter((entry) => entry.modelId === modelId).map((entry) => entry.id))]
  const repo = override?.huggingfaceRepo ?? hub?.repo ?? null
  const downloads = hub?.downloads ?? null
  const spdx = override?.licenseSpdx ?? hub?.licenseSpdx ?? null

  const facts: VerifiedFacts = {}
  if (ids.length > 0) facts.canonicalApiIds = ids
  if (repo) facts.huggingfaceRepo = repo
  if (typeof downloads === "number" && Number.isFinite(downloads)) facts.hfDownloads30d = downloads
  if (spdx) facts.licenseSpdx = spdx
  return facts
}
