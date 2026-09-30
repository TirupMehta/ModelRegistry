"use client"

import { useEffect } from "react"
import { initGlobalFeedback } from "@/lib/feedback"

/** Mounts the global delegated tap listener once for the whole app. */
export default function FeedbackInit() {
  useEffect(() => initGlobalFeedback(), [])
  return null
}
