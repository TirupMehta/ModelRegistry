import type { Metadata } from "next"
import Link from "next/link"
import { Bell, Clock, FlaskConical, RefreshCw } from "lucide-react"
import Header from "@/components/header"
import AlertsWaitlistForm from "@/components/alerts-waitlist-form"
import { safeJsonLd } from "@/lib/utils"
import { modelsData } from "@/data/models"
import { companies } from "@/data/companies"

export const metadata: Metadata = {
  title: "Model Alerts - Join the waitlist",
  description:
    "Model Alerts will report new registry entries and specification changes across the frontier model index. Join the waitlist for one email when it opens.",
  alternates: { canonical: "https://modelregistry.tirup.in/alerts" },
}

const BENEFITS = [
  {
    icon: Bell,
    title: "New registry entries",
    body: "A note when a model is added to the index, so a launch is not missed between manual checks.",
  },
  {
    icon: RefreshCw,
    title: "Specification changes",
    body: "Pricing, context limits, and deprecations change without a new model shipping. Those updates are reported too.",
  },
  {
    icon: FlaskConical,
    title: "Lab coverage",
    body: `Releases from the ${Object.keys(companies).length} laboratories the registry tracks, from flagship down to latest checkpoint.`,
  },
  {
    icon: Clock,
    title: "No manual checking",
    body: "One place to watch instead of a tab open on every lab's release page.",
  },
] as const

export default function AlertsPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Model Alerts waitlist",
    url: "https://modelregistry.tirup.in/alerts",
    description:
      "Waitlist for Model Alerts, an upcoming ModelRegistry feature reporting new model entries and specification changes.",
    isPartOf: {
      "@type": "WebSite",
      name: "ModelRegistry",
      url: "https://modelregistry.tirup.in",
    },
  }
  const jsonLdBreadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Ledger", item: "https://modelregistry.tirup.in/" },
      { "@type": "ListItem", position: 2, name: "Model Alerts", item: "https://modelregistry.tirup.in/alerts" },
    ],
  }

  return (
    <main className="relative min-h-screen">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLdBreadcrumb) }} />

      <section className="page">
        <h1 className="text-page font-display font-semibold tracking-tight text-black dark:text-white mb-2">
          Model Alerts
        </h1>
        <p className="mb-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-small font-sans text-fg-muted">
          <span>Waitlist open</span>
          <span className="h-3 w-px bg-black/10 dark:bg-white/15" aria-hidden="true" />
          <span>One email at launch</span>
          <span className="h-3 w-px bg-black/10 dark:bg-white/15" aria-hidden="true" />
          <span className="tabular-nums">
            {modelsData.length} models across {Object.keys(companies).length} labs tracked today
          </span>
        </p>

        <p className="text-body text-fg leading-6 sm:leading-7 mb-8 max-w-2xl">
          ModelRegistry is updated by hand, against primary sources. Model Alerts is the planned way to be told about
          that work instead of checking the index yourself: new entries, changed specifications, and deprecations as
          they are registered.
        </p>

        {/* The action comes before the sales pitch: someone who follows the
            link came to join, not to read four cards first. */}
        <div className="mb-8 w-full">
          <AlertsWaitlistForm />
        </div>

        <div className="mb-10 grid gap-3 sm:grid-cols-2">
          {BENEFITS.map((benefit) => (
            <div
              key={benefit.title}
              className="tile p-4"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <benefit.icon size={13} className="text-accent-ink shrink-0" aria-hidden="true" />
                <h2 className="text-small font-display font-semibold tracking-tight text-black dark:text-white">
                  {benefit.title}
                </h2>
              </div>
              <p className="text-small font-sans leading-6 text-fg-muted">{benefit.body}</p>
            </div>
          ))}
        </div>

        <h2 className="text-heading font-display font-semibold tracking-tight text-black dark:text-white mt-10 mb-3">
          What this is, for now
        </h2>
        <div className="text-body text-fg leading-6 sm:leading-7 space-y-2 max-w-2xl">
          <p>
            A waitlist, nothing more. Your address is stored with the time you agreed and the version of the sentence
            you agreed to. No account, no profile, no tracking beyond what the site already does.
          </p>
          <p>
            Notifications, per-lab or per-model following, digests, and unsubscribe links belong to the feature itself
            and do not exist yet. No email is sent during this phase, including the confirmation of your signup.
          </p>
          <p>
            When Model Alerts ships it will be a separate subscription with its own consent, its own controls, and its
            own way out. Joining this waitlist does not enroll you in it.
          </p>
        </div>

        <p className="mt-8 text-small font-sans text-fg-muted">
          Questions about the data itself? See the{" "}
          <Link href="/methodology" className="text-accent-ink hover:underline underline-offset-2">
            methodology
          </Link>{" "}
          and{" "}
          <Link href="/editorial-policy" className="text-accent-ink hover:underline underline-offset-2">
            editorial policy
          </Link>
          .
        </p>
      </section>

    </main>
  )
}
