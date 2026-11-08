import { SITE_URL } from "@/lib/site"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * MCP discovery document (draft convention). Clients that probe
 * /.well-known/mcp find the endpoint and its metadata without out-of-band
 * configuration. The URL itself (https://modelregistry.tirup.in/api/mcp)
 * remains the canonical registration target.
 */
export async function GET() {
  return Response.json(
    {
      name: "modelregistry",
      title: "ModelRegistry",
      version: "1.0.0",
      description:
        "Open, source-linked registry of frontier AI model specifications: context windows, parameters, pricing, modalities, license, release dates, and lab-reported benchmarks with per-field source citations.",
      endpoint: `${SITE_URL}/api/mcp`,
      transport: "streamable-http",
      protocolVersions: ["2025-06-18", "2025-03-26", "2024-11-05"],
      capabilities: ["tools", "resources", "prompts"],
      authentication: "none",
      tools: [
        "list_models",
        "get_model",
        "list_labs",
        "get_changes",
        "get_health",
        "read_page_markdown",
      ],
      resources: [
        "modelregistry://home",
        "modelregistry://docs",
        "modelregistry://about",
        "modelregistry://methodology",
        "modelregistry://open-source",
        "modelregistry://cli",
        "modelregistry://contact",
        "modelregistry://privacy",
        "modelregistry://llms.txt",
        "modelregistry://page/{+path}",
      ],
      prompts: ["registry_overview", "research_model", "compare_models", "incremental_sync"],
      documentation: `${SITE_URL}/docs#mcp`,
      openapi: `${SITE_URL}/openapi.json`,
      llms: `${SITE_URL}/llms.txt`,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        "Access-Control-Allow-Origin": "*",
      },
    }
  )
}
