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
          "hidden sm:inline-flex items-center gap-1.5 sm:gap-2 py-1.5 px-2.5 sm:px-3 rounded-md text-xs sm:text-[13px] font-sans tracking-tight whitespace-nowrap transition-colors duration-200 select-none cursor-pointer shrink-0",
          promptCopied
            ? "bg-emerald-500/10 border border-emerald-500/50 text-emerald-600 dark:text-emerald-400"
            : "bg-black/[0.03] dark:bg-white/[0.03] border border-black/10 dark:border-white/[0.08] text-black/60 dark:text-zinc-300 hover:border-[#ff5d2e]/60 hover:text-[#ff5d2e] dark:hover:text-[#ff7347] active:scale-[0.97]",
        ].join(" ")}
      >
        {promptCopied ? (
          <Check key="copied" size={13} className="draw-check shrink-0" />
        ) : (
          <Sparkles size={13} className="text-[#ff5d2e] shrink-0" />
        )}
        <span>{promptCopied ? "Copied" : "Copy Prompt"}</span>
      </button>

      {/* Viewport-fixed explainer card - zero layout impact, never clipped */}
      {hintPos && !promptCopied && (
        <div
          aria-hidden="true"
          onMouseEnter={showHint}
          onMouseLeave={hideHint}
          className="hidden sm:block fixed z-[60] w-64 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#13161c] px-3.5 py-3 shadow-2xl ring-1 ring-black/5 dark:ring-white/5 animate-in fade-in duration-150"
          style={{ top: hintPos.top, right: hintPos.right }}
        >
          <p className="text-xs font-sans font-semibold text-black dark:text-white">
            Contribute with AI
          </p>
          <p className="mt-1 text-[11px] font-sans leading-relaxed text-black/55 dark:text-zinc-400">
            One click copies the full agent prompt - paste it into Claude, Cursor, or
            Codex and it adds the model for you.
          </p>
          <span
            aria-hidden="true"
            className="absolute -top-[5px] right-8 w-2 h-2 rotate-45 bg-white dark:bg-[#13161c] border-l border-t border-black/10 dark:border-white/10"
          />
        </div>
      )}
    </>
  )
}
