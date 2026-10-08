"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { selectFeedback } from "@/lib/feedback"

const NAV_ITEMS = [
  { label: "Overview", short: "Overview", href: "/" },
  { label: "Laboratories", short: "Labs", href: "/companies" },
  { label: "Comparison", short: "Compare", href: "/leaderboard" },
  { label: "Changelog", short: "Changes", href: "/timeline" },
] as const

function isLinkActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/"
  return pathname.startsWith(href)
}

export default function HeaderNav() {
  const pathname = usePathname()

  return (
    <nav className="grid w-full grid-cols-4 items-center gap-0.5 p-1 rounded-xl bg-black/[0.03] dark:bg-[#101318] border border-black/10 dark:border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] overflow-visible sm:inline-flex sm:w-auto sm:max-w-full sm:overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {NAV_ITEMS.map(({ label, short, href }) => {
        const active = isLinkActive(pathname, href)
        return (
          <Link
            key={href}
            href={href}
            onClick={() => {
              selectFeedback()
            }}
            aria-current={active ? "page" : undefined}
            className={[
              "group relative inline-flex min-w-0 flex-1 sm:flex-none items-center justify-center gap-1.5 sm:gap-2 py-1.5 px-1 sm:px-3 rounded-lg text-[11px] sm:text-[13px] font-sans tracking-tight select-none cursor-pointer whitespace-nowrap transition-all duration-150 ease-out",
              active
                ? "bg-white dark:bg-[#1e222a] text-black dark:text-white font-medium shadow-sm ring-1 ring-black/10 dark:ring-white/10"
                : "text-black/55 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.05]",
            ].join(" ")}
          >
            {active ? (
              <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-[#ff5d2e] shadow-[0_0_6px_rgba(255,93,46,0.8)] shrink-0" />
            ) : (
              <span className="hidden sm:block w-1.5 h-1.5 rounded-full bg-black/10 dark:bg-white/10 group-hover:bg-black/25 dark:group-hover:bg-white/25 transition-colors shrink-0" />
            )}
            <span className="truncate sm:hidden">{short}</span>
            <span className="hidden sm:inline">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
