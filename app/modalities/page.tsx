import type { Metadata } from "next"
import Link from "next/link"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { modelsData } from "@/data/models"
import { datasetRevision } from "@/data/revision"
import { safeJsonLd } from "@/lib/utils"

export const metadata: Metadata = {
  title: "AI model capability & modality matrix - ModelRegistry",
  description:
    "Which frontier models handle text, vision, audio, video, code, and images - as declared by each lab, with sources.",
  alternates: { canonical: "https://modelregistry.tirup.in/modalities" },
}

const MODS = ["Text", "Vision", "Audio", "Video", "Code", "Image"] as const

export default function ModalitiesPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "AI model capability and modality matrix",
    url: "https://modelregistry.tirup.in/modalities",
    dateModified: datasetRevision.revisedAt,
  }

  return (
    <main className="relative min-h-screen">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <section className="max-w-4xl mx-auto w-full px-4 sm:px-6 md:px-20 pb-20">
        <p className="text-[11px] font-sans uppercase tracking-[0.14em] text-black/50 dark:text-zinc-400 font-semibold mb-2">
          Reference · updated {datasetRevision.revisedAt} (dataset {datasetRevision.datasetVersion})
        </p>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-semibold tracking-tight text-black dark:text-white mb-3">
          Capability &amp; modality matrix
        </h1>
        <p className="text-sm sm:text-[15px] text-black/70 dark:text-zinc-300 leading-6 sm:leading-7 mb-8 max-w-3xl">
          Modalities as declared by each lab - a dot means the vendor lists the capability, not
          that it leads at it. Depth of support varies widely; check the{" "}
          <Link href="/methodology" className="text-[#ff5d2e] hover:underline underline-offset-2">model pages</Link>{" "}
          and linked sources for details.
        </p>
        <div className="border border-black/10 dark:border-white/[0.08] rounded-xl overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="border-b border-black/10 dark:border-white/[0.08] text-[11px] font-sans uppercase tracking-wider text-black/50 dark:text-zinc-400">
                <th className="text-left font-medium px-4 py-3">Model</th>
                {MODS.map((mod) => (
                  <th key={mod} className="font-medium px-2 py-3 text-center">{mod}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {modelsData.map((m) => (
                <tr key={m.id} className="border-b border-black/5 dark:border-white/[0.05] last:border-0">
                  <td className="px-4 py-2.5 min-w-0">
                    <Link href={`/models/${m.id}`} className="font-medium tracking-tight text-black dark:text-white hover:text-[#ff5d2e] block truncate">
                      {m.name}
                    </Link>
                    <span className="block text-[11px] font-sans text-black/45 dark:text-zinc-500">{m.companyName}</span>
                  </td>
                  {MODS.map((mod) => (
                    <td key={mod} className="px-2 py-2.5 text-center">
                      {m.modalities.includes(mod) ? (
                        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" title={`${m.name} supports ${mod}`} />
                      ) : (
                        <span className="inline-block w-2 h-2 rounded-full bg-black/10 dark:bg-white/10" title={`${m.name} does not list ${mod}`} />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <Footer />
    </main>
  )
}
