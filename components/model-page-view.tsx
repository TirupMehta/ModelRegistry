"use client"

import { useState } from "react"
import Link from "next/link"
import { type ModelItem } from "@/data/models"
import { companies } from "@/data/companies"
import { independentRecords } from "@/data/independent-benchmarks"
import { formatPrice, formatDate } from "@/lib/utils"
import { ShareCardModal } from "@/components/share-card-modal"
import { reportIssueUrl } from "@/components/verification-section"
import { ProviderAvailability } from "@/components/provider-availability"
import {
  ExternalLink,
  Layers,
  Cpu,
  DollarSign,
  ShieldCheck,
  Check,
  Link2,
  Terminal,
  Share2,
  ArrowLeft,
  Copy,
  ChevronRight,
} from "lucide-react"
import { tapFeedback, selectFeedback, successFeedback } from "@/lib/feedback"

interface ModelPageViewProps {
  model: ModelItem
  // Computed server-side (see app/models/[id]/page.tsx) so this client
  // view never bundles the full dataset for three links and a folio.
  siblings: ModelItem[]
  folio: string
  folioId: string
  // Server-rendered dossier sections (provenance, evidence, FAQ, comparisons).
  // Passed as children so their copy ships in the initial HTML at zero client
  // cost, while still rendering inside the datasheet's <main> landmark.
  children?: React.ReactNode
  // Sources strip, rendered as the last row inside the datasheet card.
  footer?: React.ReactNode
}

/** "57.0% (Terminal-Bench 4.1, cheating-adjusted)" -> headline "57.0%", note "Terminal-Bench 4.1, cheating-adjusted". */
function splitValue(text: string): { head: string; note: string } {
  const open = text.indexOf(" (")
  if (open < 0) return { head: text, note: "" }
  return { head: text.slice(0, open), note: text.slice(open + 2).replace(/[)]$/, "") }
}

function Bar({ label, value, tone }: { label: string; value: string; tone: "lab" | "independent" }) {
  const pct = Math.max(0, Math.min(100, parseFloat(value)))
  const isPercent = value.trim().endsWith("%") && Number.isFinite(pct)
  return (
    <div className="grid grid-cols-[5.5rem_1fr_3rem] items-center gap-3 text-xs sm:grid-cols-[6rem_1fr_3.5rem]">
      <span className="text-black/55 dark:text-zinc-400">{label}</span>
      <span className="h-2 overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/[0.08]" aria-hidden="true">
        {isPercent && (
          <span
            className={`block h-full rounded-full ${tone === "independent" ? "bg-black dark:bg-white" : "bg-accent"}`}
            style={{ width: `${pct}%` }}
          />
        )}
      </span>
      <span className="text-right text-sm font-semibold tabular-nums text-black dark:text-white">{value}</span>
    </div>
  )
}

function BenchRow({ label, value, independent }: { label: string; value?: string; independent?: string }) {
  const { head, note } = value ? splitValue(value) : { head: "", note: "" }
  return (
    <div className="rounded-lg bg-black/[0.02] p-3.5 dark:bg-white/[0.03] sm:p-4">
      <div>
        <div className="text-base font-semibold leading-snug text-black dark:text-white">{label}</div>
        {note && <div className="mt-0.5 text-xs leading-4 text-black/50 dark:text-zinc-400">{note}</div>}
      </div>
      <div className="mt-3 space-y-2">
        {head && <Bar label="Lab reported" value={head} tone="lab" />}
        {independent && <Bar label="Independent" value={independent} tone="independent" />}
      </div>
    </div>
  )
}

