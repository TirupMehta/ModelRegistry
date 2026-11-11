"use client"

import { useMemo, useState } from "react"
import Link from "next/link"

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
  const selectClass =
    "min-h-10 rounded-lg border border-black/15 bg-white px-3 text-sm font-sans text-black dark:border-white/20 dark:bg-[var(--surface-raised)] dark:text-white"

  return (
    <section
      aria-labelledby="picker-heading"
      className="mb-10 rounded-xl border border-black/10 p-4 sm:p-5 dark:border-white/[0.08]"
    >
      <h2
        id="picker-heading"
        className="mb-3 font-display text-lg font-semibold tracking-tight text-black dark:text-white"
      >
        Find a model for your job
      </h2>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <label className="sr-only" htmlFor="picker-test">
          What do you need it for
        </label>
        <select id="picker-test" className={selectClass} value={test.key} onChange={(e) => setTestKey(e.target.value)}>
          {tests.map((candidate) => (
            <option key={candidate.key} value={candidate.key}>
              {candidate.task}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="picker-budget">
          Budget
        </label>
        <select id="picker-budget" className={selectClass} value={budget} onChange={(e) => setBudget(e.target.value)}>
          {BUDGETS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <label className="inline-flex min-h-10 items-center gap-2 text-sm font-sans text-black/70 dark:text-zinc-300">
          <input type="checkbox" checked={openOnly} onChange={(e) => setOpenOnly(e.target.checked)} className="h-4 w-4" />
          Open weights only
        </label>
      </div>

      {picks.length === 0 ? (
        <p className="mt-4 text-sm font-sans text-black/60 dark:text-zinc-400">
          No current model with an independent result fits those limits. Loosen the budget or the open-weights filter.
        </p>
      ) : (
        <ol className="mt-4">
          {picks.map((model, index) => (
            <li key={model.id}>
              <Link
                href={`/models/${model.id}`}
                className="group flex items-baseline gap-3 border-b border-black/10 py-3 dark:border-white/[0.08]"
              >
                <span className="w-5 shrink-0 text-xs font-sans tabular-nums text-black/30 dark:text-zinc-600">
                  {index + 1}
                </span>
                <span className="text-sm font-medium tracking-tight text-black transition-colors group-hover:text-accent-ink dark:text-white">
                  {model.name}
                </span>
                <span className="hidden text-xs font-sans text-black/45 sm:inline dark:text-zinc-500">{model.lab}</span>
                <span className="ml-auto text-sm font-sans font-semibold tabular-nums text-black dark:text-white">
                  {show(test.unit, model.scores[test.key])}
                </span>
                <span className="w-20 shrink-0 text-right text-xs font-sans tabular-nums text-black/45 dark:text-zinc-500">
                  {model.cost === null ? "cost n/a" : `$${model.cost.toFixed(2)}/task`}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
      <p className="mt-3 text-xs font-sans text-black/45 dark:text-zinc-500">
        {test.label}, independent results. Scores close together may be statistical ties; the tables below say which.
      </p>
    </section>
  )
}
