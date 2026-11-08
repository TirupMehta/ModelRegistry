/**
 * GitHub webhook receiver: push-triggered cache revalidation for /open-source.
 *
 * Setup (one time, in the GitHub UI or via gh api): a repository webhook at
 * https://modelregistry.tirup.in/api/github-refresh, Content-Type
 * application/json, events "push" and "ping", secret set both here
 * (GITHUB_WEBHOOK_SECRET) and in the GitHub hook config. Every push then
 * clears the github-repo data tag and the page cache, so Latest pushes,
 * contributors, and merged PRs on /open-source are rebuilt from the GitHub
 * API on the next view - no 15-minute wait.
 *
 * When GITHUB_WEBHOOK_SECRET is configured, the HMAC signature (sha256, per
 * the GitHub webhook spec) is verified with a timing-safe comparison and
 * unverified payloads are rejected outright. Without the secret the route
 * still only acts on payloads that name this exact repository, so a random
 * third party cannot trigger revalidations by POSTing junk; but treat the
 * unverified mode as availability-only, never a security boundary.
 */

import { createHmac, timingSafeEqual } from "crypto"
import { revalidatePath, revalidateTag } from "next/cache"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const REPO_FULL_NAME = "TirupMehta/ModelRegistry"
const CACHE_TAG = "github-repo"
const REVALIDATED_PAGE = "/open-source"

function signaturesMatch(received: string, expected: string): boolean {
  const a = Buffer.from(received, "utf8")
  const b = Buffer.from(expected, "utf8")
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function POST(request: Request) {
  const body = await request.text()
  const event = request.headers.get("x-github-event") ?? "unknown"

  const secret = process.env.GITHUB_WEBHOOK_SECRET
  if (secret) {
    const received = request.headers.get("x-hub-signature-256")
    const expected = `sha256=${createHmac("sha256", secret).update(body, "utf8").digest("hex")}`
    if (!received || !signaturesMatch(received, expected)) {
      return Response.json({ status: "error", code: "invalid_signature" }, { status: 403 })
    }
  }

  let payload: unknown
  try {
    payload = JSON.parse(body)
  } catch {
    return Response.json({ status: "error", code: "invalid_json" }, { status: 400 })
  }

  const fullName =
    payload && typeof payload === "object" && (payload as Record<string, unknown>).repository
      ? String((payload as { repository: Record<string, unknown> }).repository.full_name ?? "")
      : ""
  if (fullName !== REPO_FULL_NAME) {
    // 202: correctly addressed but not our repo - nothing to do, no error.
    return Response.json({ status: "ignored", reason: "repository mismatch" }, { status: 202 })
  }

  if (event === "ping") {
    return Response.json({ status: "ok", note: "webhook active", repository: REPO_FULL_NAME })
  }
  if (event !== "push") {
    return Response.json({ status: "ignored", reason: `event '${event}' does not change open-source data` }, { status: 202 })
  }

  revalidateTag(CACHE_TAG)
  revalidatePath(REVALIDATED_PAGE)
  return Response.json({ status: "revalidated", page: REVALIDATED_PAGE, tag: CACHE_TAG })
}
