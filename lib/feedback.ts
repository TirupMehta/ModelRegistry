"use client"

/**
 * Hand-rolled tactile + click feedback — zero dependencies.
 *
 * Haptics: Web Vibration API with PWM intensity simulation
 * (same principle as web-haptics.lochie.me, reimplemented here so we
 * ship no extra package). Silently no-ops on desktop / iOS Safari.
 *
 * Click sound: WebAudio-synthesized micro-tick (sine blip + filtered
 * noise transient). No audio assets, ~30ms, ultra-quiet — the iOS
 * keyboard-tick school of sound, not a UI "pop".
 */

export type Vibration = {
  duration: number // ms of vibration
  delay?: number // ms of silence BEFORE this vibration
  intensity?: number // 0..1 (simulated via PWM)
}

export type HapticPresetName =
  | "tap"
  | "light"
  | "selection"
  | "success"
  | "error"
  | "nudge"

const PWM_CYCLE = 16 // ms — perceptual intensity slicing window

const PRESETS: Record<HapticPresetName, Vibration[]> = {
  // Single solid pulses at full intensity — unmistakable on any motor.
  // (12–15ms micro-pulses are below perception on many Android motors,
  // which is why section tabs felt dead. Floor is now 20ms.)
  tap: [{ duration: 25, intensity: 1 }],
  light: [{ duration: 20, intensity: 1 }],
  selection: [{ duration: 25, intensity: 1 }],
  success: [
    { duration: 30, intensity: 0.8 },
    { delay: 55, duration: 40, intensity: 0.9 },
  ],
  error: [
    { duration: 35, intensity: 0.85 },
    { delay: 55, duration: 35, intensity: 0.85 },
    { delay: 55, duration: 35, intensity: 0.85 },
  ],
  nudge: [
    { duration: 70, intensity: 0.9 },
    { delay: 85, duration: 40, intensity: 0.4 },
  ],
}

// ---------------------------------------------------------------------------
// Prefs (persisted, SSR-safe)
// ---------------------------------------------------------------------------

const LS_HAPTICS = "mr-haptics"
const LS_CLICK = "mr-click-sound"

function lsGet(key: string, fallback = true): boolean {
  try {
    if (typeof localStorage === "undefined") return fallback
    const v = localStorage.getItem(key)
    return v === null ? fallback : v === "1"
  } catch {
    return fallback
  }
}

function lsSet(key: string, value: boolean) {
  try {
    localStorage.setItem(key, value ? "1" : "0")
  } catch {
    // private mode — ignore
  }
  try {
    window.dispatchEvent(new CustomEvent("mr-feedback-change"))
  } catch {
    // ignore
  }
}

export function isHapticsEnabled() {
  return lsGet(LS_HAPTICS, true)
}
export function setHapticsEnabled(v: boolean) {
  lsSet(LS_HAPTICS, v)
}
export function isClickSoundEnabled() {
  return lsGet(LS_CLICK, true)
}
export function setClickSoundEnabled(v: boolean) {
  lsSet(LS_CLICK, v)
}

