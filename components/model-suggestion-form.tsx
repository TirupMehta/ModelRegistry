"use client"

import { useState } from "react"
import { ArrowUpRight, ExternalLink } from "lucide-react"

const inputClass = "w-full rounded-lg border border-[var(--field-edge)] bg-[var(--surface-field)] px-3 py-2.5 text-body text-black dark:text-white placeholder:text-fg-muted dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-accent-ink/20"

export default function ModelSuggestionForm() {
  const [issueUrl, setIssueUrl] = useState("")
  const [error, setError] = useState("")

  function createDraft(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const model = String(form.get("model") || "").trim()
    const lab = String(form.get("lab") || "").trim()
    const date = String(form.get("date") || "").trim()
    const source = String(form.get("source") || "").trim()
    const summary = String(form.get("summary") || "").trim()
    try {
      const parsed = new URL(source)
      if (parsed.protocol !== "https:") throw new Error()
    } catch {
      setError("Enter a valid HTTPS link to an official announcement, paper, model card, or weights page.")
      setIssueUrl("")
      return
    }
    setError("")
    const title = `Model suggestion: ${model}`
    const body = [
      "## Model suggestion", "", `- **Model:** ${model}`, `- **Lab:** ${lab}`,
      `- **Release date:** ${date || "Not sure"}`, `- **Official source:** ${source}`, "",
      "### Why it belongs in the registry", summary || "Please add a short note.", "",
      "### Review checklist", "- [ ] Confirm the source and release date",
      "- [ ] Verify context, output, license, modalities, and pricing",
      "- [ ] Check whether this replaces a flagship or latest checkpoint",
      "- [ ] Add source-backed registry fields and changelog entry", "",
      "Submitted through the ModelRegistry suggestion form. This is a request for review; it does not publish a model.",
    ].join("\n")
    const params = new URLSearchParams({ title, body })
    setIssueUrl(`https://github.com/TirupMehta/ModelRegistry/issues/new?${params.toString()}`)
  }

  return <form onSubmit={createDraft} className="max-w-2xl space-y-4">
    <p className="text-body leading-6 text-fg-muted">Share a candidate and its official source. We’ll prepare a review issue on GitHub; nothing is added to the registry until a maintainer verifies and merges it.</p>
    <label className="grid gap-1.5 text-small font-medium text-fg">Model name<input required name="model" maxLength={120} className={inputClass} placeholder="Model name" onChange={() => setIssueUrl("")} /></label>
    <label className="grid gap-1.5 text-small font-medium text-fg">Lab<input required name="lab" maxLength={100} className={inputClass} placeholder="Laboratory or company" onChange={() => setIssueUrl("")} /></label>
    <label className="grid gap-1.5 text-small font-medium text-fg">Release date, if known<input name="date" type="date" className={inputClass} onChange={() => setIssueUrl("")} /></label>
    <label className="grid gap-1.5 text-small font-medium text-fg">Official source link<input required name="source" type="url" maxLength={500} className={inputClass} placeholder="https://..." onChange={() => setIssueUrl("")} /></label>
    <label className="grid gap-1.5 text-small font-medium text-fg">Why should it be included?<textarea name="summary" rows={3} maxLength={1000} className={`${inputClass} resize-y`} placeholder="Briefly describe what launched and why it fits the registry." onChange={() => setIssueUrl("")} /></label>
    {error && <p role="alert" className="text-body text-red-700 dark:text-red-300">{error}</p>}
    <div className="flex flex-wrap items-center gap-3">
      {!issueUrl ? <button type="submit" className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-black px-4 text-body font-medium text-white transition-colors hover:bg-accent dark:bg-white dark:text-black dark:hover:bg-accent dark:hover:text-white">Prepare GitHub issue <ArrowUpRight size={14} /></button>
        : <a href={issueUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-black px-4 text-body font-medium text-white transition-colors hover:bg-accent dark:bg-white dark:text-black dark:hover:bg-accent dark:hover:text-white">Review and submit on GitHub <ExternalLink size={14} /></a>}
      <span className="text-caption text-fg-muted">GitHub account required to submit. Your text stays in this page until you open the draft.</span>
    </div>
  </form>
}
