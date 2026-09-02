"use client"

import { useEffect } from "react"
import { ModelItem } from "@/data/models"
import { companies } from "@/data/companies"
import { X, ExternalLink, Sparkles, Cpu, Layers, DollarSign, BookOpen, Key, ShieldCheck } from "lucide-react"
import { formatDate } from "@/lib/utils"

interface ModelDetailsModalProps {
  model: ModelItem | null
  onClose: () => void
}

export default function ModelDetailsModal({ model, onClose }: ModelDetailsModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    if (model) {
      document.body.style.overflow = "hidden"
      window.addEventListener("keydown", handleKeyDown)
    }
    return () => {
      document.body.style.overflow = "auto"
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [model, onClose])

  if (!model) return null

  const company = companies[model.companyId]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 dark:bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#fafaf9] dark:bg-[#0f1115] border border-black/10 dark:border-white/10 shadow-2xl p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-5 right-5 p-1.5 rounded-full text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Lab info & badges */}
        <div className="flex items-center gap-2 mb-3">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: company?.accentColor || "#7c88e8" }}
          />
          <span className="text-xs font-medium uppercase tracking-wider text-black/50 dark:text-white/50">
            {model.companyName}
          </span>
          <span className="text-black/20 dark:text-white/20 select-none">/</span>
          <span className="text-xs font-mono text-black/40 dark:text-white/40">
            Released {formatDate(model.releaseDate)}
          </span>
        </div>

        {/* Model Title & SOTA Badge */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-black dark:text-white">
            {model.name}
          </h2>
          <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded-md bg-accent/10 dark:bg-accent/20 text-accent font-medium tracking-wide">
            {model.statusBadge}
          </span>
        </div>

        {/* Description Highlight */}
        <p className="text-sm sm:text-base font-light text-black/70 dark:text-white/70 leading-relaxed mb-6">
          {model.highlight}
        </p>

        {/* Key Specs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          <div className="p-3 rounded-xl bg-black/[0.025] dark:bg-white/[0.03] border border-black/5 dark:border-white/5">
            <div className="flex items-center gap-1.5 text-xs text-black/40 dark:text-white/40 mb-1">
              <Layers size={13} />
              <span>Context Window</span>
            </div>
            <p className="font-mono text-sm font-medium text-black dark:text-white">
              {model.contextWindow}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-black/[0.025] dark:bg-white/[0.03] border border-black/5 dark:border-white/5">
            <div className="flex items-center gap-1.5 text-xs text-black/40 dark:text-white/40 mb-1">
              <Cpu size={13} />
              <span>Architecture</span>
            </div>
            <p className="font-mono text-sm font-medium text-black dark:text-white truncate">
              {model.parameters}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-black/[0.025] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-1.5 text-xs text-black/40 dark:text-white/40 mb-1">
              <DollarSign size={13} />
              <span>Pricing / 1M tokens</span>
            </div>
            <p className="font-mono text-sm font-medium text-black dark:text-white">
              {model.openWeights ? (
                <span className="text-emerald-600 dark:text-emerald-400">Open Weights (Free)</span>
              ) : (
                `$${model.pricing.input} in / $${model.pricing.output} out`
              )}
            </p>
          </div>
        </div>

        {/* Benchmarks Section */}
        {Object.keys(model.benchmarks).length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs uppercase tracking-wider text-black/40 dark:text-white/40 font-medium mb-2.5">
              Verified Benchmark Highlights
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {model.benchmarks.sweBench && (
                <div className="p-2.5 rounded-lg border border-black/5 dark:border-white/5 bg-black/[0.015] dark:bg-white/[0.02]">
                  <span className="text-[11px] text-black/40 dark:text-white/40 block">SWE-bench</span>
                  <span className="text-base font-mono font-medium text-black dark:text-white">
                    {model.benchmarks.sweBench}
                  </span>
                </div>
              )}
              {model.benchmarks.aime2024 && (
                <div className="p-2.5 rounded-lg border border-black/5 dark:border-white/5 bg-black/[0.015] dark:bg-white/[0.02]">
                  <span className="text-[11px] text-black/40 dark:text-white/40 block">AIME 2024</span>
                  <span className="text-base font-mono font-medium text-black dark:text-white">
                    {model.benchmarks.aime2024}
                  </span>
                </div>
              )}
              {model.benchmarks.mmluPro && (
                <div className="p-2.5 rounded-lg border border-black/5 dark:border-white/5 bg-black/[0.015] dark:bg-white/[0.02]">
                  <span className="text-[11px] text-black/40 dark:text-white/40 block">MMLU-Pro</span>
                  <span className="text-base font-mono font-medium text-black dark:text-white">
                    {model.benchmarks.mmluPro}
                  </span>
                </div>
              )}
              {model.benchmarks.gpqa && (
                <div className="p-2.5 rounded-lg border border-black/5 dark:border-white/5 bg-black/[0.015] dark:bg-white/[0.02]">
                  <span className="text-[11px] text-black/40 dark:text-white/40 block">GPQA Diamond</span>
                  <span className="text-base font-mono font-medium text-black dark:text-white">
                    {model.benchmarks.gpqa}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modalities & License */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-black/5 dark:border-white/5 mb-6 text-xs text-black/60 dark:text-white/60">
          <div className="flex items-center gap-2">
            <span className="text-black/40 dark:text-white/40">Modalities:</span>
            <div className="flex gap-1.5">
              {model.modalities.map((m) => (
                <span
                  key={m}
                  className="px-2 py-0.5 rounded bg-black/5 dark:bg-white/5 font-mono text-[10px]"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <ShieldCheck size={13} className="opacity-40" />
            <span className="font-mono text-[11px]">{model.license}</span>
          </div>
        </div>

        {/* Action Links */}
        <div className="flex flex-wrap items-center gap-3">
          {model.links.announcement && (
            <a
              href={model.links.announcement}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-lg bg-black text-white dark:bg-white dark:text-black hover:opacity-90 transition-opacity"
            >
              <span>Read Announcement</span>
              <ExternalLink size={12} />
            </a>
          )}
          {model.links.playground && (
            <a
              href={model.links.playground}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-black dark:text-white"
            >
              <span>Try in Chat</span>
              <Sparkles size={12} />
            </a>
          )}
          {model.links.weights && (
            <a
              href={model.links.weights}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-black dark:text-white"
            >
              <span>Hugging Face Weights</span>
              <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
