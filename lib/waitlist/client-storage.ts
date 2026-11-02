/**
 * Client-only waitlist persistence. Kept out of `validation.ts` because that
 * module is imported by the API route and must stay free of browser APIs.
 *
 * Every access is guarded: private browsing, disabled storage, and SSR all
 * fall back to "nothing remembered" rather than breaking the form.
 */

const JOINED_KEY = "modelregistry:alerts-waitlist:joined"

export function markWaitlistJoined() {
  try {
    localStorage.setItem(JOINED_KEY, String(Date.now()))
  } catch {
    // Storage unavailable - the signup itself already succeeded.
  }
}

export function hasJoinedWaitlist(): boolean {
  try {
    return localStorage.getItem(JOINED_KEY) !== null
  } catch {
    return false
  }
}
