"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"

interface CopyButtonProps {
  text: string
  label?: string
  copiedLabel?: string
  className?: string
}

export default function CopyButton({
  text,
  label = "COPY PROMPT",
  copiedLabel = "COPIED",
  className = "",
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // Clipboard API unavailable (permissions / non-secure context):
      // fall back to a selectable textarea so manual copy still works.
      const ta = document.createElement("textarea")
      ta.value = text
      ta.style.position = "fixed"
      ta.style.opacity = "0"
      document.body.appendChild(ta)
      ta.select()
      document.execCommand("copy")
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 min-h-9 rounded-md text-xs font-sans font-medium cursor-pointer select-none transition-colors duration-200 active:scale-95 outline outline-1 -outline-offset-1 ${
        copied
          ? "bg-emerald-500/10 outline-emerald-500/50 text-emerald-600 dark:text-emerald-400"
          : "outline-transparent"
      } ${className}`}
    >
      {copied ? (
        <Check size={13} className="draw-check shrink-0" />
      ) : (
        <Copy size={13} />
      )}
      <span>{copied ? copiedLabel : label}</span>
    </button>
  )
}
