import { NextRequest } from "next/server"
import { modelsData } from "@/data/models"
import { companies } from "@/data/companies"

export const dynamic = "force-dynamic"

const ESC = "\x1b"
const RESET = `${ESC}[0m`
const BOLD = `${ESC}[1m`
const DIM = `${ESC}[2m`
const CORAL = `${ESC}[38;2;255;93;46m`
const GREEN = `${ESC}[38;2;0;229;153m`
const SLATE = `${ESC}[38;2;140;145;155m`
const WHITE = `${ESC}[38;2;244;245;247m`

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const modelId = searchParams.get("model") || "latest"

  let model = modelsData.find((m) => m.id === modelId)

  if (!model && (modelId === "latest" || modelId === "sota")) {
    const sorted = [...modelsData].sort(
      (a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
    )
    model = sorted[0]
  }

  if (!model) {
    model = modelsData[0]
  }

  const company = companies[model.companyId]
  const labName = company ? company.name : model.companyName

  const lines = [
    `${CORAL}${BOLD}┌────────────────────────────────────────────────────────────────────────┐${RESET}`,
    `${CORAL}${BOLD}│${RESET}  ${WHITE}${BOLD}MODELREGISTRY${RESET} ${DIM}// The Open Frontier AI Model & Checkpoint Ledger${RESET}      ${CORAL}${BOLD}│${RESET}`,
    `${CORAL}${BOLD}├────────────────────────────────────────────────────────────────────────┤${RESET}`,
    `${CORAL}${BOLD}│${RESET}                                                                        ${CORAL}${BOLD}│${RESET}`,
    `${CORAL}${BOLD}│${RESET}  ${SLATE}LABORATORY:${RESET}    ${WHITE}${BOLD}${labName.padEnd(25)}${RESET} ${SLATE}STATUS:${RESET}   ${GREEN}${BOLD}${model.statusBadge.padEnd(19)}${RESET}${CORAL}${BOLD}│${RESET}`,
    `${CORAL}${BOLD}│${RESET}  ${SLATE}MODEL NAME:${RESET}    ${CORAL}${BOLD}${model.name.padEnd(52)}${RESET}${CORAL}${BOLD}│${RESET}`,
    `${CORAL}${BOLD}│${RESET}  ${SLATE}RELEASE DATE:${RESET}  ${WHITE}${model.releaseDate.padEnd(25)}${RESET} ${SLATE}CATEGORY:${RESET} ${WHITE}${model.categoryLabel.padEnd(19)}${RESET}${CORAL}${BOLD}│${RESET}`,
    `${CORAL}${BOLD}│${RESET}                                                                        ${CORAL}${BOLD}│${RESET}`,
    `${CORAL}${BOLD}│${RESET}  ${SLATE}${BOLD}CORE HARDWARE & ARCHITECTURE SPECIFICATIONS${RESET}                          ${CORAL}${BOLD}│${RESET}`,
    `${CORAL}${BOLD}│${RESET}  • ${SLATE}Context Window:${RESET} ${WHITE}${model.contextWindow.padEnd(49)}${RESET}${CORAL}${BOLD}│${RESET}`,
    `${CORAL}${BOLD}│${RESET}  • ${SLATE}Architecture:${RESET}   ${WHITE}${model.parameters.padEnd(49)}${RESET}${CORAL}${BOLD}│${RESET}`,
    `${CORAL}${BOLD}│${RESET}  • ${SLATE}License:${RESET}        ${WHITE}${model.license.padEnd(49)}${RESET}${CORAL}${BOLD}│${RESET}`,
    `${CORAL}${BOLD}│${RESET}  • ${SLATE}Pricing (1M):${RESET}   ${WHITE}${(model.openWeights ? "Free / Open Weights" : `$${model.pricing.input} in / $${model.pricing.output} out`).padEnd(49)}${RESET}${CORAL}${BOLD}│${RESET}`,
  ]

  if (Object.keys(model.benchmarks).length > 0) {
    lines.push(`${CORAL}${BOLD}│${RESET}                                                                        ${CORAL}${BOLD}│${RESET}`)
    lines.push(`${CORAL}${BOLD}│${RESET}  ${SLATE}${BOLD}VERIFIED BENCHMARKS${RESET}                                                   ${CORAL}${BOLD}│${RESET}`)
    const b = model.benchmarks
    const benchEntries: string[] = []
    if (b.sweBench) benchEntries.push(`SWE-bench: ${b.sweBench}`)
    if (b.aime2024) benchEntries.push(`AIME 2024: ${b.aime2024}`)
    if (b.mmluPro) benchEntries.push(`MMLU-Pro: ${b.mmluPro}`)
    if (b.gpqa) benchEntries.push(`GPQA: ${b.gpqa}`)
    lines.push(`${CORAL}${BOLD}│${RESET}  • ${WHITE}${benchEntries.join("  |  ").padEnd(65)}${RESET}${CORAL}${BOLD}│${RESET}`)
  }

  lines.push(`${CORAL}${BOLD}│${RESET}                                                                        ${CORAL}${BOLD}│${RESET}`)
  lines.push(`${CORAL}${BOLD}│${RESET}  ${SLATE}HIGHLIGHT:${RESET}                                                            ${CORAL}${BOLD}│${RESET}`)
  
  // Wrap highlight at ~64 chars
  const words = model.highlight.split(" ")
  let cur = ""
  for (const w of words) {
    if ((cur + " " + w).length > 64) {
      lines.push(`${CORAL}${BOLD}│${RESET}  ${WHITE}${cur.padEnd(68)}${RESET}${CORAL}${BOLD}│${RESET}`)
      cur = w
    } else {
      cur = cur ? `${cur} ${w}` : w
    }
  }
  if (cur) {
    lines.push(`${CORAL}${BOLD}│${RESET}  ${WHITE}${cur.padEnd(68)}${RESET}${CORAL}${BOLD}│${RESET}`)
  }

  lines.push(`${CORAL}${BOLD}│${RESET}                                                                        ${CORAL}${BOLD}│${RESET}`)
  lines.push(`${CORAL}${BOLD}├────────────────────────────────────────────────────────────────────────┤${RESET}`)
  lines.push(`${CORAL}${BOLD}│${RESET}  ${DIM}Web: https://modelregistry.tirup.in/?model=${model.id}${RESET}${CORAL}${BOLD}│${RESET}`)
  lines.push(`${CORAL}${BOLD}│${RESET}  ${DIM}API: https://modelregistry.tirup.in/api/v1/models${RESET}                           ${CORAL}${BOLD}│${RESET}`)
  lines.push(`${CORAL}${BOLD}└────────────────────────────────────────────────────────────────────────┘${RESET}`)

  return new Response(lines.join("\n") + "\n", {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=1800, s-maxage=86400, stale-while-revalidate=86400",
    },
  })
}
