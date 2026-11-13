"use client"

import { useEffect, useId, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, ChevronDown, Search } from "lucide-react"

export interface PickerModel {
  id: string
  name: string
  lab: string
}

interface Props {
  models: PickerModel[]
  /** model id -> ids it can be compared with (cross-lab, same kind of output). */
  partners: Record<string, string[]>
}

function Combo({
  label,
  value,
  options,
  onChange,
  placeholder,
  disabled,
}: {
  label: string
  value: PickerModel | null
  options: PickerModel[]
  onChange: (model: PickerModel | null) => void
  placeholder: string
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [active, setActive] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  const listId = useId()

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? options.filter((m) => `${m.name} ${m.lab}`.toLowerCase().includes(q)) : options
  }, [options, query])

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [])

  const choose = (model: PickerModel) => {
    onChange(model)
    setQuery("")
    setOpen(false)
  }

  return (
    <div ref={root} className="relative min-w-0 flex-1">
      <label className="mb-1.5 block text-small text-fg-muted">{label}</label>
      <div className="relative">
        <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-muted" aria-hidden="true" />
        <input
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          disabled={disabled}
          value={open ? query : (value?.name ?? "")}
          placeholder={placeholder}
          onFocus={() => {
            setOpen(true)
            setActive(0)
          }}
          onChange={(event) => {
            setQuery(event.target.value)
            setActive(0)
            setOpen(true)
            if (value) onChange(null)
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault()
              setOpen(true)
              setActive((i) => Math.min(i + 1, shown.length - 1))
            } else if (event.key === "ArrowUp") {
              event.preventDefault()
              setActive((i) => Math.max(i - 1, 0))
            } else if (event.key === "Enter" && open && shown[active]) {
              event.preventDefault()
              choose(shown[active])
            } else if (event.key === "Escape") {
              setOpen(false)
            }
          }}
          className="h-10 w-full rounded-lg border border-[var(--field-edge)] bg-[var(--surface-field)] pl-8 pr-8 text-small text-black outline-none transition-colors placeholder:text-fg-muted hover:border-black/60 focus-visible:ring-2 focus-visible:ring-accent-ink/30 disabled:cursor-not-allowed disabled:opacity-50 dark:text-white dark:hover:border-white/40"
        />
        <ChevronDown size={15} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-fg-muted" aria-hidden="true" />
      </div>

      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1.5 max-h-72 w-full min-w-[15rem] overflow-y-auto rounded-xl border border-black/10 bg-white p-1 shadow-lg [scrollbar-width:none] dark:border-white/15 dark:bg-[var(--surface-raised)] [&::-webkit-scrollbar]:hidden"
        >
          {shown.length === 0 && <li className="px-2.5 py-2 text-small text-fg-muted">No match. Comparisons cover each lab&apos;s current flagship and newest release.</li>}
          {shown.map((model, index) => (
            <li
              key={model.id}
              role="option"
              aria-selected={value?.id === model.id}
              onMouseEnter={() => setActive(index)}
              onMouseDown={(event) => {
                event.preventDefault()
                choose(model)
              }}
              className={`cursor-pointer rounded px-2.5 py-1.5 ${
                index === active ? "bg-black/[0.05] dark:bg-white/[0.08]" : ""
              }`}
            >
              <span className="block text-body leading-5 text-black dark:text-white">{model.name}</span>
              <span className="block text-small leading-4 text-fg-muted">{model.lab}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function ComparePicker({ models, partners }: Props) {
  const router = useRouter()
  const [a, setA] = useState<PickerModel | null>(null)
  const [b, setB] = useState<PickerModel | null>(null)

  const byId = useMemo(() => new Map(models.map((m) => [m.id, m])), [models])
  const bOptions = useMemo(() => {
    if (!a) return []
    return (partners[a.id] ?? []).map((id) => byId.get(id)).filter((m): m is PickerModel => Boolean(m))
  }, [a, partners, byId])

  const go = (first: PickerModel, second: PickerModel) => {
    router.push(`/compare/${[first.id, second.id].sort().join("-vs-")}`)
  }

  return (
    <div className="tile p-3.5 sm:p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <Combo
          label="First model"
          value={a}
          options={models}
          placeholder="Search a model"
          onChange={(m) => {
            setA(m)
            if (!m || (b && !(partners[m.id] ?? []).includes(b.id))) setB(null)
          }}
        />
        <span className="hidden pb-2 text-small text-fg-muted sm:block">vs</span>
        <Combo
          label="Second model"
          value={b}
          options={bOptions}
          disabled={!a}
          placeholder={a ? "Search a model" : "Pick the first model"}
          onChange={(m) => {
            setB(m)
            if (m && a) go(a, m)
          }}
        />
        <button
          type="button"
          disabled={!a || !b}
          onClick={() => a && b && go(a, b)}
          className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-black px-4 text-small font-medium text-white transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-black dark:bg-white dark:text-black dark:hover:bg-accent dark:hover:text-white dark:disabled:hover:bg-white"
        >
          Compare <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>
      {a && bOptions.length > 0 && (
        <p className="mt-3 text-small text-fg-muted">
          {bOptions.length} models can be compared with {a.name}.
        </p>
      )}
    </div>
  )
}
