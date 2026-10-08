import { ImageResponse } from "next/og"
import { NextRequest } from "next/server"
import { modelsData } from "@/data/models"
import { companies } from "@/data/companies"
import { formatPrice } from "@/lib/utils"

// Editorial datasheet system shared with app/opengraph-image.tsx:
// warm near-black paper, one accent, hairline ledger rules.
// No glows, no pills, no gradients.
const INK = "#0b0c0f"
const PAPER = "#ffffff"
const MUTED = "rgba(255, 255, 255, 0.6)"
const FAINT = "rgba(255, 255, 255, 0.38)"
const HAIRLINE = "rgba(255, 255, 255, 0.12)"
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
        border: "1px solid rgba(255, 255, 255, 0.16)",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        <div style={{ display: "flex", gap: "2px" }}>
          <div style={{ display: "flex", width: `${block}px`, height: `${block}px`, borderRadius: "3px", backgroundColor: PAPER }} />
          <div style={{ display: "flex", width: `${block}px`, height: `${block}px`, borderRadius: "3px", backgroundColor: "rgba(255, 255, 255, 0.45)" }} />
        </div>
        <div style={{ display: "flex", gap: "2px" }}>
          <div style={{ display: "flex", width: `${block}px`, height: `${block}px`, borderRadius: "3px", backgroundColor: "rgba(255, 255, 255, 0.45)" }} />
          <div style={{ display: "flex", width: `${block}px`, height: `${block}px`, borderRadius: "3px", backgroundColor: "#ff5d2e" }} />
        </div>
      </div>
    </div>
  )
}

function Spec({ index, label, value }: { index: string; label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", color: "#ff5d2e" }}>
          {index}
        </span>
        <span style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.18em", color: FAINT }}>
          {label}
        </span>
      </div>
      <span style={{ fontSize: "19px", fontWeight: 600, letterSpacing: "-0.01em", color: PAPER }}>
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
    const labName = model && modelCompany ? modelCompany.name : lab ? "LABORATORY PROFILE" : "Open Frontier AI Index"
    const docType = lab ? "Laboratory Profile" : "Frontier AI Spec"
    const highlight = model
      ? model.highlight
      : lab
        ? lab.description
        : "The open community index tracking primary foundation flagships and research checkpoints across OpenAI, Anthropic, Google DeepMind, DeepSeek, Meta AI, and more."
    const context = model ? model.contextWindow : labFlagship ? labFlagship.name : "1M+ Tokens"
    const architecture = model ? model.parameters : labNewest ? labNewest.name : "All Top Labs"
    const badge = model ? model.statusBadge : lab ? `${labModels.length} MODELS TRACKED` : "SOTA INDEX"
    const accentColor = company?.accentColor || "#ff5d2e"
    // Badge reflects the record's actual verification state - never a
    // blanket "verified" claim.
    const recordState = model
      ? model.verificationStatus === "verified"
        ? "VERIFIED RECORD"
        : model.verificationStatus === "partially_verified"
          ? "SOURCE-LINKED RECORD"
          : model.verificationStatus.toUpperCase().replace(/_/g, " ") + " RECORD"
      : "SOURCE-LINKED INDEX"
    const recordColor =
      model && model.verificationStatus !== "verified" && model.verificationStatus !== "partially_verified"
        ? "#f5a623"
        : "#00e599"

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            backgroundColor: INK,
            color: PAPER,
            padding: "46px 72px 38px",
            fontFamily: SANS,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Accent spine rule - follows the record's lab color */}
          <div
            style={{
              position: "absolute",
              top: "0",
              left: "0",
              width: "100%",
              height: "4px",
              display: "flex",
              backgroundColor: accentColor,
            }}
          />
          {/* Ledger rules */}
          <div
            style={{
              position: "absolute",
              top: "0",
              left: "72px",
              right: "72px",
              height: "100%",
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                style={{ display: "flex", width: "1px", height: "100%", backgroundColor: "rgba(255, 255, 255, 0.035)" }}
              />
            ))}
          </div>

          {/* Masthead */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <LogoMark size={44} />
                <div
                  style={{
                    display: "flex",
                    fontSize: "23px",
                    letterSpacing: "-0.02em",
                  }}
                >
                  <span style={{ fontWeight: 300 }}>Model</span>
                  <span style={{ color: "#ff5d2e", fontWeight: 700 }}>Registry</span>
                </div>
                <span style={{ fontSize: "13px", letterSpacing: "0.2em", color: FAINT }}>
                  /
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.22em",
                    color: MUTED,
                  }}
                >
                  {docType}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    width: "8px",
                    height: "8px",
                    backgroundColor: recordColor,
                  }}
                />
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.2em",
                    color: MUTED,
                  }}
                >
                  {recordState}
                </span>
              </div>
            </div>
            <div style={{ display: "flex", height: "1px", backgroundColor: HAIRLINE }} />
          </div>

          {/* Record body */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
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
                  fontSize: "14px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.24em",
                  color: MUTED,
                }}
              >
                {labName}
              </span>
              <span style={{ fontSize: "13px", letterSpacing: "0.2em", color: FAINT }}>/</span>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.2em",
                  color: accentColor,
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
                letterSpacing: "-0.035em",
                lineHeight: 1.04,
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
                lineHeight: 1.45,
                maxWidth: "940px",
              }}
            >
              {highlight}
            </div>
          </div>

          {/* Ledger footer */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", height: "1px", backgroundColor: HAIRLINE }} />
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", gap: "48px" }}>
                <Spec index="01" label={lab ? "FLAGSHIP" : "CONTEXT WINDOW"} value={context} />
                <Spec index="02" label={lab ? "LATEST RELEASE" : "ARCHITECTURE"} value={architecture} />
                {model ? (
                  <Spec
                    index="03"
                    label={model.pricingUnit ? "OFFICIAL API" : "PRICING / 1M"}
                    value={model.openWeights ? "Open Weights (Free)" : formatPrice(model)}
                  />
                ) : (
                  <Spec
                    index="03"
                    label={lab ? "HEADQUARTERS" : "COVERAGE"}
                    value={lab ? lab.headquarters : `${Object.keys(companies).length} Laboratories`}
                  />
                )}
              </div>

              <span
                style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  letterSpacing: "0.04em",
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
