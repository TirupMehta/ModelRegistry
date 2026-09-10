"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import CopyButton from "./copy-button"

interface PromptBlockProps {
  title: string
  text: string
  previewLines?: number
}

/**
 * Agent prompt card: 3-line preview with read-more expansion.
 * Never scrolls internally — the card grows instead.
 */
export default function PromptBlock({ title, text, previewLines = 3 }: PromptBlockProps) {
  const [expanded, setExpanded] = useState(false)
  const lines = text.split("\n")
  const preview = lines.slice(0, previewLines).join("\n")
  const hiddenCount = Math.max(lines.length - previewLines, 0)

  return (
    <div className="rounded-md border border-black/10 dark:border-white/[0.08] bg-black/[0.02] dark:bg-black/40 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-5 py-2.5 border-b border-black/10 dark:border-white/[0.08]">
        <p className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.18em] text-[#ff5d2e] dark:text-[#ff7347]">
          {title}
        </p>
        <CopyButton
          text={text}
          label="COPY"
          className="border border-black/10 dark:border-white/[0.08] text-black/60 dark:text-zinc-300 hover:border-[#ff5d2e]/50 hover:text-[#ff5d2e] min-h-8"
        />
      </div>
      <pre className="px-4 sm:px-5 py-3.5 text-xs font-mono leading-relaxed text-black/80 dark:text-zinc-200 whitespace-pre-wrap break-words">
        {expanded ? text : preview}
      </pre>
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 border-t border-black/10 dark:border-white/[0.08] text-[11px] sm:text-xs font-sans tracking-wider text-black/50 dark:text-zinc-400 hover:text-[#ff5d2e] dark:hover:text-[#ff7347] transition-colors cursor-pointer"
        >
          <span>{expanded ? "SHOW LESS" : `READ MORE (+${hiddenCount} LINES)`}</span>
          <ChevronDown
            size={12}
            className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          />
        </button>
      )}
    </div>
  )
}
