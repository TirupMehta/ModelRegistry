/**
 * data/leaderboard.ts
 * Single source of truth for the editorially curated leaderboard spotlight
 * sections (rendered by app/leaderboard/page.tsx).
 *
 * Keep IDs here instead of hardcoding them in the page: scripts/validate-registry.js
 * fails `pnpm test` if any listed ID no longer exists (e.g. after a merge),
 * so stale references can never silently disappear from the site again.
 */
export const leaderboardSpotlights: Record<string, string[]> = {
  reasoning: ["claude-fable-5-1", "gpt-6-astra", "grok-4-6", "gpt-5-6"],
  coding: ["claude-fable-5-1", "gemini-3-8-flash", "grok-4-6", "gpt-5-6"],
}
