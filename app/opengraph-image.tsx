import { ImageResponse } from "next/og"
import { readFile } from "node:fs/promises"
import type { ReactNode } from "react"
import { modelsData } from "@/data/models"
import { companies } from "@/data/companies"
import { datasetRevision } from "@/data/revision"

export const runtime = "nodejs"
export const alt = "ModelRegistry - The Open Frontier AI Model Registry"
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = "image/png"

// The same dossier system the Social Card Studio exports (Obsidian Noir):
// near-black paper, warm off-white ink, one real brand coral, hairline
// rules. No gradients, glow, glass, shadows, boxes, or pills. Type and
// whitespace carry the card.
const PAPER = "#0C0D10"
const INK = "#F5F2EB"
const MUTED = "rgba(245, 242, 235, 0.64)"
const FAINT = "rgba(245, 242, 235, 0.42)"
const HAIRLINE = "rgba(245, 242, 235, 0.16)"
const BRAND = "#FF5D2E"
const SYSTEM_SANS = "system-ui, -apple-system, 'Segoe UI', sans-serif"

// The site's own faces (static weights instantiated from the same variable
// woff2 files next/font serves the app), so the card types exactly like the
// product and like the Social Card Studio export. If a file cannot be read
// the card still renders on system faces.
const DISPLAY_FAMILY = "Space Grotesk"
const SANS_FAMILY = "Plus Jakarta Sans"

type OgFont = { name: string; data: ArrayBuffer; weight: 300 | 400 | 500 | 600 | 700; style: "normal" }

function loadFonts(): Promise<{ fonts: OgFont[]; display: string; sans: string }> {
  const sources: Array<{ family: string; file: string; weight: 300 | 500 | 600 | 700 }> = [
    { family: DISPLAY_FAMILY, file: "space-grotesk-300.ttf", weight: 300 },
    { family: DISPLAY_FAMILY, file: "space-grotesk-700.ttf", weight: 700 },
    { family: SANS_FAMILY, file: "plus-jakarta-sans-500.ttf", weight: 500 },
    { family: SANS_FAMILY, file: "plus-jakarta-sans-600.ttf", weight: 600 },
  ]
  const fonts: OgFont[] = []
  const loaded: string[] = []
  return Promise.all(
    sources.map(async ({ family, file, weight }) => {
      try {
        const buf = await readFile(new URL(`../public/fonts/${file}`, import.meta.url))
        const data = buf.buffer.slice(
          buf.byteOffset,
          buf.byteOffset + buf.byteLength
        ) as ArrayBuffer
        fonts.push({ name: family, data, weight, style: "normal" })
        loaded.push(family)
      } catch (e) {
        // Font unavailable: system faces carry the card instead.
        console.error(`[og] font ${file} failed:`, e)
      }
    })
  ).then(() => ({
    fonts,
    display: loaded.includes(DISPLAY_FAMILY) ? DISPLAY_FAMILY : SYSTEM_SANS,
    sans: loaded.includes(SANS_FAMILY) ? SANS_FAMILY : SYSTEM_SANS,
  }))
}

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

function Eyebrow({ children }: { children: string }) {
  return (
    <span
      style={{
        display: "flex",
        fontSize: "13px",
        fontWeight: 600,
        letterSpacing: "0.16em",
        color: FAINT,
      }}
    >
      {children}
    </span>
  )
}

function SpecLine({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        display: "flex",
        fontSize: "20px",
        fontWeight: 500,
        letterSpacing: "-0.01em",
        color: INK,
      }}
    >
      {children}
    </span>
  )
}

