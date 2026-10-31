"use client"

import { useId, useRef, useState } from "react"
import { Check, Loader2 } from "lucide-react"
import {
  normalizeEmail,
  validateWaitlistSubmission,
  waitlistProblemMessage,
  type WaitlistProblem,
} from "@/lib/waitlist/validation"

type Status = "idle" | "submitting" | "success"

type ServerResponse = {
  ok?: boolean
  error?: string
  message?: string
}


/**
 * The only interactive part of /alerts. Kept as an island so the page itself
 * stays server-rendered, matching the rest of the site.
 *
 * A success state is shown only after the API route confirms the row exists in
 * Postgres; every failure path leaves the form intact with the input preserved.
 */
export default function AlertsWaitlistForm() {
  const emailId = useId()
  const consentId = useId()
  const errorId = useId()
  const inputRef = useRef<HTMLInputElement>(null)

  const [email, setEmail] = useState("")
  const [consent, setConsent] = useState(false)
  const [status, setStatus] = useState<Status>("idle")
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [honeypot, setHoneypot] = useState("")

  const submitting = status === "submitting"

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return

    setFormError(null)

    const local = validateWaitlistSubmission({ email, consent })
    if (!local.ok) {
      setFieldError(waitlistProblemMessage(local.problem))
      if (local.problem !== "consent_required") inputRef.current?.focus()
      return
    }

    setFieldError(null)
    setStatus("submitting")

    try {
      const response = await fetch("/api/alerts/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizeEmail(email),
          consent: true,
          website: honeypot,
        }),
      })

      const data = (await response.json().catch(() => ({}))) as ServerResponse

      if (response.ok && data.ok) {
        setStatus("success")
        return
      }

      setStatus("idle")
      const problem = data.error as WaitlistProblem | undefined
      if (problem === "empty" || problem === "malformed" || problem === "too_long") {
        setFieldError(waitlistProblemMessage(problem))
        inputRef.current?.focus()
        return
      }
      if (problem === "consent_required") {
        setFieldError(waitlistProblemMessage(problem))
        return
      }
      setFormError(
        data.message ??
          (response.status === 429
            ? "Too many attempts. Try again in a few minutes."
            : "Could not join the waitlist just now. Try again shortly.")
      )
    } catch {
      setStatus("idle")
      setFormError("Could not reach the server. Check your connection and try again.")
    }
  }

  if (status === "success") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-2xl border border-emerald-500/30 dark:border-emerald-500/25 bg-emerald-500/[0.06] dark:bg-emerald-500/[0.08] p-5 sm:p-6"
      >
        <div className="flex items-start gap-3">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
            <Check size={15} className="draw-check" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-display font-semibold text-black dark:text-white">You are on the waitlist.</p>
            <p className="mt-1 text-[13px] font-sans leading-6 text-black/65 dark:text-zinc-400">
              We will send one email to that address when Model Alerts opens. Nothing else, and no marketing.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="rounded-2xl border border-black/10 dark:border-white/[0.08] bg-white/[0.7] dark:bg-[#111317] p-4 sm:p-6 shadow-sm">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={emailId} className="text-xs font-sans font-medium text-black/70 dark:text-zinc-300">
          Email address
        </label>
        <input
          ref={inputRef}
          id={emailId}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          spellCheck={false}
          required
          value={email}
          onChange={(event) => {
            setEmail(event.target.value)
            if (fieldError) setFieldError(null)
          }}
          aria-invalid={fieldError ? true : undefined}
          aria-describedby={fieldError ? `${errorId} ${emailId}-hint` : `${emailId}-hint`}
          placeholder="name@example.com"
          disabled={submitting}
          style={{ outline: "none" }}
          className="w-full px-3 py-2.5 text-sm font-sans bg-white dark:bg-[#0d0f13] border border-black/10 dark:border-white/[0.08] rounded-lg shadow-sm focus:outline-none focus:border-[#ff5d2e]/60 focus:ring-2 focus:ring-[#ff5d2e]/15 text-black dark:text-white placeholder:text-black/35 dark:placeholder:text-zinc-500 transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
        />
        <p id={`${emailId}-hint`} className="text-[11px] font-sans text-black/45 dark:text-zinc-500">
          Stored so we can send the launch email. Not shared, not sold.
        </p>
      </div>

      <div className="mt-4 flex items-center gap-2.5">
        <input
          id={consentId}
          name="consent"
          type="checkbox"
          checked={consent}
          onChange={(event) => {
            setConsent(event.target.checked)
            if (fieldError) setFieldError(null)
          }}
          disabled={submitting}
          aria-describedby={`${consentId}-copy`}
          className="w-4 h-4 shrink-0 rounded border border-black/25 dark:border-white/25 accent-[#ff5d2e] cursor-pointer disabled:cursor-not-allowed"
        />
        <label
          id={`${consentId}-copy`}
          htmlFor={consentId}
          className="text-[13px] font-sans leading-5 text-black/70 dark:text-zinc-300 cursor-pointer select-none"
        >
          Email me once when Model Alerts becomes available.
        </label>
      </div>

      <p className="mt-3 text-[11px] font-sans leading-5 text-black/45 dark:text-zinc-500">
        This is a one-time launch announcement, not a subscription. Joining the waitlist does not turn on model
        notifications, and you are not added to any mailing list beyond that single message.
      </p>

      {fieldError && (
        <p id={errorId} role="alert" className="mt-3 text-[11px] font-sans text-red-600 dark:text-red-400">
          {fieldError}
        </p>
      )}
      {formError && (
        <p role="alert" className="mt-3 text-[11px] font-sans text-red-600 dark:text-red-400">
          {formError}
        </p>
      )}

      {/* Honeypot: visually hidden, removed from tab order and assistive tech. */}
      <div className="sr-only" aria-hidden="true">
        <label htmlFor={`${emailId}-website`}>Website</label>
        <input
          id={`${emailId}-website`}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(event) => setHoneypot(event.target.value)}
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-5 inline-flex w-full sm:w-auto items-center justify-center gap-1.5 h-9 px-4 text-xs font-sans font-medium tracking-wide bg-black text-white dark:bg-white dark:text-black hover:bg-[#ff5d2e] dark:hover:bg-[#ff5d2e] dark:hover:text-white border border-black dark:border-white hover:border-[#ff5d2e] rounded-lg shadow-sm hover:shadow-md hover:shadow-[#ff5d2e]/20 active:scale-[0.97] transition-all duration-150 select-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-black dark:disabled:hover:bg-white disabled:active:scale-100"
      >
        {submitting ? (
          <>
            <Loader2 size={13} className="animate-spin" aria-hidden="true" />
            <span>Joining...</span>
          </>
        ) : (
          <span>Join the waitlist</span>
        )}
      </button>
    </form>
  )
}
