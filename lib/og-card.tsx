import { readFile } from "node:fs/promises"
import path from "node:path"
import type { ReactNode } from "react"

/**
 * The shared dossier system for every ModelRegistry social card: the site
 * radar and the per-model / per-lab datasheets. One voice across all of
 * them: warm paper (Vellum Archival) or near-black paper (Obsidian Noir),
 * ink type, hairline rules, a single coral accent, the record's lab color
 * once as a small square. No gradients, glow, glass, shadows, boxes, or
 * pills. Type and whitespace carry the card.
 *
 * Same palettes, faces, and proportions the Social Card Studio exports, so
 * a downloaded card and a link preview read as one system.
 */

export type Theme = "light" | "dark"

export const DISPLAY_FAMILY = "Space Grotesk"
export const SANS_FAMILY = "Plus Jakarta Sans"
const SYSTEM_SANS = "system-ui, -apple-system, 'Segoe UI', sans-serif"
export const BRAND = "#FF5D2E"

export type Palette = {
  paper: string
  ink: string
  muted: string
  faint: string
  hair: string
  brand: string
  logoBorder: string
}

export const PALETTES: Record<Theme, Palette> = {
  dark: {
    paper: "#0C0D10",
    ink: "#F5F2EB",
    muted: "rgba(245, 242, 235, 0.64)",
    faint: "rgba(245, 242, 235, 0.42)",
    hair: "rgba(245, 242, 235, 0.16)",
    brand: BRAND,
    logoBorder: "rgba(255, 255, 255, 0.16)",
  },
  light: {
    paper: "#F7F7F4",
    ink: "#141310",
    muted: "rgba(20, 19, 16, 0.64)",
    faint: "rgba(20, 19, 16, 0.44)",
    hair: "rgba(20, 19, 16, 0.16)",
    brand: BRAND,
    logoBorder: "rgba(0, 0, 0, 0.15)",
  },
}

/** Cards default to the archival paper; ?theme=dark opts into noir. */
export function themeFromParam(value: string | null): Theme {
  return value === "dark" ? "dark" : "light"
}

export type OgFont = { name: string; data: ArrayBuffer; weight: 300 | 400 | 500 | 600 | 700; style: "normal" }

/**
 * The site's own faces (static weights instantiated from the same variable
 * woff2 files next/font serves the app), so cards type exactly like the
 * product. satori only reads TTF/OTF, hence the .ttf copies. If a file
 * cannot be read the card still renders on system faces.
 *
 * The read anchor is relative to the compiled route chunk, which sits at a
 * different depth than this module, so each candidate path is tried in turn
 * (absolute cwd last). One of them resolves in dev, start, and serverless.
 */
