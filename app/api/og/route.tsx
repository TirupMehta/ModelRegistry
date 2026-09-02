import { ImageResponse } from "next/og"
import { NextRequest } from "next/server"
import { modelsData } from "@/data/models"
import { companies } from "@/data/companies"


export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const modelId = searchParams.get("model")

    const model = modelId ? modelsData.find((m) => m.id === modelId) : null
    const company = model ? companies[model.companyId] : null

    const title = model ? model.name : "ModelRegistry"
    const labName = company ? company.name : "Open Frontier AI Index"
    const highlight = model
      ? model.highlight
      : "The open community index tracking primary foundation flagships and research checkpoints across OpenAI, Anthropic, Google DeepMind, DeepSeek, Meta AI, and more."
    const context = model ? model.contextWindow : "1M+ Tokens"
    const architecture = model ? model.parameters : "All Top Labs"
    const badge = model ? model.statusBadge : "SOTA INDEX"
    const accentColor = company?.accentColor || "#ff5d2e"

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            backgroundColor: "#07080a",
            color: "#f4f5f7",
            padding: "60px 70px",
            fontFamily: "sans-serif",
            position: "relative",
          }}
        >
          {/* Background Ambient Glow */}
          <div
            style={{
              position: "absolute",
              top: "-150px",
              left: "40%",
              width: "500px",
              height: "500px",
              borderRadius: "50%",
              backgroundColor: accentColor,
              opacity: 0.12,
              filter: "blur(90px)",
            }}
          />

          {/* Top Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
              paddingBottom: "24px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  display: "flex",
                  fontSize: "24px",
                  fontWeight: 300,
                  letterSpacing: "-0.03em",
                }}
              >
                <span>Model</span>
                <span style={{ color: "#ff5d2e", fontWeight: 700 }}>Registry</span>
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: "12px",
                  fontFamily: "monospace",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: "rgba(255, 255, 255, 0.6)",
                }}
              >
                FRONTIER AI SPEC
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "13px",
                fontFamily: "monospace",
                color: "#00e599",
              }}
            >
              <div
                style={{
                  display: "flex",
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "#00e599",
                }}
              />
              <span>VERIFIED RECORD</span>
            </div>
          </div>

          {/* Main Body */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  display: "flex",
                  width: "12px",
                  height: "12px",
                  borderRadius: "3px",
                  backgroundColor: accentColor,
                }}
              />
              <span
                style={{
                  fontSize: "16px",
                  fontFamily: "monospace",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "rgba(255, 255, 255, 0.6)",
                }}
              >
                {labName}
              </span>
              <span style={{ color: "rgba(255, 255, 255, 0.2)" }}>/</span>
              <span
                style={{
                  fontSize: "12px",
                  fontFamily: "monospace",
                  padding: "3px 8px",
                  borderRadius: "4px",
                  border: `1px solid ${accentColor}60`,
                  color: accentColor,
                }}
              >
                {badge}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                fontSize: "56px",
                fontWeight: 700,
                letterSpacing: "-0.04em",
                lineHeight: 1.1,
              }}
            >
              {title}
            </div>

            <div
              style={{
                display: "flex",
                fontSize: "20px",
                color: "rgba(255, 255, 255, 0.65)",
                lineHeight: 1.4,
                maxWidth: "950px",
              }}
            >
              {highlight}
            </div>
          </div>

          {/* Footer Specs Row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "1px solid rgba(255, 255, 255, 0.1)",
              paddingTop: "24px",
            }}
          >
            <div style={{ display: "flex", gap: "32px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "12px", fontFamily: "monospace", color: "rgba(255, 255, 255, 0.4)" }}>
                  CONTEXT WINDOW
                </span>
                <span style={{ fontSize: "18px", fontWeight: 600 }}>{context}</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "12px", fontFamily: "monospace", color: "rgba(255, 255, 255, 0.4)" }}>
                  ARCHITECTURE
                </span>
                <span style={{ fontSize: "18px", fontWeight: 600 }}>{architecture}</span>
              </div>

              {model && (
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span style={{ fontSize: "12px", fontFamily: "monospace", color: "rgba(255, 255, 255, 0.4)" }}>
                    PRICING / 1M
                  </span>
                  <span style={{ fontSize: "18px", fontWeight: 600 }}>
                    {model.openWeights ? "Open Weights (Free)" : `$${model.pricing.input} in / $${model.pricing.output} out`}
                  </span>
                </div>
              )}
            </div>

            <div
              style={{
                display: "flex",
                fontSize: "14px",
                fontFamily: "monospace",
                color: "rgba(255, 255, 255, 0.4)",
              }}
            >
              modelregistry.tirup.in
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (e: any) {
    return new Response(`Failed to generate card image: ${e.message}`, { status: 500 })
  }
}
