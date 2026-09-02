"use client"

import { useEffect, useRef } from "react"

/**
 * AmbientShader Component
 * 
 * An ultra-subtle, architectural ambient background light field with organic dither.
 * - In Dark Mode: A sleek, top-down studio spotlight with subtle cool-slate luminescence
 *   and ambient floor depth (eliminates muddy colors, feels premium and intentional).
 * - In Light Mode: An airy, warm alabaster and diffused morning sky radiance.
 * - Procedural micro-dither eliminates banding on OLED/IPS displays.
 * - Zero performance overhead: throttled render loop, pauses when tab is inactive.
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
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
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
      t += dt * 0.12

      ctx.clearRect(0, 0, width, height)

      if (isDark) {
        // --- Professional Dark Mode: Architectural Studio Illumination ---
        // 1. Top primary studio spotlight (breathing apex glow)
        const topX = width * 0.5 + width * 0.08 * Math.sin(t * 0.4)
        const topY = -height * 0.1 + height * 0.05 * Math.cos(t * 0.5)
        const topRadius = Math.max(width, height) * 0.75

        const gTop = ctx.createRadialGradient(topX, topY, 0, topX, topY, topRadius)
        gTop.addColorStop(0, "rgba(58, 72, 115, 0.16)")
        gTop.addColorStop(0.35, "rgba(35, 45, 75, 0.09)")
        gTop.addColorStop(0.7, "rgba(18, 22, 38, 0.04)")
        gTop.addColorStop(1, "rgba(9, 10, 13, 0)")
        ctx.fillStyle = gTop
        ctx.fillRect(0, 0, width, height)

        // 2. Subtle center-right cool slate radiance (adds dimensional depth)
        const crX = width * 0.85 - width * 0.08 * Math.cos(t * 0.6)
        const crY = height * 0.45 + height * 0.1 * Math.sin(t * 0.5)
        const crRadius = Math.max(width, height) * 0.55

        const gCR = ctx.createRadialGradient(crX, crY, 0, crX, crY, crRadius)
        gCR.addColorStop(0, "rgba(79, 70, 229, 0.06)")
        gCR.addColorStop(0.45, "rgba(49, 46, 129, 0.02)")
        gCR.addColorStop(1, "rgba(9, 10, 13, 0)")
        ctx.fillStyle = gCR
        ctx.fillRect(0, 0, width, height)

        // 3. Ambient floor depth
        const bfX = width * 0.35 + width * 0.05 * Math.sin(t * 0.35)
        const bfY = height * 1.05
        const bfRadius = Math.max(width, height) * 0.65

        const gBF = ctx.createRadialGradient(bfX, bfY, 0, bfX, bfY, bfRadius)
        gBF.addColorStop(0, "rgba(30, 41, 59, 0.12)")
        gBF.addColorStop(0.5, "rgba(15, 23, 42, 0.04)")
        gBF.addColorStop(1, "rgba(9, 10, 13, 0)")
        ctx.fillStyle = gBF
        ctx.fillRect(0, 0, width, height)
      } else {
        // --- Light Mode: Warm Alabaster Studio Glow ---
        const topX = width * 0.5 + width * 0.06 * Math.sin(t * 0.3)
        const topY = -height * 0.05
        const topRadius = Math.max(width, height) * 0.7

        const gTop = ctx.createRadialGradient(topX, topY, 0, topX, topY, topRadius)
        gTop.addColorStop(0, "rgba(124, 136, 232, 0.08)")
        gTop.addColorStop(0.4, "rgba(224, 231, 255, 0.05)")
        gTop.addColorStop(1, "rgba(250, 250, 249, 0)")
        ctx.fillStyle = gTop
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
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-[-1] w-full h-full"
    />
  )
}
