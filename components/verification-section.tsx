import Link from "next/link"
import { ExternalLink, ShieldAlert, ShieldCheck, ShieldQuestion, Flag } from "lucide-react"
import type { ModelItem, SourcedField } from "@/data/models"
import { formatDate } from "@/lib/utils"

const STATUS_META = {
  verified: {
    label: "Verified",
    detail: "Core fields read and confirmed against live primary sources.",
    classes: "border-emerald-500/40 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400",
    Icon: ShieldCheck,
  },
  partially_verified: {
    label: "Partially verified",
    detail: "Official sources cited and reachable; full per-field recheck pending.",
    classes: "border-amber-500/40 bg-amber-500/5 text-amber-700 dark:text-amber-400",
    Icon: ShieldAlert,
  },
  unverified: {
    label: "Unverified",
    detail: "No working official source. Treat all figures as unconfirmed.",
    classes: "border-black/15 dark:border-white/15 bg-black/[0.03] dark:bg-white/[0.04] text-black/60 dark:text-zinc-400",
    Icon: ShieldQuestion,
  },
  retired: {
    label: "Retired",
    detail: "Superseded. Kept for reference; do not use for new work.",
    classes: "border-black/15 dark:border-white/15 bg-black/[0.03] dark:bg-white/[0.04] text-black/60 dark:text-zinc-400",
    Icon: Flag,
  },
} as const

const CITED_FIELDS: Array<{ key: SourcedField; label: string }> = [
  { key: "releaseDate", label: "Release date" },
  { key: "contextWindow", label: "Context window" },
  { key: "pricing", label: "Price" },
  { key: "license", label: "Licensing" },
  { key: "benchmarks", label: "Benchmarks" },
]

export function reportIssueUrl(modelId: string) {
  const title = encodeURIComponent(`[CORRECTION]: ${modelId} `)
  return `https://github.com/TirupMehta/ModelRegistry/issues/new?template=data-correction.yml&title=${title}`
}

export default function VerificationSection({ model }: { model: ModelItem }) {
  const meta = STATUS_META[model.verificationStatus]
  const StatusIcon = meta.Icon
  const showBenchmarks =
    model.benchmarks && Object.keys(model.benchmarks).length > 0

  return (
    <section
      aria-label={`Verification for ${model.name}`}
      className="mt-6 sm:mt-8 border border-black/10 dark:border-white/[0.08] rounded-xl p-4 sm:p-5 bg-black/[0.015] dark:bg-black/20"
    >
      <div className="flex flex-wrap items-center gap-2 mb-1.5">
        <span
          className={`inline-flex items-center gap-1.5 text-[11px] font-sans font-medium uppercase tracking-wider px-2 py-1 rounded-md border ${meta.classes}`}
        >
          <StatusIcon size={13} />
          {meta.label}
        </span>
        <span className="text-[11px] font-sans text-black/45 dark:text-zinc-500">
          Last checked {formatDate(model.lastVerifiedAt)}
        </span>
        <Link
          href="/methodology"
          className="ml-auto text-[11px] font-sans font-medium text-[#ff5d2e] hover:underline underline-offset-2"
        >
          How we verify
        </Link>
      </div>
      <p className="text-[11px] font-sans text-black/50 dark:text-zinc-400 leading-relaxed mb-4">
        {meta.detail} Source review by maintainers — not independent lab
        verification.
      </p>

      <h3 className="text-[11px] font-sans font-semibold uppercase tracking-[0.12em] text-black/50 dark:text-zinc-400 mb-2">
        Primary sources
      </h3>
      <ul className="space-y-1.5 mb-4">
        {model.sources.map((s) => (
          <li key={s.url} className="flex items-start gap-2 text-xs font-sans min-w-0">
            <span
              title={s.live ? "Returned HTTP 2xx to automated check" : (s.note ?? "Not re-confirmed")}
              className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${s.live ? "bg-emerald-500" : "bg-amber-500"}`}
            />
            <span className="min-w-0">
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-black/80 dark:text-zinc-200 hover:text-[#ff5d2e] dark:hover:text-[#ff7347] transition-colors break-words"
              >
                <span className="font-medium">{s.title}</span>
                <ExternalLink size={11} className="shrink-0 opacity-50" />
              </a>
              <span className="block text-[11px] text-black/45 dark:text-zinc-500">
                {s.publisher} · {s.sourceType}
                {s.publishedAt ? ` · published ${s.publishedAt}` : ""} · checked{" "}
                {s.accessedAt}
              </span>
              {s.note && (
                <span className="block text-[11px] text-amber-700 dark:text-amber-400">
                  {s.note}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>

      <h3 className="text-[11px] font-sans font-semibold uppercase tracking-[0.12em] text-black/50 dark:text-zinc-400 mb-2">
        What each figure is based on
      </h3>
      <dl className="space-y-1.5 mb-4 text-xs font-sans">
        {CITED_FIELDS.filter(
          ({ key }) => key !== "benchmarks" || showBenchmarks
        ).map(({ key, label }) => {
          const refs = model.fieldSources[key]
          return (
            <div key={key} className="flex items-baseline gap-2 min-w-0">
              <dt className="shrink-0 w-28 text-black/45 dark:text-zinc-500">{label}</dt>
              <dd className="min-w-0">
                {refs && refs.length > 0 ? (
                  <span className="inline-flex flex-wrap gap-x-2 gap-y-0.5">
                    {refs.map((r) => (
                      <a
                        key={r.url}
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={r.note ?? r.title}
                        className="text-black/80 dark:text-zinc-200 hover:text-[#ff5d2e] dark:hover:text-[#ff7347] transition-colors underline decoration-dotted underline-offset-2"
                      >
                        {r.title}
                        {!r.live && " (gated)"}
                      </a>
                    ))}
                  </span>
                ) : (
                  <span className="text-amber-700 dark:text-amber-400">
                    No citation yet — figure carried over, pending recheck.
                  </span>
                )}
              </dd>
            </div>
          )
        })}
      </dl>

      <h3 className="text-[11px] font-sans font-semibold uppercase tracking-[0.12em] text-black/50 dark:text-zinc-400 mb-2">
        Record history
      </h3>
      <ul className="space-y-1.5 mb-4">
        {model.changeLog.map((e, i) => (
          <li key={`${e.date}-${i}`} className="text-xs font-sans text-black/60 dark:text-zinc-400">
            <span className="tabular-nums text-black/45 dark:text-zinc-500">{e.date}</span>
            {" — "}
            {e.summary}
          </li>
        ))}
      </ul>

      <a
        href={reportIssueUrl(model.id)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-[11px] font-sans font-medium text-black/60 dark:text-zinc-400 hover:text-[#ff5d2e] dark:hover:text-[#ff7347] transition-colors border border-black/10 dark:border-white/[0.08] rounded-md px-2.5 py-1.5 hover:border-[#ff5d2e]/50"
      >
        <Flag size={12} />
        Report an error in this record
      </a>
    </section>
  )
}
