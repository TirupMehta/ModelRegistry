import { ImageResponse } from "next/og"
import { modelsData } from "@/data/models"
import { companies } from "@/data/companies"

export const runtime = "edge"
export const alt = "ModelRegistry - The Open Frontier AI Model Registry"
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = "image/png"

// The card looks like the product: vellum paper, ink type, the one real
// brand coral. Data is set as type, never boxed. No bars, no pills,
// no decorative rules, no numbered markers.
const PAPER = "#f7f7f4"
const INK = "#111215"
const MUTED = "rgba(17, 18, 21, 0.62)"
const FAINT = "rgba(17, 18, 21, 0.45)"
const HAIRLINE = "rgba(17, 18, 21, 0.14)"
const BRAND = "#ff5d2e"
const SANS = "system-ui, -apple-system, 'Segoe UI', sans-serif"

function LogoMark({ size: s }: { size: number }) {
  const block = Math.round(s * 0.27)
  return (
    <div
      style={{
        width: `${s}px`,
        height: `${s}px`,
        borderRadius: `${Math.round(s * 0.24)}px`,
        backgroundColor: "#090a0d",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        <div style={{ display: "flex", gap: "2px" }}>
          <div style={{ width: `${block}px`, height: `${block}px`, borderRadius: "3px", backgroundColor: "#ffffff" }} />
          <div style={{ width: `${block}px`, height: `${block}px`, borderRadius: "3px", backgroundColor: "rgba(255, 255, 255, 0.45)" }} />
        </div>
        <div style={{ display: "flex", gap: "2px" }}>
          <div style={{ width: `${block}px`, height: `${block}px`, borderRadius: "3px", backgroundColor: "rgba(255, 255, 255, 0.45)" }} />
          <div style={{ width: `${block}px`, height: `${block}px`, borderRadius: "3px", backgroundColor: BRAND }} />
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <span style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "0.14em", color: FAINT }}>
        {label}
      </span>
      <span style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.01em", color: INK }}>
        {value}
      </span>
    </div>
  )
}

export default async function Image() {
  const flagships = modelsData.filter((m) => m.isCompanyFlagship)
  const labCount = Object.keys(companies).length
  const peakContext = modelsData.reduce((max, m) => Math.max(max, m.contextWindowTokens), 0)
  const peakContextLabel = peakContext > 0 ? `${peakContext.toLocaleString("en-US")} tokens` : "-"
  // Content-based month of the newest tracked release - never hard-coded.
  const newestRelease = [...modelsData].sort((a, b) =>
    b.releaseDate.localeCompare(a.releaseDate)
  )[0]
  const updatedLabel = newestRelease
    ? `Updated ${new Date(`${newestRelease.releaseDate.slice(0, 7)}-02`).toLocaleDateString("en-US", { month: "long", year: "numeric" })}`
    : "Live index"
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: PAPER,
          color: INK,
          padding: "52px 64px 42px",
          fontFamily: SANS,
        }}
      >
        {/* Masthead */}
        <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <LogoMark size={46} />
              <div style={{ display: "flex", fontSize: "25px", letterSpacing: "-0.02em" }}>
                <span style={{ fontWeight: 300 }}>Model</span>
                <span style={{ color: BRAND, fontWeight: 700 }}>Registry</span>
              </div>
            </div>
            <span style={{ fontSize: "14px", fontWeight: 500, color: MUTED }}>
              {updatedLabel}
            </span>
          </div>
          <div style={{ display: "flex", height: "1px", backgroundColor: HAIRLINE }} />
        </div>

        {/* Headline block */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              display: "flex",
              fontSize: "62px",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.04,
              color: INK,
            }}
          >
            The Open Frontier AI Model Registry.
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "21px",
              fontWeight: 400,
              color: MUTED,
              lineHeight: 1.5,
              maxWidth: "860px",
            }}
          >
            {modelsData.length} source-linked records across {labCount} frontier labs.
            Flagships and research checkpoints, each traceable to its source.
          </div>
        </div>

        {/* Footer figures */}
        <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
          <div style={{ display: "flex", height: "1px", backgroundColor: HAIRLINE }} />
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: "64px" }}>
              <Stat label="PRIMARY FLAGSHIPS" value={`${flagships.length} frontier labs`} />
              <Stat label="PEAK CONTEXT" value={peakContextLabel} />
              <Stat label="MODELS INDEXED" value={`${modelsData.length} records`} />
            </div>
            <span style={{ fontSize: "15px", fontWeight: 500, color: FAINT }}>
              modelregistry.tirup.in
            </span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
