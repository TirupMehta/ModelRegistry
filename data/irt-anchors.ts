/**
 * Frozen anchors for the IRT scale.
 *
 * Why they exist: a latent ability is only identified up to a linear transform,
 * and a fit that re-centres itself whenever a model joins would move every
 * published number. So a handful of reference models are pinned at the theta the
 * first complete fit gave them, and the index is a fixed linear map of theta:
 *
 *     index = 50 + 15 * theta   (clamped to 0..100)
 *
 * Adding a model cannot move an anchor, so the ruler stays put. A non-anchor
 * model's index can shift slightly as evidence arrives, and the board says so.
 *
 * Changing a value here is a deliberate re-anchoring: bump IRT_VERSION, regenerate
 * `data/irt-scores.ts`, and treat it as a new ruler rather than a correction.
 */
export const IRT_ANCHORS: Record<string, number> = {
  // First complete fit (2026-11-27): five models spanning the range and five
  // different laboratories, pinned so the ruler cannot drift.
  "claude-fable-5-2": 0.6079,
  "gemini-4-carbon": 0.4929,
  "kimi-k3-1-pro": 0.1314,
  "tencent-hy4": -0.1109,
  "nemotron-3-ultra": -0.6982,
}

/** The frozen linear map from theta to the 0-100 index. */
export const IRT_SCALE = { mean: 50, sd: 15 } as const
