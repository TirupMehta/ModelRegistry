/**
 * Model Registry MCP server: stateless Streamable HTTP transport.
 *
 * The endpoint speaks JSON-RPC 2.0 over POST (the 2025-06-18 MCP revision,
 * which removed request batching). It is deliberately stateless: no session
 * store, no SSE stream - for cache-friendly clients a plain request/response
 * round trip. GET and DELETE answer 405 with the Allow header, OPTIONS is the
 * CORS preflight - any MCP-capable client on any host can register the URL.
 *
 * Tool logic lives in lib/mcp.ts, reading the same dataset modules as the
 * REST API so both surfaces stay in lockstep.
 */

import {
  PROTOCOL_VERSIONS,
  SERVER_INFO,
  SERVER_INSTRUCTIONS,
  TOOL_LIST,
  callTool,
  RESOURCE_LIST,
  RESOURCE_TEMPLATES,
  readResource,
  PROMPT_LIST,
  getPrompt,
  type JsonRpcRequest,
} from "@/lib/mcp"
import { mcpLandingHtml, mcpLandingMarkdown } from "@/lib/mcp-landing"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const JSON_RPC_ERRORS = {
  PARSE: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL: -32603,
} as const

const responseHeaders = (status: number): HeadersInit => ({
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "content-type, mcp-protocol-version, mcp-session-id, authorization",
  "Access-Control-Expose-Headers": "mcp-protocol-version",
  ...(status === 405 ? { Allow: "POST, OPTIONS" } : {}),
})

function rpcResult(id: JsonRpcRequest["id"], result: Record<string, unknown>): Response {
  return new Response(JSON.stringify({ jsonrpc: "2.0", id, result }), { status: 200, headers: responseHeaders(200) })
}

function rpcError(
  id: JsonRpcRequest["id"],
  code: number,
  message: string,
  data?: unknown
): Response {
  return new Response(
    JSON.stringify({ jsonrpc: "2.0", id, error: { code, message, ...(data === undefined ? {} : { data }) } }),
    { status: 200, headers: responseHeaders(200) }
  )
}

/** CORS preflight - MCP clients may probe from browser-originated setups. */
export function OPTIONS() {
  return new Response(null, { status: 204, headers: responseHeaders(204) })
}

/** The stateless server supports no SSE listening stream. */
export function GET(request: Request) {
  const accept = (request.headers.get("accept") || "").toLowerCase()
  if (accept.includes("text/markdown")) {
    return new Response(mcpLandingMarkdown(), {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        Vary: "Accept",
      },
    })
  }
  return new Response(mcpLandingHtml(), {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      Vary: "Accept",
    },
  })
}

/** No transport sessions exist; DELETE (session shutdown) is a no-op 405. */
export function DELETE() {
  return new Response(
    JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: JSON_RPC_ERRORS.INVALID_REQUEST, message: "DELETE is not supported: this server is stateless." } }),
    { status: 405, headers: responseHeaders(405) }
  )
}

