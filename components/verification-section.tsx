import { ExternalLink } from "lucide-react"
import type { ModelItem, SourcedField } from "@/data/models"
import { formatDate } from "@/lib/utils"

export const fieldLabels: Record<SourcedField, string> = {
  releaseDate: "Release date",
  contextWindow: "Context window",
  maxOutputTokens: "Maximum output",
  parameters: "Architecture",
  license: "License",
  pricing: "Pricing",
  modalities: "Modalities",
  benchmarks: "Benchmarks",
  isCompanyFlagship: "Flagship status",
  isLatestCheckpoint: "Latest release status",
}

export function reportIssueUrl(modelId: string) {
  const title = encodeURIComponent(`[CORRECTION]: ${modelId} `)
  return `https://github.com/TirupMehta/ModelRegistry/issues/new?template=data-correction.yml&title=${title}`
}

export default function VerificationSection({ model }: { model: ModelItem }) {
  const fieldSources = Object.entries(model.fieldSources ?? {}).flatMap(([field, refs]) =>
    (refs ?? []).map((source) => ({ field: field as SourcedField, source }))
  )
  const sourcedFieldCount = new Set(fieldSources.map(({ field }) => field)).size
  const isRetired = model.verificationStatus === "retired"

  return (
    <section
      aria-label={`Sources for ${model.name}`}
      className="mt-6 sm:mt-8 rule-t pt-4"
    >
      <h3 className="mb-2 text-body font-medium text-fg">
        Sources and verification
      </h3>
      <p className="text-small font-sans text-fg leading-5 mb-3">
        <strong className="font-semibold text-black dark:text-white">
          {isRetired ? "Retired record" : `${model.sources.length} primary source${model.sources.length === 1 ? "" : "s"} cited`}
        </strong>
        <span className="text-fg-muted">
          {" "}
          {isRetired
            ? "Kept for release history; provider availability may have changed."
            : "Per-field citations below; figures are lab-reported unless a cited source states otherwise."}
        </span>
        <span className="block text-fg-muted">
          Last checked {formatDate(model.lastVerifiedAt)}. This is a source review date, not a live availability check.
        </span>
      </p>
      {fieldSources.length > 0 && (
        <details className="mb-3 text-small font-sans">
          <summary className="w-fit cursor-pointer text-fg-muted hover:text-accent-ink">
            Sources by detail, {sourcedFieldCount} fields
          </summary>
          <ul className="mt-2 space-y-1.5">
            {fieldSources.map(({ field, source }) => (
              <li key={`${field}-${source.url}`} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="font-medium text-fg">{fieldLabels[field]}</span>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-fg-muted hover:text-accent-ink underline underline-offset-2"
                >
                  {source.title}
                </a>
                <span className="text-fg-muted">checked {formatDate(source.accessedAt)}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
      <ul className="space-y-1.5 mb-3">
        {model.sources.map((s) => (
          <li key={s.url} className="text-small font-sans min-w-0">
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-fg hover:text-accent-ink transition-colors break-words"
            >
              <span className="font-medium">{s.title}</span>
              <ExternalLink size={11} className="shrink-0 opacity-50" />
            </a>
            <span className="text-fg-muted">, {s.publisher}, checked {formatDate(s.accessedAt)}</span>
          </li>
        ))}
      </ul>
      <a
        href={reportIssueUrl(model.id)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-caption font-sans text-fg-muted hover:text-accent-ink transition-colors"
      >
        Report an error in this record
      </a>
    </section>
  )
}
