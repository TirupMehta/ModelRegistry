/* eslint-disable @next/next/no-html-link-for-pages */
import Link from "next/link"
import { modelsData } from "@/data/models"
import { datasetRevision } from "@/data/revision"
import { formatDate } from "@/lib/utils"
import FeedbackToggle from "@/components/feedback-toggle"
import { ArrowUpRight } from "lucide-react"

export default function Footer() {
  const currentYear = new Date().getFullYear()
  const revisedLabel = formatDate(datasetRevision.revisedAt)

  const linkClass = "text-black/55 dark:text-zinc-400 hover:text-accent-ink transition-colors duration-150"

  return (
    <footer className="mt-auto border-t border-black/10 dark:border-white/[0.08] bg-white/45 dark:bg-white/[0.015]">
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 md:px-20 pt-8 sm:pt-11 pb-6">
        <div className="flex flex-col sm:grid sm:grid-cols-[1.6fr_1fr_1fr_1fr] sm:items-start sm:gap-x-6 sm:gap-y-8 pb-6 sm:pb-9 text-left lg:grid-cols-[1.95fr_1fr_1fr_1fr]">
          <div className="border-b border-black/[0.07] pb-5 dark:border-white/[0.07] sm:border-0 sm:pb-0">
            <Link href="/" className="inline-flex items-center gap-1.5 text-xl sm:text-lg font-display font-semibold tracking-tight text-black dark:text-white transition-colors">
              <svg viewBox="7 7 18 18" width={22} height={22} aria-hidden="true" className="shrink-0 text-black dark:text-white">
                <rect x="7" y="7" width="8.5" height="8.5" rx="2.2" fill="currentColor" />
                <rect x="16.5" y="7" width="8.5" height="8.5" rx="2.2" fill="currentColor" fillOpacity="0.45" />
                <rect x="7" y="16.5" width="8.5" height="8.5" rx="2.2" fill="currentColor" fillOpacity="0.45" />
                <rect x="16.5" y="16.5" width="8.5" height="8.5" rx="2.2" fill="rgb(var(--accent-rgb))" />
              </svg>
              <span>Model<span className="font-bold text-accent-ink">Registry</span></span>
            </Link>
            <p className="mt-2 max-w-64 text-xs leading-relaxed text-black/50 dark:text-zinc-500 sm:max-w-48">
              An open index of AI models, their sources, and release history.
            </p>
            <p className="mt-2 flex flex-wrap items-center gap-x-2 text-[11px] font-sans tabular-nums text-black/45 dark:text-zinc-500">
              <span>{modelsData.length} models</span>
              <span className="h-3 w-px bg-black/10 dark:bg-white/15" aria-hidden="true" />
              <span>Dataset revised {revisedLabel}</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-6 pt-5 sm:contents">
            <nav aria-label="Explore models" className="flex flex-col items-start gap-2 text-xs">
              <h2 className="mb-1 text-[11px] font-medium text-black/50 dark:text-zinc-500">Explore</h2>
              <Link href="/flagships" className={linkClass}>Flagships</Link>
              <Link href="/leaderboard" className={linkClass}>Leaderboard</Link>
              <Link href="/score" className={linkClass}>Leaderboards</Link>
              <Link href="/compare" className={linkClass}>Comparisons</Link>
              <Link href="/companies" className={linkClass}>Labs</Link>
              <Link href="/timeline" className={linkClass}>Release timeline</Link>
              <Link href="/alerts" className={linkClass}>Model Alerts</Link>
              <Link href="/suggest" className={linkClass}>Suggest a model</Link>
            </nav>

            <nav aria-label="Registry resources" className="flex flex-col items-start gap-2 text-xs">
              <h2 className="mb-1 text-[11px] font-medium text-black/50 dark:text-zinc-500">Registry</h2>
              <Link href="/pricing" className={linkClass}>Pricing</Link>
              <Link href="/context" className={linkClass}>Context windows</Link>
              <Link href="/licenses" className={linkClass}>Licenses</Link>
              <Link href="/modalities" className={linkClass}>Modalities</Link>
              <Link href="/retired" className={linkClass}>Retired models</Link>
            </nav>

            <nav aria-label="About and developer resources" className="flex flex-col items-start gap-2 text-xs">
              <h2 className="mb-1 text-[11px] font-medium text-black/50 dark:text-zinc-500">About and data</h2>
              <Link href="/methodology" className={linkClass}>Methodology</Link>
              <Link href="/trust" className={linkClass}>Trust &amp; scope</Link>
              <Link href="/about" className={linkClass}>About</Link>
              <Link href="/contact" className={linkClass}>Contact</Link>
              <Link href="/privacy" className={linkClass}>Privacy</Link>
              <Link href="/editorial-policy" className={linkClass}>Editorial policy</Link>
              <Link href="/changelog" className={linkClass}>Changelog</Link>
              <Link href="/docs" className={linkClass}>API &amp; docs</Link>
            </nav>

            {/* Mobile only: fills the second row of the link grid and keeps
                the machine-readable endpoints out of the bottom bar, which
                was five vertically stacked links on narrow screens. */}
            <nav aria-label="Data and source endpoints" className="flex flex-col items-start gap-2 text-xs sm:hidden">
              <h2 className="mb-1 text-[11px] font-medium text-black/50 dark:text-zinc-500">Data</h2>
              <a href="/api/v1/models" className={linkClass}>JSON API</a>
              <a href="/rss.xml" className={linkClass}>RSS</a>
              <a href="/llms.txt" className={linkClass}>llms.txt</a>
              <Link href="/open-source" className={linkClass}>Open source</Link>
              <a href="https://github.com/TirupMehta/ModelRegistry" target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1 ${linkClass}`}>
                GitHub <ArrowUpRight size={11} aria-hidden="true" />
              </a>
            </nav>
          </div>
        </div>

        <div className="flex flex-row items-center justify-between gap-3 border-t border-black/[0.07] dark:border-white/[0.07] pt-4 text-left">
          <p className="text-[11px] font-sans tabular-nums text-black/45 dark:text-zinc-500">
            © {currentYear} ModelRegistry
          </p>
          <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 text-[11px] font-medium sm:gap-x-4">
            <a href="/api/v1/models" className={`hidden sm:inline ${linkClass}`}>JSON API</a>
            <a href="/rss.xml" className={`hidden sm:inline ${linkClass}`}>RSS</a>
            <a href="/llms.txt" className={`hidden sm:inline ${linkClass}`}>llms.txt</a>
            <Link href="/open-source" className={`hidden sm:inline ${linkClass}`}>Open source</Link>
            <a href="https://github.com/TirupMehta/ModelRegistry" target="_blank" rel="noopener noreferrer" className={`hidden sm:inline-flex items-center gap-1 ${linkClass}`}>
              GitHub <ArrowUpRight size={11} aria-hidden="true" />
            </a>
            <FeedbackToggle />
          </div>
        </div>
      </div>
    </footer>
  )
}
