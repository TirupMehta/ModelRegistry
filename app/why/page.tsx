import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Check, Minus } from "lucide-react"
import Header from "@/components/header"
import ConnectKit, { type ConnectTab } from "@/components/connect-kit"
import { modelsData } from "@/data/models"
import { datasetRevision } from "@/data/revision"
import { CORE_KEYWORDS, WEBSITE_ID } from "@/lib/entities"
import { SITE_URL } from "@/lib/site"
import { safeJsonLd } from "@/lib/utils"
import { withShare } from "@/lib/share"

const TITLE = "Why this registry exists: one call instead of fifteen tabs"
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

const linkClass = "text-accent-ink hover:underline underline-offset-2"

// Feeds, specs and API routes are plain documents: a Next <Link> would
// prefetch them on every view, so they use a regular anchor.
function A({ href, children }: { href: string; children: React.ReactNode }) {
  const plain = /^https?:/.test(href) || /^\/(api|llms|openapi|rss|feed)/.test(href)
  return plain ? (
    <a href={href} className={linkClass}>{children}</a>
  ) : (
    <Link href={href} className={linkClass}>{children}</Link>
  )
}

const MCP_URL = `${SITE_URL}/api/mcp`

const AGENT_PROMPT = `Add the ModelRegistry MCP server so you can look up AI model specifications yourself, then check it works.

Server
- Name: modelregistry
- URL: ${MCP_URL}
- Transport: streamable HTTP. No API key, no headers, no sign-in.

Steps
1. Work out which client you are running in (Claude Code, Cursor, Claude Desktop, Windsurf, Codex, VS Code, or another).
2. Register the server the way that client expects.
   - Claude Code: run \`claude mcp add --transport http modelregistry ${MCP_URL}\`
   - Clients with a JSON MCP config: merge this into the existing file and keep every server already there:
     { "mcpServers": { "modelregistry": { "url": "${MCP_URL}" } } }
   - Any other client: use its own documented way to add a remote HTTP MCP server at that URL.
3. Ask me before editing a config file outside this project, and tell me if the client needs a restart or reload.
4. Verify: call the get_health tool and tell me the datasetVersion it returns. If the new tools are not available in this session yet, say so, then fetch ${SITE_URL}/llms.txt with the header "Accept: text/markdown" as a fallback.

How to use it afterwards
- Use get_model(id) for one model, list_models(company=...) to find an id, list_labs() for laboratories, and get_changes(since) for what changed.
- Cite the model page URL and the datasetVersion with every figure.
- A figure written as "Undisclosed" is undisclosed. Never fill it in from memory.
- A last-verified date is when a source was reviewed, not proof a model is live today.`

const CONNECT_TABS: ConnectTab[] = [
  {
    id: "ai",
    label: "Ask your AI",
    hint: "Paste into any AI assistant. It installs and tests the server itself.",
    text: AGENT_PROMPT,
  },
  {
    id: "claude-code",
    label: "Claude Code",
    hint: "One command, then ask a question about any model.",
    text: `claude mcp add --transport http modelregistry ${MCP_URL}`,
  },
  {
    id: "json",
    label: "Cursor, Desktop, Windsurf",
    hint: "Merge into mcp.json or your client's MCP config, keeping existing servers.",
    text: `{
  "mcpServers": {
    "modelregistry": {
      "url": "${MCP_URL}"
    }
  }
}`,
  },
  {
    id: "http",
    label: "No MCP? Use HTTP",
    hint: "Plain Markdown and JSON work from any script or agent.",
    text: `# the short map of the site, as Markdown
curl -H "Accept: text/markdown" ${SITE_URL}/llms.txt

# any page as Markdown
curl -H "Accept: text/markdown" ${SITE_URL}/models/<model-id>

# JSON API (contract at ${SITE_URL}/openapi.json)
curl ${SITE_URL}/api/v1/models`,
  },
]

const WAYS = [
  {
    n: "01",
    label: "MCP server",
    href: "/api/mcp",
    text: "Zero-auth. List and fetch models, list labs, read changes since a date, read any page. Add the URL to your client and you are done.",
  },
  {
    n: "02",
    label: "Markdown",
    href: "/docs",
    text: "Send Accept: text/markdown to any page and get clean Markdown instead of HTML. Fewer tokens, less parsing.",
  },
  {
    n: "03",
    label: "llms.txt",
    href: "/llms.txt",
    text: "The short map of the site, with llms-full.txt carrying the full matrix.",
  },
  {
    n: "04",
    label: "OpenAPI",
    href: "/openapi.json",
    text: "The JSON API contract, so a client is generated rather than guessed.",
  },
  {
    n: "05",
    label: "Dated changelogs",
    href: "/changelog",
    text: "Every change is dated, with RSS and JSON Feed. Ask what moved since last Tuesday and fetch only those records.",
  },
]

