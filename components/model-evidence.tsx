"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import type { ModelItem } from "@/data/models"
import { loadFullModel } from "@/lib/model-list"
import VerificationSection from "@/components/verification-section"

type State =
  | { status: "loading" }
  | { status: "ready"; model: ModelItem }
  | { status: "unavailable" }

/**
 * Source and field-level evidence for one model, read only when asked for.
 *
 * List pages ship a slim record so visitors do not download 300 KB of
 * provenance they never open. This component loads the full record the moment
 * a model's panel opens. It never leaves the reader guessing: while it loads it
 * says so, and if the data cannot be loaded (offline, blocked chunk) it says
 * that, offers a retry, and links to the full page where the same evidence is
 * rendered on the server.
 */
export default function ModelEvidence({ id }: { id: string }) {
  const [state, setState] = useState<State>({ status: "loading" })

  const load = useCallback(() => {
    let cancelled = false
    setState({ status: "loading" })
    loadFullModel(id)
      .then((model) => {
        if (!cancelled) setState(model ? { status: "ready", model } : { status: "unavailable" })
      })
      .catch(() => {
        if (!cancelled) setState({ status: "unavailable" })
      })
    return () => {
      cancelled = true
    }
  }, [id])

  useEffect(() => load(), [load])

  if (state.status === "ready") return <VerificationSection model={state.model} />

  return (
    <section aria-label="Sources" className="mt-5 rounded-lg border border-black/10 p-4 text-body font-sans text-fg-muted dark:border-white/[0.08]">
      {state.status === "loading" ? (
        <p role="status" aria-live="polite">Loading sources…</p>
      ) : (
        <p role="alert">
          Sources could not be loaded just now.{" "}
          <button type="button" onClick={load} className="cursor-pointer text-accent-ink underline underline-offset-2 hover:no-underline">
            Try again
          </button>{" "}
          or{" "}
          <Link href={`/models/${id}`} className="text-accent-ink underline underline-offset-2 hover:no-underline">
            open the full page
          </Link>
          .
        </p>
      )}
    </section>
  )
}
