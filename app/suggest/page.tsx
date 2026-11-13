import type { Metadata } from "next"
import Header from "@/components/header"
import ModelSuggestionForm from "@/components/model-suggestion-form"

export const metadata: Metadata = {
  title: "Suggest a model",
  description: "Suggest a newly released AI model for review by the ModelRegistry maintainers.",
  alternates: { canonical: "https://modelregistry.tirup.in/suggest" },
}

export default function SuggestPage() {
  return <main className="relative min-h-screen">
    <Header />
    <section className="mx-auto w-full max-w-4xl px-4 pb-20 sm:px-6 md:px-20">
      <h1 className="mb-3 text-heading font-display font-semibold tracking-tight text-black dark:text-white sm:text-page">Suggest a model</h1>
      <p className="mb-7 max-w-2xl text-body leading-6 text-fg-muted">Point us to an official release. Suggestions go through the same source checks and registry validation as maintainer-added records.</p>
      <ModelSuggestionForm />
    </section>
  </main>
}
