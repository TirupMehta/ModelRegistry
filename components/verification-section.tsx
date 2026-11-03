import { ExternalLink } from "lucide-react"
import type { ModelItem, SourcedField } from "@/data/models"
import { formatDate } from "@/lib/utils"

const verificationCopy: Record<ModelItem["verificationStatus"], { label: string; detail: string }> = {
  verified: {
    label: "Verified",
    detail: "Core details were checked against primary sources.",
  },
  partially_verified: {
    label: "Partially verified",
    detail: "Some details still need a full source recheck.",
  },
  unverified: {
    label: "Unverified",
    detail: "Treat these details as unconfirmed until sources are checked.",
  },
  retired: {
    label: "Retired record",
    detail: "Kept for release history; provider availability may have changed.",
  },
}

const fieldLabels: Record<SourcedField, string> = {
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
  const verification = verificationCopy[model.verificationStatus]
  const fieldSources = Object.entries(model.fieldSources ?? {}).flatMap(([field, refs]) =>
    (refs ?? []).map((source) => ({ field: field as SourcedField, source }))
  )
  const sourcedFieldCount = new Set(fieldSources.map(({ field }) => field)).size

  return (
    <section
      aria-label={`Sources for ${model.name}`}
      className="mt-6 sm:mt-8 border-t border-black/10 dark:border-white/[0.08] pt-4"
    >
      <h3 className="text-[11px] font-sans font-semibold uppercase tracking-[0.12em] text-black/50 dark:text-zinc-400 mb-2">
        Sources &amp; verification
      </h3>
      <p className="text-xs font-sans text-black/70 dark:text-zinc-300 leading-5 mb-3">
        <strong className="font-semibold text-black dark:text-white">{verification.label}</strong>
        <span> · {verification.detail}</span>
        <span className="block text-black/50 dark:text-zinc-400">
          Last checked {formatDate(model.lastVerifiedAt)}. This is a source review date, not a live availability check.
        </span>
      </p>
      {fieldSources.length > 0 && (
        <details className="mb-3 text-xs font-sans">
          <summary className="w-fit cursor-pointer text-black/60 dark:text-zinc-400 hover:text-[#ff5d2e] dark:hover:text-[#ff7347]">
            Sources by detail · {sourcedFieldCount} fields
          </summary>
          <ul className="mt-2 space-y-1.5">
            {fieldSources.map(({ field, source }) => (
              <li key={`${field}-${source.url}`} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="font-medium text-black/75 dark:text-zinc-300">{fieldLabels[field]}</span>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-black/60 dark:text-zinc-400 hover:text-[#ff5d2e] dark:hover:text-[#ff7347] underline underline-offset-2"
                >
                  {source.title}
                </a>
                <span className="text-black/45 dark:text-zinc-500">checked {formatDate(source.accessedAt)}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
      <ul className="space-y-1.5 mb-3">
        {model.sources.map((s) => (
          <li key={s.url} className="text-xs font-sans min-w-0">
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-black/80 dark:text-zinc-200 hover:text-[#ff5d2e] dark:hover:text-[#ff7347] transition-colors break-words"
            >
              <span className="font-medium">{s.title}</span>
              <ExternalLink size={11} className="shrink-0 opacity-50" />
            </a>
            <span className="text-black/45 dark:text-zinc-500"> · {s.publisher} · checked {formatDate(s.accessedAt)}</span>
          </li>
        ))}
      </ul>
      <a
        href={reportIssueUrl(model.id)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[11px] font-sans text-black/45 dark:text-zinc-500 hover:text-[#ff5d2e] dark:hover:text-[#ff7347] transition-colors"
      >
        Report an error in this record
      </a>
    </section>
  )
}
