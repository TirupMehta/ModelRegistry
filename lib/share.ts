import type { Metadata } from "next"
import { modelsData } from "@/data/models"
import { companies } from "@/data/companies"
import { datasetRevision } from "@/data/revision"
import { independentRecords } from "@/data/independent-benchmarks"
import { SITE_NAME, SITE_URL } from "@/lib/site"

/**
 * Share previews: one place that decides what Open Graph and Twitter say for a
 * route, so no page can ship text without an image or inherit another page's
 * title. Every number on a card comes from the dataset at render time, never
 * from a hard-coded string.
 */

export interface PageCard {
  kicker: string
  title: string
  blurb: string
  big: string
  bigLabel: string
  lines: string[]
}

const newest = () => [...modelsData].sort((a, b) => b.releaseDate.localeCompare(a.releaseDate))[0]

function changelogCount(): number {
  return modelsData.reduce((n, m) => n + m.changeLog.length, 0)
}

/** Page cards keyed by route path. Values are derived from the data. */
export function pageCard(path: string): PageCard | null {
  const labs = Object.keys(companies).length
  const models = modelsData.length
  const open = modelsData.filter((m) => m.openWeights).length
  const flagships = modelsData.filter((m) => m.isCompanyFlagship).length
  const retired = modelsData.filter((m) => m.verificationStatus === "retired").length
  const rev = datasetRevision.revisedAt
  const base = (kicker: string, title: string, blurb: string, big: string, bigLabel: string, lines: string[]): PageCard => ({
    kicker,
    title,
    blurb,
    big,
    bigLabel,
    lines,
  })
  switch (path) {
    case "/about":
      return base("ABOUT", "About ModelRegistry", "An open, source-linked record of frontier AI models.", String(models), "MODELS TRACKED", [`${labs} labs`, `Revised ${rev}`])
    case "/alerts":
      return base("ALERTS", "Model alerts waitlist", "Join the waitlist for model-change alerts.", String(models), "MODELS TRACKED", [`${labs} labs`, `Revised ${rev}`])
    case "/best":
      return base("BEST BY TASK", "Best AI model by task", "The highest independent score on each named test among current models.", String(independentRecords.length), "MODELS TESTED", ["Independent results", `Revised ${rev}`])
    case "/changelog":
      return base("CHANGELOG", "Record history", "Dated additions, corrections and re-sourcing across every model record.", String(changelogCount()), "DATED ENTRIES", [`${models} models`, `Revised ${rev}`])
    case "/cli":
      return base("COMMAND LINE", "The ModelRegistry CLI", "Query the registry from a terminal. No keys, no signup.", String(models), "MODELS AVAILABLE", ["Zero dependencies", "Free JSON API"])
    case "/companies":
      return base("LABS", "AI labs tracked", "Every laboratory in the registry with its flagship and newest release.", String(labs), "LABS TRACKED", [`${flagships} flagships`, `${models} models`])
    case "/compare":
      return base("COMPARE", "Compare AI models", "Side-by-side specifications and independent results, with the source of every figure.", String(models), "MODELS TO COMPARE", ["Same-test results only", `Revised ${rev}`])
    case "/contact":
      return base("CONTACT", "Contact the maintainer", "Report an error or ask about the registry.", String(models), "MODELS TRACKED", [`${labs} labs`, `Revised ${rev}`])
    case "/context":
      return base("CONTEXT WINDOWS", "Context windows compared", "Published context window for every tracked model.", String(models), "MODELS TRACKED", [`${labs} labs`, `Revised ${rev}`])
    case "/docs":
      return base("API REFERENCE", "ModelRegistry API", "A free, read-only JSON API with provenance on every record.", String(models), "RECORDS SERVED", ["OpenAPI 3.1", "CORS open"])
    case "/editorial-policy":
      return base("EDITORIAL POLICY", "How the registry decides", "What gets published, what gets corrected and who decides.", String(models), "MODELS TRACKED", [`${labs} labs`, `Revised ${rev}`])
    case "/flagships":
      return base("FLAGSHIPS", "Current flagship models", "The primary flagship of every tracked lab, with sources.", String(flagships), "FLAGSHIPS", [`${labs} labs`, `Revised ${rev}`])
    case "/insights":
      return base("INSIGHTS", "Registry insights", "Analyses built from the registry's sourced data.", String(models), "MODELS TRACKED", [`${labs} labs`, `Revised ${rev}`])
    case "/insights/cost-of-intelligence":
      return base("INSIGHTS", "The cost of intelligence", "What each independent score costs across current models.", String(independentRecords.length), "MODELS WITH SCORES", ["Independent results", `Revised ${rev}`])
    case "/insights/lab-claims-vs-independent":
      return base("INSIGHTS", "Lab claims vs independent results", "Where lab-reported figures and independent measurements differ.", String(independentRecords.length), "MODELS COMPARED", ["Independent results", `Revised ${rev}`])
    case "/licenses":
      return base("LICENSES", "Model licenses", "Which models publish weights, and under which license.", String(open), "OPEN-WEIGHT MODELS", [`${models} models`, `Revised ${rev}`])
    case "/methodology":
      return base("METHODOLOGY", "How the registry works", "Inclusion standard, sourcing rules and what the dates mean.", String(models), "MODELS TRACKED", [`${labs} labs`, `Revised ${rev}`])
    case "/modalities":
      return base("MODALITIES", "Models by modality", "Text, vision, audio, image and video models, grouped.", String(models), "MODELS TRACKED", [`${labs} labs`, `Revised ${rev}`])
    case "/open-source":
      return base("OPEN WEIGHTS", "Open-weight AI models", "Models whose weights are published, with their licenses.", String(open), "OPEN-WEIGHT MODELS", [`${models} models`, `Revised ${rev}`])
    case "/pricing":
      return base("PRICING", "AI model pricing", "Published price per 1M tokens for every tracked model.", String(models), "MODELS PRICED", [`${labs} labs`, `Revised ${rev}`])
    case "/privacy":
      return base("PRIVACY", "Privacy policy", "What the site collects and what it does not.", String(models), "MODELS TRACKED", [`${labs} labs`, `Revised ${rev}`])
    case "/retired":
      return base("RETIRED", "Retired models", "Models kept for history after a lab withdrew them.", String(retired), "RETIRED RECORDS", [`${models} models`, `Revised ${rev}`])
    case "/score":
      return base("MERIDIAN SCORE", "The Meridian score", "A fixed-reference score across the independent tests.", String(independentRecords.length), "MODELS SCORED", ["Fixed calibration", `Revised ${rev}`])
    case "/suggest":
      return base("SUGGEST A MODEL", "Suggest a model", "Propose a model for the registry. Every suggestion is reviewed.", String(models), "MODELS TRACKED", [`${labs} labs`, `Revised ${rev}`])
    case "/timeline":
      return base("TIMELINE", "Release timeline", "Every tracked release in order, newest first.", String(models), "RELEASES", [newest() ? `Newest: ${newest().name}` : "", `Revised ${rev}`].filter(Boolean))
    case "/trust":
      return base("TRUST", "Why you can trust the registry", "Sources, check dates and the limits of what the registry can know.", String(models), "MODELS TRACKED", [`${labs} labs`, `Revised ${rev}`])
    default:
      return null
  }
}