export default async function Image() {
  const { fonts, display, sans } = await loadFonts()

  const flagships = modelsData.filter((m) => m.isCompanyFlagship)
  const labCount = Object.keys(companies).length
  const peakContext = modelsData.reduce((max, m) => Math.max(max, m.contextWindowTokens), 0)
  const peakContextLabel =
    peakContext >= 1_000_000
      ? `${(peakContext / 1_000_000).toFixed(1).replace(/\.0$/, "")}M+`
      : peakContext >= 1_000
        ? `${Math.round(peakContext / 1_000)}K+`
        : peakContext > 0
          ? `${peakContext}`
          : "-"

  // Content-based month of the newest tracked release, never hard-coded.
  const newestRelease = [...modelsData].sort((a, b) =>
    b.releaseDate.localeCompare(a.releaseDate)
  )[0]
  const monthLabel = newestRelease
    ? new Date(`${newestRelease.releaseDate.slice(0, 7)}-02`).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "Live index"
  const labList = [
    "OpenAI",
    "Anthropic",
    "Google DeepMind",
    "DeepSeek",
    "Meta AI",
    "and xAI",
  ].join(", ")

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
          padding: "52px 64px 46px",
          fontFamily: sans,
        }}
      >
        {/* Masthead: brand mark and wordmark left, radar folio right, one rule */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <LogoMark size={46} />
              <div
                style={{
                  display: "flex",
                  fontSize: "25px",
                  letterSpacing: "-0.02em",
                  fontFamily: display,
                }}
              >
                <span style={{ fontWeight: 300 }}>Model</span>
                <span style={{ color: BRAND, fontWeight: 700 }}>Registry</span>
              </div>
            </div>
            <span style={{ display: "flex", fontSize: "15px", fontWeight: 500, color: MUTED }}>
              Frontier Radar &middot; {monthLabel}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Eyebrow>OPEN FRONTIER AI INDEX</Eyebrow>
            <Eyebrow>COMMUNITY-MAINTAINED DATASET</Eyebrow>
          </div>
          <div style={{ display: "flex", height: "1px", backgroundColor: HAIRLINE }} />
        </div>

        {/* Body: 60/40 editorial split, one hairline between the columns */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Left: the index identity */}
          <div style={{ display: "flex", flexDirection: "column", gap: "26px", width: "660px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ display: "flex", width: "9px", height: "9px", backgroundColor: BRAND }} />
              <span
                style={{
                  display: "flex",
                  fontSize: "14px",
                  fontWeight: 600,
                  letterSpacing: "0.14em",
                  color: MUTED,
                }}
              >
                PRIMARY FLAGSHIPS &middot; RESEARCH CHECKPOINTS &middot; ONE OPEN RECORD
              </span>
            </div>
            <div
              style={{
                display: "flex",
                fontSize: "63px",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                lineHeight: 1.05,
                fontFamily: display,
              }}
            >
              The Open Frontier AI Model Registry.
            </div>
            <div
              style={{
                display: "flex",
                fontSize: "20px",
                fontWeight: 500,
                color: MUTED,
                lineHeight: 1.5,
                maxWidth: "640px",
              }}
            >
              {`Primary foundation flagships and research checkpoints across ${labList}. Every record source-linked and dated.`}
            </div>
          </div>

          {/* Divider touches no frame rule, separates both columns */}
          <div style={{ display: "flex", width: "1px", height: "232px", backgroundColor: HAIRLINE }} />

          {/* Right: the one featured figure, then quiet data lines */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "300px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <span
                style={{
                  display: "flex",
                  fontSize: "76px",
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  lineHeight: 1,
                  fontFamily: display,
                }}
              >
                {String(modelsData.length)}
              </span>
              <Eyebrow>MODELS INDEXED</Eyebrow>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <SpecLine>{peakContextLabel} peak context</SpecLine>
              <SpecLine>{flagships.length} primary flagships</SpecLine>
              <SpecLine>{labCount} labs tracked</SpecLine>
            </div>
          </div>
        </div>

        {/* Footer: rule, domain left, dataset folio right */}
        <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
          <div style={{ display: "flex", height: "1px", backgroundColor: HAIRLINE }} />
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <span style={{ display: "flex", fontSize: "15px", fontWeight: 500, color: MUTED }}>
              modelregistry.tirup.in
            </span>
            <span
              style={{
                display: "flex",
                fontSize: "13px",
                fontWeight: 600,
                letterSpacing: "0.16em",
                color: FAINT,
              }}
            >
              DATASET {datasetRevision.datasetVersion}
            </span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts,
    }
  )
}
