"use client"

import React, { useEffect, useRef, useState, useCallback } from "react"
import { type ModelItem } from "@/data/models"
import { companies } from "@/data/companies"
import { formatPrice } from "@/lib/utils"
import { Download, Copy, Share2, Check, X, Sparkles, Code2, Layers, ZoomIn } from "lucide-react"

interface ShareCardModalProps {
  model: ModelItem
  isOpen: boolean
  onClose: () => void
}

type AspectRatio = "story" | "square" | "landscape"
type ThemeMode = "dark" | "light"

export function ShareCardModal({ model, isOpen, onClose }: ShareCardModalProps) {
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
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomSrc, setZoomSrc] = useState<string | null>(null)

  // Default card palette follows the viewer's site theme (light → Vellum
  // Archival, dark → Obsidian Noir) and tracks live theme toggles while open.
  // Initial "dark" keeps server/client first render identical (no hydration
  // mismatch); the effect below corrects it on mount before first paint.
  useEffect(() => {
    const syncTheme = () => {
      setCardTheme(document.documentElement.classList.contains("dark") ? "dark" : "light")
    }
    syncTheme()
    const observer = new MutationObserver(syncTheme)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  const company = companies[model.companyId]
  const accentColor = company?.accentColor || "#ff5d2e"

  // Site type system — must match app/layout.tsx (next/font):
  // Display = Space Grotesk, Body/labels = Plus Jakarta Sans.
  // Canvas can only use document-loaded fonts, so every render is preceded
  // by ensureCardFonts() (document.fonts.load + fonts.ready).
  const F_DISPLAY = '"Space Grotesk", "Plus Jakarta Sans", sans-serif'
  const F_SANS = '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif'
  const F_MONO = '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif'

  // next/font serves: Sans 300-700, Display 400-700.
  // Tracking: card text felt congested — open letter/word spacing a touch.
  const TRACK_LETTER = "0.02em"
  const TRACK_WORD = "0.06em"
  const TRACK_TITLE_LETTER = "-0.01em"
  async function ensureCardFonts() {
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

    const isDark = cardTheme === "dark"
    const bgColor = isDark ? "#07080a" : "#f7f7f4"
    const cardSurface = isDark ? "#0d0f13" : "#ffffff"
    const textColor = isDark ? "#f4f5f7" : "#111215"
    const textMuted = isDark ? "rgba(244, 245, 247, 0.72)" : "rgba(17, 18, 21, 0.74)"
    const textDim = isDark ? "rgba(244, 245, 247, 0.5)" : "rgba(17, 18, 21, 0.6)"
    const borderColor = isDark ? "rgba(255, 255, 255, 0.16)" : "rgba(0, 0, 0, 0.15)"

    // 1. Clear & Background Fill
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, width, height)

    // 2. Subtle Ambient Glow
    const gradient = ctx.createRadialGradient(
      width * 0.5,
      height * 0.18,
      20,
      width * 0.5,
      height * 0.18,
      width * 0.55
    )
    gradient.addColorStop(0, accentColor + (isDark ? "22" : "15"))
    gradient.addColorStop(1, "transparent")
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    // Layout Padding
    const padding = ratio === "landscape" ? 64 : 80
    const contentWidth = width - padding * 2

    // Helper: Rounded Rectangle
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

    // Truncate with ellipsis to fit maxWidth (uses currently-set font)
    function ellipsis(text: string, maxWidth: number) {
      if (ctx!.measureText(text).width <= maxWidth) return text
      let t = text
      while (t.length > 1 && ctx!.measureText(t + "…").width > maxWidth) t = t.slice(0, -1)
      return t + "…"
    }

    // Letter/word tracking (wordSpacing needs a guarded write for older canvas)
    function setTracking(letter: string, word: string) {
      try {
        ctx!.letterSpacing = letter
        ;(ctx as CanvasRenderingContext2D & { wordSpacing?: string }).wordSpacing = word
      } catch {
        // Older canvas: tracking unsupported, fall through to default spacing
      }
    }

    setTracking(TRACK_LETTER, TRACK_WORD)

    let curY = padding

    // 3. Top Header / Brand (seated close to the divider, slightly larger)
    const brandSize = ratio === "landscape" ? 26 : 28
    const brandBaseline = curY + (ratio === "landscape" ? 32 : 42)
    ctx.font = `700 ${brandSize}px ${F_DISPLAY}`
    ctx.fillStyle = textColor
    ctx.fillText("Model", padding, brandBaseline)
    const brandWidth = ctx.measureText("Model").width
    ctx.fillStyle = "#ff5d2e"
    ctx.fillText("Registry", padding + brandWidth, brandBaseline)

    // Top Sub-tag
    const tagSize = ratio === "landscape" ? 14 : 15
    ctx.font = `500 ${tagSize}px ${F_MONO}`
    ctx.fillStyle = textMuted
    const tagText = "OPEN FRONTIER AI SPECIFICATION"
    const tagWidth = ctx.measureText(tagText).width
    ctx.fillText(tagText, width - padding - tagWidth, brandBaseline - 2)

    curY += ratio === "landscape" ? 54 : 74

    // Hairline Divider
    ctx.strokeStyle = borderColor
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(padding, curY)
    ctx.lineTo(width - padding, curY)
    ctx.stroke()

    curY += ratio === "landscape" ? 38 : 60

    // 4. Laboratory Tag & Status Badge
    // Lab Dot
    ctx.fillStyle = accentColor
    ctx.beginPath()
    ctx.arc(padding + 7, curY + 7, 7, 0, Math.PI * 2)
    ctx.fill()

    ctx.font = `600 16px ${F_MONO}`
    ctx.fillStyle = textMuted
    ctx.fillText(company ? company.name.toUpperCase() : model.companyName.toUpperCase(), padding + 24, curY + 13)

    // Status Pill
    const badgeText = model.statusBadge
    ctx.font = `600 12px ${F_MONO}`
    const badgeMetrics = ctx.measureText(badgeText)
    const pillW = badgeMetrics.width + 20
    const pillX = width - padding - pillW
    roundRect(pillX, curY - 5, pillW, 26, 4, accentColor + "18", accentColor + "60")
    ctx.fillStyle = accentColor
    ctx.fillText(badgeText, pillX + 10, curY + 12)

    curY += ratio === "landscape" ? 44 : 54

    // 5. Model Name (auto-fit: long names shrink instead of overflowing)
    const titleBase = ratio === "story" ? 76 : ratio === "square" ? 54 : 46
    const titleSize = fitFont(700, F_DISPLAY, titleBase, model.name, contentWidth)
    ctx.font = `700 ${titleSize}px ${F_DISPLAY}`
    ctx.fillStyle = textColor
    setTracking(TRACK_TITLE_LETTER, TRACK_WORD)
    ctx.fillText(model.name, padding, curY + titleSize * 0.8)
    setTracking(TRACK_LETTER, TRACK_WORD)

    curY += titleSize + (ratio === "story" ? 40 : ratio === "square" ? 28 : 18)

    // 6. Highlight / Description
    const descSize = ratio === "story" ? 26 : ratio === "square" ? 21 : 17
    ctx.font = `400 ${descSize}px ${F_SANS}`
    ctx.fillStyle = textMuted
    curY = wrapText(
      model.highlight,
      padding,
      curY,
      contentWidth,
      descSize * 1.5,
      ratio === "landscape" ? 2 : 4
    )

    curY += ratio === "story" ? 54 : ratio === "square" ? 36 : 20

    // 7. Hardware Specs Cards Grid
    const specCols = 3
    const specGap = ratio === "story" ? 20 : 16
    const specCardW = (contentWidth - specGap * (specCols - 1)) / specCols
    const specCardH = ratio === "story" ? 130 : ratio === "square" ? 96 : 78

    const specs = [
      { label: "CONTEXT WINDOW", value: model.contextWindow.replace(" tokens", "") },
      { label: "ARCHITECTURE", value: model.parameters },
      {
        label: model.pricingUnit ? "OFFICIAL API" : "OFFICIAL API / 1M",
        value: formatPrice(model),
      },
    ]

    specs.forEach((s, idx) => {
      const sx = padding + idx * (specCardW + specGap)
      roundRect(sx, curY, specCardW, specCardH, 8, cardSurface, borderColor)

      ctx.font = `600 ${ratio === "story" ? 13 : 11}px ${F_MONO}`
      ctx.fillStyle = textDim
      ctx.fillText(s.label, sx + 20, curY + (ratio === "story" ? 36 : 28))

      ctx.font = `700 ${ratio === "story" ? 22 : 16}px ${F_SANS}`
      ctx.fillStyle = textColor
      ctx.fillText(ellipsis(s.value, specCardW - 40), sx + 20, curY + (ratio === "story" ? 82 : ratio === "square" ? 64 : 54))
    })

    curY += specCardH + (ratio === "story" ? 54 : ratio === "square" ? 36 : 20)

    // 8. Verified Benchmarks (if available)
    const benchmarkKeys = Object.entries(model.benchmarks)
    if (benchmarkKeys.length > 0 && ratio !== "landscape") {
      ctx.font = `600 ${ratio === "story" ? 15 : 12}px ${F_MONO}`
      ctx.fillStyle = textDim
      ctx.fillText("VERIFIED RESEARCH BENCHMARKS", padding, curY + 10)
      curY += ratio === "story" ? 34 : 24

      const bCols = Math.min(4, benchmarkKeys.length)
      const bCardW = (contentWidth - specGap * (bCols - 1)) / bCols
      const bCardH = ratio === "story" ? 110 : 74

      benchmarkKeys.slice(0, 4).forEach(([bKey, bVal], idx) => {
        const bx = padding + idx * (bCardW + specGap)
        roundRect(bx, curY, bCardW, bCardH, 6, cardSurface, borderColor)

        const label = bKey === "sweBench" ? "SWE-bench" : bKey === "aime2024" ? "AIME 2024" : bKey === "mmluPro" ? "MMLU-Pro" : "GPQA"
        ctx.font = `500 ${ratio === "story" ? 13 : 11}px ${F_MONO}`
        ctx.fillStyle = textDim
        ctx.fillText(label, bx + 16, curY + (ratio === "story" ? 34 : 24))

        ctx.font = `600 ${ratio === "story" ? 26 : 18}px ${F_MONO}`
        ctx.fillStyle = textColor
        ctx.fillText(String(bVal), bx + 16, curY + (ratio === "story" ? 78 : 54))
      })

      curY += bCardH + (ratio === "story" ? 54 : 36)
    }

    // 9. Modalities & Architecture Certificate Box (in Story mode)
    if (ratio === "story") {
      roundRect(padding, curY, contentWidth, 140, 8, cardSurface, borderColor)

      ctx.font = `600 13px ${F_MONO}`
      ctx.fillStyle = textDim
      ctx.fillText("DEPLOYMENT STANDARD", padding + 24, curY + 38)
      ctx.fillText("LICENSING & WEIGHTS", padding + contentWidth / 2 + 12, curY + 38)

      const halfW = contentWidth / 2 - 48
      ctx.font = `700 18px ${F_SANS}`
      ctx.fillStyle = textColor
      ctx.fillText(ellipsis(model.modalities.join(" • "), halfW), padding + 24, curY + 80)
      ctx.fillText(ellipsis(model.license, halfW), padding + contentWidth / 2 + 12, curY + 80)

      ctx.font = `500 12px ${F_MONO}`
      ctx.fillStyle = accentColor
      ctx.fillText(`Category: ${model.categoryLabel.toUpperCase()}`, padding + 24, curY + 112)
    }

    // 9. Bottom Footer / Watermark Verification (lifted, slightly larger)
    const footerY = height - padding
    ctx.strokeStyle = borderColor
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(padding, footerY - 44)
    ctx.lineTo(width - padding, footerY - 44)
    ctx.stroke()

    // Verified Stamp (darker green on light cards for contrast)
    ctx.font = `600 15px ${F_MONO}`
    ctx.fillStyle = isDark ? "#00e599" : "#00885c"
    ctx.beginPath()
    ctx.arc(padding + 6, footerY - 14, 6, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillText("VERIFIED SOTA RECORD", padding + 20, footerY - 9)

    // Official Registry URL
    const urlText = `modelregistry.tirup.in/?model=${model.id}`
    ctx.font = `500 15px ${F_MONO}`
    ctx.fillStyle = textDim
    const urlW = ctx.measureText(urlText).width
    ctx.fillText(urlText, width - padding - urlW, footerY - 9)

    setIsRendering(false)
  }, [model, ratio, cardTheme, company, accentColor])

  useEffect(() => {
    if (!isOpen) return
    let cancelled = false

    // Wait for site webfonts before first paint, then redraw once more when
    // late fonts arrive (prevents fallback-font flash baked into the export)
    const render = async () => {
      try {
        await ensureCardFonts()
      } catch {
        // Offline / blocked fonts — fall through to system fallbacks
      }
      if (!cancelled) drawCard()
    }

    const timer = setTimeout(render, 50)
    const redrawOnFontReady = () => {
      if (!cancelled) drawCard()
    }
    document.fonts?.ready.then(redrawOnFontReady).catch(() => {})

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [isOpen, drawCard])

  if (!isOpen) return null

  // Downscale the 2x working canvas to exact export dimensions
  // (1080 / 1200 wide) with high-quality filtering
  function getExportCanvas(): HTMLCanvasElement | null {
    const src = canvasRef.current
    if (!src) return null
    const out = document.createElement("canvas")
    out.width = Math.round(src.width / 2)
    out.height = Math.round(src.height / 2)
    const octx = out.getContext("2d")
    if (!octx) return null
    octx.imageSmoothingEnabled = true
    octx.imageSmoothingQuality = "high"
    octx.drawImage(src, 0, 0, out.width, out.height)
    return out
  }

  // 1. Download as PNG
  const handleDownload = () => {
    const canvas = getExportCanvas()
    if (!canvas) return
    const link = document.createElement("a")
    link.download = `modelregistry-${model.id}-${ratio}.png`
    link.href = canvas.toDataURL("image/png")
    link.click()
  }

  // 2. Copy Image to Clipboard
  const handleCopyImage = async () => {
    const canvas = getExportCanvas()
    if (!canvas) return

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ])
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000)
      })
    } catch {
      // Fallback: Copy link
      navigator.clipboard.writeText(`https://modelregistry.tirup.in/?model=${model.id}`)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    }
  }

  // 3. Web Share API (Native mobile share to Instagram Stories/WhatsApp)
  const handleNativeShare = async () => {
    const canvas = getExportCanvas()
    if (!canvas) return

    if (navigator.share) {
      canvas.toBlob(async (blob) => {
        if (!blob) return
        const file = new File([blob], `${model.id}-${ratio}.png`, { type: "image/png" })
        try {
          await navigator.share({
            title: `${model.name} — ModelRegistry Specification`,
            text: `Verified specifications & benchmarks for ${model.name} (${company?.name || model.companyName}).`,
            files: [file],
          })
        } catch {
          // User cancelled
        }
      })
    } else {
      handleDownload()
    }
  }

  // Fullscreen zoom preview — snapshots the 1x export so small text reads
  // clearly. Capture-phase listener so Esc closes only the zoom, not the
  // parent model popup behind it.
  const openZoom = () => {
    const out = getExportCanvas()
    if (!out) return
    setZoomSrc(out.toDataURL("image/png"))
    setIsZoomed(true)
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

  // 4. Copy Markdown Badge
  const handleCopyBadge = () => {
    const badgeMarkdown = `[![ModelRegistry: ${model.name}](https://modelregistry.tirup.in/api/badge?model=${model.id})](https://modelregistry.tirup.in/?model=${model.id})`
    navigator.clipboard.writeText(badgeMarkdown)
    setIsBadgeCopied(true)
    setTimeout(() => setIsBadgeCopied(false), 2000)
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
          <span className="text-[10px] sm:text-[11px] font-sans text-black/40 dark:text-zinc-500 mt-2 sm:mt-3">
            Previewing {ratio === "story" ? "1080×1920 (Story)" : ratio === "square" ? "1080×1080 (Square)" : "1200×675 (Landscape)"} • High-DPI 2x • Click image to expand
          </span>
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
                  onClick={() => setCardTheme("dark")}
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
                  onClick={() => setCardTheme("light")}
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
