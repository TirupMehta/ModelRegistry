import type { Metadata } from "next"
import Link from "next/link"
import Header from "@/components/header"
import AnalyticsOptOut from "@/components/analytics-opt-out"
import { ORGANIZATION_ID } from "@/lib/entities"
import { SITE_URL } from "@/lib/site"
import { safeJsonLd } from "@/lib/utils"
import { withShare } from "@/lib/share"

export const metadata: Metadata = withShare({
  title: "Privacy policy: what ModelRegistry stores and why",
  description:
    "What ModelRegistry stores and what it does not: no accounts or payment data, local preferences in your browser, one email address on the waitlist, and pseudonymous PostHog analytics you can turn off.",
  alternates: { canonical: `${SITE_URL}/privacy` },
  openGraph: {
    title: "ModelRegistry privacy policy",
    description:
      "No accounts, no login, no payment data. Local preferences stay in your browser. The waitlist stores one email address. Analytics is pseudonymous and can be switched off.",
    url: `${SITE_URL}/privacy`,
    siteName: "ModelRegistry",
    type: "website",
  },
}, { page: "/privacy" }, "/privacy")

function H2({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h2 id={id} className="text-heading font-display font-semibold tracking-tight text-fg-strong mt-8 mb-3">
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

function Key({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-black/[0.05] px-1 py-0.5 font-mono text-small text-fg-strong dark:bg-white/[0.08]">
      {children}
    </code>
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
      "What ModelRegistry stores, why, and how to request deletion: no accounts, local preferences in the browser, one email address in the waitlist, pseudonymous PostHog analytics with an opt-out, and server logs used only for security.",
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
          Privacy policy
        </h1>
        <p className="mb-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-small font-sans text-fg-muted">
          <span>Last updated 2026-11-27</span>
          <span className="h-3 w-px bg-black/10 dark:bg-white/15" aria-hidden="true" />
          <A href="/terms">Terms</A>
          <span className="h-3 w-px bg-black/10 dark:bg-white/15" aria-hidden="true" />
          <A href="/contact">Contact</A>
        </p>

        <P>
          ModelRegistry collects very little. There are no accounts, no login, no
          payment flow, and no advertising network. This page says what is stored,
          why, how long it is kept, and how to remove it. It is written to match the
          code in this repository rather than a generic template.
        </P>

        <H2>Who is responsible</H2>
        <P>
          ModelRegistry is a personal open source project maintained by Tirup Mehta,
          an individual in Gujarat, India. He decides what this site collects and why,
          so he is the data controller for the small amount of data described here.
          There is no company, sales team, or dedicated privacy office behind it.
        </P>
        <P>
          This policy covers the site at modelregistry.tirup.in, including its API and
          feeds. It does not cover GitHub, a laboratory site, or PostHog&apos;s own
          website when you follow a link to them.
        </P>

        <H2>What is stored in your browser</H2>
        <P>
          The site stores these values in <Key>localStorage</Key> on your device. They
          are readable by this site in your browser, not by the server, and clearing
          site data removes them.
        </P>
        <ul className="mb-4 max-w-[68ch] list-disc space-y-2 pl-5 text-body text-fg leading-6 sm:leading-7">
          <li>
            <Key>theme</Key>: whether you chose the light or dark theme.
          </li>
          <li>
            <Key>mr-haptics</Key> and <Key>mr-click-sound</Key>: your feedback toggles.
          </li>
          <li>
            <Key>modelregistry.changelog.lastVisit</Key>: the date you last opened the{" "}
            <A href="/changelog">changelog</A>, so the &ldquo;since last visit&rdquo;
            filter works.
          </li>
          <li>
            <Key>modelregistry:alerts-popup:v1:dismissed-at</Key>: when you closed the
            Model Alerts popup, so it stays closed for 14 days.
          </li>
          <li>
            <Key>modelregistry:alerts-waitlist:joined</Key>: a timestamp showing this
            browser already joined the waitlist.
          </li>
          <li>
            <Key>mr-analytics-opt-out</Key>: your analytics choice from the switch
            below.
          </li>
          <li>
            A PostHog entry whose name starts with <Key>ph_</Key>: the random visitor
            ID, session state, and opt-out state used for the analytics described
            below.
          </li>
        </ul>
        <P>
          One value lives in <Key>sessionStorage</Key> instead:{" "}
          <Key>mr_pages</Key> counts pages viewed in this tab so the waitlist popup does
          not appear immediately. It disappears when the tab closes.
        </P>
        <P>
          None of these values is used for advertising. The site sets no first party
          analytics or advertising cookies.
        </P>

        <H2>The Model Alerts waitlist</H2>
        <P>
          If you submit the waitlist form on the <A href="/alerts">Model Alerts page</A>,
          the site stores the normalized email address (trimmed and lowercased), the
          moment consent was given, and the version of the consent text you agreed to.
          That is the complete record. It is used only to contact you about Model
          Alerts, it is not sold or shared, and it is not joined to any other data.
        </P>
        <P>
          The legal basis is your consent, given with the checkbox. You can withdraw it
          at any time. Model Alerts has not shipped yet. If you want an entry removed,
          use the private channel described under{" "}
          <a href="#rights" className="text-accent-ink hover:underline underline-offset-2">
            your rights
          </a>{" "}
          and the maintainer will delete it. If the feature never ships and the list is
          closed, the entries are deleted with it. If it does ship, unsubscribing will be
          a one click action in the email itself.
        </P>

        <H2>Analytics</H2>
        <P>
          The site uses Vercel Analytics and Speed Insights for aggregate page views and
          real user performance, and PostHog for product analytics. PostHog records the
          page you viewed, the referring page, any campaign parameters, your browser,
          operating system and device type, language, timezone, screen size, a random
          visitor ID, and a session ID. It also receives the small set of explicit events
          listed below.
        </P>
        <P>
          It is configured without session recording, autocapture, heatmaps, surveys,
          feature flag evaluation, person profiles, advertising cookies, or cross site
          tracking. The site never calls <Key>identify()</Key>, so no profile is built
          around you. Do Not Track is honoured.
        </P>
        <P>
          Only page views and a small set of explicit events are sent: a model page
          view, a comparison view, a best by task page view, a copied prompt, a
          downloaded share card, a completed waitlist signup, and a submitted model
          suggestion. Form text is never sent. The waitlist event carries only the
          version of the consent text, not the email address. The suggestion event
          records the shape of the form, not what you typed.
        </P>
        <P>
          The browser sends analytics to <Key>/ingest</Key> on this domain, and the
          request is forwarded to PostHog Cloud. PostHog necessarily sees the network
          metadata of that request, which can include an IP address. The site disables
          GeoIP, so no location is derived from it, and the deployment enables
          PostHog&apos;s &ldquo;Discard client IP data&rdquo; setting so the address is
          not retained with events.
        </P>
        <P>
          Where EU or UK data protection law applies, the basis for analytics is the
          legitimate interest of understanding which parts of a free reference are used,
          using as little data as possible. The site has no ads and no advertising
          partners, so there is no advertising interest to weigh.
        </P>

        <H2 id="your-analytics-choice">Your analytics choice</H2>
        <P>
          Analytics can be switched off in this browser. The choice is remembered
          locally, stops new events immediately, and is reapplied on your next visit. If
          your browser already sends Do Not Track, the browser capture is disabled
          either way.
        </P>
        <AnalyticsOptOut />
        <P>
          Turning analytics off does not delete events that were already sent. Those
          stay in PostHog&apos;s aggregate data until its retention period ends, or you
          can ask for them to be erased using the private channel below.
        </P>

        <H2>Server logs and abuse protection</H2>
        <P>
          Requests pass through the hosting provider, which keeps standard technical
          logs such as IP address, user agent, and timestamp for security and abuse
          prevention. That processing is based on the legitimate interest of keeping the
          service available.
        </P>
        <P>
          The waitlist form additionally uses a per client attempt counter. Its key is a
          keyed hash (HMAC) of the client IP, not the address itself, and it is used only
          to throttle repeated submissions. Those counter rows are deleted after one
          day.
        </P>

        <H2>Who processes data, and where</H2>
        <P>
          Vercel hosts and serves the site and provides the aggregate analytics. Neon
          hosts the Postgres database that stores waitlist entries. PostHog Cloud
          processes the analytics events described above on the project&apos;s behalf
          (United States region by default; the operator can select the EU region).
          OpenRouter is queried server side to show live provider listings on model
          pages; your browser is not sent there.
        </P>
        <P>
          These providers act as processors under their data processing terms. Where data
          leaves your country, the providers rely on their standard contractual clauses
          and equivalent safeguards. Their terms are published at{" "}
          <Ext href="https://vercel.com/legal/dpa">Vercel</Ext>,{" "}
          <Ext href="https://posthog.com/dpa">PostHog</Ext>, and{" "}
          <Ext href="https://posthog.com/subprocessors">PostHog&apos;s subprocessors</Ext>.
          Links to GitHub, laboratories, and social profiles are ordinary outbound links,
          and those sites have their own policies.
        </P>

        <H2>How long data is kept</H2>
        <ul className="mb-4 max-w-[68ch] list-disc space-y-2 pl-5 text-body text-fg leading-6 sm:leading-7">
          <li>
            Browser storage: until you clear site data, or the value stops being useful
            (the popup dismissal is checked against a 14 day window).
          </li>
          <li>
            Waitlist entries: until you ask for deletion, or until the waitlist is
            closed.
          </li>
          <li>
            PostHog events: for the retention period set on the PostHog project (one year
            at the time of writing), then deleted.
          </li>
          <li>
            Rate limit counters: deleted after one day.
          </li>
          <li>
            Host logs: retained by the hosting provider under its own log retention.
          </li>
        </ul>

        <H2 id="rights">Your rights</H2>
        <P>
          Depending on where you live, you may have the right to ask what personal data is
          held about you, to correct it, to delete it, to restrict or object to its use,
          to receive a copy, and to withdraw consent for the waitlist. The analytics
          switch above is the fastest way to exercise the right to object to analytics.
        </P>
        <P>
          For anything else, including deletion of a waitlist entry, use the{" "}
          <A href="/contact">contact page</A> or open a private report at{" "}
          <Ext href="https://github.com/TirupMehta/ModelRegistry/security/advisories/new">
            GitHub private vulnerability reporting
          </Ext>{" "}
          and say it is a privacy request. That channel is private, not a public issue.
          Include the email address you used if you want a waitlist entry removed. The
          maintainer aims to reply within a few days; there is no guaranteed service
          level.
        </P>
        <P>
          If you are not satisfied with the response, you can complain to your local data
          protection authority. In India, that is the Data Protection Board of India.
        </P>

        <H2>Children and sensitive data</H2>
        <P>
          The registry is a technical reference and is not directed at children under 13.
          Do not submit sensitive personal information through the waitlist form; an
          email address is the only field it accepts. Do not submit a child&apos;s email
          address.
        </P>

        <H2>Changes and questions</H2>
        <P>
          If what is collected changes, this page is updated before the change ships, and
          the revision date at the top changes with it. The{" "}
          <A href="/terms">terms of use</A> explain the rules for using the site and its
          data. For any question about this policy, use the{" "}
          <A href="/contact">contact page</A>.
        </P>
      </section>
    </main>
  )
}
