"use client"

import { useState } from "react"
import Link from "next/link"
import TextWithBlur from "@/components/text-with-blur"
import ModelDetailsModal from "@/components/model-details-modal"
import { companies } from "@/data/companies"
import { modelsData, ModelItem } from "@/data/models"
import { folioFor } from "@/lib/registry"
import { ArrowUpRight, Globe, Sparkles } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { tapFeedback } from "@/lib/feedback"

export default function CompaniesClient() {
  const [activeModalModel, setActiveModalModel] = useState<ModelItem | null>(null)
  const modalFolio = folioFor(activeModalModel, modelsData)

  const openModel = (model: ModelItem) => {
    tapFeedback()
    setActiveModalModel(model)
  }

  const companyList = Object.values(companies)

  return (
    <>

      <section className="section max-w-4xl mx-auto w-full px-4 sm:px-6 md:px-20 pb-20">
        <div className="space-y-4 text-base md:text-[17px] font-normal text-black/75 dark:text-zinc-300 leading-relaxed max-w-3xl mb-8">
          <TextWithBlur delay={120}>
            <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-black dark:text-white">
              Frontier AI Laboratories
            </h1>
            <p>
              Frontier research laboratories driving machine intelligence forward. 
              Each organization maintains a primary foundation model alongside focused experimental checkpoints.
            </p>
          </TextWithBlur>
        </div>

        {/* Labs List with Sibling Dimming */}
        <div className="flex flex-col list-hover-group space-y-4 sm:space-y-6">
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
                <div
                  id={company.id}
                  className="card-lift scroll-mt-24 p-4 sm:p-6 rounded-2xl border border-black/10 dark:border-white/[0.08] bg-white/[0.7] dark:bg-[#111317] shadow-sm [transition:border-color,background-color_120ms_ease-out]"
                >
                  {/* Lab Header */}
                  <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2 mb-2.5 sm:mb-4">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div
                        className="w-2.5 h-2.5 rounded-[4px] shrink-0 shadow-sm ring-1 ring-black/10 dark:ring-white/10 mt-1"
                        style={{ backgroundColor: company.accentColor }}
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                          <Link
                            href={`/companies/${company.id}`}
                            className="text-lg sm:text-xl font-medium tracking-tight text-black dark:text-white hover:text-[#ff5d2e] dark:hover:text-[#ff7347] transition-colors duration-150"
                          >
                            {company.name}
                          </Link>
                          <span className="text-[11px] sm:text-xs font-sans text-black/40 dark:text-zinc-400 whitespace-nowrap">
                            · {company.headquarters}
                          </span>
                        </div>
                      </div>
                    </div>

                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-1 text-[11px] sm:text-xs font-sans text-black/50 dark:text-zinc-400 hover:text-[#ff5d2e] dark:hover:text-[#ff7347] transition-colors duration-150 shrink-0 whitespace-nowrap pt-[3px]"
                    >
                      <Globe size={12} />
                      <span>{new URL(company.website).hostname}</span>
                      <ArrowUpRight size={11} className="opacity-60" />
                    </a>
                  </div>

                  <p className="text-[13px] sm:text-sm font-normal text-black/60 dark:text-zinc-400 leading-relaxed max-w-xl mb-4">
                    {company.description}
                  </p>

                  {/* Models Grid: Primary Flagship + Latest Checkpoint */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                    {/* Primary Flagship */}
                    {flagshipModel && (
                      <div
                        onClick={() => openModel(flagshipModel)}
                        role="button"
                        tabIndex={0}
                        aria-label={`View details for ${flagshipModel.name}`}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            openModel(flagshipModel)
                          }
                        }}
                        className="cursor-pointer p-3.5 sm:p-4 rounded-xl border border-black/10 dark:border-white/[0.08] bg-black/[0.02] dark:bg-[#0d0f13] hover:border-[#ff5d2e]/40 hover:shadow-sm hover:bg-white dark:hover:bg-white/[0.03] active:scale-[0.99] transition-all duration-150 select-none group"
                      >
                        <div className="flex items-center justify-between gap-2 text-xs font-sans mb-1.5">
                          <span className="text-[#ff5d2e] dark:text-[#ff7347] font-semibold uppercase text-[10px] tracking-[0.12em]">
                            Primary Flagship
                          </span>
                          <span className="text-[11px] text-black/40 dark:text-zinc-400 tabular-nums shrink-0">
                            {flagshipModel.contextWindow.replace(" tokens", "")}
                          </span>
                        </div>

                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-[15px] sm:text-base font-medium tracking-tight text-black dark:text-white group-hover:text-[#ff5d2e] dark:group-hover:text-[#ff7347] transition-colors duration-150">
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
                        onClick={() => openModel(second)}
                        role="button"
                        tabIndex={0}
                        aria-label={`View details for ${second.name}`}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            openModel(second)
                          }
                        }}
                        className="cursor-pointer p-3.5 sm:p-4 rounded-xl border border-black/10 dark:border-white/[0.08] bg-black/[0.02] dark:bg-[#0d0f13] hover:border-[#ff5d2e]/40 hover:shadow-sm hover:bg-white dark:hover:bg-white/[0.03] active:scale-[0.99] transition-all duration-150 select-none group"
                      >
                        <div className="flex items-center justify-between gap-2 text-xs font-sans mb-1.5">
                          <span className="font-semibold uppercase text-[10px] tracking-[0.12em] flex items-center gap-1">
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
                          <span className="text-[11px] text-black/40 dark:text-zinc-400 shrink-0">
                            {formatDate(second.releaseDate)}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 mb-1">
                          <span className="text-[15px] sm:text-base font-medium tracking-tight text-black dark:text-white group-hover:text-[#ff5d2e] dark:group-hover:text-[#ff7347] transition-colors duration-150">
                            {second.name}
                          </span>
                          <span className="text-[11px] font-sans text-black/40 dark:text-zinc-500">
                            {second.categoryLabel}
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
        folio={modalFolio.folio}
        folioId={modalFolio.folioId}
      />

    </>
  )
}