export function loadOgFonts(): Promise<{ fonts: OgFont[]; display: string; sans: string }> {
  const sources: Array<{ family: string; file: string; weight: 300 | 500 | 600 | 700 }> = [
    { family: DISPLAY_FAMILY, file: "space-grotesk-300.ttf", weight: 300 },
    { family: DISPLAY_FAMILY, file: "space-grotesk-700.ttf", weight: 700 },
    { family: SANS_FAMILY, file: "plus-jakarta-sans-500.ttf", weight: 500 },
    { family: SANS_FAMILY, file: "plus-jakarta-sans-600.ttf", weight: 600 },
  ]
  const readFont = async (file: string): Promise<Buffer | null> => {
    const candidates = [
      new URL(`../../../public/fonts/${file}`, import.meta.url),
      new URL(`../../public/fonts/${file}`, import.meta.url),
      new URL(`../public/fonts/${file}`, import.meta.url),
      path.resolve(process.cwd(), "public/fonts", file),
    ]
    for (const candidate of candidates) {
      try {
        return await readFile(candidate)
      } catch {
        // Try the next anchor.
      }
    }
    console.error(`[og] font ${file} not found under public/fonts`)
    return null
  }
  const fonts: OgFont[] = []
  const loaded: string[] = []
  return Promise.all(
    sources.map(async ({ family, file, weight }) => {
      try {
        const buf = await readFont(file)
        if (!buf) return
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

/** Brand mark: block grid with one flagship block lit coral. */
export function LogoMark({ size: s, palette }: { size: number; palette: Palette }) {
  const block = Math.round(s * 0.27)
  return (
    <div
      style={{
        display: "flex",
        width: `${s}px`,
        height: `${s}px`,
        borderRadius: `${Math.round(s * 0.24)}px`,
        backgroundColor: "#090a0d",
        border: `1px solid ${palette.logoBorder}`,
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
          <div style={{ width: `${block}px`, height: `${block}px`, borderRadius: "3px", backgroundColor: palette.brand }} />
        </div>
      </div>
    </div>
  )
}

/** Small caps tracked label, the quiet structural voice of the card. */
export function Eyebrow({
  children,
  palette,
  fontFamily,
  color,
}: {
  children: ReactNode
  palette: Palette
  fontFamily: string
  color?: string
}) {
  return (
    <span
      style={{
        display: "flex",
        fontFamily,
        fontSize: "13px",
        fontWeight: 600,
        letterSpacing: "0.16em",
        color: color ?? palette.faint,
      }}
    >
      {children}
    </span>
  )
}

/** Accent square plus tracked kicker: provider, class, or index line. */
export function Kicker({
  children,
  palette,
  fontFamily,
  accent,
}: {
  children: ReactNode
  palette: Palette
  fontFamily: string
  accent?: string
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <div style={{ display: "flex", width: "9px", height: "9px", backgroundColor: accent ?? palette.brand }} />
      <span
        style={{
          display: "flex",
          fontFamily,
          fontSize: "14px",
          fontWeight: 600,
          letterSpacing: "0.14em",
          color: palette.muted,
        }}
      >
        {children}
      </span>
    </div>
  )
}

/** Stationery top: wordmark, folio, dual eyebrows, one rule. */
export function Masthead({
  folio,
  eyebrowLeft,
  eyebrowRight,
  palette,
  display,
  sans,
}: {
  folio: string
  eyebrowLeft: string
  eyebrowRight?: string
  palette: Palette
  display: string
  sans: string
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <LogoMark size={46} palette={palette} />
          <div style={{ display: "flex", fontFamily: display, fontSize: "25px", letterSpacing: "-0.02em" }}>
            <span style={{ fontWeight: 300 }}>Model</span>
            <span style={{ color: palette.brand, fontWeight: 700 }}>Registry</span>
          </div>
        </div>
        <span style={{ display: "flex", fontFamily: sans, fontSize: "15px", fontWeight: 500, color: palette.muted }}>
          {folio}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Eyebrow palette={palette} fontFamily={sans}>
          {eyebrowLeft}
        </Eyebrow>
        {eyebrowRight ? (
          <Eyebrow palette={palette} fontFamily={sans}>
            {eyebrowRight}
          </Eyebrow>
        ) : (
          <span style={{ display: "flex" }} />
        )}
      </div>
      <div style={{ display: "flex", height: "1px", backgroundColor: palette.hair }} />
    </div>
  )
}

/** The hairline that floats between the columns, touching no frame rule. */
export function ColumnRule({ palette, height }: { palette: Palette; height: number }) {
  return <div style={{ display: "flex", width: "1px", height: `${height}px`, backgroundColor: palette.hair }} />
}

/** Data set as quiet type, never boxed. */
export function SpecLine({
  children,
  palette,
  fontFamily,
}: {
  children: ReactNode
  palette: Palette
  fontFamily: string
}) {
  return (
    <span
      style={{
        display: "flex",
        fontFamily,
        fontSize: "20px",
        fontWeight: 500,
        letterSpacing: "-0.01em",
        color: palette.ink,
      }}
    >
      {children}
    </span>
  )
}

/** Stationery bottom: rule, domain left, record folio right. */
export function FolioFooter({
  folioId,
  palette,
  sans,
}: {
  folioId: string
  palette: Palette
  sans: string
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
      <div style={{ display: "flex", height: "1px", backgroundColor: palette.hair }} />
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <span style={{ display: "flex", fontFamily: sans, fontSize: "15px", fontWeight: 500, color: palette.muted }}>
          modelregistry.tirup.in
        </span>
        <Eyebrow palette={palette} fontFamily={sans}>
          {folioId}
        </Eyebrow>
      </div>
    </div>
  )
}

/** Full-bleed paper frame the three card modes are composed inside. */
export function Card({
  children,
  palette,
  sans,
}: {
  children: ReactNode
  palette: Palette
  sans: string
}) {
  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: palette.paper,
        color: palette.ink,
        padding: "52px 64px 46px",
        fontFamily: sans,
      }}
    >
      {children}
    </div>
  )
}