export default function ModelPageView({ model, siblings, folio, folioId, children, footer }: ModelPageViewProps) {
  const independentTerminalBench = independentRecords.find((record) => record.modelId === model.id)?.values.terminalBench4
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [isShareStudioOpen, setIsShareStudioOpen] = useState(false)
  const [activeSnippetTab, setActiveSnippetTab] = useState<"curl" | "python" | "local">("curl")

  const company = companies[model.companyId]

  const handleCopyLink = () => {
    try {
      const url = `https://modelregistry.tirup.in/models/${model.id}`
      navigator.clipboard.writeText(url)
    } catch {
      // Clipboard unavailable (e.g. non-secure context) - still confirm.
    }
    successFeedback()
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const switchSnippetTab = (tab: "curl" | "python" | "local") => {
    selectFeedback()
    setActiveSnippetTab(tab)
  }

  const curlCommand = `curl -s https://modelregistry.tirup.in/api/cli?model=${model.id}`

  // Snippets never invent identifiers. The only verified local handle is
  // links.weights when it points at an exact repo (org/name). Org pages,
  // bare domains, or missing links yield a template with a placeholder the
  // user must fill in - never a guessed repo or Ollama tag.
  const weightsUrl = model.links?.weights
  const weightRepo = weightsUrl?.match(/^https:\/\/huggingface\.co\/([^/\s]+\/[^/\s]+)\/?$/)?.[1] ?? null

  // True when the visible snippet runs as-is against a verified handle.
  const isSnippetVerified =
    activeSnippetTab === "curl" ||
    (!model.openWeights && activeSnippetTab === "local") ||
    (model.openWeights && weightRepo !== null)

  // Generate clean developer code snippets
  const getPythonSnippet = () => {
    if (model.openWeights) {
      if (weightRepo) {
        return `# Run ${model.name} locally - weights: ${weightsUrl}
from transformers import AutoModelForCausalLM, AutoTokenizer

repo = "${weightRepo}"
tok = AutoTokenizer.from_pretrained(repo)
model = AutoModelForCausalLM.from_pretrained(repo, device_map="auto")
print(tok.decode(model.generate(**tok("Explain quantum error correction:", return_tensors="pt"), max_new_tokens=256)[0])))`
      }
      return `# Template - replace <weights-repo> with the repository from WEIGHTS / REPOSITORY below${
        weightsUrl ? `\n# Start here: ${weightsUrl}` : ""
      }
from transformers import AutoModelForCausalLM, AutoTokenizer

repo = "<weights-repo>"
tok = AutoTokenizer.from_pretrained(repo)
model = AutoModelForCausalLM.from_pretrained(repo, device_map="auto")`
    }
    return `# Template - set base_url and api key per your provider
from openai import OpenAI

client = OpenAI()
response = client.chat.completions.create(
    model="${model.id}",
    messages=[{"role": "user", "content": "Explain quantum error correction:"}],
)
print(response.choices[0].message.content)`
  }

  const getLocalRunSnippet = () => {
    if (model.openWeights) {
      if (weightRepo) {
        return `# Serve with vLLM from the verified repository
vllm serve ${weightRepo} --tensor-parallel-size 4`
      }
      return `# Template - no exact weights repo on file for ${model.id}${
        weightsUrl ? `\n# Start here: ${weightsUrl}` : "\n# See WEIGHTS / REPOSITORY below when published"
      }\n# Then: vllm serve <weights-repo> --tensor-parallel-size 4`
    }
    return `# Query ModelRegistry live terminal datasheet
curl -s https://modelregistry.tirup.in/api/cli?model=${model.id}`
  }

  const handleCopyCode = (code: string) => {
    try {
      navigator.clipboard.writeText(code)
    } catch {
      // Clipboard unavailable - still confirm to avoid a dead button.
    }
    successFeedback()
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const copyActiveSnippet = () => {
    const code =
      activeSnippetTab === "curl"
        ? curlCommand
        : activeSnippetTab === "python"
        ? getPythonSnippet()
        : getLocalRunSnippet()
    handleCopyCode(code)
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] dark:bg-[var(--bg)] text-[var(--fg)] dark:text-[var(--fg)] transition-colors duration-150">
      <main className="max-w-4xl mx-auto w-full px-4 pb-10 sm:px-6 md:px-20">
        {/* Breadcrumb Navigation */}
        <div className="mb-5 flex items-center gap-2.5 overflow-x-auto whitespace-nowrap text-xs font-sans leading-relaxed text-black/50 [scrollbar-width:none] [-ms-overflow-style:none] dark:text-zinc-400 [&::-webkit-scrollbar]:hidden">
          <Link
            href="/"
            className="inline-flex items-center gap-1 hover:text-accent-ink transition-colors duration-150 shrink-0"
          >
            <ArrowLeft size={13} />
            <span>Ledger</span>
          </Link>
          <span className="shrink-0">/</span>
          <Link
            href={`/companies/${model.companyId}`}
            className="text-black/70 dark:text-zinc-300 truncate hover:text-accent-ink transition-colors duration-150"
          >
            {model.companyName}
          </Link>
          <span className="shrink-0">/</span>
          <span className="text-accent-ink font-medium truncate">{model.id}</span>
        </div>

        {/* Datasheet Container */}
        <div className="bg-white dark:bg-[var(--surface-raised)] border border-black/10 dark:border-white/[0.08] rounded-2xl shadow-sm ring-1 ring-black/5 dark:ring-white/5 p-4 sm:p-9 mb-6 sm:mb-8 leading-relaxed">
          {/* Top Control Bar */}
          <div className="flex items-center justify-between gap-3 border-b border-black/10 dark:border-white/[0.08] pb-4 mb-6">
            <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] font-sans text-accent-ink min-w-0">
              <Terminal size={13} className="shrink-0" />
              <span className="truncate text-sm font-medium">Datasheet</span>
              <span className="hidden truncate font-mono text-xs text-black/45 sm:inline dark:text-zinc-500">
                {model.id}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => {
                  tapFeedback()
                  setIsShareStudioOpen(true)
                }}
                title="Export Instagram Story / Social Card"
                className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded border border-black/10 px-2.5 font-sans text-xs text-black/60 transition-colors duration-150 hover:border-accent hover:text-accent-ink dark:border-white/[0.08] dark:text-zinc-400"
              >
                <Share2 size={12} className="shrink-0" />
                <span className="hidden sm:inline">Export card</span>
                <span className="sm:hidden">Export</span>
              </button>

              <button
                onClick={handleCopyLink}
                title="Copy shareable permalink"
                className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded border border-black/10 px-2.5 font-sans text-xs text-black/60 transition-colors duration-150 hover:border-accent hover:text-accent-ink dark:border-white/[0.08] dark:text-zinc-400"
              >
                {copiedLink ? <Check size={12} className="text-good shrink-0" /> : <Link2 size={12} className="shrink-0" />}
                <span className="hidden sm:inline">{copiedLink ? "Copied" : "Share link"}</span>
                <span className="sm:hidden">{copiedLink ? "Copied" : "Share"}</span>
              </button>
            </div>
          </div>

          {/* Lab info & Release Stamp */}
          <div className="flex items-center gap-2.5 mb-4 text-xs font-sans tracking-wide leading-relaxed">
            <span
              className="w-2.5 h-2.5 rounded-sm shrink-0"
              style={{ backgroundColor: company?.accentColor || "rgb(var(--accent-rgb))" }}
            />
            <span className="font-medium text-black/70 dark:text-zinc-300">
              {model.companyName}
            </span>
            <span className="text-black/20 dark:text-white/20 select-none">/</span>
            <span className="text-black/50 dark:text-zinc-400">
              Released {formatDate(model.releaseDate)}
            </span>
          </div>

          {/* Model Title & SOTA Badge */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-4 sm:mb-5">
            <h1 className="text-[22px] sm:text-3xl md:text-4xl font-display font-semibold tracking-tight leading-snug sm:leading-tight text-black dark:text-white">
              {model.name}
            </h1>
            <span className="text-[11px] font-sans px-2.5 py-1 rounded border border-accent/40 text-accent-ink bg-accent/5 font-medium leading-relaxed">
              {model.statusBadge}
            </span>
          </div>

          {/* Description Highlight */}
          <p className="text-sm sm:text-[15px] font-normal text-black/70 dark:text-zinc-300 leading-6 sm:leading-7 tracking-normal mb-5 sm:mb-7 max-w-3xl">
            {model.highlight}
          </p>

          {/* Key Hardware Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5 mb-6 sm:mb-8 text-xs font-sans">
            <div className="p-3.5 sm:p-4 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] leading-relaxed">
              <div className="flex items-center gap-1.5 text-black/50 dark:text-zinc-400 mb-1.5 text-xs">
                <Layers size={13} />
                <span>Context</span>
              </div>
              <div className="text-base font-semibold leading-6 text-black dark:text-white">
                {splitValue(model.contextWindow).head}
                {splitValue(model.contextWindow).note && <span className="mt-1 block text-sm font-normal text-black/60 dark:text-zinc-400">{splitValue(model.contextWindow).note}</span>}
              </div>
            </div>

            <div className="p-3.5 sm:p-4 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] leading-relaxed">
              <div className="flex items-center gap-1.5 text-black/50 dark:text-zinc-400 mb-1.5 text-xs">
                <Cpu size={13} />
                <span>Architecture</span>
              </div>
              <div className="break-words text-base font-medium leading-6 text-black dark:text-white">
                {splitValue(model.parameters).head}
                {splitValue(model.parameters).note && <span className="mt-1 block text-sm font-normal text-black/60 dark:text-zinc-400">{splitValue(model.parameters).note}</span>}
              </div>
            </div>

            <div className="p-3.5 sm:p-4 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] leading-relaxed">
              <div className="flex items-center gap-1.5 text-black/50 dark:text-zinc-400 mb-1.5 text-xs">
                <DollarSign size={13} />
                <span>Official API{model.pricingUnit ? "" : " (1M)"}</span>
              </div>
              <div className="text-base font-semibold leading-6 text-black dark:text-white">
                <span>
                  {formatPrice(model)}
                </span>
                {model.openWeights && (
                  <span className="mt-1 block text-xs font-sans font-normal leading-relaxed text-black/60 dark:text-zinc-400">
                    + Weights Free to Self-Host
                  </span>
                )}
              </div>
            </div>

            <div className="p-3.5 sm:p-4 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] leading-relaxed">
              <div className="flex items-center gap-1.5 text-black/50 dark:text-zinc-400 mb-1.5 text-xs">
                <ShieldCheck size={13} />
                <span>License</span>
              </div>
              <div className="break-words text-base font-medium leading-6 text-black dark:text-white">
                {model.license}
              </div>
            </div>
          </div>

          <ProviderAvailability modelId={model.id} />

          {/* Verified Benchmarks Section */}
          {Object.keys(model.benchmarks).length > 0 && (
            <div className="mb-6 border-t border-black/10 pt-5 sm:mb-8 dark:border-white/[0.08]">
              <h2 className="mb-1 font-display text-lg font-semibold tracking-tight text-black dark:text-white">
                Published benchmarks, lab reported
              </h2>
              <p className="-mt-1 mb-4 text-sm font-sans text-black/60 dark:text-zinc-500">
                Figures published by the lab, not reproduced independently.
              </p>
              {(() => {
                const rows: { key: string; label: string; value?: string; independent?: string }[] = [
                  { key: "swe", label: "SWE-bench", value: model.benchmarks.sweBench },
                  { key: "tb", label: "Terminal-Bench", value: model.benchmarks.terminalBench, independent: independentTerminalBench !== undefined ? `${independentTerminalBench.toFixed(1)}%` : undefined },
                  { key: "aime", label: "AIME 2024", value: model.benchmarks.aime2024 },
                  { key: "mmlu", label: "MMLU-Pro", value: model.benchmarks.mmluPro },
                  { key: "gpqa", label: "GPQA Diamond", value: model.benchmarks.gpqa },
                ]
                const visible = rows.filter((r) => r.value || r.independent)
                const showIndependent = visible.some((r) => r.independent)
                return (
                  <div className="font-sans">
                    <div className="space-y-2.5">
                      {visible.map((r) => (
                        <BenchRow key={r.key} label={r.label} value={r.value} independent={r.independent} />
                      ))}
                    </div>
                    {showIndependent && (
                      <p className="mt-2.5 text-xs text-black/50 dark:text-zinc-400">
                        Independent runs by Artificial Analysis on Terminal-Bench 4.0.
                      </p>
                    )}
                  </div>
                )
              })()}
            </div>
          )}

          {/* Shipped Variants (e.g. API twins) */}
          {model.variants && model.variants.length > 0 && (
            <div className="mb-6 border-t border-black/10 pt-5 sm:mb-8 dark:border-white/[0.08]">
              <h2 className="mb-3.5 font-display text-lg font-semibold tracking-tight text-black dark:text-white">
                Shipped variants
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5 font-sans text-xs">
                {model.variants.map((variant) => (
                  <div
                    key={variant.name}
                    className="border border-black/10 dark:border-white/[0.08] rounded-lg p-4 sm:p-[18px] bg-white dark:bg-[var(--surface-raised)] leading-relaxed flex flex-col"
                  >
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 mb-2">
                      <span className="text-[13px] sm:text-sm font-semibold text-black dark:text-white tracking-wide">
                        {variant.name}
                      </span>
                      <span className="rounded border border-black/10 bg-black/[0.02] px-1.5 py-0.5 text-[11px] text-black/60 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/60">
                        {variant.role}
                      </span>
                    </div>
                    <p className="text-[13px] sm:text-sm text-black/60 dark:text-zinc-400 leading-[1.7]">
                      {variant.detail}
                    </p>
                    <p className="tabular-nums text-[13px] sm:text-sm text-black/80 dark:text-zinc-200 font-medium mt-2.5 pt-2.5 border-t border-dashed border-black/10 dark:border-white/10 leading-6 break-words">
                      {variant.pricingNote}
                    </p>
                    {variant.link && (
                      <a
                        href={variant.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2.5 text-xs text-black/60 dark:text-zinc-400 hover:text-accent-ink transition-colors duration-150"
                      >
                        <ExternalLink size={12} />
                        <span>Official docs</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quickstart Developer Code Snippet */}
          <div className="mb-6 sm:mb-8 border border-black/10 dark:border-white/[0.08] rounded-xl overflow-hidden shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 bg-black/[0.03] dark:bg-[var(--surface-hover)] px-3.5 sm:px-4 py-2.5 border-b border-black/10 dark:border-white/[0.08]">
              <div className="flex items-center justify-between gap-2 min-w-0">
                <span className="inline-flex items-center gap-2.5">
                  <span className="shrink-0 text-sm font-medium text-black/70 dark:text-zinc-300">
                    Quickstart
                  </span>
                </span>
                <button
                  onClick={copyActiveSnippet}
                  className="inline-flex h-7 shrink-0 cursor-pointer items-center gap-1 text-xs font-sans text-black/50 hover:text-black sm:hidden dark:text-zinc-400 dark:hover:text-white"
                >
                  {copiedCode ? <Check size={12} className="text-good" /> : <Copy size={12} />}
                  <span>{copiedCode ? "Copied" : "Copy"}</span>
                </button>
              </div>

              <div className="flex items-center gap-1 text-[11px] font-sans overflow-x-auto max-w-full [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <button
                  onClick={() => switchSnippetTab("curl")}
                  className={`h-7 shrink-0 cursor-pointer whitespace-nowrap rounded px-2.5 transition-colors duration-150 ${
                    activeSnippetTab === "curl"
                      ? "bg-black/10 dark:bg-white/10 text-black dark:text-white font-medium"
                      : "text-black/40 dark:text-zinc-400 hover:text-black dark:hover:text-white"
                  }`}
                >
                  cURL
                </button>
                <button
                  onClick={() => switchSnippetTab("python")}
                  className={`h-7 shrink-0 cursor-pointer whitespace-nowrap rounded px-2.5 transition-colors duration-150 ${
                    activeSnippetTab === "python"
                      ? "bg-black/10 dark:bg-white/10 text-black dark:text-white font-medium"
                      : "text-black/40 dark:text-zinc-400 hover:text-black dark:hover:text-white"
                  }`}
                >
                  Python
                </button>
                <button
                  onClick={() => switchSnippetTab("local")}
                  className={`h-7 shrink-0 cursor-pointer whitespace-nowrap rounded px-2.5 transition-colors duration-150 ${
                    activeSnippetTab === "local"
                      ? "bg-black/10 dark:bg-white/10 text-black dark:text-white font-medium"
                      : "text-black/40 dark:text-zinc-400 hover:text-black dark:hover:text-white"
                  }`}
                >
                  {model.openWeights ? "Ollama / vLLM" : "Terminal CLI"}
                </button>
                <button
                  onClick={copyActiveSnippet}
                  className="ml-auto hidden h-7 shrink-0 cursor-pointer items-center gap-1 pl-2 text-xs font-sans text-black/50 hover:text-black sm:inline-flex dark:text-zinc-400 dark:hover:text-white"
                >
                  {copiedCode ? <Check size={12} className="text-good" /> : <Copy size={12} />}
                  <span>{copiedCode ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>

            <pre className="p-4 sm:p-5 bg-black/[0.02] dark:bg-[var(--surface-bar)] text-sm sm:text-[15px] font-mono overflow-x-auto text-black/80 dark:text-zinc-200 leading-6 sm:leading-7 tracking-wide">
              <code className={activeSnippetTab === "curl" ? "whitespace-pre-wrap break-all" : "whitespace-pre"}>
                {activeSnippetTab === "curl"
                  ? curlCommand
                  : activeSnippetTab === "python"
                  ? getPythonSnippet()
                  : getLocalRunSnippet()}
              </code>
            </pre>
            {!isSnippetVerified && (
              <p className="px-3.5 sm:px-5 py-2 text-[11px] font-sans tracking-wide text-black/45 dark:text-zinc-500 border-t border-black/10 dark:border-white/[0.08]">
                Template - adapt repo, model name, and endpoint to your provider before running.
              </p>
            )}
          </div>

          {/* External Links Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-5 border-t border-black/10 dark:border-white/[0.08] text-xs font-sans tracking-wide leading-relaxed">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5">
              {model.links?.announcement && (
                <a
                  href={model.links.announcement}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-black/60 dark:text-zinc-400 hover:text-accent-ink transition-colors duration-150"
                >
                  <ExternalLink size={13} />
                  <span>Official announcement</span>
                </a>
              )}
              {model.links?.paper && (
                <a
                  href={model.links.paper}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-black/60 dark:text-zinc-400 hover:text-accent-ink transition-colors duration-150"
                >
                  <ExternalLink size={13} />
                  <span>Research paper</span>
                </a>
              )}
              {model.links?.weights && (
                <a
                  href={model.links.weights}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-good dark:text-good hover:underline"
                >
                  <ExternalLink size={13} />
                  <span>Weights and repository</span>
                </a>
              )}
              {model.links?.apiDocs && (
                <a
                  href={model.links.apiDocs}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-black/60 dark:text-zinc-400 hover:text-accent-ink transition-colors duration-150"
                >
                  <ExternalLink size={13} />
                  <span>API docs</span>
                </a>
              )}
            </div>

            <a
              href={reportIssueUrl(model.id)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-black/45 transition-colors duration-150 hover:text-accent-ink dark:text-zinc-500"
            >
              Report an error
            </a>
          </div>

          {footer}
        </div>

        {children}

        {/* Same-lab internal links: siblings + lab profile */}
        {siblings.length > 0 && (
          <nav
            aria-label={`More models from ${model.companyName}`}
            className="mb-6 sm:mb-8"
          >
            <h2 className="text-xs font-sans font-medium text-black/60 dark:text-zinc-400 leading-relaxed mb-3">
              More from {model.companyName}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {siblings.map((sibling) => (
                <Link
                  key={sibling.id}
                  href={`/models/${sibling.id}`}
                  className="group block p-3.5 rounded-xl border border-black/10 dark:border-white/[0.08] bg-white dark:bg-[var(--surface-raised)] hover:border-accent/40 transition-colors duration-150"
                >
                  <div className="text-sm font-medium tracking-tight text-black dark:text-white group-hover:text-accent-ink transition-colors duration-150 truncate">
                    {sibling.name}
                  </div>
                  <div className="mt-1 text-[11px] font-sans text-black/45 dark:text-zinc-400 truncate">
                    {sibling.categoryLabel}, {formatDate(sibling.releaseDate)}
                  </div>
                </Link>
              ))}
            </div>
            <Link
              href={`/companies/${model.companyId}`}
              className="mt-3 inline-flex items-center gap-1 text-[11px] font-sans text-black/50 dark:text-zinc-400 hover:text-accent-ink transition-colors duration-150"
            >
              <span>All {model.companyName} models</span>
              <ChevronRight size={12} />
            </Link>
          </nav>
        )}
      </main>

      {/* Share Studio Modal */}
      <ShareCardModal
        isOpen={isShareStudioOpen}
        onClose={() => setIsShareStudioOpen(false)}
        model={model}
        folio={folio}
        folioId={folioId}
      />
    </div>
  )
}
