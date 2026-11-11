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
  // Chosen from the independent Artificial Analysis results (see data/independent-benchmarks.ts)
  // and limited to current models: a superseded record is not something a reader can pick.
  reasoning: ["claude-fable-5-2", "gemini-4-carbon", "claude-opus-5-5", "gpt-6-astra"],
  coding: ["claude-fable-5-2", "claude-opus-5-5", "gpt-6-astra", "gpt-6-1-terra"],
  value: ["gpt-6-1-sol", "gpt-6-1-terra", "muse-ember", "mimo-v2-6-flash"],
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
      "Highest scores on the Artificial Analysis Intelligence Index v5.0.1 among current models, run by the evaluator on the same tasks for every model. Not a universal 'best model' title.",
    evaluatedAt: "2026-11-11",
    sources: ["https://artificialanalysis.ai/evaluations/artificial-analysis-intelligence-index"],
    claimGuidance: "Say 'highest published score in this comparison'. Never 'best reasoning model'.",
  },
  coding: {
    basis:
      "Highest scores on FrontierCode 2.0 among current models: real open-source repository tasks graded on whether a maintainer would merge the change, run independently by Artificial Analysis. Many are statistically tied; see the best-by-task page.",
    evaluatedAt: "2026-11-11",
    sources: ["https://artificialanalysis.ai/evaluations/artificial-analysis-intelligence-index"],
    claimGuidance: "Say 'highest published score in this comparison'. Never 'best coding model'.",
  },
  value: {
    basis:
      "Models on the cost frontier: no other current model scores higher on the independent Intelligence Index for less cost per task. Cost counts the reasoning tokens a model spends.",
    evaluatedAt: "2026-11-11",
    sources: ["https://artificialanalysis.ai/evaluations/artificial-analysis-intelligence-index"],
    claimGuidance: "Say 'on the cost frontier'. Never 'best value model'.",
  },
}
