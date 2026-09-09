import Link from "next/link"
import { Metadata } from "next"
import Header from "@/components/header"
import TextWithBlur from "@/components/text-with-blur"
import DocsSidebar, { DocsIndexChips } from "@/components/docs-nav"
import { companies } from "@/data/companies"
import { modelsData } from "@/data/models"
import { safeJsonLd } from "@/lib/utils"
import { ArrowLeft, ArrowUpRight } from "lucide-react"

const SITE_URL = "https://modelregistry.tirup.in"

export const metadata: Metadata = {
  title: "API & Feeds Reference — Endpoints, Parameters, Examples | ModelRegistry",
  description:
    "Free unauthenticated REST API, RSS, llms.txt, CLI, badges and health endpoints for the open frontier AI model registry. Authentication, rate limits, errors, full field reference, and copy-paste examples.",
  alternates: {
    canonical: `${SITE_URL}/docs`,
  },
  openGraph: {
    title: "ModelRegistry API & Feeds Reference",
    description:
      "Query frontier models as JSON, RSS, plain text, or badges. Free, unauthenticated, CORS-open.",
    url: `${SITE_URL}/docs`,
    siteName: "ModelRegistry",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "ModelRegistry API & Feeds Reference",
    description:
      "Query frontier AI models as JSON, RSS, plain text, or badges. Free and unauthenticated.",
  },
}

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="px-4 py-3.5 rounded-md border border-black/10 dark:border-white/[0.08] bg-black/[0.02] dark:bg-black/40 text-xs font-mono leading-relaxed text-black/80 dark:text-zinc-200 overflow-x-auto [scrollbar-width:thin] whitespace-pre">
      {code}
    </pre>
  )
}

function ParamRow({ name, type, desc }: { name: string; type: string; desc: string }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[170px_110px_1fr] gap-1 sm:gap-4 px-5 py-3 border-t border-black/5 dark:border-white/[0.06] first:border-t-0 text-xs font-sans items-baseline">
      <code className="font-mono text-[#ff5d2e] dark:text-[#ff7347] font-medium">{name}</code>
      <span className="text-black/40 dark:text-zinc-500">{type}</span>
      <span className="text-black/65 dark:text-zinc-300 leading-relaxed">{desc}</span>
    </div>
  )
}

function FieldRow({ name, type, desc }: { name: string; type: string; desc: string }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[180px_140px_1fr] gap-1 sm:gap-4 px-5 py-3 border-t border-black/5 dark:border-white/[0.06] first:border-t-0 text-xs font-sans items-baseline">
      <code className="font-mono text-black dark:text-white font-medium">{name}</code>
      <span className="font-mono text-[11px] text-black/40 dark:text-zinc-500">{type}</span>
      <span className="text-black/65 dark:text-zinc-300 leading-relaxed">{desc}</span>
    </div>
  )
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border-l-2 border-[#ff5d2e] bg-black/[0.02] dark:bg-white/[0.02] px-5 py-3.5 text-xs sm:text-[13px] font-sans text-black/65 dark:text-zinc-300 leading-relaxed">
      {children}
    </div>
  )
}

