import type { Metadata } from "next"
import Link from "next/link"
import Header from "@/components/header"
import { modelsData } from "@/data/models"
import { datasetRevision } from "@/data/revision"
import { CORE_KEYWORDS, WEBSITE_ID } from "@/lib/entities"
import { SITE_URL } from "@/lib/site"
import { safeJsonLd } from "@/lib/utils"
import { withShare } from "@/lib/share"

const TITLE = "Why use ModelRegistry - one call instead of fifteen tabs"
const DESCRIPTION =
  "A new AI model launches and you open fifteen tabs. ModelRegistry answers from one source-linked place, for people and for AI agents: a zero-auth MCP server, Markdown on request, llms.txt, OpenAPI and dated changelogs."

export const metadata: Metadata = withShare({
  title: TITLE,
  description: DESCRIPTION,
  keywords: CORE_KEYWORDS,
  alternates: { canonical: `${SITE_URL}/why` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/why`,
    siteName: "ModelRegistry",
    type: "website",
    images: [{ url: "/api/og?theme=light", width: 1200, height: 630, alt: "Why use ModelRegistry" }],
  },
}, { page: "/why" }, "/why")

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-heading font-display font-semibold tracking-tight text-fg-strong mt-8 mb-3">
      {children}
    </h2>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="max-w-[68ch] text-body text-fg leading-6 sm:leading-7 mb-3">{children}</p>
}

function A({ href, children }: { href: string; children: React.ReactNode }) {
  const external = /^https?:/.test(href)
  // Feeds, specs and API routes are plain documents: a Next <Link> would
  // prefetch them on every view, so they use a regular anchor.
  const plain = external || /^\/(api|llms|openapi|rss|feed)/.test(href)
  const cls = "text-accent-ink hover:underline underline-offset-2"
  return plain ? (
    <a href={href} className={cls}>{children}</a>
  ) : (
    <Link href={href} className={cls}>{children}</Link>
  )
}

function Code({ children }: { children: React.ReactNode }) {
  return <code className="font-mono text-small text-fg-strong">{children}</code>
}

export default function WhyPage() {
  const labs = new Set(modelsData.map((m) => m.companyId)).size
  const models = modelsData.length

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${SITE_URL}/why`,
    url: `${SITE_URL}/why`,
    name: "Why use ModelRegistry",
    description: DESCRIPTION,
    isPartOf: { "@id": WEBSITE_ID },
    inLanguage: "en",
  }

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Ledger", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Why", item: `${SITE_URL}/why` },
    ],
  }

  return (
    <main id="content" tabIndex={-1} className="relative min-h-screen focus:outline-none">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumb) }} />
      <section className="page">
        <h1 className="text-page font-display font-semibold tracking-tight text-fg-strong mb-2">
          Why ModelRegistry exists
        </h1>
        <p className="mb-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-small font-sans text-fg-muted">
          <span>
            {models} models, {labs} labs, dataset{" "}
            <span className="font-mono tabular-nums">{datasetRevision.datasetVersion}</span>
          </span>
        </p>

        <P>
          A new model launches. You open the lab&rsquo;s announcement, then its pricing page, then
          its model card, then the docs, then a benchmark leaderboard, then a second leaderboard that
          disagrees with the first. Somewhere around tab twelve you forget what you were comparing.
          This is a known failure mode, and so far no one has patched it.
        </P>
        <P>
          ModelRegistry is the patch. It reads those pages so you do not have to, and keeps the
          answer in one place with the source linked next to every figure.
        </P>

        <H2>For people</H2>
        <P>
          Pick a model and you get its context window, parameters, price, release date, license and
          reported benchmarks on one page, each with a link to where the lab said it. Compare two
          models side by side, and see which tests are public and which are private before trusting
          a ranking. Start at <A href="/">the registry</A>, <A href="/compare">compare</A> or the{" "}
          <A href="/score">ModelRegistry Score</A>.
        </P>

        <H2>For AI agents</H2>
        <P>
          Agents should not scrape marketing pages and hope. The same data is available the way
          machines prefer it, with no account and no key:
        </P>
        <ul className="max-w-[68ch] list-disc pl-5 flex flex-col gap-2 text-body text-fg leading-6 sm:leading-7 mb-3">
          <li>
            <strong>MCP server</strong> at <A href="/api/mcp">/api/mcp</A>. Tools to list and fetch
            models, list labs, read changes since a date, and read any page. Zero auth. Add the URL
            to your client and you are done.
          </li>
          <li>
            <strong>Markdown on request.</strong> Send <Code>Accept: text/markdown</Code> to any
            page and get clean Markdown instead of HTML, which saves tokens and spares the parser.
          </li>
          <li>
            <strong>llms.txt.</strong> <A href="/llms.txt">/llms.txt</A> is the short map and{" "}
            <A href="/llms-full.txt">/llms-full.txt</A> carries the full matrix.
          </li>
          <li>
            <strong>OpenAPI.</strong> <A href="/openapi.json">/openapi.json</A> describes the JSON
            API, so a client can be generated rather than guessed.
          </li>
          <li>
            <strong>Dated changelogs.</strong> The <A href="/changelog">changelog</A> is dated per
            change, with <A href="/rss.xml">RSS</A> and <A href="/feed.json">JSON Feed</A>. Ask what
            changed since last Tuesday and fetch only those records.
          </li>
        </ul>

        <H2>The tab arithmetic</H2>
        <P>
          Fifteen tabs, three minutes each, one launch: that is 45 minutes of reading to learn a
          price. Across {models} models and {labs} labs, it is a part-time job. One MCP call
          returns the same facts in a fraction of a second, and it does not complain about cookie
          banners.
        </P>

        <H2>What it will not do</H2>
        <P>
          ModelRegistry reports what labs publish, with a last-verified date that records when a
          source was reviewed, not whether a model is live today. It does not crown a universal best
          model from results that were not measured the same way. If a figure is not disclosed, it
          says <em>Undisclosed</em> rather than guessing. Boring, yes, but it is the reason you can
          cite it.
        </P>

        <H2>Where to go next</H2>
        <P>
          Read the <A href="/docs">API docs</A>, the <A href="/methodology">methodology</A>, or{" "}
          <A href="/about">who maintains it</A>. Corrections go through the{" "}
          <A href="/suggest">suggestion form</A> and a maintainer reads every one.
        </P>
      </section>
    </main>
  )
}
