/**
 * Client-side product analytics.
 *
 * PostHog is loaded as its maintained browser bundle from our own /ingest
 * reverse proxy, not imported into the Next.js bundle. The homepage first-load
 * budget is a product constraint (see scripts/test-routes.js), and the full
 * posthog-js SDK would add tens of kilobytes to every visitor's critical path
 * for analytics they never asked to wait for. `next/script` loads it at
 * `lazyOnload`, after the page is usable.
 *
 * Everything here is a no-op when NEXT_PUBLIC_POSTHOG_KEY is unset, so a local
 * checkout or a preview deployment without analytics configured behaves
 * exactly as before.
 */

export const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? ""

/**
 * Visitor choice, kept on this device. `1` means stop sending analytics. The
 * value is read by `capture()` and passed to PostHog as
 * `opt_out_capturing_by_default`, so an opt-out survives reloads even before
 * the deferred bundle finishes loading.
 */
export const ANALYTICS_OPT_OUT_KEY = "mr-analytics-opt-out"

/** The real PostHog host. The browser always talks to /ingest instead. */
export const POSTHOG_HOST = (
  process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com"
).replace(/\/+$/, "")

/** Dashboard/toolbar host, derived from the ingestion host (US or EU). */
export const POSTHOG_UI_HOST = POSTHOG_HOST.replace(".i.posthog.com", ".posthog.com")

export type AnalyticsProperties = Record<
  string,
  string | number | boolean | null | undefined
>

type PostHogClient = {
  init?: (key: string, config?: Record<string, unknown>) => void
  capture?: (event: string, properties?: AnalyticsProperties) => void
  opt_out_capturing?: () => void
  opt_in_capturing?: () => void
}

declare global {
  interface Window {
    posthog?: PostHogClient
  }
}

/**
 * Events fired before the deferred script lands are held here and replayed
 * once `init` has run. The cap keeps a broken or blocked script from growing
 * memory on a long session.
 */
const pending: Array<{ event: string; properties?: AnalyticsProperties }> = []
const MAX_PENDING = 50

/**
 * Collapse high-cardinality paths to a stable route name so PostHog insights
 * can group by page type. The raw `$pathname` is still sent; this adds
 * `route` alongside it.
 */
export function routeTemplate(pathname: string): string {
  const path = pathname.split("?")[0].replace(/\/+$/, "") || "/"
  if (path === "/") return "/"
  const [root, ...rest] = path.split("/").filter(Boolean)
  // One record per level for these collections; their ids are unbounded.
  if (["models", "companies", "compare", "best", "alternatives"].includes(root) && rest.length === 1) {
    return `/${root}/[id]`
  }
  return path
}

/** True when this browser has asked the site to stop sending analytics. */
export function isAnalyticsOptedOut(): boolean {
  try {
    if (typeof localStorage === "undefined") return false
    return localStorage.getItem(ANALYTICS_OPT_OUT_KEY) === "1"
  } catch {
    return false
  }
}

/**
 * Persist the visitor's choice and apply it to a client that may already be
 * running. Queued events are dropped on opt-out so nothing captured before the
 * choice is sent afterwards.
 */
export function setAnalyticsOptOut(optedOut: boolean): void {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(ANALYTICS_OPT_OUT_KEY, optedOut ? "1" : "0")
    }
  } catch {
    // Storage unavailable: the in-memory guard below still stops this page.
  }
  if (!POSTHOG_KEY || typeof window === "undefined") return
  pending.length = 0
  try {
    if (optedOut) window.posthog?.opt_out_capturing?.()
    else window.posthog?.opt_in_capturing?.()
  } catch {
    // Analytics must never break the page.
  }
}

/** Send an event, or queue it until the deferred client is ready. */
export function capture(event: string, properties?: AnalyticsProperties): void {
  if (typeof window === "undefined" || !POSTHOG_KEY || isAnalyticsOptedOut()) return
  const client = window.posthog
  if (typeof client?.capture === "function") {
    client.capture(event, properties)
    return
  }
  if (pending.length < MAX_PENDING) pending.push({ event, properties })
}

/** Replay events captured before posthog.init() ran. */
export function flushAnalytics(): void {
  if (typeof window === "undefined" || !pending.length || isAnalyticsOptedOut()) return
  const client = window.posthog
  if (typeof client?.capture !== "function") return
  for (const item of pending.splice(0)) client.capture(item.event, item.properties)
}

/**
 * Privacy-first configuration. The site promises aggregate analytics, not
 * individual tracking, so session replay, autocapture, surveys, heatmaps and
 * feature-flag evaluation are all off. Only pageviews and the handful of
 * explicit events in this repo are sent. `persistence: "localStorage"` keeps
 * the random visitor id out of cookies; Do Not Track is honoured.
 */
export function analyticsConfig(): Record<string, unknown> {
  return {
    api_host: "/ingest",
    ui_host: POSTHOG_UI_HOST,
    capture_pageview: "history_change",
    capture_pageleave: false,
    autocapture: false,
    enable_heatmaps: false,
    disable_session_recording: true,
    disable_surveys: true,
    disable_external_dependency_loading: true,
    advanced_disable_feature_flags: true,
    person_profiles: "identified_only",
    persistence: "localStorage",
    respect_dnt: true,
    // A visitor who used the switch on /privacy stays opted out across reloads,
    // even before the deferred bundle runs.
    opt_out_capturing_by_default: isAnalyticsOptedOut(),
    before_send: (event: { event?: string; properties?: Record<string, unknown> }) => {
      const properties = event.properties ?? {}
      // posthog-js has no top-level geoip switch; this documented property
      // tells ingestion not to derive a location for every event.
      properties.$geoip_disable = true
      if (event.event === "$pageview") {
        const pathname = properties.$pathname
        if (typeof pathname === "string") properties.route = routeTemplate(pathname)
      }
      event.properties = properties
      return event
    },
  }
}
