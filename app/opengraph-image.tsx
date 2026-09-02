import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "ModelRegistry — The Open Frontier AI Model Registry"
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = "image/png"

export default async function Image() {
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
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                backgroundColor: "#818cf8",
                boxShadow: "0 0 16px #818cf8",
              }}
            />
            <span
              style={{
                fontSize: "18px",
                fontFamily: "monospace",
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
              fontFamily: "monospace",
              color: "rgba(255, 255, 255, 0.6)",
            }}
          >
            Live Frontier Radar • September 2026
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
              <span style={{ fontSize: "12px", fontFamily: "monospace", color: "rgba(255, 255, 255, 0.4)" }}>
                PRIMARY FLAGSHIPS
              </span>
              <span style={{ fontSize: "20px", fontWeight: 500, color: "#ffffff" }}>
                9 Frontier Labs
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "12px", fontFamily: "monospace", color: "rgba(255, 255, 255, 0.4)" }}>
                PEAK CONTEXT
              </span>
              <span style={{ fontSize: "20px", fontWeight: 500, color: "#ffffff" }}>
                1,310,720 Tokens
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "12px", fontFamily: "monospace", color: "rgba(255, 255, 255, 0.4)" }}>
                FRESHNESS
              </span>
              <span style={{ fontSize: "20px", fontWeight: 500, color: "#10b981" }}>
                Real-Time Verified
              </span>
            </div>
          </div>

          <span
            style={{
              fontSize: "18px",
              fontFamily: "monospace",
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
