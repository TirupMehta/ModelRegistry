/**
 * HTTP content negotiation helpers (RFC 9110 §12.5.1).
 *
 * Kept in lib/ so the middleware, the API documentation tests, and any future
 * server component share one implementation of "does this client want
 * Markdown?".
 */

function parseQuality(value: string): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 1
}

/**
 * True when the client prefers Markdown over HTML.
 *
 * Compares the quality values of `text/markdown` and `text/html` (or XHTML)
 * rather than looking for a substring: `Accept: text/markdown, text/html;q=0.9`
 * prefers Markdown, while a browser's `text/html,application/xhtml+xml,...`
 * carries no Markdown token and never triggers the rewrite.
 */
export function prefersMarkdown(acceptHeader: string | null | undefined): boolean {
  if (!acceptHeader) return false
  let markdownQuality = -1
  let htmlQuality = -1

  for (const part of acceptHeader.split(",")) {
    const [typePart, ...params] = part.trim().split(";")
    const type = typePart.trim().toLowerCase()
    if (!type) continue

    let quality = 1
    for (const param of params) {
      const [key, raw] = param.split("=")
      if (key?.trim().toLowerCase() === "q" && raw !== undefined) {
        quality = parseQuality(raw.trim())
      }
    }

    if (type === "text/markdown") markdownQuality = Math.max(markdownQuality, quality)
    else if (type === "text/html" || type === "application/xhtml+xml") {
      htmlQuality = Math.max(htmlQuality, quality)
    }
  }

  return markdownQuality > 0 && markdownQuality >= htmlQuality
}
