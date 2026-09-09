import { buildContributePrompt } from "@/lib/agent-prompts"

export const dynamic = "force-static"

/**
 * Plain-text contribution prompt for AI agents. Single-sourced from
 * lib/agent-prompts.ts — the header copy button fetches this so the
 * shared layout chunk never carries the dataset.
 */
export async function GET() {
  return new Response(buildContributePrompt(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  })
}
