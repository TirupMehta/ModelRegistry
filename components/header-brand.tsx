"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

// Brand lockup. Client-side only because the home page promotes it to the
// page h1; everywhere else it renders as a paragraph.
export default function HeaderBrand() {
  const isHome = usePathname() === "/"

  return (
    <Link href="/" className="group inline-flex items-end gap-1.5 sm:gap-2 select-none">
      {isHome ? (
        <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-medium tracking-tight text-black dark:text-white leading-none">
          Model<span className="font-bold text-[#ff5d2e]">Registry</span>
        </h1>
      ) : (
        <p className="text-xl sm:text-2xl md:text-3xl font-display font-medium tracking-tight text-black dark:text-white leading-none">
          Model<span className="font-bold text-[#ff5d2e]">Registry</span>
        </p>
      )}
      <span className="mb-0.5 sm:mb-1 inline-flex items-center text-[10px] sm:text-[11px] font-mono tabular-nums px-1.5 py-0.5 rounded-md border border-dashed border-black/15 dark:border-white/15 text-black/40 dark:text-zinc-500 bg-transparent group-hover:border-[#ff5d2e]/50 group-hover:text-[#ff5d2e] transition-colors duration-150 leading-none shrink-0">
        v2026.9
      </span>
    </Link>
  )
}
