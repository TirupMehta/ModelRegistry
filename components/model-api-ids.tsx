import type { ModelItem } from "@/data/models"
import { providerApiIds } from "@/data/api-ids"

/**
 * The exact string a provider's API accepts, shown only when the provider's own
 * model page proved it. There is no fallback to the display name: a model with no
 * verified string renders nothing at all.
 */
export default function ModelApiIds({ model }: { model: ModelItem }) {
  const ids = providerApiIds.filter((entry) => entry.modelId === model.id)
  if (ids.length === 0) return null

  return (
    <section className="mb-8">
      <h2 className="text-heading font-display font-semibold tracking-tight text-fg-strong mb-1">
        API model ID
      </h2>
      <p className="mb-3 max-w-[68ch] text-small text-fg-muted">
        The string to send as the model parameter, recorded from the provider&apos;s own documentation.
      </p>
      <ul className="max-w-[68ch] border-t border-black/[0.08] dark:border-white/10">
        {ids.map((entry) => (
          <li
            key={entry.id}
            className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-black/[0.08] py-2 dark:border-white/10"
          >
            <code className="font-mono text-body text-fg-strong">{entry.id}</code>
            <a
              href={entry.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-caption text-fg-muted underline-offset-2 hover:text-accent-ink hover:underline"
            >
              Provider documentation
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
