import Link from "next/link"
import { Metadata } from "next"
import Header from "@/components/header"
import TextWithBlur from "@/components/text-with-blur"
import DocsSidebar, { DocsIndexChips } from "@/components/docs-nav"
import { companies } from "@/data/companies"
import { modelsData } from "@/data/models"
import { datasetRevision } from "@/data/revision"
import { safeJsonLd } from "@/lib/utils"
import { API_USE_PROMPT, buildContributePrompt } from "@/lib/agent-prompts"
import PromptBlock from "@/components/prompt-block"
import { ArrowLeft, ArrowUpRight } from "lucide-react"

const SITE_URL = "https://modelregistry.tirup.in"

export const metadata: Metadata = {
  title: "ModelRegistry API Reference - endpoints, parameters, examples",
  description:
    "ModelRegistry API reference: free unauthenticated REST API, OpenAPI 3.1 description, RSS, llms.txt, CLI, badges and health endpoints for the open frontier AI model registry. Authentication, rate limits, error codes, full field reference, and copy-paste examples.",
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
    <div className="rounded-md border border-[#ff5d2e]/25 bg-black/[0.02] dark:bg-white/[0.02] px-5 py-3.5 text-xs sm:text-[13px] font-sans text-black/65 dark:text-zinc-300 leading-relaxed">
      {children}
    </div>
  )
}

