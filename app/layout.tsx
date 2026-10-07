import type { Metadata } from "next"
import { sans, display } from "./fonts"
import "./globals.css"
import AmbientShader from "@/components/ambient-shader"
import FeedbackInit from "@/components/feedback-init"
import { modelsData } from "@/data/models"
import { datasetRevision } from "@/data/revision"
import { safeJsonLd } from "@/lib/utils"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"

export const metadata: Metadata = {
  metadataBase: new URL("https://modelregistry.tirup.in"),
  title: {
    default: "ModelRegistry - The Open Frontier AI Model Registry",
    template: "%s | ModelRegistry",
  },
  description:
    "The open community registry tracking primary foundation flagships and research checkpoints across OpenAI, Anthropic, Google DeepMind, DeepSeek, Meta AI, xAI, Qwen, Mistral, Tencent, Z.ai, TypeSafe AI, and more.",
  keywords: [
    "ModelRegistry",
    "Model Registry",
    "Open Frontier AI Models",
    "Latest AI Models",
    "Newest AI Model",
    "AI Model Leaderboard",
    "AI Model Pricing Comparison",
    "Open Weights AI Models",
    "OpenAI latest model",
    "Anthropic latest model",
    "Google latest model",
    "Meta latest model",
    "xAI latest model",
    "GPT-6.1 Sol",
    "GPT-6 Astra",
    "Claude Opus 5.5",
    "Claude Fable 5.1",
    "Gemini 4 Argon",
    "Muse Spark 1.3",
    "DeepSeek V4.1 Flash",
    "Grok 4.7",
    "Qwen3.8",
    "Kimi K3",
    "GLM 5.3",
    "Jev TypeSafe",
    "AI Models List",
    "Frontier LLMs",
    "Public Model Registry",
  ],
  authors: [{ name: "ModelRegistry Contributors" }],
  creator: "ModelRegistry",
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
    url: "https://modelregistry.tirup.in",
    title: "ModelRegistry - The Open Frontier AI Model Registry",
    description:
      "Real-time open community registry tracking the latest frontier AI flagships and research checkpoints across all premier AI labs.",
    siteName: "ModelRegistry",
  },
  twitter: {
    card: "summary_large_image",
    title: "ModelRegistry - The Open Frontier AI Model Registry",
    description:
      "Real-time open community registry tracking the latest frontier AI flagships and research checkpoints across all premier AI labs.",
  },
  alternates: {
    canonical: "https://modelregistry.tirup.in",
    types: {
      "application/rss+xml": "/rss.xml",
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const jsonLdWebSite = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "ModelRegistry",
    url: "https://modelregistry.tirup.in",
    description:
      "Open public registry tracking primary foundation flagships and cutting-edge research checkpoints across all premier AI research laboratories.",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://modelregistry.tirup.in/?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  }

  const sortedDates = modelsData.map((m) => m.releaseDate).sort()
  const temporalCoverage = sortedDates.length > 0
    ? `${sortedDates[0].slice(0, 7)}/${sortedDates[sortedDates.length - 1].slice(0, 7)}`
    : "2026/2026"

  const jsonLdDataset = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "@id": "https://modelregistry.tirup.in/api/v1/models",
    identifier: "https://modelregistry.tirup.in/api/v1/models",
    name: "Frontier AI Models Specification Registry",
    version: datasetRevision.datasetVersion,
    dateModified: datasetRevision.revisedAt,
    description:
      "Source-linked specifications, context limits, pricing, release dates, and lab-published benchmark metrics for active frontier AI foundation models and research checkpoints.",
    url: "https://modelregistry.tirup.in",
    creator: {
      "@type": "Organization",
      name: "ModelRegistry Open Source Contributors",
      url: "https://github.com/TirupMehta/ModelRegistry",
      sameAs: ["https://github.com/TirupMehta/ModelRegistry"],
    },
    license: "https://opensource.org/licenses/MIT",
    temporalCoverage,
    distribution: [
      {
        "@type": "DataDownload",
        encodingFormat: "application/json",
        contentUrl: "https://modelregistry.tirup.in/api/v1/models",
      },
      {
        "@type": "DataDownload",
        encodingFormat: "application/rss+xml",
        contentUrl: "https://modelregistry.tirup.in/rss.xml",
      },
      {
        "@type": "DataDownload",
        encodingFormat: "text/plain",
        contentUrl: "https://modelregistry.tirup.in/llms.txt",
      },
      {
        "@type": "DataDownload",
        encodingFormat: "application/feed+json",
        contentUrl: "https://modelregistry.tirup.in/feed.json",
      },
    ],
  }

  // NOTE: no sitewide FAQPage schema - structured Q&A is emitted only on
  // pages that render the questions visibly (see app/companies/[id]/page.tsx).

  return (
    <html lang="en" className="scroll-smooth no-transitions" suppressHydrationWarning>
      <head>
        <link rel="alternate" type="application/rss+xml" title="ModelRegistry RSS Feed" href="/rss.xml" />
      </head>
      <body
        className={`${sans.variable} ${display.variable} font-sans antialiased bg-[#f7f7f4] dark:bg-[#07080a] text-[#111215] dark:text-[#f4f5f7] transition-colors duration-250 relative min-h-screen`}
        suppressHydrationWarning
      >
        {/* Procedural Canvas Architectural Lighting Shader */}
        <AmbientShader />

        {/* Rich SEO & GEO Structured Data Matrix */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLdWebSite) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLdDataset) }}
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
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
