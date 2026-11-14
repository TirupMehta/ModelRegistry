import Link from "next/link"

const VIEWS = [
  { href: "/best", label: "Best by task" },
  { href: "/score", label: "Overall ranking" },
] as const

/**
 * One switcher for every ranking view. The header carries a single "Rankings"
 * entry; this is where the views are chosen, so adding another view does not add
 * another header button.
 */
export default function RankingsSwitcher({ current }: { current: (typeof VIEWS)[number]["href"] }) {
  return (
    <nav
      aria-label="Ranking views"
      className="mb-7 flex flex-wrap items-center gap-1 text-small font-sans"
    >
      {VIEWS.map((view) => {
        const active = view.href === current
        return (
          <Link
            key={view.href}
            href={view.href}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "ink-solid inline-flex min-h-9 items-center rounded-full px-3.5 font-medium"
                : "inline-flex min-h-9 items-center rounded-full border border-black/10 px-3.5 text-fg-muted transition-colors hover:text-black dark:border-white/15 dark:hover:text-white"
            }
          >
            {view.label}
          </Link>
        )
      })}
    </nav>
  )
}
