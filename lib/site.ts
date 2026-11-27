/**
 * One canonical origin for the whole site.
 *
 * Absolute URLs (canonical tags, Open Graph, feeds, JSON-LD, the snapshot
 * manifest, agent files) must agree on one host, and moving to a neutral domain
 * must be a configuration change rather than a search-and-replace across the
 * codebase. Set NEXT_PUBLIC_SITE_URL to migrate; the default keeps existing
 * deployments byte-identical when the variable is unset.
 *
 * NEXT_PUBLIC_ so client components can build the same absolute URLs, and
 * because it is inlined at build time: rebuild after changing it.
 */
const DEFAULT_SITE_URL = "https://modelregistry.tirup.in"

function normalize(input: string | undefined): string {
  const raw = (input || "").trim()
  const value = raw.replace(/\/+$/, "")
  if (value.length === 0) return DEFAULT_SITE_URL
  if (!/^https?:\/\/[^/\s]+$/.test(value)) {
    // Falling back silently is the worst outcome for a domain migration: every
    // canonical tag and share image would point at the old host with no signal.
    // Warn once, on the server only, and keep the site working.
    if (typeof window === "undefined") {
      console.warn(`[site] NEXT_PUBLIC_SITE_URL="${raw}" is not an origin (expected https://host); using ${DEFAULT_SITE_URL}.`)
    }
    return DEFAULT_SITE_URL
  }
  return value
}

export const SITE_URL = normalize(process.env.NEXT_PUBLIC_SITE_URL)
export const SITE_NAME = "ModelRegistry"
/** The one public mailbox. Mirrored in /contact, /privacy, /terms and the agent files. */
export const CONTACT_EMAIL = "modelregistry@tirup.in"
export const SITE_TITLE = "ModelRegistry: AI model comparison, pricing and benchmarks"
export const SITE_DESCRIPTION =
  "Compare context windows, pricing and independent benchmark scores for frontier AI models from every major lab. Every figure links to its primary source and the date it was checked."
