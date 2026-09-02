"use client"

import { ModelItem } from "@/data/models"
import { companies } from "@/data/companies"
import { getRelativeTimeString } from "@/lib/utils"
import { ArrowUpRight } from "lucide-react"

interface ModelCardRowProps {
  model: ModelItem
  index: number
  onSelect: (model: ModelItem) => void
}

export default function ModelCardRow({ model, index, onSelect }: ModelCardRowProps) {
  const company = companies[model.companyId]
  const relativeTime = getRelativeTimeString(model.releaseDate)

  return (
    <div
      onClick={() => onSelect(model)}
      className={[
        "group cursor-pointer block py-4 md:py-5 -mx-3 px-3 rounded-lg",
        index > 0 ? "border-t border-black/10 dark:border-white/10" : "",
        "[transition:background-color_120ms_ease-out,transform_100ms_cubic-bezier(0.16,1,0.3,1)]",
        "hover:bg-black/[0.025] dark:hover:bg-white/[0.025]",
        "active:scale-[0.99]",
      ].join(" ")}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onSelect(model)
        }
      }}
    >
      <div className="flex items-baseline justify-between gap-4">
        {/* Left: Index + Company + Model Name + Highlights */}
        <div className="flex items-baseline gap-3 sm:gap-5 min-w-0">
          {/* Index Number */}
          <span className="font-mono tabular-nums text-xs md:text-sm text-black/35 dark:text-white/35 select-none w-5 sm:w-6 shrink-0 group-hover:text-black/60 dark:group-hover:text-white/60 [transition:color_80ms_ease-out]">
            {String(index + 1).padStart(2, "0")}
          </span>

          {/* Model Identification */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              {/* Lab Accent Indicator */}
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: company?.accentColor || "#7c88e8" }}
                title={model.companyName}
              />
              
              <span className="text-xs font-mono tracking-tight text-black/45 dark:text-white/45">
                {model.companyName}
              </span>

              <span className="text-black/20 dark:text-white/20 select-none font-extralight text-xs">/</span>

              {/* Model Name */}
              <span className="font-medium text-sm md:text-base text-black dark:text-white group-hover:text-accent [transition:color_80ms_ease-out]">
                {model.name}
              </span>

              {/* Badge */}
              <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border border-black/10 dark:border-white/10 text-black/60 dark:text-white/60 bg-black/[0.02] dark:bg-white/[0.03]">
                {model.statusBadge}
              </span>

              {model.isCompanyFlagship && (
                <span className="text-[10px] font-mono tracking-tight text-accent font-medium">
                  • Flagship
                </span>
              )}
              {model.isLatestCheckpoint && !model.isCompanyFlagship && (
                <span className="text-[10px] font-mono tracking-tight text-emerald-600 dark:text-emerald-400 font-medium">
                  • Latest Drop
                </span>
              )}
            </div>

            {/* Micro Summary Highlight */}
            <p className="mt-1 text-xs sm:text-sm font-light text-black/55 dark:text-white/55 leading-relaxed line-clamp-1 group-hover:text-black/75 dark:group-hover:text-white/75 [transition:color_80ms_ease-out]">
              {model.highlight}
            </p>
          </div>
        </div>

        {/* Right Metadata: Context, Date & Arrow */}
        <div className="flex items-center gap-3 sm:gap-5 shrink-0 text-right">
          <div className="hidden sm:flex flex-col items-end">
            <span className="font-mono text-xs text-black/60 dark:text-white/60">
              {model.contextWindow.replace(" tokens", "")}
            </span>
            <span className="text-[11px] font-mono text-black/35 dark:text-white/35">
              {relativeTime}
            </span>
          </div>

          <ArrowUpRight
            size={14}
            className="opacity-40 group-hover:opacity-100 group-hover:text-accent icon-arrow-hover shrink-0"
          />
        </div>
      </div>
    </div>
  )
}
