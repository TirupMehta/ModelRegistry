import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { apiError } from "@/lib/api-errors"
import { prefersMarkdown } from "@/lib/content-negotiation"

/**
 * Content negotiation and terminal/agent conveniences.
 *
 * 1. `Accept: text/markdown` on any page route is rewritten to /api/markdown,
 *    which renders the same content as Markdown. The rewrite keeps the public
 *    URL, and the route keeps the real status code (404 stays 404).
 * 2. `curl /` without an HTML or Markdown preference still gets the plain-text
 *    CLI table; an explicit `Accept: text/html` always returns the page.
 * 3. `/api/v1/*` is documented as read-only. Unsupported methods get a JSON 405
 *    with an Allow header instead of an empty framework response.
 *
 * The matcher skips Next's own asset routes; everything else is cheap header
 * work for a pass-through request.
 */

// Asset and framework paths never need content negotiation.
const NON_PAGE_PREFIXES = ["/_next/", "/api/"]
const FILE_EXTENSION = /\.[a-z0-9]{1,8}$/i

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const method = request.method.toUpperCase()

  // Read-only API: answer method misuse with the shared JSON error contract.
  if (pathname === "/api/v1" || pathname.startsWith("/api/v1/")) {
    if (method === "OPTIONS") {
      return new NextResponse(null, {
        status: 204,
        headers: {
          Allow: "GET, HEAD, OPTIONS",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
          "Access-Control-Allow-Headers": "Accept, If-None-Match, Content-Type",
          "Access-Control-Max-Age": "86400",
        },
      })
    }
    if (method !== "GET" && method !== "HEAD") {
      return apiError({
        status: 405,
        code: "method_not_allowed",
        message: `${method} is not supported on ${pathname}.`,
        hint: "The registry is read-only: use GET or HEAD.",
        headers: { Allow: "GET, HEAD, OPTIONS" },
      })
    }
  }

  const isPagePath =
    !NON_PAGE_PREFIXES.some((prefix) => pathname.startsWith(prefix)) &&
    !FILE_EXTENSION.test(pathname)

  if (isPagePath && prefersMarkdown(request.headers.get("accept"))) {
    // Path form, not query form: Next drops the query string on a rewrite to a
    // route handler, which silently served the homepage for every page.
    const url = request.nextUrl.clone()
    url.pathname = pathname === "/" ? "/api/markdown" : `/api/markdown${pathname}`
    url.search = ""
    return NextResponse.rewrite(url)
  }

  const accept = request.headers.get("accept")
  const prefersHtml = /text\/html|application\/xhtml\+xml/i.test(accept ?? "")

  // A terminal `curl /` gets the clean CLI table. An explicit `Accept: text/html`
  // always wins: a client that asked for the page must not be handed a table.
  if (
    pathname === "/" &&
    !prefersHtml &&
    (request.headers.get("user-agent") || "").toLowerCase().includes("curl")
  ) {
    return NextResponse.rewrite(new URL("/api/v1/cli", request.url))
  }

  // Pass-through for the HTML variant. Next rewrites the Vary header after
  // middleware runs (it owns the RSC values), so appending "Accept" here would
  // be discarded. The Markdown route sets `Vary: Accept` itself; on HTML pages
  // the header has to be added by the edge/CDN if a shared cache ever stores
  // both variants under one key.
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
