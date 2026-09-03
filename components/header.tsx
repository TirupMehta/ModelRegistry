"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
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
  function isLinkActive(href: string) {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  return (
    <nav className="inline-flex items-center gap-1 p-1 rounded-lg bg-black/[0.03] dark:bg-[#13161b] border border-black/10 dark:border-white/[0.08] overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden max-w-full touch-scroll">
      {NAV_ITEMS.map(({ label, href }) => {
        const active = isLinkActive(href)
        return (
          <Link
            key={href}
            href={href}
            className={[
              "group relative inline-flex items-center gap-1.5 sm:gap-2 py-1.5 px-2.5 sm:px-3 rounded-md text-xs sm:text-[13px] font-mono tracking-tight select-none cursor-pointer whitespace-nowrap transition-all duration-150 ease-out",
              active
                ? "bg-white dark:bg-[#1e222a] text-black dark:text-white font-medium shadow-xs border border-black/10 dark:border-white/10"
                : "text-black/55 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.05] active:scale-[0.98]",
            ].join(" ")}
          >
            {active ? (
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff5d2e] shadow-[0_0_6px_rgba(255,93,46,0.8)] shrink-0" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-transparent group-hover:bg-black/20 dark:group-hover:bg-white/20 transition-colors shrink-0" />
            )}
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

export default function Header() {
  const pathname = usePathname()
  const isHome = pathname === "/"

  return (
    <>
      {/* ── Top Telemetry Readout Bar ────────────────────────────────────── */}
      <div className="w-full bg-black/[0.02] dark:bg-[#0a0c0f] border-b border-black/5 dark:border-white/[0.06] py-2 text-[11px] font-mono text-black/60 dark:text-zinc-400">
        <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 md:px-20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <span className="inline-flex items-center gap-1.5 sm:gap-2 font-medium text-[#ff5d2e] tracking-wider uppercase text-[11px] sm:text-[12px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00e599] shadow-[0_0_6px_#00e599] shrink-0" />
              SYS://REGISTRY
            </span>
            <span className="text-black/20 dark:text-white/20 select-none hidden sm:inline">|</span>
            <span className="truncate hidden sm:inline text-black/50 dark:text-zinc-400">
              FRONTIER FOUNDATION MODELS &amp; CHECKPOINTS
            </span>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 text-[11px] sm:text-[12px] font-mono">
            <Link
              href="/rss.xml"
              className="group inline-flex items-center gap-1 hover:text-[#ff5d2e] dark:hover:text-[#ff7347] transition-colors duration-150"
            >
              <Rss size={11} className="text-[#ff5d2e]" />
              <span>RSS</span>
            </Link>
            <span className="opacity-20 select-none">/</span>
            <Link
              href="/api/v1/models"
              className="group inline-flex items-center gap-1 hover:text-[#ff5d2e] dark:hover:text-[#ff7347] transition-colors duration-150"
            >
              <Code2 size={11} className="text-[#ff5d2e]" />
              <span>API</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Industrial Header Unit ────────────────────────────────────────── */}
      <header className="max-w-4xl mx-auto w-full px-4 sm:px-6 md:px-20 pt-5 sm:pt-6 md:pt-16 pb-0">
        <TextWithBlur>
          <div className="flex items-center justify-between gap-3 mb-4 md:mb-6">
            <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
              <Link href="/" className="group inline-flex items-end gap-1.5 sm:gap-2 select-none">
                {isHome ? (
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-medium tracking-tight text-black dark:text-white leading-none">
                    Model<span className="font-bold text-[#ff5d2e]">Registry</span>
                  </h1>
                ) : (
                  <p className="text-xl sm:text-2xl md:text-3xl font-display font-medium tracking-tight text-black dark:text-white leading-none">
                    Model<span className="font-bold text-[#ff5d2e]">Registry</span>
                  </p>
                )}
                <span className="mb-0.5 sm:mb-1 inline-flex items-center text-[10px] sm:text-[11px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded border border-black/10 dark:border-white/[0.08] text-black/45 dark:text-zinc-400 bg-black/[0.02] dark:bg-white/[0.03] group-hover:border-[#ff5d2e]/50 group-hover:text-[#ff5d2e] transition-colors duration-150 leading-none shrink-0 font-medium">
                  v2026.9
                </span>
              </Link>
            </div>

            {/* Contribute Action & Theme Toggle */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <a
                href="https://github.com/TirupMehta/ModelRegistry"
                target="_blank"
                rel="noopener noreferrer"
                title="Contribute a newly released model on GitHub"
                className="group inline-flex items-center justify-center gap-1 sm:gap-1.5 h-[28px] px-2.5 sm:px-3 text-[11px] sm:text-[12px] font-mono tracking-wide bg-black/[0.04] dark:bg-white/[0.04] hover:bg-[#ff5d2e] dark:hover:bg-[#ff5d2e] border border-black/10 dark:border-white/[0.08] hover:border-[#ff5d2e] rounded-md text-black/70 dark:text-zinc-300 hover:text-white dark:hover:text-white transition-colors duration-150 select-none cursor-pointer"
              >
                <GitPullRequest
                  size={12}
                  className="text-black/50 dark:text-zinc-400 group-hover:text-white transition-colors duration-150"
                />
                <span className="hidden sm:inline">+ CONTRIBUTE</span>
                <span className="sm:hidden">+ ADD</span>
                <ArrowUpRight size={10} className="opacity-40 group-hover:opacity-100" />
              </a>

              <AnimatedThemeToggler
                variant="circle"
                className="flex items-center justify-center w-7 h-7 rounded-md border border-black/5 dark:border-white/[0.08] text-black/50 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/[0.06] transition-colors duration-150 cursor-pointer shrink-0"
              />
            </div>
          </div>
        </TextWithBlur>

        {/* ── Segmented Navigation Line ──────────────────────────────────── */}
        <div className="flex justify-between items-center gap-4 mb-6 md:mb-8 border-b border-black/5 dark:border-white/[0.07] pb-3 flex-nowrap overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden touch-scroll">
          <TextWithBlur delay={100} className="min-w-0 max-w-full">
            <NavLinks pathname={pathname} />
          </TextWithBlur>

          <div className="text-[11px] font-mono text-black/40 dark:text-zinc-400 select-none hidden sm:block tracking-wider shrink-0">
            [ EPOCH: SEPT 2026 ]
          </div>
        </div>
      </header>
    </>
  )
}
