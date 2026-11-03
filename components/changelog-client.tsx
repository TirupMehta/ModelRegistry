"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { companies } from "@/data/companies"
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
const controlClass = "rounded-lg border border-black/10 dark:border-white/[0.1] bg-white dark:bg-[#0d0f13] px-2.5 py-2 text-xs text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-[#ff5d2e]/20"

export default function ChangelogClient({ entries }: { entries: ChangelogEntry[] }) {
  const [lab, setLab] = useState("all")
  const [from, setFrom] = useState("")
  const [until, setUntil] = useState("")
  const [sinceLastVisit, setSinceLastVisit] = useState(false)
  const [lastVisit, setLastVisit] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const previous = window.localStorage.getItem(LAST_VISIT_KEY)
      setLastVisit(previous)
      window.localStorage.setItem(LAST_VISIT_KEY, new Date().toISOString().slice(0, 10))
    } catch {
      setLastVisit(null)
    }
    setReady(true)
  }, [])

  const visible = useMemo(() => entries.filter((entry) =>
    (lab === "all" || entry.companyId === lab) &&
    (!from || entry.date >= from) && (!until || entry.date <= until) &&
    (!sinceLastVisit || !lastVisit || entry.date >= lastVisit)
  ), [entries, lab, from, until, sinceLastVisit, lastVisit])

  const reset = () => { setLab("all"); setFrom(""); setUntil(""); setSinceLastVisit(false) }

  return <>
    <div className="mb-5 flex flex-wrap items-end gap-2.5 rounded-xl border border-black/10 dark:border-white/[0.08] bg-white/50 dark:bg-white/[0.02] p-3">
      <label className="grid gap-1 text-[10px] text-black/50 dark:text-zinc-400">Lab
        <select className={controlClass} value={lab} onChange={(e) => setLab(e.target.value)}>
          <option value="all">All labs</option>
          {Object.values(companies).map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-[10px] text-black/50 dark:text-zinc-400">From
        <input className={controlClass} type="date" value={from} max={until || undefined} onChange={(e) => setFrom(e.target.value)} />
      </label>
      <label className="grid gap-1 text-[10px] text-black/50 dark:text-zinc-400">Through
        <input className={controlClass} type="date" value={until} min={from || undefined} onChange={(e) => setUntil(e.target.value)} />
      </label>
      <label className={`inline-flex min-h-9 items-center gap-2 rounded-lg px-2 text-xs ${!ready || !lastVisit ? "text-black/35 dark:text-zinc-600" : "text-black/70 dark:text-zinc-300"}`}>
        <input type="checkbox" checked={sinceLastVisit} disabled={!ready || !lastVisit} onChange={(e) => setSinceLastVisit(e.target.checked)} className="accent-[#ff5d2e]" />
        Since my last visit{lastVisit ? ` (${lastVisit})` : ""}
      </label>
      <button type="button" onClick={reset} className="inline-flex min-h-9 items-center gap-1 text-xs text-[#ff5d2e] hover:underline"><RotateCcw size={12} /> Clear</button>
      <div className="ml-auto flex items-center gap-3 text-xs">
        <a href="/rss.xml" className="inline-flex items-center gap-1 text-black/55 dark:text-zinc-400 hover:text-[#ff5d2e]"><Rss size={13} /> RSS</a>
        <a href="/feed.json" className="text-black/55 dark:text-zinc-400 hover:text-[#ff5d2e]">JSON Feed</a>
      </div>
    </div>
    <p className="mb-3 text-[11px] tabular-nums text-black/45 dark:text-zinc-500" aria-live="polite">Showing {visible.length} of {entries.length} changes</p>
    <ol className="border-t border-black/10 dark:border-white/[0.08]">
      {visible.map((entry, index) => <li key={`${entry.date}-${entry.modelId}-${index}`} className="flex flex-col gap-1 border-b border-black/10 dark:border-white/[0.08] py-3 text-sm sm:flex-row sm:items-baseline sm:gap-3">
        <time dateTime={entry.date} className="shrink-0 text-xs tabular-nums text-black/45 dark:text-zinc-500 sm:w-24">{entry.date}</time>
        <div className="min-w-0">
          <Link href={`/models/${entry.modelId}`} className="font-medium tracking-tight text-black dark:text-white hover:text-[#ff5d2e] dark:hover:text-[#ff7347] transition-colors">{entry.modelName}</Link>
          <span className="ml-2 text-[11px] text-black/40 dark:text-zinc-500">{entry.companyName}</span>
          <p className="text-[13px] leading-relaxed text-black/60 dark:text-zinc-400">{entry.summary}</p>
        </div>
      </li>)}
    </ol>
    {visible.length === 0 && <p className="py-12 text-center text-sm text-black/55 dark:text-zinc-400">No changes match these filters. Try widening the date range or clearing a filter.</p>}
  </>
}
