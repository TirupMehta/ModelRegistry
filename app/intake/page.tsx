import type { Metadata } from "next"
import fs from "node:fs"
import path from "node:path"
import { notFound } from "next/navigation"
import Header from "@/components/header"
import ModelPageView from "@/components/model-page-view"
import { ModelProvenance } from "@/components/model-dossier"
import { modelsData, type ModelItem } from "@/data/models"
import { modelFolio, modelSiblings } from "@/lib/registry"

// Local preview of a model produced by scripts/intake.mjs. It shows the
// candidate record exactly as the live model page would render it, with the
// machine checks above it. Nothing is saved; it is not available in production.
export const metadata: Metadata = { title: "Intake preview", robots: { index: false, follow: false } }

interface Report {
  id: string
  ranAt: string
  base: string
  checks: { field: string; source: string; quote: string; status: string; detail: string }[]
  maintainerDecided: string[]
  handover: string[]
  independent: boolean
  nextSteps: string[]
  diffLines: number
  differsFromRegistry: string[] | null
}

function read<T>(file: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), ".intake", file), "utf8")) as T
  } catch {
    return null
  }
}

export default async function IntakePreview({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound()
  const { id = "gemini-4-hydrogen" } = await searchParams
  const candidate = read<ModelItem>(`${id}/candidate.json`)
  const report = read<Report>(`${id}/report.json`)
  if (!candidate || !report) {
    return (
      <main className="p-10 text-body">
        No intake output for <code>{id}</code>. Run <code>node scripts/intake.mjs scripts/intake/{id}.facts.json</code>.
      </main>
    )
  }
  const siblings = modelSiblings(candidate, 3, modelsData)
  const { folio, folioId } = modelFolio(candidate.id, modelsData)

  return (
    <>
      <Header />
      <section className="page-x mb-8">
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/[0.06] p-5 text-body leading-6 text-fg">
          <p className="font-semibold text-fg-strong mb-1">
            Intake preview. Not published. Built by the intake script from the lab&apos;s own pages.
          </p>
          <p className="mb-3 text-fg-muted">
            Each fact below was found, as a sentence, on the live page at {report.ranAt.slice(0, 16).replace("T", " ")} UTC.
            A person only reads the diff and applies it. Fields still set by the maintainer: {report.maintainerDecided.join(", ")}.
          </p>
          <ul className="grid gap-1">
            {report.checks.map((c, i) => (
              <li key={i} className="flex gap-3">
                <span className={`w-14 shrink-0 font-medium ${c.status === "found" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                  {c.status === "found" ? "found" : "FLAG"}
                </span>
                <span className="w-32 shrink-0">{c.field}</span>
                <span className="text-fg-muted">&quot;{c.quote}&quot;</span>
              </li>
            ))}
          </ul>
          <p className="mt-3">
            Role handover applied to: {report.handover.join(", ") || "none"}. Independent results row read: {report.independent ? "yes" : "no"}. Diff of
            data/models.ts: {report.diffLines} lines (.intake/{report.id}/models.patch.diff). Built against {report.base}.
          </p>
        </div>
      </section>
      <ModelPageView model={candidate} siblings={siblings} folio={folio} folioId={folioId} footer={<ModelProvenance model={candidate} />} />
    </>
  )
}
