import type { Metadata } from "next"
import Link from "next/link"
import Header from "@/components/header"
import { ORGANIZATION_ID, PERSON_ID } from "@/lib/entities"
import { SITE_URL } from "@/lib/site"
import { safeJsonLd } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Contact ModelRegistry - data corrections, security, and enquiries",
  description:
    "How to reach ModelRegistry: report a data correction, an endpoint problem, or a security issue, and which channels exist for everything else. No phone line, no sales team, no guaranteed service level.",
  alternates: { canonical: `${SITE_URL}/contact` },
  openGraph: {
    title: "Contact ModelRegistry",
    description:
      "Data corrections, endpoint problems, security reports, and general enquiries for the open frontier AI model registry.",
    url: `${SITE_URL}/contact`,
    siteName: "ModelRegistry",
    type: "website",
  },
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-heading font-display font-semibold tracking-tight text-fg-strong mt-8 mb-3">
      {children}
    </h2>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="max-w-[68ch] text-body text-fg leading-6 sm:leading-7 mb-3">
      {children}
    </p>
  )
}

function A({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-accent-ink hover:underline underline-offset-2">
      {children}
    </Link>
  )
}

export default function ContactPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "@id": `${SITE_URL}/contact`,
    url: `${SITE_URL}/contact`,
    name: "Contact ModelRegistry",
    description:
      "How to report a data correction, an endpoint problem, or a security issue in the ModelRegistry dataset and API.",
    isPartOf: { "@id": `${SITE_URL}/#website` },
    about: { "@id": ORGANIZATION_ID },
    mainEntity: { "@id": PERSON_ID },
    inLanguage: "en",
  }

  return (
    <main className="relative min-h-screen">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <section className="page">
        <h1 className="text-page font-display font-semibold tracking-tight text-fg-strong mb-2">
          Contact ModelRegistry
        </h1>
        <p className="mb-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-small font-sans text-fg-muted">
          <span>Pick the channel for the job you have.</span>
          <span className="h-3 w-px bg-black/10 dark:bg-white/15" aria-hidden="true" />
          <A href="/about">About</A>
          <span className="h-3 w-px bg-black/10 dark:bg-white/15" aria-hidden="true" />
          <A href="/privacy">Privacy</A>
        </p>

        <P>
          ModelRegistry is maintained by one person, so support is deliberately
          narrow: there is no phone line, no sales team, and no guaranteed
          response time. The channels below are the ones that actually reach the
          maintainer, and each one is right for a different kind of request.
        </P>

        <H2>Data corrections and missing models</H2>
        <P>
          Open an issue in the{" "}
          <A href="https://github.com/TirupMehta/ModelRegistry/issues">GitHub issue tracker</A>, or use the{" "}
          <A href="/suggest">suggestion form</A>. Both prepare a public issue;
          neither publishes a record on its own. Include the model name, the
          field you believe is wrong, the value you expected, and a primary
          source that can be opened (laboratory announcement, model card,
          pricing page, or weights repository). Reports without a source are
          read but cannot be acted on.
        </P>
        <P>
          Corrections are applied with a dated changelog entry on the affected
          record, so the change stays visible instead of silently overwriting
          the old value. The correction rules are in the{" "}
          <A href="/editorial-policy">editorial policy</A>.
        </P>

        <H2>API, endpoint, and feed problems</H2>
        <P>
          If an endpoint returns the wrong shape, a stale ETag, or an unexpected
          status, open an issue and include the exact request URL, the response
          status, the response body, and the time you made the request. The{" "}
          <A href="/docs">API reference</A> documents the current contract, and
          the <A href="/api/check-updates">health endpoint</A> reports dataset
          counts and the revision date.
        </P>

        <H2>Security reports</H2>
        <P>
          Do not file a public issue for a vulnerability. Follow the{" "}
          <A href="https://github.com/TirupMehta/ModelRegistry/blob/main/SECURITY.md">security policy</A>,
          which lists the in-scope surfaces and how to report privately. The
          site handles no payments, credentials, or private user data, but
          injection through model fields, open redirects, and supply-chain
          issues are all in scope.
        </P>

        <H2>Everything else</H2>
        <P>
          For collaboration, press, attribution questions, or a citation
          clarification, use LinkedIn (
          <A href="https://www.linkedin.com/in/TirupMehta">linkedin.com/in/TirupMehta</A>)
          or GitHub (<A href="https://github.com/TirupMehta">github.com/TirupMehta</A>).
          The maintainer&apos;s portfolio is{" "}
          <A href="https://tirup.in">tirup.in</A>.
        </P>
        <P>
          Privacy and data-deletion requests are described on the{" "}
          <A href="/privacy">privacy page</A>. There is no published mailbox or
          phone number: a channel that could not be monitored reliably would be
          worse than no channel at all.
        </P>

        <H2>Response expectations</H2>
        <P>
          Typical turnaround is a few days. Dataset corrections with a clear
          primary source are usually fastest. Feature requests are considered
          against the public roadmap in the repository, and nothing on this site
          is a paid placement.
        </P>
      </section>
    </main>
  )
}
