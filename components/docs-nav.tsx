"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { BounceSidebar } from "@/components/bounce-sidebar"

const INDEX = [
  { id: "overview", label: "Overview" },
  { id: "authentication", label: "Authentication" },
  { id: "rate-limits", label: "Rate limits & caching" },
  { id: "errors", label: "Errors" },
  { id: "get-models", label: "GET /v1/models" },
  { id: "get-model", label: "GET /v1/models/{id}" },
  { id: "get-changes", label: "GET /v1/changes" },
  { id: "model-object", label: "The model object" },
  { id: "examples", label: "Examples" },
  { id: "agent-prompts", label: "Agent prompts" },
  { id: "cli", label: "CLI & plain text" },
  { id: "feeds", label: "Feeds" },
  { id: "badges", label: "Badges & health" },
  { id: "versioning", label: "Versioning" },
  { id: "labs", label: "Laboratories" },
  { id: "support", label: "Support" },
]

// Scrolls without touching the URL - no hashes, no query params, ever.
function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
}

export function DocsIndexChips() {
  return (
    <div className="min-[1440px]:hidden flex gap-1.5 overflow-x-auto pb-4 mb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {INDEX.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => scrollToSection(item.id)}
          className="shrink-0 px-3 py-1.5 rounded-full border border-black/10 dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.03] text-xs font-sans text-black/65 dark:text-zinc-300 active:border-[#ff5d2e]/50 cursor-pointer"
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

export default function DocsSidebar() {
  const [active, setActive] = useState("overview")
  const activeIndex = Math.max(
    0,
    INDEX.findIndex((item) => item.id === active),
  )
  const navRef = useRef<HTMLElement>(null)
  // Briefly owned by clicks: the smooth scroll flies past intermediate
  // sections, so ignore scroll-spy until the page settles on target.
  const lockUntilRef = useRef(0)
  // Clicked section sticks: once the flight settles, the dot stays on the
  // clicked item (even if the probe line physically sits in a section
  // below it, which happens for tail clicks on tall viewports where the
  // browser clamps the landing to max scroll). Any user scroll resumes spy.
  const stickRef = useRef<string | null>(null)
  const settleYRef = useRef(-1)

  // Scroll-spy over window scroll. The probe rides at 35% viewport height -
  // shallow enough that a clicked section still owns it once the click lock
  // releases. In the last screenful the probe eases down toward the page end
  // so every short trailing section (Laboratories, Support) gets crossed in
  // order instead of the spy leaping over one straight to the bottom.
  useEffect(() => {
    let raf = 0
    const pick = (probe: number) => {
      let current = INDEX[0].id
      for (const { id } of INDEX) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top + window.scrollY <= probe) {
          current = id
        }
      }
      return current
    }
    const update = () => {
      raf = 0
      if (Date.now() < lockUntilRef.current) return
      // First update after a click flight: record where it settled.
      if (stickRef.current && settleYRef.current < 0) {
        settleYRef.current = window.scrollY
      }
      // No user scroll since the click settled - keep the clicked item.
      if (
        stickRef.current &&
        Math.abs(window.scrollY - settleYRef.current) < 2
      ) {
        setActive(stickRef.current)
        return
      }
      stickRef.current = null
      const vh = window.innerHeight
      const doc = document.documentElement
      if (doc.scrollHeight <= vh) {
        setActive(INDEX[0].id)
        return
      }
      const remaining = doc.scrollHeight - window.scrollY - vh
      const normal = window.scrollY + vh * 0.35
      // t = 0 one screenful above the bottom, t = 1 at max scroll.
      const t = Math.min(1, Math.max(0, 1 - remaining / vh))
      const probe = normal * (1 - t) + (doc.scrollHeight - 64) * t
      setActive(pick(probe))
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule)
    return () => {
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  // Keep the active link visible inside the rail without moving the page.
  useEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const link = nav.querySelector<HTMLElement>("[data-active='true']")
    if (!link) return
    const navRect = nav.getBoundingClientRect()
    const linkRect = link.getBoundingClientRect()
    if (linkRect.top < navRect.top) {
      nav.scrollTo({
        top: nav.scrollTop + linkRect.top - navRect.top - 8,
        behavior: "smooth",
      })
    } else if (linkRect.bottom > navRect.bottom) {
      nav.scrollTo({
        top: nav.scrollTop + linkRect.bottom - navRect.bottom + 8,
        behavior: "smooth",
      })
    }
  }, [active])

  const jump = useCallback((id: string) => {
    stickRef.current = id
    settleYRef.current = -1
    lockUntilRef.current = Date.now() + 1200
    setActive(id)
    scrollToSection(id)
  }, [])

  return (
    <div className="flex flex-col min-h-0 h-full">
      <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-black/35 dark:text-zinc-500 mb-3 px-1 shrink-0">
        Reference
      </div>
      <nav
        ref={navRef}
        className="overflow-y-auto min-h-0 [scrollbar-width:thin]"
      >
        <BounceSidebar
          items={INDEX.map((item) => item.label)}
          value={activeIndex}
          onChange={(index) => jump(INDEX[index].id)}
          dotColor="#ff5d2e"
        />
      </nav>
    </div>
  )
}
