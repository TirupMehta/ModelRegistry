/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Accept, Accept-Version, Content-Length, Content-Type, Date, X-Api-Version" },
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
