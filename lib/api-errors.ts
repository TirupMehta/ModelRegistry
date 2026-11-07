import { NextResponse } from "next/server"
import { SITE_URL } from "@/lib/site"

/**
 * One error contract for every JSON endpoint.
 *
 * Shape (additive to the v1 contract - `status` and `error` are unchanged):
 *
 *   {
 *     "status":  "error",
 *     "error":   "Human-readable message.",
 *     "code":    "machine_readable_code",
 *     "hint":    "How to recover.",
 *     "docs":    "https://modelregistry.tirup.in/docs#errors"
 *   }
 *
 * Agents branch on `code`, show `error` to people, and follow `hint` to
 * recover. Errors are never HTML, and never leak driver or stack text.
 */

export type ApiErrorCode =
  | "bad_request"
  | "invalid_date"
  | "invalid_limit"
  | "model_not_found"
  | "route_not_found"
  | "method_not_allowed"
  | "rate_limited"
  | "temporarily_unavailable"
  | "internal_error"

const DEFAULT_HINTS: Partial<Record<ApiErrorCode, string>> = {
  bad_request: `Check the query parameters against ${SITE_URL}/docs.`,
  invalid_date: "Use YYYY-MM-DD dates, for example 2026-10-01.",
  invalid_limit: "Use an integer limit between 1 and 500.",
  model_not_found: `List valid ids via ${SITE_URL}/api/v1/models.`,
  route_not_found: `Known endpoints are listed at ${SITE_URL}/docs and in ${SITE_URL}/openapi.json.`,
  method_not_allowed: "The registry is read-only: use GET or HEAD.",
  rate_limited: "Wait for the number of seconds in Retry-After before retrying.",
  temporarily_unavailable: "Retry shortly. Nothing is wrong with your request.",
  internal_error: "Retry once, then report it via the issue tracker.",
}

export function apiError(params: {
  status: number
  code: ApiErrorCode
  message: string
  hint?: string
  docs?: string
  /** Extra fields merged into the body (e.g. id, suggestion, endpoints). */
  details?: Record<string, unknown>
  headers?: Record<string, string>
}): NextResponse {
  const { status, code, message, hint, details, headers } = params
  return NextResponse.json(
    {
      status: "error",
      error: message,
      code,
      hint: hint ?? DEFAULT_HINTS[code] ?? `See ${SITE_URL}/docs.`,
      docs: params.docs ?? `${SITE_URL}/docs#errors`,
      methodology: `${SITE_URL}/methodology`,
      ...details,
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
        ...headers,
      },
    }
  )
}

/** Endpoints an agent can use after hitting a 404. */
export const KNOWN_API_ENDPOINTS = [
  "/api/v1/models",
  "/api/v1/models/{id}",
  "/api/v1/models/{id}/providers",
  "/api/v1/changes",
  "/api/v1/snapshot",
  "/api/v1/cli",
  "/api/check-updates",
  "/api/markdown?path=/",
  "/api/agent-skills",
  "/api/agent-prompt",
  "/api/og",
  "/api/badge",
  "/api/badge/{company}",
] as const
