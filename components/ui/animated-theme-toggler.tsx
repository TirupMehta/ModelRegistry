"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { flushSync } from "react-dom"
import { cn } from "@/lib/utils"

export type TransitionVariant = "circle" | "square" | "diamond"

interface AnimatedThemeTogglerProps extends React.ComponentPropsWithoutRef<"button"> {
  duration?: number
  variant?: TransitionVariant
}

export const AnimatedThemeToggler = ({
  className,
  duration = 400,
  variant = "circle",
  ...props
}: AnimatedThemeTogglerProps) => {
  const [isDark, setIsDark] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const updateTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"))
    }

    updateTheme()

    const observer = new MutationObserver(updateTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [])

  const toggleTheme = useCallback(() => {
    const button = buttonRef.current
    if (!button) return

    const viewportWidth = window.visualViewport?.width ?? window.innerWidth
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight

    const { top, left, width, height } = button.getBoundingClientRect()
    const x = left + width / 2
    const y = top + height / 2

    const maxRadius = Math.hypot(
      Math.max(x, viewportWidth - x),
      Math.max(y, viewportHeight - y)
    )

    const applyTheme = () => {
      const isCurrentlyDark = document.documentElement.classList.contains("dark")
      const newTheme = !isCurrentlyDark
      setIsDark(newTheme)
      if (newTheme) {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }
      localStorage.setItem("theme", newTheme ? "dark" : "light")
    }

    const doc = document as Document & {
      startViewTransition?: (callback: () => void) => {
        ready?: Promise<void>
      }
    }

    if (typeof doc.startViewTransition !== "function") {
      applyTheme()
      return
    }

    const clipPath = [
      `circle(0px at ${x}px ${y}px)`,
      `circle(${maxRadius}px at ${x}px ${y}px)`,
    ]

    try {
      const transition = doc.startViewTransition(() => {
        flushSync(applyTheme)
      })

      if (transition?.ready) {
        transition.ready.then(() => {
          document.documentElement.animate(
            { clipPath },
            {
              duration,
              easing: "ease-in-out",
              fill: "forwards",
              pseudoElement: "::view-transition-new(root)",
            }
          )
        })
      }
    } catch {
      applyTheme()
    }
  }, [duration])

  return (
    <button
      type="button"
      ref={buttonRef}
      onClick={toggleTheme}
      className={cn("transition-colors", className)}
      {...props}
    >
      {isDark ? (
        <Sun size={15} />
      ) : (
        <Moon size={15} />
      )}
      <span className="sr-only">Toggle theme</span>
    </button>
  )
}
