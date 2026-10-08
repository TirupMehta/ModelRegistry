import { ImageResponse } from "next/og"
import { modelsData } from "@/data/models"

export const runtime = "edge"
export const alt = "ModelRegistry - The Open Frontier AI Model Registry"
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = "image/png"

export default async function Image() {
  const flagships = modelsData.filter((m) => m.isCompanyFlagship)
  const peakContext = modelsData.reduce((max, m) => Math.max(max, m.contextWindowTokens), 0)
  const peakContextLabel = peakContext > 0 ? `${peakContext.toLocaleString("en-US")} Tokens` : "-"
  // Content-based month of the newest tracked release - never hard-coded.
  const newestRelease = [...modelsData].sort((a, b) =>
    b.releaseDate.localeCompare(a.releaseDate)
  )[0]
  const radarLabel = newestRelease
    ? `Frontier Radar • ${new Date(`${newestRelease.releaseDate.slice(0, 7)}-02`).toLocaleDateString("en-US", { month: "long", year: "numeric" })}`
    : "Frontier Radar"
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#090a0d",
          color: "#ffffff",
          padding: "60px 80px",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
          border: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        {/* Top Tag & Status */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            {/* Brand logo mark - blocks grid, one flagship lit coral */}
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                backgroundColor: "#090a0d",
                border: "1px solid rgba(255, 255, 255, 0.14)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <div style={{ display: "flex", gap: "2px" }}>
                  <div style={{ width: "11px", height: "11px", borderRadius: "3px", backgroundColor: "#ffffff" }} />
                  <div style={{ width: "11px", height: "11px", borderRadius: "3px", backgroundColor: "rgba(255, 255, 255, 0.45)" }} />
                </div>
                <div style={{ display: "flex", gap: "2px" }}>
                  <div style={{ width: "11px", height: "11px", borderRadius: "3px", backgroundColor: "rgba(255, 255, 255, 0.45)" }} />
                  <div style={{ width: "11px", height: "11px", borderRadius: "3px", backgroundColor: "#ff5d2e" }} />
                </div>
              </div>
            </div>
            <span
              style={{
                fontSize: "18px",
                fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                color: "#818cf8",
                fontWeight: 600,
              }}
            >
              ModelRegistry
            </span>
          </div>

          <div
            style={{
              padding: "6px 16px",
              borderRadius: "9999px",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              fontSize: "14px",
              fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
              color: "rgba(255, 255, 255, 0.6)",
            }}
          >
            {radarLabel}
          </div>
        </div>

        {/* Center Title & Value Proposition */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <h1
            style={{
              fontSize: "64px",
              fontWeight: 300,
              letterSpacing: "-0.03em",
              margin: 0,
              lineHeight: 1.1,
              color: "#ffffff",
            }}
          >
            The Open Frontier AI Model Registry.
          </h1>
          <p
            style={{
              fontSize: "24px",
              fontWeight: 300,
              color: "rgba(255, 255, 255, 0.65)",
              margin: 0,
              lineHeight: 1.4,
              maxWidth: "900px",
            }}
          >
            Tracking primary foundation flagships and research checkpoints across OpenAI, Anthropic, Google DeepMind, DeepSeek, Meta, and xAI.
          </p>
        </div>

        {/* Bottom Metric Badges */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            paddingTop: "24px",
          }}
        >
          <div style={{ display: "flex", gap: "32px" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "12px", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", color: "rgba(255, 255, 255, 0.4)" }}>
                PRIMARY FLAGSHIPS
              </span>
              <span style={{ fontSize: "20px", fontWeight: 500, color: "#ffffff" }}>
                {flagships.length} Frontier Labs
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "12px", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", color: "rgba(255, 255, 255, 0.4)" }}>
                PEAK CONTEXT
              </span>
              <span style={{ fontSize: "20px", fontWeight: 500, color: "#ffffff" }}>
                {peakContextLabel}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "12px", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", color: "rgba(255, 255, 255, 0.4)" }}>
                SOURCES CHECKED
              </span>
              <span style={{ fontSize: "20px", fontWeight: 500, color: "#10b981" }}>
                {modelsData.length} Models Indexed
              </span>
            </div>
          </div>

          <span
            style={{
              fontSize: "18px",
              fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
              color: "rgba(255, 255, 255, 0.5)",
            }}
          >
            modelregistry.tirup.in
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
