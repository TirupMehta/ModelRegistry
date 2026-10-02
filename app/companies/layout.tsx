import type { Metadata } from "next"

const SITE_URL = "https://modelregistry.tirup.in"

export const metadata: Metadata = {
  title: "AI Laboratories — Every Frontier Lab, Flagship & Checkpoint",
  description:
    "Browse every AI laboratory tracked by ModelRegistry — OpenAI, Anthropic, Google DeepMind, xAI, DeepSeek, Meta AI, Qwen, Mistral, Tencent, Z.ai and more — each with its primary flagship model and latest research checkpoint.",
  alternates: {
    canonical: `${SITE_URL}/companies`,
  },
  openGraph: {
    title: "AI Laboratories on ModelRegistry",
    description:
      "Every frontier AI lab in one index — primary flagships and latest research checkpoints with verified specs.",
    url: `${SITE_URL}/companies`,
    siteName: "ModelRegistry",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Laboratories — Flagships & Checkpoints",
    description:
      "Every frontier AI lab in one index — primary flagships and latest research checkpoints with verified specs.",
  },
}

export default function CompaniesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
