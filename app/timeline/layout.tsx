import type { Metadata } from "next"

const SITE_URL = "https://modelregistry.tirup.in"

export const metadata: Metadata = {
  title: "AI Model Release Timeline — Every Frontier Launch in Order",
  description:
    "Chronological log of every verified frontier AI model release — flagships and research checkpoints from OpenAI, Anthropic, Google, xAI, DeepSeek, Meta and all premier labs, newest first.",
  alternates: {
    canonical: `${SITE_URL}/timeline`,
  },
  openGraph: {
    title: "AI Model Release Timeline",
    description:
      "Every verified frontier AI launch in chronological order — flagships and checkpoints, newest first.",
    url: `${SITE_URL}/timeline`,
    siteName: "ModelRegistry",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Model Release Timeline",
    description:
      "Every verified frontier AI launch in chronological order — flagships and checkpoints, newest first.",
  },
}

export default function TimelineLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
