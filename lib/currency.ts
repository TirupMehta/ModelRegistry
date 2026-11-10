import { type ModelItem } from "@/data/models"

/**
 * Which records are still on offer.
 *
 * A registry that ranks every record it has ever published is ranking history.
 * Nobody choosing a model today can pick ChatGPT 5.6 or Claude Opus 5, and a
 * leaderboard that puts them next to the current release implies they are
 * options. They are not, so they are separated rather than deleted.
 *
 * Two distinct facts, deliberately kept apart:
 *
 *   SUPERSEDED  a later record from the same laboratory took over the role.
 *               The record keeps its dates, sources and readings, and is ranked
 *               in its own section. It is not "retired": retirement is a claim
 *               about availability, and no laboratory has withdrawn these.
 *   RETIRED     the registry has a primary source saying the model is withdrawn.
 *               None are currently marked.
 *
 * Only a record that is neither superseded nor retired can hold a cross-test
 * standing, because a standing is a claim about what a reader can choose.
 */

export interface Lineup {
  /** Records a reader can choose today. */
  current: ModelItem[]
  /** Records replaced in their role, with the replacement resolved. */
  superseded: { model: ModelItem; successor: ModelItem | null }[]
  /** Records withdrawn by their laboratory. */
  retired: ModelItem[]
}

export function isSuperseded(model: ModelItem): boolean {
  return Boolean(model.supersededBy)
}

export function isRetired(model: ModelItem): boolean {
  return model.verificationStatus === "retired"
}

/** A record is current when nothing has replaced it and it has not been withdrawn. */
export function isCurrent(model: ModelItem): boolean {
  return !isSuperseded(model) && !isRetired(model)
}

export function splitLineup(models: ModelItem[]): Lineup {
  const byId = new Map(models.map((model) => [model.id, model]))
  const current: ModelItem[] = []
  const superseded: { model: ModelItem; successor: ModelItem | null }[] = []
  const retired: ModelItem[] = []

  for (const model of models) {
    if (isRetired(model)) {
      retired.push(model)
      continue
    }
    if (model.supersededBy) {
      superseded.push({ model, successor: byId.get(model.supersededBy) ?? null })
      continue
    }
    current.push(model)
  }

  superseded.sort(
    (a, b) =>
      b.model.releaseDate.localeCompare(a.model.releaseDate) ||
      a.model.name.localeCompare(b.model.name),
  )

  return { current, superseded, retired }
}

/**
 * Follow the supersession chain to the record that is actually current, so a
 * reader is never sent to another superseded record.
 */
export function currentSuccessor(model: ModelItem, models: ModelItem[]): ModelItem | null {
  const byId = new Map(models.map((candidate) => [candidate.id, candidate]))
  const seen = new Set<string>([model.id])
  let cursor = model.supersededBy ? byId.get(model.supersededBy) : undefined
  while (cursor && !seen.has(cursor.id)) {
    if (!cursor.supersededBy) return cursor
    seen.add(cursor.id)
    cursor = byId.get(cursor.supersededBy)
  }
  return null
}
