import { costCsv } from "@/lib/insights"

export const dynamic = "force-static"

export function GET() {
  return new Response(costCsv(), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
      "Access-Control-Allow-Origin": "*",
    },
  })
}
