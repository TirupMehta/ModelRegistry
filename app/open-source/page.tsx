import type { Metadata } from "next"
import Header from "@/components/header"
import { modelsData } from "@/data/models"
import { CORE_KEYWORDS, ORGANIZATION_ID, PERSON_ID } from "@/lib/entities"
import { SITE_URL } from "@/lib/site"
import { safeJsonLd } from "@/lib/utils"
import { REPO_URL, fetchRepoSnapshot, type RepoSnapshot } from "@/lib/github"

export const metadata: Metadata = {
  title: "Open source - how ModelRegistry is built and how to contribute",
  description:
    "ModelRegistry is MIT licensed and developed in public: the dataset records, site source, CLI, and agent skills live in one repository. Latest pushes, community contributors, merged pull requests, and every way to contribute.",
  keywords: CORE_KEYWORDS,
  authors: [{ name: "Tirup Mehta", url: "https://tirup.in" }],
  alternates: { canonical: `${SITE_URL}/open-source` },
  openGraph: {
    title: "Open source - ModelRegistry",
    description:
      "The open frontier AI model registry is built in public: latest pushes, community contributors, and how to contribute a model or a fix.",
    url: `${SITE_URL}/open-source`,
    siteName: "ModelRegistry",
    type: "website",
  },
}

// Re-render on the same cadence as the live data cache below.
export const revalidate = 900

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg sm:text-xl font-display font-semibold tracking-tight text-black dark:text-white mt-8 mb-3">
      {children}
    </h2>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="max-w-[68ch] text-sm sm:text-[15px] text-black/70 dark:text-zinc-300 leading-6 sm:leading-7 mb-3">
      {children}
    </p>
  )
}

function A({ href, children }: { href: string; children: React.ReactNode }) {
  const external = href.startsWith("http")
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="text-accent-ink hover:underline underline-offset-2"
    >
      {children}
    </a>
  )
}

