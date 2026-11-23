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
        <h1 className="text-page font-display font-semibold tracking-tight text-fg-strong mb-3">
          Fifteen tabs, or one call
        </h1>
        <p className="max-w-[60ch] text-heading font-display tracking-tight text-fg leading-snug mb-5">
          A model launches. You open the announcement, the pricing page, the model card, two
          leaderboards that disagree, and forget what you were comparing. ModelRegistry reads them
          once so you do not have to.
        </p>
        <p className="mb-10 flex flex-wrap items-center gap-2 text-caption text-fg-muted">
          <span className="chip tabular-nums">{models} models</span>
          <span className="chip tabular-nums">{labs} labs</span>
          <span className="chip">No account, no key</span>
          <span className="chip font-mono tabular-nums">{datasetRevision.datasetVersion}</span>
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="tile p-5">
            <p className="text-caption uppercase tracking-wide text-fg-muted mb-3">The usual way</p>
            <ul className="flex flex-col gap-1.5 text-body text-fg">
              {["Launch post", "Pricing page", "Model card", "API docs", "Leaderboard A", "Leaderboard B (disagrees)", "Forum thread", "...and eight more"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full border border-current text-fg-muted" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-small text-fg-muted">About 45 minutes, to learn one price.</p>
          </div>
          <div className="tile p-5">
            <p className="text-caption uppercase tracking-wide text-fg-muted mb-3">With ModelRegistry</p>
            <div className="well p-3 font-mono text-small text-fg-strong overflow-x-auto">
              <span className="text-fg-muted">get_model(</span>&quot;model-id&quot;<span className="text-fg-muted">)</span>
            </div>
            <p className="mt-4 text-body text-fg">
              Context, price, release date, license and reported benchmarks, each with its source
              link. The cookie banners stay home.
            </p>
            <p className="mt-4 text-small text-fg-muted">One request, a fraction of a second.</p>
          </div>
        </div>

        <H2>For people</H2>
        <P>
          One page per model, with a link to where the lab said each figure. Put two models side by
          side and see which tests are public and which are private before you trust a ranking.
          Start from <A href="/">the registry</A>, <A href="/compare">compare</A> or the{" "}
          <A href="/score">ModelRegistry Score</A>.
        </P>

        <H2>For AI agents</H2>
        <P>Agents should not scrape marketing pages and hope. Five doors, all open:</P>
        <ul className="grid gap-3 sm:grid-cols-2 mb-2">
          {[
            ["/api/mcp", "MCP server", "List and fetch models, list labs, read changes since a date, read any page. Zero auth."],
            ["Accept: text/markdown", "Markdown on request", "Send the header to any page and get clean Markdown, not HTML. Fewer tokens, less parsing."],
            ["/llms.txt", "llms.txt", "The short map, with /llms-full.txt carrying the full matrix."],
            ["/openapi.json", "OpenAPI", "The JSON API contract, so a client is generated rather than guessed."],
            ["/changelog", "Dated changelogs", "Every change dated, with RSS and JSON Feed. Fetch only what moved since last Tuesday."],
          ].map(([code, title, body]) => (
            <li key={code} className="tile p-4">
              <p className="text-body font-semibold text-fg-strong">{title}</p>
              <p className="mt-0.5 mb-2 font-mono text-caption text-accent-ink break-all">
                {code.startsWith("/") ? <A href={code}>{code}</A> : code}
              </p>
              <p className="text-small text-fg leading-6">{body}</p>
            </li>
          ))}
        </ul>

        <H2>Connect in ten seconds</H2>
        <P>Add the server to Claude Code, or point any MCP client at the URL:</P>
        <pre className="well max-w-[68ch] p-4 mb-3 overflow-x-auto font-mono text-small text-fg-strong leading-6">
{`claude mcp add --transport http modelregistry ${SITE_URL}/api/mcp

curl -H "Accept: text/markdown" ${SITE_URL}/llms.txt`}
        </pre>

        <H2>What it will not do</H2>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["No fake freshness", "A last-verified date records when a source was reviewed, not whether a model is live today."],
            ["No crowned winners", "Results measured differently are not merged into a universal best."],
            ["No guessing", "A figure a lab does not state is written as Undisclosed. Boring, and the reason you can cite it."],
          ].map(([title, body]) => (
            <div key={title} className="tile p-4">
              <p className="text-body font-semibold text-fg-strong mb-1">{title}</p>
              <p className="text-small text-fg leading-6">{body}</p>
            </div>
          ))}
        </div>

        <div className="rule-t mt-10 pt-6">
          <p className="text-small text-fg-muted">
            Next: the <A href="/docs">API docs</A>, the <A href="/methodology">methodology</A>, or{" "}
            <A href="/about">who maintains it</A>. Corrections go through the{" "}
            <A href="/suggest">suggestion form</A>, and a maintainer reads every one.
          </p>
        </div>
      </section>
    </main>
  )
}
