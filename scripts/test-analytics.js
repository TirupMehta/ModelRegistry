/**
 * Analytics guards.
 *
 * PostHog is useful only if it stays private and never slows the first paint.
 * These checks keep the implementation honest at the source level:
 *
 *   1. the SDK is deferred and proxied, never bundled into first-load JS;
 *   2. the project is configured aggregate-only (no replay, autocapture,
 *      surveys, ad cookies or cross-site tracking);
 *   3. analytics is inert without a project key;
 *   4. no email address or form text reaches an analytics event;
 *   5. every surface that should describe analytics actually does.
 */
const fs = require("fs")
const path = require("path")

const ROOT = path.resolve(__dirname, "..")
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8")

let failures = 0
function check(name, ok, detail = "") {
  if (ok) console.log(`  ok: '${name}'`)
  else {
    failures++
    console.error(`  ✗ ${name} ${detail}`)
  }
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const rel = `${dir}/${entry.name}`
    if (entry.isDirectory()) walk(rel, out)
    else if (/\.(tsx?|jsx?|mjs)$/.test(entry.name)) out.push(rel)
  }
  return out
}
const sources = [...walk("app"), ...walk("components"), ...walk("lib")]

console.log("First load")
const layout = read("app/layout.tsx")
const provider = read("components/posthog-analytics.tsx")
const analytics = read("lib/analytics.ts")
check("the root layout mounts the PostHog loader", layout.includes('import PostHogAnalytics from "@/components/posthog-analytics"') && layout.includes("<PostHogAnalytics />"))
check("the browser bundle is deferred, not in the route bundle", provider.includes('strategy="lazyOnload"') && provider.includes('src="/ingest/static/array.js"'))
const bundled = sources.filter((file) => /from\s+["']posthog-js["']|require\(["']posthog-js["']\)/.test(read(file)))
check("posthog-js is never imported into the Next.js bundle", bundled.length === 0, bundled.join(", "))
check("the loader renders nothing without a project key", provider.includes("if (!POSTHOG_KEY) return null"))

console.log("Privacy configuration")
for (const [option, value] of [
  ["autocapture", "false"],
  ["disable_session_recording", "true"],
  ["disable_surveys", "true"],
  ["disable_external_dependency_loading", "true"],
  ["advanced_disable_feature_flags", "true"],
  ["respect_dnt", "true"],
  ['persistence', '"localStorage"'],
]) {
  const pattern = new RegExp(`${option}:\\s*${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`)
  check(`analytics config sets ${option}`, pattern.test(analytics))
}
check("GeoIP is disabled on every event", analytics.includes("$geoip_disable = true"))
check("pageviews carry the cleaned route", analytics.includes("properties.route = routeTemplate(pathname)"))
check("pageviews follow client-side navigation", analytics.includes('capture_pageview: "history_change"'))
check("routeTemplate collapses model, lab, comparison and task ids", ["models", "companies", "compare", "best"].every((root) => analytics.includes(`"${root}"`)))
check("heatmaps are explicitly off", analytics.includes("enable_heatmaps: false"))
check("a saved opt-out survives reloads", analytics.includes("opt_out_capturing_by_default: isAnalyticsOptedOut()"))
check("capture() honours the local opt-out", analytics.includes("isAnalyticsOptedOut()) return"))
check("the privacy page mounts the opt-out switch", read("app/privacy/page.tsx").includes("<AnalyticsOptOut />"))
check("the switch applies the choice to a running client", read("components/analytics-opt-out.tsx").includes("setAnalyticsOptOut"))

console.log("Proxy and middleware")
const config = read("next.config.mjs")
check("PostHog is proxied at /ingest", config.includes('source: "/ingest/static/:path*"') && config.includes('source: "/ingest/:path*"') && config.includes("/ingest"))
check("trailing-slash redirects are disabled for the proxy", config.includes("skipTrailingSlashRedirect: true"))
const middleware = read("middleware.ts")
check("middleware skips /ingest", middleware.includes("ingest(?:/|$)") && middleware.includes('"/ingest/"'))

console.log("Events and data minimisation")
const waitlist = read("app/api/alerts/waitlist/route.ts")
check("waitlist success is counted after the response", waitlist.includes("after(() => captureServerEvent") && waitlist.includes('"waitlist_signup"'))
check("the waitlist event carries no email address", !/captureServerEvent\([\s\S]{0,200}?(validation\.email|record\.email)/.test(waitlist))
const suggestion = read("components/model-suggestion-form.tsx")
check("the suggestion event records shape, not text", suggestion.includes('capture("model_suggestion_prepared"') && suggestion.includes("has_date") && suggestion.includes("has_summary"))
check("model pages report a view", read("app/models/[id]/page.tsx").includes('event="model_viewed"'))
check("comparison pages report a view", read("app/compare/[slug]/page.tsx").includes('event="compare_viewed"'))
check("best-by-task pages report a view", read("app/best/[task]/page.tsx").includes('event="best_viewed"'))
check("the copy button reports a copy without its text", read("components/copy-button.tsx").includes('capture("content_copied", { label })'))

const propertyLines = sources.flatMap((file) =>
  read(file)
    .split(/\r?\n/)
    .filter((line) => /capture(ServerEvent)?\(/.test(line))
    .map((line) => `${file}: ${line.trim()}`),
)
const leaks = propertyLines.filter((line) => /\b(email|distinctId)\b\s*:/.test(line) && !line.includes("distinctId: `server_"))
check("no analytics call sends an email or a caller-supplied distinct id", leaks.length === 0, leaks.join("; "))

// Every event the code sends must be described on the privacy page. A new event
// that skips the policy is a privacy regression, not just missing documentation.
const EVENT_DESCRIPTIONS = {
  model_viewed: "a model page view",
  compare_viewed: "a comparison view",
  best_viewed: "a best by task page view",
  content_copied: "a copied prompt",
  share_card_downloaded: "a downloaded share card",
  waitlist_signup: "a completed waitlist signup",
  model_suggestion_prepared: "a submitted model suggestion",
}
const sentEvents = [
  ...new Set(
    sources.flatMap((file) => {
      const src = read(file)
      return [
        ...[...src.matchAll(/capture(?:ServerEvent)?\(\s*"([a-z0-9_]+)"/g)].map((m) => m[1]),
        ...[...src.matchAll(/<AnalyticsEvent[^>]*\sevent="([a-z0-9_]+)"/g)].map((m) => m[1]),
      ]
    }),
  ),
]
const undocumentedEvents = sentEvents.filter((event) => !EVENT_DESCRIPTIONS[event])
check(
  "every analytics event has a privacy-page description",
  sentEvents.length >= 6 && undocumentedEvents.length === 0,
  undocumentedEvents.join(", "),
)
const privacyPage = read("app/privacy/page.tsx")
// JSX wraps prose across lines, so compare against whitespace-collapsed text.
const privacyText = privacyPage.replace(/\s+/g, " ")
const unstatedEvents = Object.entries(EVENT_DESCRIPTIONS).filter(
  ([event, phrase]) => sentEvents.includes(event) && !privacyText.includes(phrase),
)
check("the privacy page names every analytics event", unstatedEvents.length === 0, unstatedEvents.map(([event]) => event).join(", "))
check("the Markdown policy lists the share card event", read("lib/markdown.ts").includes("downloaded share card"))

console.log("Documentation")
const env = read(".env.example")
check(".env.example documents the project key and host", env.includes("NEXT_PUBLIC_POSTHOG_KEY") && env.includes("NEXT_PUBLIC_POSTHOG_HOST"))
check("the privacy page names PostHog and the regional host", read("app/privacy/page.tsx").includes("PostHog") && read("app/privacy/page.tsx").includes("EU region"))
check("the Markdown privacy policy matches", read("lib/markdown.ts").includes("**Analytics**: Vercel Analytics and Speed Insights") && read("lib/markdown.ts").includes("PostHog records page views"))
check("the README explains setup", read("README.md").includes("NEXT_PUBLIC_POSTHOG_KEY=phc_") && read("README.md").includes("Discard client IP data"))

if (failures > 0) {
  console.error(`\n❌ Analytics guards failed: ${failures}.`)
  process.exit(1)
}
console.log("\n✔ Analytics stays deferred, private and documented.")
