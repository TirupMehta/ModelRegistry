import Link from "next/link"
import { buildBestAnswers } from "@/lib/best"

/**
 * The three questions most visitors arrive with, answered on the first screen.
 * Server-rendered from the same data as /best, so the two can never disagree.
 */
const WANTED: { id: string; label: string }[] = [
  { id: "independent::intelligenceIndex", label: "Highest overall" },
  { id: "independent::frontierCode", label: "Best for coding" },
  { id: "value", label: "Best for the money" },
]

export default function QuickAnswers() {
  const answers = buildBestAnswers()
  const items = WANTED.map((want) => {
    const answer = answers.find((candidate) => candidate.id === want.id)
    const entry = answer?.entries[0]
    return answer && entry ? { ...want, model: entry.model, value: entry.value } : null
  }).filter((item): item is NonNullable<typeof item> => item !== null)

  if (items.length === 0) return null

  return (
    <div className="mt-5">
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={`/models/${item.model.id}`}
              className="block rounded-xl border border-black/10 p-3 transition-colors hover:border-black/25 dark:border-white/[0.08] dark:hover:border-white/25"
            >
              <span className="block text-small font-sans text-fg-muted">{item.label}</span>
              <span className="mt-0.5 block text-body font-medium tracking-tight text-black dark:text-white">
                {item.model.name}
              </span>
              <span className="block text-small font-sans tabular-nums text-fg-muted">
                {item.value}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-small font-sans text-fg-muted">
        Independent results, one test at a time.{" "}
        <Link href="/best" className="text-accent-ink underline-offset-4 hover:underline">
          See the leader for every task
        </Link>
      </p>
    </div>
  )
}