export type ShareImage = { page: string } | { model: string } | { lab: string } | { task: string }

export function ogImageUrl(image: ShareImage): string {
  const q = new URLSearchParams(image as Record<string, string>)
  return `${SITE_URL}/api/og?${q.toString()}`
}

/**
 * Fill in the share preview of a page's metadata. Anything the page already
 * set (its own social title or description) is kept; the image and every
 * missing piece is added so Open Graph and Twitter always agree.
 */
export function withShare(meta: Metadata, image: ShareImage, path?: string): Metadata {
  const plain = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined)
  const baseTitle = plain(meta.title) ?? SITE_NAME
  const baseDescription = plain(meta.description) ?? ""
  const og = meta.openGraph ?? {}
  const tw = meta.twitter ?? {}
  const title = plain(og.title) ?? baseTitle
  const description = plain(og.description) ?? baseDescription
  const canonical = plain(meta.alternates?.canonical)
  const url = og.url ? String(og.url) : canonical ?? (path ? `${SITE_URL}${path}` : undefined)
  const src = ogImageUrl(image)
  return {
    ...meta,
    openGraph: {
      siteName: SITE_NAME,
      type: "website",
      ...og,
      title,
      description,
      ...(url ? { url } : {}),
      images: [{ url: src, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      ...tw,
      title: plain(tw.title) ?? title,
      description: plain(tw.description) ?? description,
      images: [src],
    },
  }
}
