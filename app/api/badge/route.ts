import { NextRequest } from "next/server"
import { modelsData } from "@/data/models"
import { companies } from "@/data/companies"

export const dynamic = "force-dynamic"

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const modelId = searchParams.get("model") || "latest"
  const type = searchParams.get("type") || "spec"

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
  const accentColor = company?.accentColor || "#ff5d2e"

  let leftText = "MODELREGISTRY"
  let rightText = `${model.name}`

  if (type === "context") {
    leftText = model.name.toUpperCase()
    rightText = model.contextWindow.replace(" tokens", "")
  } else if (type === "pricing") {
    leftText = model.name.toUpperCase()
    rightText = model.openWeights ? "FREE / OPEN" : `$${model.pricing.input}/M`
  } else if (type === "status") {
    leftText = model.name.toUpperCase()
    rightText = model.statusBadge
  } else if (modelId === "latest" || modelId === "sota") {
    leftText = "LATEST SOTA AI"
    rightText = `${model.name}`
  }

  const leftWidth = Math.max(70, leftText.length * 6.8 + 18)
  const rightWidth = Math.max(60, rightText.length * 7.2 + 20)
  const totalWidth = Math.round(leftWidth + rightWidth)

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="22" viewBox="0 0 ${totalWidth} 22" role="img" aria-label="${escapeXml(leftText)}: ${escapeXml(rightText)}">
  <title>${escapeXml(leftText)}: ${escapeXml(rightText)}</title>
  <clipPath id="badge-clip">
    <rect width="${totalWidth}" height="22" rx="4" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#badge-clip)">
    <!-- Left Background -->
    <rect width="${leftWidth}" height="22" fill="#0d0f13"/>
    <!-- Right Background -->
    <rect x="${leftWidth}" width="${rightWidth}" height="22" fill="${accentColor}"/>
    <!-- Subtle hairline overlay border -->
    <rect width="${totalWidth}" height="22" rx="4" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" font-size="10" font-weight="600" letter-spacing="0.4px">
    <!-- Left Text Shadow & Foreground -->
    <text x="${Math.round(leftWidth / 2)}" y="15" fill="#000" opacity="0.4">${escapeXml(leftText)}</text>
    <text x="${Math.round(leftWidth / 2)}" y="14" fill="#f4f5f7">${escapeXml(leftText)}</text>
    <!-- Right Text Shadow & Foreground -->
    <text x="${Math.round(leftWidth + rightWidth / 2)}" y="15" fill="#000" opacity="0.3">${escapeXml(rightText)}</text>
    <text x="${Math.round(leftWidth + rightWidth / 2)}" y="14" fill="#ffffff">${escapeXml(rightText)}</text>
  </g>
</svg>`

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=1800, s-maxage=86400, stale-while-revalidate=86400",
    },
  })
}
