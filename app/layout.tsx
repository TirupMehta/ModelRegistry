import type { Metadata } from "next"
import { Plus_Jakarta_Sans, Space_Grotesk, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import AmbientShader from "@/components/ambient-shader"
import { modelsData } from "@/data/models"
import { companies, type Company } from "@/data/companies"
import { Analytics } from "@vercel/analytics/next"

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
})

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600", "700"],
})

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500", "600"],
})

export const metadata: Metadata = {
  metadataBase: new URL("https://modelregistry.tirup.in"),
  title: {
    default: "ModelRegistry — The Open Frontier AI Model Registry",
    template: "%s | ModelRegistry",
  },
  description:
    "The open community registry tracking primary foundation flagships and research checkpoints across OpenAI, Anthropic, Google DeepMind, DeepSeek, Meta AI, xAI, and more.",
  keywords: [
    "ModelRegistry",
    "Model Registry",
    "Open Frontier AI Models",
    "Latest AI Models",
    "OpenAI latest model",
    "Meta latest model",
    "Anthropic latest model",
    "Google latest model",
    "OpenAI GPT-5.6 Sol",
    "Meta Llama 4 Maverick",
    "Anthropic Claude Fable 5.1",
    "Google Gemini 3.8 Flash",
    "DeepSeek V4 Pro",
    "xAI Grok 4.6",
    "Qwen 2.4T",
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
    title: "ModelRegistry — The Open Frontier AI Model Registry",
    description:
      "Real-time open community registry tracking the latest frontier AI flagships and research checkpoints across all premier AI labs.",
    siteName: "ModelRegistry",
  },
  twitter: {
    card: "summary_large_image",
    title: "ModelRegistry — The Open Frontier AI Model Registry",
    description:
      "Real-time open community registry tracking the latest frontier AI flagships and research checkpoints across all premier AI labs.",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
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

  const jsonLdDataset = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Frontier AI Models Specification Registry",
    description:
      "Verified specifications, context limits, pricing, release dates, and benchmark performance metrics for active frontier AI foundation models and research checkpoints.",
    url: "https://modelregistry.tirup.in",
    creator: {
      "@type": "Organization",
      name: "ModelRegistry Open Source Contributors",
      url: "https://github.com/TirupMehta/ModelRegistry",
    },
    license: "https://opensource.org/licenses/MIT",
    temporalCoverage: "2026/..",
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
    ],
  }

  const dynamicFaqQuestions = Object.values(companies).slice(0, 6).map((c: Company) => {
    const flagship = modelsData.find((m) => m.companyId === c.id && m.isCompanyFlagship)
    const checkpoint = modelsData.find((m) => m.companyId === c.id && m.isLatestCheckpoint && !m.isCompanyFlagship)
    return {
      "@type": "Question",
      name: `What is the latest AI model from ${c.name}?`,
      acceptedAnswer: {
        "@type": "Answer",
        text: flagship
          ? `${c.name}'s primary flagship model is ${flagship.name} (${flagship.parameters}, ${flagship.contextWindow} context). ${flagship.highlight}${
              checkpoint ? ` Their latest research checkpoint is ${checkpoint.name} (${checkpoint.categoryLabel}).` : ""
            }`
          : `ModelRegistry tracks verified releases from ${c.name} in its open technical index.`,
      },
    }
  })

  const jsonLdFAQ = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: dynamicFaqQuestions,
  }

  return (
    <html lang="en" className="scroll-smooth no-transitions" suppressHydrationWarning>
      <head>
        <link rel="alternate" type="application/rss+xml" title="ModelRegistry RSS Feed" href="/rss.xml" />
      </head>
      <body
        className={`${sans.variable} ${display.variable} ${mono.variable} font-sans antialiased bg-[#f7f7f4] dark:bg-[#07080a] text-[#111215] dark:text-[#f4f5f7] transition-colors duration-250 relative min-h-screen`}
        suppressHydrationWarning
      >
        {/* Procedural Canvas Architectural Lighting Shader */}
        <AmbientShader />

        {/* Rich SEO & GEO Structured Data Matrix */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebSite) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdDataset) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFAQ) }}
        />

        {/* Inline script to set default light theme unless explicitly dark */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'){document.documentElement.classList.add('dark')}else{document.documentElement.classList.remove('dark')}}catch(e){}window.setTimeout(function(){document.documentElement.classList.remove('no-transitions')},100)})()`,
          }}
        />

        {children}
        <Analytics />
      </body>
    </html>
  )
}
