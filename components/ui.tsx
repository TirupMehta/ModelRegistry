import Link from "next/link"
import type { ReactNode } from "react"
import { ChevronDown } from "lucide-react"

/**
 * Page-level building blocks. Pages compose these; they carry no colours or
 * sizes of their own beyond the type tokens, so the look is edited in one
 * place: tailwind.config.ts (type), app/globals.css (surfaces, lines, page
 * column) and this file (structure).
 */

/** Page title with an optional one-sentence lead. Every page starts with one. */
export function PageHeader({
  title,
  lead,
  meta,
  className = "",
}: {
  title: ReactNode
  lead?: ReactNode
  /** Small line under the lead: dates, counts. */
  meta?: ReactNode
  className?: string
}) {
  return (
    <header className={`mb-10 ${className}`}>
      <h1 className="font-display text-page font-semibold tracking-tight text-fg-strong">{title}</h1>
      {lead && <p className="mt-2 max-w-2xl text-title leading-7 text-fg">{lead}</p>}
      {meta && <p className="mt-3 text-small text-fg-muted">{meta}</p>}
    </header>
  )
}

/** A titled block of a page. `action` is a small link at the right of the title. */
export function Section({
  id,
  title,
  caption,
  action,
  children,
  className = "",
}: {
  id?: string
  title: ReactNode
  caption?: ReactNode
  action?: { href: string; label: string }
  children: ReactNode
  className?: string
}) {
  const headingId = id ? `${id}-title` : undefined
  return (
    <section id={id} aria-labelledby={headingId} className={`scroll-mt-24 ${className}`}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 id={headingId} className="font-display text-heading font-semibold tracking-tight text-fg-strong">
          {title}
        </h2>
        {action && (
          <Link href={action.href} className="shrink-0 text-small font-medium text-accent-ink underline-offset-4 hover:underline">
            {action.label}
          </Link>
        )}
      </div>
      {caption && <p className="mt-1 max-w-2xl text-small text-fg-muted">{caption}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}

/**
 * The one "show more" control. Native <details>, so the content stays in the
 * HTML for crawlers and works without JavaScript.
 *   tile  the closed state is a soft tile (default)
 *   line  the closed state is a plain divided row
 */
export function Disclosure({
  summary,
  children,
  variant = "tile",
  className = "",
}: {
  summary: ReactNode
  children: ReactNode
  variant?: "tile" | "line"
  className?: string
}) {
  const shell = variant === "tile" ? "tile px-4 py-3" : "rule-b"
  const head = variant === "tile" ? "" : "py-3"
  return (
    <details className={`group ${shell} ${className}`}>
      <summary
        className={`flex cursor-pointer list-none items-center justify-between gap-3 text-small font-medium text-fg-strong [&::-webkit-details-marker]:hidden ${head}`}
      >
        <span>{summary}</span>
        <ChevronDown size={14} aria-hidden="true" className="shrink-0 text-fg-muted transition-transform group-open:rotate-180" />
      </summary>
      <div className={`text-small leading-6 text-fg ${variant === "tile" ? "mt-3" : "pb-4"}`}>{children}</div>
    </details>
  )
}

/** A divided list: each child is a row. Use for ranked or dated lists. */
export function RowList({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <ul className={`rule-t [&>li]:rule-b ${className}`}>{children}</ul>
}
