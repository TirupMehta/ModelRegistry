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
  value: ["deepseek-v4-flash-0731", "mimo-v2-5", "glm-5-3-flash", "minimax-m3"],
}

export interface LeaderboardSectionMethodology {
  // What the section compares and how the leader is chosen.
  basis: string
  // Date the comparison was last reviewed (YYYY-MM-DD).
  evaluatedAt: string
  // Metric definitions / ranking sources behind the comparison.
  sources: string[]
  // Exact leaderboard claim wording constraints are enforced on-page.
  claimGuidance: string
}

// Editorial snapshot methodology. Figures are lab-published scores as
// recorded in the registry, not independently reproduced results.
// See /methodology and docs/audit-2026-10-07.md.
export const leaderboardMethodology: Record<string, LeaderboardSectionMethodology> = {
  reasoning: {
    basis:
      "Compares lab-published reasoning and STEM scores (Terminal-Bench, SWE-bench family, GPQA Diamond, AIME) across indexed models. The named leader holds the highest published figure in this comparison, not a universal 'best model' title.",
    evaluatedAt: "2026-10-07",
    sources: [
      "https://www.swebench.com",
      "https://github.com/laude-institute/terminal-bench",
      "https://artificialanalysis.ai",
    ],
    claimGuidance: "Say 'highest published score in this comparison'. Never 'best reasoning model'.",
  },
  coding: {
    basis:
      "Compares lab-published software-engineering scores (SWE-bench family incl. DeepSWE, Terminal-Bench, SWE-Bench Verified/Multilingual) across indexed models. Figures are lab-reported; harnesses and versions differ between vendors.",
    evaluatedAt: "2026-10-07",
    sources: ["https://www.swebench.com", "https://github.com/laude-institute/terminal-bench"],
    claimGuidance: "Say 'highest published score in this comparison'. Never 'best coding model'.",
  },
  value: {
    basis:
      "Compares public inference volume and price-performance (OpenRouter weekly token rankings, provider list pricing) for high-throughput models. Volume reflects observed usage share, not quality.",
    evaluatedAt: "2026-10-07",
    sources: ["https://openrouter.ai/rankings"],
    claimGuidance: "Say 'highest observed usage share'. Never 'best value model'.",
  },
}
