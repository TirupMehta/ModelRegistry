import { ExternalLink } from "lucide-react"
import type { ModelItem } from "@/data/models"
import { huggingfaceSnapshot } from "@/data/huggingface"

/**
 * Open-weight facts verified against the public Hub API.
 *
 * Rendered only when the repository was verified, and each row only when the
 * value exists: a model with no measured downloads shows no downloads row rather
 * than a zero, and a repository with no recognizable licence shows no licence row.
 * That is why this is a server component with its own guard instead of another
 * entry in the client spec table.
 */
export default function ModelOpenWeights({ model }: { model: ModelItem }) {
  const hub = huggingfaceSnapshot.records[model.id]
  if (!hub) return null

  const rows: { label: string; value: React.ReactNode }[] = []
  rows.push({
    label: "Repository",
    value: (
      <a
        href={`https://huggingface.co/${hub.repo}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-accent-ink underline-offset-2 hover:underline"
      >
        {hub.repo}
        <ExternalLink size={11} aria-hidden="true" />
      </a>
    ),
  })
  if (typeof hub.downloads === "number") {
    rows.push({
      label: "Downloads, 30 days",
      value: <span className="tabular-nums">{hub.downloads.toLocaleString("en-US")}</span>,
    })
  }
  if (hub.licenseSpdx) {
    rows.push({ label: "Repository licence", value: <span>{hub.licenseSpdx}</span> })
  }
  if (hub.gated) {
    rows.push({ label: "Access", value: <span>Gated on the Hub</span> })
  }

  return (
    <section className="mb-8">
      <h2 className="text-heading font-display font-semibold tracking-tight text-fg-strong mb-1">
        Open weights
      </h2>
      <p className="mb-3 max-w-[68ch] text-small text-fg-muted">
        Verified against the public Hugging Face Hub API on {huggingfaceSnapshot.retrievedAt}. Downloads are the
        Hub&apos;s own 30-day counter, not a registry measurement.
      </p>
      <dl className="max-w-[68ch] border-t border-black/[0.08] dark:border-white/10">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-black/[0.08] py-2 text-body dark:border-white/10"
          >
            <dt className="text-small text-fg-muted">{row.label}</dt>
            <dd className="font-medium text-fg-strong">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
