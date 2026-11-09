import type { Metadata } from "next"
import Link from "next/link"
import Header from "@/components/header"
import { datasetRevision } from "@/data/revision"
import { ORGANIZATION_ID } from "@/lib/entities"
import { SITE_URL } from "@/lib/site"
import { safeJsonLd } from "@/lib/utils"

export const metadata: Metadata = {
  title: "ModelRegistry CLI - query frontier AI models from the terminal",
  description:
    "Official ModelRegistry CLI: list flagships, fetch one model, diff the changelog, and print Markdown from a terminal. Zero-dependency Node 18+ script over the free, unauthenticated REST API.",
  keywords: [
    "ModelRegistry CLI",
    "AI model registry CLI",
    "modelregistry command line",
    "AI model API CLI",
    "frontier models terminal",
  ],
  alternates: { canonical: `${SITE_URL}/cli` },
  openGraph: {
    title: "ModelRegistry CLI",
    description:
      "Zero-dependency Node 18+ command-line client for the open frontier AI model registry. Free, unauthenticated, read-only.",
    url: `${SITE_URL}/cli`,
    siteName: "ModelRegistry",
    type: "website",
  },
}

function Code({ children }: { children: string }) {
  return (
    <pre className="rounded-md border border-black/10 dark:border-white/[0.08] bg-white dark:bg-[var(--surface-raised)] overflow-x-auto p-3.5 mb-4">
      <code className="font-mono text-[12px] leading-5 text-black/80 dark:text-zinc-200 whitespace-pre">
        {children}
      </code>
    </pre>
  )
}

function Row({ name, desc }: { name: string; desc: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 px-4 py-3 border-b border-black/5 dark:border-white/[0.06] last:border-0">
      <code className="font-mono text-xs text-black dark:text-white sm:w-52 shrink-0">{name}</code>
      <span className="text-xs text-black/60 dark:text-zinc-400 leading-relaxed">{desc}</span>
    </div>
  )
}