function prefersReducedMotion(): boolean {
  try {
    return (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Vibration engine
// ---------------------------------------------------------------------------

export function isHapticsSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    "vibrate" in navigator &&
    typeof navigator.vibrate === "function"
  )
}

/** Slice a vibration into PWM on/off pairs to fake intensity. */
function modulate(duration: number, intensity: number): number[] {
  const d = Math.max(1, Math.round(duration))
  // Short taps: PWM slicing would shave energy into a trimmed trailing
  // pause, making them unfelt on eccentric motors — fire them whole.
  if (d <= 32) return [d]
  const k = Math.min(1, Math.max(0, intensity))
  if (k >= 1) return [d]
  if (k <= 0) return []
  const onTime = Math.max(1, Math.round(PWM_CYCLE * k))
  const offTime = PWM_CYCLE - onTime
  const out: number[] = []
  let remaining = d
  while (remaining >= PWM_CYCLE) {
    out.push(onTime, offTime)
    remaining -= PWM_CYCLE
  }
  if (remaining > 0) {
    out.push(Math.min(remaining, onTime))
    if (remaining > onTime) out.push(remaining - onTime)
  }
  return out
}

/**
 * Flatten Vibration[] into a navigator.vibrate() pattern.
 * Pattern semantics: even indices vibrate, odd indices pause.
 * `modulate()` chunks already alternate vibrate/pause starting with
 * vibrate, so chunk parity maps directly onto pattern slots.
 */
function toVibratePattern(
  vibrations: Vibration[],
  defaultIntensity = 0.6
): number[] {
  const pattern: number[] = []
  // true when the last element is a vibrate slot (next slot is a pause)
  const lastIsVibrate = () => pattern.length % 2 === 1

  const pushVibrate = (ms: number) => {
    const m = Math.round(ms)
    if (m <= 0) return
    if (pattern.length === 0 || lastIsVibrate()) {
      if (pattern.length === 0) pattern.push(m)
      else pattern[pattern.length - 1]! += m // merge contiguous vibration
    } else {
      pattern.push(m)
    }
  }

  const pushPause = (ms: number) => {
    const m = Math.round(ms)
    if (m <= 0) return
    if (pattern.length === 0) {
      pattern.push(0, m) // leading delay: zero-length vibrate + pause
    } else if (lastIsVibrate()) {
      pattern.push(m) // fresh pause slot after vibration
    } else {
      pattern[pattern.length - 1]! += m // merge contiguous pause
    }
  }

  for (const v of vibrations) {
    if ((v.delay ?? 0) > 0) pushPause(v.delay!)
    const chunks = modulate(v.duration, v.intensity ?? defaultIntensity)
    for (let i = 0; i < chunks.length; i++) {
      if (i % 2 === 0) pushVibrate(chunks[i]!)
      else pushPause(chunks[i]!)
    }
  }

  // drop trailing pause (vibration must end with a vibrate slot)
  while (pattern.length > 1 && pattern.length % 2 === 0) pattern.pop()
  return pattern.filter((n) => n >= 0).slice(0, 64)
}

let lastHapticAt = 0
let warnedNoVibrate = false

/**
 * One-shot diagnostics for "why don't I feel anything" debugging.
 * Run in the phone's remote console: `getFeedbackDiagnostics()`.
 * Note: iOS Safari exposes navigator.vibrate but Apple never drives the
 * motor — `motorDriven` will be false there by platform, not by bug.
 */
export function getFeedbackDiagnostics() {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "ssr"
  const isIOS = /iPad|iPhone|iPod/.test(ua)
  return {
    vibrateApiPresent: isHapticsSupported(),
    // iOS has the API but the motor never fires — platform restriction.
    motorDriven: isHapticsSupported() && !isIOS,
    secureContext: typeof window !== "undefined" ? window.isSecureContext : false,
    hapticsEnabled: isHapticsEnabled(),
    clickEnabled: isClickSoundEnabled(),
    reducedMotion: prefersReducedMotion(),
    userAgent: ua,
  }
}

if (typeof window !== "undefined") {
  ;(window as unknown as { getFeedbackDiagnostics?: unknown }).getFeedbackDiagnostics =
    getFeedbackDiagnostics
}

export function triggerHaptic(
  input: HapticPresetName | Vibration[] | number = "tap",
  defaultIntensity = 0.6
): boolean {
  try {
    if (typeof window === "undefined" || !isHapticsSupported()) return false
    if (!isHapticsEnabled()) return false
    if (
      process.env.NODE_ENV !== "production" &&
      !warnedNoVibrate &&
      /iPad|iPhone|iPod/.test(navigator.userAgent)
    ) {
      warnedNoVibrate = true
      console.info(
        "[feedback] iOS detected: navigator.vibrate exists but Safari never drives the motor. Tick sound + press animation are the fallback."
      )
    }
    const now = performance.now()
    if (now - lastHapticAt < 30) return false // throttle bursts
    lastHapticAt = now

    let vibrations: Vibration[]
    if (typeof input === "number") {
      vibrations = [{ duration: Math.min(100, Math.max(1, input)) }]
    } else if (Array.isArray(input)) {
      vibrations = input
    } else {
      vibrations = PRESETS[input] ?? PRESETS.tap
      if (prefersReducedMotion() && (input === "success" || input === "error" || input === "nudge")) {
        vibrations = PRESETS.light // downgrade drama for reduced-motion
      }
    }
    const pattern = toVibratePattern(vibrations, defaultIntensity)
    if (pattern.length === 0) return false
    return navigator.vibrate(pattern)
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Click sound engine (WebAudio synth, no assets)
// ---------------------------------------------------------------------------

let ctx: AudioContext | null = null
let master: GainNode | null = null
let unlocked = false
let lastSoundAt = 0

function ensureCtx(): AudioContext | null {
  try {
    if (typeof window === "undefined") return null
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext
    if (!AC) return null
    if (!ctx) {
      ctx = new AC()
      master = ctx.createGain()
      master.gain.value = 0.55 // global ceiling — stays subtle
      // gentle lowpass so ticks never sound harsh on laptop speakers
      const lp = ctx.createBiquadFilter()
      lp.type = "lowpass"
      lp.frequency.value = 5200
      master.connect(lp)
      lp.connect(ctx.destination)
    }
    if (ctx.state === "suspended") void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

/** Unlock audio on first real user gesture (autoplay policy). */
function unlockOnce() {
  if (unlocked || typeof window === "undefined") return
  unlocked = true
  primeAudio()
  window.removeEventListener("pointerdown", unlockOnce)
  window.removeEventListener("keydown", unlockOnce)
  window.removeEventListener("touchstart", unlockOnce)
}

/** Prime the audio pipeline so the first real tick plays instantly, not
 *  ~500ms late while the context resumes and the audio thread spins up.
 *  Silent 10ms buffer + resume; inaudible, ~1ms of work when warm. */
function primeAudio() {
  const ac = ensureCtx()
  if (!ac || !master) return
  try {
    if (ac.state === "suspended") void ac.resume()
    const len = Math.max(1, Math.floor(ac.sampleRate * 0.01))
    const buf = ac.createBuffer(1, len, ac.sampleRate)
    const src = ac.createBufferSource()
    src.buffer = buf
    const g = ac.createGain()
    g.gain.value = 0.0001
    src.connect(g)
    g.connect(master)
    src.start()
  } catch {
    // ignore
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("pointerdown", unlockOnce, { passive: true })
  window.addEventListener("keydown", unlockOnce)
  window.addEventListener("touchstart", unlockOnce, { passive: true })
  // Every press re-primes: keeps the context running so ticks stay instant
  // even after the OS suspends audio between visits to the page.
  window.addEventListener("pointerdown", primeAudio, { passive: true })
  window.addEventListener("touchstart", primeAudio, { passive: true })
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) primeAudio()
  })
}

type BlipOpts = {
  freq: number
  freqEnd?: number
  dur?: number // seconds
  gain?: number // 0..1 (pre-master)
  type?: OscillatorType
  when?: number // seconds offset from now
}

function blip({ freq, freqEnd, dur = 0.03, gain = 0.05, type = "sine", when = 0 }: BlipOpts) {
  const ac = ensureCtx()
  if (!ac || !master) return
  try {
    const t0 = ac.currentTime + when
    const osc = ac.createOscillator()
    const g = ac.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t0)
    if (freqEnd && freqEnd !== freq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, freqEnd), t0 + dur)
    }
    // snappy exp decay — the whole "non-cringe" secret
    g.gain.setValueAtTime(0.0001, t0)
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t0 + 0.004)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
    osc.connect(g)
    g.connect(master)
    osc.start(t0)
    osc.stop(t0 + dur + 0.02)
  } catch {
    // ignore
  }
}

