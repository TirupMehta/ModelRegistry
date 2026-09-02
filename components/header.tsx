"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import TextWithBlur from "@/components/text-with-blur"
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"
import { Database, Rss, Code2, RefreshCw, Check } from "lucide-react"

const NAV_ITEMS = [
  { label: "Overview", href: "/" },
  { label: "Laboratories", href: "/companies" },
  { label: "Comparison", href: "/leaderboard" },
  { label: "Changelog", href: "/timeline" },
] as const

function NavLinks({ pathname }: { pathname: string }) {
  const navRef = useRef<HTMLElement>(null)
  const pillRef = useRef<HTMLDivElement>(null)
  const ready = useRef(false)
  const [hoverHref, setHoverHref] = useState<string | null>(null)

  function isLinkActive(href: string) {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  const activeHref = NAV_ITEMS.find((n) => isLinkActive(n.href))?.href ?? "/"
  const targetHref = hoverHref ?? activeHref

  function positionPill(href: string, animate: boolean) {
    const nav = navRef.current
    const pill = pillRef.current
    if (!nav || !pill) return

    const anchor = nav.querySelector<HTMLElement>(`[data-navhref="${href}"]`)
    if (!anchor) return

    const nRect = nav.getBoundingClientRect()
    const aRect = anchor.getBoundingClientRect()

    if (animate) {
      pill.style.transition =
        "transform 160ms cubic-bezier(0.16,1,0.3,1), width 160ms cubic-bezier(0.16,1,0.3,1)"
    } else {
      pill.style.transition = "none"
    }

    pill.style.width = `${aRect.width}px`
    pill.style.transform = `translateX(${aRect.left - nRect.left}px)`
  }

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      positionPill(activeHref, false)
      requestAnimationFrame(() => {
        ready.current = true
      })
    })
    return () => cancelAnimationFrame(id)
  }, [activeHref])

  useEffect(() => {
    if (!ready.current) return
    positionPill(targetHref, true)
  }, [targetHref])

  useEffect(() => {
    const ro = new ResizeObserver(() => {
      positionPill(ready.current ? targetHref : activeHref, false)
    })
    if (navRef.current) ro.observe(navRef.current)
    return () => ro.disconnect()
  }, [targetHref, activeHref])

  return (
    <nav ref={navRef} className="relative flex items-center gap-2 sm:gap-4">
      <div
        ref={pillRef}
        aria-hidden="true"
        className="absolute inset-y-0 rounded-md bg-black/[0.045] dark:bg-white/[0.055] pointer-events-none will-change-transform"
      />

      {NAV_ITEMS.map(({ label, href }) => (
        <Link
          key={href}
          href={href}
          data-navhref={href}
          onMouseEnter={() => setHoverHref(href)}
          onMouseLeave={() => setHoverHref(null)}
          style={{ transition: "color 80ms ease-out" }}
          className={[
            "relative z-10 py-1 px-2 rounded-md",
            "text-sm md:text-base font-light select-none cursor-pointer",
            "[transition:color_80ms_ease-out,transform_100ms_cubic-bezier(0.16,1,0.3,1)]",
            "active:scale-[0.97]",
            isLinkActive(href)
              ? "text-black dark:text-white"
              : "text-zinc-400 dark:text-zinc-500 hover:text-black dark:hover:text-white",
          ].join(" ")}
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}

export default function Header() {
  const pathname = usePathname()
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncSuccess, setSyncSuccess] = useState(false)

  const handleManualSync = async () => {
    if (isSyncing) return
    setIsSyncing(true)
    setSyncSuccess(false)
    try {
      const res = await fetch("/api/check-updates")
      if (res.ok) {
        setSyncSuccess(true)
        setTimeout(() => setSyncSuccess(false), 3000)
      }
    } catch {
      // fallback
    } finally {
      setIsSyncing(false)
    }
  }

  const isHome = pathname === "/"

  return (
    <>
      {/* ── Top notice banner ────────────────────────────────────────────── */}
      <div className="reveal-in w-full bg-black/[0.015] dark:bg-white/[0.01] border-b border-black/5 dark:border-white/5 py-2.5 text-xs font-light text-black/50 dark:text-white/50">
        <div className="max-w-4xl mx-auto w-full px-6 md:px-20 flex items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
            <span className="text-accent font-medium uppercase tracking-[0.15em] text-[10px]">
              MODELREGISTRY
            </span>
            <span className="text-black/20 dark:text-white/20 select-none">/</span>
            <span className="truncate">
              The open public registry for frontier AI models across premier research labs.
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0 text-xs">
            <Link
              href="/rss.xml"
              className="group inline-flex items-center gap-1 hover:text-black dark:hover:text-white transition-colors"
            >
              <Rss size={11} className="opacity-50 group-hover:opacity-100" />
              <span className="hidden sm:inline">RSS</span>
            </Link>
            <span className="opacity-20 select-none">|</span>
            <Link
              href="/api/v1/models"
              className="group inline-flex items-center gap-1 hover:text-black dark:hover:text-white transition-colors"
            >
              <Code2 size={11} className="opacity-50 group-hover:opacity-100" />
              <span className="hidden sm:inline">API</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Brand Header (matches tirup.in structure) ────────────────────── */}
      <header className="max-w-4xl mx-auto w-full px-6 md:px-20 pt-6 md:pt-20 pb-0">
        <TextWithBlur>
          <div className="flex items-center justify-between gap-4 mb-4 md:mb-6">
            <div className="flex items-center gap-3.5">
              <Link href="/" className="group flex items-center gap-3.5 select-none">
                <div className="w-11 h-11 rounded-full flex items-center justify-center border border-black/10 dark:border-white/10 bg-black/[0.025] dark:bg-white/[0.035] text-accent transition-transform duration-200 group-hover:scale-105 shadow-sm">
                  <Database size={18} className="text-accent" />
                </div>
                <div className="flex items-center gap-2.5">
                  {isHome ? (
                    <h1 className="text-3xl md:text-4xl font-light tracking-tight text-black dark:text-white leading-none">
                      ModelRegistry
                    </h1>
                  ) : (
                    <p className="text-3xl md:text-4xl font-light tracking-tight text-black dark:text-white leading-none">
                      ModelRegistry
                    </p>
                  )}
                  <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full border border-black/10 dark:border-white/10 text-black/45 dark:text-white/45 bg-black/[0.02] dark:bg-white/[0.02]">
                    OPEN
                  </span>
                </div>
              </Link>
            </div>

            {/* Quick Sync & Theme Toggler */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                title="Verify live API feeds"
                className="group inline-flex items-center justify-center gap-1.5 h-[28px] px-3 text-[11px] font-medium tracking-wide bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/5 dark:border-white/5 hover:border-black/10 dark:hover:border-white/10 rounded-full text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white transition-all duration-150 select-none cursor-pointer active:scale-[0.97]"
              >
                {syncSuccess ? (
                  <>
                    <Check size={12} className="text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400">Verified</span>
                  </>
                ) : (
                  <>
                    <RefreshCw
                      size={11}
                      className={`text-black/50 dark:text-white/50 group-hover:text-black dark:group-hover:text-white transition-transform duration-300 ${
                        isSyncing ? "animate-spin" : "group-hover:rotate-180"
                      }`}
                    />
                    <span className="hidden sm:inline select-none">
                      {isSyncing ? "Checking..." : "Sync"}
                    </span>
                  </>
                )}
              </button>

              <AnimatedThemeToggler
                variant="circle"
                className="flex items-center justify-center w-8 h-8 rounded-full text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-150 cursor-pointer shrink-0 active:scale-[0.97]"
              />
            </div>
          </div>
        </TextWithBlur>

        {/* ── Navigation tabs ─────────────────────────────────────────────── */}
        <div className="flex justify-between items-center gap-4 mb-6 md:mb-10 border-b border-black/5 dark:border-white/5 pb-3 md:pb-4 flex-nowrap">
          <TextWithBlur delay={100} className="min-w-0">
            <NavLinks pathname={pathname} />
          </TextWithBlur>

          <div className="text-xs font-mono text-black/35 dark:text-white/35 select-none hidden sm:block">
            September 2026
          </div>
        </div>
      </header>
    </>
  )
}
