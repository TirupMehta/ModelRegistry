import { createHmac } from "node:crypto"

/**
 * Request-level helpers for the waitlist endpoint: who is calling (for rate
 * limiting) and whether the call came from this site.
 */

/** Vercel sets `x-forwarded-for`; the left-most entry is the original client. */
export function clientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim()
    if (first) return first
  }
  return request.headers.get("x-real-ip")?.trim() || null
}

/**
 * Pseudonymous rate-limit key. The address itself is never stored: only an
 * HMAC of it, which is enough to count attempts and useless for identifying
 * anyone. Set WAITLIST_HASH_SECRET in production so the key cannot be
 * recomputed from a guessed IP.
 */
export function rateLimitKey(ip: string): string {
  const secret = process.env.WAITLIST_HASH_SECRET ?? "modelregistry-waitlist"
  return createHmac("sha256", secret).update(ip).digest("hex")
}

/**
 * Same-origin check. Browsers always send `Origin` on a cross-site POST, so a
 * mismatch is a cross-site submission rather than our own form. Requests with
 * no Origin at all (curl, server-to-server) are allowed through: they cannot
 * ride a user's cookies, and there is nothing here for them to forge.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin")
  if (!origin) return true

  let originHost: string
  try {
    originHost = new URL(origin).host
  } catch {
    return false
  }

  const requestHost =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? new URL(request.url).host
  return originHost === requestHost
}
