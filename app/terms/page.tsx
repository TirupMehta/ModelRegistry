import type { Metadata } from "next"
import Link from "next/link"
import Header from "@/components/header"
import { ORGANIZATION_ID } from "@/lib/entities"
import { SITE_URL } from "@/lib/site"
import { safeJsonLd } from "@/lib/utils"
import { withShare } from "@/lib/share"

export const metadata: Metadata = withShare({
  title: "Terms of use",
  description:
    "The rules for using ModelRegistry: the free API and its rate limit, the MIT licence on the code and dataset, acceptable use, third party marks, no warranty, and the law that applies.",
  alternates: { canonical: `${SITE_URL}/terms` },
  openGraph: {
    title: "ModelRegistry terms of use",
    description:
      "Free to read and reuse under the MIT licence. The API is rate limited, figures are published as sourced specifications rather than advice, and the service carries no warranty.",
    url: `${SITE_URL}/terms`,
    siteName: "ModelRegistry",
    type: "website",
  },
}, { page: "/terms" }, "/terms")

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

function Ext({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-accent-ink hover:underline underline-offset-2"
    >
      {children}
    </a>
  )
}

export default function TermsPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${SITE_URL}/terms`,
    url: `${SITE_URL}/terms`,
    name: "ModelRegistry terms of use",
    description:
      "Rules for using the ModelRegistry website, API and dataset: acceptable use, rate limits, licensing, third party marks, warranty and governing law.",
    isPartOf: { "@id": `${SITE_URL}/#website` },
    about: { "@id": ORGANIZATION_ID },
    inLanguage: "en",
    dateModified: "2026-11-27",
  }

  return (
    <main id="content" tabIndex={-1} className="relative min-h-screen focus:outline-none">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <section className="page">
        <h1 className="text-page font-display font-semibold tracking-tight text-fg-strong mb-2">
          Terms of use
        </h1>
        <p className="mb-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-small font-sans text-fg-muted">
          <span>Last updated 2026-11-27</span>
          <span className="h-3 w-px bg-black/10 dark:bg-white/15" aria-hidden="true" />
          <A href="/privacy">Privacy</A>
          <span className="h-3 w-px bg-black/10 dark:bg-white/15" aria-hidden="true" />
          <A href="/contact">Contact</A>
        </p>

        <P>
          These terms cover the ModelRegistry website at modelregistry.tirup.in, its API,
          feeds and downloads. By using the site you accept them. If you do not accept
          them, do not use the site. They are short because the service is simple: no
          accounts, no payments, and no private data beyond what the{" "}
          <A href="/privacy">privacy policy</A> describes.
        </P>

        <H2>What ModelRegistry is</H2>
        <P>
          ModelRegistry is an informational index of specifications that AI laboratories
          publish about their own models: context windows, pricing, release dates,
          licences, modalities, and lab reported benchmark figures. Every record links the
          primary source it came from and the date it was checked.
        </P>
        <P>
          It is not affiliated with, endorsed by, or operated by any AI laboratory. It is
          not a model provider, does not host weights or run inference, and does not give
          engineering, legal, financial, or procurement advice. A figure here is a record
          of what a laboratory published, not an independent measurement, except where a
          page explicitly says an independent evaluator produced it.
        </P>

        <H2>Free to use, within the rate limit</H2>
        <P>
          Reading the site, the API, the RSS and JSON feeds, the CLI, and the Markdown
          views is free and needs no account or key. The API is limited to 600 requests
          per 60 second window per client. Responses advertise the limit in their headers,
          and a 429 response includes how long to wait. Do not work around the limit,
          rotate addresses to avoid it, or run a scraper that behaves like a denial of
          service.
        </P>
        <P>
          Cache responses where you can, send <code className="font-mono text-small">If-None-Match</code>{" "}
          with a previous ETag, and prefer the incremental{" "}
          <A href="/docs">changes endpoint</A> over refetching the whole registry.
        </P>

        <H2>Licence and attribution</H2>
        <P>
          The site code and the dataset records are released under the{" "}
          <Ext href="https://github.com/TirupMehta/ModelRegistry/blob/main/LICENSE">
            MIT License
          </Ext>
          . You may copy, modify, redistribute, and build on them, including commercially,
          provided the copyright notice and permission notice are included. These terms do
          not add restrictions to material that the MIT licence already grants you.
        </P>
        <P>
          If you republish a substantial part of the dataset, keep the source citations and
          the check dates with it, and do not present laboratory reported figures as
          independent results. Attribution to &ldquo;ModelRegistry, maintained by Tirup
          Mehta&rdquo; is appreciated and is the easiest way for a reader to verify a
          number.
        </P>

        <H2>Third party names and content</H2>
        <P>
          Model names, laboratory names, logos, and benchmark names are the trademarks of
          their owners and are used here only to identify the models and tests being
          described. Links to laboratory pages, weight repositories, papers, and pricing
          pages lead to content that those publishers control and license separately. A
          licence string in a record is the publisher&apos;s stated terms, not a legal
          conclusion about what you may do with a model.
        </P>

        <H2>Acceptable use</H2>
        <P>You agree not to:</P>
        <ul className="mb-4 max-w-[68ch] list-disc space-y-2 pl-5 text-body text-fg leading-6 sm:leading-7">
          <li>use the site for anything unlawful, or to infringe another person&apos;s rights;</li>
          <li>attempt to disrupt, overload, probe, or gain unauthorised access to the site or its providers;</li>
          <li>evade the rate limit or automated abuse controls;</li>
          <li>misrepresent the registry as a laboratory, a testing organisation, or an official source;</li>
          <li>claim that a laboratory, evaluator, or the maintainer endorses your product or use; or</li>
          <li>present figures from the registry in a way that hides their source, their date, or the fact that a laboratory reported them.</li>
        </ul>

        <H2>No warranty</H2>
        <P>
          The site and data are provided &ldquo;as is&rdquo; and &ldquo;as
          available&rdquo;, without warranties of any kind, express or implied, including
          merchantability, fitness for a particular purpose, accuracy, and
          non infringement. Laboratories change prices, limits, licences, and model
          behaviour without notice, and a model can be updated behind an unchanged name.
          Check the primary source before relying on a figure for a decision that matters.
          The service may change, lose features, or stop without notice, and no service
          level is promised.
        </P>

        <H2>Limitation of liability</H2>
        <P>
          To the fullest extent permitted by law, the maintainer is not liable for indirect,
          incidental, special, consequential, or punitive loss, or for lost profits,
          revenue, data, or business opportunity, arising from use of or inability to use
          the site, the API, or the data. Where liability cannot be excluded, it is limited
          to the amount you paid to use the service, which is zero. Nothing here excludes
          liability that the law does not allow to be excluded.
        </P>

        <H2>Changes to these terms</H2>
        <P>
          These terms may change when the service changes. The revision date at the top is
          updated, and the current version is the one published at this URL. Continuing to
          use the site after a change means the new terms apply from that date.
        </P>

        <H2>Governing law</H2>
        <P>
          These terms are governed by the laws of India. Disputes are subject to the
          jurisdiction of the courts of Gujarat, India. If mandatory consumer or data
          protection law in your country gives you stronger rights, nothing here removes
          them.
        </P>

        <H2>Contact</H2>
        <P>
          Questions about these terms, corrections, and permission requests go through the{" "}
          <A href="/contact">contact page</A>. Security reports should follow the{" "}
          <Ext href="https://github.com/TirupMehta/ModelRegistry/blob/main/SECURITY.md">
            security policy
          </Ext>
          , not a public issue.
        </P>
      </section>
    </main>
  )
}
