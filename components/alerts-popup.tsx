"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowUpRight, Bell, X } from "lucide-react"
import AlertsWaitlistForm from "@/components/alerts-waitlist-form"
import { tapFeedback } from "@/lib/feedback"
import { hasJoinedWaitlist } from "@/lib/waitlist/client-storage"

/**
 * Waitlist popup for the landing page. Deliberately restrained: it appears
 * once, after the visitor has had time to read the index, and then stays out
 * of the way for two weeks if dismissed.
 *
 * The panel reuses the dossier modal's paper, hairline borders, type, and
 * coral accent so it reads as another surface of the registry rather than a
 * marketing interstitial.
 */

const DISMISS_KEY = "modelregistry:alerts-popup:v1:dismissed-at"
const DISMISS_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000
const OPEN_DELAY_MS = 25_000
/** A visitor sees a page or two before anything asks for an email address. */
const MIN_PAGES_BEFORE_ASKING = 3

export default function AlertsPopup() {
  const [open, setOpen] = useState(false)
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const openRef = useRef(false)
  // Distinguishes "visitor closed the panel" from "route changed while it was
  // open". Only the former should put the page back where it was; restoring
  // scroll during navigation would land the next page halfway down.
  const closedByUserRef = useRef(false)

  const close = useCallback(() => {
    if (!openRef.current) return
    openRef.current = false
    closedByUserRef.current = true
    setOpen(false)
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()))
    } catch {
      // Storage unavailable - the popup simply shows again next visit.
    }
  }, [])

  // Arm the single delayed appearance. Nothing is marked as seen until the
  // visitor actually closes the panel, so a refresh before they act still
  // gives the waitlist another chance.
  useEffect(() => {
    if (hasJoinedWaitlist()) return

    try {
      const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) ?? 0)
      if (dismissedAt && Date.now() - dismissedAt < DISMISS_COOLDOWN_MS) return
    } catch {
      // Private mode / blocked storage: show once per page load.
    }

    // Do not ask a stranger for an email before they have looked around.
    try {
      const pages = Number(sessionStorage.getItem("mr_pages") ?? 0) + 1
      sessionStorage.setItem("mr_pages", String(pages))
      if (pages < MIN_PAGES_BEFORE_ASKING) return
    } catch {
      return
    }

    // A deep link to a model dossier is a specific intent; do not interrupt it.
    if (new URLSearchParams(window.location.search).has("model")) return

    let cancelled = false
    let timer = 0

    const attempt = () => {
      if (cancelled) return
      if (hasJoinedWaitlist()) return

      // Never stack on top of the model datasheet or share studio.
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) {
        timer = window.setTimeout(attempt, 4_000)
        return
      }

      // Do not pull someone out of the search box mid-query.
      const active = document.activeElement
      if (
        active instanceof HTMLElement &&
        (active.tagName === "INPUT" ||
          active.tagName === "TEXTAREA" ||
          active.tagName === "SELECT" ||
          active.isContentEditable)
      ) {
        timer = window.setTimeout(attempt, 4_000)
        return
      }

      returnFocusRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null
      closedByUserRef.current = false
      openRef.current = true
      setOpen(true)
    }

    timer = window.setTimeout(attempt, OPEN_DELAY_MS)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [])

  // Scroll lock, Escape dismissal, focus trap, and exact focus/scroll restore.
  useEffect(() => {
    if (!open) return

    const scrollY = window.scrollY
    const previousOverflow = document.body.style.overflow
    const html = document.documentElement
    const previousScrollBehavior = html.style.scrollBehavior

    document.body.style.overflow = "hidden"
    // Move focus into the panel without painting a pointer focus ring on the
    // close button. Keyboard users get the ring on their first Tab.
    const focusTimer = window.setTimeout(() => dialogRef.current?.focus(), 0)

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        close()
        return
      }

      if (event.key !== "Tab") return

      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])'
      )
      if (!focusables || focusables.length === 0) return

      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement
      if (event.shiftKey && (active === first || active === dialogRef.current)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.clearTimeout(focusTimer)
      window.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = previousOverflow

      // A route change unmounts the dialog with the page still at its current
      // position; only restore the old scroll when the visitor actually
      // dismissed the panel.
      if (closedByUserRef.current) {
        html.style.scrollBehavior = "auto"
        window.scrollTo(0, scrollY)
        html.style.scrollBehavior = previousScrollBehavior
      }

      const previous = returnFocusRef.current
      if (previous && document.contains(previous)) previous.focus()
      returnFocusRef.current = null
      closedByUserRef.current = false
    }
  }, [open, close])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="alerts-popup-title"
      className="alerts-popup-backdrop fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-black/60 backdrop-blur-md"
      onClick={close}
    >
      <div className="min-h-full flex justify-center p-3 sm:p-6">
        <div
          ref={dialogRef}
          tabIndex={-1}
          className="alerts-popup-panel relative m-auto w-full max-w-md max-h-[calc(100dvh-1.5rem)] overflow-y-auto overscroll-contain rounded-2xl border border-black/10 bg-white p-4 shadow-2xl outline-none ring-1 ring-black/5 transition-colors duration-150 ease-out dark:border-white/[0.08] dark:bg-[var(--surface-raised)] dark:ring-white/5 sm:p-6"
          onClick={(event) => event.stopPropagation()}
        >
          {/* Dossier-style control bar, matching the model datasheet. */}
          <div className="mb-4 flex items-center justify-between gap-2 border-b border-black/10 pb-3 dark:border-white/[0.08] sm:mb-5">
            <div className="flex min-w-0 items-center gap-1.5 text-[11px] font-sans text-accent-ink sm:gap-2">
              <Bell size={13} className="shrink-0" aria-hidden="true" />
              <span className="truncate font-medium">
                Model Alerts
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                tapFeedback()
                close()
              }}
              aria-label="Close waitlist popup"
              className="inline-flex min-h-8 min-w-8 shrink-0 cursor-pointer items-center justify-center rounded-md p-1.5 text-black/50 transition-colors duration-150 hover:bg-black/5 hover:text-black active:scale-[0.985] dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>

          <h2
            id="alerts-popup-title"
            className="text-balance font-display text-xl font-semibold tracking-tight text-black dark:text-white sm:text-2xl"
          >
            Every AI model update that matters, in your inbox.
          </h2>
          <p className="mt-2 text-pretty text-[13px] font-sans leading-6 text-black/60 dark:text-zinc-400">
            New launches, price changes, deprecations.
          </p>

          <div className="mt-5">
            <AlertsWaitlistForm variant="embedded" />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-black/10 pt-3 text-[11px] font-sans dark:border-white/[0.08]">
            <span className="text-black/45 dark:text-zinc-500">
              No account, no mailing list.
            </span>
            <Link
              href="/alerts"
              className="inline-flex shrink-0 items-center gap-1 font-medium text-accent-ink underline-offset-2 hover:underline"
            >
              How it works
              <ArrowUpRight size={10} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
