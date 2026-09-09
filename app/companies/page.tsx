"use client"

import { useState } from "react"
import Link from "next/link"
import Header from "@/components/header"
import TextWithBlur from "@/components/text-with-blur"
import ModelDetailsModal from "@/components/model-details-modal"
import { companies } from "@/data/companies"
import { modelsData, ModelItem } from "@/data/models"
import { ArrowUpRight, Globe, Layers, Sparkles } from "lucide-react"
import { formatDate } from "@/lib/utils"

export default function CompaniesPage() {
  const currentYear = new Date().getFullYear()
  const [activeModalModel, setActiveModalModel] = useState<ModelItem | null>(null)

  const companyList = Object.values(companies)

  return (
    <main className="relative min-h-screen">
      <Header />

      <section className="section max-w-4xl mx-auto w-full px-4 sm:px-6 md:px-20 pb-20">
        <div className="space-y-4 text-base md:text-[17px] font-normal text-black/75 dark:text-zinc-300 leading-relaxed max-w-3xl mb-8">
          <TextWithBlur delay={120}>
            <p>
              Frontier research laboratories driving machine intelligence forward. 
              Each organization maintains a primary foundation model alongside focused experimental checkpoints.
            </p>
          </TextWithBlur>
        </div>

        {/* Labs List with Sibling Dimming */}
        <div className="flex flex-col list-hover-group space-y-6">
          {companyList.map((company, index) => {
            // Find flagship, true latest checkpoint, and newest non-flagship fallback
            const flagshipModel = modelsData.find(
              (m) => m.companyId === company.id && m.isCompanyFlagship
            )
            const latestDrop = modelsData.find(
              (m) => m.companyId === company.id && m.isLatestCheckpoint && m.id !== flagshipModel?.id
            )
            const secondaryModel = latestDrop
              ? null
              : [...modelsData]
                  .filter((m) => m.companyId === company.id && m.id !== flagshipModel?.id)
                  .sort((a, b) => b.releaseDate.localeCompare(a.releaseDate))[0]
            const second = latestDrop ?? secondaryModel

            return (
              <TextWithBlur key={company.id} delay={index * 35}>
                <div className="p-5 sm:p-6 rounded-lg border border-black/10 dark:border-white/[0.08] bg-black/[0.015] dark:bg-[#111317] [transition:border-color,background-color_120ms_ease-out]">
                  {/* Lab Header */}
                  <div className="flex items-start justify-between gap-3 sm:gap-4 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-3.5 h-3.5 rounded-sm shrink-0 shadow-sm"
                        style={{ backgroundColor: company.accentColor }}
                      />
                      <div>
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                          <Link
                            href={`/companies/${company.id}`}
                            className="text-xl font-medium text-black dark:text-white hover:text-[#ff5d2e] dark:hover:text-[#ff7347] transition-colors duration-150"
                          >
                            {company.name}
                          </Link>
                          <span className="text-xs font-sans text-black/40 dark:text-zinc-400">
                            ({company.headquarters})
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm font-normal text-black/60 dark:text-zinc-400 mt-0.5 max-w-xl">
                          {company.description}
                        </p>
                      </div>
                    </div>

                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-1 text-xs font-sans text-black/50 dark:text-zinc-400 hover:text-[#ff5d2e] dark:hover:text-[#ff7347] transition-colors duration-150 shrink-0 whitespace-nowrap pt-1"
                    >
                      <Globe size={12} />
                      <span>{new URL(company.website).hostname}</span>
                      <ArrowUpRight size={11} className="opacity-60" />
                    </a>
                  </div>

                  {/* Models Grid: Primary Flagship + Latest Checkpoint */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                    {/* Primary Flagship */}
                    {flagshipModel && (
                      <div
                        onClick={() => setActiveModalModel(flagshipModel)}
                        role="button"
                        tabIndex={0}
                        aria-label={`View details for ${flagshipModel.name}`}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            setActiveModalModel(flagshipModel)
                          }
                        }}
                        className="cursor-pointer p-4 rounded-md border border-black/10 dark:border-white/[0.08] bg-black/[0.02] dark:bg-[#0d0f13] hover:border-[#ff5d2e]/40 transition-colors duration-150 select-none group"
                      >
                        <div className="flex items-center justify-between text-xs font-sans mb-1.5">
                          <span className="text-[#ff5d2e] dark:text-[#ff7347] font-medium uppercase text-[11px] tracking-wider">
                            Primary Flagship
                          </span>
                          <span className="text-[11px] text-black/40 dark:text-zinc-400 tabular-nums">
                            {flagshipModel.contextWindow.replace(" tokens", "")}
                          </span>
                        </div>

                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-base font-medium text-black dark:text-white group-hover:text-[#ff5d2e] dark:group-hover:text-[#ff7347] transition-colors duration-150">
                            {flagshipModel.name}
                          </span>
                        </div>

                        <p className="text-xs font-normal text-black/60 dark:text-zinc-400 leading-relaxed line-clamp-2">
                          {flagshipModel.highlight}
                        </p>
                      </div>
                    )}

                    {/* Second slot: true latest checkpoint, else newest non-flagship (honestly labeled) */}
                    {second ? (
                      <div
                        onClick={() => setActiveModalModel(second)}
                        role="button"
                        tabIndex={0}
                        aria-label={`View details for ${second.name}`}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            setActiveModalModel(second)
                          }
                        }}
                        className="cursor-pointer p-4 rounded-md border border-black/10 dark:border-white/[0.08] bg-black/[0.02] dark:bg-[#0d0f13] hover:border-[#ff5d2e]/40 transition-colors duration-150 select-none group"
                      >
                        <div className="flex items-center justify-between text-xs font-sans mb-1.5">
                          <span className="font-medium uppercase text-[11px] tracking-wider flex items-center gap-1">
                            {latestDrop ? (
                              <span className="text-[#1a73e8] dark:text-[#8ab4f8] flex items-center gap-1">
                                <Sparkles size={11} /> Latest Checkpoint
                              </span>
                            ) : (
                              <span className="text-[#1a73e8] dark:text-[#8ab4f8]">
                                More from {company.shortName}
                              </span>
                            )}
                          </span>
                          <span className="text-[11px] text-black/40 dark:text-zinc-400">
                            {formatDate(second.releaseDate)}
                          </span>
                        </div>

                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-base font-medium text-black dark:text-white group-hover:text-[#ff5d2e] dark:group-hover:text-[#ff7347] transition-colors duration-150">
                            {second.name}
                          </span>
                          <span className="text-[11px] font-sans text-black/40 dark:text-zinc-500">
                            ({second.categoryLabel})
                          </span>
                        </div>

                        <p className="text-xs font-normal text-black/60 dark:text-zinc-400 leading-relaxed line-clamp-2">
                          {second.highlight}
                        </p>
                      </div>
                    ) : (
                      flagshipModel && (
                        <div className="p-4 rounded border border-black/5 dark:border-white/[0.06] bg-black/[0.01] dark:bg-[#131518] flex flex-col justify-center text-xs font-sans text-black/45 dark:text-zinc-400">
                          <p>
                            {company.name}&apos;s reigning foundation flagship is also its newest deployed model.
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </TextWithBlur>
            )
          })}
        </div>
      </section>

      {/* Model Details Modal */}
      <ModelDetailsModal
        model={activeModalModel}
        onClose={() => setActiveModalModel(null)}
      />

      {/* Footer */}
      <footer className="py-6 px-6 text-center border-t border-black/10 dark:border-white/[0.08] max-w-4xl mx-auto w-full">
        <p className="text-[11px] font-sans text-black/50 dark:text-zinc-400">
          © {currentYear} ModelRegistry. The open technical index for frontier AI systems.
        </p>
      </footer>
    </main>
  )
}
