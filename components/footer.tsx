import Link from "next/link"
import { modelsData } from "@/data/models"
import FeedbackToggle from "@/components/feedback-toggle"
import { ArrowUpRight } from "lucide-react"

export default function Footer() {
  const currentYear = new Date().getFullYear()
  const newest = [...modelsData].sort((a, b) =>
    b.releaseDate.localeCompare(a.releaseDate)
  )[0]
  const updatedLabel = newest
    ? new Date(`${newest.releaseDate.slice(0, 7)}-02`).toLocaleDateString(
        "en-US",
        { month: "short", year: "numeric" }
      )
    : ""

  const linkClass = "text-black/55 dark:text-zinc-400 hover:text-[#ff5d2e] dark:hover:text-[#ff7347] transition-colors duration-150"

  return (
    <footer className="mt-auto border-t border-black/10 dark:border-white/[0.08] bg-white/45 dark:bg-white/[0.015]">
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 md:px-20 pt-9 sm:pt-11 pb-6">
        <div className="grid grid-cols-1 sm:grid-cols-[1.15fr_1fr_1fr_1fr] gap-x-6 gap-y-8 pb-9">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-display font-semibold tracking-tight text-black dark:text-white hover:text-[#ff5d2e] dark:hover:text-[#ff7347] transition-colors">
              <span className="w-2 h-2 rounded-sm bg-[#ff5d2e]" aria-hidden="true" />
              ModelRegistry
            </Link>
            <p className="mt-2 max-w-48 text-xs leading-relaxed text-black/50 dark:text-zinc-500">
              An open index of AI models, their sources, and release history.
            </p>
          </div>

          <nav aria-label="Explore models" className="flex flex-col items-start gap-2 text-xs">
            <h2 className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-black/35 dark:text-zinc-600">Explore</h2>
            <Link href="/flagships" className={linkClass}>Flagships</Link>
            <Link href="/leaderboard" className={linkClass}>Leaderboard</Link>
            <Link href="/companies" className={linkClass}>Labs</Link>
            <Link href="/timeline" className={linkClass}>Release timeline</Link>
          </nav>

          <nav aria-label="Registry resources" className="flex flex-col items-start gap-2 text-xs">
            <h2 className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-black/35 dark:text-zinc-600">Registry</h2>
            <Link href="/pricing" className={linkClass}>Pricing</Link>
            <Link href="/context" className={linkClass}>Context windows</Link>
            <Link href="/licenses" className={linkClass}>Licenses</Link>
            <Link href="/modalities" className={linkClass}>Modalities</Link>
          </nav>

          <nav aria-label="About and developer resources" className="flex flex-col items-start gap-2 text-xs">
            <h2 className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-black/35 dark:text-zinc-600">About &amp; data</h2>
            <Link href="/methodology" className={linkClass}>Methodology</Link>
            <Link href="/editorial-policy" className={linkClass}>Editorial policy</Link>
            <Link href="/changelog" className={linkClass}>Changelog</Link>
            <Link href="/docs" className={linkClass}>API &amp; docs</Link>
          </nav>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-black/[0.07] dark:border-white/[0.07] pt-4">
          <p className="text-[11px] font-sans tabular-nums text-black/45 dark:text-zinc-500">
            © {currentYear} ModelRegistry <span className="mx-1.5 opacity-40">·</span> {modelsData.length} models{updatedLabel && <> <span className="mx-1.5 opacity-40">·</span> Updated {updatedLabel}</>}
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-medium">
            <Link href="/api/v1/models" className={linkClass}>JSON API</Link>
            <Link href="/rss.xml" className={linkClass}>RSS</Link>
            <Link href="/llms.txt" className={linkClass}>llms.txt</Link>
            <a href="https://github.com/TirupMehta/ModelRegistry" target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1 ${linkClass}`}>
              GitHub <ArrowUpRight size={11} aria-hidden="true" />
            </a>
            <FeedbackToggle />
          </div>
        </div>
      </div>
    </footer>
  )
}
