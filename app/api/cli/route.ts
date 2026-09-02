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

const INNER_WIDTH = 72

function stripAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*m/g, "")
}

function makeBoxRow(styledContent: string, innerWidth = INNER_WIDTH): string {
  const visible = stripAnsi(styledContent)
  const visibleLen = visible.length
  if (visibleLen > innerWidth) {
    const trimmed = visible.slice(0, innerWidth - 1) + "…"
    return `${CORAL}${BOLD}│${RESET}${trimmed}${CORAL}${BOLD}│${RESET}`
  }
  const spaces = innerWidth - visibleLen
  return `${CORAL}${BOLD}│${RESET}${styledContent}${" ".repeat(spaces)}${CORAL}${BOLD}│${RESET}`
}

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

  const lines: string[] = [
    `${CORAL}${BOLD}┌${"─".repeat(INNER_WIDTH)}┐${RESET}`,
    makeBoxRow(`  ${WHITE}${BOLD}MODELREGISTRY${RESET} ${DIM}// The Open Frontier AI Model & Checkpoint Ledger${RESET}`),
    `${CORAL}${BOLD}├${"─".repeat(INNER_WIDTH)}┤${RESET}`,
    makeBoxRow(""),
    makeBoxRow(`  ${SLATE}LABORATORY:${RESET}    ${WHITE}${BOLD}${labName.slice(0, 22).padEnd(23)}${RESET} ${SLATE}STATUS:${RESET}   ${GREEN}${BOLD}${model.statusBadge.slice(0, 18).padEnd(19)}${RESET}`),
    makeBoxRow(`  ${SLATE}MODEL NAME:${RESET}    ${CORAL}${BOLD}${model.name.slice(0, 52)}${RESET}`),
    makeBoxRow(`  ${SLATE}RELEASE DATE:${RESET}  ${WHITE}${model.releaseDate.padEnd(23)}${RESET} ${SLATE}CATEGORY:${RESET} ${WHITE}${model.categoryLabel.slice(0, 18).padEnd(19)}${RESET}`),
    makeBoxRow(""),
    makeBoxRow(`  ${SLATE}${BOLD}CORE HARDWARE & ARCHITECTURE SPECIFICATIONS${RESET}`),
    makeBoxRow(`  • ${SLATE}Context Window:${RESET} ${WHITE}${model.contextWindow.slice(0, 48)}${RESET}`),
    makeBoxRow(`  • ${SLATE}Architecture:${RESET}   ${WHITE}${model.parameters.slice(0, 48)}${RESET}`),
    makeBoxRow(`  • ${SLATE}License:${RESET}        ${WHITE}${model.license.slice(0, 48)}${RESET}`),
    makeBoxRow(`  • ${SLATE}Pricing (1M):${RESET}   ${WHITE}${(model.openWeights ? "Free / Open Weights" : `$${model.pricing.input} in / $${model.pricing.output} out`).slice(0, 48)}${RESET}`),
  ]

  if (Object.keys(model.benchmarks).length > 0) {
    lines.push(makeBoxRow(""))
    lines.push(makeBoxRow(`  ${SLATE}${BOLD}VERIFIED BENCHMARKS${RESET}`))
    const b = model.benchmarks
    const benchEntries: string[] = []
    if (b.sweBench) benchEntries.push(`SWE-bench: ${b.sweBench}`)
    if (b.aime2024) benchEntries.push(`AIME 2024: ${b.aime2024}`)
    if (b.mmluPro) benchEntries.push(`MMLU-Pro: ${b.mmluPro}`)
    if (b.gpqa) benchEntries.push(`GPQA: ${b.gpqa}`)
    lines.push(makeBoxRow(`  • ${WHITE}${benchEntries.join("  |  ")}${RESET}`))
  }

  lines.push(makeBoxRow(""))
  lines.push(makeBoxRow(`  ${SLATE}HIGHLIGHT:${RESET}`))
  
  // Wrap highlight at ~64 chars
  const words = model.highlight.split(" ")
  let cur = ""
  for (const w of words) {
    if ((cur + " " + w).length > 64) {
      lines.push(makeBoxRow(`  ${WHITE}${cur}${RESET}`))
      cur = w
    } else {
      cur = cur ? `${cur} ${w}` : w
    }
  }
  if (cur) {
    lines.push(makeBoxRow(`  ${WHITE}${cur}${RESET}`))
  }

  lines.push(makeBoxRow(""))
  lines.push(`${CORAL}${BOLD}├${"─".repeat(INNER_WIDTH)}┤${RESET}`)
  lines.push(makeBoxRow(`  ${DIM}Web: https://modelregistry.tirup.in/?model=${model.id}${RESET}`))
  lines.push(makeBoxRow(`  ${DIM}API: https://modelregistry.tirup.in/api/v1/models${RESET}`))
  lines.push(`${CORAL}${BOLD}└${"─".repeat(INNER_WIDTH)}┘${RESET}`)

  return new Response(lines.join("\n") + "\n", {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=1800, s-maxage=86400, stale-while-revalidate=86400",
    },
  })
}
