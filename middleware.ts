import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const userAgent = request.headers.get("user-agent") || ""
  const pathname = request.nextUrl.pathname

  // If user requests root "/" via curl or terminal HTTP client, serve the clean CLI ASCII table
  if (pathname === "/" && userAgent.toLowerCase().includes("curl")) {
    const cliUrl = new URL("/api/v1/cli", request.url)
    return NextResponse.rewrite(cliUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/"],
}
