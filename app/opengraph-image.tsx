import { ImageResponse } from "next/og"
import { modelsData } from "@/data/models"

export const runtime = "edge"
export const alt = "ModelRegistry - The Open Frontier AI Model Registry"
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = "image/png"

// Editorial datasheet system: warm near-black paper, one coral accent,
// hairline ledger rules. No glows, no pills, no gradients.
const INK = "#0b0c0f"
const PAPER = "#ffffff"
const MUTED = "rgba(255, 255, 255, 0.6)"
const FAINT = "rgba(255, 255, 255, 0.38)"
const HAIRLINE = "rgba(255, 255, 255, 0.12)"
const ACCENT = "#ff5d2e"
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
        border: "1px solid rgba(255, 255, 255, 0.16)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        <div style={{ display: "flex", gap: "2px" }}>
          <div style={{ width: `${block}px`, height: `${block}px`, borderRadius: "3px", backgroundColor: PAPER }} />
          <div style={{ width: `${block}px`, height: `${block}px`, borderRadius: "3px", backgroundColor: "rgba(255, 255, 255, 0.45)" }} />
        </div>
        <div style={{ display: "flex", gap: "2px" }}>
          <div style={{ width: `${block}px`, height: `${block}px`, borderRadius: "3px", backgroundColor: "rgba(255, 255, 255, 0.45)" }} />
          <div style={{ width: `${block}px`, height: `${block}px`, borderRadius: "3px", backgroundColor: ACCENT }} />
        </div>
      </div>
    </div>
  )
}

function Stat({ index, label, value }: { index: string; label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", color: ACCENT }}>
          {index}
        </span>
        <span style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.18em", color: FAINT }}>
          {label}
        </span>
      </div>
      <span style={{ fontSize: "23px", fontWeight: 600, letterSpacing: "-0.01em", color: PAPER }}>
        {value}
      </span>
    </div>
  )
}

export default async function Image() {
  const flagships = modelsData.filter((m) => m.isCompanyFlagship)
  const peakContext = modelsData.reduce((max, m) => Math.max(max, m.contextWindowTokens), 0)
  const peakContextLabel = peakContext > 0 ? `${peakContext.toLocaleString("en-US")} TOKENS` : "-"
  // Content-based month of the newest tracked release - never hard-coded.
  const newestRelease = [...modelsData].sort((a, b) =>
    b.releaseDate.localeCompare(a.releaseDate)
  )[0]
  const radarLabel = newestRelease
    ? `Frontier Radar • ${new Date(`${newestRelease.releaseDate.slice(0, 7)}-02`).toLocaleDateString("en-US", { month: "long", year: "numeric" })}`
    : "Frontier Radar"
  const eyebrow = `${modelsData.length} Records · ${flagships.length} Frontier Labs · Updated ${newestRelease ? new Date(`${newestRelease.releaseDate.slice(0, 7)}-02`).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "Live"}`
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
        {/* Coral spine rule */}
        <div
          style={{
            position: "absolute",
            top: "0",
            left: "0",
            width: "100%",
            height: "4px",
            display: "flex",
            backgroundColor: ACCENT,
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <LogoMark size={44} />
              <div style={{ display: "flex", fontSize: "24px", letterSpacing: "-0.02em" }}>
                <span style={{ fontWeight: 300 }}>Model</span>
                <span style={{ color: ACCENT, fontWeight: 700 }}>Registry</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ display: "flex", width: "8px", height: "8px", backgroundColor: ACCENT }} />
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.22em",
                  color: MUTED,
                }}
              >
                {radarLabel}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", height: "1px", backgroundColor: HAIRLINE }} />
        </div>

        {/* Headline block */}
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <span
            style={{
              fontSize: "14px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.3em",
              color: ACCENT,
            }}
          >
            {eyebrow}
          </span>
          <div
            style={{
              display: "flex",
              fontSize: "66px",
              fontWeight: 700,
              letterSpacing: "-0.035em",
              lineHeight: 1.02,
              color: PAPER,
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
              lineHeight: 1.45,
              maxWidth: "880px",
            }}
          >
            Primary foundation flagships and research checkpoints across OpenAI, Anthropic, Google DeepMind,
            DeepSeek, Meta, and xAI, each record source-linked and dated.
          </div>
        </div>

        {/* Ledger footer */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "flex", height: "1px", backgroundColor: HAIRLINE }} />
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: "56px" }}>
              <Stat index="01" label="PRIMARY FLAGSHIPS" value={`${flagships.length} Frontier Labs`} />
              <Stat index="02" label="PEAK CONTEXT" value={peakContextLabel} />
              <Stat index="03" label="MODELS INDEXED" value={`${modelsData.length} Records`} />
            </div>
            <span style={{ fontSize: "15px", fontWeight: 500, letterSpacing: "0.04em", color: FAINT }}>
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
