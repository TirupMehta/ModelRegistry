"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { type ModelItem } from "@/data/models"
import { companies } from "@/data/companies"
import { formatPrice, formatDate } from "@/lib/utils"
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
import { tapFeedback, successFeedback } from "@/lib/feedback"

interface ModelDetailsModalProps {
  model: ModelItem | null
  onClose: () => void
}

export default function ModelDetailsModal({ model, onClose }: ModelDetailsModalProps) {
  const [copied, setCopied] = useState(false)
  const [isShareStudioOpen, setIsShareStudioOpen] = useState(false)

  // Prevent background scroll and support ESC key.
  // Saves the page scroll position on open and restores it exactly on close,
  // so dismissing the popup never sends the user back to the top.
  useEffect(() => {
    if (!model) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }

    const scrollY = window.scrollY
    const prevBodyOverflow = document.body.style.overflow
    const html = document.documentElement
    const prevHtmlScrollBehavior = html.style.scrollBehavior

    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", handleKeyDown)

    return () => {
      document.body.style.overflow = prevBodyOverflow
      window.removeEventListener("keydown", handleKeyDown)
      // Bypass `scroll-behavior: smooth` so the restore is instant, not animated
      html.style.scrollBehavior = "auto"
      window.scrollTo(0, scrollY)
      html.style.scrollBehavior = prevHtmlScrollBehavior
    }
  }, [model, onClose])

  if (!model) return null

  const company = companies[model.companyId]

  const handleCopyLink = () => {
    try {
      const url = `${window.location.origin}/models/${model.id}`
      navigator.clipboard.writeText(url)
    } catch {
      // Clipboard unavailable — still confirm.
    }
    successFeedback()
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClose = () => {
    tapFeedback()
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-black/60 backdrop-blur-md transition-opacity duration-150 animate-in fade-in"
      onClick={handleClose}
    >
      <div className="min-h-full flex justify-center p-3 sm:p-6">
      <div
        className="relative m-auto w-full max-w-2xl bg-white dark:bg-[#0e1014] border border-black/10 dark:border-white/[0.08] rounded-2xl shadow-2xl ring-1 ring-black/5 dark:ring-white/5 p-4 sm:p-7 sm:max-h-[92dvh] sm:overflow-y-auto sm:overscroll-contain transition-colors duration-150 ease-out animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar */}
        <div className="flex items-center justify-between gap-2 border-b border-black/10 dark:border-white/[0.08] pb-3 mb-4 sm:mb-5">
          <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] font-sans text-[#ff5d2e] min-w-0">
            <Terminal size={13} className="shrink-0" />
            <span className="uppercase tracking-widest font-medium sm:hidden">SPEC SHEET</span>
            <span className="uppercase tracking-widest font-medium hidden sm:inline">SPEC DATASHEET // {model.id}</span>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <Link
              href={`/models/${model.id}`}
              title="Open full dedicated page"
              aria-label="Open full dedicated page"
              className="inline-flex items-center justify-center min-w-8 min-h-8 gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded border border-black/10 dark:border-white/[0.08] hover:border-[#ff5d2e]/50 hover:text-[#ff5d2e] active:scale-[0.985] text-[10px] sm:text-[11px] font-sans text-black/60 dark:text-zinc-400 transition-colors duration-150 cursor-pointer"
            >
              <ExternalLink size={11} className="sm:w-3 sm:h-3" />
              <span className="hidden sm:inline">PERMALINK</span>
            </Link>

            <button
              onClick={() => {
                tapFeedback()
                setIsShareStudioOpen(true)
              }}
              title="Export Instagram Story / Social Card"
              aria-label="Export share card"
              className="inline-flex items-center justify-center min-w-8 min-h-8 gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded border border-black/10 dark:border-white/[0.08] hover:border-[#ff5d2e]/50 hover:text-[#ff5d2e] active:scale-[0.985] text-[10px] sm:text-[11px] font-sans text-black/60 dark:text-zinc-400 transition-colors duration-150 cursor-pointer"
            >
              <Share2 size={11} className="sm:w-3 sm:h-3" />
              <span className="hidden sm:inline">EXPORT CARD</span>
              <span className="sm:hidden">SHARE</span>
            </button>

            <button
              onClick={handleCopyLink}
              title="Copy shareable link"
              aria-label="Copy shareable link"
              className="relative inline-flex items-center justify-center min-w-8 min-h-8 p-1.5 rounded-md text-black/50 dark:text-zinc-400 hover:text-[#ff5d2e] dark:hover:text-[#ff5d2e] hover:bg-black/5 dark:hover:bg-white/[0.06] active:scale-[0.985] transition-colors duration-150 cursor-pointer before:absolute before:-inset-2 before:content-['']"
            >
              {copied ? <Check size={15} className="text-emerald-500" /> : <Link2 size={15} />}
            </button>

            <button
              onClick={handleClose}
              aria-label="Close dialog"
              className="relative inline-flex items-center justify-center min-w-8 min-h-8 p-1.5 rounded-md text-black/50 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/[0.06] active:scale-[0.985] transition-colors duration-150 cursor-pointer before:absolute before:-inset-2 before:content-['']"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Lab info & Release Stamp */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-2.5 text-xs font-sans">
          <span
            className="w-2.5 h-2.5 rounded-[4px] ring-1 ring-black/10 dark:ring-white/10 shrink-0"
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
          <h2 id="modal-title" className="text-xl sm:text-2xl md:text-3xl font-display font-semibold tracking-tight text-black dark:text-white">
            {model.name}
          </h2>
          <span className="text-[11px] font-sans uppercase px-2 py-0.5 rounded border border-[#ff5d2e]/40 text-[#ff5d2e] bg-[#ff5d2e]/5 font-medium tracking-wider">
            {model.statusBadge}
          </span>
        </div>

        {/* Description Highlight */}
        <p className="text-xs sm:text-sm font-normal text-black/80 dark:text-zinc-200 leading-relaxed mb-5 sm:mb-6">
          {model.highlight}
        </p>

        {/* Key Hardware Specs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5 mb-5 sm:mb-6 text-xs font-sans">
          <div className="p-3 rounded-xl border border-black/10 dark:border-white/[0.08] bg-black/[0.02] dark:bg-[#13161c] shadow-sm hover:border-[#ff5d2e]/40 transition-all duration-150 cursor-default">
            <div className="flex items-center gap-1.5 text-black/40 dark:text-zinc-500 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em]">
              <Layers size={12} className="text-[#ff5d2e]" />
              <span>Context</span>
            </div>
            <p className="tabular-nums text-xs sm:text-sm font-semibold text-black dark:text-white leading-tight">
              {model.contextWindow}
            </p>
          </div>

          <div className="p-3 rounded-xl border border-black/10 dark:border-white/[0.08] bg-black/[0.02] dark:bg-[#13161c] shadow-sm hover:border-[#ff5d2e]/40 transition-all duration-150 cursor-default">
            <div className="flex items-center gap-1.5 text-black/40 dark:text-zinc-500 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em]">
              <Cpu size={12} className="text-[#ff5d2e]" />
              <span>Architecture</span>
            </div>
            <p className="tabular-nums text-xs sm:text-sm font-semibold text-black dark:text-white leading-tight break-words">
              {model.parameters}
            </p>
          </div>

          <div className="p-3 rounded-xl border border-black/10 dark:border-white/[0.08] bg-black/[0.02] dark:bg-[#13161c] col-span-2 sm:col-span-1 shadow-sm hover:border-[#ff5d2e]/40 transition-all duration-150 cursor-default">
            <div className="flex items-center gap-1.5 text-black/40 dark:text-zinc-500 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em]">
              <DollarSign size={12} className="text-[#ff5d2e]" />
              <span>{model.pricingUnit ? "Official API" : "Official API / 1M"}</span>
            </div>
            <div className="tabular-nums text-xs sm:text-sm font-semibold text-black dark:text-white leading-tight">
              <span>
                {formatPrice(model)}
              </span>
              {model.openWeights && (
                <span className="block text-[11px] font-sans text-black/60 dark:text-zinc-400 font-normal mt-0.5">
                  + Weights Free to Self-Host
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Verified Benchmarks Section */}
        {Object.keys(model.benchmarks).length > 0 && (
          <div className="mb-6 rounded-xl border border-black/10 dark:border-white/[0.08] bg-black/[0.015] dark:bg-black/20 p-3 sm:p-4">
            <h3 className="text-[10px] font-sans uppercase tracking-[0.14em] text-black/45 dark:text-zinc-500 font-semibold mb-3">
              Verified benchmarks
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(
                [
                  ["SWE-bench", model.benchmarks.sweBench],
                  ["Terminal-Bench", model.benchmarks.terminalBench],
                  ["AIME 2024", model.benchmarks.aime2024],
                  ["MMLU-Pro", model.benchmarks.mmluPro],
                  ["GPQA Diamond", model.benchmarks.gpqa],
                ] as const
              )
                .filter(([, v]) => Boolean(v))
                .map(([label, value], i) => {
                  const pct = Math.min(100, Math.max(0, parseFloat(String(value)) || 0))
                  return (
                    <div
                      key={label}
                      className="p-2.5 rounded-lg border border-black/5 dark:border-white/[0.06] bg-white dark:bg-[#13161c] shadow-sm hover:border-[#ff5d2e]/30 transition-colors duration-150 cursor-default"
                    >
                      <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.1em] text-black/40 dark:text-zinc-500 block mb-1">
                        {label}
                      </span>
                      <span
                        className={`text-base font-sans font-semibold tabular-nums ${
                          i === 0 ? "text-[#ff5d2e]" : "text-black dark:text-white"
                        }`}
                      >
                        {value}
                      </span>
                      <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/[0.08]">
                        <span
                          className={`block h-full rounded-full ${i === 0 ? "bg-[#ff5d2e]" : "bg-black/30 dark:bg-white/30"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </span>
                    </div>
                  )
                })}
            </div>
          </div>
        )}

        {/* Shipped Variants (e.g. API twins) */}
        {model.variants && model.variants.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-sans uppercase tracking-wider text-black/50 dark:text-zinc-400 font-medium mb-2.5">
              SHIPPED VARIANTS
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {model.variants.map((variant) => (
                <div
                  key={variant.name}
                  className="p-2.5 rounded-lg border border-black/5 dark:border-white/[0.06] bg-black/[0.015] dark:bg-[#13161c] hover:border-[#ff5d2e]/30 transition-colors duration-150 cursor-default"
                >
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    <span className="text-xs font-sans font-medium text-black dark:text-white">
                      {variant.name}
                    </span>
                    <span className="text-[10px] font-sans uppercase tracking-wider px-1 py-px rounded border border-black/10 dark:border-white/10 text-black/55 dark:text-white/55">
                      {variant.role}
                    </span>
                  </div>
                  <p className="text-[11px] font-sans text-black/55 dark:text-zinc-400 leading-relaxed">
                    {variant.detail}
                  </p>
                  <p className="text-[11px] font-sans tabular-nums text-black dark:text-white font-medium mt-1">
                    {variant.pricingNote}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modalities & License */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3.5 border-t border-black/10 dark:border-white/[0.08] mb-6 text-xs font-sans text-black/60 dark:text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="text-black/40 dark:text-zinc-400">MODALITIES:</span>
            <div className="flex gap-1">
              {model.modalities.map((m) => (
                <span
                  key={m}
                  className="px-1.5 py-0.5 rounded border border-black/10 dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.04] text-[11px] text-black/75 dark:text-zinc-300"
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
              className="group inline-flex items-center gap-1.5 text-xs font-sans font-medium px-3.5 py-2 rounded-md bg-black text-white dark:bg-white dark:text-black hover:bg-[#ff5d2e] dark:hover:bg-[#ff5d2e] dark:hover:text-white transition-colors duration-150 cursor-pointer"
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
              className="group inline-flex items-center gap-1.5 text-xs font-sans font-medium px-3.5 py-2 rounded-md border border-black/10 dark:border-white/[0.08] hover:border-[#ff5d2e] hover:text-[#ff5d2e] transition-colors duration-150 text-black dark:text-zinc-300 cursor-pointer"
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
              className="group inline-flex items-center gap-1.5 text-xs font-sans font-medium px-3.5 py-2 rounded-md border border-black/10 dark:border-white/[0.08] hover:border-[#ff5d2e] hover:text-[#ff5d2e] transition-colors duration-150 text-black dark:text-zinc-300 cursor-pointer"
            >
              <span>HUGGING FACE WEIGHTS</span>
              <ExternalLink size={12} className="opacity-60" />
            </a>
          )}

          <button
            onClick={() => {
              tapFeedback()
              setIsShareStudioOpen(true)
            }}
            className="group inline-flex items-center gap-1.5 text-xs font-sans font-medium px-3.5 py-2 rounded-md border border-[#ff5d2e]/40 bg-[#ff5d2e]/10 text-[#ff5d2e] hover:bg-[#ff5d2e] hover:text-white dark:hover:text-black transition-colors duration-150 cursor-pointer"
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
    </div>
  )
}
