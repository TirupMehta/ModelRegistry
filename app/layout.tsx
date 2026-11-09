import type { Metadata } from "next"
import { sans, display } from "./fonts"
import "./globals.css"
import AmbientShader from "@/components/ambient-shader"
import FeedbackInit from "@/components/feedback-init"
import Footer from "@/components/footer"
import { modelsData } from "@/data/models"
import { datasetRevision } from "@/data/revision"
import { safeJsonLd } from "@/lib/utils"
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site"
import {
  CORE_KEYWORDS,
  DATASET_ID,
  ORGANIZATION_ID,
  PERSON_ID,
  organizationNode,
  personNode,
  websiteNode,
} from "@/lib/entities"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s | ModelRegistry",
  },
  description: SITE_DESCRIPTION,
  keywords: CORE_KEYWORDS,
  authors: [{ name: "Tirup Mehta", url: "https://tirup.in" }],
  creator: "Tirup Mehta",
  publisher: "ModelRegistry",
  category: "Technology",
  classification: "AI model registry, frontier model specifications, benchmark provenance",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
    images: [
      {
        url: "/api/og?theme=light",
        width: 1200,
        height: 630,
        alt: SITE_TITLE,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/api/og?theme=light"],
  },
  alternates: {
    canonical: SITE_URL,
    types: {
      "application/rss+xml": "/rss.xml",
      "application/feed+json": "/feed.json",
    },
  },
  other: {
    // Discovery hints some engines still read; mirrors what the sibling sites publish.
    "ICBM": "23.0225, 72.5714",
    "geo.position": "23.0225;72.5714",
    "geo.region": "IN-GJ",
    "geo.placename": "Gujarat, India",
    "DC.title": SITE_TITLE,
    "DC.creator": "Tirup Mehta",
    "DC.subject": "AI model registry, frontier LLMs, model specifications, benchmarks",
    "DC.description": SITE_DESCRIPTION,
    "DC.language": "en",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const sortedDates = modelsData.map((m) => m.releaseDate).sort()
  const temporalCoverage = sortedDates.length > 0
    ? `${sortedDates[0].slice(0, 7)}/${sortedDates[sortedDates.length - 1].slice(0, 7)}`
    : "2026/2026"

  const jsonLdDataset = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "@id": DATASET_ID,
    identifier: DATASET_ID,
    name: "Frontier AI Models Specification Registry",
    version: datasetRevision.datasetVersion,
    dateModified: datasetRevision.revisedAt,
    description:
      "Source-linked specifications, context limits, pricing, release dates, and lab-published benchmark metrics for active frontier AI foundation models and research checkpoints.",
    url: SITE_URL,
    creator: { "@id": ORGANIZATION_ID },
    maintainer: { "@id": PERSON_ID },
    isAccessibleForFree: true,
    keywords: [
      "AI model registry",
      "frontier models",
      "model specifications",
      "context window",
      "model pricing",
      "benchmarks",
    ],
    license: "https://opensource.org/licenses/MIT",
    temporalCoverage,
    distribution: [
      {
        "@type": "DataDownload",
        encodingFormat: "application/json",
        contentUrl: `${SITE_URL}/api/v1/models`,
      },
      {
        "@type": "DataDownload",
        encodingFormat: "application/rss+xml",
        contentUrl: `${SITE_URL}/rss.xml`,
      },
      {
        "@type": "DataDownload",
        encodingFormat: "text/plain",
        contentUrl: `${SITE_URL}/llms.txt`,
      },
      {
        "@type": "DataDownload",
        encodingFormat: "application/feed+json",
        contentUrl: `${SITE_URL}/feed.json`,
      },
    ],
  }

  // One graph rather than parallel scripts: the Person, Organization, WebSite
  // and Dataset nodes reference each other by @id, which is what lets an
  // indexer connect "who made this" to "what this is".
  const jsonLdGraph = {
    "@context": "https://schema.org",
    "@graph": [personNode, organizationNode, websiteNode, jsonLdDataset],
  }

  // NOTE: no sitewide FAQPage schema - structured Q&A is emitted only on
  // pages that render the questions visibly (see app/about and
  // app/companies/[id]/page.tsx).

  return (
    <html lang="en" className="scroll-smooth no-transitions" suppressHydrationWarning>
      <head>
        <link rel="alternate" type="application/rss+xml" title="ModelRegistry RSS Feed" href="/rss.xml" />
      </head>
      <body
        className={`${sans.variable} ${display.variable} font-sans antialiased bg-[var(--bg)] text-[var(--fg)] transition-colors duration-200 relative min-h-screen flex flex-col`}
        suppressHydrationWarning
      >
        {/* Procedural Canvas Architectural Lighting Shader */}
        <AmbientShader />

        {/* Rich SEO & GEO Structured Data Matrix */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLdGraph) }}
        />

        {/* Inline script to set default light theme unless explicitly dark */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'){document.documentElement.classList.add('dark')}else{document.documentElement.classList.remove('dark')}}catch(e){}window.setTimeout(function(){document.documentElement.classList.remove('no-transitions')},100)})()`,
          }}
        />

        {/* Pointer-modality tracking: Safari draws its own contrasting tap
            outline (black in light mode, white in dark) on every tap. The
            `ptr` class lets CSS suppress focus rings for pointer users while
            keeping them for keyboard (Tab removes the class). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var d=document.documentElement;function p(){d.classList.add('ptr')}function k(e){if(e.key==='Tab')d.classList.remove('ptr')}d.addEventListener('pointerdown',p,{capture:true,passive:true});d.addEventListener('touchstart',p,{capture:true,passive:true});d.addEventListener('keydown',k,true)})()`,
          }}
        />

        <FeedbackInit />
        <div className="flex-1 flex flex-col [&>main]:!min-h-0">{children}</div>
        <Footer />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
