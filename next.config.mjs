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

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
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
        // Agent Skills discovery index (v0.2.0): canonical route lives at
        // /api/agent-skills; the well-known URI rewrites to it.
        source: "/.well-known/agent-skills/index.json",
        destination: "/api/agent-skills",
      },
    ]
  },
}

export default nextConfig
