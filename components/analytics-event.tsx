"use client"

import { useEffect, useRef } from "react"
import { capture, type AnalyticsProperties } from "@/lib/analytics"

/**
 * Fires one analytics event when a server-rendered page mounts.
 *
 * The page itself stays a server component; this island is the smallest
 * possible way to attach a view event without turning the page into a client
 * boundary. The ref stops React Strict Mode's development double-mount from
 * counting the view twice.
 */
export default function AnalyticsEvent({
  event,
  properties,
}: {
  event: string
  properties?: AnalyticsProperties
}) {
  const sent = useRef(false)

  useEffect(() => {
    if (sent.current) return
    sent.current = true
    capture(event, properties)
  }, [event, properties])

  return null
}
