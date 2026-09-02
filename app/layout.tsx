import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import AmbientShader from "@/components/ambient-shader"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
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

  const jsonLdFAQ = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is the latest AI model from Anthropic?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "As of September 2026, Anthropic's reigning flagship model is Claude Fable 5.1 (released September 1, 2026). It features a 1,000,000 token context window, 128,000 token maximum output, and scored 52.6% on Terminal-Bench-Science with a 75% reduction in cache read pricing.",
        },
      },
      {
        "@type": "Question",
        name: "What is the latest AI model from OpenAI?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "OpenAI's primary general-purpose flagship foundation model is GPT-5.6 Sol (1,050,000 token context window). Additionally, OpenAI announced OpenAI Astra on September 1, 2026 as their first model meeting the 'Critical' cybersecurity capability threshold under their Preparedness Framework.",
        },
      },
      {
        "@type": "Question",
        name: "What is the latest AI model from Meta AI?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Meta's primary open-weights foundation model is Llama 4 Maverick (128-expert MoE with 1,048,576 token context). Meta also announced Muse Voice Transcribe on September 1, 2026, a specialized streaming speech foundation model supporting 70+ languages.",
        },
      },
      {
        "@type": "Question",
        name: "What is the latest AI model from Google DeepMind?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Google DeepMind's flagship model is Gemini 3.8 Flash (released September 2, 2026), offering a 1,048,576 token context window, advanced agentic coding loops, and sub-second real-time multimodal reasoning.",
        },
      },
      {
        "@type": "Question",
        name: "What is the latest AI model from DeepSeek?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "DeepSeek's flagship hosted model is DeepSeek V4-Pro (0813), a 1.6 Trillion parameter MoE (49B activated). Their latest open-weights model is DeepSeek V4 Flash Vision Exp (305B MoE, released under MIT license on August 30, 2026).",
        },
      },
    ],
  }

  return (
    <html lang="en" className="scroll-smooth no-transitions" suppressHydrationWarning>
      <head>
        <link rel="alternate" type="application/rss+xml" title="ModelRegistry RSS Feed" href="/rss.xml" />
      </head>
      <body
        className={`${inter.variable} ${mono.variable} font-sans antialiased bg-[#f6f6f3] dark:bg-[#0b0c0e] text-[#111215] dark:text-[#ededed] transition-colors duration-200 relative min-h-screen`}
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

        {/* Inline script to prevent theme flashing */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}else{document.documentElement.classList.remove('dark')}}catch(e){}window.setTimeout(function(){document.documentElement.classList.remove('no-transitions')},100)})()`,
          }}
        />

        {children}
      </body>
    </html>
  )
}
