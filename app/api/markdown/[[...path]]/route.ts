import { renderMarkdown } from "@/lib/markdown"

export const dynamic = "force-dynamic"

/**
 * Markdown view of any HTML route.
 *
 * Two ways in, both public:
 * - `GET /api/markdown/<page-path>` - path segments after the mount point.
 * - `GET /api/markdown?path=/page-path` - explicit query form.
 *
 * middleware.ts rewrites `Accept: text/markdown` page requests here using the
 * path form, so the response keeps its real status: a Markdown request for a
 * route that does not exist returns 404 with a Markdown recovery body, not a
 * 200 HTML shell.
 */
function markdownResponse(request: Request, segments: string[]): Response {
  const url = new URL(request.url)

  // Path form wins; the query form is the documented direct entry point.
  const fromPath = segments.length > 0 ? `/${segments.join("/")}` : null
  const requestedPath = fromPath ?? url.searchParams.get("path") ?? "/"

  // Guard against absolute URLs or scheme-relative input: only the pathname
  // portion is meaningful here, and renderMarkdown only ever matches routes.
  let path = requestedPath
  if (/^[a-z]+:\/\//i.test(path) || path.startsWith("//")) {
    try {
      path = new URL(path).pathname
    } catch {
      path = "/"
    }
  }
  if (!path.startsWith("/")) path = `/${path}`

  const { status, body } = renderMarkdown(path)

  return new Response(body, {
    status,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      // Caches must keep the Markdown and HTML variants apart.
      Vary: "Accept",
      "Cache-Control":
        status === 404
          ? "public, s-maxage=300, stale-while-revalidate=3600"
          : "public, s-maxage=3600, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
      "X-Content-Type-Options": "nosniff",
    },
  })
}

interface RouteContext {
  params: Promise<{ path?: string[] }>
}

export async function GET(request: Request, { params }: RouteContext) {
  const { path } = await params
  return markdownResponse(request, path ?? [])
}

export async function HEAD(request: Request, { params }: RouteContext) {
  const { path } = await params
  const response = markdownResponse(request, path ?? [])
  return new Response(null, {
    status: response.status,
    headers: response.headers,
  })
}
