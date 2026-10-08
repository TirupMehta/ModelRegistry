import { ImageResponse } from "next/og"
import { NextRequest } from "next/server"
import { modelsData } from "@/data/models"
import { companies } from "@/data/companies"
import { formatPrice } from "@/lib/utils"

// Same system as app/opengraph-image.tsx: vellum paper, ink type, the one
// real brand coral. The record's lab color appears once, as a small marker.
// Data is set as type, never boxed.
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
        display: "flex",
        width: `${s}px`,
        height: `${s}px`,
        borderRadius: `${Math.round(s * 0.24)}px`,
        backgroundColor: "#090a0d",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        <div style={{ display: "flex", gap: "2px" }}>
          <div style={{ display: "flex", width: `${block}px`, height: `${block}px`, borderRadius: "3px", backgroundColor: "#ffffff" }} />
          <div style={{ display: "flex", width: `${block}px`, height: `${block}px`, borderRadius: "3px", backgroundColor: "rgba(255, 255, 255, 0.45)" }} />
        </div>
        <div style={{ display: "flex", gap: "2px" }}>
          <div style={{ display: "flex", width: `${block}px`, height: `${block}px`, borderRadius: "3px", backgroundColor: "rgba(255, 255, 255, 0.45)" }} />
          <div style={{ display: "flex", width: `${block}px`, height: `${block}px`, borderRadius: "3px", backgroundColor: BRAND }} />
        </div>
      </div>
    </div>
  )
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <span style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "0.14em", color: FAINT }}>
        {label}
      </span>
      <span style={{ fontSize: "20px", fontWeight: 700, letterSpacing: "-0.01em", color: INK }}>
        {value}
      </span>
    </div>
  )
}


export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const modelId = searchParams.get("model")
    const labId = searchParams.get("lab")?.toLowerCase()

    const model = modelId ? modelsData.find((m) => m.id === modelId) : null
    const modelCompany = model ? companies[model.companyId] : null
    const lab = !model && labId ? companies[labId] : null

    // Laboratory profile card mode (?lab=) shares the datasheet layout
    // with lab-level facts; model/default modes are unchanged.
    const labModels = lab ? modelsData.filter((m) => m.companyId === lab.id) : []
    const labFlagship = lab ? labModels.find((m) => m.isCompanyFlagship) : null
    const labNewest = lab
      ? [...labModels].sort((a, b) => b.releaseDate.localeCompare(a.releaseDate))[0]
      : null

    const company = modelCompany ?? lab

    const title = model ? model.name : lab ? lab.name : "ModelRegistry"
    const labName = model && modelCompany ? modelCompany.name : lab ? "Laboratory profile" : "Open frontier AI index"
    const docType = lab ? "Laboratory profile" : "Frontier AI spec"
    const highlight = model
      ? model.highlight
      : lab
        ? lab.description
        : "The open community index tracking primary foundation flagships and research checkpoints across OpenAI, Anthropic, Google DeepMind, DeepSeek, Meta AI, and more."
    const context = model ? model.contextWindow : labFlagship ? labFlagship.name : "1M+ tokens"
    const architecture = model ? model.parameters : labNewest ? labNewest.name : "All top labs"
    const badge = model ? model.statusBadge : lab ? `${labModels.length} models tracked` : "SOTA index"
    const accentColor = company?.accentColor || BRAND
    // Badge reflects the record's actual verification state - never a
    // blanket "verified" claim.
    const recordState = model
      ? model.verificationStatus === "verified"
        ? "Verified record"
        : model.verificationStatus === "partially_verified"
          ? "Source-linked record"
          : model.verificationStatus.replace(/_/g, " ") + " record"
      : "Source-linked index"
    const recordColor =
      !model || model.verificationStatus === "verified" || model.verificationStatus === "partially_verified"
        ? "#007a52"
        : FAINT

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
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <LogoMark size={46} />
                <div
                  style={{
                    display: "flex",
                    fontSize: "24px",
                    letterSpacing: "-0.02em",
                  }}
                >
                  <span style={{ fontWeight: 300 }}>Model</span>
                  <span style={{ color: BRAND, fontWeight: 700 }}>Registry</span>
                </div>
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 500,
                    color: FAINT,
                  }}
                >
                  {docType}
                </span>
              </div>

              <span
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: recordColor,
                }}
              >
                {recordState}
              </span>
            </div>
            <div style={{ display: "flex", height: "1px", backgroundColor: HAIRLINE }} />
          </div>

          {/* Record body */}
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  display: "flex",
                  width: "10px",
                  height: "10px",
                  backgroundColor: accentColor,
                }}
              />
              <span
                style={{
                  fontSize: "15px",
                  fontWeight: 600,
                  letterSpacing: "0.12em",
                  color: MUTED,
                }}
              >
                {labName}
              </span>
              <span
                style={{
                  fontSize: "15px",
                  fontWeight: 600,
                  color: INK,
                }}
              >
                {badge}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                fontSize: "58px",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                lineHeight: 1.05,
              }}
            >
              {title}
            </div>

            <div
              style={{
                display: "flex",
                fontSize: "20px",
                fontWeight: 400,
                color: MUTED,
                lineHeight: 1.5,
                maxWidth: "940px",
              }}
            >
              {highlight}
            </div>
          </div>

          {/* Footer figures */}
          <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
            <div style={{ display: "flex", height: "1px", backgroundColor: HAIRLINE }} />
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", gap: "56px" }}>
                <Spec label={lab ? "FLAGSHIP" : "CONTEXT WINDOW"} value={context} />
                <Spec label={lab ? "LATEST RELEASE" : "ARCHITECTURE"} value={architecture} />
                {model ? (
                  <Spec
                    label={model.pricingUnit ? "OFFICIAL API" : "PRICING / 1M"}
                    value={model.openWeights ? "Open weights" : formatPrice(model)}
                  />
                ) : (
                  <Spec
                    label={lab ? "HEADQUARTERS" : "COVERAGE"}
                    value={lab ? lab.headquarters : `${Object.keys(companies).length} laboratories`}
                  />
                )}
              </div>

              <span
                style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  color: FAINT,
                }}
              >
                modelregistry.tirup.in
              </span>
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
