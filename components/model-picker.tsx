"use client"

import { useEffect, useId, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { Check, ChevronDown } from "lucide-react"

export interface PickerTest {
  key: string
  label: string
  /** What a person would call the task, shown in the selector. */
  task: string
  unit: "index" | "percent" | "elo" | "net"
}

export interface PickerModel {
  id: string
  name: string
  lab: string
  open: boolean
  /** Evaluator cost per task, or null when not measured. */
  cost: number | null
  scores: Record<string, number>
}

const BUDGETS = [
  { label: "Any budget", value: "any" },
  { label: "Up to $1 per task", value: "1" },
  { label: "Up to $5 per task", value: "5" },
  { label: "Up to $10 per task", value: "10" },
]

function show(unit: PickerTest["unit"], value: number): string {
  return unit === "percent" ? `${value.toFixed(1)}%` : `${value}`
}

interface Option {
  value: string
  label: string
}

/**
 * A dropdown that looks like the rest of the site instead of the operating
 * system's: a rounded panel, the selected option marked with a check, and the
 * usual keyboard behaviour (arrows, Home, End, Enter, Escape).
 */
function Dropdown({
  label,
  value,
  options,
  onChange,
  className = "",
}: {
  label: string
  value: string
  options: Option[]
  onChange: (value: string) => void
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [more, setMore] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const id = useId()
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value))
  const selected = options[selectedIndex]

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener("pointerdown", onPointerDown)
    return () => document.removeEventListener("pointerdown", onPointerDown)
  }, [open])

  const updateMore = () => {
    const list = listRef.current
    if (!list) return
    setMore(list.scrollTop + list.clientHeight < list.scrollHeight - 4)
  }

  useEffect(() => {
    if (!open) return
    listRef.current?.children[active]?.scrollIntoView({ block: "nearest" })
    updateMore()
  }, [open, active])

  const openList = () => {
    setActive(selectedIndex)
    setOpen(true)
  }

  const choose = (index: number) => {
    onChange(options[index].value)
    setOpen(false)
    buttonRef.current?.focus()
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
        event.preventDefault()
        openList()
      }
      return
    }
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault()
        setActive((index) => Math.min(options.length - 1, index + 1))
        break
      case "ArrowUp":
        event.preventDefault()
        setActive((index) => Math.max(0, index - 1))
        break
      case "Home":
        event.preventDefault()
        setActive(0)
        break
      case "End":
        event.preventDefault()
        setActive(options.length - 1)
        break
      case "Enter":
      case " ":
        event.preventDefault()
        choose(active)
        break
      case "Escape":
        event.preventDefault()
        setOpen(false)
        break
      case "Tab":
        setOpen(false)
        break
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <span id={`${id}-label`} className="mb-1.5 block text-caption font-sans font-medium uppercase tracking-wide text-fg-muted">
        {label}
      </span>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${id}-label ${id}-value`}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-black/15 bg-white px-3.5 text-left text-body font-sans text-black shadow-[0_1px_0_rgba(0,0,0,0.03)] transition-colors hover:border-black/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent dark:border-white/20 dark:bg-[var(--surface-raised)] dark:text-white dark:hover:border-white/40"
      >
        <span id={`${id}-value`} className="truncate">
          {selected?.label}
        </span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={`shrink-0 text-fg-muted transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-30 mt-1.5 overflow-hidden rounded-xl border border-black/10 bg-white shadow-[0_12px_32px_-8px_rgba(0,0,0,0.18)] sm:right-auto sm:min-w-full sm:w-max sm:max-w-[min(24rem,90vw)] dark:border-white/15 dark:bg-[var(--surface-raised)]">
        <ul
          ref={listRef}
          role="listbox"
          aria-labelledby={`${id}-label`}
          tabIndex={-1}
          onScroll={updateMore}
          className="max-h-72 overflow-auto p-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {options.map((option, index) => {
            const isSelected = option.value === value
            return (
              <li
                key={option.value}
                role="option"
                aria-selected={isSelected}
                onPointerEnter={() => setActive(index)}
                onClick={() => choose(index)}
                className={`flex min-h-10 cursor-pointer items-center justify-between gap-6 rounded-lg px-3 text-body font-sans transition-colors ${
                  index === active ? "bg-black/[0.05] dark:bg-white/[0.08]" : ""
                } ${isSelected ? "font-medium text-black dark:text-white" : "text-fg"}`}
              >
                <span>{option.label}</span>
                {isSelected && <Check size={15} aria-hidden="true" className="shrink-0 text-accent-ink" />}
              </li>
            )
          })}
        </ul>
        {/* With no scrollbar, a fade and a chevron say there is more below. */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-0 bottom-0 flex h-12 items-end justify-center bg-gradient-to-t from-white via-white/85 to-transparent pb-1 transition-opacity duration-150 dark:from-[var(--surface-raised)] dark:via-[var(--surface-raised)]/85 ${
            more ? "opacity-100" : "opacity-0"
          }`}
        >
          <ChevronDown size={14} className="text-fg-muted" />
        </div>
        </div>
      )}
    </div>
  )
}

/**
 * "Which model for me?" in three choices. It filters and sorts the same
 * independent results the rest of the page is built from, so the picker can
 * never name a model the tables would not.
 */
export default function ModelPicker({ tests, models }: { tests: PickerTest[]; models: PickerModel[] }) {
  const [testKey, setTestKey] = useState(tests[0]?.key ?? "")
  const [budget, setBudget] = useState("any")
  const [openOnly, setOpenOnly] = useState(false)

  const test = tests.find((candidate) => candidate.key === testKey) ?? tests[0]
  const picks = useMemo(() => {
    if (!test) return []
    const limit = budget === "any" ? Infinity : Number(budget)
    return models
      .filter((model) => model.scores[test.key] !== undefined)
      .filter((model) => (openOnly ? model.open : true))
      .filter((model) => (limit === Infinity ? true : model.cost !== null && model.cost <= limit))
      .sort((a, b) => b.scores[test.key] - a.scores[test.key])
      .slice(0, 3)
  }, [models, test, budget, openOnly])

  if (!test) return null

  return (
    <section
      aria-labelledby="picker-heading"
      className="mb-10 rounded-xl border border-black/10 p-4 sm:p-5 dark:border-white/[0.08]"
    >
      <h2
        id="picker-heading"
        className="mb-4 font-display text-title font-semibold tracking-tight text-black dark:text-white"
      >
        Find a model for your job
      </h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto] sm:items-end">
        <Dropdown
          label="What do you need it for"
          value={test.key}
          options={tests.map((candidate) => ({ value: candidate.key, label: candidate.task }))}
          onChange={setTestKey}
        />
        <Dropdown label="Budget" value={budget} options={BUDGETS} onChange={setBudget} />
        <button
          type="button"
          role="switch"
          aria-checked={openOnly}
          onClick={() => setOpenOnly((value) => !value)}
          className="flex min-h-11 items-center gap-2.5 rounded-xl border border-black/15 px-3.5 text-body font-sans text-fg transition-colors hover:border-black/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent dark:border-white/20 dark:hover:border-white/40"
        >
          <span
            aria-hidden="true"
            className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${openOnly ? "bg-accent" : "bg-black/20 dark:bg-white/25"}`}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${openOnly ? "left-[18px]" : "left-0.5"}`}
            />
          </span>
          Open weights only
        </button>
      </div>

      {picks.length === 0 ? (
        <p className="mt-5 text-body font-sans text-fg-muted">
          No current model with an independent result fits those limits. Loosen the budget or the open-weights filter.
        </p>
      ) : (
        <ol className="mt-5">
          {picks.map((model, index) => (
            <li key={model.id}>
              <Link
                href={`/models/${model.id}`}
                className="group flex items-baseline gap-3 border-b border-black/10 py-3 dark:border-white/[0.08]"
              >
                <span className="w-5 shrink-0 text-small font-sans tabular-nums text-fg-muted">
                  {index + 1}
                </span>
                <span className="text-body font-medium tracking-tight text-black transition-colors group-hover:text-accent-ink dark:text-white">
                  {model.name}
                </span>
                <span className="hidden text-small font-sans text-fg-muted sm:inline">{model.lab}</span>
                <span className="ml-auto text-body font-sans font-semibold tabular-nums text-black dark:text-white">
                  {show(test.unit, model.scores[test.key])}
                </span>
                <span className="w-20 shrink-0 text-right text-small font-sans tabular-nums text-fg-muted">
                  {model.cost === null ? "cost n/a" : `$${model.cost.toFixed(2)}/task`}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
      <p className="mt-3 text-small font-sans text-fg-muted">
        {test.label}, independent results. Scores close together may be statistical ties; the tables below say which.
      </p>
    </section>
  )
}
