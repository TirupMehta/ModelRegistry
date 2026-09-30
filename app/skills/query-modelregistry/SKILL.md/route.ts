import { QUERY_MODELREGISTRY_SKILL_MD } from "@/lib/skills"

/**
 * Skill artifact: query-modelregistry SKILL.md.
 * Served verbatim from the single source in lib/skills.ts — the discovery
 * index hashes that same string, so artifact and digest cannot drift.
 */
export async function GET() {
  return new Response(QUERY_MODELREGISTRY_SKILL_MD, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
    },
  })
}

export async function HEAD() {
  return new Response(null, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
    },
  })
}
