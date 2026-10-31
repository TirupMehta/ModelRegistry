import { NextResponse } from "next/server"
import { DatabaseNotConfiguredError, isDatabaseConfigured } from "@/lib/db"
import { clientIp, isSameOrigin, rateLimitKey } from "@/lib/waitlist/request"
import { addWaitlistSignup, consumeRateLimit, maybeSweepRateLimits } from "@/lib/waitlist/repository"
import {
  WAITLIST_CONSENT_VERSION,
  validateWaitlistSubmission,
  waitlistProblemMessage,
  type WaitlistProblem,
} from "@/lib/waitlist/validation"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** A form with one email field has no legitimate reason to send more. */
const MAX_BODY_BYTES = 2_048
const ALLOWED_FIELDS = new Set(["email", "consent", "website"])

function json(body: unknown, status: number, headers?: Record<string, string>) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store", ...headers },
  })
}

function problemStatus(problem: WaitlistProblem): number {
  return problem === "consent_required" ? 400 : 422
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return json({ ok: false, error: "forbidden_origin", message: "This request did not come from the site." }, 403)
  }

  const contentType = request.headers.get("content-type") ?? ""
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return json(
      { ok: false, error: "unsupported_media_type", message: "Send the form as JSON." },
      415
    )
  }

  const declaredLength = Number(request.headers.get("content-length") ?? 0)
  if (declaredLength > MAX_BODY_BYTES) {
    return json({ ok: false, error: "payload_too_large", message: "That request was too large." }, 413)
  }

  const raw = await request.text()
  if (raw.length > MAX_BODY_BYTES) {
    return json({ ok: false, error: "payload_too_large", message: "That request was too large." }, 413)
  }

  let body: unknown
  try {
    body = JSON.parse(raw)
  } catch {
    return json({ ok: false, error: "invalid_json", message: "Could not read that request." }, 400)
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return json({ ok: false, error: "invalid_body", message: "Could not read that request." }, 400)
  }

  const record = body as Record<string, unknown>
  if (Object.keys(record).some((key) => !ALLOWED_FIELDS.has(key))) {
    return json({ ok: false, error: "invalid_body", message: "Unexpected field in request." }, 400)
  }

  // Honeypot: hidden to people, irresistible to naive bots. Treated as a plain
  // invalid submission so a filled field never produces a false success.
  if (typeof record.website === "string" && record.website.trim() !== "") {
    return json({ ok: false, error: "invalid_body", message: "Could not read that request." }, 400)
  }

  if (typeof record.email !== "string" || typeof record.consent !== "boolean") {
    return json({ ok: false, error: "invalid_body", message: "Could not read that request." }, 400)
  }

  if (!isDatabaseConfigured()) {
    console.error("[waitlist] DATABASE_URL is not set; refusing to accept signups")
    return json(
      { ok: false, error: "temporarily_unavailable", message: "The waitlist is temporarily unavailable. Try again shortly." },
      503
    )
  }

  // Rate limit before doing any database write work. Without a forwarded IP
  // there is nothing stable to count against, so the request proceeds and the
  // gap is reported rather than silently pretending to be protected.
  const ip = clientIp(request)
  if (ip) {
    try {
      const decision = await consumeRateLimit(rateLimitKey(ip))
      if (!decision.allowed) {
        return json(
          {
            ok: false,
            error: "rate_limited",
            message: "Too many attempts. Try again in a few minutes.",
          },
          429,
          { "Retry-After": String(decision.retryAfterSeconds) }
        )
      }
    } catch (error) {
      console.error("[waitlist] rate limiter unavailable", error instanceof Error ? error.name : "unknown")
      return json(
        { ok: false, error: "temporarily_unavailable", message: "The waitlist is temporarily unavailable. Try again shortly." },
        503
      )
    }
  } else {
    console.warn("[waitlist] request had no client IP; rate limiting skipped")
  }

  const validation = validateWaitlistSubmission({ email: record.email, consent: record.consent })
  if (!validation.ok) {
    return json(
      {
        ok: false,
        error: validation.problem,
        message: waitlistProblemMessage(validation.problem),
      },
      problemStatus(validation.problem)
    )
  }

  try {
    await addWaitlistSignup({ email: validation.email, consentVersion: WAITLIST_CONSENT_VERSION })
  } catch (error) {
    if (error instanceof DatabaseNotConfiguredError) {
      console.error("[waitlist] database not configured")
    } else {
      // Never echo driver/SQL text to the client; the name is enough to trace it.
      console.error("[waitlist] signup insert failed", error instanceof Error ? error.name : "unknown")
    }
    return json(
      { ok: false, error: "temporarily_unavailable", message: "The waitlist is temporarily unavailable. Try again shortly." },
      503
    )
  }

  void maybeSweepRateLimits()

  // New and already-registered addresses get the same answer on purpose: a
  // distinct "already on the list" reply would turn this endpoint into a tool
  // for testing whether any given address signed up.
  return json({ ok: true, status: "on_waitlist" }, 200)
}
