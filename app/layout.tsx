import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import AmbientShader from "@/components/ambient-shader"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://checkpoint.dev"),
  title: {
    default: "Checkpoint — Frontier AI Model Registry",
    template: "%s | Checkpoint",
  },
  description:
    "The open registry tracking primary foundation flagships and cutting-edge research checkpoints across OpenAI, Anthropic, Google DeepMind, DeepSeek, Meta, xAI, and more.",
  keywords: [
    "Checkpoint",
    "Latest AI Models",
    "OpenAI GPT-5.6 Sol",
    "Meta Llama 4 Maverick",
    "Anthropic Claude Fable 5.1",
    "Google Gemini 3.7 Flash",
    "DeepSeek V4 Pro",
    "xAI Grok 4.6",
    "Qwen 2.4T",
    "AI Models List",
    "Frontier LLMs",
  ],
  authors: [{ name: "Checkpoint" }],
  creator: "Checkpoint",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://checkpoint.dev",
    title: "Checkpoint — Frontier AI Model Registry",
    description:
      "Real-time registry tracking the latest frontier AI flagships and research checkpoints across all premier AI labs.",
    siteName: "Checkpoint",
  },
  twitter: {
    card: "summary_large_image",
    title: "Checkpoint — Frontier AI Model Registry",
    description:
      "Real-time registry tracking the latest frontier AI flagships and research checkpoints across all premier AI labs.",
  },
  alternates: {
    canonical: "https://checkpoint.dev",
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
  return (
    <html lang="en" className="scroll-smooth no-transitions" suppressHydrationWarning>
      <head>
        <link rel="alternate" type="application/rss+xml" title="Checkpoint RSS Feed" href="/rss.xml" />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased bg-[#fafaf9] dark:bg-[#090a0d] text-[#121314] dark:text-[#f4f4f5] transition-colors duration-300 relative min-h-screen`}
        suppressHydrationWarning
      >
        {/* Procedural Canvas Architectural Lighting Shader */}
        <AmbientShader />

        {/* JSON-LD Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Checkpoint",
              url: "https://checkpoint.dev",
              description: "Real-time registry tracking the latest frontier AI models across every AI lab.",
              potentialAction: {
                "@type": "SearchAction",
                target: "https://checkpoint.dev/?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            }),
          }}
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
