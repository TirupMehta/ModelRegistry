"use client"

import { useEffect, useState } from "react"
import { Volume2, VolumeX } from "lucide-react"
import {
  isClickSoundEnabled,
  setClickSoundEnabled,
  successFeedback,
} from "@/lib/feedback"

/**
 * Tiny persisted click-sound toggle. Haptics stay on whenever the
 * device supports them (they're silent); only the audible tick is
 * toggleable - nobody likes a site they can't mute.
 */
export default function FeedbackToggle() {
  const [on, setOn] = useState(true)

  useEffect(() => {
    setOn(isClickSoundEnabled())
    const sync = () => setOn(isClickSoundEnabled())
    window.addEventListener("mr-feedback-change", sync)
    window.addEventListener("storage", sync)
    return () => {
      window.removeEventListener("mr-feedback-change", sync)
      window.removeEventListener("storage", sync)
    }
  }, [])

  return (
    <button
      type="button"
      onClick={() => {
        const next = !on
        setClickSoundEnabled(next)
        setOn(next)
        // Strongest preset doubles as a "did you feel that?" test pulse.
        if (next) successFeedback()
      }}
      title={on ? "Mute click sounds" : "Enable click sounds"}
      aria-label={on ? "Mute click sounds" : "Enable click sounds"}
      aria-pressed={on}
      className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[11px] font-sans font-medium text-black/40 dark:text-zinc-500 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/[0.06] active:scale-95 transition-all duration-150 cursor-pointer"
    >
      {on ? <Volume2 size={12} /> : <VolumeX size={12} />}
      <span className="hidden sm:inline">{on ? "Ticks on" : "Muted"}</span>
    </button>
  )
}
