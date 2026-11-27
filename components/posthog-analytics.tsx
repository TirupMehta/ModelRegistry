"use client"

import Script from "next/script"
import { useRef } from "react"
import { POSTHOG_KEY, analyticsConfig, flushAnalytics } from "@/lib/analytics"

/**
 * Loads PostHog's maintained browser bundle after the page is interactive.
 *
 * The script is served through our /ingest reverse proxy (next.config.mjs),
 * which keeps analytics requests first-party and avoids the SDK living in the
 * Next.js bundle. Rendering nothing without a project key means an
 * unconfigured checkout sends no analytics at all.
 */
export default function PostHogAnalytics() {
  const initialized = useRef(false)

  if (!POSTHOG_KEY) return null

  const start = () => {
    if (initialized.current) return
    const client = window.posthog
    if (typeof client?.init !== "function") return
    initialized.current = true
    client.init(POSTHOG_KEY, analyticsConfig())
    flushAnalytics()
  }

  return (
    <Script
      id="posthog-array"
      src="/ingest/static/array.js"
      strategy="lazyOnload"
      onLoad={start}
      onReady={start}
    />
  )
}