export default function CliPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${SITE_URL}/cli`,
    url: `${SITE_URL}/cli`,
    name: "ModelRegistry CLI",
    description:
      "Command-line client for the ModelRegistry frontier AI model registry: list flagships and checkpoints, fetch one record, diff the changelog, and print Markdown.",
    isPartOf: { "@id": `${SITE_URL}/#website` },
    about: { "@id": ORGANIZATION_ID },
    mainEntity: {
      "@type": "SoftwareSourceCode",
      name: "modelregistry CLI",
      codeRepository: "https://github.com/TirupMehta/ModelRegistry/tree/main/cli",
      programmingLanguage: "JavaScript",
      runtimePlatform: "Node.js 18+",
      license: "https://github.com/TirupMehta/ModelRegistry/blob/main/LICENSE",
    },
    inLanguage: "en",
  }

  return (
    <main className="relative min-h-screen">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <section className="max-w-4xl mx-auto w-full px-4 sm:px-6 md:px-20 pb-20">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-semibold tracking-tight text-black dark:text-white mb-3">
          ModelRegistry CLI
        </h1>
        <p className="text-sm sm:text-[15px] text-black/70 dark:text-zinc-300 leading-6 sm:leading-7 mb-8 max-w-3xl">
          The official command-line client for this registry. It reads the same public JSON API a
          browser or an agent uses - free, read-only, no account and no key - and adds the parts
          that are annoying to rewrite in shell: query building, terminal tables, followable error
          hints, and a <code className="font-mono text-xs">--json</code> flag for pipelines.
        </p>

        <h2 className="text-lg sm:text-xl font-display font-semibold tracking-tight text-black dark:text-white mb-3">
          Run it
        </h2>
        <p className="text-sm text-black/70 dark:text-zinc-300 leading-6 mb-3 max-w-3xl">
          The CLI ships in the repository as{" "}
          <code className="font-mono text-xs">cli/index.mjs</code>. It has no dependencies, so a
          checkout is the whole install.
        </p>
        <Code>{`git clone https://github.com/TirupMehta/ModelRegistry.git
node ModelRegistry/cli/index.mjs models --flagship-only
node ModelRegistry/cli/index.mjs model gpt-6-1-sol
node ModelRegistry/cli/index.mjs changes --since 2026-11-01 --limit 20
node ModelRegistry/cli/index.mjs health
node ModelRegistry/cli/index.mjs markdown /docs`}</Code>
        <p className="text-xs text-black/50 dark:text-zinc-500 leading-relaxed mb-8 max-w-3xl">
          The npm package metadata is ready at <code className="font-mono text-[11px]">cli/package.json</code>,
          but the package is not published to npm yet - there is no registry account behind it. Until
          then, run it from a checkout or use the hosted endpoints below, which need nothing
          installed.
        </p>

        <h2 className="text-lg sm:text-xl font-display font-semibold tracking-tight text-black dark:text-white mb-3">
          Commands
        </h2>
        <div className="rounded-md border border-black/10 dark:border-white/[0.08] bg-white dark:bg-[var(--surface-raised)] mb-4">
          <Row name="models" desc="List tracked models. Filters: --company, --category, --open-weights, --flagship-only, --latest-only." />
          <Row name="model <id>" desc="One record: specs, pricing, license, verification status, lab-reported benchmarks, sources." />
          <Row name="changes" desc="Changelog entries newest first. Filters: --since, --until, --model, --company, --limit." />
          <Row name="health" desc="Dataset revision, per-status counts, oldest source check, upstream reachability." />
          <Row name="markdown [path]" desc="Markdown rendering of any page, default /. Same bytes an agent gets from Accept: text/markdown." />
          <Row name="--json" desc="Print the untouched API payload instead of a table." />
          <Row name="--base-url" desc="Point at a preview or local build. Also read from MODELREGISTRY_BASE_URL." />
        </div>

        <h2 className="text-lg sm:text-xl font-display font-semibold tracking-tight text-black dark:text-white mb-3">
          No install needed
        </h2>
        <p className="text-sm text-black/70 dark:text-zinc-300 leading-6 mb-4 max-w-3xl">
          A one-off read does not need the CLI. These three routes answer in plain text:
        </p>
        <Code>{`curl -s ${SITE_URL}            # flagships table (curl is auto-detected)
curl -s ${SITE_URL}/api/v1/cli   # the same table, explicitly
curl -s ${SITE_URL}/latest       # newest releases`}</Code>

        <h2 className="text-lg sm:text-xl font-display font-semibold tracking-tight text-black dark:text-white mb-3">
          Honest limits
        </h2>
        <ul className="text-sm text-black/70 dark:text-zinc-300 leading-6 space-y-1.5 mb-8 max-w-3xl list-disc pl-5">
          <li>Benchmark figures are lab-reported, not independently reproduced.</li>
          <li>
            <code className="font-mono text-xs">lastVerifiedAt</code> is the date a source was
            reviewed, not a live availability signal.
          </li>
          <li>
            Provider listings are a separate live snapshot and never change a record&apos;s
            verification status.
          </li>
          <li>
            Every API response advertises a rate budget; back off on{" "}
            <code className="font-mono text-xs">429</code> using{" "}
            <code className="font-mono text-xs">Retry-After</code>.
          </li>
        </ul>

        <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs">
          <Link href="/docs" className="text-accent-ink hover:underline underline-offset-2">
            API reference
          </Link>
          <a href="/openapi.json" className="text-accent-ink hover:underline underline-offset-2">
            OpenAPI 3.1
          </a>
          <a href="/llms.txt" className="text-accent-ink hover:underline underline-offset-2">
            llms.txt
          </a>
          <a
            href="https://github.com/TirupMehta/ModelRegistry/tree/main/cli"
            className="text-accent-ink hover:underline underline-offset-2"
          >
            CLI source on GitHub
          </a>
        </div>
        <p className="text-[11px] font-sans text-black/40 dark:text-zinc-500 mt-6">
          Dataset {datasetRevision.datasetVersion} · revised {datasetRevision.revisedAt}
        </p>
      </section>
    </main>
  )
}
