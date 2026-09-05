"use client"

import { useState } from "react"
import Link from "next/link"
import { type ModelItem } from "@/data/models"
import { companies } from "@/data/companies"
import Header from "@/components/header"
import { ShareCardModal } from "@/components/share-card-modal"
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

interface ModelPageViewProps {
  model: ModelItem
}

export default function ModelPageView({ model }: ModelPageViewProps) {
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedCurl, setCopiedCurl] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [isShareStudioOpen, setIsShareStudioOpen] = useState(false)
  const [activeSnippetTab, setActiveSnippetTab] = useState<"curl" | "python" | "local">("curl")

  const company = companies[model.companyId]

  const formatDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-").map(Number)
    const date = new Date(y, m - 1, d)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const handleCopyLink = () => {
    const url = `https://modelregistry.tirup.in/models/${model.id}`
    navigator.clipboard.writeText(url)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const curlCommand = `curl -s https://modelregistry.tirup.in/api/cli?model=${model.id}`

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(curlCommand)
    setCopiedCurl(true)
    setTimeout(() => setCopiedCurl(false), 2000)
  }

  // Generate clean developer code snippets
  const getPythonSnippet = () => {
    if (model.openWeights) {
      return `# Run locally via vLLM or Hugging Face
from vllm import LLM, SamplingParams

llm = LLM(model="${model.companyName.toLowerCase()}/${model.id}")
prompts = ["Explain quantum error correction:"]
outputs = llm.generate(prompts, SamplingParams(temperature=0.7, max_tokens=1024))
print(outputs[0].outputs[0].text)`
    }
    return `# Call ${model.name} via OpenAI-compatible SDK
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
      return `# Pull and run on local GPU or Apple Silicon via Ollama
ollama run ${model.id.replace(/-128e|-pro|-flash/g, "")}

# Or serve high-throughput API with vLLM
vllm serve ${model.companyName.toLowerCase()}/${model.id} --tensor-parallel-size 4`
    }
    return `# Query ModelRegistry live terminal datasheet
curl -s https://modelregistry.tirup.in/api/cli?model=${model.id}`
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  return (
    <div className="min-h-screen bg-[#f7f7f4] dark:bg-[#07080a] text-[#111215] dark:text-[#f4f5f7] transition-colors duration-150">
      <Header />

      <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 md:px-20 py-6 sm:py-10">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2.5 mb-7 text-xs font-mono tracking-wider leading-relaxed text-black/50 dark:text-zinc-400">
          <Link
            href="/"
            className="inline-flex items-center gap-1 hover:text-[#ff5d2e] dark:hover:text-[#ff5d2e] transition-colors duration-150"
          >
            <ArrowLeft size={13} />
            <span>LEDGER</span>
          </Link>
          <span>/</span>
          <span className="uppercase text-black/70 dark:text-zinc-300">{model.companyName}</span>
          <span>/</span>
          <span className="text-[#ff5d2e] font-medium">{model.id}</span>
        </div>

        {/* Datasheet Container */}
        <div className="bg-white dark:bg-[#0e1014] border border-black/10 dark:border-white/[0.08] rounded-xl shadow-sm p-5 sm:p-9 mb-8 leading-relaxed">
          {/* Top Control Bar */}
          <div className="flex items-center justify-between gap-3 border-b border-black/10 dark:border-white/[0.08] pb-4 mb-6">
            <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] font-mono text-[#ff5d2e] min-w-0">
              <Terminal size={13} className="shrink-0" />
              <span className="uppercase tracking-widest font-medium truncate hidden sm:inline">SPEC DATASHEET // {model.id}</span>
              <span className="uppercase tracking-widest font-medium truncate sm:hidden">DATASHEET</span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setIsShareStudioOpen(true)}
                title="Export Instagram Story / Social Card"
                className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded border border-black/10 dark:border-white/[0.08] hover:border-[#ff5d2e] hover:text-[#ff5d2e] text-[10px] sm:text-[11px] font-mono text-black/60 dark:text-zinc-400 transition-colors duration-150 cursor-pointer"
              >
                <Share2 size={12} className="shrink-0" />
                <span className="hidden sm:inline">EXPORT CARD</span>
                <span className="sm:hidden">EXPORT</span>
              </button>

              <button
                onClick={handleCopyLink}
                title="Copy shareable permalink"
                className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded border border-black/10 dark:border-white/[0.08] hover:border-[#ff5d2e] hover:text-[#ff5d2e] text-[10px] sm:text-[11px] font-mono text-black/60 dark:text-zinc-400 transition-colors duration-150 cursor-pointer"
              >
                {copiedLink ? <Check size={12} className="text-emerald-500 shrink-0" /> : <Link2 size={12} className="shrink-0" />}
                <span className="hidden sm:inline">{copiedLink ? "COPIED" : "SHARE LINK"}</span>
                <span className="sm:hidden">{copiedLink ? "COPIED" : "SHARE"}</span>
              </button>
            </div>
          </div>

          {/* Lab info & Release Stamp */}
          <div className="flex items-center gap-2.5 mb-4 text-xs font-mono tracking-wide leading-relaxed">
            <span
              className="w-2.5 h-2.5 rounded-sm shrink-0"
              style={{ backgroundColor: company?.accentColor || "#ff5d2e" }}
            />
            <span className="font-medium uppercase tracking-wider text-black/70 dark:text-zinc-300">
              {model.companyName}
            </span>
            <span className="text-black/20 dark:text-white/20 select-none">/</span>
            <span className="text-black/45 dark:text-zinc-400">
              RELEASED {formatDate(model.releaseDate)}
            </span>
          </div>

          {/* Model Title & SOTA Badge */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5 mb-5">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-semibold tracking-normal leading-tight text-black dark:text-white">
              {model.name}
            </h1>
            <span className="text-[11px] font-mono uppercase px-2.5 py-1 rounded border border-[#ff5d2e]/40 text-[#ff5d2e] bg-[#ff5d2e]/5 font-medium tracking-widest leading-relaxed">
              {model.statusBadge}
            </span>
          </div>

          {/* Description Highlight */}
          <p className="text-[15px] sm:text-[17px] font-light text-black/80 dark:text-zinc-200 leading-7 sm:leading-8 tracking-normal [word-spacing:0.04em] mb-7 sm:mb-9 max-w-3xl">
            {model.highlight}
          </p>

          {/* Key Hardware Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-3.5 mb-7 sm:mb-9 text-xs font-mono">
            <div className="p-4 rounded-lg border border-black/10 dark:border-white/[0.08] bg-black/[0.02] dark:bg-[#13161c] leading-relaxed">
              <div className="flex items-center gap-1.5 text-black/45 dark:text-zinc-400 mb-1.5 text-[11px] tracking-widest">
                <Layers size={13} />
                <span className="uppercase">Context</span>
              </div>
              <div className="font-semibold text-black dark:text-white text-sm sm:text-base leading-6 tracking-wide">
                {model.contextWindow}
              </div>
            </div>

            <div className="p-4 rounded-lg border border-black/10 dark:border-white/[0.08] bg-black/[0.02] dark:bg-[#13161c] leading-relaxed">
              <div className="flex items-center gap-1.5 text-black/45 dark:text-zinc-400 mb-1.5 text-[11px] tracking-widest">
                <Cpu size={13} />
                <span className="uppercase">Architecture</span>
              </div>
              <div className="font-medium text-black dark:text-white text-xs sm:text-sm leading-6 tracking-wide break-words">
                {model.parameters}
              </div>
            </div>

            <div className="p-4 rounded-lg border border-black/10 dark:border-white/[0.08] bg-black/[0.02] dark:bg-[#13161c] leading-relaxed">
              <div className="flex items-center gap-1.5 text-black/45 dark:text-zinc-400 mb-1.5 text-[11px] tracking-widest">
                <DollarSign size={13} />
                <span className="uppercase">Official API (1M)</span>
              </div>
              <div className="font-semibold text-black dark:text-white text-xs sm:text-sm leading-6 tracking-wide">
                <span>
                  ${model.pricing.input} in / ${model.pricing.output} out
                </span>
                {model.openWeights && (
                  <span className="block text-[11px] font-mono text-emerald-500 font-normal mt-1 leading-relaxed">
                    + Weights Free to Self-Host
                  </span>
                )}
              </div>
            </div>

            <div className="p-4 rounded-lg border border-black/10 dark:border-white/[0.08] bg-black/[0.02] dark:bg-[#13161c] leading-relaxed">
              <div className="flex items-center gap-1.5 text-black/45 dark:text-zinc-400 mb-1.5 text-[11px] tracking-widest">
                <ShieldCheck size={13} />
                <span className="uppercase">License</span>
              </div>
              <div className="font-medium text-black dark:text-white text-xs leading-6 tracking-wide break-words">
                {model.license}
              </div>
            </div>
          </div>

          {/* Verified Benchmarks Section */}
          {Object.keys(model.benchmarks).length > 0 && (
            <div className="mb-7 sm:mb-9 border border-black/10 dark:border-white/[0.08] rounded-lg p-5 bg-black/[0.01] dark:bg-black/20">
              <div className="text-xs font-mono font-medium text-black/60 dark:text-zinc-400 uppercase tracking-widest leading-relaxed mb-4">
                Verified Benchmark Suite
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 font-mono text-xs">
                {model.benchmarks.sweBench && (
                  <div className="border border-black/10 dark:border-white/[0.08] rounded p-3.5 bg-white dark:bg-[#0e1014] leading-relaxed">
                    <div className="text-[11px] text-black/40 dark:text-zinc-400 mb-1 tracking-wider">SWE-BENCH</div>
                    <div className="text-base font-semibold text-[#ff5d2e] tracking-wide">{model.benchmarks.sweBench}</div>
                  </div>
                )}
                {model.benchmarks.aime2024 && (
                  <div className="border border-black/10 dark:border-white/[0.08] rounded p-3.5 bg-white dark:bg-[#0e1014] leading-relaxed">
                    <div className="text-[11px] text-black/40 dark:text-zinc-400 mb-1 tracking-wider">AIME 2024</div>
                    <div className="text-base font-semibold text-black dark:text-white tracking-wide">{model.benchmarks.aime2024}</div>
                  </div>
                )}
                {model.benchmarks.mmluPro && (
                  <div className="border border-black/10 dark:border-white/[0.08] rounded p-3.5 bg-white dark:bg-[#0e1014] leading-relaxed">
                    <div className="text-[11px] text-black/40 dark:text-zinc-400 mb-1 tracking-wider">MMLU-PRO</div>
                    <div className="text-base font-semibold text-black dark:text-white tracking-wide">{model.benchmarks.mmluPro}</div>
                  </div>
                )}
                {model.benchmarks.gpqa && (
                  <div className="border border-black/10 dark:border-white/[0.08] rounded p-3.5 bg-white dark:bg-[#0e1014] leading-relaxed">
                    <div className="text-[11px] text-black/40 dark:text-zinc-400 mb-1 tracking-wider">GPQA DIAMOND</div>
                    <div className="text-base font-semibold text-black dark:text-white tracking-wide">{model.benchmarks.gpqa}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quickstart Developer Code Snippet */}
          <div className="mb-7 sm:mb-9 border border-black/10 dark:border-white/[0.08] rounded-lg overflow-hidden">
            <div className="flex items-center justify-between bg-black/[0.03] dark:bg-[#13161c] px-4 py-2.5 border-b border-black/10 dark:border-white/[0.08]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase text-black/60 dark:text-zinc-400 font-medium">
                  Quickstart Snippet
                </span>
                <div className="flex items-center gap-1 text-[11px] font-mono">
                  <button
                    onClick={() => setActiveSnippetTab("curl")}
                    className={`px-2 py-0.5 rounded cursor-pointer transition-colors duration-150 ${
                      activeSnippetTab === "curl"
                        ? "bg-black/10 dark:bg-white/10 text-black dark:text-white font-medium"
                        : "text-black/40 dark:text-zinc-400 hover:text-black dark:hover:text-white"
                    }`}
                  >
                    cURL
                  </button>
                  <button
                    onClick={() => setActiveSnippetTab("python")}
                    className={`px-2 py-0.5 rounded cursor-pointer transition-colors duration-150 ${
                      activeSnippetTab === "python"
                        ? "bg-black/10 dark:bg-white/10 text-black dark:text-white font-medium"
                        : "text-black/40 dark:text-zinc-400 hover:text-black dark:hover:text-white"
                    }`}
                  >
                    Python
                  </button>
                  <button
                    onClick={() => setActiveSnippetTab("local")}
                    className={`px-2 py-0.5 rounded cursor-pointer transition-colors duration-150 ${
                      activeSnippetTab === "local"
                        ? "bg-black/10 dark:bg-white/10 text-black dark:text-white font-medium"
                        : "text-black/40 dark:text-zinc-400 hover:text-black dark:hover:text-white"
                    }`}
                  >
                    {model.openWeights ? "Ollama / vLLM" : "Terminal CLI"}
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  const code =
                    activeSnippetTab === "curl"
                      ? curlCommand
                      : activeSnippetTab === "python"
                      ? getPythonSnippet()
                      : getLocalRunSnippet()
                  handleCopyCode(code)
                }}
                className="inline-flex items-center gap-1 text-[11px] font-mono text-black/50 dark:text-zinc-400 hover:text-black dark:hover:text-white cursor-pointer"
              >
                {copiedCode ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                <span>{copiedCode ? "COPIED" : "COPY"}</span>
              </button>
            </div>

            <pre className="p-4 sm:p-5 bg-black/[0.02] dark:bg-[#090b0e] text-[13px] font-mono overflow-x-auto text-black/80 dark:text-zinc-200 leading-7 tracking-wide">
              <code>
                {activeSnippetTab === "curl"
                  ? curlCommand
                  : activeSnippetTab === "python"
                  ? getPythonSnippet()
                  : getLocalRunSnippet()}
              </code>
            </pre>
          </div>

          {/* External Links Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-5 border-t border-black/10 dark:border-white/[0.08] text-xs font-mono tracking-wide leading-relaxed">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5">
              {model.links?.announcement && (
                <a
                  href={model.links.announcement}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-black/60 dark:text-zinc-400 hover:text-[#ff5d2e] dark:hover:text-[#ff5d2e] transition-colors duration-150"
                >
                  <ExternalLink size={13} />
                  <span>OFFICIAL ANNOUNCEMENT</span>
                </a>
              )}
              {model.links?.paper && (
                <a
                  href={model.links.paper}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-black/60 dark:text-zinc-400 hover:text-[#ff5d2e] dark:hover:text-[#ff5d2e] transition-colors duration-150"
                >
                  <ExternalLink size={13} />
                  <span>RESEARCH PAPER</span>
                </a>
              )}
              {model.links?.weights && (
                <a
                  href={model.links.weights}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  <ExternalLink size={13} />
                  <span>WEIGHTS / REPOSITORY</span>
                </a>
              )}
              {model.links?.apiDocs && (
                <a
                  href={model.links.apiDocs}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-black/60 dark:text-zinc-400 hover:text-[#ff5d2e] dark:hover:text-[#ff5d2e] transition-colors duration-150"
                >
                  <ExternalLink size={13} />
                  <span>API DOCS</span>
                </a>
              )}
            </div>

            <Link
              href="/"
              className="inline-flex items-center gap-1 text-black/50 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors duration-150"
            >
              <span>BACK TO LEDGER</span>
              <ChevronRight size={13} />
            </Link>
          </div>
        </div>
      </main>

      {/* Share Studio Modal */}
      <ShareCardModal
        isOpen={isShareStudioOpen}
        onClose={() => setIsShareStudioOpen(false)}
        model={model}
      />
    </div>
  )
}
