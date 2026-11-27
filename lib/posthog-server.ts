import { PostHog } from "posthog-node"
import { randomUUID } from "node:crypto"

/**
 * Server-side events for things a browser cannot report reliably: a completed
 * waitlist signup, for example, must count even if the visitor closes the tab
 * before the response is read.
 *
 * Project API keys are public by design, so the same NEXT_PUBLIC_POSTHOG_KEY
 * used by the browser is enough here. With no key configured this is a no-op.
 *
 * `flushAt: 1` sends immediately and `flush()` waits for the request, because
 * a serverless function can be frozen the moment its response is written.
 * GeoIP is disabled so the event carries no location derived from the caller.
 */

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY
const HOST = (process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com").replace(/\/+$/, "")

let client: PostHog | undefined

function getClient(): PostHog | null {
  if (!KEY) return null
  client ??= new PostHog(KEY, { host: HOST, flushAt: 1, flushInterval: 0, disableGeoip: true })
  return client
}

export async function captureServerEvent(
  event: string,
  properties: Record<string, string | number | boolean | null | undefined> = {},
): Promise<void> {
  const ph = getClient()
  if (!ph) return
  try {
    // A random id keeps the event anonymous and unlinked to any other visit.
    // No email address, IP or form text is ever sent.
    ph.capture({ distinctId: `server_${randomUUID()}`, event, properties })
    await ph.flush()
  } catch (error) {
    // Analytics must never turn a successful action into a failed request.
    console.error("[analytics] server event failed", error instanceof Error ? error.name : "unknown")
  }
}
