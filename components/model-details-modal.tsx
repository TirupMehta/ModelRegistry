"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { type ModelItem } from "@/data/models"
import { companies } from "@/data/companies"
import {
  X,
  ExternalLink,
  Layers,
  Cpu,
  DollarSign,
  ShieldCheck,
  Check,
  Link2,
  Terminal,
  Share2,
} from "lucide-react"
import { ShareCardModal } from "./share-card-modal"

interface ModelDetailsModalProps {
  model: ModelItem | null
  onClose: () => void
}

export default function ModelDetailsModal({ model, onClose }: ModelDetailsModalProps) {
  const [copied, setCopied] = useState(false)
  const [isShareStudioOpen, setIsShareStudioOpen] = useState(false)

  // Prevent background scroll and support ESC key
  useEffect(() => {
    if (!model) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }

    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", handleKeyDown)

    return () => {
      document.body.style.overflow = "unset"
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [model, onClose])

  if (!model) return null

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
    const url = `${window.location.origin}/models/${model.id}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs transition-opacity duration-150 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-[#0e1014] border border-black/10 dark:border-white/[0.08] rounded-xl shadow-2xl p-4 sm:p-7 overflow-y-auto max-h-[92vh] transition-all duration-150 ease-out animate-in fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar */}
        <div className="flex items-center justify-between gap-2 border-b border-black/10 dark:border-white/[0.08] pb-3 mb-4 sm:mb-5">
          <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] font-mono text-[#ff5d2e] min-w-0">
            <Terminal size={13} className="shrink-0" />
            <span className="uppercase tracking-widest font-medium sm:hidden">SPEC SHEET</span>
            <span className="uppercase tracking-widest font-medium hidden sm:inline">SPEC DATASHEET // {model.id}</span>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <Link
              href={`/models/${model.id}`}
              title="Open full dedicated page"
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded border border-black/10 dark:border-white/[0.08] hover:border-[#ff5d2e] hover:text-[#ff5d2e] text-[10px] sm:text-[11px] font-mono text-black/60 dark:text-zinc-400 transition-colors duration-150 cursor-pointer"
            >
              <ExternalLink size={11} className="sm:w-3 sm:h-3" />
              <span className="hidden sm:inline">PERMALINK</span>
            </Link>

            <button
              onClick={() => setIsShareStudioOpen(true)}
              title="Export Instagram Story / Social Card"
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded border border-black/10 dark:border-white/[0.08] hover:border-[#ff5d2e] hover:text-[#ff5d2e] text-[10px] sm:text-[11px] font-mono text-black/60 dark:text-zinc-400 transition-colors duration-150 cursor-pointer"
            >
              <Share2 size={11} className="sm:w-3 sm:h-3" />
              <span className="hidden sm:inline">EXPORT CARD</span>
              <span className="sm:hidden">SHARE</span>
            </button>

            <button
              onClick={handleCopyLink}
              title="Copy shareable link"
              className="p-1.5 rounded-md text-black/50 dark:text-zinc-400 hover:text-[#ff5d2e] dark:hover:text-[#ff5d2e] hover:bg-black/5 dark:hover:bg-white/[0.06] transition-colors duration-150 cursor-pointer"
            >
              {copied ? <Check size={15} className="text-emerald-500" /> : <Link2 size={15} />}
            </button>

            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="p-1.5 rounded-md text-black/50 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/[0.06] transition-colors duration-150 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Lab info & Release Stamp */}
        <div className="flex items-center gap-2 mb-2.5 text-xs font-mono">
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
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
          <h2 id="modal-title" className="text-xl sm:text-2xl md:text-3xl font-light tracking-tight text-black dark:text-white">
            {model.name}
          </h2>
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded border border-[#ff5d2e]/40 text-[#ff5d2e] bg-[#ff5d2e]/5 font-medium tracking-wider">
            {model.statusBadge}
          </span>
        </div>

        {/* Description Highlight */}
        <p className="text-xs sm:text-sm font-light text-black/75 dark:text-zinc-300 leading-relaxed mb-5 sm:mb-6">
          {model.highlight}
        </p>

        {/* Key Hardware Specs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5 mb-5 sm:mb-6 text-xs font-mono">
          <div className="p-2.5 sm:p-3 rounded-lg border border-black/10 dark:border-white/[0.08] bg-black/[0.02] dark:bg-[#13161c] hover:border-[#ff5d2e]/40 transition-colors duration-150 cursor-default">
            <div className="flex items-center gap-1.5 text-black/45 dark:text-zinc-400 mb-1 text-[10px] sm:text-[11px]">
              <Layers size={13} />
              <span>CONTEXT WINDOW</span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-black dark:text-white leading-tight">
              {model.contextWindow}
            </p>
          </div>

          <div className="p-2.5 sm:p-3 rounded-lg border border-black/10 dark:border-white/[0.08] bg-black/[0.02] dark:bg-[#13161c] hover:border-[#ff5d2e]/40 transition-colors duration-150 cursor-default">
            <div className="flex items-center gap-1.5 text-black/45 dark:text-zinc-400 mb-1 text-[10px] sm:text-[11px]">
              <Cpu size={13} />
              <span>ARCHITECTURE</span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-black dark:text-white leading-tight break-words">
              {model.parameters}
            </p>
          </div>

          <div className="p-2.5 sm:p-3 rounded-lg border border-black/10 dark:border-white/[0.08] bg-black/[0.02] dark:bg-[#13161c] col-span-2 sm:col-span-1 hover:border-[#ff5d2e]/40 transition-colors duration-150 cursor-default">
            <div className="flex items-center gap-1.5 text-black/45 dark:text-zinc-400 mb-1 text-[10px] sm:text-[11px]">
              <DollarSign size={13} />
              <span>OFFICIAL API / 1M</span>
            </div>
            <div className="text-xs sm:text-sm font-medium text-black dark:text-white leading-tight">
              <span>
                ${model.pricing.input} in / ${model.pricing.output} out
              </span>
              {model.openWeights && (
                <span className="block text-[10px] font-mono text-[#00e599] font-normal mt-0.5">
                  + Weights Free to Self-Host
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Verified Benchmarks Section */}
        {Object.keys(model.benchmarks).length > 0 && (
          <div className="mb-6">
            <h3 className="text-[11px] font-mono uppercase tracking-wider text-black/50 dark:text-zinc-400 font-medium mb-2.5">
              VERIFIED BENCHMARKS
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {model.benchmarks.sweBench && (
                <div className="p-2.5 rounded-lg border border-black/5 dark:border-white/[0.06] bg-black/[0.015] dark:bg-[#13161c] hover:border-[#ff5d2e]/30 transition-colors duration-150 cursor-default">
                  <span className="text-[10px] font-mono text-black/40 dark:text-zinc-400 block mb-0.5">SWE-bench</span>
                  <span className="text-base font-mono font-medium text-black dark:text-white">
                    {model.benchmarks.sweBench}
                  </span>
                </div>
              )}
              {model.benchmarks.aime2024 && (
                <div className="p-2.5 rounded-lg border border-black/5 dark:border-white/[0.06] bg-black/[0.015] dark:bg-[#13161c] hover:border-[#ff5d2e]/30 transition-colors duration-150 cursor-default">
                  <span className="text-[10px] font-mono text-black/40 dark:text-zinc-400 block mb-0.5">AIME 2024</span>
                  <span className="text-base font-mono font-medium text-black dark:text-white">
                    {model.benchmarks.aime2024}
                  </span>
                </div>
              )}
              {model.benchmarks.mmluPro && (
                <div className="p-2.5 rounded-lg border border-black/5 dark:border-white/[0.06] bg-black/[0.015] dark:bg-[#13161c] hover:border-[#ff5d2e]/30 transition-colors duration-150 cursor-default">
                  <span className="text-[10px] font-mono text-black/40 dark:text-zinc-400 block mb-0.5">MMLU-Pro</span>
                  <span className="text-base font-mono font-medium text-black dark:text-white">
                    {model.benchmarks.mmluPro}
                  </span>
                </div>
              )}
              {model.benchmarks.gpqa && (
                <div className="p-2.5 rounded-lg border border-black/5 dark:border-white/[0.06] bg-black/[0.015] dark:bg-[#13161c] hover:border-[#ff5d2e]/30 transition-colors duration-150 cursor-default">
                  <span className="text-[10px] font-mono text-black/40 dark:text-zinc-400 block mb-0.5">GPQA Diamond</span>
                  <span className="text-base font-mono font-medium text-black dark:text-white">
                    {model.benchmarks.gpqa}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modalities & License */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3.5 border-t border-black/10 dark:border-white/[0.08] mb-6 text-xs font-mono text-black/60 dark:text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="text-black/40 dark:text-zinc-400">MODALITIES:</span>
            <div className="flex gap-1">
              {model.modalities.map((m) => (
                <span
                  key={m}
                  className="px-1.5 py-0.5 rounded border border-black/10 dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.04] text-[10px] text-black/75 dark:text-zinc-300"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <ShieldCheck size={13} className="opacity-40" />
            <span className="text-[11px] text-black/60 dark:text-zinc-400">{model.license}</span>
          </div>
        </div>

        {/* Action Links */}
        <div className="flex flex-wrap items-center gap-2.5">
          {model.links.announcement && (
            <a
              href={model.links.announcement}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-1.5 text-xs font-mono font-medium px-3.5 py-2 rounded-md bg-black text-white dark:bg-white dark:text-black hover:bg-[#ff5d2e] dark:hover:bg-[#ff5d2e] dark:hover:text-white transition-colors duration-150 cursor-pointer"
            >
              <span>LAB ANNOUNCEMENT</span>
              <ExternalLink size={12} className="opacity-60" />
            </a>
          )}
          {model.links.playground && (
            <a
              href={model.links.playground}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-1.5 text-xs font-mono font-medium px-3.5 py-2 rounded-md border border-black/10 dark:border-white/[0.08] hover:border-[#ff5d2e] hover:text-[#ff5d2e] transition-colors duration-150 text-black dark:text-zinc-300 cursor-pointer"
            >
              <span>OPEN PLAYGROUND</span>
              <ExternalLink size={12} className="opacity-60" />
            </a>
          )}
          {model.links.weights && (
            <a
              href={model.links.weights}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-1.5 text-xs font-mono font-medium px-3.5 py-2 rounded-md border border-black/10 dark:border-white/[0.08] hover:border-[#ff5d2e] hover:text-[#ff5d2e] transition-colors duration-150 text-black dark:text-zinc-300 cursor-pointer"
            >
              <span>HUGGING FACE WEIGHTS</span>
              <ExternalLink size={12} className="opacity-60" />
            </a>
          )}

          <button
            onClick={() => setIsShareStudioOpen(true)}
            className="group inline-flex items-center gap-1.5 text-xs font-mono font-medium px-3.5 py-2 rounded-md border border-[#ff5d2e]/40 bg-[#ff5d2e]/10 text-[#ff5d2e] hover:bg-[#ff5d2e] hover:text-white dark:hover:text-black transition-colors duration-150 cursor-pointer"
          >
            <Share2 size={12} />
            <span>SHARE STORY / CARD</span>
          </button>
        </div>
      </div>

      {isShareStudioOpen && (
        <ShareCardModal
          model={model}
          isOpen={isShareStudioOpen}
          onClose={() => setIsShareStudioOpen(false)}
        />
      )}
    </div>
  )
}
