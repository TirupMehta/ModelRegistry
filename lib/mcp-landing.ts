/**
 * Landing content for GET /api/mcp. Shown when a human (or a crawler) opens
 * the MCP endpoint URL in a browser, so the link itself documents how to use
 * the server instead of returning an opaque 405. Agents negotiating for
 * text/markdown receive the Markdown variant.
 */

import { SITE_URL } from "@/lib/site"

export function mcpLandingMarkdown(): string {
  return `# ModelRegistry MCP server

Hosted Model Context Protocol server for the open frontier AI model registry.
No auth, no key, stateless JSON-RPC 2.0 over POST (MCP 2025-06-18 revision),
so any MCP-capable client can register the URL and start querying immediately.

- Endpoint: ${SITE_URL}/api/mcp
- Transport: HTTP POST, stateless (no session store, no SSE stream)
- Protocol versions accepted: 2025-06-18, 2025-03-26, 2024-11-05
- CORS: open (Access-Control-Allow-Origin: *)
- Dataset: ${SITE_URL} (66 models across 22 labs, revision 2026.11.05-r8)

## Register it

Claude Code:

\`\`\`bash
claude mcp add --transport http modelregistry ${SITE_URL}/api/mcp
\`\`\`

Cursor, Claude Desktop, Codex, Windsurf (mcp.json / claude_desktop_config.json):

\`\`\`json
{
  "mcpServers": {
    "modelregistry": {
      "url": "${SITE_URL}/api/mcp"
    }
  }
}
\`\`\`

## Tools

| Tool | Purpose |
| --- | --- |
| \`list_models\` | Filtered records (company, category, openWeights, flagshipOnly, latestOnly). Trimmed output. |
| \`get_model\` | One full record: specifications, pricing, modalities, lab-reported benchmarks, per-field source citations, dated changelog. |
| \`list_labs\` | Every tracked laboratory with its record count, flagship, and latest checkpoint. |
| \`get_changes\` | Changelog entries since a date (inclusive), newest first, for incremental sync. |
| \`get_health\` | Dataset version, coverage, oldest source-review date. Data facts only. |
| \`read_page_markdown\` | Any page rendered as Markdown: '/', '/docs', '/about', '/methodology', '/open-source', '/models/{id}', ... |

## Resources

The server exposes the human pages as Markdown resources (uri \`modelregistry://page/{path}\`).
\`resources/list\` returns a curated set; \`resources/templates/list\` exposes the
template so an agent can read any page, including model pages. The same content
is reachable through the \`read_page_markdown\` tool.

## Error contract

Tool outcomes carry the same codes and hints as the REST API: \`model_not_found\`,
\`invalid_params\`, \`route_not_found\`, \`invalid_date\`, \`invalid_limit\`. A
missing record answers inside an \`isError: true\` result with \`code\` + \`hint\`,
never as a JSON-RPC fault. Only malformed requests, unknown tools, and unknown
methods produce JSON-RPC errors (-32700 parse, -32600 invalid request, -32601
method not found, -32602 invalid params, -32603 internal).

## Honesty rules the server follows

- Figures are lab-reported unless a cited source states otherwise; benchmarks are
  never independently reproduced.
- \`lastVerifiedAt\` is the date a source was reviewed, not a live availability
  signal. Dataset revision dates never substitute for field verification.
- There is no "partially verified" badge: sources and the last-checked date are
  shown directly.
- Retired records stay in the dataset for history; provider availability may
  have changed.
- Unverified records can never carry flagship or latest labels.

## Other surfaces

- Human reference: ${SITE_URL}/docs
- OpenAPI 3.1: ${SITE_URL}/openapi.json
- Compact agent guide: ${SITE_URL}/llms.txt
- Exhaustive matrix: ${SITE_URL}/llms-full.txt
- Open source activity: ${SITE_URL}/open-source
- JSON API: ${SITE_URL}/api/v1/models
- Health: ${SITE_URL}/api/check-updates

GET (this URL) returns this document. POST with a JSON-RPC 2.0 body to call
tools. Notifications (no id) answer 202; GET/DELETE answer 405.
`
}

export function mcpLandingHtml(): string {
  const md = mcpLandingMarkdown()
  // Minimal safe rendering: escape, wrap in a styled shell. Links stay clickable.
  const escaped = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>ModelRegistry MCP server</title>
<meta name="description" content="Hosted Model Context Protocol server for the open frontier AI model registry: no auth, stateless JSON-RPC 2.0, 6 tools." />
<style>
  body { font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; max-width: 50.6rem; margin: 0 auto; padding: 2rem 1rem 4rem; color: #111; line-height: 1.6; }
  @media (min-width: 768px) { body { padding: 2rem 5.5rem 4rem; } }
  @media (prefers-color-scheme: dark) { body { background: #0a0a0a; color: #e5e5e5; } pre, code { background: #1a1a1a; } a { color: #ff7347; } }
  h1 { font-size: 1.875rem; letter-spacing: -0.02em; margin-bottom: .25rem; }
  h2 { margin-top: 2rem; font-size: 1.25rem; letter-spacing: -0.01em; }
  pre { background: #f4f4f5; padding: 1rem; border-radius: 8px; overflow-x: auto; font-size: .85rem; }
  code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .85em; }
  table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
  th, td { border: 1px solid rgba(0,0,0,.1); padding: .5rem .75rem; text-align: left; font-size: .9rem; }
  @media (prefers-color-scheme: dark) { th, td { border-color: rgba(255,255,255,.1); } }
  a { color: #ff5d2e; }
  .eyebrow { text-transform: uppercase; letter-spacing: .14em; font-size: .7rem; color: #737373; font-weight: 600; }
  .url { font-family: ui-monospace, monospace; font-size: .9rem; color: #ff5d2e; }
</style>
</head>
<body>
<p class="eyebrow">ModelRegistry · MCP server</p>
<h1>ModelRegistry MCP server</h1>
<p>Hosted Model Context Protocol server for the open frontier AI model registry. No auth, no key, stateless JSON-RPC 2.0 over POST (MCP 2025-06-18 revision). Register the URL in any MCP-capable client and start querying immediately.</p>
<p class="url">${SITE_URL}/api/mcp</p>
<pre>${escaped}</pre>
<p>Machine-readable variant: send <code>Accept: text/markdown</code> to this URL.</p>
</body>
</html>`
}
