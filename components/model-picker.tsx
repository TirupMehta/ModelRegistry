"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import Select from "@/components/select"

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

const BUDGETS: [string, string][] = [
  ["any", "Any budget"],
  ["1", "Up to $1 per task"],
  ["5", "Up to $5 per task"],
  ["10", "Up to $10 per task"],
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

  return (
    <section
      aria-labelledby="picker-heading"
      className="tile mb-10 p-5 sm:p-6"
    >
      <h2
        id="picker-heading"
        className="mb-4 font-display text-heading font-semibold tracking-tight text-fg-strong"
      >
        Find a model for your job
      </h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto] sm:items-end">
        <Select
          id="picker-task"
          label="What do you need it for"
          value={test.key}
          options={tests.map((candidate): [string, string] => [candidate.key, candidate.task])}
          onChange={setTestKey}
        />
        <Select id="picker-budget" label="Budget" value={budget} options={BUDGETS} onChange={setBudget} />
        <button
          type="button"
          role="switch"
          aria-checked={openOnly}
          onClick={() => setOpenOnly((value) => !value)}
          className="flex h-10 items-center gap-2.5 rounded-lg border border-[var(--field-edge)] bg-[var(--surface-field)] px-3 text-small text-fg transition-colors hover:border-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ink/30 dark:hover:border-white/40"
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