/** Airy transient layered under the blip — what makes it feel "physical". */
function transient(when = 0, gain = 0.028, dur = 0.012) {
  const ac = ensureCtx()
  if (!ac || !master) return
  try {
    const t0 = ac.currentTime + when
    const len = Math.max(1, Math.floor(ac.sampleRate * dur))
    const buf = ac.createBuffer(1, len, ac.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < len; i++) {
      // decaying noise
      data[i] = (Math.random() * 2 - 1) * (1 - i / len)
    }
    const src = ac.createBufferSource()
    src.buffer = buf
    const hp = ac.createBiquadFilter()
    hp.type = "highpass"
    hp.frequency.value = 3200
    const g = ac.createGain()
    g.gain.setValueAtTime(gain, t0)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
    src.connect(hp)
    hp.connect(g)
    g.connect(master)
    src.start(t0)
  } catch {
    // ignore
  }
}

export type ClickKind = "tap" | "select" | "confirm" | "toggle" | "soft"

export function playClick(kind: ClickKind = "tap"): boolean {
  try {
    if (typeof window === "undefined" || !isClickSoundEnabled()) return false
    const now = performance.now()
    if (now - lastSoundAt < 50) return false
    lastSoundAt = now

    switch (kind) {
      case "tap":
        // iOS keyboard-tick: 2kHz blip + air, 30ms
        blip({ freq: 2100, freqEnd: 1500, dur: 0.03, gain: 0.05 })
        transient(0, 0.024)
        break
      case "select":
        blip({ freq: 1700, freqEnd: 1300, dur: 0.028, gain: 0.045 })
        transient(0, 0.02)
        break
      case "soft":
        blip({ freq: 1400, freqEnd: 1100, dur: 0.03, gain: 0.032 })
        break
      case "toggle":
        blip({ freq: 950, freqEnd: 1400, dur: 0.045, gain: 0.05 })
        transient(0, 0.02)
        break
      case "confirm":
        // copy-success: two soft ascending ticks, never a "ding"
        blip({ freq: 1250, freqEnd: 1250, dur: 0.03, gain: 0.045 })
        transient(0, 0.018)
        blip({ freq: 1750, freqEnd: 1750, dur: 0.035, gain: 0.045, when: 0.055 })
        transient(0.055, 0.018)
        break
    }
    return true
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Combined one-callers — what components actually import
// ---------------------------------------------------------------------------

/** Timestamp of the last explicit feedback call. The global delegated
 *  listener (below) yields to explicit calls so e.g. a copy button keeps
 *  its success double-buzz instead of being downgraded to a plain tap. */
let lastExplicitAt = 0

function noteExplicit() {
  lastExplicitAt = performance.now()
}

/** Standard press: light haptic + micro tick. */
export function tapFeedback() {
  noteExplicit()
  triggerHaptic("tap")
  playClick("tap")
}

/** Segmented control / tab switch. */
export function selectFeedback() {
  noteExplicit()
  triggerHaptic("selection")
  playClick("select")
}

/** Copy / success actions. */
export function successFeedback() {
  noteExplicit()
  triggerHaptic("success")
  playClick("confirm")
}

/** Errors / destructive. */
export function errorFeedback() {
  noteExplicit()
  triggerHaptic("error")
  playClick("toggle")
}

/** Toggles (theme, switches). */
export function toggleFeedback() {
  noteExplicit()
  triggerHaptic("light")
  playClick("toggle")
}

// ---------------------------------------------------------------------------
// Global delegated taps — vibration on MOST buttons without wiring each one
// ---------------------------------------------------------------------------

let globalInit = false

function onDocumentClick(e: MouseEvent) {
  try {
    if (e.defaultPrevented || e.button !== 0) return
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    const target = e.target as Element | null
    const el = target?.closest?.(
      "a[href], button, [role='button'], input[type='checkbox'], input[type='radio'], select, summary"
    ) as (HTMLElement & { disabled?: boolean }) | null
    if (!el) return
    if (el.disabled) return
    if (el.getAttribute("aria-disabled") === "true") return
    if (el.closest("[data-no-feedback]")) return
    // An explicit handler (copy success, tab select, …) already fired in the
    // element's own onClick, which runs before this document-bubble listener.
    if (performance.now() - lastExplicitAt < 150) return
    tapFeedback()
  } catch {
    // never break page clicks
  }
}

/** Idempotent: call once from a client root component. Returns cleanup. */
export function initGlobalFeedback(): () => void {
  if (typeof document === "undefined" || globalInit) return () => {}
  globalInit = true
  document.addEventListener("click", onDocumentClick)
  return () => {
    document.removeEventListener("click", onDocumentClick)
    globalInit = false
  }
}
