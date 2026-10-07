import type { Metadata } from "next"
import Link from "next/link"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { safeJsonLd } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Editorial Policy - ModelRegistry",
  description:
    "ModelRegistry's editorial policy: sourcing requirements, no paid placement, no manipulated SEO, correction process, and what this registry does not claim.",
  alternates: { canonical: "https://modelregistry.tirup.in/editorial-policy" },
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

export default function EditorialPolicyPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "ModelRegistry editorial policy",
    url: "https://modelregistry.tirup.in/editorial-policy",
    dateModified: "2026-10-07",
  }

  return (
    <main className="relative min-h-screen">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <section className="max-w-4xl mx-auto w-full px-4 sm:px-6 md:px-20 pb-20">
        <p className="text-[11px] font-sans uppercase tracking-[0.14em] text-black/50 dark:text-zinc-400 font-semibold mb-2">
          Trust &amp; provenance
        </p>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-semibold tracking-tight text-black dark:text-white mb-2">
          Editorial policy
        </h1>
        <p className="text-xs font-sans text-black/45 dark:text-zinc-500 mb-8">
          Last updated 2026-10-07 · Methodology:{" "}
          <Link href="/methodology" className="text-[#ff5d2e] hover:underline underline-offset-2">
            /methodology
          </Link>
        </p>

        <H2>What this registry is</H2>
        <P>
          A community-maintained, machine-readable index of frontier AI models
          with visible primary sources for its factual claims. Verification
          means careful source review by maintainers - not independent
          laboratory testing, benchmark reproduction, or insider access - and
          every page says so where it matters.
        </P>

        <H2>What we will not do</H2>
        <div className="text-sm sm:text-[15px] text-black/70 dark:text-zinc-300 leading-6 sm:leading-7 mb-3 space-y-2">
          <p>No paid placement or sponsored rankings. Labs cannot pay for flagship status, leaderboard position, or faster listing.</p>
          <p>No manipulative SEO: no cloaking, keyword stuffing, doorway pages, purchased links, fake testimonials, or schema markup that doesn&apos;t match visible content.</p>
          <p>No fabricated authority: no invented endorsements, partnerships, citations, backlinks, or usage statistics.</p>
          <p>No claims that search engines or AI systems must use, cite, or prefer this registry. Structured data and feeds exist for accurate discoverability only.</p>
        </div>

        <H2>Sourcing bar for contributions</H2>
        <P>
          Every new model or correction must cite at least one live primary
          source (announcement, official docs, pricing page, model card,
          paper, or official weights repository). PRs without sources are not
          merged. Values that cannot be sourced are left out or explicitly
          marked, never filled in by guesswork. See{" "}
          <Link href="https://github.com/TirupMehta/ModelRegistry/blob/main/CONTRIBUTING.md" className="text-[#ff5d2e] hover:underline underline-offset-2">
            CONTRIBUTING.md
          </Link>.
        </P>

        <H2>Corrections</H2>
        <P>
          Errors can be reported from any model page (“Report an error in this
          record”) or via a{" "}
          <Link href="https://github.com/TirupMehta/ModelRegistry/issues/new?template=data-correction.yml" className="text-[#ff5d2e] hover:underline underline-offset-2">
            data-correction issue
          </Link>
          , which requires an official source. Corrections are applied with a
          dated changelog entry on the record and summarized on{" "}
          <Link href="/changelog" className="text-[#ff5d2e] hover:underline underline-offset-2">/changelog</Link>.
        </P>

        <H2>Statistics and leaderboards</H2>
        <P>
          Counts, prices, and context figures are dataset facts with sources.
          Leaderboard placements are editorial judgments with a published
          methodology, evaluation date, and cited metric definitions - not
          objective “best model” verdicts.
        </P>
      </section>
      <Footer />
    </main>
  )
}
