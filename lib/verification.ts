import type { ModelItem } from "@/data/models"

/**
 * The only verification states that may reach a public surface (pages, API,
 * feeds, markdown, MCP). The site shows confirmed facts and nothing else:
 * a record still being re-sourced carries no status at all, so a reader never
 * sees a half-confirmed label. The
 * stored `verificationStatus` is internal audit state; read it only through
 * this function when producing output.
 */
export function publicVerificationStatus(model: Pick<ModelItem, "verificationStatus">): "verified" | "retired" | undefined {
  return model.verificationStatus === "verified" || model.verificationStatus === "retired"
    ? model.verificationStatus
    : undefined
}

/** A model for public JSON: the internal status is replaced by its public form. */
export function toPublicModel<T extends Pick<ModelItem, "verificationStatus">>(model: T): Omit<T, "verificationStatus"> & { verificationStatus?: "verified" | "retired" } {
  const { verificationStatus: _internal, ...rest } = model
  void _internal
  const status = publicVerificationStatus(model)
  return status ? { ...rest, verificationStatus: status } : rest
}
