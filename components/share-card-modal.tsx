"use client"

import React, { useEffect, useRef, useState, useCallback } from "react"
import { type ModelItem } from "@/data/models"
import { companies } from "@/data/companies"
import { Download, Copy, Share2, Check, X, Sparkles, Code2, Layers } from "lucide-react"

interface ShareCardModalProps {
  model: ModelItem
  isOpen: boolean
  onClose: () => void
}

type AspectRatio = "story" | "square" | "landscape"
type ThemeMode = "dark" | "light"

export function ShareCardModal({ model, isOpen, onClose }: ShareCardModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [ratio, setRatio] = useState<AspectRatio>("story")
  const [cardTheme, setCardTheme] = useState<ThemeMode>("dark")
  const [isCopied, setIsCopied] = useState(false)
  const [isBadgeCopied, setIsBadgeCopied] = useState(false)
  const [isRendering, setIsRendering] = useState(false)

  const company = companies[model.companyId]
  const accentColor = company?.accentColor || "#ff5d2e"

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

    canvas.width = width
    canvas.height = height

    const isDark = cardTheme === "dark"
    const bgColor = isDark ? "#07080a" : "#f7f7f4"
    const cardSurface = isDark ? "#0d0f13" : "#ffffff"
    const textColor = isDark ? "#f4f5f7" : "#111215"
    const textMuted = isDark ? "rgba(244, 245, 247, 0.55)" : "rgba(17, 18, 21, 0.55)"
    const textDim = isDark ? "rgba(244, 245, 247, 0.35)" : "rgba(17, 18, 21, 0.35)"
    const borderColor = isDark ? "rgba(255, 255, 255, 0.09)" : "rgba(0, 0, 0, 0.08)"

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
            ctx!.fillText(line.trim() + "...", x, y)
            return y + lineHeight
          }
        } else {
          line = testLine
        }
      }
      ctx!.fillText(line.trim(), x, y)
      return y + lineHeight
    }

    let curY = padding

    // 3. Top Header / Brand
    ctx.font = "bold 24px -apple-system, BlinkMacSystemFont, sans-serif"
    ctx.fillStyle = textColor
    ctx.fillText("Model", padding, curY + 24)
    const brandWidth = ctx.measureText("Model").width
    ctx.fillStyle = "#ff5d2e"
    ctx.fillText("Registry", padding + brandWidth, curY + 24)

    // Top Sub-tag
    ctx.font = "500 13px monospace"
    ctx.fillStyle = textMuted
    const tagText = "OPEN FRONTIER AI SPECIFICATION"
    const tagWidth = ctx.measureText(tagText).width
    ctx.fillText(tagText, width - padding - tagWidth, curY + 22)

    curY += ratio === "landscape" ? 64 : 90

    // Hairline Divider
    ctx.strokeStyle = borderColor
    ctx.lineWidth = 1
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

    ctx.font = "600 16px monospace"
    ctx.fillStyle = textMuted
    ctx.fillText(company ? company.name.toUpperCase() : model.companyName.toUpperCase(), padding + 24, curY + 13)

    // Status Pill
    const badgeText = model.statusBadge
    ctx.font = "bold 12px monospace"
    const badgeMetrics = ctx.measureText(badgeText)
    const pillW = badgeMetrics.width + 20
    const pillX = width - padding - pillW
    roundRect(pillX, curY - 5, pillW, 26, 4, accentColor + "18", accentColor + "60")
    ctx.fillStyle = accentColor
    ctx.fillText(badgeText, pillX + 10, curY + 12)

    curY += ratio === "landscape" ? 44 : 54

    // 5. Model Name
    const titleSize = ratio === "story" ? 76 : ratio === "square" ? 54 : 46
    ctx.font = `bold ${titleSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
    ctx.fillStyle = textColor
    ctx.letterSpacing = "-0.03em"
    ctx.fillText(model.name, padding, curY + titleSize * 0.8)

    curY += titleSize + (ratio === "story" ? 40 : ratio === "square" ? 28 : 18)

    // 6. Highlight / Description
    const descSize = ratio === "story" ? 26 : ratio === "square" ? 21 : 17
    ctx.font = `300 ${descSize}px -apple-system, BlinkMacSystemFont, sans-serif`
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
        label: "OFFICIAL API / 1M",
        value: `$${model.pricing.input} in / $${model.pricing.output} out${model.openWeights ? " (Open)" : ""}`,
      },
    ]

    specs.forEach((s, idx) => {
      const sx = padding + idx * (specCardW + specGap)
      roundRect(sx, curY, specCardW, specCardH, 8, cardSurface, borderColor)

      ctx.font = `600 ${ratio === "story" ? 13 : 11}px monospace`
      ctx.fillStyle = textDim
      ctx.fillText(s.label, sx + 20, curY + (ratio === "story" ? 36 : 28))

      ctx.font = `bold ${ratio === "story" ? 22 : 16}px -apple-system, BlinkMacSystemFont, sans-serif`
      ctx.fillStyle = textColor
      ctx.fillText(s.value, sx + 20, curY + (ratio === "story" ? 82 : ratio === "square" ? 64 : 54))
    })

    curY += specCardH + (ratio === "story" ? 54 : ratio === "square" ? 36 : 20)

    // 8. Verified Benchmarks (if available)
    const benchmarkKeys = Object.entries(model.benchmarks)
    if (benchmarkKeys.length > 0 && ratio !== "landscape") {
      ctx.font = `600 ${ratio === "story" ? 15 : 12}px monospace`
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
        ctx.font = `500 ${ratio === "story" ? 13 : 11}px monospace`
        ctx.fillStyle = textDim
        ctx.fillText(label, bx + 16, curY + (ratio === "story" ? 34 : 24))

        ctx.font = `bold ${ratio === "story" ? 26 : 18}px monospace`
        ctx.fillStyle = textColor
        ctx.fillText(String(bVal), bx + 16, curY + (ratio === "story" ? 78 : 54))
      })

      curY += bCardH + (ratio === "story" ? 54 : 36)
    }

    // 9. Modalities & Architecture Certificate Box (in Story mode)
    if (ratio === "story") {
      roundRect(padding, curY, contentWidth, 140, 8, cardSurface, borderColor)

      ctx.font = "600 13px monospace"
      ctx.fillStyle = textDim
      ctx.fillText("DEPLOYMENT STANDARD", padding + 24, curY + 38)
      ctx.fillText("LICENSING & WEIGHTS", padding + contentWidth / 2 + 12, curY + 38)

      ctx.font = "bold 18px -apple-system, BlinkMacSystemFont, sans-serif"
      ctx.fillStyle = textColor
      ctx.fillText(model.modalities.join(" • "), padding + 24, curY + 80)
      ctx.fillText(model.license, padding + contentWidth / 2 + 12, curY + 80)

      ctx.font = "500 12px monospace"
      ctx.fillStyle = accentColor
      ctx.fillText(`Category: ${model.categoryLabel.toUpperCase()}`, padding + 24, curY + 112)
    }

    // 9. Bottom Footer / Watermark Verification
    const footerY = height - padding
    ctx.strokeStyle = borderColor
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(padding, footerY - 40)
    ctx.lineTo(width - padding, footerY - 40)
    ctx.stroke()

    // Verified Stamp
    ctx.font = "600 13px monospace"
    ctx.fillStyle = "#00e599"
    ctx.beginPath()
    ctx.arc(padding + 5, footerY - 14, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillText("VERIFIED SOTA RECORD", padding + 18, footerY - 10)

    // Official Registry URL
    const urlText = `modelregistry.tirup.in/?model=${model.id}`
    ctx.font = "500 13px monospace"
    ctx.fillStyle = textDim
    const urlW = ctx.measureText(urlText).width
    ctx.fillText(urlText, width - padding - urlW, footerY - 10)

    setIsRendering(false)
  }, [model, ratio, cardTheme, company, accentColor])

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(drawCard, 50)
      return () => clearTimeout(timer)
    }
  }, [isOpen, drawCard])

  if (!isOpen) return null

  // 1. Download as PNG
  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement("a")
    link.download = `modelregistry-${model.id}-${ratio}.png`
    link.href = canvas.toDataURL("image/png")
    link.click()
  }

  // 2. Copy Image to Clipboard
  const handleCopyImage = async () => {
    const canvas = canvasRef.current
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
    const canvas = canvasRef.current
    if (!canvas) return

    if (navigator.share) {
      canvas.toBlob(async (blob) => {
        if (!blob) return
        const file = new File([blob], `${model.id}-story.png`, { type: "image/png" })
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

  // 4. Copy Markdown Badge
  const handleCopyBadge = () => {
    const badgeMarkdown = `[![ModelRegistry: ${model.name}](https://modelregistry.tirup.in/api/badge?model=${model.id})](https://modelregistry.tirup.in/?model=${model.id})`
    navigator.clipboard.writeText(badgeMarkdown)
    setIsBadgeCopied(true)
    setTimeout(() => setIsBadgeCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-5 bg-black/60 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-4xl max-h-[95vh] flex flex-col md:flex-row bg-[#f7f7f4] dark:bg-[#0d0f13] border border-black/10 dark:border-white/[0.09] rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Side: Canvas Preview */}
        <div className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6 bg-black/[0.02] dark:bg-[#07080a] border-b md:border-b-0 md:border-r border-black/10 dark:border-white/[0.08] min-h-[200px] md:min-h-[300px] overflow-hidden">
          <div className="relative w-full h-full flex items-center justify-center max-h-[32vh] sm:max-h-[48vh] md:max-h-[75vh]">
            <canvas
              ref={canvasRef}
              className="max-h-full max-w-full object-contain rounded shadow-lg border border-black/10 dark:border-white/[0.08] transition-all duration-200"
              style={{
                aspectRatio: ratio === "story" ? "9/16" : ratio === "square" ? "1/1" : "16/9",
              }}
            />
          </div>
          <span className="text-[10px] sm:text-[11px] font-mono text-black/40 dark:text-zinc-500 mt-2 sm:mt-3">
            Previewing {ratio === "story" ? "1080×1920 (Story)" : ratio === "square" ? "1080×1080 (Square)" : "1200×675 (Landscape)"} • High-DPI 2x
          </span>
        </div>

        {/* Right Side: Studio Controls & Export */}
        <div className="w-full md:w-80 p-4 sm:p-6 flex flex-col justify-between bg-white dark:bg-[#0d0f13] overflow-y-auto max-h-[58vh] md:max-h-none touch-scroll">
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
                className="p-1 rounded text-black/40 dark:text-zinc-500 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Format / Aspect Ratio Selector */}
            <div className="mb-5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-black/40 dark:text-zinc-400 block mb-2 font-medium">
                FORMAT & RATIO
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-lg bg-black/[0.03] dark:bg-white/[0.04] border border-black/5 dark:border-white/[0.06]">
                <button
                  onClick={() => setRatio("story")}
                  className={`px-2.5 py-2 rounded text-xs font-mono transition-colors cursor-pointer flex flex-col items-center gap-1 ${
                    ratio === "story"
                      ? "bg-black text-white dark:bg-white dark:text-black font-medium shadow-xs"
                      : "text-black/60 dark:text-zinc-400 hover:text-black dark:hover:text-white"
                  }`}
                >
                  <span>9:16</span>
                  <span className="text-[10px] opacity-70">Story</span>
                </button>
                <button
                  onClick={() => setRatio("square")}
                  className={`px-2.5 py-2 rounded text-xs font-mono transition-colors cursor-pointer flex flex-col items-center gap-1 ${
                    ratio === "square"
                      ? "bg-black text-white dark:bg-white dark:text-black font-medium shadow-xs"
                      : "text-black/60 dark:text-zinc-400 hover:text-black dark:hover:text-white"
                  }`}
                >
                  <span>1:1</span>
                  <span className="text-[10px] opacity-70">Square</span>
                </button>
                <button
                  onClick={() => setRatio("landscape")}
                  className={`px-2.5 py-2 rounded text-xs font-mono transition-colors cursor-pointer flex flex-col items-center gap-1 ${
                    ratio === "landscape"
                      ? "bg-black text-white dark:bg-white dark:text-black font-medium shadow-xs"
                      : "text-black/60 dark:text-zinc-400 hover:text-black dark:hover:text-white"
                  }`}
                >
                  <span>16:9</span>
                  <span className="text-[10px] opacity-70">Post</span>
                </button>
              </div>
            </div>

            {/* Card Theme Palette */}
            <div className="mb-6">
              <label className="text-[11px] font-mono uppercase tracking-wider text-black/40 dark:text-zinc-400 block mb-2 font-medium">
                CARD PALETTE
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setCardTheme("dark")}
                  className={`p-2.5 rounded-md border text-xs font-mono flex items-center justify-between cursor-pointer transition-colors ${
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
                  className={`p-2.5 rounded-md border text-xs font-mono flex items-center justify-between cursor-pointer transition-colors ${
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
              className="w-full py-2.5 px-3.5 rounded-md bg-black text-white dark:bg-white dark:text-black font-mono text-xs font-medium hover:bg-[#ff5d2e] dark:hover:bg-[#ff5d2e] dark:hover:text-white transition-colors duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
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
              className="w-full py-2.5 px-3.5 rounded-md border border-black/10 dark:border-white/[0.09] text-black dark:text-zinc-200 font-mono text-xs font-medium hover:border-[#ff5d2e] hover:text-[#ff5d2e] transition-colors duration-150 flex items-center justify-center gap-2 cursor-pointer bg-black/[0.015] dark:bg-white/[0.03]"
            >
              <Download size={14} />
              <span>DOWNLOAD PNG ({ratio.toUpperCase()})</span>
            </button>

            {/* Native Mobile Share (if supported) */}
            <button
              onClick={handleNativeShare}
              className="w-full py-2 px-3 rounded text-[11px] font-mono text-black/55 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Share2 size={12} />
              <span>Share to Instagram Story / Apps</span>
            </button>

            {/* GitHub README Badge Option */}
            <button
              onClick={handleCopyBadge}
              className="w-full py-2 px-3 rounded border border-dashed border-black/10 dark:border-white/[0.08] text-[11px] font-mono text-black/55 dark:text-zinc-400 hover:border-[#ff5d2e]/40 hover:text-[#ff5d2e] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
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
  )
}
