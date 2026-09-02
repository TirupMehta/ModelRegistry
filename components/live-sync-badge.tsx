"use client"

import { Search, Sparkles, Filter } from "lucide-react"

interface LiveSearchHeaderProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedCategory: string
  setSelectedCategory: (cat: string) => void
  totalCount: number
}

const CATEGORIES = [
  { id: "all", label: "All Models" },
  { id: "reasoning", label: "Reasoning" },
  { id: "flagship", label: "Frontier Flagship" },
  { id: "open-weights", label: "Open Weights" },
  { id: "code", label: "Coding" },
  { id: "multimodal", label: "Multimodal" },
]

export default function LiveSearchHeader({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  totalCount,
}: LiveSearchHeaderProps) {
  return (
    <div className="w-full mb-6">
      {/* Search Input & Shortcut */}
      <div className="relative mb-3.5">
        <Search
          size={15}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black/35 dark:text-white/35"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search models, labs, reasoning, context windows... (e.g. Claude 3.7, o3, DeepSeek)"
          className="w-full pl-10 pr-16 py-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 text-xs sm:text-sm text-black dark:text-white placeholder:text-black/35 dark:placeholder:text-white/35 focus:outline-none focus:border-accent/60 transition-colors"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-black/40 dark:text-white/40 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded">
            /
          </kbd>
          <span className="text-[11px] font-mono text-black/40 dark:text-white/40 tabular-nums">
            {totalCount}
          </span>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={[
                "px-2.5 py-1 rounded-md transition-all select-none shrink-0 font-light cursor-pointer active:scale-95",
                isActive
                  ? "bg-black text-white dark:bg-white dark:text-black font-normal"
                  : "bg-black/[0.03] dark:bg-white/[0.03] text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 border border-black/5 dark:border-white/5",
              ].join(" ")}
            >
              {cat.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
