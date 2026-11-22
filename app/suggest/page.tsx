import type { Metadata } from "next"
import Header from "@/components/header"
import ModelSuggestionForm from "@/components/model-suggestion-form"
import { withShare } from "@/lib/share"

export const metadata: Metadata = withShare({
  title: "Suggest a model",
  description: "Suggest a newly released AI model for review by the ModelRegistry maintainers.",
  alternates: { canonical: "https://modelregistry.tirup.in/suggest" },
}, { page: "/suggest" }, "/suggest")

export default function SuggestPage() {
  return <main id="content" tabIndex={-1} className="relative min-h-screen focus:outline-none">
    <Header />
    <section className="page">
      <h1 className="mb-3 text-heading font-display font-semibold tracking-tight text-fg-strong sm:text-page">Suggest a model</h1>
      <p className="mb-7 max-w-2xl text-body leading-6 text-fg-muted">Point us to an official release. Suggestions go through the same source checks and registry validation as maintainer-added records.</p>
      <ModelSuggestionForm />
    </section>
  </main>
}