/** Timestamps from GitHub arrive as full ISO instants; keep the date part only. */
function stamp(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

/** Rows shared by the push list and the merged-PR list. */
function listShell(children: React.ReactNode) {
  return (
    <ul className="mb-4 divide-y divide-black/[0.06] dark:divide-white/[0.06] border-b border-black/[0.06] dark:border-white/[0.06] text-sm sm:text-[15px] leading-6 sm:leading-7">
      {children}
    </ul>
  )
}

function PushList({ pushes }: { pushes: RepoSnapshot["pushes"] }) {
  return listShell(
    pushes.map((push) => (
      <li key={push.sha} className="flex items-baseline gap-3 py-2">
        <a
          href={push.url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 font-mono text-xs text-black/50 dark:text-zinc-400 hover:text-accent-ink"
        >
          {push.sha.slice(0, 7)}
        </a>
        <a
          href={push.url}
          target="_blank"
          rel="noopener noreferrer"
          className="min-w-0 flex-1 truncate text-black dark:text-zinc-200 hover:text-accent-ink"
          title={push.message}
        >
          {push.message}
        </a>
        <span className="shrink-0 text-xs text-black/40 dark:text-zinc-500 tabular-nums">
          {push.author} · {stamp(push.date)}
        </span>
      </li>
    ))
  )
}

function MergedPullList({ pulls }: { pulls: NonNullable<RepoSnapshot["mergedPulls"]> }) {
  return listShell(
    pulls.map((pull) => (
      <li key={pull.number} className="flex items-baseline gap-3 py-2">
        <span className="shrink-0 font-mono text-xs text-black/50 dark:text-zinc-400">#{pull.number}</span>
        <a
          href={pull.url}
          target="_blank"
          rel="noopener noreferrer"
          className="min-w-0 flex-1 truncate text-black dark:text-zinc-200 hover:text-accent-ink"
          title={pull.title}
        >
          {pull.title}
        </a>
        <span className="shrink-0 text-xs text-black/40 dark:text-zinc-500 tabular-nums">
          {pull.author} · {stamp(pull.mergedAt)}
        </span>
      </li>
    ))
  )
}

function ContributorList({ contributors }: { contributors: NonNullable<RepoSnapshot["contributors"]> }) {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {contributors.map((contributor) => (
        <a
          key={contributor.login}
          href={contributor.profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-black/10 dark:border-white/[0.08] px-3 py-1 text-xs text-black/70 dark:text-zinc-300 hover:border-accent hover:text-accent-ink"
        >
          {contributor.login}
          <span className="text-black/35 dark:text-zinc-600 tabular-nums">{contributor.contributions}</span>
        </a>
      ))}
    </div>
  )
}

export default async function OpenSourcePage() {
  const snapshot = await fetchRepoSnapshot()
  const { stats, pushes, contributors, mergedPulls } = snapshot
  const liveDataAvailable = stats !== null || pushes.length > 0

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": `${SITE_URL}/open-source`,
    url: `${SITE_URL}/open-source`,
    name: "Open source - ModelRegistry",
    description:
      "How the ModelRegistry registry, dataset, CLI, and agent skills are developed in public under an MIT license, with the latest pushes from the repository.",
    isPartOf: { "@id": `${SITE_URL}/#website` },
    about: { "@id": ORGANIZATION_ID },
    mainEntity: { "@id": PERSON_ID },
    citation: REPO_URL,
    inLanguage: "en",
  }

  return (
    <main className="relative min-h-screen">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <section className="max-w-4xl mx-auto w-full px-4 sm:px-6 md:px-20 pb-20">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-semibold tracking-tight text-black dark:text-white mb-2">
          Built in the open
        </h1>
        <p className="mb-8 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs font-sans text-black/50 dark:text-zinc-500">
          <A href={REPO_URL}>github.com/TirupMehta/ModelRegistry</A>
          <span className="h-3 w-px bg-black/10 dark:bg-white/15" aria-hidden="true" />
          <span>MIT licensed</span>
          <span className="h-3 w-px bg-black/10 dark:bg-white/15" aria-hidden="true" />
          <span className="tabular-nums">
            {stats ? `${stats.stars} stars, ${stats.forks} forks` : "source code"}
          </span>
          <span className="h-3 w-px bg-black/10 dark:bg-white/15" aria-hidden="true" />
          <A href="/about">About</A>
        </p>

        <P>
          Everything ModelRegistry is built from lives in one public repository: the{" "}
          {modelsData.length}
          model records and their per-field source citations, the site you are reading,
          the zero-dependency CLI, the agent skills, and the test suite that keeps every
          surface in sync. There is no public/private split - what the community sees is
          what runs in production, and every change ships with a signed commit and a CI
          run first.
        </P>
        <P>
          The license is <strong className="text-black dark:text-white">MIT</strong>, so the
          dataset records, the API contract shapes, and the code can be reused with
          attribution. What this page adds on top is the activity itself: pushes, merged
          pull requests, and the people behind them, fetched straight from the GitHub API.
        </P>
        <P>
          Transparency note: the four lists below come from the GitHub API, uploaded at
          request time and cached for 15 minutes. When an endpoint is unreachable, the
          affected list is empty rather than padded with stale or invented numbers.
        </P>

        <H2>Latest pushes</H2>
        {pushes.length > 0 ? (
          <>
            <PushList pushes={pushes} />
            <p className="text-xs font-sans text-black/45 dark:text-zinc-500 mb-3">
              The <A href={`${REPO_URL}/commits/main`}>full commit history</A> carries
              every revision the dataset and the site ever shipped.
            </p>
          </>
        ) : (
          <p className="max-w-[68ch] text-sm sm:text-[15px] text-black/70 dark:text-zinc-300 leading-6 sm:leading-7 mb-3">
            The live push feed is unavailable right now. Recent history is on GitHub:{" "}
            <A href={`${REPO_URL}/commits/main`}>commits on main</A>.
          </p>
        )}

        <H2>From the community</H2>
        {liveDataAvailable && (contributors ? (
          <>
            <ContributorList contributors={contributors} />
            {mergedPulls && mergedPulls.length > 0 && <MergedPullList pulls={mergedPulls} />}
          </>
        ) : (
          <p className="max-w-[68ch] text-sm sm:text-[15px] text-black/70 dark:text-zinc-300 leading-6 sm:leading-7 mb-3">
            The contributor feed is unavailable right now. Everyone who has contributed so
            far is on the{" "}
            <A href={`${REPO_URL}/graphs/contributors`}>contributor graph</A>, and merged
            pull requests are on the{" "}
            <A href={`${REPO_URL}/pulls?q=is%3Apr+is%3Amerged`}>merged PR list</A>.
          </p>
        ))}

        <H2>How to contribute</H2>
        <P>
          <strong className="text-black dark:text-white">Add a model.</strong> Registry
          records are primary sources or nothing: open a{" "}
          <A href={`${REPO_URL}/issues`}>GitHub issue</A> or{" "}
          <A href="/suggest">use the suggestion form</A>, and cite the lab announcement,
          model card, API pricing page, or weights repository for every fact. The{" "}
          <A href={`${REPO_URL}/blob/main/CONTRIBUTING.md`}>contributing guide</A> has a
          paste-ready schema, and the{" "}
          <A href={`${REPO_URL}/issues/new?template=data-correction.yml`}>data-correction
          template</A> covers fixing an existing record. Nothing publishes directly: every
          generated issue lands in maintainer review first.
        </P>
        <P>
          <strong className="text-black dark:text-white">Fix code, docs, or feeds.</strong>{" "}
          Find something broken in the site, the <A href="/cli">CLI</A>, the API contract,
          or the docs? An issue or a pull request is enough - observe the{" "}
          <A href={`${REPO_URL}/blob/main/CONTRIBUTING.md`}>contributing guide</A> and the{" "}
          <A href="/editorial-policy">editorial policy</A> so wording stays honest where
          copy overlaps data.
        </P>
        <P>
          <strong className="text-black dark:text-white">Security or a private report.</strong>{" "}
          Do not file a public issue. The{" "}
          <A href={`${REPO_URL}/blob/main/SECURITY.md`}>security policy</A> lists the
          in-scope surfaces and the private channel, and the{" "}
          <A href="/contact">contact page</A> maps every other request.
        </P>

        <H2>Why the page exists</H2>
        <P>
          An open registry earns trust the same way its records do: by being checkable.
          This page is the checkable view of the project itself - it does not claim open
          source, it points at the repository, the commits, and the people, and it says
          plainly what happens when the feed behind it cannot be read.
        </P>
      </section>
    </main>
  )
}
