import type { Metadata } from "next"
import Header from "@/components/header"
import ModelSuggestionForm from "@/components/model-suggestion-form"

export const metadata: Metadata = {
  title: "Suggest a model - ModelRegistry",
  description: "Suggest a newly released AI model for review by the ModelRegistry maintainers.",
  alternates: { canonical: "https://modelregistry.tirup.in/suggest" },
}

export default function SuggestPage() {
  return <main className="relative min-h-screen">
    <Header />
    <section className="mx-auto w-full max-w-4xl px-4 pb-20 sm:px-6 md:px-20">
      <h1 className="mb-3 text-2xl font-display font-semibold tracking-tight text-black dark:text-white sm:text-3xl">Suggest a model</h1>
      <p className="mb-7 max-w-2xl text-sm leading-6 text-black/65 dark:text-zinc-400">Point us to an official release. Suggestions go through the same source checks and registry validation as maintainer-added records.</p>
      <ModelSuggestionForm />
    </section>
  </main>
}
