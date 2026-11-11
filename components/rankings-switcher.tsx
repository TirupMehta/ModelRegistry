import Link from "next/link"

const VIEWS = [
  { href: "/best", label: "Leaders by task" },
  { href: "/score", label: "Standing" },
  { href: "/leaderboard", label: "Compare models" },
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
      className="mb-7 flex flex-wrap items-center gap-1 text-xs font-sans"
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
                ? "rounded-full bg-black px-3 py-1.5 font-medium text-white dark:bg-white dark:text-black"
                : "rounded-full border border-black/10 px-3 py-1.5 text-black/60 transition-colors hover:text-black dark:border-white/15 dark:text-zinc-400 dark:hover:text-white"
            }
          >
            {view.label}
          </Link>
        )
      })}
    </nav>
  )
}
