import Link from "next/link"
import { modelsData } from "@/data/models"
import FeedbackToggle from "@/components/feedback-toggle"

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

  return (
    <footer className="border-t border-black/10 dark:border-white/[0.08] max-w-4xl mx-auto w-full px-4 sm:px-6 md:px-20 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-sans font-medium text-black dark:text-white">
            © {currentYear} ModelRegistry
          </p>
          <p className="mt-0.5 text-[11px] font-sans tabular-nums text-black/45 dark:text-zinc-500">
            The open technical index · {modelsData.length} models{updatedLabel ? ` · Updated ${updatedLabel}` : ""}
          </p>
        </div>

        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-sans font-medium text-black/50 dark:text-zinc-400">
          <Link href="/api/v1/models" className="hover:text-[#ff5d2e] transition-colors">
            API
          </Link>
          <Link href="/rss.xml" className="hover:text-[#ff5d2e] transition-colors">
            RSS
          </Link>
          <Link href="/llms.txt" className="hover:text-[#ff5d2e] transition-colors">
            llms.txt
          </Link>
          <Link href="/docs" className="hover:text-[#ff5d2e] transition-colors">
            Docs
          </Link>
          <a
            href="https://github.com/TirupMehta/ModelRegistry"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#ff5d2e] transition-colors"
          >
            GitHub
          </a>
          <span className="hidden sm:inline opacity-20 select-none">/</span>
          <FeedbackToggle />
        </nav>
      </div>
    </footer>
  )
}
