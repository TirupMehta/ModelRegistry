"use client"

import { useEffect, useRef, useState } from "react"
import { successFeedback } from "@/lib/feedback"
import { Sparkles, Check } from "lucide-react"

// Copy-prompt button plus its viewport-fixed explainer card. Client-side
// only because of clipboard access, fetch, and measured positioning - the
// nav row it sits in stays server-rendered.
export default function HeaderPrompt() {
  const [promptCopied, setPromptCopied] = useState(false)
  const [hintPos, setHintPos] = useState<{ top: number; right: number } | null>(null)
  const promptBtnRef = useRef<HTMLButtonElement>(null)
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Viewport-fixed explainer card, anchored under the button via measured
  // rect - the nav row is a scroll container, so nothing may overflow it.
  function showHint() {
    const r = promptBtnRef.current?.getBoundingClientRect()
    if (!r) return
    if (hintTimer.current) clearTimeout(hintTimer.current)
    setHintPos({ top: r.bottom + 10, right: Math.max(window.innerWidth - r.right, 12) })
  }

  function hideHint() {
    if (hintTimer.current) clearTimeout(hintTimer.current)
    hintTimer.current = setTimeout(() => setHintPos(null), 90)
  }

  useEffect(() => {
    const close = () => setHintPos(null)
    window.addEventListener("scroll", close, { passive: true })
    return () => window.removeEventListener("scroll", close)
  }, [])

  // Fetches the live agent prompt (zero bundle cost) and copies it.
  // Falls back to the docs page when clipboard or network is unavailable.
  async function handleCopyPrompt() {
    try {
      const res = await fetch("/api/agent-prompt")
      if (!res.ok) throw new Error("prompt fetch failed")
      const text = await res.text()
      try {
        await navigator.clipboard.writeText(text)
      } catch {
        const ta = document.createElement("textarea")
        ta.value = text
        ta.style.position = "fixed"
        ta.style.opacity = "0"
        document.body.appendChild(ta)
        ta.select()
        document.execCommand("copy")
        document.body.removeChild(ta)
      }
      setPromptCopied(true)
      successFeedback()
      setTimeout(() => setPromptCopied(false), 2000)
    } catch {
      window.location.href = "/docs"
    }
  }

  return (
    <>
      <button
        ref={promptBtnRef}
        type="button"
        onClick={handleCopyPrompt}
        onMouseEnter={showHint}
        onMouseLeave={hideHint}
        onFocus={showHint}
        onBlur={hideHint}
        className={[
          "hidden h-8 shrink-0 cursor-pointer select-none items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 text-small font-sans tracking-tight transition-colors duration-200 sm:inline-flex sm:gap-2 sm:px-3 sm:text-small",
          promptCopied
            ? "bg-good/10 border border-good/50 text-good dark:text-good"
            : "bg-black/[0.03] dark:bg-white/[0.03] border border-black/10 dark:border-white/[0.08] text-fg-muted hover:border-accent/60 hover:text-accent-ink active:scale-[0.97]",
        ].join(" ")}
      >
        {promptCopied ? (
          <Check key="copied" size={13} className="draw-check shrink-0" />
        ) : (
          <Sparkles size={13} className="text-accent-ink shrink-0" />
        )}
        <span>{promptCopied ? "Copied" : "Copy Prompt"}</span>
      </button>

      {/* Viewport-fixed explainer card - zero layout impact, never clipped */}
      {hintPos && !promptCopied && (
        <div
          aria-hidden="true"
          onMouseEnter={showHint}
          onMouseLeave={hideHint}
          className="hidden sm:block fixed z-[60] w-64 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[var(--surface-hover)] px-3.5 py-3 shadow-2xl ring-1 ring-black/5 dark:ring-white/5 animate-in fade-in duration-150"
          style={{ top: hintPos.top, right: hintPos.right }}
        >
          <p className="text-small font-sans font-semibold text-black dark:text-white">
            Contribute with AI
          </p>
          <p className="mt-1 text-caption font-sans leading-relaxed text-fg-muted">
            One click copies the full agent prompt - paste it into Claude, Cursor, or
            Codex and it adds the model for you.
          </p>
          <span
            aria-hidden="true"
            className="absolute -top-[5px] right-8 w-2 h-2 rotate-45 bg-white dark:bg-[var(--surface-hover)] border-l border-t border-black/10 dark:border-white/10"
          />
        </div>
      )}
    </>
  )
}
