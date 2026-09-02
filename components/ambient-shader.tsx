"use client"

import { useEffect, useRef } from "react"

/**
 * AmbientShader Component — "Cinematic Obsidian Atmosphere"
 * 
 * An ultra-luxurious, procedural ambient lighting canvas.
 * Delivers deep velvety obsidian blacks with soft, organic top radiance
 * and zero banding dither.
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
      t += dt * 0.2

      ctx.clearRect(0, 0, width, height)

      if (isDark) {
        // ── LUXURY OBSIDIAN ATMOSPHERE (#07080a) ──────────────────────────
        // 1. Primary Top Studio Spotlight (Gentle warm coral-amber radiance)
        const spotlightX = width * 0.5 + Math.sin(t * 0.3) * 60
        const spotlightY = -120
        const spotlightRadius = Math.max(width, height) * 0.9

        const gSpotlight = ctx.createRadialGradient(
          spotlightX,
          spotlightY,
          0,
          spotlightX,
          spotlightY,
          spotlightRadius
        )
        gSpotlight.addColorStop(0, "rgba(255, 93, 46, 0.055)")
        gSpotlight.addColorStop(0.25, "rgba(30, 41, 59, 0.12)")
        gSpotlight.addColorStop(0.65, "rgba(13, 16, 23, 0.04)")
        gSpotlight.addColorStop(1, "rgba(7, 8, 10, 0)")
        ctx.fillStyle = gSpotlight
        ctx.fillRect(0, 0, width, height)

        // 2. Secondary Bottom-Right Twilight Ambient Glow
        const glowX = width * 0.85
        const glowY = height * 0.9
        const glowRadius = Math.max(width, height) * 0.6

        const gSecondary = ctx.createRadialGradient(
          glowX,
          glowY,
          0,
          glowX,
          glowY,
          glowRadius
        )
        gSecondary.addColorStop(0, "rgba(51, 65, 85, 0.07)")
        gSecondary.addColorStop(0.5, "rgba(15, 23, 42, 0.02)")
        gSecondary.addColorStop(1, "rgba(7, 8, 10, 0)")
        ctx.fillStyle = gSecondary
        ctx.fillRect(0, 0, width, height)
      } else {
        // ── ARCHIVAL VELLUM ATMOSPHERE (#f7f7f4) ──────────────────────────
        const gLight = ctx.createRadialGradient(
          width * 0.5,
          -60,
          0,
          width * 0.5,
          -60,
          Math.max(width, height) * 0.8
        )
        gLight.addColorStop(0, "rgba(255, 80, 26, 0.04)")
        gLight.addColorStop(0.4, "rgba(247, 247, 244, 0.02)")
        gLight.addColorStop(1, "rgba(247, 247, 244, 0)")
        ctx.fillStyle = gLight
        ctx.fillRect(0, 0, width, height)
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
      {/* Precision Micro-Film Grain Overlay (Anti-Banding) */}
      <div
        className="absolute inset-0 w-full h-full opacity-[0.02] dark:opacity-[0.03] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  )
}
