"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { selectFeedback } from "@/lib/feedback"

const NAV_ITEMS = [
  { label: "Overview", short: "Overview", href: "/" },
  { label: "Laboratories", short: "Labs", href: "/companies" },
  { label: "Comparison", short: "Compare", href: "/leaderboard" },
  { label: "Best by task", short: "Best", href: "/best" },
  { label: "Standing", short: "Ranking", href: "/score" },
  { label: "Release timeline", short: "Timeline", href: "/timeline" },
] as const

function isLinkActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/"
  return pathname.startsWith(href)
}

// Plain links, not a second segmented control. The homepage already has a
// filter track; two pill rows stacked in one screen was the dashboard tell.
export default function HeaderNav() {
  const pathname = usePathname()

  return (
    <nav className="flex w-full items-center gap-4 overflow-x-auto sm:w-auto sm:gap-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
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
              "relative shrink-0 whitespace-nowrap py-1.5 text-[13px] font-sans select-none transition-colors duration-150",
              active
                ? "font-medium text-black dark:text-white"
                : "text-black/55 dark:text-zinc-400 hover:text-black dark:hover:text-white",
            ].join(" ")}
          >
            <span className="truncate sm:hidden">{short}</span>
            <span className="hidden sm:inline">{label}</span>
            {active && (
              <span className="absolute inset-x-0 -bottom-0.5 h-0.5 rounded-full bg-accent" aria-hidden="true" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
