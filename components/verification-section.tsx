import { ExternalLink } from "lucide-react"
import type { ModelItem } from "@/data/models"

export function reportIssueUrl(modelId: string) {
  const title = encodeURIComponent(`[CORRECTION]: ${modelId} `)
  return `https://github.com/TirupMehta/ModelRegistry/issues/new?template=data-correction.yml&title=${title}`
}

export default function VerificationSection({ model }: { model: ModelItem }) {
  return (
    <section
      aria-label={`Sources for ${model.name}`}
      className="mt-6 sm:mt-8 border-t border-black/10 dark:border-white/[0.08] pt-4"
    >
      <h3 className="text-[11px] font-sans font-semibold uppercase tracking-[0.12em] text-black/50 dark:text-zinc-400 mb-2">
        Sources
      </h3>
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
            <span className="text-black/45 dark:text-zinc-500"> · {s.publisher}</span>
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
