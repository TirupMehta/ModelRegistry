import schema from "@/data/model-schema.v1.json"

/**
 * The published JSON Schema for a canonical record (version 1.0).
 *
 * Served so a consumer in any language can validate a record before trusting it,
 * and so the rules the site validates against are public rather than implied by
 * the implementation. The same file drives `scripts/test-canonical-schema.js`
 * through lib/json-schema.ts, which is why it is the single source of truth.
 *
 * A breaking change to the record shape bumps `schemaVersion` in the data and the
 * path here together; /schema/model-v2.json would then exist alongside this one.
 */
export const dynamic = "force-static"

export function GET() {
  return new Response(`${JSON.stringify(schema, null, 2)}\n`, {
    headers: {
      "Content-Type": "application/schema+json; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      "Access-Control-Allow-Origin": "*",
      Link: `<${schema.$id}>; rel="describedby"`,
    },
  })
}
