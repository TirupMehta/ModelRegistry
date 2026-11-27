"use client"

import { useEffect, useState } from "react"
import { isAnalyticsOptedOut, setAnalyticsOptOut } from "@/lib/analytics"

/**
 * The control the privacy policy promises. The choice is stored in
 * localStorage, applied to a PostHog client that may already be running, and
 * honoured by `capture()` before the deferred bundle loads.
 */
export default function AnalyticsOptOut() {
  const [optedOut, setOptedOut] = useState(false)
  const [ready, setReady] = useState(false)
  const [announcement, setAnnouncement] = useState("")

  useEffect(() => {
    setOptedOut(isAnalyticsOptedOut())
    setReady(true)
  }, [])

  function change(next: boolean) {
    setAnalyticsOptOut(next)
    setOptedOut(next)
    setAnnouncement(
      next
        ? "Analytics is now off in this browser."
        : "Analytics is now on in this browser."
    )
  }

  const enabled = !optedOut

  return (
    <div className="mt-4 max-w-[68ch] rounded-xl border border-black/10 p-4 dark:border-white/[0.08]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p id="analytics-choice-label" className="text-body font-medium text-fg-strong">
            Product analytics in this browser
          </p>
          <p className="mt-1 text-small leading-5 text-fg-muted">
            Page views and the explicit events listed above. Turning this off does not affect the
            registry, the API, or your waitlist entry.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-labelledby="analytics-choice-label"
          onClick={() => change(enabled)}
          disabled={!ready}
          className="inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-black/15 p-0.5 transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ink/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] disabled:opacity-50 dark:border-white/20"
          style={{ backgroundColor: enabled ? "rgb(var(--accent-rgb))" : "transparent" }}
        >
          <span
            aria-hidden="true"
            className="block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
            style={{ transform: enabled ? "translateX(20px)" : "translateX(0)" }}
          />
        </button>
      </div>
      <p role="status" aria-live="polite" className="mt-2 min-h-4 text-small text-fg-muted">
        {announcement || (ready ? (optedOut ? "Analytics is off in this browser." : "Analytics is on in this browser.") : "")}
      </p>
    </div>
  )
}
