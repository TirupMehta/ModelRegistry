import Link from "next/link"
import { modelsData } from "@/data/models"
import { datasetRevision } from "@/data/revision"
import { formatDate } from "@/lib/utils"
import FeedbackToggle from "@/components/feedback-toggle"
import { ArrowUpRight } from "lucide-react"

export default function Footer() {
  const currentYear = new Date().getFullYear()
  const revisedLabel = formatDate(datasetRevision.revisedAt)

  const linkClass = "text-black/55 dark:text-zinc-400 hover:text-[#ff5d2e] dark:hover:text-[#ff7347] transition-colors duration-150"

  return (
    <footer className="mt-auto border-t border-black/10 dark:border-white/[0.08] bg-white/45 dark:bg-white/[0.015]">
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 md:px-20 pt-8 sm:pt-11 pb-6">
        <div className="flex flex-col sm:grid sm:grid-cols-[1.15fr_1fr_1fr_1fr] sm:items-start sm:gap-x-6 sm:gap-y-8 pb-6 sm:pb-9 text-left">
          <div className="border-b border-black/[0.07] pb-5 dark:border-white/[0.07] sm:border-0 sm:pb-0">
            <Link href="/" className="inline-flex items-center gap-2 text-base sm:text-sm font-display font-semibold tracking-tight text-black dark:text-white hover:text-[#ff5d2e] dark:hover:text-[#ff7347] transition-colors">
              <span className="w-2 h-2 rounded-sm bg-[#ff5d2e]" aria-hidden="true" />
              ModelRegistry
            </Link>
            <p className="mt-2 max-w-64 text-xs leading-relaxed text-black/50 dark:text-zinc-500 sm:max-w-48">
              An open index of AI models, their sources, and release history.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-6 pt-5 sm:contents">
            <nav aria-label="Explore models" className="flex flex-col items-start gap-2 text-xs">
              <h2 className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-black/35 dark:text-zinc-600">Explore</h2>
              <Link href="/flagships" className={linkClass}>Flagships</Link>
              <Link href="/leaderboard" className={linkClass}>Leaderboard</Link>
              <Link href="/companies" className={linkClass}>Labs</Link>
              <Link href="/timeline" className={linkClass}>Release timeline</Link>
              <Link href="/alerts" className={linkClass}>Model Alerts</Link>
              <Link href="/suggest" className={linkClass}>Suggest a model</Link>
            </nav>

            <nav aria-label="Registry resources" className="flex flex-col items-start gap-2 text-xs">
              <h2 className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-black/35 dark:text-zinc-600">Registry</h2>
              <Link href="/pricing" className={linkClass}>Pricing</Link>
              <Link href="/context" className={linkClass}>Context windows</Link>
              <Link href="/licenses" className={linkClass}>Licenses</Link>
              <Link href="/modalities" className={linkClass}>Modalities</Link>
              <Link href="/retired" className={linkClass}>Retired models</Link>
            </nav>

            <nav aria-label="About and developer resources" className="flex flex-col items-start gap-2 text-xs">
              <h2 className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-black/35 dark:text-zinc-600">About &amp; data</h2>
              <Link href="/methodology" className={linkClass}>Methodology</Link>
              <Link href="/about" className={linkClass}>About</Link>
              <Link href="/contact" className={linkClass}>Contact</Link>
              <Link href="/privacy" className={linkClass}>Privacy</Link>
              <Link href="/editorial-policy" className={linkClass}>Editorial policy</Link>
              <Link href="/changelog" className={linkClass}>Changelog</Link>
              <Link href="/docs" className={linkClass}>API &amp; docs</Link>
              <Link href="/cli" className={linkClass}>CLI</Link>
            </nav>

            {/* Mobile only: fills the second row of the link grid and keeps
                the machine-readable endpoints out of the bottom bar, which
                was five vertically stacked links on narrow screens. */}
            <nav aria-label="Data and source endpoints" className="flex flex-col items-start gap-2 text-xs sm:hidden">
              <h2 className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-black/35 dark:text-zinc-600">Data</h2>
              <Link href="/api/v1/models" className={linkClass}>JSON API</Link>
              <Link href="/rss.xml" className={linkClass}>RSS</Link>
              <Link href="/llms.txt" className={linkClass}>llms.txt</Link>
              <a href="https://github.com/TirupMehta/ModelRegistry" target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1 ${linkClass}`}>
                GitHub <ArrowUpRight size={11} aria-hidden="true" />
              </a>
            </nav>
          </div>
        </div>

        <div className="flex flex-row items-center justify-between gap-3 border-t border-black/[0.07] dark:border-white/[0.07] pt-4 text-left">
          <p className="text-[11px] font-sans tabular-nums text-black/45 dark:text-zinc-500">
            © {currentYear} ModelRegistry <span className="mx-1.5 opacity-40">·</span> {modelsData.length} models <span className="mx-1.5 opacity-40">·</span> Dataset revised {revisedLabel}
          </p>
          <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 text-[11px] font-medium sm:gap-x-4">
            <Link href="/api/v1/models" className={`hidden sm:inline ${linkClass}`}>JSON API</Link>
            <Link href="/rss.xml" className={`hidden sm:inline ${linkClass}`}>RSS</Link>
            <Link href="/llms.txt" className={`hidden sm:inline ${linkClass}`}>llms.txt</Link>
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
