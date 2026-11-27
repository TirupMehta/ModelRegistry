/** @type {import('next').NextConfig} */

/**
 * Advisory rate budget. Advertised on every /api response so agents can
 * self-throttle instead of discovering the limit through 429s. The edge may
 * throttle a misbehaving client earlier; a 429 carries Retry-After. The same
 * numbers are documented in app/docs/page.tsx and public/openapi.json.
 */
const RATE_LIMIT_HEADERS = [
  { key: "RateLimit", value: '"default";r=600;t=60' },
  { key: "RateLimit-Policy", value: '"default";q=600;w=60' },
  { key: "X-RateLimit-Limit", value: "600" },
  { key: "X-RateLimit-Window", value: "60" },
  { key: "X-RateLimit-Policy", value: "600;w=60" },
]

/**
 * PostHog reverse proxy. Analytics requests go to /ingest on our own origin,
 * which keeps them first-party and working through blockers that target
 * *.posthog.com. The browser bundle is served from PostHog's asset host; events
 * go to the ingestion host. Both default to the US Cloud region and follow
 * NEXT_PUBLIC_POSTHOG_HOST for EU or self-hosted installs.
 */
const posthogHost = (process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com").replace(/\/+$/, "")
const posthogAssetsHost = /^https:\/\/[a-z0-9-]+\.i\.posthog\.com$/.test(posthogHost)
  ? posthogHost.replace(".i.posthog.com", "-assets.i.posthog.com")
  : posthogHost

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // PostHog's proxy endpoints are path-sensitive; a trailing-slash redirect
  // would turn a capture into a GET of the wrong URL.
  skipTrailingSlashRedirect: true,
  // The leaderboard was folded into /best, which answers the same questions by task.
  async redirects() {
    return [{ source: "/leaderboard", destination: "/best", permanent: true }]
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      { source: "/api", headers: RATE_LIMIT_HEADERS },
      { source: "/api/:path*", headers: RATE_LIMIT_HEADERS },
      // Machine files are for agents and feeds, not search results. They stay
      // fully crawlable and linked; noindex only keeps them out of the index so
      // the crawl budget stays on the HTML pages people search for.
      { source: "/llms.txt", headers: [{ key: "X-Robots-Tag", value: "noindex" }] },
      { source: "/llms-full.txt", headers: [{ key: "X-Robots-Tag", value: "noindex" }] },
      { source: "/rss.xml", headers: [{ key: "X-Robots-Tag", value: "noindex" }] },
      { source: "/feed.json", headers: [{ key: "X-Robots-Tag", value: "noindex" }] },
      { source: "/openapi.json", headers: [{ key: "X-Robots-Tag", value: "noindex" }] },
      { source: "/latest", headers: [{ key: "X-Robots-Tag", value: "noindex" }] },
      // Snapshot artifacts are text a verifier downloads and reads, not
      // certificates or PGP blocks. Say so, so curl, browsers and agents do not
      // guess from the extension.
      {
        source: "/verify/manifest.sig",
        headers: [
          { key: "Content-Type", value: "text/plain; charset=utf-8" },
          { key: "Access-Control-Allow-Origin", value: "*" },
        ],
      },
      {
        source: "/.well-known/modelregistry-pubkey.pem",
        headers: [
          { key: "Content-Type", value: "application/x-pem-file" },
          { key: "Access-Control-Allow-Origin", value: "*" },
        ],
      },
      {
        source: "/api/alerts/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "https://modelregistry.tirup.in" },
          { key: "Access-Control-Allow-Methods", value: "POST,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" },
        ],
      },
    ]
  },
  async rewrites() {
    return [
      {
        // PostHog's browser bundle and its lazily loaded dependencies.
        source: "/ingest/static/:path*",
        destination: `${posthogAssetsHost}/static/:path*`,
      },
      {
        // Capture, decide and other ingestion endpoints.
        source: "/ingest/:path*",
        destination: `${posthogHost}/:path*`,
      },
      {
        // Agent Skills discovery index (v0.2.0): canonical route lives at
        // /api/agent-skills; the well-known URI rewrites to it.
        source: "/.well-known/agent-skills/index.json",
        destination: "/api/agent-skills",
      },
    ]
  },
}

export default nextConfig