const FOR_PEOPLE = [
  "One page per model, every figure linked to its source.",
  "Two models side by side, same test only.",
  "Public and private tests labelled before you trust a ranking.",
  "No fifteen-tab ritual, and no cookie banners to dismiss.",
]

const WILL_NOT = [
  "Call a model universally best from incomparable results.",
  "Treat a check date as proof a model is live today.",
  "Guess a figure a lab does not state. It says Undisclosed.",
  "Take payment, sponsorship or editorial input.",
]

const h2 = "text-heading font-display font-semibold tracking-tight text-fg-strong mb-1"
const lede = "text-body font-sans text-fg-muted mb-4 max-w-2xl"

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
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2.5 mb-7 text-small font-sans leading-relaxed text-fg-muted"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-1 hover:text-accent-ink transition-colors duration-150"
          >
            <ArrowLeft size={13} />
            <span>Ledger</span>
          </Link>
          <span>/</span>
          <span className="font-medium text-accent-ink">Why</span>
        </nav>

        <h1 className="text-page font-display font-semibold tracking-tight text-fg-strong mb-3">
          Why ModelRegistry exists
        </h1>
        <p className="mb-6 flex flex-wrap items-center gap-2 text-small font-sans text-fg-muted">
          <span>Dataset revision {datasetRevision.datasetVersion}</span>
          <span className="h-3 w-px bg-black/10 dark:bg-white/15" aria-hidden="true" />
          <span>Revised</span>
          <time dateTime={datasetRevision.revisedAt} className="tabular-nums">
            {datasetRevision.revisedAt}
          </time>
        </p>

        <div className="tile p-5 sm:p-6 mb-4">
          <p className="font-display text-heading font-semibold tracking-tight text-fg-strong leading-snug mb-3">
            A model launches. You open fifteen tabs.
          </p>
          <p className="text-title text-fg-muted leading-7">
            The announcement, the pricing page, the model card, the docs, two leaderboards that
            disagree. Somewhere around tab twelve you forget what you were comparing. ModelRegistry
            reads those pages once and keeps the answer in one place, with the source linked next to
            every figure. For you, and for the agent working on your behalf.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-12">
          {[
            { value: String(models), label: "models tracked" },
            { value: String(labs), label: "laboratories" },
            { value: "0", label: "accounts or keys needed" },
            { value: "1", label: "call instead of 15 tabs" },
          ].map((stat) => (
            <div key={stat.label} className="tile p-4">
              <div className="text-heading font-display font-semibold tracking-tight text-fg-strong tabular-nums">
                {stat.value}
              </div>
              <div className="mt-1 text-small font-sans text-fg-muted leading-snug">{stat.label}</div>
            </div>
          ))}
        </div>

        <h2 className={h2}>Five ways in, all open</h2>
        <p className={lede}>
          Agents should not scrape marketing pages and hope. None of these needs an account.
        </p>
        <div className="rule-t mb-12">
          {WAYS.map((row) => (
            <div key={row.n} className="flex flex-col sm:flex-row gap-1 sm:gap-6 py-4 rule-b">
              <span className="text-small font-sans tabular-nums text-fg-muted pt-1 sm:w-6 shrink-0">
                {row.n}
              </span>
              <span className="text-body font-sans font-medium text-fg-strong sm:w-36 shrink-0">
                {row.href ? <A href={row.href}>{row.label}</A> : row.label}
              </span>
              <span className="text-body font-sans text-fg-muted leading-6">{row.text}</span>
            </div>
          ))}
        </div>

        <h2 className={h2}>Connect in ten seconds</h2>
        <p className={lede}>
          Fastest: paste the first tab into your AI assistant and let it install the server, check
          it works and report back. Or pick your client and copy one command. No key, no sign-up.
        </p>
        <div className="mb-12">
          <ConnectKit tabs={CONNECT_TABS} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-12">
          <div className="tile p-4">
            <h2 className="text-body font-sans font-semibold text-fg-strong mb-3">For people</h2>
            <ul className="space-y-2">
              {FOR_PEOPLE.map((item) => (
                <li key={item} className="flex gap-2 text-body font-sans text-fg-muted leading-6">
                  <Check size={13} className="shrink-0 mt-1 text-accent-ink" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="tile p-4">
            <h2 className="text-body font-sans font-semibold text-fg-strong mb-3">What it will not do</h2>
            <ul className="space-y-2">
              {WILL_NOT.map((item) => (
                <li key={item} className="flex gap-2 text-body font-sans text-fg-muted leading-6">
                  <Minus size={13} className="shrink-0 mt-1 text-fg-muted" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="text-body font-sans text-fg-muted max-w-2xl">
          Next: the <A href="/docs">API docs</A>, the <A href="/methodology">methodology</A>, the{" "}
          <A href="/trust">sourcing standard</A> or <A href="/about">who maintains it</A>.
          Corrections go through the <A href="/suggest">suggestion form</A>.
        </p>
      </section>
    </main>
  )
}
