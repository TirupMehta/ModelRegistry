import { apiError, KNOWN_API_ENDPOINTS } from "@/lib/api-errors"
import { SITE_URL } from "@/lib/site"

/**
 * JSON 404 for every unknown API path.
 *
 * Without this, an unknown `/api/...` request falls through to the HTML not-
 * found page, which is unparseable for an agent. This handler answers with the
 * same error object every documented endpoint uses, lists the real endpoints,
 * and keeps the 404 status.
 *
 * Next resolves more specific routes first, so this never shadows a real one.
 */
function notFound(request: Request): Response {
  const path = new URL(request.url).pathname
  const method = request.method.toUpperCase()

  if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
    return apiError({
      status: 405,
      code: "method_not_allowed",
      message: `${method} is not supported on ${path}.`,
      hint: "The registry is read-only: use GET or HEAD.",
      details: { path, endpoints: KNOWN_API_ENDPOINTS },
      headers: { Allow: "GET, HEAD, OPTIONS" },
    })
  }

  return apiError({
    status: 404,
    code: "route_not_found",
    message: `API route '${path}' does not exist.`,
    hint: `Use one of the endpoints in 'endpoints', or read ${SITE_URL}/docs.`,
    details: {
      path,
      endpoints: KNOWN_API_ENDPOINTS,
      openapi: `${SITE_URL}/openapi.json`,
      llms: `${SITE_URL}/llms.txt`,
    },
  })
}

export {
  notFound as GET,
  notFound as HEAD,
  notFound as POST,
  notFound as PUT,
  notFound as PATCH,
  notFound as DELETE,
  notFound as OPTIONS,
}
