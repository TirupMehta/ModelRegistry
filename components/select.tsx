"use client"

import { useEffect, useRef, useState, type KeyboardEvent } from "react"
import { createPortal } from "react-dom"
import { Check, ChevronDown } from "lucide-react"

/**
 * The one dropdown. Every filter and picker on the site uses it, so a dropdown
 * looks and behaves the same everywhere: 40px field, the menu in a portal so it
 * is never clipped, selected row tinted with a check, arrows / Home / End / Esc.
 */

export type SelectOption = [string, string]

export const fieldClass = "h-10 w-full rounded-lg border border-[var(--field-edge)] bg-[var(--surface-field)] px-3 text-small text-black transition-colors hover:border-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ink/30 dark:text-white dark:hover:border-white/40"
export const labelClass = "mb-1.5 block text-caption font-medium text-fg-muted"

export default function Select({
  id,
  label,
  value,
  options,
  onChange,
  className = "",
}: {
  id: string
  label: string
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(Math.max(0, options.findIndex(([optionValue]) => optionValue === value)))
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; width: number; maxHeight: number } | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([])
  const selectedLabel = options.find(([optionValue]) => optionValue === value)?.[1] ?? options[0][1]

  useEffect(() => {
    if (!open) {
      setMenuPosition(null)
      return
    }

    const updatePosition = () => {
      const trigger = triggerRef.current
      if (!trigger) return

      const rect = trigger.getBoundingClientRect()
      const edge = 8
      const gap = 6
      const desiredHeight = Math.min(224, options.length * 36 + 14)
      const spaceBelow = window.innerHeight - rect.bottom - edge - gap
      const spaceAbove = rect.top - edge - gap
      const placeAbove = spaceBelow < desiredHeight && spaceAbove > spaceBelow
      const available = Math.max(80, placeAbove ? spaceAbove : spaceBelow)
      const maxHeight = Math.min(desiredHeight, available)
      const width = Math.min(rect.width, window.innerWidth - edge * 2)
      const left = Math.max(edge, Math.min(rect.left, window.innerWidth - width - edge))
      const top = placeAbove
        ? Math.max(edge, rect.top - maxHeight - gap)
        : Math.min(rect.bottom + gap, window.innerHeight - maxHeight - edge)

      setMenuPosition({ top, left, width, maxHeight })
    }

    updatePosition()
    window.addEventListener("resize", updatePosition)
    window.addEventListener("scroll", updatePosition, true)
    return () => {
      window.removeEventListener("resize", updatePosition)
      window.removeEventListener("scroll", updatePosition, true)
    }
  }, [open, options.length])

  useEffect(() => {
    if (open && menuPosition) optionRefs.current[activeIndex]?.focus()
  }, [open, activeIndex, menuPosition])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener("pointerdown", onPointerDown)
    return () => document.removeEventListener("pointerdown", onPointerDown)
  }, [open])

  const close = (restoreFocus: boolean) => {
    setOpen(false)
    if (restoreFocus) triggerRef.current?.focus()
  }

  const moveActive = (index: number) => {
    const next = (index + options.length) % options.length
    setActiveIndex(next)
    optionRefs.current[next]?.focus()
  }

  const onOptionKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      moveActive(index + 1)
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      moveActive(index - 1)
    } else if (event.key === "Home") {
      event.preventDefault()
      moveActive(0)
    } else if (event.key === "End") {
      event.preventDefault()
      moveActive(options.length - 1)
    } else if (event.key === "Escape") {
      event.preventDefault()
      event.stopPropagation()
      close(true)
    }
  }

  const openAt = (index: number) => {
    setActiveIndex((index + options.length) % options.length)
    setOpen(true)
  }

  return (
    <div ref={rootRef} className={`relative min-w-0 ${className}`}>
      <span id={id + "-label"} className={labelClass}>{label}</span>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={id + "-options"}
        onClick={() => open ? close(false) : openAt(Math.max(0, options.findIndex(([optionValue]) => optionValue === value)))}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault()
            const selected = Math.max(0, options.findIndex(([optionValue]) => optionValue === value))
            openAt(event.key === "ArrowDown" ? selected : selected - 1)
          }
        }}
        className={fieldClass + " flex items-center justify-between gap-2 text-left"}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown size={14} aria-hidden="true" className={"shrink-0 text-fg-muted transition-transform" + (open ? " rotate-180" : "")} />
      </button>
      {open && menuPosition && typeof document !== "undefined" && createPortal(
        <div
          ref={menuRef}
          data-model-filter-menu=""
          className="fixed z-[1000] overflow-hidden rounded-xl border border-black/10 bg-white p-1.5 shadow-[0_8px_20px_rgba(0,0,0,0.12)] dark:border-white/[0.12] dark:bg-[var(--surface-hover)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.4)]"
          style={{ top: menuPosition.top, left: menuPosition.left, width: menuPosition.width, maxHeight: menuPosition.maxHeight }}
        >
          <div id={id + "-options"} role="listbox" aria-labelledby={id + "-label"} className="overflow-y-auto overscroll-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden" style={{ maxHeight: Math.max(64, menuPosition.maxHeight - 14) }}>
            {options.map(([optionValue, optionLabel], index) => {
              const selected = optionValue === value
              return (
                <button
                  key={optionValue}
                  ref={(element) => { optionRefs.current[index] = element }}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  tabIndex={-1}
                  onClick={() => {
                    onChange(optionValue)
                    close(true)
                  }}
                  onKeyDown={(event) => onOptionKeyDown(event, index)}
                  className={"flex min-h-9 w-full items-center justify-between gap-3 rounded-lg px-2.5 text-left text-small transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/45 " + (selected ? "bg-accent/[0.08] font-medium text-accent-ink" : "text-fg hover:bg-black/[0.045] dark:hover:bg-white/[0.06]")}
                >
                  <span className="truncate">{optionLabel}</span>
                  {selected && <Check size={13} aria-hidden="true" className="shrink-0" />}
                </button>
              )
            })}
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
