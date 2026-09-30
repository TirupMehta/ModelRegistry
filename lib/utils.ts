import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ModelItem } from '@/data/models'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * JSON serializer for <script type="application/ld+json"> blocks.
 * Escapes `<` so a `</script>` sequence inside data can never break out of
 * the script tag. Output is byte-identical to JSON.stringify otherwise.
 */
export function safeJsonLd(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, "\\u003c")
}

/**
 * Unit-aware pricing label. Token-priced models render the classic
 * "$X in / $Y out" (per 1M tokens); visual models with a pricingUnit
 * (e.g. "per second") collapse equal rates to "$X per second".
 */
export function formatPrice(model: Pick<ModelItem, 'pricing' | 'pricingUnit' | 'openWeights'>): string {
  const { input, output } = model.pricing
  if (model.pricingUnit) {
    const base = input === output ? `$${input}` : `$${input} in / $${output}`
    return `${base} ${model.pricingUnit}`
  }
  const base = `$${input} in / $${output} out`
  return model.openWeights ? `${base} (Open)` : base
}

/**
 * Parse a plain YYYY-MM-DD release date as a LOCAL date, not UTC.
 * `new Date("2026-09-01")` is midnight UTC; in the Americas that instant
 * lands on Aug 31 local, so "Sep 1, 2026" could render as "Aug 31, 2026".
 */
export function parseLocalDate(dateString: string): Date {
  const [y, m, d] = dateString.split("-").map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

export function formatDate(dateString: string): string {
  try {
    return parseLocalDate(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return dateString
  }
}

export function getRelativeTimeString(dateString: string): string {
  try {
    const date = parseLocalDate(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays <= 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`
    return `${Math.floor(diffDays / 365)}y ago`
  } catch {
    return ''
  }
}
