"use client"

import React, { useEffect, useRef, useState, useCallback } from "react"
import { type ModelItem } from "@/data/models"
import { companies } from "@/data/companies"
import { formatPrice } from "@/lib/utils"
import { Download, Copy, Share2, Check, X, Sparkles, Code2, ZoomIn } from "lucide-react"

interface ShareCardModalProps {
  model: ModelItem
  isOpen: boolean
  onClose: () => void
  // Dossier folio, derived server-side (see lib/registry modelFolio) so the
  // canvas never bundles the dataset for two strings.
  folio: string
  folioId: string
}

type AspectRatio = "story" | "square" | "landscape"
type ThemeMode = "dark" | "light"

function ShareCardModalInner({ model, isOpen, onClose, folio, folioId }: ShareCardModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [ratio, setRatio] = useState<AspectRatio>("square")

  // Mobile opens on 16:9 Post (reads best on phones); desktop keeps Square.
  // Mount-only so an explicit user pick is never overridden.
  useEffect(() => {
    if (window.innerWidth < 768) setRatio("landscape")
  }, [])
  const [cardTheme, setCardTheme] = useState<ThemeMode>("dark")
  const [isCopied, setIsCopied] = useState(false)
  const [isBadgeCopied, setIsBadgeCopied] = useState(false)
  const [isRendering, setIsRendering] = useState(false)
  const [renderError, setRenderError] = useState<string | null>(null)
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomSrc, setZoomSrc] = useState<string | null>(null)

  // An explicit palette pick always wins over the site theme. The layout
  // adds/removes a `ptr` class on <html> on every pointerdown/Tab key, so a
  // naive MutationObserver sync would wipe the user's choice on the very
  // next click (preview flips back, download/zoom capture the wrong theme).
  const userPickedTheme = useRef(false)

  // Default card palette follows the viewer's site theme (light → Vellum
  // Archival, dark → Obsidian Noir) until the user picks explicitly.
  // Initial "dark" keeps server/client first render identical (no hydration
  // mismatch); the effect below corrects it on mount before first paint.
  useEffect(() => {
    const syncTheme = () => {
      if (userPickedTheme.current) return
      setCardTheme(document.documentElement.classList.contains("dark") ? "dark" : "light")
    }
    syncTheme()
    const observer = new MutationObserver(syncTheme)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  const company = companies[model.companyId]

  // Site type system - must match app/layout.tsx (next/font):
  // Display = Space Grotesk, Body/labels = Plus Jakarta Sans.
  // Canvas can only use document-loaded fonts, so every render is preceded
  // by ensureCardFonts() (document.fonts.load + fonts.ready).
  const F_DISPLAY = '"Space Grotesk", "Plus Jakarta Sans", sans-serif'
  const F_SANS = '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif'

    // next/font serves: Sans 300-700, Display 400-700.
    // Tight display tracking for the model name and wordmark.
    const TRACK_TITLE_LETTER = "-0.01em"
  async function ensureCardFonts() {
    // Older browsers / privacy modes may not expose the FontFaceSet API.
    if (typeof document === "undefined" || !("fonts" in document) || !document.fonts) return
    const specs = [
      '700 80px "Space Grotesk"',
      '400 24px "Plus Jakarta Sans"',
      '300 24px "Plus Jakarta Sans"',
      '700 24px "Plus Jakarta Sans"',
      '500 16px "Plus Jakarta Sans"',
      '600 16px "Plus Jakarta Sans"',
    ]
    await Promise.all(specs.map((s) => document.fonts.load(s)))
    await document.fonts.ready
  }

  // Render the card to HTML5 canvas
  const drawCard = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    setIsRendering(true)
    setRenderError(null)

    try {
    // Dimensions configuration
    let width = 1080
    let height = 1920

    if (ratio === "square") {
      width = 1080
      height = 1080
    } else if (ratio === "landscape") {
      width = 1200
      height = 675
    }

    // Supersampled rendering: rasterize at 2x, export at 1x. Same output
    // dimensions with modest file growth, but visibly crisper text and edges.
    const SS = 2
    canvas.width = width * SS
    canvas.height = height * SS
    ctx.setTransform(SS, 0, 0, SS, 0, 0)
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = "high"

    // Model dossier system. Each ratio is its own art-directed composition
    // sharing one voice: almost-black paper, warm off-white ink, muted gray
    // support, a single coral accent. No gradients, glow, glass, shadows,
    // boxes, pills, or decoration. Type carries the card.
    const isDark = cardTheme === "dark"
    const paper = isDark ? "#0C0D10" : "#F7F7F4"
    const ink = isDark ? "#F5F2EB" : "#141310"
    const muted = isDark ? "rgba(245, 242, 235, 0.64)" : "rgba(20, 19, 16, 0.64)"
    const faint = isDark ? "rgba(245, 242, 235, 0.42)" : "rgba(20, 19, 16, 0.44)"
    const hair = isDark ? "rgba(245, 242, 235, 0.16)" : "rgba(20, 19, 16, 0.16)"
    const ACCENT = "#FF5D2E"

    // 1. Clear & Background Fill. Flat paper, nothing else.
    ctx.fillStyle = paper
    ctx.fillRect(0, 0, width, height)

    // Layout Padding per composition.
    const padding = ratio === "landscape" ? 60 : ratio === "square" ? 72 : 80
    const contentWidth = width - padding * 2

    // Dossier record facts. Folio strings arrive via props (derived
    // server-side); the class line uses only real record fields.
    const labName = company ? company.name : model.companyName
    const year = model.releaseDate.slice(0, 4)
    const classLine = model.isCompanyFlagship
      ? `${labName} / Flagship / ${year}`
      : `${labName} / ${year}`

    // The one featured signal: best benchmark by house priority, else a
    // clean context figure, else the input price. Nothing invented.
    const benchPretty = (k: string) =>
      k === "terminalBench" ? "Terminal-Bench"
      : k === "sweBench" ? "SWE-bench"
      : k === "mmluPro" ? "MMLU-Pro"
      : k === "aime2024" ? "AIME 2024"
      : "GPQA"
    const benchEntries = Object.entries(model.benchmarks) as [string, string][]
    const benchPick =
      ["terminalBench", "sweBench", "mmluPro", "aime2024", "gpqa"]
        .map((k) => benchEntries.find(([key]) => key === k))
        .find(Boolean) ?? benchEntries[0]
    const ctxShort = model.contextWindow.replace(" tokens", "")
    const ctxClean = !ctxShort.includes("(") && ctxShort.length <= 10
    const priceFull = model.openWeights ? "Open weights" : formatPrice(model)
    let sigBig: string
    let sigSmall: string
    let sigKind: "bench" | "context" | "price" = "bench"
    // A benchmark value may carry its variant in parentheses
    // ("77.9% (DeepSWE v1.1)"). The score leads the evidence unit; the
    // variant sets as its own quiet metadata line, never beside the
    // figure at headline scale.
    const benchValue = benchPick ? String(benchPick[1]) : ""
    const benchParen = benchValue.match(/^(.*?)\s*\(([^)]+)\)\s*$/)
    const benchScore = benchParen ? benchParen[1].trim() : benchValue
    const benchVariant = benchParen ? benchParen[2].trim() : null
    if (benchPick) {
      sigBig = benchScore
      sigSmall = benchPretty(benchPick[0])
    } else if (ctxClean) {
      sigBig = ctxShort
      sigSmall = "context"
      sigKind = "context"
    } else {
      sigBig = `$${model.pricing.input}`
      sigSmall = "API input"
      sigKind = "price"
    }

    // Rounded-rect path used only by the brand mark (canvas has no native
    // roundRect on older backends, and logo geometry needs exact radii).
    function roundRect(
      x: number,
      y: number,
      w: number,
      h: number,
      radius: number,
      fill?: string,
      stroke?: string
    ) {
      ctx!.beginPath()
      ctx!.moveTo(x + radius, y)
      ctx!.lineTo(x + w - radius, y)
      ctx!.quadraticCurveTo(x + w, y, x + w, y + radius)
      ctx!.lineTo(x + w, y + h - radius)
      ctx!.quadraticCurveTo(x + w, y + h, x + w - radius, y + h)
      ctx!.lineTo(x + radius, y + h)
      ctx!.quadraticCurveTo(x, y + h, x, y + h - radius)
      ctx!.lineTo(x, y + radius)
      ctx!.quadraticCurveTo(x, y, x + radius, y)
      ctx!.closePath()
      if (fill) {
        ctx!.fillStyle = fill
        ctx!.fill()
      }
      if (stroke) {
        ctx!.strokeStyle = stroke
        ctx!.lineWidth = 1.5
        ctx!.stroke()
      }
    }

    // Brand logo mark - blocks grid with one flagship lit coral.
    // Matches public/logo-blocks.svg proportions (32-unit grid).
    function drawLogoMark(x: number, y: number, size: number) {
      const logoBorder = isDark ? "rgba(255, 255, 255, 0.16)" : "rgba(0, 0, 0, 0.15)"
      roundRect(x, y, size, size, size * 0.22, "#090a0d", logoBorder)
      const pad = size * (7 / 32)
      const block = size * (8.5 / 32)
      const gap = size * (1 / 32)
      const r = size * (2.2 / 32)
      const bx = x + pad
      const by = y + pad
      roundRect(bx, by, block, block, r, "#ffffff")
      roundRect(bx + block + gap, by, block, block, r, "rgba(255, 255, 255, 0.45)")
      roundRect(bx, by + block + gap, block, block, r, "rgba(255, 255, 255, 0.45)")
      roundRect(bx + block + gap, by + block + gap, block, block, r, "#ff5d2e")
    }

    // Publication masthead: brand mark plus quiet wordmark left, folio
    // right, one rule. Returns the rule's y so compositions can hang
    // content from it. gapBoost opens the wordmark/desc/rule rhythm
    // without touching callers that pass nothing.
    function masthead(top: number, wordPx: number, folioPx: number, descPx: number, gapBoost = 0) {
      const logoSize = Math.round(wordPx * 1.45)
      const logoGap = Math.round(wordPx * 0.45)
      drawLogoMark(padding, top - logoSize + Math.round(wordPx * 0.3), logoSize)
      const wx = padding + logoSize + logoGap
      setTracking(TRACK_TITLE_LETTER, "0px")
      ctx!.font = `300 ${wordPx}px ${F_DISPLAY}`
      ctx!.fillStyle = ink
      ctx!.fillText("Model", wx, top)
      const wW = ctx!.measureText("Model").width
      ctx!.fillStyle = ACCENT
      ctx!.fillText("Registry", wx + wW, top)
      setTracking("0px", "0px")
      ctx!.font = `500 ${folioPx}px ${F_SANS}`
      ctx!.fillStyle = muted
      const fw = ctx!.measureText(folio).width
      ctx!.fillText(folio, width - padding - fw, top)
      ctx!.font = `500 ${descPx}px ${F_SANS}`
      ctx!.fillStyle = faint
      ctx!.fillText("OPEN FRONTIER AI SPECIFICATION", padding, top + descPx + 14 + gapBoost)
      const ruleY = top + descPx + 30 + gapBoost * 2
      ctx!.strokeStyle = hair
      ctx!.lineWidth = 1.5
      ctx!.beginPath()
      ctx!.moveTo(padding, ruleY)
      ctx!.lineTo(width - padding, ruleY)
      ctx!.stroke()
      return ruleY
    }

    // Folio footer: domain left, record id right. Nothing else.
    function folioFooter() {
      const fy = height - padding
      ctx!.strokeStyle = hair
      ctx!.lineWidth = 1.5
      ctx!.beginPath()
      ctx!.moveTo(padding, fy - 44)
      ctx!.lineTo(width - padding, fy - 44)
      ctx!.stroke()
      ctx!.font = `500 22px ${F_SANS}`
      ctx!.fillStyle = muted
      ctx!.fillText("modelregistry.tirup.in", padding, fy - 9)
      const iw = ctx!.measureText(folioId).width
      ctx!.fillText(folioId, width - padding - iw, fy - 9)
    }

    // Split the model name across at most two balanced lines.
    function splitName(name: string, font: string, maxW: number): string[] {
      ctx!.font = font
      if (ctx!.measureText(name).width <= maxW) return [name]
      const words = name.split(" ")
      if (words.length < 2) return [name]
      let best = 1
      let bestScore = Infinity
      for (let i = 1; i < words.length; i++) {
        const a = words.slice(0, i).join(" ")
        const b = words.slice(i).join(" ")
        const score = Math.max(ctx!.measureText(a).width, ctx!.measureText(b).width)
        if (score < bestScore) {
          bestScore = score
          best = i
        }
      }
      return [words.slice(0, best).join(" "), words.slice(best).join(" ")]
    }

    // Set the model name large with tight tracking. Returns the bottom y
    // plus the fitted size so sibling figures can key off the hero.
    function drawName(basePx: number, minPx: number, x: number, yTop: number, maxW: number, lh: number) {
      let px = basePx
      let lines = splitName(model.name, `700 ${px}px ${F_DISPLAY}`, maxW)
      const widest = () => {
        ctx!.font = `700 ${px}px ${F_DISPLAY}`
        return Math.max(...lines.map((l) => ctx!.measureText(l).width))
      }
      while (px > minPx && widest() > maxW) {
        px -= 2
        lines = splitName(model.name, `700 ${px}px ${F_DISPLAY}`, maxW)
      }
      setTracking(TRACK_TITLE_LETTER, "0px")
      ctx!.font = `700 ${px}px ${F_DISPLAY}`
      ctx!.fillStyle = ink
      lines.forEach((l, i) => ctx!.fillText(l, x, yTop + px * 0.8 + i * px * lh))
      setTracking("0px", "0px")
      return { bottom: yTop + px * 0.8 + (lines.length - 1) * px * lh, px }
    }

    // Helper: Text Wrapping
    function wrapText(text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines = 4) {
      const words = text.split(" ")
      let line = ""
      let lineCount = 0

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + " "
        const metrics = ctx!.measureText(testLine)
        const testWidth = metrics.width
        if (testWidth > maxWidth && n > 0) {
          ctx!.fillText(line.trim(), x, y)
          line = words[n] + " "
          y += lineHeight
          lineCount++
          if (lineCount >= maxLines - 1 && n < words.length - 1) {
            ctx!.fillText(line.trim() + "…", x, y)
            return y + lineHeight
          }
        } else {
          line = testLine
        }
      }
      ctx!.fillText(line.trim(), x, y)
      return y + lineHeight
    }

    // Shrink font size until text fits maxWidth (long model names).
    // Sets ctx.font as a side effect and returns the fitted size.
    function fitFont(weight: number, family: string, baseSize: number, text: string, maxWidth: number, minSize = 12) {
      let size = baseSize
      ctx!.font = `${weight} ${size}px ${family}`
      while (size > minSize && ctx!.measureText(text).width > maxWidth) {
        size -= 2
        ctx!.font = `${weight} ${size}px ${family}`
      }
      return size
    }

    // Letter/word tracking (wordSpacing needs a guarded write for older canvas)
    function setTracking(letter: string, word: string) {
      try {
        if (ctx && "letterSpacing" in ctx) ctx!.letterSpacing = letter
        if (ctx && "wordSpacing" in ctx)
          (ctx as CanvasRenderingContext2D & { wordSpacing?: string }).wordSpacing = word
      } catch {
        // Older canvas: tracking unsupported, fall through to default spacing
      }
    }

    // LANDSCAPE 1200x675: two-column editorial. 60% model identity left,
    // 40% specifications right. The right column centers on the left
    // block; a 1px hairline floats between them, touching no frame rule.
    function drawLandscape() {
      const rule = masthead(112, 30, 22, 19)
      const footRuleY = height - padding - 44
      // 60/40 split of the 1080 content width, with a gutter the columns
      // never enter: identity ends at 708, specifications start at 792.
      const leftW = 648
      const divX = 750
      const rightX = 792
      const rightW = width - padding - rightX

      // LEFT: provider/category, hero name, short description.
      const kickSize = fitFont(500, F_SANS, 20, classLine, leftW, 16)
      ctx!.font = `500 ${kickSize}px ${F_SANS}`
      ctx!.fillStyle = muted
      ctx!.fillText(classLine, padding, rule + 76)
      const { bottom: nameBottom, px: titlePx } = drawName(96, 56, padding, rule + 106, leftW, 1.04)
      ctx!.font = `400 25px ${F_SANS}`
      ctx!.fillStyle = muted
      const descEnd = wrapText(model.highlight, padding, nameBottom + 50, leftW, 36, 2)
      const leftTop = rule + 60
      const leftCenter = (leftTop + descEnd) / 2

      // RIGHT: benchmark hero at 55% of the fitted title, then the
      // specification rows. Measured first so the block can center on
      // the left column instead of hanging from the top.
      const benchPx = fitFont(700, F_DISPLAY, Math.round(titlePx * 0.55), sigBig, rightW, 32)
      const rSpecs: string[] = []
      if (sigKind !== "context") rSpecs.push(`${ctxShort} context`)
      if (sigKind !== "price") rSpecs.push(priceFull)
      rSpecs.push(model.license)
      rSpecs.push(model.modalities.join(" · "))
      const specLines = rSpecs.slice(0, 4).map((line) => ({
        line,
        px: fitFont(500, F_SANS, 22, line, rightW, 16),
      }))
      const specsSpan = specLines.reduce((acc, s) => acc + s.px + 14, 0) - 14
      // Evidence unit: figure, label, optional variant line. Specs start
      // off the unit's last line so one break separates evidence from data.
      const unitExtra = benchVariant ? 32 : 0
      const blockH = benchPx * 0.8 + 40 + unitExtra + 40 + specsSpan + 6
      let blockTop = leftCenter - blockH / 2
      if (blockTop < rule + 32) blockTop = rule + 32
      if (blockTop + blockH > footRuleY - 32) blockTop = footRuleY - 32 - blockH
      const benchBase = blockTop + benchPx * 0.8
      ctx!.font = `700 ${benchPx}px ${F_DISPLAY}`
      ctx!.fillStyle = ink
      ctx!.fillText(sigBig, rightX, benchBase)
      ctx!.font = `500 22px ${F_SANS}`
      ctx!.fillStyle = muted
      ctx!.fillText(sigSmall, rightX, benchBase + 40)
      let ry = benchBase + 40 + unitExtra + 40
      if (benchVariant) {
        ctx!.font = `500 18px ${F_SANS}`
        ctx!.fillStyle = faint
        ctx!.fillText(benchVariant, rightX, benchBase + 40 + 32)
      }
      for (const { line, px } of specLines) {
        ctx!.font = `500 ${px}px ${F_SANS}`
        ctx!.fillStyle = ink
        ctx!.fillText(line, rightX, ry)
        ry += px + 14
      }

      // Divider spans the union of both columns plus a little air, clamped
      // off both frame rules so it separates without gridding.
      const divTop = Math.max(Math.min(leftTop, blockTop) - 12, rule + 24)
      const divBottom = Math.min(Math.max(descEnd, blockTop + blockH) + 12, footRuleY - 24)
      ctx!.strokeStyle = hair
      ctx!.lineWidth = 1
      ctx!.beginPath()
      ctx!.moveTo(divX, divTop)
      ctx!.lineTo(divX, divBottom)
      ctx!.stroke()
      folioFooter()
    }

    // SQUARE 1080x1080: vertical dossier. Masthead, provider, name,
    // one standout figure, compact strip, folio.
    function drawSquare() {
      const rule = masthead(140, 30, 22, 19)
      const kickSize = fitFont(500, F_SANS, 20, classLine, contentWidth, 16)
      ctx!.font = `500 ${kickSize}px ${F_SANS}`
      ctx!.fillStyle = muted
      // The identity block sits slightly high; everything below anchors to
      // its unshifted position so no other element moves.
      const shiftUp = 20
      ctx!.fillText(classLine, padding, rule + 106 - shiftUp)
      const { bottom: shiftedBottom, px: titlePx } = drawName(124, 64, padding, rule + 141 - shiftUp, contentWidth, 1.04)
      const nameBottom = shiftedBottom + shiftUp
      // Evidence figure at 55% of the fitted hero: supporting evidence,
      // never a second headline.
      const sigPx = fitFont(700, F_DISPLAY, Math.round(titlePx * 0.55), sigBig, contentWidth, 40)
      ctx!.font = `700 ${sigPx}px ${F_DISPLAY}`
      ctx!.fillStyle = ink
      // Cap-top gap holds at 36 whatever the fitted figure size is.
      const sigY = nameBottom + Math.round(sigPx * 0.8) + 36
      ctx!.fillText(sigBig, padding, sigY)
      ctx!.font = `500 28px ${F_SANS}`
      ctx!.fillStyle = muted
      ctx!.fillText(sigSmall, padding, sigY + 44)
      let unitBottom = sigY + 44
      if (benchVariant) {
        ctx!.font = `500 24px ${F_SANS}`
        ctx!.fillStyle = faint
        ctx!.fillText(benchVariant, padding, sigY + 44 + 32)
        unitBottom = sigY + 44 + 32
      }
      const specBits: string[] = []
      if (sigKind !== "context") specBits.push(`${ctxShort} context`)
      if (sigKind !== "price") specBits.push(priceFull)
      specBits.push(model.license)
      const specLine = specBits.join("  ·  ")
      const modeLine = model.modalities.join("  ·  ")
      const s1 = fitFont(600, F_SANS, 28, specLine, contentWidth, 18)
      ctx!.font = `600 ${s1}px ${F_SANS}`
      ctx!.fillStyle = ink
      const stripY = unitBottom + 60
      ctx!.fillText(specLine, padding, stripY)
      const s2 = fitFont(500, F_SANS, 28, modeLine, contentWidth, 18)
      ctx!.font = `500 ${s2}px ${F_SANS}`
      ctx!.fillStyle = muted
      ctx!.fillText(modeLine, padding, stripY + s1 + 12)
      folioFooter()
    }

    // PORTRAIT 1080x1920: magazine cover. Big identity up top with air
    // around it, structured specification in the lower third.
    function drawStory() {
      const rule = masthead(150, 34, 24, 20, 8)
      // The whole content group sits slightly high; everything below the
      // name derives from nameBottom, so internal spacing is untouched.
      const liftGroup = 56
      const kickSize = fitFont(500, F_SANS, 20, classLine, contentWidth, 16)
      ctx!.font = `500 ${kickSize}px ${F_SANS}`
      ctx!.fillStyle = muted
      ctx!.fillText(classLine, padding, rule + 132 - liftGroup)
      const { bottom: nameBottom, px: titlePx } = drawName(150, 72, padding, rule + 176 - liftGroup, contentWidth, 1.04)
      // Evidence figure at 55% of the fitted hero: supporting evidence,
      // never a second headline.
      const sigPx = fitFont(700, F_DISPLAY, Math.round(titlePx * 0.55), sigBig, contentWidth, 40)
      ctx!.font = `700 ${sigPx}px ${F_DISPLAY}`
      ctx!.fillStyle = ink
      // Cap-top gap holds at 64 whatever the fitted figure size is, so the
      // benchmark reads as its own piece of information, never as a
      // second line of the title.
      // Description follows the title directly; the evidence unit sits
      // below the description so the title owns the top of the card.
      ctx!.font = `400 28px ${F_SANS}`
      ctx!.fillStyle = muted
      const descEnd = wrapText(model.highlight, padding, nameBottom + 64, contentWidth, 40, 3)
      const sigY = descEnd + 48 + Math.round(sigPx * 0.8)
      ctx!.font = `700 ${sigPx}px ${F_DISPLAY}`
      ctx!.fillStyle = ink
      ctx!.fillText(sigBig, padding, sigY)
      ctx!.font = `500 28px ${F_SANS}`
      ctx!.fillStyle = muted
      ctx!.fillText(sigSmall, padding, sigY + 40)
      let unitBottom = sigY + 40
      if (benchVariant) {
        ctx!.font = `500 24px ${F_SANS}`
        ctx!.fillStyle = faint
        ctx!.fillText(benchVariant, padding, sigY + 40 + 34)
        unitBottom = sigY + 40 + 34
      }
      const rows: [string, string][] = [
        ["CONTEXT", ctxShort],
        model.openWeights ? ["WEIGHTS", "Open weights"] : ["API", priceFull],
        ["LICENSE", model.license],
        benchPick
          ? ["BENCHMARK", `${benchPretty(benchPick[0])} ${benchScore}`]
          : ["STATUS", model.statusBadge],
      ]
      let ry = unitBottom + 64
      for (const [label, value] of rows) {
        ctx!.font = `500 22px ${F_SANS}`
        ctx!.fillStyle = faint
        ctx!.fillText(label, padding, ry + 28)
        const labelW = ctx!.measureText(label).width
        const vSize = fitFont(600, F_SANS, 30, value, contentWidth - labelW - 40, 20)
        ctx!.font = `600 ${vSize}px ${F_SANS}`
        ctx!.fillStyle = ink
        const vw = ctx!.measureText(value).width
        ctx!.fillText(value, width - padding - vw, ry + 30)
        ry += 66
      }
      folioFooter()
    }

    // Dispatch to the art-directed composition for this format.
    if (ratio === "landscape") drawLandscape()
    else if (ratio === "square") drawSquare()
    else drawStory()
    } catch {
      // Never let a canvas failure crash the page - surface a fallback instead.
      setRenderError("Preview failed to render on this device - export actions below remain available.")
    } finally {
      setIsRendering(false)
    }
  }, [model, ratio, cardTheme, company, folio, folioId])

  useEffect(() => {
    if (!isOpen) return
    let cancelled = false

    // Wait for site webfonts before first paint, then redraw once more when
    // late fonts arrive (prevents fallback-font flash baked into the export)
    const render = async () => {
      try {
        await ensureCardFonts()
      } catch {
        // Offline / blocked fonts - fall through to system fallbacks
      }
      if (!cancelled) drawCard()
    }

    const timer = setTimeout(render, 50)
    const redrawOnFontReady = () => {
      if (!cancelled) drawCard()
    }
    try {
      document.fonts?.ready?.then?.(redrawOnFontReady)?.catch?.(() => {})
    } catch {
      // Older browsers without the FontFaceSet API - initial render stands.
    }

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [isOpen, drawCard])

  // 4. Copy Markdown Badge
  const handleCopyBadge = () => {
    try {
      const badgeMarkdown = `[![ModelRegistry: ${model.name}](https://modelregistry.tirup.in/api/badge?model=${model.id})](https://modelregistry.tirup.in/?model=${model.id})`
      navigator.clipboard.writeText(badgeMarkdown)
      setIsBadgeCopied(true)
      setTimeout(() => setIsBadgeCopied(false), 2000)
    } catch {
      // Clipboard unavailable - no-op instead of a crash.
    }
  }

  // Fullscreen zoom preview - snapshots the 1x export so small text reads
  // clearly. Capture-phase listener so Esc closes only the zoom, not the
  // parent model popup behind it.
  const openZoom = () => {
    try {
      const out = getExportCanvas()
      if (!out) return
      setZoomSrc(out.toDataURL("image/png"))
      setIsZoomed(true)
    } catch {
      // Snapshot unavailable - leave the inline preview as-is.
    }
  }
  const closeZoom = () => {
    setIsZoomed(false)
    setZoomSrc(null)
  }

  useEffect(() => {
    if (!isZoomed) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation()
        closeZoom()
      }
    }
    window.addEventListener("keydown", onKey, true)
    return () => window.removeEventListener("keydown", onKey, true)
  }, [isZoomed])

  // Hooks must run unconditionally - render gating happens after them.
  if (!isOpen) return null

  // Downscale the 2x working canvas to exact export dimensions
  // (1080 / 1200 wide) with high-quality filtering
  function getExportCanvas(): HTMLCanvasElement | null {
    try {
      const src = canvasRef.current
      if (!src || src.width === 0 || src.height === 0) return null
      const out = document.createElement("canvas")
      out.width = Math.round(src.width / 2)
      out.height = Math.round(src.height / 2)
      const octx = out.getContext("2d")
      if (!octx) return null
      octx.imageSmoothingEnabled = true
      octx.imageSmoothingQuality = "high"
      octx.drawImage(src, 0, 0, out.width, out.height)
      return out
    } catch {
      return null
    }
  }

  // 1. Download as PNG
  const handleDownload = () => {
    let link: HTMLAnchorElement | null = null
    try {
      const canvas = getExportCanvas()
      if (!canvas) return
      link = document.createElement("a")
      link.download = `modelregistry-${model.id}-${ratio}.png`
      link.href = canvas.toDataURL("image/png")
      // Firefox ignores programmatic clicks on detached anchors.
      document.body.appendChild(link)
      link.click()
    } catch {
      // Canvas export unavailable on this device - no-op instead of a crash.
    } finally {
      try {
        link?.remove()
      } catch {
        // Detach best-effort only.
      }
    }
  }

  // 2. Copy Image to Clipboard
  const handleCopyImage = async () => {
    const fallbackCopyLink = () => {
      try {
        navigator.clipboard.writeText(`https://modelregistry.tirup.in/?model=${model.id}`)
      } catch {
        // Clipboard unavailable - still flip the confirmation state.
      }
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    }
    try {
      const canvas = getExportCanvas()
      if (!canvas) {
        fallbackCopyLink()
        return
      }
      const blob: Blob | null = await new Promise((resolve) => {
        try {
          canvas.toBlob(resolve)
        } catch {
          resolve(null)
        }
      })
      if (!blob || typeof ClipboardItem === "undefined" || !navigator.clipboard?.write) {
        fallbackCopyLink()
        return
      }
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch {
      // Fallback: Copy link
      fallbackCopyLink()
    }
  }

  // 3. Web Share API (Native mobile share to Instagram Stories/WhatsApp)
  const handleNativeShare = async () => {
    try {
      const canvas = getExportCanvas()
      if (!canvas) return
      const blob: Blob | null = await new Promise((resolve) => {
        try {
          canvas.toBlob(resolve)
        } catch {
          resolve(null)
        }
      })
      if (!blob) {
        handleDownload()
        return
      }
      let file: File
      try {
        file = new File([blob], `${model.id}-${ratio}.png`, { type: "image/png" })
      } catch {
        handleDownload()
        return
      }
      try {
        if (typeof navigator.share === "function" && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
          await navigator.share({
            title: `${model.name} - ModelRegistry Specification`,
            text: `Verified specifications & benchmarks for ${model.name} (${company?.name || model.companyName}).`,
            files: [file],
          })
          return
        }
      } catch (e) {
        // User cancelled the share sheet - stay silent. Anything else falls
        // through to a plain download so the tap never appears dead.
        if (e instanceof DOMException && e.name === "AbortError") return
      }
      handleDownload()
    } catch {
      handleDownload()
    }
  }

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto overscroll-contain bg-black/60 backdrop-blur-md animate-in fade-in duration-150">
      <div className="min-h-full flex justify-center p-2 sm:p-5">
      <div
        className="relative m-auto w-full max-w-4xl max-h-[95dvh] flex flex-col md:flex-row bg-[#f7f7f4] dark:bg-[#0d0f13] border border-black/10 dark:border-white/[0.09] rounded-xl shadow-2xl overflow-y-auto overscroll-contain md:overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Side: Canvas Preview */}
        <div className="shrink-0 md:shrink flex flex-col items-center justify-center p-3 sm:p-6 bg-black/[0.02] dark:bg-[#07080a] border-b md:border-b-0 md:border-r border-black/10 dark:border-white/[0.08] min-h-[200px] md:min-h-[300px] md:flex-1 overflow-hidden">
          <div
            onClick={openZoom}
            title="Click to view full size"
            className="relative w-full h-full flex items-center justify-center max-h-[32vh] sm:max-h-[48vh] md:max-h-[75vh] cursor-zoom-in group/preview"
          >
            <canvas
              ref={canvasRef}
              className="max-h-full max-w-full object-contain rounded shadow-lg border border-black/10 dark:border-white/[0.08] transition-opacity duration-200"
              style={{
                aspectRatio: ratio === "story" ? "9/16" : ratio === "square" ? "1/1" : "16/9",
              }}
            />
            <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-black/60 text-white text-[10px] font-sans opacity-0 group-hover/preview:opacity-100 transition-opacity pointer-events-none">
              <ZoomIn size={11} /> EXPAND
            </span>
          </div>
          <span className="text-[10px] sm:text-[11px] font-sans text-black/40 dark:text-zinc-500 mt-2 sm:mt-3 text-center px-2">
            Previewing {ratio === "story" ? "1080×1920 (Story)" : ratio === "square" ? "1080×1080 (Square)" : "1200×675 (Landscape)"} • High-DPI 2x • Click image to expand
          </span>
          {renderError && (
            <span className="text-[11px] font-sans text-amber-600 dark:text-amber-400 mt-1.5 text-center px-4 leading-relaxed">
              {renderError}
            </span>
          )}
        </div>

        {/* Right Side: Studio Controls & Export (panel scrolls on mobile) */}
        <div className="w-full md:w-80 p-4 sm:p-6 pb-[max(1rem,env(safe-area-inset-bottom))] flex flex-col justify-between bg-white dark:bg-[#0d0f13] md:overflow-y-auto md:overscroll-contain md:max-h-none touch-scroll">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-black/10 dark:border-white/[0.08] mb-4 sm:mb-5">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-[#ff5d2e]" />
                <h3 className="text-sm font-medium tracking-tight text-black dark:text-white">
                  Social Card Studio
                </h3>
              </div>
              <button
                onClick={onClose}
                aria-label="Close share studio"
                className="p-1 rounded text-black/40 dark:text-zinc-500 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Format / Aspect Ratio Selector */}
            <div className="mb-5">
              <label className="text-[11px] font-sans uppercase tracking-wider text-black/40 dark:text-zinc-400 block mb-2 font-medium">
                FORMAT & RATIO
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-lg bg-black/[0.03] dark:bg-white/[0.04] border border-black/5 dark:border-white/[0.06]">
                <button
                  onClick={() => setRatio("story")}
                  className={`px-2.5 py-2 rounded text-xs font-sans transition-colors cursor-pointer flex flex-col items-center gap-1 ${
                    ratio === "story"
                      ? "bg-black text-white dark:bg-white dark:text-black font-medium shadow-xs"
                      : "text-black/60 dark:text-zinc-400 hover:text-black dark:hover:text-white"
                  }`}
                >
                  <span>9:16</span>
                  <span className="text-[11px] opacity-70">Story</span>
                </button>
                <button
                  onClick={() => setRatio("square")}
                  className={`px-2.5 py-2 rounded text-xs font-sans transition-colors cursor-pointer flex flex-col items-center gap-1 ${
                    ratio === "square"
                      ? "bg-black text-white dark:bg-white dark:text-black font-medium shadow-xs"
                      : "text-black/60 dark:text-zinc-400 hover:text-black dark:hover:text-white"
                  }`}
                >
                  <span>1:1</span>
                  <span className="text-[11px] opacity-70">Square</span>
                </button>
                <button
                  onClick={() => setRatio("landscape")}
                  className={`px-2.5 py-2 rounded text-xs font-sans transition-colors cursor-pointer flex flex-col items-center gap-1 ${
                    ratio === "landscape"
                      ? "bg-black text-white dark:bg-white dark:text-black font-medium shadow-xs"
                      : "text-black/60 dark:text-zinc-400 hover:text-black dark:hover:text-white"
                  }`}
                >
                  <span>16:9</span>
                  <span className="text-[11px] opacity-70">Post</span>
                </button>
              </div>
            </div>

            {/* Card Theme Palette */}
            <div className="mb-6">
              <label className="text-[11px] font-sans uppercase tracking-wider text-black/40 dark:text-zinc-400 block mb-2 font-medium">
                CARD PALETTE
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    userPickedTheme.current = true
                    setCardTheme("dark")
                  }}
                  className={`p-2.5 rounded-md border text-xs font-sans flex items-center justify-between cursor-pointer transition-colors ${
                    cardTheme === "dark"
                      ? "border-[#ff5d2e] bg-black/5 dark:bg-white/[0.06] text-black dark:text-white font-medium"
                      : "border-black/10 dark:border-white/[0.08] text-black/60 dark:text-zinc-400 hover:border-black/30 dark:hover:border-white/20"
                  }`}
                >
                  <span>Obsidian Noir</span>
                  <span className="w-3.5 h-3.5 rounded-full bg-[#07080a] border border-white/20 shrink-0" />
                </button>
                <button
                  onClick={() => {
                    userPickedTheme.current = true
                    setCardTheme("light")
                  }}
                  className={`p-2.5 rounded-md border text-xs font-sans flex items-center justify-between cursor-pointer transition-colors ${
                    cardTheme === "light"
                      ? "border-[#ff5d2e] bg-black/5 dark:bg-white/[0.06] text-black dark:text-white font-medium"
                      : "border-black/10 dark:border-white/[0.08] text-black/60 dark:text-zinc-400 hover:border-black/30 dark:hover:border-white/20"
                  }`}
                >
                  <span>Vellum Archival</span>
                  <span className="w-3.5 h-3.5 rounded-full bg-[#f7f7f4] border border-black/20 shrink-0" />
                </button>
              </div>
            </div>
          </div>

          {/* Export Action Buttons */}
          <div className="space-y-2 pt-4 border-t border-black/10 dark:border-white/[0.08]">
            {/* Copy Image Button */}
            <button
              onClick={handleCopyImage}
              disabled={isRendering}
              className="w-full py-2.5 px-3.5 rounded-md bg-black text-white dark:bg-white dark:text-black font-sans text-xs font-medium hover:bg-[#ff5d2e] dark:hover:bg-[#ff5d2e] dark:hover:text-white transition-colors duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              {isCopied ? (
                <>
                  <Check size={14} className="text-[#00e599]" />
                  <span>COPIED IMAGE TO CLIPBOARD</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>COPY IMAGE (CTRL+V ON X/LINKEDIN)</span>
                </>
              )}
            </button>

            {/* Download PNG Button */}
            <button
              onClick={handleDownload}
              disabled={isRendering}
              className="w-full py-2.5 px-3.5 rounded-md border border-black/10 dark:border-white/[0.09] text-black dark:text-zinc-200 font-sans text-xs font-medium hover:border-[#ff5d2e] hover:text-[#ff5d2e] transition-colors duration-150 flex items-center justify-center gap-2 cursor-pointer bg-black/[0.015] dark:bg-white/[0.03]"
            >
              <Download size={14} />
              <span>DOWNLOAD PNG ({ratio.toUpperCase()})</span>
            </button>

            {/* Native Mobile Share (if supported) */}
            <button
              onClick={handleNativeShare}
              className="w-full py-2 px-3 rounded text-[11px] font-sans text-black/55 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Share2 size={12} />
              <span>Share to Instagram Story / Apps</span>
            </button>

            {/* GitHub README Badge Option */}
            <button
              onClick={handleCopyBadge}
              className="w-full py-2 px-3 rounded border border-dashed border-black/10 dark:border-white/[0.08] text-[11px] font-sans text-black/55 dark:text-zinc-400 hover:border-[#ff5d2e]/40 hover:text-[#ff5d2e] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isBadgeCopied ? (
                <>
                  <Check size={12} className="text-[#00e599]" />
                  <span>BADGE MARKDOWN COPIED</span>
                </>
              ) : (
                <>
                  <Code2 size={12} />
                  <span>Copy GitHub README Badge Markdown</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      </div>

      {/* Fullscreen zoom overlay (stops propagation so parent popup stays open) */}
      {isZoomed && zoomSrc && (
        <div
          className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-sm overflow-auto overscroll-contain flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-150"
          onClick={(e) => {
            e.stopPropagation()
            closeZoom()
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- renders a canvas data: URL; next/image can't optimize those */}
          <img
            src={zoomSrc}
            alt={`${model.name} share card full-size preview`}
            className="max-h-[92vh] max-w-[94vw] object-contain rounded-lg shadow-2xl"
          />
          <span className="fixed top-4 right-4 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white/10 text-white text-[11px] font-sans pointer-events-none">
            <X size={12} /> ESC / CLICK TO CLOSE
          </span>
        </div>
      )}
    </div>
  )
}

/**
 * Render-time safety net for the share studio. A throw anywhere inside the
 * canvas modal used to unmount the whole page into Next.js's generic
 * "Application error" screen; now it degrades to this inline card carrying
 * the actual message, with retry and close actions.
 */
class ShareCardErrorBoundary extends React.Component<
  { onClose: () => void; onRetry: () => void; children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { onClose: () => void; onRetry: () => void; children: React.ReactNode }) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error("[share-card] render failed:", error)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    return (
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
        onClick={this.props.onClose}
      >
        <div
          className="w-full max-w-sm rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0d0f13] p-5 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-sm font-sans font-medium text-black dark:text-white">
            Share preview could not be rendered
          </h3>
          <p className="mt-2 text-xs font-sans leading-relaxed text-black/60 dark:text-zinc-400 break-words">
            {error.message || "Unknown rendering error."}
          </p>
          <div className="mt-4 flex gap-2">
            <button
              onClick={this.props.onRetry}
              className="flex-1 py-2 px-3 rounded-md bg-black text-white dark:bg-white dark:text-black font-sans text-xs font-medium hover:bg-[#ff5d2e] dark:hover:bg-[#ff5d2e] dark:hover:text-white transition-colors cursor-pointer"
            >
              TRY AGAIN
            </button>
            <button
              onClick={this.props.onClose}
              className="flex-1 py-2 px-3 rounded-md border border-black/10 dark:border-white/10 font-sans text-xs font-medium text-black/70 dark:text-zinc-300 hover:border-[#ff5d2e] hover:text-[#ff5d2e] transition-colors cursor-pointer"
            >
              CLOSE
            </button>
          </div>
        </div>
      </div>
    )
  }
}

export function ShareCardModal(props: ShareCardModalProps) {
  const [attempt, setAttempt] = useState(0)
  const wasOpen = useRef(false)

  useEffect(() => {
    if (props.isOpen && !wasOpen.current) {
      // Fresh mount of the canvas modal on every open: clean preview state
      // and a reset error boundary.
      wasOpen.current = true
      setAttempt((a) => a + 1)
    } else if (!props.isOpen) {
      wasOpen.current = false
    }
  }, [props.isOpen])

  if (!props.isOpen) return null

  return (
    <ShareCardErrorBoundary
      key={attempt}
      onClose={props.onClose}
      onRetry={() => setAttempt((a) => a + 1)}
    >
      <ShareCardModalInner {...props} />
    </ShareCardErrorBoundary>
  )
}
