import { ImageResponse } from "next/og"
import { Fragment, isValidElement } from "react"
import type { ReactNode } from "react"
import { NextRequest } from "next/server"
import { modelsData } from "@/data/models"
import { companies } from "@/data/companies"
import { datasetRevision } from "@/data/revision"
import { modelFolio } from "@/lib/registry"
import { formatPrice } from "@/lib/utils"
import {
  benchPretty,
  Card,
  ColumnRule,
  Eyebrow,
  FolioFooter,
  Kicker,
  Masthead,
  PALETTES,
  SpecLine,
  loadOgFonts,
  themeFromParam,
  type OgFont,
  type Palette,
} from "@/lib/og-card"

function renderCard(
  children: ReactNode,
  opts: { palette: Palette; sans: string; fonts: OgFont[] }
) {
  // Flatten the fragment wrapper: satori mis-lays-out Card children when a
  // single Fragment element is passed instead of the sections themselves.
  const flat =
    isValidElement(children) && children.type === Fragment
      ? (children.props as { children?: ReactNode }).children
      : children
  return new ImageResponse(
    <Card palette={opts.palette} sans={opts.sans}>
      {flat}
    </Card>,
    { width: 1200, height: 630, fonts: opts.fonts }
  )
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const theme = themeFromParam(searchParams.get("theme"))
    const palette = PALETTES[theme]
    const { fonts, display, sans } = await loadOgFonts()

    const modelId = searchParams.get("model")
    const labId = searchParams.get("lab")?.toLowerCase()
    const model = modelId ? modelsData.find((m) => m.id === modelId) : null
    const modelCompany = model ? companies[model.companyId] : null
    const lab = !model && labId ? companies[labId] : null

    const labModels = lab ? modelsData.filter((m) => m.companyId === lab.id) : []
    const labFlagship = lab ? labModels.find((m) => m.isCompanyFlagship) : null
    const labNewest = lab
      ? [...labModels].sort((a, b) => b.releaseDate.localeCompare(a.releaseDate))[0]
      : null

    // Shared registry facts (site card).
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

    if (model) {
      // ---- Model datasheet: one record, its lab, its evidence -------------
      const accentColor = modelCompany?.accentColor || palette.brand
      const year = model.releaseDate.slice(0, 4)
      const classLine = model.isCompanyFlagship
        ? `${model.companyName} / Flagship / ${year}`
        : `${model.companyName} / ${year}`
      const { folio, folioId } = modelFolio(model.id, modelsData)

      // Badge reflects the record's actual verification state, never a
      // blanket "verified" claim.
      const recordState =
        model.verificationStatus === "verified"
          ? "Verified record"
          : model.verificationStatus === "partially_verified"
            ? "Source-linked record"
            : `${model.verificationStatus.replace(/_/g, " ")} record`

      // The one featured signal, same house priority as the share studio:
      // best benchmark, else context, else price. Never invented.
      const benchEntries = Object.entries(model.benchmarks) as [string, string][]
      const benchPick =
        ["terminalBench", "sweBench", "mmluPro", "aime2024", "gpqa"]
          .map((k) => benchEntries.find(([key]) => key === k))
          .find(Boolean) ?? benchEntries[0]
      const ctxShort = model.contextWindow.replace(" tokens", "")
      // Large context figures compact like the share studio (1.05M, 500K).
      const ctxCompact = (() => {
        const n = Number(ctxShort.replace(/,/g, ""))
        if (!Number.isFinite(n) || n <= 0) return ctxShort
        if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}M`
        if (n >= 1_000) return `${Math.round(n / 1_000)}K`
        return ctxShort
      })()
      const ctxClean = !ctxShort.includes("(") && ctxShort.length <= 10
      const priceFull = model.openWeights ? "Open weights" : formatPrice(model)
      const benchValue = benchPick ? String(benchPick[1]) : ""
      const benchParen = benchValue.match(/^(.*?)\s*\(([^)]+)\)\s*$/)
      const benchScore = benchParen ? benchParen[1].trim() : benchValue
      const benchVariant = benchParen ? benchParen[2].trim() : null
      let sigBig: string
      let sigSmall: string
      let sigVariant: string | null = null
      if (benchPick) {
        sigBig = benchScore
        sigSmall = benchPretty(benchPick[0])
        sigVariant = benchVariant
      } else if (ctxClean) {
        sigBig = ctxCompact
        sigSmall = "context"
      } else {
        sigBig = `$${model.pricing.input}`
        sigSmall = "API input"
      }

      const specLines = [
        benchPick ? `${ctxCompact} context` : priceFull,
        model.license,
        model.modalities.join(" · "),
      ]

      return renderCard(
        <>
          <Masthead
            folio={folio}
            eyebrowLeft="OPEN FRONTIER AI MODEL DATASHEET"
            eyebrowRight={recordState.toUpperCase()}
            palette={palette}
            display={display}
            sans={sans}
          />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "26px", width: "650px" }}>
              <Kicker palette={palette} fontFamily={sans} accent={accentColor}>
                {classLine}
              </Kicker>
              <div
                style={{
                  display: "flex",
                  fontFamily: display,
                  fontSize: "56px",
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.05,
                  maxWidth: "650px",
                }}
              >
                {model.name}
              </div>
              <div
                style={{
                  display: "flex",
                  fontFamily: sans,
                  fontSize: "20px",
                  fontWeight: 500,
                  color: palette.muted,
                  lineHeight: 1.5,
                  maxWidth: "640px",
                }}
              >
                {model.highlight}
              </div>
            </div>
            <ColumnRule palette={palette} height={232} />
            <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "340px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <span
                  style={{
                    display: "flex",
                    fontFamily: display,
                    fontSize: "64px",
                    fontWeight: 700,
                    letterSpacing: "-0.03em",
                    lineHeight: 1,
                  }}
                >
                  {sigBig}
                </span>
                <Eyebrow palette={palette} fontFamily={sans}>
                  {sigSmall.toUpperCase()}
                </Eyebrow>
                {sigVariant ? (
                  <span style={{ display: "flex", fontFamily: sans, fontSize: "16px", fontWeight: 500, color: palette.faint }}>
                    {sigVariant}
                  </span>
                ) : null}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {specLines.map((line) => (
                  <SpecLine key={line} palette={palette} fontFamily={sans}>
                    {line}
                  </SpecLine>
                ))}
              </div>
            </div>
          </div>
          <FolioFooter folioId={folioId} palette={palette} sans={sans} />
        </>,
        { palette, sans, fonts }
      )
    }

    if (lab) {
      // ---- Laboratory profile: the lab, its roster, its newest work -------
      const accentColor = lab.accentColor || palette.brand
      const classLine = `${lab.name} / ${lab.headquarters}`

      return renderCard(
        <>
          <Masthead
            folio={`${labModels.length} models tracked`}
            eyebrowLeft="OPEN FRONTIER LABORATORY PROFILE"
            palette={palette}
            display={display}
            sans={sans}
          />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "26px", width: "650px" }}>
              <Kicker palette={palette} fontFamily={sans} accent={accentColor}>
                {classLine}
              </Kicker>
              <div
                style={{
                  display: "flex",
                  fontFamily: display,
                  fontSize: "56px",
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.05,
                  maxWidth: "650px",
                }}
              >
                {lab.name}
              </div>
              <div
                style={{
                  display: "flex",
                  fontFamily: sans,
                  fontSize: "20px",
                  fontWeight: 500,
                  color: palette.muted,
                  lineHeight: 1.5,
                  maxWidth: "640px",
                }}
              >
                {lab.description}
              </div>
            </div>
            <ColumnRule palette={palette} height={232} />
            <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "340px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <span
                  style={{
                    display: "flex",
                    fontFamily: display,
                    fontSize: "64px",
                    fontWeight: 700,
                    letterSpacing: "-0.03em",
                    lineHeight: 1,
                  }}
                >
                  {labModels.length}
                </span>
                <Eyebrow palette={palette} fontFamily={sans}>
                  MODELS TRACKED
                </Eyebrow>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {[
                  labFlagship ? `Flagship: ${labFlagship.name}` : "No flagship on record",
                  labNewest ? `Latest: ${labNewest.name} (${labNewest.releaseDate.slice(0, 4)})` : "No releases on record",
                  lab.headquarters,
                ].map((line) => (
                  <SpecLine key={line} palette={palette} fontFamily={sans}>
                    {line}
                  </SpecLine>
                ))}
              </div>
            </div>
          </div>
          <FolioFooter folioId={`LAB / ${lab.id.toUpperCase()}`} palette={palette} sans={sans} />
        </>,
        { palette, sans, fonts }
      )
    }

    // ---- Site radar: what the open frontier AI index is --------------------
    const labList = ["OpenAI", "Anthropic", "Google DeepMind", "DeepSeek", "Meta AI", "and xAI"].join(", ")


    return renderCard(
      <>
        <Masthead
          folio={`Frontier Radar · ${monthLabel}`}
          eyebrowLeft="OPEN FRONTIER AI INDEX"
          eyebrowRight="COMMUNITY-MAINTAINED DATASET"
          palette={palette}
          display={display}
          sans={sans}
        />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "26px", width: "660px" }}>
            <Kicker palette={palette} fontFamily={sans}>
              PRIMARY FLAGSHIPS · RESEARCH CHECKPOINTS · ONE OPEN RECORD
            </Kicker>
            <div
              style={{
                display: "flex",
                fontFamily: display,
                fontSize: "63px",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                lineHeight: 1.05,
              }}
            >
              The Open Frontier AI Model Registry.
            </div>
            <div
              style={{
                display: "flex",
                fontFamily: sans,
                fontSize: "20px",
                fontWeight: 500,
                color: palette.muted,
                lineHeight: 1.5,
                maxWidth: "640px",
              }}
            >
              {`Primary foundation flagships and research checkpoints across ${labList}. Every record source-linked and dated.`}
            </div>
          </div>
          <ColumnRule palette={palette} height={232} />
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "300px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <span
                style={{
                  display: "flex",
                  fontFamily: display,
                  fontSize: "76px",
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  lineHeight: 1,
                }}
              >
                {String(modelsData.length)}
              </span>
              <Eyebrow palette={palette} fontFamily={sans}>
                MODELS INDEXED
              </Eyebrow>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <SpecLine palette={palette} fontFamily={sans}>
                {`${peakContextLabel} peak context`}
              </SpecLine>
              <SpecLine palette={palette} fontFamily={sans}>
                {`${flagships.length} primary flagships`}
              </SpecLine>
              <SpecLine palette={palette} fontFamily={sans}>
                {`${labCount} labs tracked`}
              </SpecLine>
            </div>
          </div>
        </div>
        <FolioFooter folioId={`DATASET ${datasetRevision.datasetVersion}`} palette={palette} sans={sans} />
      </>,
      { palette, sans, fonts }
    )
  } catch (e: any) {
    return new Response(`Failed to generate card image: ${e.message}`, { status: 500 })
  }
}

