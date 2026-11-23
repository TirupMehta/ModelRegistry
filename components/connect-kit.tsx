"use client"

import { useRef, useState } from "react"
import CopyButton from "./copy-button"

export interface ConnectTab {
  id: string
  label: string
  /** One line saying when to pick this tab. */
  hint: string
  /** The text to copy. */
  text: string
}

const copyClass =
  "border border-black/10 dark:border-white/[0.08] text-fg-muted hover:border-accent/50 hover:text-accent-ink min-h-8"

/**
 * Tabbed install snippets. Arrow keys, Home and End move between tabs, and the
 * snippet stays selectable text if scripts are slow to arrive.
 */
export default function ConnectKit({ tabs }: { tabs: ConnectTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id)
  const refs = useRef<Record<string, HTMLButtonElement | null>>({})
  const current = tabs.find((t) => t.id === active) ?? tabs[0]
  if (!current) return null

  function onKeyDown(e: React.KeyboardEvent, index: number) {
    const last = tabs.length - 1
    const next =
      e.key === "ArrowRight" ? (index + 1) % tabs.length
      : e.key === "ArrowLeft" ? (index - 1 + tabs.length) % tabs.length
      : e.key === "Home" ? 0
      : e.key === "End" ? last
      : -1
    if (next < 0) return
    e.preventDefault()
    setActive(tabs[next].id)
    refs.current[tabs[next].id]?.focus()
  }

  return (
    <div className="well overflow-hidden">
      <div role="tablist" aria-label="Install method" className="flex overflow-x-auto rule-b [scrollbar-width:none]">
        {tabs.map((t, i) => {
          const selected = t.id === current.id
          return (
            <button
              key={t.id}
              ref={(el) => {
                refs.current[t.id] = el
              }}
              role="tab"
              type="button"
              id={`connect-tab-${t.id}`}
              aria-selected={selected}
              aria-controls={`connect-panel-${t.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(t.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={`shrink-0 cursor-pointer whitespace-nowrap px-4 py-2.5 text-small font-sans transition-colors ${
                selected
                  ? "text-accent-ink font-medium shadow-[inset_0_-2px_0_var(--accent)]"
                  : "text-fg-muted hover:text-fg-strong"
              }`}
            >
              {t.label}
            </button>
          )
        })}
      </div>
      <div
        role="tabpanel"
        id={`connect-panel-${current.id}`}
        aria-labelledby={`connect-tab-${current.id}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-5 py-2.5 rule-b">
          <p className="text-small font-sans text-fg-muted">{current.hint}</p>
          <CopyButton text={current.text} label="COPY" className={copyClass} />
        </div>
        <pre className="px-4 sm:px-5 py-3.5 text-small font-mono leading-relaxed text-fg whitespace-pre-wrap break-words">
          {current.text}
        </pre>
      </div>
    </div>
  )
}