export async function POST(request: Request) {
  let raw: string
  try {
    raw = await request.text()
  } catch {
    return rpcError(null, JSON_RPC_ERRORS.PARSE, "Unreadable request body.")
  }

  let message: unknown
  try {
    message = JSON.parse(raw)
  } catch {
    return rpcError(null, JSON_RPC_ERRORS.PARSE, "Body is not valid JSON.")
  }

  if (Array.isArray(message)) {
    // 2025-06-18 removed batching; narrowhood clients still probe for it.
    return rpcError(
      null,
      JSON_RPC_ERRORS.INVALID_REQUEST,
      "Request batching was removed in the MCP 2025-06-18 revision. Send one request per POST.",
      typeof message[0] === "object" && message[0] !== null ? (message[0] as JsonRpcRequest).method : undefined
    )
  }
  if (message === null || typeof message !== "object") {
    return rpcError(null, JSON_RPC_ERRORS.INVALID_REQUEST, "Body must be a JSON-RPC 2.0 object.")
  }

  const { jsonrpc, id, method, params } = message as JsonRpcRequest
  if (jsonrpc !== "2.0") {
    return rpcError(id ?? null, JSON_RPC_ERRORS.INVALID_REQUEST, 'Missing "jsonrpc": "2.0".')
  }
  if (typeof method !== "string") {
    return rpcError(id ?? null, JSON_RPC_ERRORS.INVALID_REQUEST, "Missing string 'method'.")
  }

  // A message without an id is a notification: accepted, never answered.
  if (id === undefined || id === null) {
    return new Response(null, { status: 202, headers: responseHeaders(202) })
  }

  try {
    switch (method) {
      case "initialize": {
        const requested = typeof params?.protocolVersion === "string" ? params.protocolVersion : null
        const protocolVersion =
          requested && (PROTOCOL_VERSIONS as readonly string[]).includes(requested)
            ? requested
            : PROTOCOL_VERSIONS[0]
        return rpcResult(id, {
          protocolVersion,
          capabilities: { tools: { listChanged: false }, resources: { listChanged: false }, prompts: { listChanged: false } },
          serverInfo: SERVER_INFO,
          instructions: SERVER_INSTRUCTIONS,
        })
      }

      case "notifications/initialized":
        return new Response(null, { status: 202, headers: responseHeaders(202) })

      case "ping":
        return rpcResult(id, {})

      case "tools/list":
        return rpcResult(id, { tools: TOOL_LIST })

      case "tools/call": {
        const name = params?.name
        if (typeof name !== "string") {
          return rpcError(id, JSON_RPC_ERRORS.INVALID_PARAMS, "tools/call requires a string 'name'.")
        }
        if (typeof params?.arguments !== "undefined" && (typeof params.arguments !== "object" || params.arguments === null || Array.isArray(params.arguments))) {
          return rpcError(id, JSON_RPC_ERRORS.INVALID_PARAMS, "'arguments' must be an object.")
        }
        if (!TOOL_LIST.some((tool) => tool.name === name)) {
          return rpcError(
            id,
            JSON_RPC_ERRORS.INVALID_PARAMS,
            `Unknown tool '${name}'.`,
            TOOL_LIST.map((tool) => tool.name)
          )
        }
        const result = await callTool(name, params?.arguments as Record<string, unknown> | undefined)
        // Tool outcomes stream one text block; tool errors are content, not
        // JSON-RPC faults, unless the name/arguments pair is malformed.
        return rpcResult(id, {
          content: [{ type: "text", text: result.text }],
          isError: result.isError,
        })
      }

      case "resources/list":
        return rpcResult(id, { resources: RESOURCE_LIST })

      case "prompts/list":
        return rpcResult(id, { prompts: PROMPT_LIST })

      case "prompts/get": {
        const name = params?.name
        if (typeof name !== "string") {
          return rpcError(id, JSON_RPC_ERRORS.INVALID_PARAMS, "prompts/get requires a string 'name'.")
        }
        const prompt = getPrompt(name, params?.arguments as Record<string, string> | undefined)
        if (!prompt) {
          return rpcError(id, JSON_RPC_ERRORS.INVALID_PARAMS, `Unknown prompt '${name}'.`, PROMPT_LIST.map((p) => p.name))
        }
        return rpcResult(id, prompt)
      }

      case "resources/read": {
        const uri = params?.uri
        if (typeof uri !== "string" || uri.length === 0) {
          return rpcError(id, JSON_RPC_ERRORS.INVALID_PARAMS, "resources/read requires a string 'uri'.")
        }
        const result = await readResource(uri)
        if (!result) {
          return rpcError(id, JSON_RPC_ERRORS.INVALID_PARAMS, `Unknown resource '${uri}'.`, RESOURCE_LIST.map((r) => r.uri))
        }
        return rpcResult(id, result)
      }

      case "resources/templates/list":
        return rpcResult(id, { resourceTemplates: RESOURCE_TEMPLATES })

      // Anything else: a real method miss with the protocol-standard code.
      default:
        return rpcError(id, JSON_RPC_ERRORS.METHOD_NOT_FOUND, `Method '${method}' is not supported.`, {
          supported: ["initialize", "ping", "tools/list", "tools/call", "resources/list", "resources/read", "resources/templates/list", "prompts/list", "prompts/get"],
        })
    }
  } catch (error) {
    return rpcError(id, JSON_RPC_ERRORS.INTERNAL, error instanceof Error ? error.message : "Internal error.")
  }
}
