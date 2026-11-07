import { apiError, KNOWN_API_ENDPOINTS } from "@/lib/api-errors"
import { SITE_URL } from "@/lib/site"

/** `/api` itself has no landing page: answer with the endpoint index. */
function index(request: Request): Response {
  const method = request.method.toUpperCase()
  if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
    return apiError({
      status: 405,
      code: "method_not_allowed",
      message: `${method} is not supported on /api.`,
      details: { endpoints: KNOWN_API_ENDPOINTS },
      headers: { Allow: "GET, HEAD, OPTIONS" },
    })
  }

  return apiError({
    status: 404,
    code: "route_not_found",
    message: "/api is an index, not an endpoint.",
    hint: `Pick an endpoint from 'endpoints', or read ${SITE_URL}/docs.`,
    details: {
      endpoints: KNOWN_API_ENDPOINTS,
      openapi: `${SITE_URL}/openapi.json`,
      llms: `${SITE_URL}/llms.txt`,
    },
  })
}

export {
  index as GET,
  index as HEAD,
  index as POST,
  index as PUT,
  index as PATCH,
  index as DELETE,
  index as OPTIONS,
}
