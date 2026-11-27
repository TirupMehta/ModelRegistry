/**
 * Curated facts that the registry's editorial records do not carry.
 *
 * `data/models.ts` holds what a product page states: name, release date, price,
 * context, licence, published benchmarks, and a citation for each. It does not
 * hold the machine-facing fields a canonical record needs - an SPDX identifier,
 * a stated training cutoff, a deprecation date, a provider's exact API string.
 *
 * Nothing is inferred here. An entry exists only for a model whose fact was read
 * on a primary source, and the source that proves it belongs in that model's
 * `sources` in `data/models.ts`. A model with no entry keeps `null` in the
 * canonical record, which the site renders as "Undisclosed".
 *
 * Shape is `CanonicalOverride` in lib/canonical.ts; a typo in a slug or a field
 * name fails `npm test` rather than being ignored.
 */

export interface CanonicalOverride {
  /** Model family, when the laboratory names one. */
  family?: string
  /** Former slugs that must 301 to the canonical slug. */
  aliases?: string[]
  /** 'YYYY-MM-DD' training cutoff, only when the laboratory states a date. */
  knowledgeCutoff?: string
  /** SPDX identifier, only when the licence is unambiguously one. */
  licenseSpdx?: string
  /** Canonical Hugging Face repository, 'org/repo', when it is a repository page. */
  huggingfaceRepo?: string
  /** Exact provider API model strings, copied from the provider's documentation. */
  canonicalApiIds?: string[]
  /** Lifecycle state that differs from the editorial record. */
  status?: "active" | "preview" | "deprecated" | "retired"
  /** 'YYYY-MM-DD' announced withdrawal date. */
  deprecationDate?: string
  /** 'YYYY-MM-DD' last day the model can be called. */
  sunsetDate?: string
  /** Capability facts that the registry's modality list cannot state. */
  capabilities?: {
    reasoning?: boolean
    toolCalling?: boolean
    structuredJson?: boolean
    vision?: boolean
    audio?: boolean
    video?: boolean
    promptCaching?: boolean
    batchApi?: boolean
  }
  /** Input modalities, only when the source states the direction. */
  modalitiesInput?: string[]
  /** Output modalities, only when the source states the direction. */
  modalitiesOutput?: string[]
  /** Training compute in FLOP, only from a cited estimate. */
  trainingComputeFlops?: number
  /** Training hardware as stated or estimated. */
  trainingHardware?: string
  /** Hugging Face downloads over 30 days, with a cited retrieval. */
  hfDownloads30d?: number
}

/**
 * Keyed by canonical slug. Empty until a fact is read on a primary source: the
 * registry does not seed this file with guesses to make a field look complete.
 */
export const canonicalOverrides: Record<string, CanonicalOverride> = {}
