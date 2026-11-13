import type { Metadata } from "next"
import Link from "next/link"
import Header from "@/components/header"
import { safeJsonLd } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Methodology - How ModelRegistry verifies models",
  description:
    "ModelRegistry's inclusion standard, primary-source rules, flagship and latest definitions, benchmark policy, verification levels, and maintenance schedule.",
  alternates: { canonical: "https://modelregistry.tirup.in/methodology" },
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-heading font-display font-semibold tracking-tight text-black dark:text-white mt-8 mb-3">
      {children}
    </h2>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="max-w-[54ch] text-body text-fg leading-6 sm:leading-7 mb-3">
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
    dateModified: "2026-11-03",
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
      <section className="page">
        <h1 className="text-page font-display font-semibold tracking-tight text-black dark:text-white mb-2">
          Methodology
        </h1>
        <p className="mb-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-small font-sans text-fg-muted">
          <span>Last updated 2026-11-03</span>
          <span className="h-3 w-px bg-black/10 dark:bg-white/15" aria-hidden="true" />
          <span>
            Full source audit:{" "}
            <Link href="https://github.com/TirupMehta/ModelRegistry/blob/main/docs/audit-2026-10-07.md" className="text-accent-ink hover:underline underline-offset-2">
              docs/audit-2026-10-07.md
            </Link>
          </span>
        </p>

        <H2>Inclusion standard</H2>
        <P>
          A model is listed only if it meets at least one bar: top-15 weekly
          inference volume on a public ranking, primary flagship of a tracked
          lab, or a genuinely frontier capability (state-of-the-art benchmark,
          new modality). Obscure checkpoints, minor patch bumps, rumors, and
          community fine-tunes are excluded. See also{" "}
          <Link href="/editorial-policy" className="text-accent-ink hover:underline underline-offset-2">editorial policy</Link>.
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

        <H2>Verification and sources</H2>
        <div className="mb-3 max-w-[54ch] space-y-2 text-body leading-6 text-fg sm:text-body sm:leading-7">
          <p>Every record cites the primary sources it was read from (announcement, model card, API docs, pricing page), with per-field citations showing which source supports which fact. Each record also carries a <strong className="text-black dark:text-white">last-verified date</strong> - the date those sources were reviewed. That date is a source-review date, not a live availability check.</p>
          <p>There is no &ldquo;partially verified&rdquo; badge on the site: a label that applies to almost every record says nothing. Instead, the sources and the last-checked date are shown directly, and every record has a &ldquo;Report an error&rdquo; link so readers can flag anything stale.</p>
          <p><strong className="text-black dark:text-white">Retired</strong> - explicitly marked as retired by the registry and kept for historical reference. This label describes availability, not verification depth, and it alone does not confirm provider availability.</p>
          <p><strong className="text-black dark:text-white">Superseded</strong> - a later release from the same laboratory took over this model&apos;s role. The record is kept with its sources and readings and links its replacement, but it is not ranked against the current lineup. Superseded is not retired.</p>
          <p><strong className="text-black dark:text-white">Unverified records</strong> can never carry flagship or latest labels and must be treated as unconfirmed until sources are cited.</p>
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

        <H2>Downgrade, correction, supersession, retirement</H2>
        <P>
          A newer release does not make an older model retired or unavailable. Older releases stay in
          the registry with their release date and sources.{" "}
          <strong className="text-black dark:text-white">Superseded</strong> is a separate label: it
          records that a later release from the same laboratory took over the model&apos;s role. A
          superseded record keeps its dates, sources and benchmark readings and links the model that
          replaced it; it is simply not ranked against the current lineup, because a reader choosing
          today cannot pick it. We mark a model retired only when a primary source says it was
          deprecated or discontinued. A record is downgraded when its evidence lapses, corrected when
          a primary source contradicts a field, and removed only for duplicates, hoaxes, or records
          that never had a verifiable official source. Every change is recorded in the model&apos;s
          changelog and the{" "}
          <Link href="/changelog" className="text-accent-ink hover:underline underline-offset-2">public changelog</Link>.
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
        <div className="mb-3 max-w-[54ch] space-y-2 text-body leading-6 text-fg sm:text-body sm:leading-7">
          <p><strong className="text-black dark:text-white">Every 30 days</strong> - automated liveness check of all cited sources; dead links re-sourced or records downgraded.</p>
          <p><strong className="text-black dark:text-white">Every 60 days</strong> - pricing and context figures re-checked against official pricing/docs pages for all current flagships and latest checkpoints.</p>
          <p><strong className="text-black dark:text-white">Every 90 days</strong> - full freshness rotation: any flagship/latest label older than 90 days fails validation until re-verified; leaderboard comparisons re-evaluated and re-dated; a new dated audit note is published.</p>
        </div>
      </section>
    </main>
  )
}