export default function DocsPage() {
  const labList = Object.values(companies)
  const sampleFlagship = modelsData.find((m) => m.isCompanyFlagship)

  const sampleResponse = `{
  "status": "success",
  "total": ${modelsData.length},
  "updatedAt": "2026-09-09T00:00:00.000Z",
  "metadata": { "registry": "ModelRegistry", "license": "Open Data / MIT" },
  "companies": [{ "id": "openai", "page": "/companies/openai",
    "latestFlagship": "GPT-6 Astra", "latestCheckpoint": "ChatGPT Images 2.5" }],
  "models": [{
    "id": "${sampleFlagship?.id ?? "gpt-6-astra"}",
    "name": "${sampleFlagship?.name ?? "GPT-6 Astra"}",
    "releaseDate": "${sampleFlagship?.releaseDate ?? "2026-09-04"}",
    "pricing": { "input": ${sampleFlagship?.pricing.input ?? 10}, "output": ${sampleFlagship?.pricing.output ?? 50} }
  }]
}`

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: "ModelRegistry API & Feeds Reference",
    description:
      "Free unauthenticated REST API, RSS, llms.txt, CLI, badges and health endpoints for the open frontier AI model registry.",
    url: `${SITE_URL}/docs`,
    author: {
      "@type": "Organization",
      name: "ModelRegistry Open Source Contributors",
      url: "https://github.com/TirupMehta/ModelRegistry",
    },
  }

  return (
    <main className="relative min-h-screen">
      <Header />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />

      {/* Wide docs shell — sidebar docked outside the narrow site column */}
      {/* Margin rail — fixed outside the site column, hugging the content
          with a constant gap, so the content keeps the exact title edge. */}
      <aside className="hidden min-[1440px]:block fixed z-30 w-52 top-24 bottom-8 left-[calc((100vw-56rem)/2-232px)]">
        <DocsSidebar />
      </aside>

      {/* True site column — identical box to every other page */}
      <section className="section max-w-4xl mx-auto w-full px-4 sm:px-6 md:px-20 pb-20">
        {/* Breadcrumb */}
        <TextWithBlur>
          <div className="flex items-center gap-2.5 mb-7 text-xs font-sans tracking-wider leading-relaxed text-black/50 dark:text-zinc-400 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <Link
              href="/"
              className="inline-flex items-center gap-1 hover:text-[#ff5d2e] dark:hover:text-[#ff5d2e] transition-colors duration-150 shrink-0"
            >
              <ArrowLeft size={13} />
              <span>LEDGER</span>
            </Link>
            <span className="shrink-0">/</span>
            <span className="text-[#ff5d2e] font-medium truncate">DOCS</span>
          </div>
        </TextWithBlur>

        {/* Mobile / tablet index chips (rail takes over on wide screens) */}
        <DocsIndexChips />

        {/* Content */}
        <div className="min-w-0">
            <div id="overview" className="scroll-mt-24 mb-12">
              <TextWithBlur>
                <h1 className="text-3xl sm:text-4xl font-display font-medium tracking-tight text-black dark:text-white mb-4">
                  API Reference
                </h1>
                <div className="space-y-4 text-[15px] md:text-base font-normal text-black/65 dark:text-zinc-300 leading-relaxed">
                  <p>
                    ModelRegistry exposes every record as machine-readable data. The REST API
                    serves versioned JSON, feeds cover syndication and AI ground truth, and
                    badges plus CLI routes cover embedding and terminal workflows. Everything
                    below is public, free, and requires no account.
                  </p>
                  <p>
                    Base URL for all endpoints is{" "}
                    <span className="text-black dark:text-white bg-black/[0.04] dark:bg-white/[0.06] px-1.5 py-0.5 rounded">
                      {SITE_URL}
                    </span>
                    . Conventions used throughout this reference:{" "}
                    GET only — the registry is
                    read-only, so there are no write, update, or delete operations.
                  </p>
                </div>
              </TextWithBlur>
            </div>

            <div id="authentication" className="scroll-mt-24 mb-12">
              <TextWithBlur>
                <h2 className="text-xl font-display font-medium tracking-tight text-black dark:text-white mb-3">
                  Authentication
                </h2>
                <p className="text-sm font-normal text-black/60 dark:text-zinc-400 leading-relaxed mb-4 max-w-2xl">
                  There is none. No API keys, no tokens, no OAuth scopes, no signup. Every
                  endpoint on this page answers anonymous requests, from browsers, servers,
                  CI jobs, and agents alike. Responses include{" "}
                  <code className="font-mono text-xs">Access-Control-Allow-Origin: *</code>,
                  so browser-side applications can call the API directly without a proxy.
                </p>
                <Note>
                  Because the API is open by design, please cache responses on your side for
                  high-traffic use. The dataset changes when labs ship — typically a few
                  times per week — so aggressive polling gains nothing.
                </Note>
              </TextWithBlur>
            </div>

            <div id="rate-limits" className="scroll-mt-24 mb-12">
              <TextWithBlur>
                <h2 className="text-xl font-display font-medium tracking-tight text-black dark:text-white mb-3">
                  Rate limits & caching
                </h2>
                <p className="text-sm font-normal text-black/60 dark:text-zinc-400 leading-relaxed mb-4 max-w-2xl">
                  No published per-client rate limit is enforced today. Abuse protection is
                  handled at the edge. Responses carry explicit cache directives — honor them
                  instead of re-requesting:
                </p>
                <div className="rounded-md border border-black/10 dark:border-white/[0.08] bg-white dark:bg-[#0e1014] mb-4">
                  <ParamRow name="REST · feeds · badges" type="edge cache" desc="public, s-maxage=3600, stale-while-revalidate=86400. Freshness of up to one hour; stale copies served while revalidating." />
                  <ParamRow name="/api/check-updates" type="dynamic" desc="Evaluated per request. Its upstream heartbeat is cached for 5 minutes; the counts always reflect the live dataset." />
                </div>
                <Note>
                  Practical guidance: poll <code className="font-mono text-xs">/api/check-updates</code> no
                  more than once every 5 minutes, and treat a change in{" "}
                  <code className="font-mono text-xs">trackedModelsCount</code> as your signal to
                  re-fetch <code className="font-mono text-xs">/api/v1/models</code>.
                </Note>
              </TextWithBlur>
            </div>

            <div id="errors" className="scroll-mt-24 mb-12">
              <TextWithBlur>
                <h2 className="text-xl font-display font-medium tracking-tight text-black dark:text-white mb-3">
                  Errors
                </h2>
                <p className="text-sm font-normal text-black/60 dark:text-zinc-400 leading-relaxed mb-4 max-w-2xl">
                  The API prefers empty results over failed requests. Unknown filter values
                  return HTTP 200 with an empty collection — parse defensively and key off{" "}
                  <code className="font-mono text-xs">status</code> and{" "}
                  <code className="font-mono text-xs">total</code>.
                </p>
                <div className="rounded-md border border-black/10 dark:border-white/[0.08] bg-white dark:bg-[#0e1014]">
                  <ParamRow name="200 + empty list" type="filters" desc="?company=unknownlab or a category with no matches. status stays “success”, total is 0." />
                  <ParamRow name="404" type="pages" desc="Unknown site routes and retired model slugs with no resolvable lab successor." />
                  <ParamRow name="500" type="og images" desc="/api/og returns a plain-text error body if card rendering fails. Retry once before reporting." />
                </div>
              </TextWithBlur>
            </div>

            <div id="get-models" className="scroll-mt-24 mb-12">
              <TextWithBlur>
                <div className="flex flex-wrap items-center gap-2.5 mb-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded font-mono text-[11px] font-bold tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shrink-0">
                    GET
                  </span>
                  <code className="font-mono text-sm sm:text-[15px] font-medium text-black dark:text-white break-all">
                    /api/v1/models
                  </code>
                </div>
                <p className="text-sm font-normal text-black/60 dark:text-zinc-400 leading-relaxed mb-4 max-w-2xl">
                  The primary endpoint. Returns the full registry — every model with its
                  specifications — plus a per-laboratory rollup. All parameters are optional
                  and combinable.
                </p>
                <div className="rounded-md border border-black/10 dark:border-white/[0.08] bg-white dark:bg-[#0e1014] mb-3">
                  <ParamRow name="company" type="string" desc={`Lab id — ${labList.map((l) => l.id).join(", ")}.`} />
                  <ParamRow name="category" type="string" desc="flagship · reasoning · open-weights · code · multimodal · audio · image · video" />
                  <ParamRow name="openWeights" type="string" desc="“true” for downloadable weights, “false” for proprietary API models." />
                  <ParamRow name="flagshipOnly" type="string" desc="“true” returns exactly one primary flagship per laboratory." />
                  <ParamRow name="latestOnly" type="string" desc="“true” returns each lab's newest shipped checkpoint(s)." />
                </div>
                <CodeBlock code={sampleResponse} />
              </TextWithBlur>
            </div>

            <div id="model-object" className="scroll-mt-24 mb-12">
              <TextWithBlur>
                <h2 className="text-xl font-display font-medium tracking-tight text-black dark:text-white mb-3">
                  The model object
                </h2>
                <p className="text-sm font-normal text-black/60 dark:text-zinc-400 leading-relaxed mb-4 max-w-2xl">
                  Every entry in <code className="font-mono text-xs">models[]</code> follows this
                  shape. Fields marked conditional appear only where they apply.
                </p>
                <div className="rounded-md border border-black/10 dark:border-white/[0.08] bg-white dark:bg-[#0e1014]">
                  <FieldRow name="id" type="string" desc="Stable kebab-case identifier. Never reused; suitable as a long-lived foreign key." />
                  <FieldRow name="companyId · companyName" type="string" desc="Owning laboratory. companyId matches ?company= and /companies/:id." />
                  <FieldRow name="name · version" type="string" desc="Display name and lab version string (e.g. “6.0-Astra”, “V4.1-Flash-Beta”)." />
                  <FieldRow name="releaseDate" type="date" desc="First public availability, YYYY-MM-DD. The canonical ordering key across the registry." />
                  <FieldRow name="isCompanyFlagship" type="boolean" desc="Exactly one true per lab — its primary general-purpose model." />
                  <FieldRow name="isLatestCheckpoint" type="boolean" desc="True for the lab's newest shipped release. May coincide with the flagship." />
                  <FieldRow name="category · categoryLabel" type="string" desc="Machine bucket (image, video, flagship…) plus the human display label." />
                  <FieldRow name="contextWindow(Tokens)" type="string · number" desc="Human string plus sortable token count. Visual models use descriptive windows with a 0 count so they never outrank token models." />
                  <FieldRow name="parameters" type="string" desc="Architecture description. “Undisclosed (…)” where the lab has published nothing — never fabricated." />
                  <FieldRow name="pricing · pricingUnit" type="object · string?" desc="Per-1M-token input/output USD by default; pricingUnit (e.g. “per second”) marks non-token billing." />
                  <FieldRow name="modalities" type="string[]" desc="Text · Vision · Audio · Video · Code · Image, as applicable." />
                  <FieldRow name="benchmarks" type="object" desc="Lab-published scores only (sweBench, mmluPro, gpqa…). Empty object means none published." />
                  <FieldRow name="links" type="object" desc="Official announcement, playground, paper, apiDocs, weights URLs. Announcement is mandatory per contribution policy." />
                  <FieldRow name="variants?" type="object[]" desc="Named sub-releases shipped under one entry (e.g. API twins), each with role, detail, pricing note, and docs link." />
                </div>
              </TextWithBlur>
            </div>

            <div id="examples" className="scroll-mt-24 mb-12">
              <TextWithBlur>
                <h2 className="text-xl font-display font-medium tracking-tight text-black dark:text-white mb-2">
                  Examples
                </h2>
                <p className="text-sm font-normal text-black/60 dark:text-zinc-400 leading-relaxed mb-4 max-w-2xl">
                  Each recipe below does one job — pick your language, copy, run.
                </p>
                <div className="grid grid-cols-1 gap-5">
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#ff5d2e] dark:text-[#ff7347] mb-2">
                      01 · One flagship per lab — cURL
                    </p>
                    <CodeBlock
                      code={`curl -s "${SITE_URL}/api/v1/models?flagshipOnly=true" | head -c 400`}
                    />
                  </div>
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#ff5d2e] dark:text-[#ff7347] mb-2">
                      02 · Newest video checkpoints — Python
                    </p>
                    <CodeBlock
                      code={`import requests
res = requests.get("${SITE_URL}/api/v1/models",
    params={"category": "video", "latestOnly": "true"}).json()
for m in res["models"]:
    print(m["name"], "—", m["releaseDate"])"`}
                    />
                  </div>
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#ff5d2e] dark:text-[#ff7347] mb-2">
                      03 · Filter by lab in the browser — JavaScript
                    </p>
                    <CodeBlock
                      code={`// No proxy needed — the API sends Access-Control-Allow-Origin: *
const { total, models } = await (
  await fetch("${SITE_URL}/api/v1/models?company=deepseek")
).json();`}
                    />
                  </div>
                </div>
              </TextWithBlur>
            </div>

            <div id="cli" className="scroll-mt-24 mb-12">
              <TextWithBlur>
                <h2 className="text-xl font-display font-medium tracking-tight text-black dark:text-white mb-2">
                  CLI & plain text
                </h2>
                <p className="text-sm font-normal text-black/60 dark:text-zinc-400 leading-relaxed mb-4 max-w-2xl">
                  Three terminal-native routes. The root URL sniffs curl and answers in
                  plain text — nothing to install, no keys.
                </p>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5 mb-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded font-mono text-[11px] font-bold tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shrink-0">
                        GET
                      </span>
                      <code className="font-mono text-sm font-medium text-black dark:text-white">
                        /
                      </code>
                    </div>
                    <CodeBlock code={`curl -s ${SITE_URL}   # auto-detected dashboard`} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5 mb-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded font-mono text-[11px] font-bold tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shrink-0">
                        GET
                      </span>
                      <code className="font-mono text-sm font-medium text-black dark:text-white">
                        /latest
                      </code>
                    </div>
                    <CodeBlock code={`curl -s ${SITE_URL}/latest   # short alias for the feed`} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5 mb-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded font-mono text-[11px] font-bold tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shrink-0">
                        GET
                      </span>
                      <code className="font-mono text-sm font-medium text-black dark:text-white">
                        /api/v1/cli
                      </code>
                    </div>
                    <CodeBlock code={`curl -s ${SITE_URL}/api/v1/cli   # flagships + checkpoints table`} />
                  </div>
                </div>
              </TextWithBlur>
            </div>

            <div id="feeds" className="scroll-mt-24 mb-12">
              <TextWithBlur>
                <h2 className="text-xl font-display font-medium tracking-tight text-black dark:text-white mb-3">
                  Feeds
                </h2>
                <div className="divide-y divide-black/5 dark:divide-white/[0.06] rounded-md border border-black/10 dark:border-white/[0.08]">
                  {[
                    { href: "/rss.xml", cmd: "GET /rss.xml", desc: "RSS 2.0 — one item per model, newest first." },
                    { href: "/llms.txt", cmd: "GET /llms.txt", desc: "Per-lab ground truth for answer engines and crawlers." },
                    { href: "/llms-full.txt", cmd: "GET /llms-full.txt", desc: "Exhaustive dump — every field of every model, including variants." },
                  ].map((f) => (
                    <Link
                      key={f.href}
                      href={f.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between gap-3 px-4 py-3 hover:bg-black/[0.025] dark:hover:bg-white/[0.025] transition-colors"
                    >
                      <code className="font-mono text-xs text-black/80 dark:text-zinc-200">{f.cmd}</code>
                      <span className="flex items-center gap-2 text-xs text-black/45 dark:text-zinc-400 min-w-0">
                        <span className="truncate hidden sm:inline">{f.desc}</span>
                        <ArrowUpRight size={12} className="shrink-0 group-hover:text-[#ff5d2e] transition-colors" />
                      </span>
                    </Link>
                  ))}
                </div>
              </TextWithBlur>
            </div>

            <div id="badges" className="scroll-mt-24 mb-12">
              <TextWithBlur>
                <h2 className="text-xl font-display font-medium tracking-tight text-black dark:text-white mb-3">
                  Badges & health
                </h2>
                <p className="text-sm font-normal text-black/60 dark:text-zinc-400 leading-relaxed mb-4 max-w-2xl">
                  Live SVG shields for lab flagships and per-model specs, plus a heartbeat
                  endpoint with edge-cache status and live dataset counts.
                </p>
                <CodeBlock
                  code={`[![OpenAI](${SITE_URL}/api/badge/openai)](${SITE_URL})
${SITE_URL}/api/badge/[company]
${SITE_URL}/api/badge?model=<id>&type=spec|context|pricing|status
${SITE_URL}/api/check-updates`}
                />
              </TextWithBlur>
            </div>

            <div id="versioning" className="scroll-mt-24 mb-12">
              <TextWithBlur>
                <h2 className="text-xl font-display font-medium tracking-tight text-black dark:text-white mb-3">
                  Versioning
                </h2>
                <p className="text-sm font-normal text-black/60 dark:text-zinc-400 leading-relaxed mb-4 max-w-2xl">
                  The <code className="font-mono text-xs">/v1/</code> prefix is a stability
                  contract: breaking renames or removals ship under a new version, never
                  silently. Additive changes — new fields, new labs, new models — land in v1
                  without notice. Recent additive changes: per-laboratory profile pages and{" "}
                  <code className="font-mono text-xs">companies[].page</code> (September 2026),
                  per-second pricing units for video models, and named sub-variants.
                </p>
                <Note>
                  Model <code className="font-mono text-xs">id</code> values are append-only.
                  Entries are never deleted or recycled — retired slugs resolve to the lab's
                  flagship through the fallback documented in the Errors section.
                </Note>
              </TextWithBlur>
            </div>

            <div id="labs" className="scroll-mt-24 mb-12">
              <TextWithBlur>
                <h2 className="text-xl font-display font-medium tracking-tight text-black dark:text-white mb-3">
                  Laboratories
                </h2>
                <p className="text-sm font-normal text-black/60 dark:text-zinc-400 leading-relaxed mb-4 max-w-2xl">
                  Every lab has a profile page with its full release history. Pass its id as{" "}
                  <code className="font-mono text-xs">?company=</code> to filter the API.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {labList.map((lab) => (
                    <Link
                      key={lab.id}
                      href={`/companies/${lab.id}`}
                      className="group flex items-center gap-2 px-3 py-2.5 rounded-md border border-black/10 dark:border-white/[0.08] hover:border-[#ff5d2e]/40 transition-colors"
                    >
                      <span
                        className="w-2 h-2 rounded-sm shrink-0"
                        style={{ backgroundColor: lab.accentColor }}
                      />
                      <span className="text-xs font-sans text-black/70 dark:text-zinc-300 group-hover:text-[#ff5d2e] dark:group-hover:text-[#ff7347] transition-colors truncate">
                        {lab.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </TextWithBlur>
            </div>

            <div id="support" className="scroll-mt-24 mb-4">
              <TextWithBlur>
                <h2 className="text-xl font-display font-medium tracking-tight text-black dark:text-white mb-3">
                  Support
                </h2>
                <p className="text-sm font-normal text-black/60 dark:text-zinc-400 leading-relaxed max-w-2xl">
                  Something wrong with the data or an endpoint? Open an issue on{" "}
                  <a
                    href="https://github.com/TirupMehta/ModelRegistry/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#ff5d2e] dark:text-[#ff7347] hover:underline"
                  >
                    GitHub
                  </a>{" "}
                  — model corrections take 60 seconds via{" "}
                  <code className="font-mono text-xs">data/models.ts</code>, and the full
                  pipeline (site, API, feeds, README) re-syncs automatically.
                </p>
              </TextWithBlur>
            </div>
        </div>

        <footer className="py-6 text-center border-t border-black/10 dark:border-white/[0.08] mt-4">
          <p className="text-[11px] font-sans text-black/50 dark:text-zinc-400">
            FREE · UNAUTHENTICATED · MIT OPEN DATA ·{" "}
            <Link href="/api/v1/models" className="hover:text-[#ff5d2e] transition-colors">
              LIVE ENDPOINT
            </Link>
          </p>
        </footer>
      </section>
    </main>
  )
}
