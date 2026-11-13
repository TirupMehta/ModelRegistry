import Link from "next/link"
import TextWithBlur from "@/components/text-with-blur"
import HeaderBrand from "@/components/header-brand"
import HeaderNav from "@/components/header-nav"
import HeaderPrompt from "@/components/header-prompt"
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"
import { Rss, Code2, File, GitPullRequest, ArrowUpRight } from "lucide-react"
import { modelsData } from "@/data/models"
import { datasetRevision } from "@/data/revision"
import { formatDate } from "@/lib/utils"

// The revision date is the last actual change to registry data, not the
// newest model release date or a claim that model facts update in real time.
const revisedLabel = formatDate(datasetRevision.revisedAt)

export default function Header() {
  return (
    <>
      {/* ── Top Telemetry Readout Bar ────────────────────────────────────── */}
      <div className="w-full bg-[var(--tile)] rule-b py-2 text-caption font-sans text-fg-muted">
        <div className="page-x flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="block min-w-0 truncate">
              <span className="font-medium text-fg">Curated dataset</span>
              <span className="mx-2 inline-block h-3 w-px translate-y-px bg-black/10 dark:bg-white/15" aria-hidden="true" />
              <span className="tabular-nums text-fg-muted">{modelsData.length} models</span>
              <span className="mx-2 hidden h-3 w-px translate-y-px bg-black/10 sm:inline-block dark:bg-white/15" aria-hidden="true" />
              <span className="hidden text-fg-muted sm:inline">Revised {revisedLabel}</span>
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-2.5 text-caption font-sans sm:gap-3 sm:text-caption">
            <Link
              href="/rss.xml"
              className="group inline-flex items-center gap-1 hover:text-accent-ink transition-colors duration-150"
            >
              <Rss size={11} className="text-accent-ink" />
              <span>RSS</span>
            </Link>
            <span className="inline-block h-3 w-px bg-black/10 dark:bg-white/15" aria-hidden="true" />
            <Link
              href="/api/v1/models"
              className="group inline-flex items-center gap-1 hover:text-accent-ink transition-colors duration-150"
            >
              <Code2 size={11} className="text-accent-ink" />
              <span>API</span>
            </Link>
            <span className="inline-block h-3 w-px bg-black/10 dark:bg-white/15" aria-hidden="true" />
            <Link
              href="/docs"
              className="group inline-flex items-center gap-1 hover:text-accent-ink transition-colors duration-150"
            >
              <File size={11} className="text-accent-ink" />
              <span>Docs</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Industrial Header Unit ────────────────────────────────────────── */}
      <header className="page-x pt-5 sm:pt-6 md:pt-8 pb-0">
        <TextWithBlur>
          <div className="flex items-center justify-between gap-3 mb-4 md:mb-6">
            <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
              <HeaderBrand />
            </div>

            {/* Contribute Action & Theme Toggle */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <a
                href="/suggest"
                title="Suggest a model for review"
                className="group inline-flex h-8 cursor-pointer select-none items-center justify-center gap-1 rounded-lg border border-black bg-black px-2.5 text-caption font-sans font-medium text-white shadow-sm transition-[color,background-color,border-color,opacity,transform,box-shadow] duration-150 hover:border-accent hover:bg-accent hover:shadow-md hover:shadow-accent/20 active:scale-[0.97] sm:gap-1.5 sm:px-3 sm:text-small dark:border-white dark:bg-white dark:text-black dark:hover:bg-accent dark:hover:text-white"
              >
                <GitPullRequest
                  size={12}
                  className="opacity-70 group-hover:opacity-100 transition-opacity duration-150"
                />
                <span className="hidden sm:inline">Contribute</span>
                <span className="sm:hidden">Add</span>
                <ArrowUpRight size={11} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-px group-hover:-translate-y-px transition-[color,background-color,border-color,opacity,transform,box-shadow] duration-150" />
              </a>

              <AnimatedThemeToggler
                className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-black/10 bg-white/60 text-fg-muted transition-[color,background-color,border-color,opacity,transform,box-shadow] duration-150 hover:border-black/20 hover:bg-black/5 hover:text-black active:scale-95 dark:border-white/[0.08] dark:bg-white/[0.03] dark:hover:border-white/20 dark:hover:bg-white/[0.06] dark:hover:text-white"
              />
            </div>
          </div>
        </TextWithBlur>

        {/* ── Segmented Navigation Line ──────────────────────────────────── */}
        <div className="mb-4 flex items-center gap-3 overflow-visible border-b border-black/5 pb-3 sm:justify-between sm:gap-4 dark:border-white/[0.07]">
          <TextWithBlur delay={100} className="min-w-0 flex-1 sm:flex-none w-full sm:w-auto max-w-full">
            <HeaderNav />
          </TextWithBlur>

          <HeaderPrompt />
        </div>
      </header>
    </>
  )
}
