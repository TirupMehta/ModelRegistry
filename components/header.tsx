import Link from "next/link"
import TextWithBlur from "@/components/text-with-blur"
import HeaderBrand from "@/components/header-brand"
import HeaderNav from "@/components/header-nav"
import HeaderPrompt from "@/components/header-prompt"
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"
import { Rss, Code2, File, GitPullRequest, ArrowUpRight } from "lucide-react"
import { modelsData } from "@/data/models"
import { newestReleaseMonth } from "@/lib/registry"

// Server component: telemetry and layout render from the server-side
// dataset (never shipped to the browser). All interactivity lives in the
// header-*/ islands below. Freshness stamp derives from the newest tracked
// release - stays accurate as the registry grows, with no manual edits.
const newestMonth = newestReleaseMonth(modelsData)
const newestReleaseLabel = newestMonth
  ? new Date(`${newestMonth}-02`).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    })
  : ""

export default function Header() {
  return (
    <>
      {/* ── Top Telemetry Readout Bar ────────────────────────────────────── */}
      <div className="w-full bg-black/[0.02] dark:bg-[#0a0c0f] border-b border-black/5 dark:border-white/[0.06] py-2 text-[11px] font-sans text-black/60 dark:text-zinc-400">
        <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 md:px-20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="relative flex w-1.5 h-1.5 shrink-0">
              <span className="absolute inline-flex w-full h-full rounded-full bg-[#00e599] opacity-60 animate-ping" />
              <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-[#00e599]" />
            </span>
            <span className="truncate tracking-wide">
              <span className="font-medium text-black/70 dark:text-zinc-200">Live index</span>
              <span className="text-black/30 dark:text-zinc-500"> · {modelsData.length} models · Updated {newestReleaseLabel}</span>
            </span>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 text-[11px] sm:text-[12px] font-sans">
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
            <span className="opacity-20 select-none">/</span>
            <Link
              href="/docs"
              className="group inline-flex items-center gap-1 hover:text-[#ff5d2e] dark:hover:text-[#ff7347] transition-colors duration-150"
            >
              <File size={11} className="text-[#ff5d2e]" />
              <span>DOCS</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Industrial Header Unit ────────────────────────────────────────── */}
      <header className="max-w-4xl mx-auto w-full px-4 sm:px-6 md:px-20 pt-5 sm:pt-6 md:pt-16 pb-0">
        <TextWithBlur>
          <div className="flex items-center justify-between gap-3 mb-4 md:mb-6">
            <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
              <HeaderBrand />
            </div>

            {/* Contribute Action & Theme Toggle */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <a
                href="https://github.com/TirupMehta/ModelRegistry"
                target="_blank"
                rel="noopener noreferrer"
                title="Contribute a newly released model on GitHub"
                className="group inline-flex items-center justify-center gap-1 sm:gap-1.5 h-7 px-2.5 sm:px-3 text-[11px] sm:text-xs font-sans font-medium tracking-wide bg-black text-white dark:bg-white dark:text-black hover:bg-[#ff5d2e] dark:hover:bg-[#ff5d2e] dark:hover:text-white border border-black dark:border-white hover:border-[#ff5d2e] rounded-lg shadow-sm hover:shadow-md hover:shadow-[#ff5d2e]/20 active:scale-[0.97] transition-all duration-150 select-none cursor-pointer"
              >
                <GitPullRequest
                  size={12}
                  className="opacity-70 group-hover:opacity-100 transition-opacity duration-150"
                />
                <span className="hidden sm:inline">Contribute</span>
                <span className="sm:hidden">Add</span>
                <ArrowUpRight size={11} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-px group-hover:-translate-y-px transition-all duration-150" />
              </a>

              <AnimatedThemeToggler
                className="flex items-center justify-center w-7 h-7 rounded-lg border border-black/10 dark:border-white/[0.08] bg-white/60 dark:bg-white/[0.03] text-black/50 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:border-black/20 dark:hover:border-white/20 hover:bg-black/5 dark:hover:bg-white/[0.06] active:scale-95 transition-all duration-150 cursor-pointer shrink-0"
              />
            </div>
          </div>
        </TextWithBlur>

        {/* ── Segmented Navigation Line ──────────────────────────────────── */}
        <div className="flex items-center gap-3 sm:gap-4 mb-6 md:mb-8 border-b border-black/5 dark:border-white/[0.07] pb-3 sm:justify-between overflow-visible">
          <TextWithBlur delay={100} className="min-w-0 flex-1 sm:flex-none w-full sm:w-auto max-w-full">
            <HeaderNav />
          </TextWithBlur>

          <HeaderPrompt />
        </div>
      </header>
    </>
  )
}
