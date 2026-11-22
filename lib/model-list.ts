import type { ModelItem } from "@/data/models"

/**
 * The part of a model record that list views and cards need.
 *
 * The full record carries field-level provenance (`fieldSources`), the change
 * log and every source link: about 300 KB of the 400 KB dataset. List pages
 * (home, labs, flagships, timeline) never show those, so shipping them to the
 * browser made every visitor download and parse them before anything was
 * interactive. Server pages build this slim list and pass it to the client
 * island as props; the full record is read on demand, only when a reader
 * opens a model's evidence (see `loadFullModel`).
 *
 * This module imports the dataset only as a type, on purpose: a value import
 * here would pull the whole dataset into every client bundle that uses it.
 */
export type ModelCore = Omit<ModelItem, "fieldSources" | "changeLog" | "sources">

export interface ModelListItem extends ModelCore {
  /** Number of primary sources behind the record. */
  sourceCount: number
  /** First cited source, for a "Source" link on dense lists; null when none. */
  primarySourceUrl: string | null
}

export function toListItem(model: ModelItem): ModelListItem {
  // The three heavy fields are dropped by name so a new heavy field cannot slip in unnoticed:
  // the integrity test fails if a ModelListItem ever carries one.
  const { fieldSources: _fieldSources, changeLog: _changeLog, sources, ...core } = model
  void _fieldSources
  void _changeLog
  return { ...core, sourceCount: sources.length, primarySourceUrl: sources[0]?.url ?? null }
}

export function toListItems(models: readonly ModelItem[]): ModelListItem[] {
  return models.map(toListItem)
}

/**
 * Reads the full record when a reader asks for evidence. The dataset is
 * imported dynamically, so it is its own chunk that downloads only now and is
 * cached afterwards. Rejects if the chunk cannot be loaded (offline, blocked);
 * callers show an honest unavailable state with a link to the full page.
 */
export async function loadFullModel(id: string): Promise<ModelItem | null> {
  const { modelsData } = await import("@/data/models")
  return modelsData.find((model) => model.id === id) ?? null
}
