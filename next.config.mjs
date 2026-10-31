/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
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
