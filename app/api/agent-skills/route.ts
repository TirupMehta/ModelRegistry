import { createHash } from "node:crypto"
import { QUERY_MODELREGISTRY_SKILL_MD } from "@/lib/skills"

/**
 * Agent Skills discovery index (Agent Skills Discovery RFC v0.2.0).
 * Served at /api/agent-skills and rewritten to
 * /.well-known/agent-skills/index.json (see rewrites() in next.config.mjs).
 *
 * The digest is computed over the served artifact bytes at request time,
 * so it is correct by construction — no hand-maintained hashes.
 */
const SKILL_URL = "https://modelregistry.tirup.in/skills/query-modelregistry/SKILL.md"

function buildIndex() {
  const digest =
    "sha256:" + createHash("sha256").update(QUERY_MODELREGISTRY_SKILL_MD, "utf8").digest("hex")
  return {
    $schema: "https://schemas.agentskills.io/discovery/0.2.0/schema.json",
    skills: [
      {
        name: "query-modelregistry",
        type: "skill-md",
        description:
          "Query ModelRegistry by Tirup Mehta: list flagships and checkpoints, filter by lab or category, poll for updates. Free, unauthenticated, read-only.",
        url: SKILL_URL,
        digest,
      },
    ],
  }
}

export async function GET() {
  return Response.json(buildIndex(), {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
    },
  })
}

export async function HEAD() {
  return new Response(null, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
    },
  })
}
