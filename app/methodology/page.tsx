import type { Metadata } from "next"
import Link from "next/link"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { safeJsonLd } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Methodology - How ModelRegistry verifies models",
  description:
    "ModelRegistry's inclusion standard, primary-source rules, flagship and latest definitions, benchmark policy, verification levels, and maintenance schedule.",
  alternates: { canonical: "https://modelregistry.tirup.in/methodology" },
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg sm:text-xl font-display font-semibold tracking-tight text-black dark:text-white mt-8 mb-3">
      {children}
    </h2>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm sm:text-[15px] text-black/70 dark:text-zinc-300 leading-6 sm:leading-7 mb-3">
      {children}
    </p>
  )
}

export default function MethodologyPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "ModelRegistry methodology",
    url: "https://modelregistry.tirup.in/methodology",
    dateModified: "2026-10-07",
    about: {
      "@type": "Dataset",
      name: "Frontier AI Models Specification Registry",
      url: "https://modelregistry.tirup.in/api/v1/models",
    },
  }
  const jsonLdBreadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Ledger", item: "https://modelregistry.tirup.in/" },
      { "@type": "ListItem", position: 2, name: "Methodology", item: "https://modelregistry.tirup.in/methodology" },
    ],
  }

  return (
    <main className="relative min-h-screen">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLdBreadcrumb) }} />
      <section className="max-w-4xl mx-auto w-full px-4 sm:px-6 md:px-20 pb-20">
        <p className="text-[11px] font-sans uppercase tracking-[0.14em] text-black/50 dark:text-zinc-400 font-semibold mb-2">
          Trust &amp; provenance
        </p>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-semibold tracking-tight text-black dark:text-white mb-2">
          Methodology
        </h1>
        <p className="text-xs font-sans text-black/45 dark:text-zinc-500 mb-8">
          Last updated 2026-10-07 · Full source audit:{" "}
          <Link href="https://github.com/TirupMehta/ModelRegistry/blob/main/docs/audit-2026-10-07.md" className="text-[#ff5d2e] hover:underline underline-offset-2">
            docs/audit-2026-10-07.md
          </Link>
        </p>

        <H2>Inclusion standard</H2>
        <P>
          A model is listed only if it meets at least one bar: top-15 weekly
          inference volume on a public ranking, primary flagship of a tracked
          lab, or a genuinely frontier capability (state-of-the-art benchmark,
          new modality). Obscure checkpoints, minor patch bumps, rumors, and
          community fine-tunes are excluded. See also{" "}
          <Link href="/editorial-policy" className="text-[#ff5d2e] hover:underline underline-offset-2">editorial policy</Link>.
        </P>

        <H2>What counts as a primary source</H2>
        <P>
          In order of strength: the lab&apos;s announcement post, official API
          documentation or pricing page, model card, technical paper, and the
          lab&apos;s official organization repository (e.g. Hugging Face).
          An official developer console counts as supporting evidence. News
          coverage is never the sole source for a factual field, and values
          are never inferred when a source is silent.
        </P>

        <H2>Verification levels</H2>
        <div className="text-sm sm:text-[15px] text-black/70 dark:text-zinc-300 leading-6 sm:leading-7 mb-3 space-y-2">
          <p><strong className="text-black dark:text-white">Verified</strong> - every core field (release date, context, output limit, parameters, license, pricing, modalities, benchmarks where published, flagship/latest status) was read and confirmed against live primary sources.</p>
          <p><strong className="text-black dark:text-white">Partially verified</strong> - one or more live official sources are cited, but full per-field rechecking is still pending. Figures are transcribed from the cited pages.</p>
          <p><strong className="text-black dark:text-white">Unverified</strong> - no working official source. Figures must be treated as unconfirmed; such records can never carry flagship or latest labels.</p>
          <p><strong className="text-black dark:text-white">Retired</strong> - superseded and kept for reference only, with a pointer to its replacement.</p>
        </div>

        <H2>What “flagship”, “latest”, and leaderboard places mean</H2>
        <P>
          <strong className="text-black dark:text-white">Flagship</strong> = the lab&apos;s primary general-purpose model
          (exactly one per lab). <strong className="text-black dark:text-white">Latest checkpoint</strong> = the
          lab&apos;s newest shipped release, which may be a specialized model rather than the flagship.
          Both labels require fresh (≤ 90 days), live evidence, enforced automatically - stale labels fail validation.
          Leaderboard sections are an <strong className="text-black dark:text-white">editorial snapshot</strong>, not
          objective fact: leaders hold the highest <em>published</em> score in that comparison as of the stated
          evaluation date. We say “highest published score in this comparison”, never “best model”.
        </P>

        <H2>Benchmarks: lab-published vs independent</H2>
        <P>
          Benchmark figures on model pages are lab-published scores as reported by the vendor, kept separate
          per harness and version (DeepSWE v1.1 is not SWE-bench Verified). They are not independently
          reproduced by this registry. Independent evaluations (e.g. Artificial Analysis indices) are cited
          as such where used. Figures without a citable source are shown with an explicit “no citation yet”
          marker instead of a borrowed number.
        </P>

        <H2>Downgrade, correction, retirement, removal</H2>
        <P>
          A record is downgraded (e.g. flagship → previous generation, or a label removed) when its
          evidence lapses; corrected when a primary source contradicts a field; retired when superseded
          (with a pointer); removed only for duplicates, hoaxes, or records that never had a verifiable
          official source. Every change is recorded in the model&apos;s changelog and the{" "}
          <Link href="/changelog" className="text-[#ff5d2e] hover:underline underline-offset-2">public changelog</Link>.
        </P>

        <H2>Maintainers and corrections</H2>
        <P>
          ModelRegistry is a community project maintained via its public GitHub repository. Verification
          is source review by maintainers - not independent laboratory testing, and we do not claim
          otherwise. To report an error, use the “Report an error in this record” link on any model
          page, which opens a correction issue requiring an official source. High-severity factual
          errors (wrong price, wrong flagship) are fixed within days; routine re-verification follows
          the schedule below.
        </P>

        <H2>Maintenance schedule</H2>
        <div className="text-sm sm:text-[15px] text-black/70 dark:text-zinc-300 leading-6 sm:leading-7 mb-3 space-y-2">
          <p><strong className="text-black dark:text-white">Every 30 days</strong> - automated liveness check of all cited sources; dead links re-sourced or records downgraded.</p>
          <p><strong className="text-black dark:text-white">Every 60 days</strong> - pricing and context figures re-checked against official pricing/docs pages for all current flagships and latest checkpoints.</p>
          <p><strong className="text-black dark:text-white">Every 90 days</strong> - full freshness rotation: any flagship/latest label older than 90 days fails validation until re-verified; leaderboard comparisons re-evaluated and re-dated; a new dated audit note is published.</p>
        </div>
      </section>
      <Footer />
    </main>
  )
}
