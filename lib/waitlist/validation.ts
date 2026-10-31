/**
 * Pure waitlist validation shared by the form and the API route. No React, no
 * database, no Node built-ins: importing this in a client component is safe,
 * and both sides therefore agree on what a valid submission is.
 */

/** Bumped whenever the consent sentence shown next to the checkbox changes. */
export const WAITLIST_CONSENT_VERSION = "2026-10-31"

export const MAX_EMAIL_LENGTH = 254
const MAX_LOCAL_LENGTH = 64

export type EmailProblem = "empty" | "too_long" | "malformed"

/** Trim and lowercase. Unicode-safe (NFKC first) so lookalike input collapses. */
export function normalizeEmail(raw: string): string {
  return raw.normalize("NFKC").trim().toLowerCase()
}

/**
 * Deliberately pragmatic rather than RFC-5322 complete: the address only has to
 * round-trip through a future mailer, and no regex rejects every invalid
 * address anyway. This rejects the shapes that actually appear in abuse.
 */
export function validateEmail(raw: string): { ok: true; email: string } | { ok: false; problem: EmailProblem } {
  const email = normalizeEmail(raw)

  if (!email) return { ok: false, problem: "empty" }
  if (email.length > MAX_EMAIL_LENGTH) return { ok: false, problem: "too_long" }

  const at = email.lastIndexOf("@")
  if (at < 1 || at === email.length - 1) return { ok: false, problem: "malformed" }

  const local = email.slice(0, at)
  const domain = email.slice(at + 1)

  if (local.length > MAX_LOCAL_LENGTH) return { ok: false, problem: "malformed" }
  if (/[\s\u0000-\u001f\u007f]/.test(email)) return { ok: false, problem: "malformed" }
  if (email.includes("..")) return { ok: false, problem: "malformed" }
  if (local.startsWith(".") || local.endsWith(".")) return { ok: false, problem: "malformed" }

  // Domain needs at least one dot, a plausible TLD, and no empty label.
  if (!/^[a-z0-9.-]+$/.test(domain)) return { ok: false, problem: "malformed" }
  if (!domain.includes(".")) return { ok: false, problem: "malformed" }
  if (domain.split(".").some((label) => label.length === 0 || label.startsWith("-") || label.endsWith("-"))) {
    return { ok: false, problem: "malformed" }
  }
  if (!/\.[a-z]{2,}$/.test(domain)) return { ok: false, problem: "malformed" }

  return { ok: true, email }
}

export type WaitlistSubmitInput = {
  email: string
  consent: boolean
}

export type WaitlistProblem = EmailProblem | "consent_required"

export type ValidationResult =
  | { ok: true; email: string }
  | { ok: false; problem: WaitlistProblem }

/** Form-side validation. The server runs the same checks on raw JSON. */
export function validateWaitlistSubmission(input: WaitlistSubmitInput): ValidationResult {
  if (input.consent !== true) return { ok: false, problem: "consent_required" }
  const email = validateEmail(input.email)
  return email.ok ? { ok: true, email: email.email } : email
}

/** User-facing copy for each failure, kept next to the rules that produce it. */
export function waitlistProblemMessage(problem: WaitlistProblem): string {
  switch (problem) {
    case "empty":
      return "Enter your email address."
    case "too_long":
      return "That email address is too long."
    case "malformed":
      return "Enter a valid email address, for example name@example.com."
    case "consent_required":
      return "Confirm you want the launch email before joining."
  }
}
