"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import TextWithBlur from "@/components/text-with-blur"
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"
import { Rss, Code2, GitPullRequest, ArrowUpRight } from "lucide-react"

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
        "transform 140ms cubic-bezier(0.16,1,0.3,1), width 140ms cubic-bezier(0.16,1,0.3,1)"
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
    <nav ref={navRef} className="relative flex items-center gap-1 sm:gap-2">
      {/* Segmented active pill with tactile technical outline */}
      <div
        ref={pillRef}
        aria-hidden="true"
        className="absolute inset-y-0 rounded bg-black/[0.05] dark:bg-white/[0.06] border border-black/5 dark:border-white/[0.08] pointer-events-none will-change-transform"
      />

      {NAV_ITEMS.map(({ label, href }) => (
        <Link
          key={href}
          href={href}
          data-navhref={href}
          onMouseEnter={() => setHoverHref(href)}
          onMouseLeave={() => setHoverHref(null)}
          className={[
            "relative z-10 py-1.5 px-3 rounded text-xs sm:text-[13px] font-mono tracking-tight select-none cursor-pointer transition-colors duration-100",
            isLinkActive(href)
              ? "text-black dark:text-white font-medium"
              : "text-black/50 dark:text-zinc-400 hover:text-black dark:hover:text-white",
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
  const isHome = pathname === "/"

  return (
    <>
      {/* ── Top Telemetry Readout Bar ────────────────────────────────────── */}
      <div className="reveal-in w-full bg-black/[0.02] dark:bg-[#0e1013] border-b border-black/5 dark:border-white/[0.07] py-2 text-[11px] font-mono text-black/60 dark:text-zinc-400">
        <div className="max-w-4xl mx-auto w-full px-6 md:px-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="inline-flex items-center gap-1.5 font-medium text-[#ff4400] tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00e599] animate-pulse shrink-0" />
              SYS://REGISTRY
            </span>
            <span className="text-black/20 dark:text-white/20 select-none">|</span>
            <span className="truncate hidden sm:inline text-black/50 dark:text-zinc-400">
              FRONTIER FOUNDATION MODELS &amp; CHECKPOINTS
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0 text-[11px] font-mono">
            <Link
              href="/rss.xml"
              className="inline-flex items-center gap-1 hover:text-[#ff4400] dark:hover:text-[#ff5511] transition-colors"
            >
              <Rss size={11} className="text-[#ff4400]" />
              <span>RSS</span>
            </Link>
            <span className="opacity-20 select-none">/</span>
            <Link
              href="/api/v1/models"
              className="inline-flex items-center gap-1 hover:text-[#ff4400] dark:hover:text-[#ff5511] transition-colors"
            >
              <Code2 size={11} className="text-[#ff4400]" />
              <span>API</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Industrial Header Unit ────────────────────────────────────────── */}
      <header className="max-w-4xl mx-auto w-full px-6 md:px-20 pt-6 md:pt-16 pb-0">
        <TextWithBlur>
          <div className="flex items-center justify-between gap-4 mb-4 md:mb-6">
            <div className="flex items-center gap-3.5">
              <Link href="/" className="group flex items-center gap-2.5 select-none">
                <div className="flex items-center gap-2.5">
                  {isHome ? (
                    <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-black dark:text-white leading-none">
                      Model<span className="font-semibold text-[#ff4400]">Registry</span>
                    </h1>
                  ) : (
                    <p className="text-2xl sm:text-3xl font-light tracking-tight text-black dark:text-white leading-none">
                      Model<span className="font-semibold text-[#ff4400]">Registry</span>
                    </p>
                  )}
                  <span className="text-[10px] uppercase font-mono tracking-widest px-1.5 py-0.5 rounded border border-black/10 dark:border-white/[0.1] text-black/50 dark:text-zinc-400 bg-black/[0.02] dark:bg-white/[0.02]">
                    v2026.9
                  </span>
                </div>
              </Link>
            </div>

            {/* Contribute Action & Theme Toggle */}
            <div className="flex items-center gap-2">
              <a
                href="https://github.com/TirupMehta/ModelRegistry"
                target="_blank"
                rel="noopener noreferrer"
                title="Contribute a newly released model on GitHub"
                className="group inline-flex items-center justify-center gap-1.5 h-[28px] px-3 text-[11px] font-mono tracking-wide bg-black/[0.04] dark:bg-white/[0.05] hover:bg-[#ff4400] dark:hover:bg-[#ff4400] border border-black/10 dark:border-white/[0.08] hover:border-[#ff4400] rounded text-black/70 dark:text-zinc-300 hover:text-white dark:hover:text-white transition-all duration-150 select-none cursor-pointer active:scale-[0.97]"
              >
                <GitPullRequest
                  size={12}
                  className="text-black/50 dark:text-zinc-400 group-hover:text-white transition-colors"
                />
                <span>+ CONTRIBUTE</span>
                <ArrowUpRight size={10} className="opacity-40 group-hover:opacity-100" />
              </a>

              <AnimatedThemeToggler
                variant="circle"
                className="flex items-center justify-center w-7 h-7 rounded border border-black/5 dark:border-white/[0.08] text-black/50 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/[0.06] transition-all cursor-pointer shrink-0"
              />
            </div>
          </div>
        </TextWithBlur>

        {/* ── Segmented Navigation Line ──────────────────────────────────── */}
        <div className="flex justify-between items-center gap-4 mb-6 md:mb-8 border-b border-black/5 dark:border-white/[0.07] pb-3 flex-nowrap">
          <TextWithBlur delay={100} className="min-w-0">
            <NavLinks pathname={pathname} />
          </TextWithBlur>

          <div className="text-[11px] font-mono text-black/40 dark:text-zinc-400 select-none hidden sm:block tracking-wider">
            [ EPOCH: SEPT 2026 ]
          </div>
        </div>
      </header>
    </>
  )
}
