import type { Metadata } from "next"

const SITE_URL = "https://modelregistry.tirup.in"

export const metadata: Metadata = {
  title: "Frontier AI Model Leaderboard — Reasoning, Coding, Price & Context",
  description:
    "Head-to-head frontier AI model rankings across reasoning, agentic coding, open weights, context window and inference price — verified specs for GPT-6, Claude Opus, Gemini, Grok, DeepSeek, Qwen and more.",
  alternates: {
    canonical: `${SITE_URL}/leaderboard`,
  },
  openGraph: {
    title: "Frontier AI Model Leaderboard",
    description:
      "Which foundation model holds the state of the art? Reasoning, coding, value, context and price — ranked with verified specs.",
    url: `${SITE_URL}/leaderboard`,
    siteName: "ModelRegistry",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Frontier AI Model Leaderboard",
    description:
      "Reasoning, coding, value, context and price rankings with verified specs for every frontier model.",
  },
}

export default function LeaderboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
