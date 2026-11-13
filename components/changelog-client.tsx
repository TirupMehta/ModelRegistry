"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { companies } from "@/data/companies"
import Select from "@/components/select"
import { Rss, RotateCcw } from "lucide-react"

export interface ChangelogEntry {
  date: string
  summary: string
  modelId: string
  modelName: string
  companyId: string
  companyName: string
}

const LAST_VISIT_KEY = "modelregistry.changelog.lastVisit"

type Period = "all" | "7" | "30" | "visit"

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10)

export default function ChangelogClient({ entries }: { entries: ChangelogEntry[] }) {
  const [lab, setLab] = useState("all")
  const [period, setPeriod] = useState<Period>("all")
  const [lastVisit, setLastVisit] = useState<string | null>(null)

  useEffect(() => {
    try {
      const previous = window.localStorage.getItem(LAST_VISIT_KEY)
      setLastVisit(previous)
      window.localStorage.setItem(LAST_VISIT_KEY, new Date().toISOString().slice(0, 10))
    } catch {
      setLastVisit(null)
    }
  }, [])

  const since = period === "7" ? daysAgo(7) : period === "30" ? daysAgo(30) : period === "visit" && lastVisit ? lastVisit : ""
  const visible = useMemo(
    () => entries.filter((entry) => (lab === "all" || entry.companyId === lab) && (!since || entry.date >= since)),
    [entries, lab, since],
  )
  const filtered = lab !== "all" || period !== "all"

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <Select
          id="changelog-lab"
          label="Lab"
          value={lab}
          onChange={setLab}
          className="w-48"
          options={[["all", "All labs"], ...Object.values(companies).map((company): [string, string] => [company.id, company.name])]}
        />
        <Select
          id="changelog-period"
          label="Period"
          value={period}
          onChange={(value) => setPeriod(value as Period)}
          className="w-56"
          options={[
            ["all", "All time"],
            ["7", "Last 7 days"],
            ["30", "Last 30 days"],
            ...(lastVisit ? ([["visit", `Since my last visit (${lastVisit})`]] as [string, string][]) : []),
          ]}
        />
        {filtered && (
          <button
            type="button"
            onClick={() => {
              setLab("all")
              setPeriod("all")
            }}
            className="inline-flex min-h-9 items-center gap-1 text-small text-accent-ink underline-offset-4 hover:underline"
          >
            <RotateCcw size={12} aria-hidden="true" /> Clear
          </button>
        )}
        <div className="ml-auto flex items-center gap-4 pb-2 text-small">
          <a href="/rss.xml" className="inline-flex items-center gap-1 text-fg-muted hover:text-accent-ink">
            <Rss size={13} aria-hidden="true" /> RSS
          </a>
          <a href="/feed.json" className="text-fg-muted hover:text-accent-ink">
            JSON Feed
          </a>
        </div>
      </div>

      <p className="mb-3 text-small tabular-nums text-fg-muted" aria-live="polite">
        {visible.length === entries.length ? `${entries.length} changes` : `${visible.length} of ${entries.length} changes`}
      </p>
      <ol className="border-t border-black/10 dark:border-white/[0.08]">
        {visible.map((entry, index) => (
          <li
            key={`${entry.date}-${entry.modelId}-${index}`}
            className="flex flex-col gap-1 border-b border-black/10 py-4 sm:flex-row sm:items-baseline sm:gap-5 dark:border-white/[0.08]"
          >
            <time dateTime={entry.date} className="shrink-0 text-small tabular-nums text-fg-muted sm:w-24">
              {entry.date}
            </time>
            <div className="min-w-0">
              <Link href={`/models/${entry.modelId}`} className="font-display text-title font-semibold tracking-tight text-fg-strong transition-colors hover:text-accent-ink">
                {entry.modelName}
              </Link>
              <span className="ml-2 text-small text-fg-muted">{entry.companyName}</span>
              <p className="mt-1 text-body leading-6 text-fg">{entry.summary}</p>
            </div>
          </li>
        ))}
      </ol>
      {visible.length === 0 && (
        <p className="py-12 text-center text-body text-fg-muted">No changes match. Try a longer period or clear the filter.</p>
      )}
    </>
  )
}
