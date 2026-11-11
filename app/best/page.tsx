import type { Metadata } from "next"
import Link from "next/link"
import Header from "@/components/header"
import { datasetRevision } from "@/data/revision"
import { safeJsonLd } from "@/lib/utils"
import { SITE, breadcrumbList, faqPage } from "@/lib/seo"
import { buildBestAnswers } from "@/lib/best"
import { INDEPENDENT_EVALUATOR, buildIndependentBoards } from "@/lib/independent"
import { modelsData } from "@/data/models"
import ModelPicker, { type PickerModel, type PickerTest } from "@/components/model-picker"
import RankingsSwitcher from "@/components/rankings-switcher"
import { ArrowLeft, ArrowUpRight } from "lucide-react"

export const metadata: Metadata = {
  title: "Best AI model by task: coding, science, price, context",
  description:
    "Which AI model leads each test right now, from independent results run on the same tasks for every model, with the score, the size of the field, the runners-up and which models are statistically tied.",
  alternates: { canonical: `${SITE}/best` },
  openGraph: {
    title: "Best AI model by task",
    description:
      "The highest independent score on each named test among current models, with the field size, the runners-up and the ties.",
    url: `${SITE}/best`,
    siteName: "ModelRegistry",
    type: "article",
  },
}

export default function BestPage() {
  const answers = buildBestAnswers()
  const boards = buildIndependentBoards(modelsData)
  const TASK_NAME: Record<string, string> = {
    intelligenceIndex: "Anything (overall score)",
    frontierCode: "Writing and fixing code",
    terminalBench4: "Agentic command-line work",
    hleDiamond: "Hard expert questions",
    automationBench: "Automating business workflows",
    omniscience: "Factual reliability",
    critPt: "Research-level physics",
    terminalBenchScience: "Scientific workflows",
    aaBriefcase: "Long business deliverables",
    gdpPdf: "Long professional documents",
    arenaText: "Everyday chat (human preference)",
  }
  const pickerTests: PickerTest[] = boards
    .filter((board) => TASK_NAME[board.info.key])
    .map((board) => ({
      key: board.info.key,
      label: board.test,
      task: TASK_NAME[board.info.key],
      unit: board.info.unit,
    }))
  const pickerModels = new Map<string, PickerModel>()
  for (const board of boards) {
    for (const entry of board.entries) {
      const row = pickerModels.get(entry.model.id) ?? {
        id: entry.model.id,
        name: entry.model.name,
        lab: entry.model.companyName,
        open: entry.model.openWeights,
        cost: typeof entry.record.costPerTask === "number" ? entry.record.costPerTask : null,
        scores: {},
      }
      row.scores[board.info.key] = entry.value
      pickerModels.set(entry.model.id, row)
    }
  }

  const faq = [
    ...answers.map((answer) => ({
      q: `${answer.question.replace(/^Best AI model for /, "What is the best AI model for ").replace(/^Cheapest AI model by /, "What is the cheapest AI model by ").replace(/^Longest context window$/, "Which AI model has the longest context window")}?`,
      a: `${answer.answer} ${answer.caveat}`,
    })),
    {
      q: "What is the best AI model overall?",
      a: `${answers[0]?.answer ?? ""} No model leads every test, so check the task closest to your own work: the leaders differ by task, and the cheapest strong option is not the highest scorer. Dataset revision ${datasetRevision.datasetVersion}.`,
    },
  ]

  return (
    <main className="relative min-h-screen">
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(faqPage(faq)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(
            breadcrumbList([
              { name: "Ledger", path: "/" },
              { name: "Best by task", path: "/best" },
            ]),
          ),
        }}
      />

      <section className="max-w-4xl mx-auto w-full px-4 sm:px-6 md:px-20 pb-20">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2.5 mb-7 text-xs font-sans leading-relaxed text-black/50 dark:text-zinc-400"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-1 hover:text-accent-ink transition-colors duration-150"
          >
            <ArrowLeft size={13} />
            <span>Ledger</span>
          </Link>
          <span>/</span>
          <span className="font-medium text-accent-ink">Best by task</span>
        </nav>

        <RankingsSwitcher current="/best" />

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-semibold tracking-tight text-black dark:text-white mb-3">
          Which AI model is best for what?
        </h1>
        <p className="text-base text-black/65 dark:text-zinc-400 leading-7 max-w-2xl mb-3">
          Each answer is the highest score on one named test, among current models that all took that
          test, run by one independent evaluator with the same tasks and harness. No laboratory chose
          the test or the settings. Where the number of tasks is small enough that a lead could be
          noise, the page says which models cannot be separated from the leader.
        </p>
        <p className="text-sm font-sans text-black/50 dark:text-zinc-500 leading-6 max-w-2xl mb-10">
          Scores are from Artificial Analysis, read {INDEPENDENT_EVALUATOR.retrievedAt}, and are not reproduced by ModelRegistry. Dataset revision{" "}
          {datasetRevision.datasetVersion}. Superseded models are excluded: you cannot choose them
          today.{" "}
          <Link href="/score" className="text-accent-ink hover:underline underline-offset-2">
            Full per-test tables and the cross-test standing
          </Link>
          .
        </p>

        <ModelPicker tests={pickerTests} models={[...pickerModels.values()]} />

        <nav aria-label="Jump to a question" className="mb-10 flex flex-wrap gap-2">
          {answers.map((answer) => (
            <a
              key={answer.id}
              href={`#${answer.id.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`}
              className="inline-flex min-h-9 items-center rounded-full border border-black/10 px-3 text-xs font-sans text-black/65 transition-colors hover:text-black dark:border-white/15 dark:text-zinc-400 dark:hover:text-white"
            >
              {answer.question
                .replace(/^Best AI model for /, "")
                .replace(/^Best AI model /, "")
                .replace(/^Most /, "")
                .replace(/^Cheapest AI model by /, "Cheapest ")}
            </a>
          ))}
        </nav>

        <div className="space-y-10">
          {answers.map((answer) => (
            <article
              key={answer.id}
              id={answer.id.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}
              className="border-t border-black/10 dark:border-white/[0.08] pt-5"
            >
              <h2 className="text-lg sm:text-xl font-display font-semibold tracking-tight text-black dark:text-white mb-2">
                {answer.question}
              </h2>
              <p className="text-sm sm:text-base text-black/75 dark:text-zinc-300 leading-7 max-w-2xl mb-4">
                {answer.answer}
              </p>

              <ol className="mb-3">
                {answer.entries.map((entry) => (
                  <li key={entry.model.id}>
                    <Link
                      href={`/models/${entry.model.id}`}
                      className="group flex items-baseline gap-3 py-2.5 border-b border-black/10 dark:border-white/[0.08]"
                    >
                      <span className="w-5 shrink-0 text-xs font-sans tabular-nums text-black/30 dark:text-zinc-600">
                        {entry.rank}
                      </span>
                      <span className="text-sm font-medium tracking-tight text-black dark:text-white group-hover:text-accent-ink transition-colors">
                        {entry.model.name}
                      </span>
                      <span className="hidden sm:inline text-xs font-sans text-black/45 dark:text-zinc-500">
                        {entry.model.companyName}
                      </span>
                      <span className="ml-auto text-sm font-sans font-semibold tabular-nums text-black dark:text-white">
                        {entry.value}
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>

              {answer.openLeader && (
                <p className="text-sm font-sans text-black/60 dark:text-zinc-400 leading-6 mb-2">
                  Best open-weights result on this test:{" "}
                  <Link
                    href={`/models/${answer.openLeader.model.id}`}
                    className="text-accent-ink hover:underline underline-offset-2"
                  >
                    {answer.openLeader.model.name}
                  </Link>{" "}
                  ({answer.openLeader.value}, rank {answer.openLeader.rank} of {answer.field}).
                </p>
              )}

              <p className="text-xs font-sans text-black/50 dark:text-zinc-500 leading-6 max-w-2xl">
                {answer.caveat}{" "}
                <Link
                  href={answer.href}
                  className="inline-flex items-center gap-0.5 text-accent-ink hover:underline underline-offset-2"
                >
                  Full table
                  <ArrowUpRight size={11} aria-hidden="true" />
                </Link>
              </p>
            </article>
          ))}
        </div>

        <section className="mt-12 border-t border-black/10 dark:border-white/[0.08] pt-5">
          <h2 className="text-lg font-display font-semibold tracking-tight text-black dark:text-white mb-2">
            What is the best AI model overall?
          </h2>
          <p className="text-sm sm:text-base text-black/70 dark:text-zinc-400 leading-7 max-w-2xl">
            {answers[0]?.entries[0] ? `${answers[0].entries[0].model.name} has the highest overall score here, ` : ""}
            but no model leads every test, and the highest scorer is rarely the best value. The leaders
            above differ by task, and the cost table shows what each point costs. Pick the task
            closest to your work, then check the{" "}
            <Link href="/compare" className="text-accent-ink hover:underline underline-offset-2">
              head-to-head comparison
            </Link>{" "}
            of the two or three models you are weighing.
          </p>
        </section>
      </section>
    </main>
  )
}
