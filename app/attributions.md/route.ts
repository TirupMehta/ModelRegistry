import fs from "node:fs"
import path from "node:path"

/**
 * First-party copy of the repository's ATTRIBUTIONS.md.
 *
 * The methodology page links here instead of to GitHub, so the page resolves on
 * every branch and preview deploy and follows SITE_URL when the domain moves.
 * The file is read once at build time and baked into the route, so the served
 * text is exactly the committed file and there is no second copy to drift.
 */
export const dynamic = "force-static"

export function GET() {
  const body = fs.readFileSync(path.join(process.cwd(), "ATTRIBUTIONS.md"), "utf8")
  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      "Access-Control-Allow-Origin": "*",
    },
  })
}
