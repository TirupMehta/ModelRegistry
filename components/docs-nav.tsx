"use client"

import { useCallback, useEffect, useRef, useState } from "react"

const INDEX = [
  { id: "overview", label: "Overview" },
  { id: "authentication", label: "Authentication" },
  { id: "rate-limits", label: "Rate limits & caching" },
  { id: "errors", label: "Errors" },
  { id: "get-models", label: "GET /v1/models" },
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

// Scrolls without touching the URL — no hashes, no query params, ever.
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
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id)
        }
      },
      { rootMargin: "-15% 0px -75% 0px" }
    )
    INDEX.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  // Keep the active link visible inside the rail without moving the page.
  useEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const link = nav.querySelector<HTMLElement>("[data-active='true']")
    if (!link) return
    const linkTop = link.offsetTop
    const linkBottom = linkTop + link.offsetHeight
    const viewTop = nav.scrollTop
    const viewBottom = viewTop + nav.clientHeight
    if (linkTop < viewTop) {
      nav.scrollTo({ top: linkTop - 8, behavior: "smooth" })
    } else if (linkBottom > viewBottom) {
      nav.scrollTo({ top: linkBottom - nav.clientHeight + 8, behavior: "smooth" })
    }
  }, [active])

  const jump = useCallback((id: string) => {
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
        className="overflow-y-auto min-h-0 border-l border-black/10 dark:border-white/[0.08] [scrollbar-width:thin]"
      >
        {INDEX.map((item) => {
          const isActive = active === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => jump(item.id)}
              data-active={isActive}
              aria-current={isActive ? "true" : undefined}
              className={[
                "block w-full text-left pl-4 py-[7px] -ml-px text-[13px] font-sans leading-snug transition-colors border-l-2 cursor-pointer",
                isActive
                  ? "text-black dark:text-white font-medium border-[#ff5d2e]"
                  : "text-black/50 dark:text-zinc-400 border-transparent hover:text-black dark:hover:text-white hover:border-black/20 dark:hover:border-white/20",
              ].join(" ")}
            >
              {item.label}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
