import { modelsData } from "@/data/models"

/**
 * Status badges, classified by what actually backs them.
 *
 * Every model record carries a free-text `statusBadge` that the index renders
 * as a pill. Some of those labels restate what a laboratory said about its own
 * model ("OPENAI FLAGSHIP", "GA · LIVE"); some restate a figure the registry
 * can point at ("79% SWE-VERIFIED", "#1 OPENROUTER VOLUME"); and some are the
 * curator's shorthand for who a model suits ("AGENT FAVORITE", "PRODUCTION
 * DEFAULT"). Those are three different kinds of claim, and a reader who cannot
 * tell them apart is right to distrust all of them.
 *
 * So the kind is derived mechanically from the label text and published in
 * full at /trust#badges. Nothing here upgrades an editorial label into a
 * measurement: the editorial kind is the default, and only labels with a
 * number or an explicitly attributed ranking escape it.
 */

export type BadgeKind = "lab" | "measured" | "editorial"

export interface BadgeKindInfo {
  kind: BadgeKind
  label: string
  basis: string
  detail: string
}

export const BADGE_KINDS: Record<BadgeKind, BadgeKindInfo> = {
  lab: {
    kind: "lab",
    label: "Laboratory designation",
    basis: "Restates the laboratory's own positioning or release status.",
    detail:
      "Taken from the announcement or model documentation cited on the record. It is the laboratory's claim about its own model, not an assessment by ModelRegistry.",
  },
  measured: {
    kind: "measured",
    label: "Published figure",
    basis: "Tied to a number in a cited source.",
    detail:
      "The number behind the label appears on the record (a benchmark score, a price delta, a context size) with a source link. The registry repeats the figure; it does not reproduce the test.",
  },
  editorial: {
    kind: "editorial",
    label: "Editorial label",
    basis: "The curator's shorthand for who a model suits.",
    detail:
      "Not a measurement, not a ranking, and not endorsed by the laboratory. It is a reading aid that can be wrong for your workload, and it carries no evidentiary weight in any comparison on this site.",
  },
}

const EDITORIAL_PATTERNS: RegExp[] = [
  /\bDEFAULT\b/,
  /\bWORKHORSE\b/,
  /\bFAVORITE\b/,
  /\bPICK\b/,
  /\bKING\b/,
  /\bVALUE\b/,
  /\bLEADER\b/,
  /\bNICHE\b/,
  /\bCEILING\b/,
  /\bHEAVYWEIGHT\b/,
  /\bTITAN\b/,
  /\bGIANT\b/,
  /\bSCALE\b/,
  /\bEFFICIENT\b/,
  /\bFAST\b/,
  /\bSTRONGEST\b/,
  /\bSOTA\b/,
  /\bVISUAL THINKING\b/,
]

const MEASURED_PATTERNS: RegExp[] = [
  /#1/,
  /\d+(\.\d+)?%/,
  /\bVOLUME\b/,
  /\bSHARE\b/,
  /\bFASTER\b/,
  /\bCHEAPER\b/,
  /\b\d+(\.\d+)?[BT]\b/,
]

export function classifyBadge(badge: string): BadgeKind {
  const upper = badge.toUpperCase()
  // A ranking claim needs a source before it can be called measured; "#1"
  // alone is not evidence, so it only counts as measured when a figure or an
  // attributed ranking term accompanies it.
  if (MEASURED_PATTERNS.some((re) => re.test(upper)) && !EDITORIAL_PATTERNS.some((re) => re.test(upper))) {
    return "measured"
  }
  if (EDITORIAL_PATTERNS.some((re) => re.test(upper))) return "editorial"
  return "lab"
}

/** Every badge currently in use, deduplicated and grouped by kind. */
export function badgeInventory(models = modelsData): Record<BadgeKind, string[]> {
  const seen: Record<BadgeKind, Set<string>> = {
    lab: new Set(),
    measured: new Set(),
    editorial: new Set(),
  }
  for (const model of models) {
    if (!model.statusBadge) continue
    seen[classifyBadge(model.statusBadge)].add(model.statusBadge)
  }
  return {
    lab: [...seen.lab].sort(),
    measured: [...seen.measured].sort(),
    editorial: [...seen.editorial].sort(),
  }
}

export function badgeInfo(badge: string): BadgeKindInfo {
  return BADGE_KINDS[classifyBadge(badge)]
}
