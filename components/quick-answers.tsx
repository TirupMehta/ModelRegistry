import Link from "next/link"
import { buildBestAnswers } from "@/lib/best"

/**
 * The three questions most visitors arrive with, answered on the first screen.
 * Server-rendered from the same data as /best, so the two can never disagree.
 */
const WANTED: { id: string; label: string; metric: string }[] = [
  { id: "independent::intelligenceIndex", label: "Highest overall", metric: "Intelligence Index" },
  { id: "independent::frontierCode", label: "Best for coding", metric: "FrontierCode" },
  { id: "value", label: "Best for the money", metric: "" },
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
    <div className="mt-8">
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={`/models/${item.model.id}`}
              className="group grid h-full grid-cols-[1fr_auto] items-end gap-x-3 rounded-xl border border-black/10 bg-[var(--surface-raised)] px-4 py-3.5 transition-colors hover:border-black/25 dark:border-white/[0.08] dark:hover:border-white/25"
            >
              <span className="min-w-0">
                <span className="block text-small text-fg-muted">{item.label}</span>
                <span className="mt-1 block truncate text-title font-semibold tracking-tight text-fg-strong transition-colors group-hover:text-accent-ink">
                  {item.model.name}
                </span>
              </span>
              <span className="text-right text-small tabular-nums text-fg sm:col-span-2 sm:mt-0.5 sm:text-left">
                {item.metric ? `${item.metric} ${item.value}` : item.value}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-small text-fg-muted">
        From independent test results.{" "}
        <Link href="/best" className="text-accent-ink underline-offset-4 hover:underline">
          Leaders for every task
        </Link>
      </p>
    </div>
  )
}
