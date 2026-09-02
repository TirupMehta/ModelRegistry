"use client"

import { useState } from "react"
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

      <section className="section max-w-4xl mx-auto w-full px-6 md:px-20 pb-20">
        <div className="space-y-4 text-base md:text-lg font-light text-black/70 dark:text-white/70 leading-relaxed max-w-3xl mb-10">
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
            // Find flagship and latest checkpoint
            const flagshipModel = modelsData.find(
              (m) => m.companyId === company.id && m.isCompanyFlagship
            )
            const latestDrop = modelsData.find(
              (m) => m.companyId === company.id && m.isLatestCheckpoint && m.id !== flagshipModel?.id
            )

            return (
              <TextWithBlur key={company.id} delay={index * 35}>
                <div className="p-5 sm:p-6 rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.015] dark:bg-white/[0.02] [transition:all_140ms_ease-out]">
                  {/* Lab Header */}
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: company.accentColor }}
                      />
                      <div>
                        <div className="flex items-baseline gap-2">
                          <h2 className="text-xl font-medium text-black dark:text-white">
                            {company.name}
                          </h2>
                          <span className="text-xs font-mono text-black/40 dark:text-white/40">
                            ({company.headquarters})
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm font-light text-black/60 dark:text-white/60 mt-0.5 max-w-xl">
                          {company.description}
                        </p>
                      </div>
                    </div>

                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-1 text-xs font-mono text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white transition-colors"
                    >
                      <Globe size={12} />
                      <span>{new URL(company.website).hostname}</span>
                      <ArrowUpRight size={11} className="icon-arrow-hover" />
                    </a>
                  </div>

                  {/* Models Grid: Primary Flagship + Latest Checkpoint */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                    {/* Primary Flagship */}
                    {flagshipModel && (
                      <div
                        onClick={() => setActiveModalModel(flagshipModel)}
                        className="cursor-pointer p-4 rounded-xl bg-black/[0.025] dark:bg-white/[0.035] border border-black/5 dark:border-white/5 hover:border-black/15 dark:hover:border-white/15 transition-all select-none active:scale-[0.99] group"
                      >
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-mono text-accent font-medium uppercase text-[10px] tracking-wider">
                            Primary Flagship
                          </span>
                          <span className="font-mono text-[11px] text-black/40 dark:text-white/40">
                            {flagshipModel.contextWindow.replace(" tokens", "")}
                          </span>
                        </div>

                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-base font-medium text-black dark:text-white group-hover:text-accent transition-colors">
                            {flagshipModel.name}
                          </span>
                        </div>

                        <p className="text-xs font-light text-black/60 dark:text-white/60 leading-relaxed line-clamp-2">
                          {flagshipModel.highlight}
                        </p>
                      </div>
                    )}

                    {/* Latest Checkpoint (if distinct from flagship) */}
                    {latestDrop ? (
                      <div
                        onClick={() => setActiveModalModel(latestDrop)}
                        className="cursor-pointer p-4 rounded-xl bg-black/[0.025] dark:bg-white/[0.035] border border-black/5 dark:border-white/5 hover:border-black/15 dark:hover:border-white/15 transition-all select-none active:scale-[0.99] group"
                      >
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-medium uppercase text-[10px] tracking-wider flex items-center gap-1">
                            <Sparkles size={11} /> Latest Checkpoint
                          </span>
                          <span className="font-mono text-[11px] text-black/40 dark:text-white/40">
                            {formatDate(latestDrop.releaseDate)}
                          </span>
                        </div>

                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-base font-medium text-black dark:text-white group-hover:text-accent transition-colors">
                            {latestDrop.name}
                          </span>
                          <span className="text-[11px] font-mono text-black/40 dark:text-white/40">
                            ({latestDrop.categoryLabel})
                          </span>
                        </div>

                        <p className="text-xs font-light text-black/60 dark:text-white/60 leading-relaxed line-clamp-2">
                          {latestDrop.highlight}
                        </p>
                      </div>
                    ) : (
                      flagshipModel && (
                        <div className="p-4 rounded-xl bg-black/[0.01] dark:bg-white/[0.015] border border-black/5 dark:border-white/5 flex flex-col justify-center text-xs font-light text-black/45 dark:text-white/45">
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
      <footer className="py-6 px-6 text-center border-t border-black/10 dark:border-white/10 max-w-4xl mx-auto w-full">
        <p className="text-xs font-light text-black/50 dark:text-white/50">
          © {currentYear} ModelRegistry. The open public registry for frontier AI models.
        </p>
      </footer>
    </main>
  )
}
