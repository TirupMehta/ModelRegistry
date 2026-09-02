"use client"

import { useEffect, useRef } from "react"

/**
 * AmbientShader Component — "Kinetic Telemetry Grid"
 * 
 * An architectural precision grid with registration crosshairs and subtle optical falloff.
 * Replaces generic AI blob gradients with a bespoke laboratory apparatus aesthetic.
 */
export default function AmbientShader() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d", { alpha: true })
    if (!ctx) return

    let animationFrameId: number
    let width = 0
    let height = 0
    let isDark = false

    const updateTheme = () => {
      isDark = document.documentElement.classList.contains("dark")
    }

    const resize = () => {
      if (!canvas) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    updateTheme()
    resize()

    window.addEventListener("resize", resize, { passive: true })

    const observer = new MutationObserver(() => {
      updateTheme()
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    let t = 0
    let lastTime = performance.now()
    let isVisible = true

    const handleVisibilityChange = () => {
      isVisible = !document.hidden
      if (isVisible) {
        lastTime = performance.now()
        render(lastTime)
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)

    const render = (time: number) => {
      if (!isVisible) return

      const dt = Math.min((time - lastTime) / 1000, 0.1)
      lastTime = time
      t += dt * 0.15

      ctx.clearRect(0, 0, width, height)

      const gridSize = 48
      const crossSize = 3

      if (isDark) {
        // --- Dark Apparatus Canvas (#0b0c0e base) ---
        // 1. Subtle top-center optical lens flare with warm amber/orange falloff
        const lensX = width * 0.5 + Math.sin(t * 0.5) * 40
        const lensY = -80
        const lensR = Math.max(width, height) * 0.85

        const gLens = ctx.createRadialGradient(lensX, lensY, 0, lensX, lensY, lensR)
        gLens.addColorStop(0, "rgba(255, 68, 0, 0.045)")
        gLens.addColorStop(0.3, "rgba(255, 85, 0, 0.018)")
        gLens.addColorStop(0.7, "rgba(11, 12, 14, 0.005)")
        gLens.addColorStop(1, "rgba(11, 12, 14, 0)")
        ctx.fillStyle = gLens
        ctx.fillRect(0, 0, width, height)

        // 2. Precision Telemetry Crosshair Grid
        ctx.strokeStyle = "rgba(255, 255, 255, 0.04)"
        ctx.lineWidth = 1

        const offsetX = Math.floor((width % gridSize) / 2)
        const offsetY = Math.floor((height % gridSize) / 2)

        for (let x = offsetX; x < width; x += gridSize) {
          for (let y = offsetY; y < height; y += gridSize) {
            // Distance from center for subtle radial fading
            const dx = (x - width / 2) / (width / 2)
            const dy = (y - height / 2) / (height / 2)
            const distSq = dx * dx + dy * dy
            const opacity = Math.max(0, 1 - distSq * 0.8) * 0.045

            ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`
            ctx.beginPath()
            ctx.moveTo(x - crossSize, y)
            ctx.lineTo(x + crossSize, y)
            ctx.moveTo(x, y - crossSize)
            ctx.lineTo(x, y + crossSize)
            ctx.stroke()
          }
        }
      } else {
        // --- Light Drafting Vellum Canvas (#f6f6f3 base) ---
        // 1. Warm technical drafting vellum ambient
        const gLight = ctx.createRadialGradient(width * 0.5, 0, 0, width * 0.5, 0, Math.max(width, height) * 0.8)
        gLight.addColorStop(0, "rgba(255, 85, 0, 0.025)")
        gLight.addColorStop(0.5, "rgba(246, 246, 243, 0.01)")
        gLight.addColorStop(1, "rgba(246, 246, 243, 0)")
        ctx.fillStyle = gLight
        ctx.fillRect(0, 0, width, height)

        // 2. Drafting Crosshairs
        const offsetX = Math.floor((width % gridSize) / 2)
        const offsetY = Math.floor((height % gridSize) / 2)

        for (let x = offsetX; x < width; x += gridSize) {
          for (let y = offsetY; y < height; y += gridSize) {
            const dx = (x - width / 2) / (width / 2)
            const dy = (y - height / 2) / (height / 2)
            const distSq = dx * dx + dy * dy
            const opacity = Math.max(0, 1 - distSq * 0.8) * 0.06

            ctx.strokeStyle = `rgba(0, 0, 0, ${opacity})`
            ctx.beginPath()
            ctx.moveTo(x - crossSize, y)
            ctx.lineTo(x + crossSize, y)
            ctx.moveTo(x, y - crossSize)
            ctx.lineTo(x, y + crossSize)
            ctx.stroke()
          }
        }
      }

      animationFrameId = requestAnimationFrame(render)
    }

    animationFrameId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener("resize", resize)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      observer.disconnect()
    }
  }, [])

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-100 transition-opacity duration-700"
      />
      {/* Precision Micro-Carbon Texture */}
      <div
        className="absolute inset-0 w-full h-full opacity-[0.02] dark:opacity-[0.035] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  )
}
