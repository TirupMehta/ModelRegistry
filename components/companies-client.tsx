"use client"

import { useState } from "react"
import Link from "next/link"
import TextWithBlur from "@/components/text-with-blur"
import { PageHeader } from "@/components/ui"
import ModelDetailsModal from "@/components/model-details-modal"
import { companies } from "@/data/companies"
import { modelsData, ModelItem } from "@/data/models"
import { folioFor } from "@/lib/registry"
import { ArrowUpRight } from "lucide-react"
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

      <section className="section page">
        <TextWithBlur delay={120}>
          <PageHeader
            title="Laboratories"
            lead="Every lab we track, with its main model and its newest release. Select a model for its record."
          />
        </TextWithBlur>

        <ul className="space-y-4">
          {companyList.map((company, index) => {
            const flagshipModel = modelsData.find((m) => m.companyId === company.id && m.isCompanyFlagship)
            const latestDrop = modelsData.find(
              (m) => m.companyId === company.id && m.isLatestCheckpoint && m.id !== flagshipModel?.id,
            )
            const secondaryModel = latestDrop
              ? null
              : [...modelsData]
                  .filter((m) => m.companyId === company.id && m.id !== flagshipModel?.id)
                  .sort((x, y) => y.releaseDate.localeCompare(x.releaseDate))[0]
            const second = latestDrop ?? secondaryModel
            const rows = [
              flagshipModel && { model: flagshipModel, label: "Main model", meta: flagshipModel.contextWindow.replace(" tokens", "") + " context" },
              second && {
                model: second,
                label: latestDrop ? "Newest release" : `More from ${company.shortName}`,
                meta: formatDate(second.releaseDate),
              },
            ].filter((row): row is { model: ModelItem; label: string; meta: string } => Boolean(row))

            return (
              <TextWithBlur key={company.id} delay={index * 35}>
                <li id={company.id} className="tile scroll-mt-24 p-5 sm:p-6">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <Link
                      href={`/companies/${company.id}`}
                      className="font-display text-heading font-semibold tracking-tight text-fg-strong transition-colors hover:text-accent-ink"
                    >
                      {company.name}
                    </Link>
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-small text-fg-muted transition-colors hover:text-accent-ink"
                    >
                      {new URL(company.website).hostname}
                      <ArrowUpRight size={12} aria-hidden="true" />
                    </a>
                  </div>
                  <p className="mt-1 text-small text-fg-muted">{company.headquarters}</p>
                  <p className="mt-3 line-clamp-3 max-w-2xl text-body leading-6 text-fg">{company.description}</p>

                  {rows.length > 0 && (
                    <ul className="rule-t mt-5">
                      {rows.map(({ model, label, meta }) => (
                        <li key={model.id} className="rule-b">
                          <button
                            type="button"
                            onClick={() => openModel(model)}
                            className="group grid w-full cursor-pointer grid-cols-[1fr_auto] items-baseline gap-x-4 py-3 text-left"
                          >
                            <span className="min-w-0">
                              <span className="block text-small text-fg-muted">{label}</span>
                              <span className="block truncate text-body font-semibold text-fg-strong transition-colors group-hover:text-accent-ink">
                                {model.name}
                              </span>
                            </span>
                            <span className="text-small tabular-nums text-fg-muted">{meta}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              </TextWithBlur>
            )
          })}
        </ul>
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