export default function DocsPage() {
  const labList = Object.values(companies)
  const sampleFlagship = modelsData.find((m) => m.isCompanyFlagship)
  // Sample mirrors GET /api/v1/models in trimmed form. Every value below
  // derives from the live dataset so the reference cannot rot - see
  // app/api/v1/models/route.ts for the canonical shape.
  const verification = { verified: 0, partially_verified: 0, unverified: 0, retired: 0 }
  for (const m of modelsData) {
    verification[m.verificationStatus] = (verification[m.verificationStatus] || 0) + 1
  }
  const openaiFlagship = modelsData.find((m) => m.companyId === "openai" && m.isCompanyFlagship)
  const openaiCheckpoint = modelsData.find(
    (m) => m.companyId === "openai" && m.isLatestCheckpoint && !m.isCompanyFlagship
  )
  const sampleSourceUrl =
    sampleFlagship?.sources?.[0]?.url ?? sampleFlagship?.links?.announcement ?? ""

  const sampleResponse = `{
  "status": "success",
  "total": ${modelsData.length},
  "updatedAt": "${datasetRevision.revisedAt}",
  "datasetVersion": "${datasetRevision.datasetVersion}",
  "verification": ${JSON.stringify(verification)},
  "metadata": { "registry": "ModelRegistry", "license": "Open Data / MIT" },
  "companies": [{ "id": "openai", "page": "/companies/openai",
    "latestFlagship": "${openaiFlagship?.name ?? ""}", "latestCheckpoint": "${openaiCheckpoint?.name ?? ""}" }],
  "models": [{
    "id": "${sampleFlagship?.id ?? ""}",
    "name": "${sampleFlagship?.name ?? ""}",
    "releaseDate": "${sampleFlagship?.releaseDate ?? ""}",
    "pricing": { "input": ${sampleFlagship?.pricing.input ?? 0}, "output": ${sampleFlagship?.pricing.output ?? 0} },
    "verificationStatus": "${sampleFlagship?.verificationStatus ?? ""}",
    "sources": [{ "url": "${sampleSourceUrl}", "sourceType": "${sampleFlagship?.sources?.[0]?.sourceType ?? "announcement"}" }]
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

      <div className="mx-auto w-full max-w-[78rem] min-[1440px]:grid min-[1440px]:grid-cols-[11rem_minmax(0,56rem)] min-[1440px]:gap-4">
      {/* Reference rail lives in the reserved left lane and sticks while the
          article scrolls. Sticky (not fixed) is what keeps it honest: its
          containing block is the document column, so it stops at the last
          paragraph and scrolls away with the page instead of sliding under the
          footer. Short viewports scroll the rail itself. */}
      <aside className="hidden min-[1440px]:col-start-1 min-[1440px]:row-start-1 min-[1440px]:block sticky top-8 z-30 w-44 max-h-[calc(100vh-4rem)] self-start overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin]">
        <DocsSidebar />
      </aside>

      <section className="section max-w-4xl mx-auto w-full px-4 sm:px-6 md:px-20 pb-20 min-w-0 min-[1440px]:col-start-2 min-[1440px]:mx-0">
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
                ModelRegistry API Reference
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
                  <span className="text-[0.98em] text-black dark:text-white bg-black/[0.04] dark:bg-white/[0.06] px-1.5 py-0.5 rounded">
                    {SITE_URL}
                  </span>
                  . Conventions used throughout this reference:{" "}
                  GET only - the registry is
                  read-only, so there are no write, update, or delete operations.
                  A machine-readable OpenAPI 3.1 description lives at{" "}
                  {/* Static file, not a page route: a plain anchor avoids Next's
                      RSC prefetch, which 404s on public assets. */}
                  <a href="/openapi.json" target="_blank" rel="noopener noreferrer" className="text-[#ff5d2e] dark:text-[#ff7347] hover:underline">
                    /openapi.json
                  </a>
                  ; every operation there has a unique operationId.
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
                high-traffic use. The dataset changes when labs ship - typically a few
                times per week - so aggressive polling gains nothing.
              </Note>
            </TextWithBlur>
          </div>

          <div id="rate-limits" className="scroll-mt-24 mb-12">
            <TextWithBlur>
              <h2 className="text-xl font-display font-medium tracking-tight text-black dark:text-white mb-3">
                Rate limits & caching
              </h2>
              <p className="text-sm font-normal text-black/60 dark:text-zinc-400 leading-relaxed mb-4 max-w-2xl">
                No per-client limit is enforced on reads today. Every API
                response advertises the advisory budget so an agent can
                self-throttle instead of discovering it through a 429:
              </p>
              <div className="rounded-md border border-black/10 dark:border-white/[0.08] bg-white dark:bg-[#0e1014] mb-4">
                <ParamRow name="RateLimit" type="header" desc={'"default";r=600;t=60 - 600 requests per 60-second window.'} />
                <ParamRow name="X-RateLimit-Limit · X-RateLimit-Window" type="header" desc="600 and 60, for clients that only read the X-RateLimit-* family." />
                <ParamRow name="Retry-After" type="header" desc="Seconds to wait, sent with any 429. The waitlist form returns a real 429 with this header when its throttler trips." />
                <ParamRow name="REST · feeds · badges" type="edge cache" desc="public, s-maxage=3600, stale-while-revalidate=86400. Freshness of up to one hour; stale copies served while revalidating." />
                <ParamRow name="/api/check-updates" type="dynamic" desc="Evaluated per request. Its upstream heartbeat is cached for 5 minutes; the counts always reflect the live dataset." />
              </div>
              <Note>
                Practical guidance: poll <code className="font-mono text-xs">/api/check-updates</code> no
                more than once every 5 minutes, and treat a change in{" "}
                <code className="font-mono text-xs">trackedModelsCount</code> as your signal to
                re-fetch <code className="font-mono text-xs">/api/v1/models</code>. For
                incremental sync, poll <code className="font-mono text-xs">/api/v1/changes?since=YYYY-MM-DD</code> and
                fetch only the changed records via{" "}
                <code className="font-mono text-xs">/api/v1/models/{"{id}"}</code>.
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
                return HTTP 200 with an empty collection - parse defensively and key off{" "}
                <code className="font-mono text-xs">status</code> and{" "}
                <code className="font-mono text-xs">total</code>. Real errors are always
                JSON, never an HTML error page, and always carry a machine-readable code:
              </p>
              <CodeBlock
                code={`{
  "status": "error",
  "error": "Model 'xyz' not found.",
  "code": "model_not_found",
  "hint": "List known ids via GET /api/v1/models.",
  "docs": "${SITE_URL}/docs#errors"
}`}
              />
              <div className="mt-4 rounded-md border border-black/10 dark:border-white/[0.08] bg-white dark:bg-[#0e1014]">
                <ParamRow name="200 + empty list" type="filters" desc="?company=unknownlab or a category with no matches. status stays “success”, total is 0." />
                <ParamRow name="bad_request" type="400 · 422" desc="Missing or malformed input. The error field says what to fix." />
                <ParamRow name="invalid_date · invalid_limit" type="400" desc="/api/v1/changes rejects malformed dates and limits with these codes." />
                <ParamRow name="model_not_found · route_not_found" type="404" desc="Unknown record id or unknown API path. 404s list valid endpoints and, where resolvable, a suggested record." />
                <ParamRow name="method_not_allowed" type="405" desc="Anything other than GET or HEAD on /api/v1/*. An Allow header lists the supported methods." />
                <ParamRow name="rate_limited" type="429" desc="Throttled request. Retry-After gives the wait in seconds." />
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
                The primary endpoint. Returns the full registry - every model with its
                specifications - plus a per-laboratory rollup. All parameters are optional
                and combinable.
              </p>
              <div className="rounded-md border border-black/10 dark:border-white/[0.08] bg-white dark:bg-[#0e1014] mb-3">
                <ParamRow name="company" type="string" desc={`Lab id - ${labList.map((l) => l.id).join(", ")}.`} />
                <ParamRow name="category" type="string" desc="flagship · reasoning · open-weights · code · multimodal · audio · image · video" />
                <ParamRow name="openWeights" type="string" desc="“true” for downloadable weights, “false” for proprietary API models." />
                <ParamRow name="flagshipOnly" type="string" desc="“true” returns exactly one primary flagship per laboratory." />
                <ParamRow name="latestOnly" type="string" desc="“true” returns each lab's newest shipped checkpoint(s)." />
              </div>
              <CodeBlock code={sampleResponse} />
            </TextWithBlur>
          </div>

          <div id="get-model" className="scroll-mt-24 mb-12">
            <TextWithBlur>
              <div className="flex flex-wrap items-center gap-2.5 mb-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded font-mono text-[11px] font-bold tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shrink-0">
                  GET
                </span>
                <code className="font-mono text-sm sm:text-[15px] font-medium text-black dark:text-white break-all">
                  /api/v1/models/{"{id}"}
                </code>
              </div>
              <p className="text-sm font-normal text-black/60 dark:text-zinc-400 leading-relaxed mb-4 max-w-2xl">
                Poll one model without pulling the full registry. IDs are stable
                kebab-case and matched case-insensitively. Unknown ids return a JSON
                404 with a flagship suggestion when the slug unambiguously belongs to
                one lab. Supports{" "}
                <code className="font-mono text-xs">If-None-Match</code> / 304 like the
                list endpoint.
              </p>
              <CodeBlock
                code={`curl -s ${SITE_URL}/api/v1/models/gpt-6-astra | head -c 300
# 404 shape: {"status":"error","error":"Model 'xyz' not found.","suggestion":"...","suggestionPage":"/models/..."}`}
              />
              <div className="mt-5 border-t border-black/10 pt-4 dark:border-white/[0.08]">
                <div className="mb-2 flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex shrink-0 rounded border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] font-bold tracking-wider text-emerald-600 dark:text-emerald-400">GET</span>
                  <code className="break-all font-mono text-sm font-medium text-black dark:text-white">/api/v1/models/{"{id}"}/providers</code>
                </div>
                <p className="text-sm leading-relaxed text-black/60 dark:text-zinc-400">Returns current OpenRouter endpoint listings, provider-specific prices, and limits where an exact model mapping exists. This provider snapshot does not update or verify the lab-sourced facts in the registry. An unmapped record may still be available through other providers.</p>
                <CodeBlock code={`curl -s ${SITE_URL}/api/v1/models/gpt-6-astra/providers`} />
              </div>
            </TextWithBlur>
          </div>

          <div id="get-changes" className="scroll-mt-24 mb-12">
            <TextWithBlur>
              <div className="flex flex-wrap items-center gap-2.5 mb-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded font-mono text-[11px] font-bold tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shrink-0">
                  GET
                </span>
                <code className="font-mono text-sm sm:text-[15px] font-medium text-black dark:text-white break-all">
                  /api/v1/changes
                </code>
              </div>
              <p className="text-sm font-normal text-black/60 dark:text-zinc-400 leading-relaxed mb-4 max-w-2xl">
                Incremental sync over per-model changelog history - same source as{" "}
                <Link href="/changelog" className="text-[#ff5d2e] dark:text-[#ff7347] hover:underline">
                  /changelog
                </Link>
                , newest first. Poll with{" "}
                <code className="font-mono text-xs">?since=YYYY-MM-DD</code> (inclusive),
                then fetch each changed record via{" "}
                <code className="font-mono text-xs">/api/v1/models/{"{id}"}</code>.
                Unknown model/company filters return 200 with an empty list; malformed
                dates return 400.
              </p>
              <div className="rounded-md border border-black/10 dark:border-white/[0.08] bg-white dark:bg-[#0e1014] mb-3">
                <ParamRow name="since" type="date" desc="Inclusive lower bound, YYYY-MM-DD - e.g. 2026-10-01." />
                <ParamRow name="until" type="date" desc="Inclusive upper bound, YYYY-MM-DD." />
                <ParamRow name="model" type="string" desc="Filter to one record id (case-insensitive)." />
                <ParamRow name="company" type="string" desc="Filter to one laboratory id (e.g. openai)." />
                <ParamRow name="limit" type="integer" desc="Max entries returned. Defaults to 100, capped at 500. total is the full match count." />
              </div>
              <CodeBlock
                code={`curl -s "${SITE_URL}/api/v1/changes?since=2026-10-01" | head -c 300`}
              />
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
                <FieldRow name="isCompanyFlagship" type="boolean" desc="Exactly one true per lab - its primary general-purpose model." />
                <FieldRow name="isLatestCheckpoint" type="boolean" desc="True for the lab's newest shipped release. May coincide with the flagship." />
                <FieldRow name="category · categoryLabel" type="string" desc="Machine bucket (image, video, flagship…) plus the human display label." />
                <FieldRow name="contextWindow(Tokens)" type="string · number" desc="Human string plus sortable token count. Visual models use descriptive windows with a 0 count so they never outrank token models." />
                <FieldRow name="parameters" type="string" desc="Architecture description. “Undisclosed (…)” where the lab has published nothing - never fabricated." />
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
                Each recipe below does one job - pick your language, copy, run.
              </p>
              <div className="grid grid-cols-1 gap-5">
                <div>
                  <p className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.18em] text-[#ff5d2e] dark:text-[#ff7347] mb-2">
                    01 · One flagship per lab - cURL
                  </p>
                  <CodeBlock
                    code={`curl -s "${SITE_URL}/api/v1/models?flagshipOnly=true" | head -c 400`}
                  />
                </div>
                <div>
                  <p className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.18em] text-[#ff5d2e] dark:text-[#ff7347] mb-2">
                    02 · Newest video checkpoints - Python
                  </p>
                  <CodeBlock
                    code={`import requests
res = requests.get("${SITE_URL}/api/v1/models",
    params={"category": "video", "latestOnly": "true"}).json()
for m in res["models"]:
    print(m["name"], "-", m["releaseDate"])`}
                  />
                </div>
                <div>
                  <p className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.18em] text-[#ff5d2e] dark:text-[#ff7347] mb-2">
                    03 · Filter by lab in the browser - JavaScript
                  </p>
                  <CodeBlock
                    code={`// No proxy needed - the API sends Access-Control-Allow-Origin: *
const { total, models } = await (
  await fetch("${SITE_URL}/api/v1/models?company=deepseek")
).json();`}
                  />
                </div>
              </div>
            </TextWithBlur>
          </div>

            <div id="agent-prompts" className="scroll-mt-24 mb-12">
              <TextWithBlur>
                <h2 className="text-xl font-display font-medium tracking-tight text-black dark:text-white mb-2">
                  Agent prompts
                </h2>
                <p className="text-sm font-normal text-black/60 dark:text-zinc-400 leading-relaxed mb-4 max-w-2xl">
                  Copy-paste prompts that teach any AI agent to contribute models or query
                  this registry. Same source as the header button and README - always current.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-5 text-xs font-sans">
                  {[
                    { n: "01", t: "Copy the prompt" },
                    { n: "02", t: "Paste to your agent" },
                    { n: "03", t: "Run pnpm test & open a PR" },
                  ].map((s) => (
                    <div
                      key={s.n}
                      className="flex items-center gap-2.5 rounded-md border border-black/10 dark:border-white/[0.08] bg-black/[0.015] dark:bg-white/[0.02] px-3 py-2.5"
                    >
                      <span className="font-mono text-[11px] text-[#ff5d2e] dark:text-[#ff7347] shrink-0">
                        {s.n}
                      </span>
                      <span className="text-black/70 dark:text-zinc-300">{s.t}</span>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 gap-5">
                  <PromptBlock title="Contribute a model - full workflow" text={buildContributePrompt()} />
                  <PromptBlock title="Query the API - agent briefing" text={API_USE_PROMPT} previewLines={4} />
                </div>
              </TextWithBlur>
            </div>

            <div id="agent-access" className="scroll-mt-24 mb-12">
              <TextWithBlur>
                <h2 className="text-xl font-display font-medium tracking-tight text-black dark:text-white mb-2">
                  Agent access
                </h2>
                <p className="text-sm font-normal text-black/60 dark:text-zinc-400 leading-relaxed mb-4 max-w-2xl">
                  The same site serves agents without a separate API. Ask for Markdown
                  with content negotiation, discover it through{" "}
                  <a href="/llms.txt" className="text-[#ff5d2e] dark:text-[#ff7347] hover:underline">
                    llms.txt
                  </a>
                  , and read the machine description from{" "}
                  <a href="/openapi.json" className="text-[#ff5d2e] dark:text-[#ff7347] hover:underline">
                    OpenAPI 3.1
                  </a>
                  .
                </p>
                <div className="rounded-md border border-black/10 dark:border-white/[0.08] bg-white dark:bg-[#0e1014] mb-3">
                  <ParamRow name="Accept: text/markdown" type="header" desc="Any HTML page, including /, returns Markdown with Content-Type: text/markdown and Vary: Accept. HTML is unchanged for text/html." />
                  <ParamRow name="GET /api/markdown?path=/…" type="endpoint" desc="Direct Markdown view without relying on negotiation. Unknown paths return a Markdown 404 with a recovery block." />
                  <ParamRow name="GET /llms.txt · /llms-full.txt" type="text" desc="Compact site guide, then the exhaustive field matrix." />
                  <ParamRow name="GET /.well-known/agent-skills/index.json" type="JSON" desc="Agent Skills discovery index with a digest computed from the served SKILL.md." />
                  <ParamRow name="GET /sitemap.xml" type="XML" desc="Every indexable HTML URL, with content-based lastModified dates." />
                </div>
                <CodeBlock
                  code={`# Markdown version of the homepage
curl -sS -H 'Accept: text/markdown' ${SITE_URL}/ 

# Markdown 404: same status, parseable body
curl -sS -i -H 'Accept: text/markdown' ${SITE_URL}/no-such-page

# Machine description with operationIds and error schemas
curl -s ${SITE_URL}/openapi.json | head -c 400`}
                />
              </TextWithBlur>
            </div>

            <div id="cli" className="scroll-mt-24 mb-12">
            <TextWithBlur>
              <h2 className="text-xl font-display font-medium tracking-tight text-black dark:text-white mb-2">
                CLI & plain text
              </h2>
              <p className="text-sm font-normal text-black/60 dark:text-zinc-400 leading-relaxed mb-4 max-w-2xl">
                Three terminal-native routes need no install at all - the root URL sniffs curl and
                answers in plain text. For filters, tables, and `--json` output there is also an
                official CLI (<code className="font-mono text-xs">cli/</code> in the repository:
                zero dependencies, Node 18+). See the{" "}
                <Link href="/cli" className="text-[#ff5d2e] dark:text-[#ff7347] hover:underline">
                  CLI page
                </Link>{" "}
                for install and commands.
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
                <div>
                  <div className="flex flex-wrap items-center gap-2.5 mb-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded font-mono text-[11px] font-bold tracking-wider bg-black/[0.06] dark:bg-white/[0.08] text-black/70 dark:text-zinc-300 border border-black/15 dark:border-white/15 shrink-0">
                      CLI
                    </span>
                    <code className="font-mono text-sm font-medium text-black dark:text-white">
                      modelregistry
                    </code>
                  </div>
                  <CodeBlock
                    code={`git clone https://github.com/TirupMehta/ModelRegistry.git
node ModelRegistry/cli/index.mjs models --flagship-only
node ModelRegistry/cli/index.mjs model <id> --json
node ModelRegistry/cli/index.mjs changes --since 2026-11-01
node ModelRegistry/cli/index.mjs markdown /docs`}
                  />
                  <p className="text-xs text-black/50 dark:text-zinc-500 mt-2 leading-relaxed">
                    Zero-dependency Node 18+ script, published package prepared at{" "}
                    <code className="font-mono text-[11px]">cli/</code> (not yet on npm). Every
                    command supports <code className="font-mono text-[11px]">--json</code> and{" "}
                    <code className="font-mono text-[11px]">--base-url</code>.
                  </p>
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
                  { href: "/rss.xml", cmd: "GET /rss.xml", desc: "RSS 2.0 - one item per model, newest first." },
                  { href: "/llms.txt", cmd: "GET /llms.txt", desc: "Per-lab ground truth for answer engines and crawlers." },
                  { href: "/llms-full.txt", cmd: "GET /llms-full.txt", desc: "Exhaustive dump - every field of every model, including variants." },
                ].map((f) => (
                  <a
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
                  </a>
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
                silently. Additive changes - new fields, new labs, new models - land in v1
                without notice. Recent additive changes: per-record provenance (
                <code className="font-mono text-xs">sources</code>,{" "}
                <code className="font-mono text-xs">fieldSources</code>,{" "}
                <code className="font-mono text-xs">verificationStatus</code>,{" "}
                <code className="font-mono text-xs">changeLog</code>), dataset
                versioning, ETag support, and per-second pricing units for audio models.
              </p>
              <Note>
                Model <code className="font-mono text-xs">id</code> values are append-only.
                Entries are never deleted or recycled - retired slugs resolve to the lab&apos;s
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

          <div id="citing" className="scroll-mt-24 mb-12">
            <TextWithBlur>
              <h2 className="text-xl font-display font-medium tracking-tight text-black dark:text-white mb-3">
                Citing this registry
              </h2>
              <p className="text-sm font-normal text-black/60 dark:text-zinc-400 leading-relaxed mb-4 max-w-2xl">
                Cite the canonical record URL plus the dataset version you used, e.g.{" "}
                <code className="font-mono text-xs">https://modelregistry.tirup.in/models/mistral-large-4 (dataset {datasetRevision.datasetVersion})</code>.
                Record IDs are stable; field values can be corrected, with history on{" "}
                <Link href="/changelog" className="text-[#ff5d2e] dark:text-[#ff7347] hover:underline">
                  /changelog
                </Link>
                . Versioned full-dataset downloads:{" "}
                <code className="font-mono text-xs">/api/v1/snapshot</code>. Benchmark figures
                are lab-reported - cite the linked primary source for the number itself.
              </p>
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
                - model corrections take 60 seconds via{" "}
                <code className="font-mono text-xs">data/models.ts</code>, and the full
                pipeline (site, API, feeds, README) re-syncs automatically.
              </p>
            </TextWithBlur>
          </div>
        </div>

      </section>
      </div>
    </main>
  )
}
