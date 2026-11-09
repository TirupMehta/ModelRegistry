import type { Metadata } from "next"
import Link from "next/link"
import Header from "@/components/header"
import { ORGANIZATION_ID } from "@/lib/entities"
import { SITE_URL } from "@/lib/site"
import { safeJsonLd } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Privacy policy - what ModelRegistry stores",
  description:
    "What ModelRegistry stores and what it does not: no accounts, no login, no payment data. Local preferences stay in your browser; the Model Alerts waitlist stores one email address; analytics are aggregate.",
  alternates: { canonical: `${SITE_URL}/privacy` },
  openGraph: {
    title: "ModelRegistry privacy policy",
    description:
      "No accounts, no login, no payment data. Local preferences stay in your browser. The waitlist stores one email address.",
    url: `${SITE_URL}/privacy`,
    siteName: "ModelRegistry",
    type: "website",
  },
}

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
  return (
    <Link href={href} className="text-accent-ink hover:underline underline-offset-2">
      {children}
    </Link>
  )
}

export default function PrivacyPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "PrivacyPolicy",
    "@id": `${SITE_URL}/privacy`,
    url: `${SITE_URL}/privacy`,
    name: "ModelRegistry privacy policy",
    description:
      "What ModelRegistry stores, why, and how to request deletion: no accounts, local preferences in the browser, one email address in the waitlist, aggregate analytics.",
    isPartOf: { "@id": `${SITE_URL}/#website` },
    about: { "@id": ORGANIZATION_ID },
    inLanguage: "en",
  }

  return (
    <main className="relative min-h-screen">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <section className="max-w-4xl mx-auto w-full px-4 sm:px-6 md:px-20 pb-20">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-semibold tracking-tight text-black dark:text-white mb-2">
          Privacy policy
        </h1>
        <p className="mb-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-sans text-black/50 dark:text-zinc-500">
          <span>Last updated 2026-11-07</span>
          <span className="h-3 w-px bg-black/10 dark:bg-white/15" aria-hidden="true" />
          <A href="/contact">Contact</A>
          <span className="h-3 w-px bg-black/10 dark:bg-white/15" aria-hidden="true" />
          <A href="/about">About</A>
        </p>

        <P>
          This page describes what ModelRegistry actually stores. It is short
          because the site collects very little: there are no accounts, no login,
          no payment flow, and no advertising network. Everything below is
          written to match the code in this repository rather than a generic
          template.
        </P>

        <H2>What is stored in your browser</H2>
        <P>
          Your theme preference (light or dark) and the haptic and click-sound
          toggles are kept in your browser&apos;s localStorage. They never leave
          your device, they are not readable by the server, and clearing site
          data removes them. ModelRegistry does not set first-party
          authentication or advertising cookies.
        </P>

        <H2>The Model Alerts waitlist</H2>
        <P>
          If you submit the waitlist form on the{" "}
          <A href="/alerts">Model Alerts page</A>, the site stores the
          normalized email address (trimmed and lowercased), the moment consent
          was given, and the version of the consent text you agreed to. That is
          the complete record. It is used only to contact you about Model Alerts,
          it is not sold or shared, and it is not joined to any other data.
        </P>
        <P>
          Model Alerts has not shipped yet. If you want an entry removed before
          it does, open a{" "}
          <A href="https://github.com/TirupMehta/ModelRegistry/issues">GitHub issue</A>{" "}
          or use the <A href="/contact">contact page</A> and the
          maintainer will delete it. Unsubscribing, if the feature ever ships,
          will be a one-click action in the email itself.
        </P>

        <H2>Analytics</H2>
        <P>
          The site uses Vercel Analytics and Vercel Speed Insights. They record
          aggregate page views and real-user performance measurements so broken
          pages and slow routes can be spotted. They do not build advertising
          profiles, do not set ad cookies, and are not used to identify
          individual visitors.
        </P>

        <H2>Server logs and abuse protection</H2>
        <P>
          Requests pass through the hosting provider, which keeps standard
          technical logs such as IP address, user agent, and timestamp for
          security and abuse prevention. The waitlist form additionally uses a
          per-client attempt counter; its key is a pseudonymous hash of the
          client IP, not the address itself, and it is used only to throttle
          repeated submissions.
        </P>

        <H2>Third parties</H2>
        <P>
          Vercel hosts and serves the site. Neon hosts the Postgres database that
          stores waitlist entries. OpenRouter is queried server-side to show live
          provider listings on model pages; your browser is not sent there. Links
          to GitHub, laboratories, and social profiles are ordinary outbound
          links, and those sites have their own policies.
        </P>

        <H2>Children and sensitive data</H2>
        <P>
          The registry is a technical reference and is not directed at children.
          Do not submit sensitive personal information through the waitlist form;
          an email address is the only field it accepts.
        </P>

        <H2>Changes and questions</H2>
        <P>
          If the data collected changes, this page is updated before the change
          ships, and the revision date at the top changes with it. For any
          question about this policy, or to request deletion of a waitlist entry,
          use the <A href="/contact">contact page</A>.
        </P>
      </section>
    </main>
  )
}
